/*
 * Comando: export-database
 * Exporta la base de datos WordPress a un archivo SQL local.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;
use crate::services::database_manager;

use chrono::Local;
use std::path::{Path, PathBuf};

pub async fn execute(
    config_path: &Path,
    site_name: &str,
    output_path: Option<&Path>,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap();
    let db_password = settings.get_db_password(site_name);

    /* Generar ruta de salida con timestamp si no se especifica */
    let output = match output_path {
        Some(p) => p.to_path_buf(),
        None => {
            let timestamp = Local::now().format("%Y%m%d_%H%M%S");
            PathBuf::from(format!("{site_name}_{timestamp}.sql"))
        }
    };

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    let mariadb_container = docker::find_mariadb_container(&ssh, stack_uuid).await?;

    database_manager::export_database(
        &ssh,
        &mariadb_container,
        &settings.wordpress.db_user,
        &settings.wordpress.db_user,
        &db_password,
        &output,
    )
    .await?;

    println!("Base de datos exportada a: {}", output.display());
    Ok(())
}
