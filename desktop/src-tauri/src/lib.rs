/*
 * Kamples Desktop — Tauri 2.0 backend
 * Registra plugins, comandos custom y tray icon.
 */

use std::path::PathBuf;

use tauri::Manager;

#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    WindowEvent,
};

/* Comando: toggle DevTools (inspector de WebView2) — disponible en produccion para diagnostico */
#[cfg(desktop)]
#[tauri::command]
fn toggle_devtools(window: tauri::WebviewWindow) {
    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
}

/*
 * Comando: iniciar flujo OAuth 2.0 Authorization Code + PKCE con Google.
 * Abre el navegador del sistema con la URL de autorización, luego escucha
 * en un puerto local aleatorio para capturar el authorization code del callback.
 * El code_challenge se genera en JavaScript (WebCrypto) y se pasa aquí.
 * La app entonces llama al backend PHP para intercambiar el código por tokens
 * (sin exponer el client_secret en el bundle de la app).
 *
 * Retorna { code, redirect_uri } al llamador en JavaScript.
 */
#[cfg(desktop)]
#[tauri::command]
async fn iniciar_oauth_google(
    app: tauri::AppHandle,
    code_challenge: String,
) -> Result<serde_json::Value, String> {
    use std::io::{BufRead, BufReader, Write};
    use std::net::TcpListener;

    /* [2003A-25] Cliente OAuth 2.0 tipo "Desktop app" (instalado) — permite loopback redirect URIs.
     * Tarea 2003A-17 identificó que el cliente anterior era tipo "Web application" lo que bloqueaba
     * loopbacks en Google desde 2022. Credenciales en temp/ (gitignored), server .env actualizado.
     * El backend PHP usa GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET del .env del servidor para
     * intercambiar el código por tokens (client_secret nunca sale al cliente). */
    const GOOGLE_CLIENT_ID: &str =
        "481587675160-a2iljtc8dou32rgkk8lq9chk0jtfe5fm.apps.googleusercontent.com";

    /* Bind en un puerto aleatorio disponible en loopback */
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Error iniciando servidor OAuth local: {}", e))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("Error obteniendo puerto OAuth: {}", e))?
        .port();

    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);

    /* Percent-encode el redirect_uri para incluirlo en la URL de OAuth */
    let redirect_encoded = percent_encode_url(&redirect_uri);

    /* Construir URL de autorización con PKCE */
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth\
         ?response_type=code\
         &client_id={client_id}\
         &redirect_uri={redirect}\
         &scope=openid%20email%20profile\
         &code_challenge={challenge}\
         &code_challenge_method=S256\
         &access_type=offline\
         &prompt=select_account",
        client_id = GOOGLE_CLIENT_ID,
        redirect = redirect_encoded,
        challenge = code_challenge,
    );

    /* Abrir el navegador del sistema
     * TODO: Migrar a tauri-plugin-opener cuando se actualice Tauri (reemplazo de shell.open) */
    #[allow(deprecated)]
    use tauri_plugin_shell::ShellExt;
    app.shell()
        .open(&auth_url, None)
        .map_err(|e| format!("Error abriendo navegador para OAuth: {}", e))?;

    /* Canal para recibir el código de autorización desde el hilo bloqueante */
    let (tx, rx) = std::sync::mpsc::sync_channel::<Result<String, String>>(1);

    /* Hilo dedicado para aceptar la conexión HTTP del browser */
    std::thread::Builder::new()
        .name("kamples-oauth-callback".to_string())
        .spawn(move || {
            match listener.accept() {
                Ok((stream, _)) => {
                    let mut stream_write = match stream.try_clone() {
                        Ok(s) => s,
                        Err(e) => {
                            let _ = tx.send(Err(format!("Error clonando stream: {}", e)));
                            return;
                        }
                    };
                    let reader = BufReader::new(stream);
                    /* Leer solo la primera línea: "GET /callback?code=XXX HTTP/1.1" */
                    let first_line = reader.lines().next()
                        .and_then(|l| l.ok())
                        .unwrap_or_default();

                    /* Extraer el parámetro "code" de la query string */
                    let code = first_line
                        .split_whitespace()
                        .nth(1)
                        .and_then(|path| path.split('?').nth(1))
                        .and_then(|query| {
                            query.split('&')
                                .find(|p| p.starts_with("code="))
                                .map(|p| p["code=".len()..].to_string())
                        });

                    /* Responder al browser para que el usuario sepa que puede cerrar la ventana */
                    let html = b"<!DOCTYPE html><html><head><meta charset='utf-8'>\
                        <title>Kamples</title></head>\
                        <body style='font-family:system-ui,sans-serif;text-align:center;padding:60px;background:#0f0f0f;color:#fff'>\
                        <h2>Autenticacion completada</h2>\
                        <p>Puedes cerrar esta ventana y volver a Kamples.</p>\
                        <script>setTimeout(()=>window.close(),2000)</script>\
                        </body></html>";
                    let http_response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\
                         Content-Length: {}\r\nConnection: close\r\n\r\n",
                        html.len()
                    );
                    let _ = stream_write.write_all(http_response.as_bytes());
                    let _ = stream_write.write_all(html);

                    match code {
                        Some(c) => { let _ = tx.send(Ok(c)); }
                        None => {
                            let _ = tx.send(Err(
                                "Código OAuth no encontrado en la URL de callback".to_string()
                            ));
                        }
                    }
                }
                Err(e) => {
                    let _ = tx.send(Err(format!("Error esperando callback OAuth: {}", e)));
                }
            }
        })
        .map_err(|e| format!("Error iniciando hilo OAuth: {}", e))?;

    /* Esperar el código con timeout de 5 minutos usando el runtime de Tauri */
    let code = tauri::async_runtime::spawn_blocking(move || {
        rx.recv_timeout(std::time::Duration::from_secs(300))
            .map_err(|_| {
                "Timeout: la autenticación con Google no se completó en 5 minutos".to_string()
            })?
    })
    .await
    .map_err(|e| format!("Error interno en espera OAuth: {}", e))??;

    Ok(serde_json::json!({
        "code": code,
        "redirect_uri": redirect_uri,
    }))
}

