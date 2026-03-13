#!/bin/bash
# Post-deploy: habilita módulos Apache necesarios para cache headers.
# Ejecutar después de cada rebuild del contenedor:
#   coolify-manager.exe run-script --name kamples --file .agent/post-deploy-apache.sh

set -e

echo "[$(date)] Verificando módulos Apache..."

# Habilitar mod_headers si no está activo (necesario para Cache-Control immutable)
if ! apache2ctl -M 2>/dev/null | grep -q "headers_module"; then
    echo "[$(date)] Habilitando mod_headers..."
    a2enmod headers
    NECESITA_RELOAD=1
fi

# Habilitar mod_expires si no está activo
if ! apache2ctl -M 2>/dev/null | grep -q "expires_module"; then
    echo "[$(date)] Habilitando mod_expires..."
    a2enmod expires
    NECESITA_RELOAD=1
fi

# Habilitar mod_deflate si no está activo
if ! apache2ctl -M 2>/dev/null | grep -q "deflate_module"; then
    echo "[$(date)] Habilitando mod_deflate..."
    a2enmod deflate
    NECESITA_RELOAD=1
fi

if [ "${NECESITA_RELOAD}" = "1" ]; then
    echo "[$(date)] Reiniciando Apache para activar módulos..."
    service apache2 restart
    echo "[$(date)] Apache reiniciado."
else
    echo "[$(date)] Todos los módulos ya estaban activos."
fi

echo "[$(date)] Módulos Apache verificados OK."
