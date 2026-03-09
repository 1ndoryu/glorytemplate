"""
Verificación de dedup contra scraping_log en PostgreSQL.

Capa persistente entre ejecuciones del scraper.
Complementa el DupeFilter de Scrapy (que solo dura una sesión).
"""

import logging
from kamples_scraper.utils.db import get_connection
from kamples_scraper.utils.parsers import normalizar_url

logger = logging.getLogger(__name__)


def url_ya_procesada(url: str) -> bool:
    """Verificar si la URL ya fue procesada exitosamente."""
    url_norm = normalizar_url(url)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM scraping_log WHERE url = %s AND estado = 'procesado'",
                (url_norm,),
            )
            return cur.fetchone() is not None
    finally:
        conn.close()


def registrar_url(url: str, tipo_pagina: str, estado: str = "pendiente") -> int | None:
    """Registrar URL en scraping_log. Retorna ID o None si ya existe."""
    url_norm = normalizar_url(url)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO scraping_log (url, tipo_pagina, estado) "
                "VALUES (%s, %s, %s) "
                "ON CONFLICT (url) DO NOTHING "
                "RETURNING id",
                (url_norm, tipo_pagina, estado),
            )
            conn.commit()
            row = cur.fetchone()
            return row[0] if row else None
    except Exception:
        conn.rollback()
        logger.exception("Error registrando URL %s", url_norm)
        return None
    finally:
        conn.close()


def marcar_procesada(url: str, bytes_descargados: int = 0) -> None:
    """Marcar URL como procesada exitosamente."""
    url_norm = normalizar_url(url)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE scraping_log SET estado = 'procesado', "
                "bytes_descargados = %s, procesado_at = NOW() "
                "WHERE url = %s",
                (bytes_descargados, url_norm),
            )
            conn.commit()
    except Exception:
        conn.rollback()
        logger.exception("Error marcando URL procesada %s", url_norm)
    finally:
        conn.close()


def marcar_error(url: str, error_msg: str) -> None:
    """Marcar URL como error."""
    url_norm = normalizar_url(url)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE scraping_log SET estado = 'error', "
                "error_mensaje = %s, intentos = intentos + 1 "
                "WHERE url = %s",
                (error_msg[:1000], url_norm),
            )
            conn.commit()
    except Exception:
        conn.rollback()
        logger.exception("Error marcando URL con error %s", url_norm)
    finally:
        conn.close()
