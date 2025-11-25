#!/bin/bash

# Remover cron job del Agente Logic Horario

LOG_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cron_setup.log"

# Función de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
    echo "$1"
}

log "=== REMOVIENDO CRON JOB DEL AGENTE LOGIC ==="

# Verificar entradas existentes
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "hourly_agent_wsl.sh" || true)

if [[ -z "$EXISTING_CRON" ]]; then
    log "ℹ️ No se encontraron entradas cron para el agente"
    log "El agente no está programado para ejecutarse automáticamente"
    exit 0
fi

log "Entradas encontradas:"
echo "$EXISTING_CRON"
echo ""

echo "¿Confirmas que deseas eliminar estas entradas? (s/n): "
read -r response

if [[ "$response" =~ ^[sS]$ ]]; then
    # Remover entradas
    crontab -l 2>/dev/null | grep -v -F "hourly_agent_wsl.sh" | crontab -

    if [[ $? -eq 0 ]]; then
        log "✅ CRON JOB ELIMINADO EXITOSAMENTE"
        log "El agente ya no se ejecutará automáticamente"
    else
        log "❌ ERROR: No se pudo eliminar el cron job"
        exit 1
    fi
else
    log "Operación cancelada por el usuario"
fi

log "=== OPERACIÓN COMPLETADA ==="
