/*
 * Comando: view-logs
 * Obtiene logs del contenedor o debug.log de WordPress.
 */

use crate::config::Settings;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;
use crate::infra::validation;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: &str,
    lines: u32,
    target: &str,
    wp_debug: bool,
    filter: Option<&str>,
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap();

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    let container_id = match target {
        "mariadb" => docker::find_mariadb_container(&ssh, stack_uuid).await?,
        _ => docker::find_wordpress_container(&ssh, stack_uuid).await?,
    };

    let output = if wp_debug {
        /* Leer debug.log de WordPress */
        let mut cmd = format!(
            "cat /var/www/html/wp-content/debug.log 2>/dev/null | tail -n {lines}"
        );
        if let Some(pattern) = filter {
            cmd = format!(
                "cat /var/www/html/wp-content/debug.log 2>/dev/null | grep -i '{}' | tail -n {lines}",
                pattern.replace('\'', "'\\''")
            );
        }
        docker::docker_exec(&ssh, &container_id, &cmd).await?
    } else {
        /* Logs del contenedor Docker */
        let cmd = format!("docker logs --tail {lines} {container_id} 2>&1");
        ssh.execute(&cmd).await?
    };

    if output.stdout.is_empty() && output.stderr.is_empty() {
        println!("(sin logs disponibles)");
    } else {
        if !output.stdout.is_empty() {
            print!("{}", output.stdout);
        }
        if !output.stderr.is_empty() {
            eprint!("{}", output.stderr);
        }
    }

    Ok(())
}
