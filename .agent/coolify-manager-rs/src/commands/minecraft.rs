/*
 * Comando: minecraft
 * Gestiona servidores Minecraft Java Edition en Coolify.
 */

use crate::config::Settings;
use crate::domain::MinecraftServer;
use crate::error::CoolifyError;
use crate::infra::coolify_api::CoolifyApiClient;
use crate::infra::ssh_client::SshClient;
use crate::infra::template_engine;

use std::path::Path;

pub async fn execute(
    config_path: &Path,
    action: &str,
    server_name: &str,
    memory: &str,
    max_players: u32,
    difficulty: &str,
    version: &str,
    port: u16,
    console_command: Option<&str>,
    lines: u32,
) -> std::result::Result<(), CoolifyError> {
    let valid_actions = ["new", "logs", "console", "restart", "status", "remove"];
    if !valid_actions.contains(&action) {
        return Err(CoolifyError::Validation(format!(
            "Accion invalida '{}'. Usa: {}",
            action,
            valid_actions.join(", ")
        )));
    }

    let mut settings = Settings::load(config_path)?;
    let api = CoolifyApiClient::new(&settings.coolify)?;

    match action {
        "new" => {
            create_minecraft_server(
                &mut settings, config_path, &api, server_name, memory,
                max_players, difficulty, version, port,
            )
            .await
        }
        "logs" => mc_logs(&settings, server_name, lines).await,
        "console" => {
            let cmd = console_command.ok_or_else(|| {
                CoolifyError::Validation("--console-command requerido para accion 'console'".into())
            })?;
            mc_console(&settings, server_name, cmd).await
        }
        "restart" => mc_restart(&settings, &api, server_name).await,
        "status" => mc_status(&settings, &api, server_name).await,
        "remove" => mc_remove(&mut settings, config_path, &api, server_name).await,
        _ => unreachable!(),
    }
}

async fn create_minecraft_server(
    settings: &mut Settings,
    config_path: &Path,
    api: &CoolifyApiClient,
    server_name: &str,
    memory: &str,
    max_players: u32,
    difficulty: &str,
    version: &str,
    port: u16,
) -> std::result::Result<(), CoolifyError> {
    /* Verificar que no existe */
    if settings.minecraft.iter().any(|m| m.server_name == server_name) {
        return Err(CoolifyError::Validation(format!(
            "Servidor Minecraft '{server_name}' ya existe"
        )));
    }

    let difficulty_num: u32 = match difficulty {
        "peaceful" => 0,
        "easy" => 1,
        "normal" => 2,
        "hard" => 3,
        _ => 2,
    };

    tracing::info!("Creando servidor Minecraft '{server_name}' ({memory} RAM, {max_players}p)");

    /* Generar compose desde template */
    let mut compose_vars = template_engine::minecraft_vars(server_name);
    compose_vars.insert("MEMORY".to_string(), memory.to_string());
    compose_vars.insert("MAX_PLAYERS".to_string(), max_players.to_string());
    compose_vars.insert("DIFFICULTY".to_string(), difficulty_num.to_string());
    compose_vars.insert("VERSION".to_string(), version.to_string());
    compose_vars.insert("PORT".to_string(), port.to_string());

    let template_file = config_path
        .parent()
        .unwrap_or(Path::new("."))
        .join("templates")
        .join("minecraft-stack.yaml");

    let compose_yaml = if template_file.exists() {
        template_engine::render_file(&template_file, &compose_vars)?
    } else {
        generate_basic_mc_compose(server_name, memory, max_players, difficulty, version, port)
    };

    let stack_result = api
        .create_stack(
            &format!("mc-{server_name}"),
            &settings.coolify.server_uuid,
            &settings.coolify.project_uuid,
            &settings.coolify.environment_name,
            &compose_yaml,
        )
        .await?;

    /* Guardar en config */
    let mc_server = MinecraftServer {
        server_name: server_name.to_string(),
        stack_uuid: Some(stack_result.uuid.clone()),
        memory: memory.to_string(),
        max_players,
        difficulty: difficulty_num,
    };
    settings.minecraft.push(mc_server);
    settings.save(config_path)?;

    println!("Servidor Minecraft '{server_name}' creado.");
    println!("  UUID: {}", stack_result.uuid);
    println!("  RAM: {memory}, Players: {max_players}");
    Ok(())
}

