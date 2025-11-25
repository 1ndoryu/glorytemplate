#!/bin/bash

# Configurar cron job para el Agente Logic Horario en WSL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/hourly_agent_wsl.sh"
LOG_FILE="$SCRIPT_DIR/cron_setup.log"

# Función de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
    echo "$1"
}

log "=== CONFIGURANDO CRON JOB PARA AGENTE LOGIC ==="

# Verificar que el script existe
if [[ ! -f "$SCRIPT_PATH" ]]; then
    log "ERROR: Script no encontrado: $SCRIPT_PATH"
    exit 1
fi

log "Script encontrado: $SCRIPT_PATH"

# Configurar variable de entorno para cron
CRON_ENV="CURSOR_API_KEY=key_4095045be046747d9378724f412aecfd1f71a871cc2ef3b089136b30885dc1c3"

# Crear entrada cron (cada hora)
CRON_JOB="0 * * * * $CRON_ENV bash $SCRIPT_PATH"

log "Entrada cron a agregar: $CRON_JOB"

# Verificar si ya existe una entrada para el agente
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "hourly_agent_wsl.sh" || true)

if [[ -n "$EXISTING_CRON" ]]; then
    log "ADVERTENCIA: Ya existe una entrada cron para el agente"
    log "Entrada existente: $EXISTING_CRON"
    echo "¿Deseas reemplazar la entrada existente? (s/n): "
    read -r response
    if [[ ! "$response" =~ ^[sS]$ ]]; then
        log "Configuración cancelada por el usuario"
        exit 0
    fi
    # Remover entrada existente
    crontab -l 2>/dev/null | grep -v -F "hourly_agent_wsl.sh" | crontab -
    log "Entrada anterior removida"
fi

# Agregar nueva entrada cron
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [[ $? -eq 0 ]]; then
    log "✅ CRON JOB CONFIGURADO EXITOSAMENTE"
    log "El agente se ejecutará cada hora a partir de la próxima hora en punto"
    log ""
    log "Para verificar: crontab -l"
    log "Para ver logs del agente: tail -f $SCRIPT_DIR/hourly_agent_wsl.log"
    log "Para detener: ./setup_cron_wsl.sh remove"
else
    log "❌ ERROR: No se pudo configurar el cron job"
    exit 1
fi

log "=== CONFIGURACIÓN COMPLETADA ==="
