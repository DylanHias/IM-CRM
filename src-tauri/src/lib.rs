mod oauth;

use oauth::OAuthServer;
use std::sync::Mutex;
use tauri::State;

struct OAuthState(Mutex<Option<OAuthServer>>);

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
