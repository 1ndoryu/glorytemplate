/*
 * Sistema de logging con tracing.
 * Escribe a consola (coloreado) y a archivo (rotacion diaria).
 */

use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use std::path::Path;

pub fn init(level: &str, log_dir: Option<&str>) -> std::result::Result<(), Box<dyn std::error::Error>> {
    let env_filter = EnvFilter::try_new(level).unwrap_or_else(|_| EnvFilter::new("info"));

    let console_layer = fmt::layer()
        .with_target(false)
        .with_thread_ids(false)
        .compact();

    let registry = tracing_subscriber::registry()
        .with(env_filter)
        .with(console_layer);

    if let Some(dir) = log_dir {
        let log_path = Path::new(dir);
        if !log_path.exists() {
            std::fs::create_dir_all(log_path)?;
        }

        let file_appender = tracing_appender::rolling::daily(log_path, "coolify-manager.log");
        let file_layer = fmt::layer()
            .with_writer(file_appender)
            .with_ansi(false)
            .json();

        registry.with(file_layer).init();
    } else {
        registry.init();
    }

    Ok(())
}
