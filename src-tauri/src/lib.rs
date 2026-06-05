mod oauth;

use oauth::OAuthServer;
use rusqlite::types::Value;
use rust_xlsxwriter::{Format, Workbook, Worksheet};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::sync::Mutex;
use tauri::{Manager, State};

struct OAuthState(Mutex<Option<OAuthServer>>);

#[derive(Serialize)]
pub struct TokenResponse {
    access_token: String,
    id_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
    scope: String,
    token_type: String,
}

#[tauri::command]
fn start_oauth_server(app: tauri::AppHandle, state: State<OAuthState>) -> Result<u16, String> {
    let (server, port) = OAuthServer::start(app)?;
    *state.0.lock().map_err(|e| e.to_string())? = Some(server);
    Ok(port)
}

#[tauri::command]
fn stop_oauth_server(state: State<OAuthState>) -> Result<(), String> {
    if let Some(server) = state.0.lock().map_err(|e| e.to_string())?.take() {
        server.stop();
    }
    Ok(())
}

#[tauri::command]
async fn exchange_oauth_code(
    code: String,
    redirect_uri: String,
    code_verifier: String,
    client_id: String,
    tenant_id: String,
    scopes: String,
) -> Result<TokenResponse, String> {
    let token_url = format!(
        "https://login.microsoftonline.com/{}/oauth2/v2.0/token",
        tenant_id
    );

    let mut params = HashMap::new();
    params.insert("client_id", client_id.as_str());
    params.insert("grant_type", "authorization_code");
    params.insert("code", code.as_str());
    params.insert("redirect_uri", redirect_uri.as_str());
    params.insert("code_verifier", code_verifier.as_str());
    params.insert("scope", scopes.as_str());

    let origin = format!("http://localhost:{}", redirect_uri.rsplit(':').next().unwrap_or("0"));
    let client = reqwest::Client::new();
    let res = client
        .post(&token_url)
        .header("Origin", &origin)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token request failed: {e}"))?;

    if !res.status().is_success() {
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {text}"));
    }

    let body: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {e}"))?;

    Ok(TokenResponse {
        access_token: body["access_token"].as_str().unwrap_or_default().to_string(),
        id_token: body["id_token"].as_str().unwrap_or_default().to_string(),
        refresh_token: body["refresh_token"].as_str().map(|s| s.to_string()),
        expires_in: body["expires_in"].as_u64().unwrap_or(3600),
        scope: body["scope"].as_str().unwrap_or_default().to_string(),
        token_type: body["token_type"].as_str().unwrap_or("Bearer").to_string(),
    })
}

#[tauri::command]
async fn refresh_oauth_token(
    refresh_token: String,
    client_id: String,
    tenant_id: String,
    scopes: String,
) -> Result<TokenResponse, String> {
    let token_url = format!(
        "https://login.microsoftonline.com/{}/oauth2/v2.0/token",
        tenant_id
    );

    let mut params = HashMap::new();
    params.insert("client_id", client_id.as_str());
    params.insert("grant_type", "refresh_token");
    params.insert("refresh_token", refresh_token.as_str());
    params.insert("scope", scopes.as_str());

    let client = reqwest::Client::new();
    let res = client
        .post(&token_url)
        .header("Origin", "http://localhost")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Refresh request failed: {e}"))?;

    if !res.status().is_success() {
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {text}"));
    }

    let body: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {e}"))?;

    Ok(TokenResponse {
        access_token: body["access_token"].as_str().unwrap_or_default().to_string(),
        id_token: body["id_token"].as_str().unwrap_or_default().to_string(),
        refresh_token: body["refresh_token"].as_str().map(|s| s.to_string()),
        expires_in: body["expires_in"].as_u64().unwrap_or(3600),
        scope: body["scope"].as_str().unwrap_or_default().to_string(),
        token_type: body["token_type"].as_str().unwrap_or("Bearer").to_string(),
    })
}

// ─── Ollama process management ───────────────────────────────────────────────

/// Force-kill all ollama.exe processes (including spawned runner children).
/// Ollama spawns runner sub-processes that outlive a tracked sidecar kill, so we
/// terminate the whole tree by image name. Called both from JS (before updates)
/// and from the Rust app-exit handlers below — the latter guarantees the process
/// dies even if the frontend never gets a chance to run, which previously caused
/// the app to hang on close/update.
fn force_kill_ollama() {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/IM", "ollama.exe", "/T"])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output();
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = std::process::Command::new("pkill").arg("-f").arg("ollama").output();
    }
}

