/*
 * ThemeManager — instalacion y actualizacion del tema Glory.
 * Equivale a WordPress/ThemeManager.psm1.
 */

use crate::config::GloryConfig;
use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;

/// Instala el tema Glory completo dentro del contenedor WordPress.
pub async fn install_glory_theme(
    ssh: &SshClient,
    container_id: &str,
    glory_config: &GloryConfig,
    glory_branch: &str,
    library_branch: &str,
    theme_name: &str,
    skip_react: bool,
) -> std::result::Result<(), CoolifyError> {
    tracing::info!("Instalando tema Glory (branch: {glory_branch}) en contenedor {container_id}");

    let theme_dir = format!("/var/www/html/wp-content/themes/{theme_name}");
    let glory_dir = format!("{theme_dir}/Glory");

    /* Paso 1: Instalar dependencias del sistema */
    let deps_script = r#"apt-get update -qq && apt-get install -y -qq git curl > /dev/null 2>&1
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
fi
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer > /dev/null 2>&1
fi
echo 'Dependencias instaladas'"#;

    let result = docker::docker_exec(ssh, container_id, deps_script).await?;
    if !result.success() {
        tracing::warn!("Algunas dependencias podrian no haberse instalado: {}", result.stderr);
    }

    /* Paso 2: Clonar repositorio del tema */
    let clone_script = format!(
        r#"if [ -d "{theme_dir}/.git" ]; then
    echo 'Tema ya existe, saltando clonacion'
else
    rm -rf {theme_dir}
    git clone --branch {glory_branch} --single-branch {template_repo} {theme_dir}
fi
git config --global --add safe.directory {theme_dir}
cd {theme_dir} && git checkout {glory_branch} && git pull origin {glory_branch}
echo 'Repositorio del tema listo'"#,
        theme_dir = theme_dir,
        glory_branch = glory_branch,
        template_repo = glory_config.template_repo
    );

    let result = docker::docker_exec(ssh, container_id, &clone_script).await?;
    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("Error clonando tema: {}", result.stderr),
        });
    }

    /* Paso 3: Clonar libreria Glory (submodule) */
    let lib_script = format!(
        r#"if [ -d "{glory_dir}/.git" ]; then
    echo 'Libreria Glory ya existe'
else
    rm -rf {glory_dir}
    git clone --branch {library_branch} --single-branch {library_repo} {glory_dir}
fi
git config --global --add safe.directory {glory_dir}
cd {glory_dir} && git checkout {library_branch} && git pull origin {library_branch}
echo 'Libreria Glory lista'"#,
        glory_dir = glory_dir,
        library_branch = library_branch,
        library_repo = glory_config.library_repo
    );

    let result = docker::docker_exec(ssh, container_id, &lib_script).await?;
    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("Error clonando libreria Glory: {}", result.stderr),
        });
    }

    /* Paso 4: Composer install */
    let composer_script = format!(
        "cd {theme_dir} && composer install --no-dev --optimize-autoloader --no-interaction 2>&1",
        theme_dir = theme_dir
    );
    let result = docker::docker_exec(ssh, container_id, &composer_script).await?;
    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("Error en composer install: {}", result.stderr),
        });
    }

    /* Paso 5: npm install + build (si no skip_react) */
    if !skip_react {
        let npm_script = format!(
            "cd {theme_dir} && npm install --no-audit --no-fund 2>&1 && npm run build 2>&1",
            theme_dir = theme_dir
        );
        let result = docker::docker_exec(ssh, container_id, &npm_script).await?;
        if !result.success() {
            tracing::warn!("npm build fallo (no critico): {}", result.stderr);
        }
    } else {
        tracing::info!("Saltando build de React (--skip-react)");
    }

    /* Paso 6: Permisos */
    let perms_script = format!(
        "chown -R www-data:www-data {theme_dir}",
        theme_dir = theme_dir
    );
    let _ = docker::docker_exec(ssh, container_id, &perms_script).await;

    tracing::info!("Tema Glory instalado exitosamente en {theme_dir}");
    Ok(())
}

