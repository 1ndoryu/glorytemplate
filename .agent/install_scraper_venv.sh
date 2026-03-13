#!/bin/bash
set -e

SCRAPER_DIR="/var/www/html/wp-content/themes/glorytemplate/kamples-scraper"
VENV_DIR="$SCRAPER_DIR/.venv"
REQ_FILE="$SCRAPER_DIR/requirements.txt"

echo "[$(date)] Iniciando instalación de virtualenv del scraper..."

# Verificar que existe el directorio
if [ ! -d "$SCRAPER_DIR" ]; then
    echo "ERROR: Directorio del scraper no encontrado: $SCRAPER_DIR"
    exit 1
fi

# Crear virtualenv si no existe
if [ ! -d "$VENV_DIR" ]; then
    echo "[$(date)] Creando virtualenv en $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
else
    echo "[$(date)] Virtualenv ya existe en $VENV_DIR"
fi

# Actualizar pip
echo "[$(date)] Actualizando pip..."
"$VENV_DIR/bin/pip" install --upgrade pip --quiet

# Instalar dependencias
echo "[$(date)] Instalando dependencias desde requirements.txt..."
"$VENV_DIR/bin/pip" install -r "$REQ_FILE" --quiet 2>&1 | tail -10

# Verificar scrapy
echo "[$(date)] Verificando instalación de scrapy..."
"$VENV_DIR/bin/python" -c "import scrapy; print('scrapy', scrapy.__version__, '- OK')"

echo "[$(date)] Instalación completada. Python en: $VENV_DIR/bin/python"
