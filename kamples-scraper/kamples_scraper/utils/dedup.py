"""
Verificación de dedup contra scraping_log en PostgreSQL.

Capa persistente entre ejecuciones del scraper.
Complementa el DupeFilter de Scrapy (que solo dura una sesión).

Soporte re-scraping: URLs de tipo track/artist se marcan re-scrapeables
al procesarse. url_ya_procesada() las permite si proximo_rescrape ya pasó.
"""

import logging
from kamples_scraper.utils.db import get_connection
from kamples_scraper.utils.parsers import normalizar_url

logger = logging.getLogger(__name__)

# Tipos de página cuyas URLs evolucionan y necesitan revisita periódica
TIPOS_RE_SCRAPEABLES = frozenset({"track", "track_samples", "track_sampled", "artist"})

# Intervalo base entre rescrapes (días). Crece con cada iteración: 180d, 360d, 540d...
# Mínimo 6 meses — las páginas de track/artist no cambian con frecuencia.
INTERVALO_RESCRAPE_DIAS = 180


def url_ya_procesada(url: str) -> bool:
    """
    Verificar si la URL ya fue procesada exitosamente.
    URLs re-scrapeables cuyo proximo_rescrape ya pasó se consideran NO procesadas
    (libres para revisita).
    """
    url_norm = normalizar_url(url)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, re_scrapeable, proximo_rescrape FROM scraping_log "
                "WHERE url = %s AND estado = 'procesado'",
                (url_norm,),
            )
            row = cur.fetchone()
            if row is None:
                return False

            re_scrapeable = row[1]
            proximo_rescrape = row[2]

            if re_scrapeable and proximo_rescrape is not None:
                cur.execute("SELECT %s <= NOW()", (proximo_rescrape,))
                vencida = cur.fetchone()[0]
                if vencida:
                    return False

            return True
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


def marcar_procesada(url: str, bytes_descargados: int = 0, tipo_pagina: str = "") -> None:
    """
    Marcar URL como procesada exitosamente.
    Si el tipo_pagina es re-scrapeable, programa el próximo rescrape.
    """
    url_norm = normalizar_url(url)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if tipo_pagina in TIPOS_RE_SCRAPEABLES:
                cur.execute(
                    "UPDATE scraping_log SET estado = 'procesado', "
                    "bytes_descargados = %s, procesado_at = NOW(), "
                    "re_scrapeable = TRUE, "
                    "veces_rescrapeado = veces_rescrapeado + CASE WHEN re_scrapeable THEN 1 ELSE 0 END, "
                    "proximo_rescrape = NOW() + ((COALESCE(veces_rescrapeado, 0) + 1) * %s * INTERVAL '1 day') "
                    "WHERE url = %s",
                    (bytes_descargados, INTERVALO_RESCRAPE_DIAS, url_norm),
                )
            else:
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


def obtener_pendientes_rescrape(limit: int = 50) -> list[dict]:
    """
    URLs re-scrapeables cuyo proximo_rescrape ya pasó.
    Retorna lista de dicts con id, url, tipo_pagina, veces_rescrapeado.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, url, tipo_pagina, veces_rescrapeado "
                "FROM scraping_log "
                "WHERE re_scrapeable = TRUE "
                "AND proximo_rescrape <= NOW() "
                "AND estado = 'procesado' "
                "ORDER BY proximo_rescrape ASC "
                "LIMIT %s",
                (limit,),
            )
            return [
                {"id": r[0], "url": r[1], "tipo_pagina": r[2], "veces_rescrapeado": r[3]}
                for r in cur.fetchall()
            ]
    except Exception:
        logger.exception("Error obteniendo pendientes de rescrape")
        return []
    finally:
        conn.close()
