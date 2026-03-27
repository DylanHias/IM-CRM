mod oauth;

use oauth::OAuthServer;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
