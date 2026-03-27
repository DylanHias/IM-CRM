use std::net::TcpListener;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};
use tiny_http::{Response, Server};
use url::Url;

pub struct OAuthServer {
    shutdown: Arc<Mutex<bool>>,
}

impl OAuthServer {
    pub fn start(app: AppHandle) -> Result<(Self, u16), String> {
        // Find an available port by binding to port 0
        let listener = TcpListener::bind("127.0.0.1:0")
            .map_err(|e| format!("Failed to bind to port: {e}"))?;
        let port = listener
            .local_addr()
            .map_err(|e| format!("Failed to get local addr: {e}"))?
            .port();
        drop(listener);

        let server = Server::http(format!("127.0.0.1:{port}"))
            .map_err(|e| format!("Failed to start OAuth server: {e}"))?;

        let shutdown = Arc::new(Mutex::new(false));
        let shutdown_clone = shutdown.clone();

        thread::spawn(move || {
            for request in server.incoming_requests() {
                // Check shutdown flag
                if *shutdown_clone.lock().unwrap() {
                    let _ = request.respond(Response::from_string("Server shutting down"));
                    break;
                }

                let url_str = format!("http://localhost{}", request.url());
                let result = Url::parse(&url_str)
                    .ok()
                    .and_then(|url| {
                        url.query_pairs()
                            .find(|(key, _)| key == "code")
                            .map(|(_, value)| value.to_string())
                    });

                match result {
                    Some(code) => {
                        let html = r#"<!DOCTYPE html>
<html>
<head><title>Sign-in complete</title></head>
<body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5">
<div style="text-align:center">
<h2>Signed in successfully</h2>
<p>You can close this window and return to the app.</p>
</div>
</body>
</html>"#;
                        let response = Response::from_string(html)
                            .with_header(
                                tiny_http::Header::from_bytes(
                                    &b"Content-Type"[..],
                                    &b"text/html; charset=utf-8"[..],
                                )
                                .unwrap(),
                            );
                        let _ = request.respond(response);
                        let _ = app.emit("oauth-callback", code);
                        break;
                    }
                    None => {
                        // Check for error response from Azure
                        let error = Url::parse(&url_str)
                            .ok()
                            .and_then(|url| {
                                url.query_pairs()
                                    .find(|(key, _)| key == "error_description")
                                    .map(|(_, value)| value.to_string())
                            })
                            .unwrap_or_else(|| "Unknown error".to_string());

                        let html = format!(
                            r#"<!DOCTYPE html>
<html>
<head><title>Sign-in failed</title></head>
<body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5">
<div style="text-align:center">
<h2>Sign-in failed</h2>
<p>{error}</p>
<p>Close this window and try again.</p>
</div>
</body>
</html>"#
                        );
                        let response = Response::from_string(html)
                            .with_header(
                                tiny_http::Header::from_bytes(
                                    &b"Content-Type"[..],
                                    &b"text/html; charset=utf-8"[..],
                                )
                                .unwrap(),
                            );
                        let _ = request.respond(response);
                        let _ = app.emit("oauth-error", error);
                        break;
                    }
                }
            }
        });

        Ok((OAuthServer { shutdown }, port))
    }

    pub fn stop(&self) {
        if let Ok(mut flag) = self.shutdown.lock() {
            *flag = true;
        }
        // Send a dummy request to unblock the server thread
        let _ = std::net::TcpStream::connect("127.0.0.1:1");
    }
}

impl Drop for OAuthServer {
    fn drop(&mut self) {
        self.stop();
    }
}
