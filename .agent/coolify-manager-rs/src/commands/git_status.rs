/*
 * Comando: git-status
 * Muestra estado de Git en el tema Glory del contenedor remoto.
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
) -> std::result::Result<(), CoolifyError> {
    let settings = Settings::load(config_path)?;
    let site = settings.get_site(site_name)?;
    validation::assert_site_ready(site)?;

    let stack_uuid = site.stack_uuid.as_deref().unwrap();
    let theme_dir = format!("/var/www/html/wp-content/themes/{}", site.theme_name);
    let glory_dir = format!("{theme_dir}/Glory");

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    let wp_container = docker::find_wordpress_container(&ssh, stack_uuid).await?;

    /* Estado del tema */
    println!("=== Tema ({}) ===", site.theme_name);
    let script = format!(
        "cd {theme_dir} && git config --global --add safe.directory {theme_dir} 2>/dev/null; echo 'Branch:' $(git rev-parse --abbrev-ref HEAD) && echo 'Commit:' $(git log -1 --format='%h %s (%cr)') && echo '---' && git status --short",
        theme_dir = theme_dir
    );
    let result = docker::docker_exec(&ssh, &wp_container, &script).await?;
    println!("{}", result.stdout.trim());
    if !result.stderr.is_empty() && !result.stderr.contains("safe.directory") {
        eprintln!("{}", result.stderr.trim());
    }

    /* Estado de la libreria Glory */
    println!("\n=== Libreria Glory ===");
    let script = format!(
        "cd {glory_dir} && git config --global --add safe.directory {glory_dir} 2>/dev/null; echo 'Branch:' $(git rev-parse --abbrev-ref HEAD) && echo 'Commit:' $(git log -1 --format='%h %s (%cr)') && echo '---' && git status --short",
        glory_dir = glory_dir
    );
    let result = docker::docker_exec(&ssh, &wp_container, &script).await?;
    println!("{}", result.stdout.trim());

    Ok(())
}