/* Percent-encode una URL completa (solo los caracteres especiales) */
#[cfg(desktop)]
fn percent_encode_url(input: &str) -> String {
    let mut encoded = String::with_capacity(input.len() * 3);
    for byte in input.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9'
            | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(byte as char);
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", byte));
            }
        }
    }
    encoded
}

/* Comando: obtener version de la app */
#[tauri::command]
fn obtener_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/* Comando: obtener plataforma */
#[tauri::command]
fn obtener_plataforma() -> String {
    std::env::consts::OS.to_string()
}

/* Comando: verificar si un archivo existe en disco */
#[tauri::command]
fn archivo_existe(ruta: String) -> bool {
    std::path::Path::new(&ruta).exists()
}

/* Comando: obtener tamano de archivo en bytes */
#[tauri::command]
fn obtener_tamano_archivo(ruta: String) -> Result<u64, String> {
    std::fs::metadata(&ruta)
        .map(|m| m.len())
        .map_err(|e| format!("Error al leer metadata de {}: {}", ruta, e))
}

fn agregar_ruta_si_no_duplicada(rutas: &mut Vec<PathBuf>, ruta: PathBuf) {
    if !rutas.iter().any(|existente| existente == &ruta) {
        rutas.push(ruta);
    }
}

fn obtener_rutas_candidatas_android(app: &tauri::AppHandle, archivo: &str) -> Vec<PathBuf> {
    let mut rutas = Vec::new();

    for resolver in [app.path().app_data_dir(), app.path().app_local_data_dir()] {
        let Ok(base) = resolver else {
            continue;
        };

        agregar_ruta_si_no_duplicada(&mut rutas, base.join(archivo));

        if let Some(parent) = base.parent() {
            agregar_ruta_si_no_duplicada(&mut rutas, parent.join(archivo));
            agregar_ruta_si_no_duplicada(&mut rutas, parent.join("files").join(archivo));
            agregar_ruta_si_no_duplicada(&mut rutas, parent.join("no_backup").join(archivo));
        }
    }

    rutas
}

fn leer_archivo_app_data(app: &tauri::AppHandle, archivo: &str, limpiar: bool) -> Result<Option<String>, String> {
    let rutas = obtener_rutas_candidatas_android(app, archivo);

    for ruta in rutas {
        if !ruta.exists() {
            continue;
        }

        let contenido = std::fs::read_to_string(&ruta)
            .map_err(|e| format!("No se pudo leer {}: {}", archivo, e))?;

        println!("[AndroidBridge] {} leido desde {}", archivo, ruta.display());

        if limpiar {
            let _ = std::fs::remove_file(&ruta);
        }

        return Ok(Some(contenido));
    }

    println!("[AndroidBridge] {} no encontrado en rutas candidatas", archivo);
    Ok(None)
}

#[tauri::command]
fn leer_token_fcm_android(app: tauri::AppHandle) -> Result<Option<String>, String> {
    leer_archivo_app_data(&app, "fcm_token.txt", false)
}

#[tauri::command]
fn leer_navegacion_fcm_pendiente(app: tauri::AppHandle) -> Result<Option<String>, String> {
    leer_archivo_app_data(&app, "pending_navigation.json", true)
}

