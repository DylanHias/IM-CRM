mod oauth;

use oauth::OAuthServer;
use rusqlite::types::Value;
use rust_xlsxwriter::{Format, Workbook, Worksheet};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
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

/// Export the revenue overview directly from SQLite, applying filters in Rust.
/// Accepts only small filter params so no large payload crosses the IPC bridge.
#[derive(Deserialize)]
struct RevenueExportParams {
    path: String,
    search: String,
    filter_cloud: String, // "all" | "yes" | "no"
    filter_country: String,
    arr_min: Option<f64>,
    arr_max: Option<f64>,
    sort_by: String,  // "name" | "cloudCustomer" | "arr"
    sort_dir: String, // "asc" | "desc"
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

        // Build most-recent contact per customer via a subquery
        let mut stmt = conn
            .prepare(
                "SELECT
                    c.id, c.name, c.phone, c.email, c.cloud_customer, c.arr,
                    c.address_country,
                    con.first_name, con.last_name, con.phone, con.mobile, con.email
                 FROM customers c
                 LEFT JOIN contacts con ON con.id = (
                     SELECT id FROM contacts
                     WHERE customer_id = c.id
                     ORDER BY updated_at DESC
                     LIMIT 1
                 )
                 WHERE c.status = 'active'",
            )
            .map_err(|e| e.to_string())?;

        struct Row {
            name: String,
            contact_name: String,
            phone: String,
            email: String,
            cloud: Option<i64>,
            arr: Option<f64>,
            country: Option<String>,
        }

        let search_lower = params.search.to_lowercase();

        let mut rows: Vec<Row> = stmt
            .query_map([], |r| {
                let cust_name: String = r.get(1)?;
                let cust_phone: Option<String> = r.get(2)?;
                let cust_email: Option<String> = r.get(3)?;
                let cloud: Option<i64> = r.get(4)?;
                let arr: Option<f64> = r.get(5)?;
                let country: Option<String> = r.get(6)?;
                let con_first: Option<String> = r.get(7)?;
                let con_last: Option<String> = r.get(8)?;
                let con_phone: Option<String> = r.get(9)?;
                let con_mobile: Option<String> = r.get(10)?;
                let con_email: Option<String> = r.get(11)?;

                let contact_name = match (&con_first, &con_last) {
                    (Some(f), Some(l)) => format!("{} {}", f, l),
                    _ => cust_name.clone(),
                };
                let phone = con_phone
                    .or(con_mobile)
                    .or(cust_phone)
                    .unwrap_or_else(|| "—".to_string());
                let email = con_email.or(cust_email).unwrap_or_else(|| "—".to_string());

                Ok(Row { name: cust_name, contact_name, phone, email, cloud, arr, country })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        // Apply filters
        rows.retain(|r| {
            if !search_lower.is_empty() && !r.name.to_lowercase().contains(&search_lower) {
                return false;
            }
            match params.filter_cloud.as_str() {
                "yes" => {
                    if r.cloud != Some(1) {
                        return false;
                    }
                }
                "no" => {
                    if r.cloud != Some(0) {
                        return false;
                    }
                }
                _ => {}
            }
            if !params.filter_country.is_empty()
                && r.country.as_deref() != Some(params.filter_country.as_str())
            {
                return false;
            }
            if let Some(min) = params.arr_min {
                if r.arr.map_or(true, |v| v < min) {
                    return false;
                }
            }
            if let Some(max) = params.arr_max {
                if r.arr.map_or(true, |v| v > max) {
                    return false;
                }
            }
            true
        });

        // Sort
        let asc = params.sort_dir == "asc";
        rows.sort_by(|a, b| {
            let ord = match params.sort_by.as_str() {
                "name" => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                "cloudCustomer" => a.cloud.cmp(&b.cloud),
                "arr" => a
                    .arr
                    .partial_cmp(&b.arr)
                    .unwrap_or(std::cmp::Ordering::Equal),
                _ => std::cmp::Ordering::Equal,
            };
            if asc { ord } else { ord.reverse() }
        });

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
            "ARR (€)",
        ];
        for (col, h) in headers.iter().enumerate() {
            sheet
                .write_with_format(0, col as u16, *h, &bold)
                .map_err(|e| e.to_string())?;
        }

        for (row_idx, row) in rows.iter().enumerate() {
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
                    .write(row_idx as u32 + 1, col as u16, *val)
                    .map_err(|e| e.to_string())?;
            }
        }

        workbook.save(params.path.as_str()).map_err(|e| e.to_string())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
