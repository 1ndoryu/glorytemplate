/*
 * Comando: import-database
 * Importa un archivo SQL en la base de datos WordPress.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;
use crate::services::{database_manager, site_manager};

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: &str,
    sql_file: &Path,
    fix_urls: bool,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;
    validation::validate_file_exists(sql_file)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap();
    let db_password = settings.get_db_password(site_name);

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    /* Subir archivo SQL al servidor y luego al contenedor MariaDB */
    let remote_tmp = format!("/tmp/{}_import.sql", site_name);
    ssh.upload_file(sql_file, &remote_tmp).await?;

    let mariadb_container = docker::find_mariadb_container(&ssh, stack_uuid).await?;

    database_manager::import_database(
        &ssh,
        &mariadb_container,
        sql_file,
        &settings.wordpress.db_user,
        &settings.wordpress.db_user,
        &db_password,
    )
    .await?;

    /* Fix URLs si se solicita */
    if fix_urls {
        let wp_container = docker::find_wordpress_container(&ssh, stack_uuid).await?;
        site_manager::set_wordpress_urls(&ssh, &wp_container, &site.dominio).await?;
        println!("URLs corregidas a {}", site.dominio);
    }

    /* Limpiar archivo temporal */
    let _ = ssh.execute(&format!("rm -f {remote_tmp}")).await;

    println!("Base de datos importada exitosamente en '{site_name}'.");
    Ok(())
}
