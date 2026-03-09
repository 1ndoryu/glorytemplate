"""
Kamples Scraper — Pipelines.

DeduplicacionPipeline: descarta items duplicados (por whosampled_id).
PostgresPipeline: inserta RelacionItem en BD con todas las entidades.
"""

import logging

import psycopg2
from scrapy.exceptions import DropItem

from kamples_scraper.items import RelacionItem
from kamples_scraper.utils.db import get_connection
from kamples_scraper.utils.parsers import (
    generar_slug,
    generar_slug_artista,
    normalizar_url,
)

logger = logging.getLogger(__name__)


class DeduplicacionPipeline:
    """Descarta items cuyo whosampled_id ya existe en BD."""

    def open_spider(self, spider):
        self.ids_vistos = set()

    def process_item(self, item, spider):
        if not isinstance(item, RelacionItem):
            return item

        ws_id = item.get("whosampled_id")
        if ws_id and ws_id in self.ids_vistos:
            raise DropItem(f"Duplicado en sesion: whosampled_id={ws_id}")

        if ws_id:
            self.ids_vistos.add(ws_id)

        return item


class PostgresPipeline:
    """
    Inserta RelacionItem en PostgreSQL.
    Flujo por item:
    1. Upsert artista destino + fuente
    2. Upsert cancion destino + fuente
    3. Insertar relaciones cancion-artista (principal + featuring + producer)
    4. Insertar relacion sample (ON CONFLICT DO NOTHING)
    """

    def open_spider(self, spider):
        try:
            self.conn = get_connection()
            self.conn.autocommit = False
            logger.info("PostgresPipeline: conexion establecida")
        except Exception:
            logger.exception("PostgresPipeline: error abriendo conexion")
            raise

    def close_spider(self, spider):
        if hasattr(self, "conn") and self.conn and not self.conn.closed:
            self.conn.close()
            logger.info("PostgresPipeline: conexion cerrada")

    def process_item(self, item, spider):
        if not isinstance(item, RelacionItem):
            return item

        try:
            with self.conn.cursor() as cur:
                dest_data = item["cancion_destino"]
                fuente_data = item["cancion_fuente"]

                # 1. Upsert artistas
                dest_artista_id = self._upsert_artista(cur, dest_data["artista"], dest_data.get("artista_slug", ""))
                fuente_artista_id = self._upsert_artista(cur, fuente_data["artista"], fuente_data.get("artista_slug", ""))

                # 2. Upsert canciones
                dest_cancion_id = self._upsert_cancion(cur, dest_data, dest_artista_id)
                fuente_cancion_id = self._upsert_cancion(cur, fuente_data, fuente_artista_id)

                # 3. Relaciones cancion-artista (principal)
                self._upsert_cancion_artista(cur, dest_cancion_id, dest_artista_id, "principal")
                self._upsert_cancion_artista(cur, fuente_cancion_id, fuente_artista_id, "principal")

                # Productores
                for prod in dest_data.get("productores", []):
                    prod_id = self._upsert_artista(cur, prod["nombre"], prod.get("whosampled_slug", ""))
                    self._upsert_cancion_artista(cur, dest_cancion_id, prod_id, "producer")

                for prod in fuente_data.get("productores", []):
                    prod_id = self._upsert_artista(cur, prod["nombre"], prod.get("whosampled_slug", ""))
                    self._upsert_cancion_artista(cur, fuente_cancion_id, prod_id, "producer")

                # 4. Insertar relación sample
                import json
                cur.execute(
                    "INSERT INTO relaciones_sample "
                    "(cancion_destino_id, cancion_fuente_id, whosampled_id, "
                    "tipo_relacion, tipo_elemento, timings_destino, timings_fuente, "
                    "aparece_en_todo, votos_total, votos_promedio, fuente) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'scraping') "
                    "ON CONFLICT (whosampled_id) DO NOTHING "
                    "RETURNING id",
                    (
                        dest_cancion_id,
                        fuente_cancion_id,
                        item.get("whosampled_id"),
                        item.get("tipo_relacion", "sample"),
                        item.get("tipo_elemento", "multiple_elements"),
                        json.dumps(item.get("timings_destino", [])),
                        json.dumps(item.get("timings_fuente", [])),
                        item.get("aparece_en_todo", False),
                        item.get("votos_total", 0),
                        item.get("votos_promedio", 0),
                    ),
                )

                self.conn.commit()

                row = cur.fetchone()
                if row:
                    logger.info("Relacion insertada: id=%d ws_id=%s", row[0], item.get("whosampled_id"))
                else:
                    logger.debug("Relacion ya existia: ws_id=%s", item.get("whosampled_id"))

        except psycopg2.Error:
            self.conn.rollback()
            logger.exception("Error insertando RelacionItem ws_id=%s", item.get("whosampled_id"))
        except Exception:
            self.conn.rollback()
            logger.exception("Error inesperado en pipeline")

        return item

    def _upsert_artista(self, cur, nombre: str, ws_slug: str) -> int:
        """Insertar artista o retornar ID existe. Usa whosampled_slug para dedup."""
        slug_norm = normalizar_url(ws_slug)
        slug = generar_slug_artista(nombre)

        if slug_norm:
            cur.execute(
                "SELECT id FROM artistas_musicales WHERE whosampled_slug = %s",
                (slug_norm,),
            )
            row = cur.fetchone()
            if row:
                return row[0]

        cur.execute(
            "INSERT INTO artistas_musicales (nombre, slug, whosampled_slug) "
            "VALUES (%s, %s, %s) "
            "ON CONFLICT (whosampled_slug) DO UPDATE SET nombre = EXCLUDED.nombre "
            "RETURNING id",
            (nombre, slug, slug_norm or slug),
        )
        return cur.fetchone()[0]

    def _upsert_cancion(self, cur, data: dict, artista_id: int) -> int:
        """Insertar canción o retornar ID existente. Usa whosampled_url para dedup."""
        ws_url = data.get("whosampled_url", "")

        if ws_url:
            cur.execute(
                "SELECT id FROM canciones WHERE whosampled_url = %s",
                (ws_url,),
            )
            row = cur.fetchone()
            if row:
                return row[0]

        slug = generar_slug(data.get("artista", ""), data.get("nombre", ""))

        cur.execute(
            "INSERT INTO canciones "
            "(titulo, slug, artista_id, album, sello, anio, "
            "duracion_segundos, imagen_url, whosampled_url) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (whosampled_url) DO UPDATE SET titulo = EXCLUDED.titulo "
            "RETURNING id",
            (
                data.get("nombre", ""),
                slug,
                artista_id,
                data.get("album"),
                data.get("sello"),
                data.get("anio"),
                data.get("duracion_segundos"),
                data.get("imagen_url"),
                ws_url or slug,
            ),
        )
        return cur.fetchone()[0]

    def _upsert_cancion_artista(self, cur, cancion_id: int, artista_id: int, rol: str) -> None:
        """Insertar relación canción-artista ignorando duplicados."""
        cur.execute(
            "INSERT INTO canciones_artistas (cancion_id, artista_id, rol) "
            "VALUES (%s, %s, %s) "
            "ON CONFLICT (cancion_id, artista_id, rol) DO NOTHING",
            (cancion_id, artista_id, rol),
        )
