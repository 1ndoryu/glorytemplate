/*
 * Kamples Desktop — Tauri 2.0 backend
 * Registra plugins, comandos custom y tray icon.
 */

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
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

/* Comando: abrir carpeta local en el explorador del sistema */
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
#[tauri::command]
fn seleccionar_archivo(ruta: String) -> Result<(), String> {
    let _path = std::path::Path::new(&ruta);

    #[cfg(target_os = "windows")]
    {
        /* /select resalta el archivo sin abrir una nueva ventana si ya hay una */
        let argumento = format!("/select,{}", ruta.replace('/', "\\"));
        std::process::Command::new("explorer")
            .arg(&argumento)
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
 * Comando: mostrar (o crear) la ventana independiente de configuración sync.
 * Se crea dinámicamente la primera vez; las siguientes veces se reutiliza.
 * La ventana es frameless, centrada, con fondo transparente para border-radius CSS.
 */
#[tauri::command]
fn mostrar_ventana_config(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(ventana) = app.get_webview_window("config-sync") {
        let _ = ventana.show();
        let _ = ventana.center();
        let _ = ventana.set_focus();
    } else {
        let ventana = tauri::WebviewWindowBuilder::new(
            &app,
            "config-sync",
            tauri::WebviewUrl::App("config.html".into()),
        )
        .title("Configuración")
        .inner_size(460.0, 500.0)
        .decorations(false)
        .resizable(false)
        .center()
        .transparent(true)
        .always_on_top(false)
        .skip_taskbar(false)
        .shadow(false)
        .build()
        .map_err(|e| format!("Error creando ventana de config: {}", e))?;
        let _ = ventana.set_focus();
    }
    Ok(())
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
                .with_denylist(&["sync-panel", "config-sync"])
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
            abrir_carpeta,
            seleccionar_archivo,
            mostrar_ventana_config,
        ])
        /* Setup: tray icon */
        .setup(|app| {
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
                                /* Solo ocultar si sigue sin foco (evita parpadeo en toggle) */
                                if !v.is_focused().unwrap_or(true) {
                                    let _ = v.hide();
                                }
                            }
                        });
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error al iniciar Kamples Desktop");
}
