/*
 * DatabaseManager — import/export de bases de datos WordPress.
 * Equivale a WordPress/DatabaseManager.psm1.
 */

use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;

use secrecy::ExposeSecret;
use secrecy::SecretString;
use std::path::Path;

/// Importa un archivo SQL en la base de datos WordPress.
pub async fn import_database(
    ssh: &SshClient,
    mariadb_container: &str,
    sql_file: &Path,
    db_name: &str,
    db_user: &str,
    db_password: &SecretString,
) -> std::result::Result<(), CoolifyError> {
    tracing::info!("Importando base de datos desde {}", sql_file.display());

    /* Copiar archivo SQL al contenedor */
    let remote_path = "/tmp/import.sql";
    docker::copy_to_container(ssh, sql_file, mariadb_container, remote_path).await?;

    /* Ejecutar importacion */
    let cmd = format!(
        "mariadb -u {user} -p'{password}' {db} < {file}",
        user = db_user,
        password = db_password.expose_secret(),
        db = db_name,
        file = remote_path
    );

    let result = docker::docker_exec(ssh, mariadb_container, &cmd).await?;

    /* Limpiar archivo temporal */
    let _ = docker::docker_exec(ssh, mariadb_container, &format!("rm -f {remote_path}")).await;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("Error importando SQL: {}", result.stderr),
        });
    }

    tracing::info!("Base de datos importada exitosamente");
    Ok(())
}

/// Exporta la base de datos WordPress a un archivo SQL local.
pub async fn export_database(
    ssh: &SshClient,
    mariadb_container: &str,
    db_name: &str,
    db_user: &str,
    db_password: &SecretString,
    output_path: &Path,
) -> std::result::Result<(), CoolifyError> {
    tracing::info!("Exportando base de datos a {}", output_path.display());

    let remote_path = "/tmp/export.sql";

    let cmd = format!(
        "mysqldump -u {user} -p'{password}' {db} > {file}",
        user = db_user,
        password = db_password.expose_secret(),
        db = db_name,
        file = remote_path
    );

    let result = docker::docker_exec(ssh, mariadb_container, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("Error exportando SQL: {}", result.stderr),
        });
    }

    /* Descargar archivo del contenedor */
    docker::copy_from_container(ssh, mariadb_container, remote_path, output_path).await?;

    /* Limpiar */
    let _ = docker::docker_exec(ssh, mariadb_container, &format!("rm -f {remote_path}")).await;

    tracing::info!("Base de datos exportada a {}", output_path.display());
    Ok(())
}
