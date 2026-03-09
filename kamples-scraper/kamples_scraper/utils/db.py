"""
Conexión compartida a PostgreSQL.

Usa psycopg2 con configuración de .env.
Pool de conexiones mínimo para scraper single-threaded.
"""

import os
import logging
import psycopg2
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def get_connection():
    """Obtener conexión a PostgreSQL."""
    try:
        return psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            dbname=os.getenv("DB_NAME", "kamples"),
            user=os.getenv("DB_USER", "kamples"),
            password=os.getenv("DB_PASSWORD", ""),
        )
    except psycopg2.Error:
        logger.exception("Error conectando a PostgreSQL")
        raise
