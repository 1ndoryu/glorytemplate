/*
 * CacheManager — gestion de cache headers HTTP en WordPress.
 * Equivale a WordPress/CacheManager.psm1.
 */

use crate::error::CoolifyError;
use crate::infra::docker;
use crate::infra::ssh_client::SshClient;

const CACHE_MARKER: &str = "COOLIFY MANAGER CACHE";

/// Verifica si los cache headers estan configurados.
pub async fn get_cache_status(
    ssh: &SshClient,
    container_id: &str,
) -> std::result::Result<bool, CoolifyError> {
    let cmd = format!(
        "grep -q '{}' /var/www/html/.htaccess 2>/dev/null && echo 'enabled' || echo 'disabled'",
        CACHE_MARKER
    );
    let result = docker::docker_exec(ssh, container_id, &cmd).await?;
    Ok(result.stdout.trim() == "enabled")
}

/// Habilita cache headers en .htaccess.
pub async fn enable_cache_headers(
    ssh: &SshClient,
    container_id: &str,
) -> std::result::Result<(), CoolifyError> {
    /* Verificar si ya estan habilitados */
    if get_cache_status(ssh, container_id).await? {
        tracing::info!("Cache headers ya estan habilitados");
        return Ok(());
    }

    /* Verificar/habilitar modulos de Apache */
    let enable_mods = "a2enmod expires headers 2>/dev/null; true";
    let _ = docker::docker_exec(ssh, container_id, enable_mods).await;

    /* Inyectar reglas de cache */
    let cache_rules = format!(
        r#"

# BEGIN {marker}
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|ico|woff2|woff)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    <FilesMatch "\.(css|js)$">
        Header set Cache-Control "public, max-age=2592000"
    </FilesMatch>
    <FilesMatch "\.(html|php)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
</IfModule>
# END {marker}
"#,
        marker = CACHE_MARKER
    );

    let php_script = format!(
        r#"<?php
$htaccess = '/var/www/html/.htaccess';
$rules = '{rules}';
if (file_exists($htaccess)) {{
    $current = file_get_contents($htaccess);
    /* Backup */
    copy($htaccess, $htaccess . '.bak');
    file_put_contents($htaccess, $current . $rules);
}} else {{
    file_put_contents($htaccess, $rules);
}}
echo 'Cache headers habilitados';
"#,
        rules = cache_rules.replace('\'', "\\'").replace('\n', "\\n")
    );

    let cmd = format!(
        "echo '{}' > /tmp/cache_enable.php && php /tmp/cache_enable.php && rm -f /tmp/cache_enable.php",
        php_script.replace('\'', "'\\''")
    );

    let result = docker::docker_exec(ssh, container_id, &cmd).await?;

    if !result.success() {
        return Err(CoolifyError::Docker {
            exit_code: result.exit_code,
            stderr: result.stderr,
        });
    }

    /* Reiniciar Apache para que los modulos tomen efecto */
    let _ = docker::docker_exec(ssh, container_id, "service apache2 reload 2>/dev/null || true").await;

    tracing::info!("Cache headers habilitados");
    Ok(())
}

/// Deshabilita cache headers en .htaccess.
pub async fn disable_cache_headers(
    ssh: &SshClient,
    container_id: &str,
) -> std::result::Result<(), CoolifyError> {
    let cmd = format!(
        r#"sed -i '/# BEGIN {marker}/,/# END {marker}/d' /var/www/html/.htaccess 2>/dev/null && echo 'ok' || echo 'ok'"#,
        marker = CACHE_MARKER
    );

    docker::docker_exec(ssh, container_id, &cmd).await?;
    tracing::info!("Cache headers deshabilitados");
    Ok(())
}
