/*
 * Kamples Desktop — Tauri 2.0 backend
 * Registra plugins, comandos custom y tray icon.
 */

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

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

/* Comando: obtener espacio disponible en disco para una ruta dada (bytes) */
#[tauri::command]
fn obtener_espacio_disponible(ruta: String) -> Result<u64, String> {
    fs2::available_space(&ruta)
        .map_err(|e| format!("Error obteniendo espacio disponible en {}: {}", ruta, e))
}

/*
 * Configura el tray icon con menu contextual.
 * Left-click y "Sincronización" abren la ventana sync-panel (popup).
 * "Mostrar Kamples" abre la ventana principal.
 */
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
                    let y = (tamano_pantalla.height as f64 / escala) - alto_ventana - margen - 48.0 + (posicion_monitor.y as f64 / escala);
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
    tauri::Builder::default()
        /* Plugins oficiales de Tauri 2 */
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        /* TO-DO: Habilitar updater cuando se genere pubkey con tauri signer */
        /* .plugin(tauri_plugin_updater::Builder::new().build()) */
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_denylist(&["sync-panel"])
                .build(),
        )
        .plugin(tauri_plugin_drag::init())
        /* Comandos custom */
        .invoke_handler(tauri::generate_handler![
            obtener_version,
            obtener_plataforma,
            archivo_existe,
            obtener_tamano_archivo,
            obtener_espacio_disponible,
        ])
        /* Setup: tray icon */
        .setup(|app| {
            configurar_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error al iniciar Kamples Desktop");
}