async fn mc_logs(
    settings: &Settings,
    server_name: &str,
    lines: u32,
) -> std::result::Result<(), CoolifyError> {
    let mc = settings.get_minecraft(server_name)?;
    let stack_uuid = mc.stack_uuid.as_deref().ok_or_else(|| {
        CoolifyError::Validation(format!("Servidor '{server_name}' sin stack UUID"))
    })?;

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    let cmd = format!(
        "docker ps -q --filter 'label=coolify.serviceId={uuid}' | head -1 | xargs -I{{}} docker logs --tail {lines} {{}} 2>&1",
        uuid = stack_uuid,
        lines = lines
    );
    let result = ssh.execute(&cmd).await?;
    print!("{}", result.stdout);
    Ok(())
}

async fn mc_console(
    settings: &Settings,
    server_name: &str,
    command: &str,
) -> std::result::Result<(), CoolifyError> {
    let mc = settings.get_minecraft(server_name)?;
    let stack_uuid = mc.stack_uuid.as_deref().ok_or_else(|| {
        CoolifyError::Validation(format!("Servidor '{server_name}' sin stack UUID"))
    })?;

    let mut ssh = SshClient::new(
        &settings.vps.ip,
        &settings.vps.user,
        settings.vps.ssh_key.as_deref(),
    );
    ssh.connect().await?;

    /* Enviar comando via RCON (usando docker exec mc-send-to-console) */
    let cmd = format!(
        "docker ps -q --filter 'label=coolify.serviceId={uuid}' | head -1 | xargs -I{{}} docker exec {{}} rcon-cli {}",
        command.replace('\'', "'\\''"),
        uuid = stack_uuid
    );
    let result = ssh.execute(&cmd).await?;
    print!("{}", result.stdout);
    if !result.stderr.is_empty() {
        eprint!("{}", result.stderr);
    }
    Ok(())
}

async fn mc_restart(
    settings: &Settings,
    api: &CoolifyApiClient,
    server_name: &str,
) -> std::result::Result<(), CoolifyError> {
    let mc = settings.get_minecraft(server_name)?;
    let uuid = mc.stack_uuid.as_deref().ok_or_else(|| {
        CoolifyError::Validation(format!("Servidor '{server_name}' sin stack UUID"))
    })?;

    api.restart_service(uuid).await?;
    println!("Servidor Minecraft '{server_name}' reiniciado.");
    Ok(())
}

async fn mc_status(
    settings: &Settings,
    api: &CoolifyApiClient,
    server_name: &str,
) -> std::result::Result<(), CoolifyError> {
    let mc = settings.get_minecraft(server_name)?;
    let uuid = mc.stack_uuid.as_deref().ok_or_else(|| {
        CoolifyError::Validation(format!("Servidor '{server_name}' sin stack UUID"))
    })?;

    let service = api.get_service(uuid).await?;
    let status = service
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("desconocido");

    println!("Servidor: {server_name}");
    println!("  Estado: {status}");
    println!("  RAM: {}", mc.memory);
    println!("  Max jugadores: {}", mc.max_players);
    Ok(())
}

async fn mc_remove(
    settings: &mut Settings,
    config_path: &Path,
    api: &CoolifyApiClient,
    server_name: &str,
) -> std::result::Result<(), CoolifyError> {
    let mc = settings.get_minecraft(server_name)?;
    let uuid = mc.stack_uuid.clone();

    /* Detener si esta corriendo */
    if let Some(ref uuid) = uuid {
        let _ = api.stop_service(uuid).await;
    }

    /* Remover de configuracion */
    settings.minecraft.retain(|m| m.server_name != server_name);
    settings.save(config_path)?;

    println!("Servidor Minecraft '{server_name}' removido de la configuracion.");
    if uuid.is_some() {
        println!("Nota: El stack sigue existiendo en Coolify. Eliminalo manualmente si deseas.");
    }
    Ok(())
}

fn generate_basic_mc_compose(
    name: &str,
    memory: &str,
    max_players: u32,
    difficulty: &str,
    version: &str,
    port: u16,
) -> String {
    format!(
        r#"version: '3.8'
services:
  minecraft:
    image: itzg/minecraft-server:latest
    environment:
      EULA: "TRUE"
      VERSION: "{version}"
      MEMORY: "{memory}"
      MAX_PLAYERS: "{max_players}"
      DIFFICULTY: "{difficulty}"
      MOTD: "Servidor {name}"
      ENABLE_RCON: "true"
      RCON_PASSWORD: "coolify-{name}"
    ports:
      - "{port}:25565"
    volumes:
      - mc-data:/data
    restart: unless-stopped

volumes:
  mc-data:
"#,
        name = name,
        version = version,
        memory = memory,
        max_players = max_players,
        difficulty = difficulty,
        port = port,
    )
}
