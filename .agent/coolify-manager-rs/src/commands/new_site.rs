/*
 * Comando: new-site
 * Crea un nuevo sitio WordPress con tema Glory en Coolify.
 * Flujo: validar → crear stack → esperar ready → instalar tema → activar tema → cache.
 */

use crate::config::Settings;
use crate::domain::{SiteConfig, StackTemplate};
use crate::error::CoolifyError;
use crate::infra::coolify_api::CoolifyApiClient;
use crate::infra::ssh_client::SshClient;
use crate::infra::template_engine;
use crate::infra::validation;
use crate::services::{cache_manager, site_manager, theme_manager};

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    site_name: &str,
    domain: &str,
    glory_branch: &str,
    library_branch: &str,
    template: &str,
    skip_theme: bool,
    skip_cache: bool,
) -> std::result::Result<(), CoolifyError> {
    /* Validaciones */
    validation::validate_site_name(site_name)?;
    validation::validate_domain(domain)?;

    let mut settings = Settings::load(config_path)?;

    /* Verificar que el sitio no existe */
    if settings.sitios.iter().any(|s| s.nombre == site_name) {
        return Err(CoolifyError::Validation(format!(
            "El sitio '{site_name}' ya existe en la configuracion"
        )));
    }

    let stack_template: StackTemplate = match template {
        "kamples" => StackTemplate::Kamples,
        "minecraft" => StackTemplate::Minecraft,
        _ => StackTemplate::Wordpress,
    };

    tracing::info!("Creando sitio '{site_name}' con dominio {domain} (template: {template})");

    /* Paso 1: Generar Docker Compose desde template */
    let db_password = template_engine::generate_password(24);
    let root_password = template_engine::generate_password(24);
    let compose_vars = match stack_template {
        StackTemplate::Wordpress => template_engine::wordpress_vars(domain, &db_password, &root_password),
        StackTemplate::Kamples => {
            let pg_password = template_engine::generate_password(24);
            template_engine::kamples_vars(domain, &db_password, &root_password, &pg_password)
        }
        StackTemplate::Minecraft => template_engine::minecraft_vars(site_name),
    };

    let template_file = config_path
        .parent()
        .unwrap_or(Path::new("."))
        .join("templates")
        .join(format!("{}-stack.yaml", stack_template));

    let compose_yaml = if template_file.exists() {
        template_engine::render_file(&template_file, &compose_vars)?
    } else {
        tracing::warn!("Template {template_file:?} no encontrado, usando compose basico");
        format!("# Stack generado para {site_name}\n# Template no disponible, crear manualmente")
    };

    /* Paso 2: Crear stack en Coolify */
    let api = CoolifyApiClient::new(&settings.coolify)?;
    let stack_result = api
        .create_stack(
            site_name,
            &settings.coolify.server_uuid,
            &settings.coolify.project_uuid,
            &settings.coolify.environment_name,
            &compose_yaml,
        )
        .await?;

    tracing::info!("Stack creado: uuid={}, name={}", stack_result.uuid, stack_result.name);

    /* Paso 3: Guardar sitio en configuracion */
    let site_config = SiteConfig {
        nombre: site_name.to_string(),
        dominio: domain.to_string(),
        stack_uuid: Some(stack_result.uuid.clone()),
        glory_branch: glory_branch.to_string(),
        library_branch: library_branch.to_string(),
        theme_name: settings.glory.default_branch.clone().replace("main", "glorytemplate"),
        skip_react: false,
        template: stack_template.clone(),
    };
    settings.add_site(site_config, config_path)?;

    /* Paso 4: Esperar a que los contenedores esten listos */
    tracing::info!("Esperando a que el stack este listo...");
    tokio::time::sleep(std::time::Duration::from_secs(30)).await;

    /* Paso 5: Conectar SSH e instalar tema */
    if !skip_theme && stack_template == StackTemplate::Wordpress {
        let mut ssh = SshClient::new(
            &settings.vps.ip,
            &settings.vps.user,
            settings.vps.ssh_key.as_deref(),
        );
        ssh.connect().await?;

        let wp_container = crate::infra::docker::find_wordpress_container(&ssh, &stack_result.uuid).await?;

        /* Instalar tema Glory */
        theme_manager::install_glory_theme(
            &ssh,
            &wp_container,
            &settings.glory,
            glory_branch,
            library_branch,
            "glorytemplate",
            false,
        )
        .await?;

        /* Activar tema */
        site_manager::enable_glory_theme(&ssh, &wp_container, "glorytemplate").await?;

        /* Configurar URLs */
        site_manager::set_wordpress_urls(&ssh, &wp_container, domain).await?;

        /* Cache headers */
        if !skip_cache {
            cache_manager::enable_cache_headers(&ssh, &wp_container).await?;
        }
    }

    println!("Sitio '{site_name}' creado exitosamente.");
    println!("  Dominio: {domain}");
    println!("  Stack UUID: {}", stack_result.uuid);
    Ok(())
}
