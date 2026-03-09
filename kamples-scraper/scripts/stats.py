"""
Estadísticas de progreso del scraping y extracción.
Ejecutar: python scripts/stats.py
"""

from kamples_scraper.utils.db import get_connection
from kamples_scraper.utils.bandwidth import log_estadisticas, total_bytes_consumidos

import logging
import os

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def main():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Total relaciones
            cur.execute("SELECT COUNT(*) FROM relaciones_sample")
            total_relaciones = cur.fetchone()[0]

            # Por tipo
            cur.execute(
                "SELECT tipo_relacion, COUNT(*) FROM relaciones_sample "
                "GROUP BY tipo_relacion ORDER BY COUNT(*) DESC"
            )
            por_tipo = cur.fetchall()

            # Total artistas y canciones
            cur.execute("SELECT COUNT(*) FROM artistas_musicales")
            total_artistas = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM canciones")
            total_canciones = cur.fetchone()[0]

            # Scraping log
            cur.execute(
                "SELECT estado, COUNT(*) FROM scraping_log "
                "GROUP BY estado ORDER BY COUNT(*) DESC"
            )
            log_estados = cur.fetchall()

            # Cola extracción
            cur.execute(
                "SELECT estado, COUNT(*) FROM cola_extraccion_samples "
                "GROUP BY estado ORDER BY COUNT(*) DESC"
            )
            cola_estados = cur.fetchall()

            # Top artistas más sampleados
            cur.execute(
                "SELECT a.nombre, c_count "
                "FROM artistas_musicales a "
                "JOIN (SELECT artista_id, COUNT(*) as c_count FROM canciones GROUP BY artista_id) cc "
                "ON a.id = cc.artista_id "
                "ORDER BY c_count DESC LIMIT 10"
            )
            top_artistas = cur.fetchall()

    finally:
        conn.close()

    # Mostrar resultados
    logger.info("=" * 50)
    logger.info("KAMPLES SCRAPER — ESTADISTICAS")
    logger.info("=" * 50)
    logger.info("")
    logger.info("Relaciones totales: %d", total_relaciones)
    for tipo, count in por_tipo:
        logger.info("  %s: %d", tipo, count)
    logger.info("")
    logger.info("Artistas: %d | Canciones: %d", total_artistas, total_canciones)
    logger.info("")
    logger.info("Scraping log:")
    for estado, count in log_estados:
        logger.info("  %s: %d", estado, count)
    logger.info("")
    logger.info("Cola extraccion:")
    for estado, count in cola_estados:
        logger.info("  %s: %d", estado, count)
    logger.info("")
    logger.info("Top 10 artistas:")
    for nombre, count in top_artistas:
        logger.info("  %s (%d canciones)", nombre, count)
    logger.info("")

    budget = int(os.getenv("PROXY_BUDGET_BYTES", "5368709120"))
    log_estadisticas(budget)


if __name__ == "__main__":
    main()
