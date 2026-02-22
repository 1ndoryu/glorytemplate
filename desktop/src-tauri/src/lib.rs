/*
 * Kamples Desktop — Tauri 2.0 backend
 * Registra plugins, comandos custom y tray icon.
 */

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
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

/*
 * Configura el tray icon con menu contextual.
 * Acciones: mostrar ventana, ocultar, y salir.
 */
fn configurar_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let mostrar = MenuItem::with_id(app, "mostrar", "Mostrar Kamples", true, None::<&str>)?;
    let ocultar = MenuItem::with_id(app, "ocultar", "Minimizar a bandeja", true, None::<&str>)?;
    let salir = MenuItem::with_id(app, "salir", "Salir", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&mostrar, &ocultar, &salir])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Kamples")
        .on_menu_event(|app, event| match event.id.as_ref() {
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
        .build(app)?;

    Ok(())
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
        .plugin(tauri_plugin_window_state::Builder::default().build())
        /* TO-DO: Agregar plugin drag cuando el crate esté disponible */
        /* .plugin(tauri_plugin_drag::init()) */
        /* Comandos custom */
        .invoke_handler(tauri::generate_handler![
            obtener_version,
            obtener_plataforma,
            archivo_existe,
            obtener_tamano_archivo,
        ])
        /* Setup: tray icon */
        .setup(|app| {
            configurar_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error al iniciar Kamples Desktop");
}
