/*
 * Operaciones Docker sobre SSH.
 * Encuentra contenedores, ejecuta comandos dentro de ellos y transfiere archivos.
 */

use crate::domain::{CommandOutput, ContainerFilter};
use crate::error::{CoolifyError, SshError};
use crate::infra::ssh_client::SshClient;

/// Ejecuta un comando dentro de un contenedor Docker via SSH.
pub async fn docker_exec(
    ssh: &SshClient,
    container_id: &str,
    command: &str,
) -> std::result::Result<CommandOutput, CoolifyError> {
    let cmd = format!("docker exec {} bash -c '{}'", container_id, escape_single_quotes(command));
    ssh.execute(&cmd).await
}

/// Ejecuta un comando como usuario www-data dentro del contenedor.
pub async fn docker_exec_as_www(
    ssh: &SshClient,
    container_id: &str,
    command: &str,
) -> std::result::Result<CommandOutput, CoolifyError> {
    let cmd = format!(
        "docker exec -u www-data {} bash -c '{}'",
        container_id,
        escape_single_quotes(command)
    );
    ssh.execute(&cmd).await
}

/// Busca un contenedor Docker por filtro (UUID del stack, nombre, imagen).
pub async fn find_container(
    ssh: &SshClient,
    filter: &ContainerFilter,
) -> std::result::Result<String, CoolifyError> {
    /* Intentar buscar por UUID del stack primero (mas preciso) */
    if let Some(ref uuid) = filter.stack_uuid {
        let cmd = format!(
            "docker ps --format '{{{{.ID}}}} {{{{.Names}}}} {{{{.Image}}}}' | grep -i '{}' | head -1 | awk '{{print $1}}'",
            uuid
        );
        let result = ssh.execute(&cmd).await?;
        let id = result.stdout.trim().to_string();
        if !id.is_empty() {
            return Ok(id);
        }
    }

    /* Buscar por nombre */
    if let Some(ref name) = filter.name_contains {
        let cmd = format!(
            "docker ps --format '{{{{.ID}}}} {{{{.Names}}}}' | grep -i '{}' | head -1 | awk '{{print $1}}'",
            name
        );
        let result = ssh.execute(&cmd).await?;
        let id = result.stdout.trim().to_string();
        if !id.is_empty() {
            return Ok(id);
        }
    }

    /* Buscar por imagen */
    if let Some(ref image) = filter.image_contains {
        let cmd = format!(
            "docker ps --format '{{{{.ID}}}} {{{{.Image}}}}' | grep -i '{}' | head -1 | awk '{{print $1}}'",
            image
        );
        let result = ssh.execute(&cmd).await?;
        let id = result.stdout.trim().to_string();
        if !id.is_empty() {
            return Ok(id);
        }
    }

    Err(SshError::ContainerNotFound {
        filter: format!("{:?}", filter),
    }
    .into())
}

/// Busca el contenedor WordPress de un stack.
pub async fn find_wordpress_container(
    ssh: &SshClient,
    stack_uuid: &str,
) -> std::result::Result<String, CoolifyError> {
    find_container(
        ssh,
        &ContainerFilter {
            stack_uuid: Some(stack_uuid.to_string()),
            name_contains: Some("wordpress".to_string()),
            image_contains: Some("wordpress".to_string()),
        },
    )
    .await
}

/// Busca el contenedor MariaDB de un stack.
pub async fn find_mariadb_container(
    ssh: &SshClient,
    stack_uuid: &str,
) -> std::result::Result<String, CoolifyError> {
    find_container(
        ssh,
        &ContainerFilter {
            stack_uuid: Some(stack_uuid.to_string()),
            name_contains: Some("mariadb".to_string()),
            image_contains: Some("mariadb".to_string()),
        },
    )
    .await
}

/// Busca el contenedor PostgreSQL de un stack.
pub async fn find_postgres_container(
    ssh: &SshClient,
    stack_uuid: &str,
) -> std::result::Result<String, CoolifyError> {
    find_container(
        ssh,
        &ContainerFilter {
            stack_uuid: Some(stack_uuid.to_string()),
            name_contains: Some("postgres".to_string()),
            image_contains: Some("postgres".to_string()),
        },
    )
    .await
}

/// Copia un archivo local a un contenedor Docker.
pub async fn copy_to_container(
    ssh: &SshClient,
    local_path: &std::path::Path,
    container_id: &str,
    container_path: &str,
) -> std::result::Result<(), CoolifyError> {
    /* Subir archivo al host primero, luego copiar al contenedor */
    let tmp_remote = format!("/tmp/cm_upload_{}", uuid::Uuid::new_v4());
    ssh.upload_file(local_path, &tmp_remote).await?;

    let cmd = format!("docker cp {} {}:{}", tmp_remote, container_id, container_path);
    let result = ssh.execute(&cmd).await?;

    /* Limpiar archivo temporal */
    let _ = ssh.execute(&format!("rm -f {}", tmp_remote)).await;

    if !result.success() {
        return Err(SshError::CommandFailed {
            exit_code: result.exit_code,
            stderr: result.stderr,
        }
        .into());
    }

    Ok(())
}

/// Copia un archivo desde un contenedor Docker al host local.
pub async fn copy_from_container(
    ssh: &SshClient,
    container_id: &str,
    container_path: &str,
    local_path: &std::path::Path,
) -> std::result::Result<(), CoolifyError> {
    let tmp_remote = format!("/tmp/cm_download_{}", uuid::Uuid::new_v4());

    let cmd = format!("docker cp {}:{} {}", container_id, container_path, tmp_remote);
    let result = ssh.execute(&cmd).await?;

    if !result.success() {
        return Err(SshError::CommandFailed {
            exit_code: result.exit_code,
            stderr: result.stderr,
        }
        .into());
    }

    ssh.download_file(&tmp_remote, local_path).await?;

    /* Limpiar archivo temporal */
    let _ = ssh.execute(&format!("rm -f {}", tmp_remote)).await;

    Ok(())
}

/// Lista contenedores Docker con formato estructurado.
pub async fn list_containers(ssh: &SshClient) -> std::result::Result<Vec<ContainerInfo>, CoolifyError> {
    let cmd = "docker ps --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}'";
    let result = ssh.execute(cmd).await?;

    let containers = result
        .stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|line| {
            let parts: Vec<&str> = line.splitn(4, '|').collect();
            if parts.len() >= 4 {
                Some(ContainerInfo {
                    id: parts[0].to_string(),
                    name: parts[1].to_string(),
                    image: parts[2].to_string(),
                    status: parts[3].to_string(),
                })
            } else {
                None
            }
        })
        .collect();

    Ok(containers)
}

#[derive(Debug, Clone)]
pub struct ContainerInfo {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: String,
}

/// Escapa comillas simples para uso seguro en bash -c '...'.
fn escape_single_quotes(input: &str) -> String {
    input.replace('\'', "'\\''")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_single_quotes() {
        assert_eq!(escape_single_quotes("hello"), "hello");
        assert_eq!(escape_single_quotes("it's"), "it'\\''s");
        assert_eq!(escape_single_quotes("a'b'c"), "a'\\''b'\\''c");
    }
}