/// Actualiza el tema Glory existente (git pull + rebuild).
pub async fn update_glory_theme(
    ssh: &SshClient,
    container_id: &str,
    glory_config: &GloryConfig,
    glory_branch: &str,
    library_branch: &str,
    theme_name: &str,
    skip_react: bool,
    force: bool,
) -> std::result::Result<(), CoolifyError> {
    tracing::info!("Actualizando tema Glory (branch: {glory_branch}) en contenedor {container_id}");

    let theme_dir = format!("/var/www/html/wp-content/themes/{theme_name}");
    let glory_dir = format!("{theme_dir}/Glory");

    /* Verificar que el tema existe */
    let check = docker::docker_exec(ssh, container_id, &format!("test -d {theme_dir} && echo 'ok'")).await?;
    if check.stdout.trim() != "ok" {
        tracing::warn!("Tema no encontrado en {theme_dir}, ejecutando instalacion completa");
        return install_glory_theme(ssh, container_id, glory_config, glory_branch, library_branch, theme_name, skip_react).await;
    }

    /* Git safe.directory */
    let _ = docker::docker_exec(ssh, container_id, &format!("git config --global --add safe.directory {theme_dir}")).await;
    let _ = docker::docker_exec(ssh, container_id, &format!("git config --global --add safe.directory {glory_dir}")).await;

    /* Auto-heal: verificar que los repos git son validos */
    let git_check = docker::docker_exec(ssh, container_id, &format!("cd {theme_dir} && git status --short 2>&1")).await?;
    if !git_check.success() || git_check.stderr.contains("not a git repository") {
        tracing::warn!("Repo git del tema roto, re-clonando desde cero");
        let _ = docker::docker_exec(ssh, container_id, &format!("rm -rf {theme_dir}")).await;
        return install_glory_theme(ssh, container_id, glory_config, glory_branch, library_branch, theme_name, skip_react).await;
    }

    /* Pull del tema */
    let pull_cmd = if force {
        format!("cd {theme_dir} && git fetch origin && git reset --hard origin/{glory_branch}", theme_dir = theme_dir, glory_branch = glory_branch)
    } else {
        format!("cd {theme_dir} && git pull origin {glory_branch}", theme_dir = theme_dir, glory_branch = glory_branch)
    };
    let result = docker::docker_exec(ssh, container_id, &pull_cmd).await?;
    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: format!("Error en git pull del tema: {}", result.stderr),
        });
    }

    /* Pull de la libreria */
    let lib_pull = if force {
        format!("cd {glory_dir} && git fetch origin && git reset --hard origin/{library_branch}", glory_dir = glory_dir, library_branch = library_branch)
    } else {
        format!("cd {glory_dir} && git pull origin {library_branch}", glory_dir = glory_dir, library_branch = library_branch)
    };
    let result = docker::docker_exec(ssh, container_id, &lib_pull).await?;
    if !result.success() {
        tracing::warn!("Git pull de libreria Glory fallo: {}", result.stderr);
    }

    /* Composer install */
    let result = docker::docker_exec(ssh, container_id, &format!("cd {theme_dir} && composer install --no-dev --optimize-autoloader --no-interaction 2>&1")).await?;
    if !result.success() {
        tracing::warn!("Composer install fallo: {}", result.stderr);
    }

    /* npm build */
    if !skip_react {
        let result = docker::docker_exec(ssh, container_id, &format!("cd {theme_dir} && npm install --no-audit --no-fund 2>&1 && npm run build 2>&1")).await?;
        if !result.success() {
            tracing::warn!("npm build fallo: {}", result.stderr);
        }
    }

    /* Permisos */
    let _ = docker::docker_exec(ssh, container_id, &format!("chown -R www-data:www-data {theme_dir}")).await;

    tracing::info!("Tema Glory actualizado exitosamente");
    Ok(())
}
