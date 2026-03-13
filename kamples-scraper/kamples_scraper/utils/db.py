"""
Conexión compartida a PostgreSQL.

Usa psycopg2 con configuración del entorno.
Prioridad: KAMPLES_PG_* (inyectadas en contenedor) > DB_* (scraper .env) > defaults.
Pool de conexiones mínimo para scraper single-threaded.
"""

import os
import logging
import psycopg2
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def _env(kamples_key: str, scraper_key: str, default: str) -> str:
    """Lee config PG con prioridad: KAMPLES_PG_* > DB_* > default."""
    return os.getenv(kamples_key) or os.getenv(scraper_key) or default


def get_connection():
    """Obtener conexión a PostgreSQL."""
    try:
        return psycopg2.connect(
            host=_env("KAMPLES_PG_HOST", "DB_HOST", "localhost"),
            port=int(_env("KAMPLES_PG_PORT", "DB_PORT", "5432")),
            dbname=_env("KAMPLES_PG_DBNAME", "DB_NAME", "kamples"),
            user=_env("KAMPLES_PG_USER", "DB_USER", "kamples"),
            password=_env("KAMPLES_PG_PASSWORD", "DB_PASSWORD", ""),
        )
    except psycopg2.Error:
        logger.exception("Error conectando a PostgreSQL")
        raise