#[tauri::command]
fn kill_ollama() {
    force_kill_ollama();
}

// ─── Ollama HTTP proxy ───────────────────────────────────────────────────────
// Routes Ollama requests through Rust/reqwest to avoid Tauri HTTP plugin
// resource management issues (invalid resource ID errors) on Windows.

#[tauri::command]
async fn ollama_request(path: String, body: Option<String>) -> Result<String, String> {
    let url = format!("http://localhost:11434{}", path);
    let client = reqwest::Client::new();

    let res = if let Some(b) = body {
        client
            .post(&url)
            .header("Content-Type", "application/json")
            .body(b)
            .send()
            .await
    } else {
        client.get(&url).send().await
    };

    let res = res.map_err(|e| format!("ollama request failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("ollama returned {}", res.status()));
    }

    res.text().await.map_err(|e| format!("ollama read failed: {e}"))
}

/// Stream an Ollama chat response token-by-token via a Tauri Channel.
/// The channel is passed from JS, so there is no listener-registration race condition.
/// Content tokens stream as `Chunk`; if the model decides to call tools, the raw
/// tool_calls array is forwarded as `ToolCalls` so the frontend can run them and
/// continue the conversation — this is what makes streamed tool-calling possible.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum OllamaChunkEvent {
    Chunk { content: String },
    ToolCalls { calls: serde_json::Value },
    Done,
}

#[tauri::command]
async fn ollama_chat_stream(
    model: String,
    messages: serde_json::Value,
    tools: Option<serde_json::Value>,
    keep_alive: Option<String>,
    options: Option<serde_json::Value>,
    on_chunk: tauri::ipc::Channel<OllamaChunkEvent>,
) -> Result<(), String> {
    let client = reqwest::Client::new();

    let mut payload = serde_json::json!({ "model": model, "messages": messages, "stream": true });
    if let Some(t) = tools {
        if !t.is_null() {
            payload["tools"] = t;
        }
    }
    // Keep the model resident between messages and cap context — both cut latency.
    if let Some(k) = keep_alive {
        payload["keep_alive"] = serde_json::Value::String(k);
    }
    if let Some(o) = options {
        if !o.is_null() {
            payload["options"] = o;
        }
    }

    let mut res = client
        .post("http://localhost:11434/api/chat")
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("ollama chat failed: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("ollama returned {}", res.status()));
    }

    let mut buffer = String::new();

    while let Some(chunk) = res.chunk().await.map_err(|e| format!("ollama read: {e}"))? {
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(nl) = buffer.find('\n') {
            let line = buffer[..nl].trim().to_string();
            buffer.drain(..=nl);

            if line.is_empty() {
                continue;
            }

            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&line) {
                let content = json["message"]["content"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();
                let done = json["done"].as_bool().unwrap_or(false);

                if !content.is_empty() {
                    on_chunk
                        .send(OllamaChunkEvent::Chunk { content })
                        .map_err(|e| format!("channel send failed: {e}"))?;
                }

                let tool_calls = &json["message"]["tool_calls"];
                if tool_calls.as_array().is_some_and(|a| !a.is_empty()) {
                    on_chunk
                        .send(OllamaChunkEvent::ToolCalls { calls: tool_calls.clone() })
                        .map_err(|e| format!("channel send failed: {e}"))?;
                }

                if done {
                    on_chunk
                        .send(OllamaChunkEvent::Done)
                        .map_err(|e| format!("channel send failed: {e}"))?;
                    return Ok(());
                }
            }
        }
    }

    on_chunk
        .send(OllamaChunkEvent::Done)
        .map_err(|e| format!("channel send failed: {e}"))?;

    Ok(())
}

// ─── Excel Export ────────────────────────────────────────────────────────────

/// Write one SQLite value into a worksheet cell.
fn write_cell(
    sheet: &mut Worksheet,
    row: u32,
    col: u16,
    value: Value,
) -> Result<(), rust_xlsxwriter::XlsxError> {
    match value {
        Value::Null => { sheet.write(row, col, "")?; }
        Value::Integer(n) => { sheet.write(row, col, n)?; }
        Value::Real(f) => { sheet.write(row, col, f)?; }
        Value::Text(s) => { sheet.write(row, col, s)?; }
        Value::Blob(_) => { sheet.write(row, col, "[blob]")?; }
    }
    Ok(())
}

