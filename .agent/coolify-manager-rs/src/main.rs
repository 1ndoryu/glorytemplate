/*
 * Coolify Manager — punto de entrada principal.
 * Detecta si se invoca en modo CLI o MCP segun argumentos.
 */

mod cli;
mod commands;
mod config;
mod domain;
mod error;
mod infra;
mod logging;
mod mcp;
mod services;

use clap::Parser;
use cli::Cli;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    if let Err(e) = logging::init(&cli.log_level, cli.log_dir.as_deref()) {
        eprintln!("Error inicializando logging: {e}");
        std::process::exit(1);
    }

    let result = match cli.mode_is_mcp() {
        true => mcp::server::run().await,
        false => cli::run(cli).await,
    };

    if let Err(e) = result {
        tracing::error!("{e:#}");
        eprintln!("Error: {e:#}");
        std::process::exit(1);
    }
}