#[tauri::command]
fn leer_deep_link_android_pendiente(app: tauri::AppHandle) -> Result<Option<String>, String> {
    leer_archivo_app_data(&app, "pending_deep_link.txt", true)
}

/* Comando: obtener espacio disponible en disco para una ruta dada (bytes) */
#[cfg(desktop)]
#[tauri::command]
fn obtener_espacio_disponible(ruta: String) -> Result<u64, String> {
    fs2::available_space(&ruta)
        .map_err(|e| format!("Error obteniendo espacio disponible en {}: {}", ruta, e))
}

/* Comando: abrir carpeta local en el explorador del sistema */
#[cfg(desktop)]
#[tauri::command]
fn abrir_carpeta(ruta: String) -> Result<(), String> {
    let path = std::path::Path::new(&ruta);
    if !path.exists() {
        return Err(format!("La ruta no existe: {}", ruta));
    }

    if !path.is_dir() {
        return Err(format!("La ruta no es una carpeta: {}", ruta));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&ruta)
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta {}: {}", ruta, e))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&ruta)
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta {}: {}", ruta, e))?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&ruta)
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta {}: {}", ruta, e))?;
        return Ok(());
    }
}

/* Comando: seleccionar un archivo en el explorador (lo resalta en su carpeta) */
#[cfg(desktop)]
#[tauri::command]
fn seleccionar_archivo(ruta: String) -> Result<(), String> {
    let _path = std::path::Path::new(&ruta);

    #[cfg(target_os = "windows")]
    {
        /*
         * /select resalta el archivo sin abrir una nueva ventana si ya hay una.
         * IMPORTANTE: Se usa raw_arg() en vez de arg() porque arg() agrega comillas
         * automáticas cuando el argumento contiene espacios. Eso rompe el parsing
         * de explorer.exe para /select, haciendo que abra Documents en su lugar.
         */
        use std::os::windows::process::CommandExt;
        let argumento = format!("/select,{}", ruta.replace('/', "\\"));
        std::process::Command::new("explorer")
            .raw_arg(&argumento)
            .spawn()
            .map_err(|e| format!("Error seleccionando archivo {}: {}", ruta, e))?;
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&ruta)
            .spawn()
            .map_err(|e| format!("Error seleccionando archivo {}: {}", ruta, e))?;
        return Ok(());
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        /* Linux: abrir carpeta contenedora como fallback */
        let carpeta = _path.parent().unwrap_or(_path);
        std::process::Command::new("xdg-open")
            .arg(carpeta)
            .spawn()
            .map_err(|e| format!("Error abriendo carpeta {}: {}", ruta, e))?;
        return Ok(());
    }
}

/*
 * Comando: mostrar la ventana de configuración sync.
 * La ventana se pre-crea oculta en tauri.conf.json para evitar
 * deadlock de WebView2 al crearla dinámicamente en Windows.
 * Este comando solo la muestra, centra y enfoca.
 */
#[cfg(desktop)]
#[tauri::command]
fn mostrar_ventana_config(app: tauri::AppHandle) -> Result<(), String> {
    let ventana = app
        .get_webview_window("config-sync")
        .ok_or_else(|| "Ventana config-sync no encontrada".to_string())?;
    let _ = ventana.show();
    let _ = ventana.center();
    let _ = ventana.set_focus();
    Ok(())
}

/* Comando: toggle de ventana de sincronización (sync-panel) */
#[cfg(desktop)]
#[tauri::command]
fn toggle_ventana_sync(app: tauri::AppHandle) -> Result<(), String> {
    mostrar_ventana_sync(&app);
    Ok(())
}

/*
 * Configura el tray icon con menu contextual.
 * Left-click y "Sincronización" abren la ventana sync-panel (popup).
 * "Mostrar Kamples" abre la ventana principal.
 */