/// Query one SQLite table and append it as a sheet to the workbook.
fn write_db_sheet(
    conn: &rusqlite::Connection,
    table: &str,
    workbook: &mut Workbook,
    bold: &Format,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut info = conn.prepare(&format!("PRAGMA table_info(\"{}\")", table))?;
    let columns: Vec<String> = info
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;

    if columns.is_empty() {
        return Ok(());
    }

    let sheet = workbook.add_worksheet();
    sheet.set_name(table)?;

    for (col, name) in columns.iter().enumerate() {
        sheet.write_with_format(0, col as u16, name.as_str(), bold)?;
    }

    let mut stmt = conn.prepare(&format!("SELECT * FROM \"{}\"", table))?;
    let col_count = columns.len();
    let mut rows = stmt.query([])?;
    let mut row_idx: u32 = 1;

    while let Some(row) = rows.next()? {
        for col in 0..col_count {
            let value: Value = row.get(col)?;
            write_cell(sheet, row_idx, col as u16, value)?;
        }
        row_idx += 1;
    }

    Ok(())
}

/// Export all CRM tables to a multi-sheet XLSX file.
/// Runs entirely in Rust — zero JS-heap allocation, no GC pressure on the WebView.
#[tauri::command]
async fn export_db_all(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let db_path: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("crm.db");

    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let conn = rusqlite::Connection::open_with_flags(
            &db_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
        )
        .map_err(|e| e.to_string())?;

        let bold = Format::new().set_bold();
        let mut workbook = Workbook::new();

        for table in &["customers", "contacts", "activities", "follow_ups", "opportunities"] {
            write_db_sheet(&conn, table, &mut workbook, &bold)
                .map_err(|e| e.to_string())?;
        }

        workbook.save(path.as_str()).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Export the revenue overview directly from SQLite for the given customer IDs.
/// The frontend pre-filters and sorts; we just hydrate rows from SQLite in the
/// same order. This keeps filter logic (incl. city normalization) authoritative
/// on the JS side without sending the full customer payload across IPC.
#[derive(Deserialize)]
struct RevenueExportParams {
    path: String,
    ids: Vec<String>,
}

#[tauri::command]
async fn export_revenue_overview(
    app: tauri::AppHandle,
    params: RevenueExportParams,
) -> Result<(), String> {
    let db_path: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("crm.db");

    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let conn = rusqlite::Connection::open_with_flags(
            &db_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
        )
        .map_err(|e| e.to_string())?;

        struct Row {
            name: String,
            contact_name: String,
            phone: String,
            email: String,
            cloud: Option<i64>,
            arr: Option<f64>,
        }

        let mut row_map: std::collections::HashMap<String, Row> =
            std::collections::HashMap::with_capacity(params.ids.len());

        // Chunk by SQLite's default parameter limit (999) with headroom.
        for chunk in params.ids.chunks(500) {
            if chunk.is_empty() {
                continue;
            }
            let placeholders = std::iter::repeat("?")
                .take(chunk.len())
                .collect::<Vec<_>>()
                .join(",");
            // Mirror the UI's effective-ARR resolution (src/lib/revenue/effectiveArr.ts):
            // prefer the Power BI cache (customer_revenue.arr_lc) matched by BCN first,
            // then by reseller account, and only fall back to the D365-synced c.arr.
            let sql = format!(
                "SELECT
                    c.id, c.name, c.phone, c.email, c.cloud_customer,
                    CASE
                      WHEN EXISTS (SELECT 1 FROM customer_revenue WHERE bcn = c.bcn)
                        THEN COALESCE((SELECT arr_lc FROM customer_revenue WHERE bcn = c.bcn), c.arr)
                      WHEN EXISTS (SELECT 1 FROM customer_revenue WHERE reseller_account = c.account_number)
                        THEN COALESCE((SELECT arr_lc FROM customer_revenue WHERE reseller_account = c.account_number LIMIT 1), c.arr)
                      ELSE c.arr
                    END AS eff_arr,
                    con.first_name, con.last_name, con.phone, con.mobile, con.email
                 FROM customers c
                 LEFT JOIN contacts con ON con.id = (
                     SELECT id FROM contacts
                     WHERE customer_id = c.id
                     ORDER BY updated_at DESC
                     LIMIT 1
                 )
                 WHERE c.id IN ({})",
                placeholders
            );
            let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
            let param_refs: Vec<&dyn rusqlite::ToSql> =
                chunk.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
            let mapped = stmt
                .query_map(param_refs.as_slice(), |r| {
                    let id: String = r.get(0)?;
                    let cust_name: String = r.get(1)?;
                    let cust_phone: Option<String> = r.get(2)?;
                    let cust_email: Option<String> = r.get(3)?;
                    let cloud: Option<i64> = r.get(4)?;
                    let arr: Option<f64> = r.get(5)?;
                    let con_first: Option<String> = r.get(6)?;
                    let con_last: Option<String> = r.get(7)?;
                    let con_phone: Option<String> = r.get(8)?;
                    let con_mobile: Option<String> = r.get(9)?;
                    let con_email: Option<String> = r.get(10)?;

                    let contact_name = match (&con_first, &con_last) {
                        (Some(f), Some(l)) => format!("{} {}", f, l),
                        _ => cust_name.clone(),
                    };
                    let phone = con_phone
                        .or(con_mobile)
                        .or(cust_phone)
                        .unwrap_or_else(|| "—".to_string());
                    let email = con_email.or(cust_email).unwrap_or_else(|| "—".to_string());

                    Ok((
                        id,
                        Row {
                            name: cust_name,
                            contact_name,
                            phone,
                            email,
                            cloud,
                            arr,
                        },
                    ))
                })
                .map_err(|e| e.to_string())?;

            for entry in mapped {
                let (id, row) = entry.map_err(|e| e.to_string())?;
                row_map.insert(id, row);
            }
        }

        let bold = Format::new().set_bold();
        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();
        sheet
            .set_name("Revenue Overview")
            .map_err(|e| e.to_string())?;

        let headers = [
            "Customer Name",
            "Contact",
            "Phone",
            "Email",
            "Cloud Customer",
            "ARR",
        ];
        for (col, h) in headers.iter().enumerate() {
            sheet
                .write_with_format(0, col as u16, *h, &bold)
                .map_err(|e| e.to_string())?;
        }

        let mut out_idx: u32 = 0;
        for id in &params.ids {
            let Some(row) = row_map.get(id) else { continue };
            let cloud_str = match row.cloud {
                Some(1) => "Yes",
                Some(0) => "No",
                _ => "",
            };
            let arr_str = row.arr.map(|v| v.to_string()).unwrap_or_default();
            let cells: [&str; 6] = [
                &row.name,
                &row.contact_name,
                &row.phone,
                &row.email,
                cloud_str,
                &arr_str,
            ];
            for (col, val) in cells.iter().enumerate() {
                sheet
                    .write(out_idx + 1, col as u16, *val)
                    .map_err(|e| e.to_string())?;
            }
            out_idx += 1;
        }

        workbook.save(params.path.as_str()).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ─── Revenue cache portable export / import ─────────────────────────────────
// Lets one user export the cached Power BI revenue rows (customer_revenue table
// + last-refresh timestamp) to a JSON file and another user import the same
// file. Useful for sharing live ARR with colleagues who lack Power BI access.

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RevenueCacheRow {
    bcn: String,
    pbi_customer_id: Option<String>,
    reseller_account: Option<String>,
    arr_usd: Option<f64>,
    arr_lc: Option<f64>,
    currency_code: Option<String>,
    as_of_month: Option<String>,
    active_end_customers: Option<i64>,
    refreshed_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArrMovementRow {
    bcn: String,
    month: String,
    upgrade_usd: Option<f64>,
    downgrade_usd: Option<f64>,
    cancellation_usd: Option<f64>,
    new_sale_usd: Option<f64>,
    upgrade_lc: Option<f64>,
    downgrade_lc: Option<f64>,
    cancellation_lc: Option<f64>,
    new_sale_lc: Option<f64>,
    refreshed_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArrTrendRow {
    month: String,
    country_code: String,
    arr_lc: Option<f64>,
    customer_count: Option<i64>,
    refreshed_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResellerSeatsTrendRow {
    month: String,
    country_code: String,
    active_resellers: Option<i64>,
    active_seats: Option<i64>,
    refreshed_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NetSalesByVendorRow {
    month: String,
    country_code: String,
    vendor: String,
    net_sales_lc: Option<f64>,
    refreshed_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RevenueCacheFile {
    kind: String,
    schema_version: u32,
    exported_at: String,
    last_refreshed_at: Option<String>,
    row_count: usize,
    rows: Vec<RevenueCacheRow>,
    // Added in schema_version 2 — older v1 files omit these and serde fills in defaults.
    #[serde(default)]
    arr_movement: Vec<ArrMovementRow>,
    #[serde(default)]
    arr_trend: Vec<ArrTrendRow>,
    #[serde(default)]
    reseller_seats_trend: Vec<ResellerSeatsTrendRow>,
    #[serde(default)]
    net_sales_by_vendor: Vec<NetSalesByVendorRow>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportResult {
    row_count: usize,
    last_refreshed_at: Option<String>,
    exported_at: Option<String>,
}

#[tauri::command]
async fn export_revenue_cache(
    app: tauri::AppHandle,
    path: String,
    exported_at: String,
) -> Result<usize, String> {
    let db_path: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("crm.db");

    tokio::task::spawn_blocking(move || -> Result<usize, String> {
        let conn = rusqlite::Connection::open_with_flags(
            &db_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
        )
        .map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "SELECT bcn, pbi_customer_id, reseller_account, arr_usd, arr_lc,
                        currency_code, as_of_month, active_end_customers, refreshed_at
                 FROM customer_revenue",
            )
            .map_err(|e| e.to_string())?;

        let rows: Vec<RevenueCacheRow> = stmt
            .query_map([], |r| {
                Ok(RevenueCacheRow {
                    bcn: r.get(0)?,
                    pbi_customer_id: r.get(1)?,
                    reseller_account: r.get(2)?,
                    arr_usd: r.get(3)?,
                    arr_lc: r.get(4)?,
                    currency_code: r.get(5)?,
                    as_of_month: r.get(6)?,
                    active_end_customers: r.get(7)?,
                    refreshed_at: r.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        let last_refreshed_at: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'revenue_last_refresh_at'",
                [],
                |r| r.get(0),
            )
            .ok();

        // Insights tables — schema_version 3 stores raw per-country / per-bcn
        // snapshots so the UI can slice by region + monthsBack client-side.
        // An older DB may not have these tables yet (pre-v44), so we fail soft
        // and ship an empty vec rather than aborting the whole export.
        let arr_movement: Vec<ArrMovementRow> = conn
            .prepare(
                "SELECT bcn, month, upgrade_usd, downgrade_usd, cancellation_usd,
                        new_sale_usd, upgrade_lc, downgrade_lc, cancellation_lc, new_sale_lc, refreshed_at
                 FROM arr_movement",
            )
            .and_then(|mut stmt| {
                let mapped: Vec<ArrMovementRow> = stmt
                    .query_map([], |r| {
                        Ok(ArrMovementRow {
                            bcn: r.get(0)?,
                            month: r.get(1)?,
                            upgrade_usd: r.get(2)?,
                            downgrade_usd: r.get(3)?,
                            cancellation_usd: r.get(4)?,
                            new_sale_usd: r.get(5)?,
                            upgrade_lc: r.get(6)?,
                            downgrade_lc: r.get(7)?,
                            cancellation_lc: r.get(8)?,
                            new_sale_lc: r.get(9)?,
                            refreshed_at: r.get(10)?,
                        })
                    })?
                    .filter_map(Result::ok)
                    .collect();
                Ok(mapped)
            })
            .unwrap_or_default();

        let arr_trend: Vec<ArrTrendRow> = conn
            .prepare(
                "SELECT month, country_code, arr_lc, customer_count, refreshed_at
                 FROM arr_trend",
            )
            .and_then(|mut stmt| {
                let mapped: Vec<ArrTrendRow> = stmt
                    .query_map([], |r| {
                        Ok(ArrTrendRow {
                            month: r.get(0)?,
                            country_code: r.get(1)?,
                            arr_lc: r.get(2)?,
                            customer_count: r.get(3)?,
                            refreshed_at: r.get(4)?,
                        })
                    })?
                    .filter_map(Result::ok)
                    .collect();
                Ok(mapped)
            })
            .unwrap_or_default();

        let reseller_seats_trend: Vec<ResellerSeatsTrendRow> = conn
            .prepare(
                "SELECT month, country_code, active_resellers, active_seats, refreshed_at
                 FROM reseller_seats_trend",
            )
            .and_then(|mut stmt| {
                let mapped: Vec<ResellerSeatsTrendRow> = stmt
                    .query_map([], |r| {
                        Ok(ResellerSeatsTrendRow {
                            month: r.get(0)?,
                            country_code: r.get(1)?,
                            active_resellers: r.get(2)?,
                            active_seats: r.get(3)?,
                            refreshed_at: r.get(4)?,
                        })
                    })?
                    .filter_map(Result::ok)
                    .collect();
                Ok(mapped)
            })
            .unwrap_or_default();

        let net_sales_by_vendor: Vec<NetSalesByVendorRow> = conn
            .prepare(
                "SELECT month, country_code, vendor, net_sales_lc, refreshed_at
                 FROM net_sales_by_vendor",
            )
            .and_then(|mut stmt| {
                let mapped: Vec<NetSalesByVendorRow> = stmt
                    .query_map([], |r| {
                        Ok(NetSalesByVendorRow {
                            month: r.get(0)?,
                            country_code: r.get(1)?,
                            vendor: r.get(2)?,
                            net_sales_lc: r.get(3)?,
                            refreshed_at: r.get(4)?,
                        })
                    })?
                    .filter_map(Result::ok)
                    .collect();
                Ok(mapped)
            })
            .unwrap_or_default();

        let count = rows.len();
        let payload = RevenueCacheFile {
            kind: "im-crm-revenue-cache".to_string(),
            schema_version: 3,
            exported_at,
            last_refreshed_at,
            row_count: count,
            rows,
            arr_movement,
            arr_trend,
            reseller_seats_trend,
            net_sales_by_vendor,
        };

        let json = serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())?;
        std::fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(count)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn import_revenue_cache(
    app: tauri::AppHandle,
    path: String,
) -> Result<ImportResult, String> {
    let db_path: PathBuf = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("crm.db");

    tokio::task::spawn_blocking(move || -> Result<ImportResult, String> {
        let raw = std::fs::read_to_string(&path)
            .map_err(|e| format!("Could not read file: {e}"))?;
        let parsed: RevenueCacheFile = serde_json::from_str(&raw)
            .map_err(|e| format!("File is not a valid revenue cache export: {e}"))?;

        if parsed.kind != "im-crm-revenue-cache" {
            return Err(format!(
                "Unexpected file kind '{}' — expected 'im-crm-revenue-cache'",
                parsed.kind
            ));
        }
        // v3 changed insights tables to per-country/per-bcn snapshots; v1/v2 imports
        // would write to columns that no longer exist, so we reject them with a clear
        // message rather than corrupting the DB.
        if parsed.schema_version == 1 || parsed.schema_version == 2 {
            return Err(
                "This export was made by an older app version. Re-export with v2.12.86+ to import insights data."
                    .to_string(),
            );
        }
        if parsed.schema_version != 3 {
            return Err(format!(
                "Unsupported schema version {} — please update the app",
                parsed.schema_version
            ));
        }

        let mut conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM customer_revenue", [])
            .map_err(|e| e.to_string())?;

        {
            let mut stmt = tx
                .prepare(
                    "INSERT OR REPLACE INTO customer_revenue
                     (bcn, pbi_customer_id, reseller_account, arr_usd, arr_lc,
                      currency_code, as_of_month, active_end_customers, refreshed_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                )
                .map_err(|e| e.to_string())?;
            for r in &parsed.rows {
                stmt.execute(rusqlite::params![
                    r.bcn,
                    r.pbi_customer_id,
                    r.reseller_account,
                    r.arr_usd,
                    r.arr_lc,
                    r.currency_code,
                    r.as_of_month,
                    r.active_end_customers,
                    r.refreshed_at,
                ])
                .map_err(|e| e.to_string())?;
            }
        }

        // Insights tables. The tables may not exist on a brand-new DB if migration v46
        // has not run yet — fail soft so the customer_revenue import still completes.
        if !parsed.arr_movement.is_empty() {
            let _ = tx.execute("DELETE FROM arr_movement", []);
            if let Ok(mut stmt) = tx.prepare(
                "INSERT OR REPLACE INTO arr_movement
                 (bcn, month, upgrade_usd, downgrade_usd, cancellation_usd, new_sale_usd,
                  upgrade_lc, downgrade_lc, cancellation_lc, new_sale_lc, refreshed_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            ) {
                for r in &parsed.arr_movement {
                    let _ = stmt.execute(rusqlite::params![
                        r.bcn,
                        r.month,
                        r.upgrade_usd,
                        r.downgrade_usd,
                        r.cancellation_usd,
                        r.new_sale_usd,
                        r.upgrade_lc,
                        r.downgrade_lc,
                        r.cancellation_lc,
                        r.new_sale_lc,
                        r.refreshed_at,
                    ]);
                }
            }
        }

        if !parsed.arr_trend.is_empty() {
            let _ = tx.execute("DELETE FROM arr_trend", []);
            if let Ok(mut stmt) = tx.prepare(
                "INSERT OR REPLACE INTO arr_trend
                 (month, country_code, arr_lc, customer_count, refreshed_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
            ) {
                for r in &parsed.arr_trend {
                    let _ = stmt.execute(rusqlite::params![
                        r.month,
                        r.country_code,
                        r.arr_lc,
                        r.customer_count,
                        r.refreshed_at,
                    ]);
                }
            }
        }

        if !parsed.reseller_seats_trend.is_empty() {
            let _ = tx.execute("DELETE FROM reseller_seats_trend", []);
            if let Ok(mut stmt) = tx.prepare(
                "INSERT OR REPLACE INTO reseller_seats_trend
                 (month, country_code, active_resellers, active_seats, refreshed_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
            ) {
                for r in &parsed.reseller_seats_trend {
                    let _ = stmt.execute(rusqlite::params![
                        r.month,
                        r.country_code,
                        r.active_resellers,
                        r.active_seats,
                        r.refreshed_at,
                    ]);
                }
            }
        }

        if !parsed.net_sales_by_vendor.is_empty() {
            let _ = tx.execute("DELETE FROM net_sales_by_vendor", []);
            if let Ok(mut stmt) = tx.prepare(
                "INSERT OR REPLACE INTO net_sales_by_vendor
                 (month, country_code, vendor, net_sales_lc, refreshed_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
            ) {
                for r in &parsed.net_sales_by_vendor {
                    let _ = stmt.execute(rusqlite::params![
                        r.month,
                        r.country_code,
                        r.vendor,
                        r.net_sales_lc,
                        r.refreshed_at,
                    ]);
                }
            }
        }

        if let Some(ts) = parsed.last_refreshed_at.as_deref() {
            tx.execute(
                "INSERT INTO app_settings (key, value, updated_at)
                 VALUES ('revenue_last_refresh_at', ?1, datetime('now'))
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
                rusqlite::params![ts],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;

        Ok(ImportResult {
            row_count: parsed.rows.len(),
            last_refreshed_at: parsed.last_refreshed_at,
            exported_at: Some(parsed.exported_at),
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Export a pre-built table (headers + rows) to a single-sheet XLSX file.
/// Used by the revenue overview export where data is already filtered in JS.
#[tauri::command]
async fn export_rows(
    path: String,
    sheet_name: String,
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let bold = Format::new().set_bold();
        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();
        sheet.set_name(sheet_name.as_str()).map_err(|e| e.to_string())?;

        for (col, header) in headers.iter().enumerate() {
            sheet
                .write_with_format(0, col as u16, header.as_str(), &bold)
                .map_err(|e| e.to_string())?;
        }

        for (row_idx, row) in rows.iter().enumerate() {
            for (col, value) in row.iter().enumerate() {
                sheet
                    .write(row_idx as u32 + 1, col as u16, value.as_str())
                    .map_err(|e| e.to_string())?;
            }
        }

        workbook.save(path.as_str()).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

// ─────────────────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(OAuthState(Mutex::new(None)))
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            start_oauth_server,
            stop_oauth_server,
            exchange_oauth_code,
            refresh_oauth_token,
            export_db_all,
            export_rows,
            export_revenue_overview,
            export_revenue_cache,
            import_revenue_cache,
            kill_ollama,
            ollama_request,
            ollama_chat_stream,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|_app_handle, event| {
            // Guarantee the Ollama sidecar (and its runner children) are killed
            // on every shutdown path — normal close, OS shutdown, and updater
            // relaunch — without relying on the frontend to fire. This is what
            // previously left the app hanging on exit/update.
            if let tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit = event {
                force_kill_ollama();
            }
        });
}