#[cfg(desktop)]
fn configurar_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let sincronizacion = MenuItem::with_id(app, "sincronizacion", "Sincronización", true, None::<&str>)?;
    let mostrar = MenuItem::with_id(app, "mostrar", "Mostrar Kamples", true, None::<&str>)?;
    let ocultar = MenuItem::with_id(app, "ocultar", "Minimizar a bandeja", true, None::<&str>)?;
    let salir = MenuItem::with_id(app, "salir", "Salir", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&sincronizacion, &mostrar, &ocultar, &salir])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .expect("No se encontro icono de la app");

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("Kamples")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "sincronizacion" => {
                mostrar_ventana_sync(app);
            }
            "mostrar" => {
                if let Some(ventana) = app.get_webview_window("main") {
                    let _ = ventana.show();
                    let _ = ventana.set_focus();
                }
            }
            "ocultar" => {
                if let Some(ventana) = app.get_webview_window("main") {
                    let _ = ventana.hide();
                }
            }
            "salir" => {
                app.exit(0);
            }
            _ => {}
        })
        /* Left-click en tray: toggle ventana sync-panel */
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                mostrar_ventana_sync(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/*
 * Muestra/oculta la ventana sync-panel.
 * Si ya esta visible, la oculta (toggle).
 * Si no, la posiciona cerca del area de tray y la muestra.
 */
#[cfg(desktop)]
fn mostrar_ventana_sync(app: &tauri::AppHandle) {
    if let Some(ventana) = app.get_webview_window("sync-panel") {
        if ventana.is_visible().unwrap_or(false) {
            let _ = ventana.hide();
        } else {
            /* Posicionar en esquina inferior derecha (zona del tray) */
            if let Ok(monitor) = ventana.current_monitor() {
                if let Some(monitor) = monitor {
                    let tamano_pantalla = monitor.size();
                    let posicion_monitor = monitor.position();
                    let escala = monitor.scale_factor();
                    let ancho_ventana = 380.0;
                    let alto_ventana = 520.0;
                    let margen = 12.0;
                    let x = (tamano_pantalla.width as f64 / escala) - ancho_ventana - margen + (posicion_monitor.x as f64 / escala);
                    let y = (tamano_pantalla.height as f64 / escala) - alto_ventana - 4.0 - 48.0 + (posicion_monitor.y as f64 / escala);
                    let _ = ventana.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
                }
            }
            let _ = ventana.show();
            let _ = ventana.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    /* Plugins compartidos (todos los targets) */
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build());

    /* Plugin mobile-only: deep-link (OAuth Android via kamples://auth) */
    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_deep_link::init());

    /* Plugins desktop-only: updater, window-state, drag */
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_denylist(&["sync-panel", "config-sync"])
                .build(),
        )
        .plugin(tauri_plugin_drag::init());

    /* Comandos: desktop incluye todos, mobile solo los basicos */
    #[cfg(desktop)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        obtener_version,
        obtener_plataforma,
        archivo_existe,
        obtener_tamano_archivo,
        leer_token_fcm_android,
        leer_navegacion_fcm_pendiente,
        leer_deep_link_android_pendiente,
        obtener_espacio_disponible,
        abrir_carpeta,
        seleccionar_archivo,
        mostrar_ventana_config,
        toggle_ventana_sync,
        toggle_devtools,
        iniciar_oauth_google,
    ]);

    #[cfg(not(desktop))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        obtener_version,
        obtener_plataforma,
        archivo_existe,
        obtener_tamano_archivo,
        leer_token_fcm_android,
        leer_navegacion_fcm_pendiente,
        leer_deep_link_android_pendiente,
    ]);

    /* Setup: desktop configura tray + ventana sync behavior */
    #[cfg(desktop)]
    let builder = builder.setup(|app| {
        configurar_tray(app)?;

        /* Cerrar popup sync al perder foco (click fuera).
         * Delay de 220ms para que el toggle del tray icon tenga prioridad:
         * si el usuario hace click en el icono de bandeja, el tray handler
         * oculta la ventana primero; el delayed-hide aqui es no-op porque
         * la ventana ya no esta enfocada (is_focused = false confirma). */
        if let Some(ventana_sync) = app.get_webview_window("sync-panel") {
            let app_handle_sync = app.handle().clone();
            ventana_sync.on_window_event(move |evento| {
                if let WindowEvent::Focused(false) = evento {
                    let handle = app_handle_sync.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(220));
                        if let Some(v) = handle.get_webview_window("sync-panel") {
                            if !v.is_focused().unwrap_or(true) {
                                let _ = v.hide();
                            }
                        }
                    });
                }
            });
        }

        /* QL124: Interceptar cierre de ventana principal — ocultar en lugar de destruir.
         * Asi "Mostrar Kamples" del tray siempre puede reabrir la ventana.
         * Para cerrar de verdad, el usuario usa "Salir" del menu del tray. */
        if let Some(ventana_main) = app.get_webview_window("main") {
            let app_handle_main = app.handle().clone();
            ventana_main.on_window_event(move |evento| {
                if let WindowEvent::CloseRequested { api, .. } = evento {
                    api.prevent_close();
                    if let Some(w) = app_handle_main.get_webview_window("main") {
                        let _ = w.hide();
                    }
                }
            });
        }

        Ok(())
    });

    /*
     * Setup mobile: el plugin deep-link maneja los eventos automaticamente.
     * En JS se usa `onOpenUrl()` de @tauri-apps/plugin-deep-link para escuchar.
     * Solo necesitamos registrar el plugin (ya hecho arriba). El setup queda vacio.
     */
    #[cfg(not(desktop))]
    let builder = builder.setup(|_app| Ok(()));

    builder
        .run(tauri::generate_context!())
        .expect("Error al iniciar Kamples");
}
