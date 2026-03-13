"""
Kamples Scraper — Pipelines.

DeduplicacionPipeline: descarta items duplicados (por whosampled_id).
ImageDescargaPipeline: descarga imágenes del CDN a wp-content/uploads/kamples/portadas/.
PostgresPipeline: inserta RelacionItem en BD con todas las entidades.
"""

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
from curl_cffi import requests as curl_requests
from scrapy.exceptions import DropItem

from kamples_scraper.items import RelacionItem, TrackMetadataItem
from kamples_scraper.utils.db import get_connection
from kamples_scraper.utils.parsers import (
    generar_slug,
    generar_slug_artista,
    normalizar_url,
)

logger = logging.getLogger(__name__)


class DeduplicacionPipeline:
    """Descarta items cuyo whosampled_id ya existe en BD."""

    def open_spider(self):
        self.ids_vistos = set()

    def process_item(self, item):
        if not isinstance(item, RelacionItem):
            return item

        ws_id = item.get("whosampled_id")
        if ws_id and ws_id in self.ids_vistos:
            raise DropItem(f"Duplicado en sesion: whosampled_id={ws_id}")

        if ws_id:
            self.ids_vistos.add(ws_id)

        return item


class ImageDescargaPipeline:
    """
    Descarga imágenes del CDN de WhoSampled y las preserva localmente
    en wp-content/uploads/kamples/portadas/.

    Corre antes de PostgresPipeline (prioridad 200) para que la URL local
    ya esté resuelta al hacer el INSERT de canciones.

    Dedup por SHA256 de la URL externa: si el archivo ya existe no re-descarga.
    Reutiliza la sesión curl_cffi del CurlCffiDownloaderMiddleware (con cookies
    activas de WhoSampled) registrada en crawler._curl_session.

    Requiere en .env:
        IMAGES_STORE_PATH — ruta absoluta al directorio local de almacenamiento
        IMAGES_BASE_URL   — URL HTTP base del mismo directorio
    """

    # Extensiones aceptadas como imagen
    _EXTENSIONES_VALIDAS = (".jpg", ".jpeg", ".png", ".webp", ".gif")

    _HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://www.whosampled.com/",
    }

    @classmethod
    def from_crawler(cls, crawler):
        pipeline = cls()
        pipeline._crawler = crawler
        return pipeline

    def open_spider(self):
        store_path = os.getenv("IMAGES_STORE_PATH", "")
        self.base_url = os.getenv("IMAGES_BASE_URL", "").rstrip("/")

        if not store_path or not self.base_url:
            logger.warning(
                "ImageDescargaPipeline: IMAGES_STORE_PATH o IMAGES_BASE_URL "
                "no configurados — imágenes se guardarán como URLs externas."
            )
            self.store_path = None
            return

        self.store_path = Path(store_path)
        try:
            self.store_path.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            logger.error(
                "ImageDescargaPipeline: no se pudo crear directorio %s: %s",
                store_path, exc,
            )
            self.store_path = None
            return

        # Reutilizar la sesión del middleware (tiene cookies activas de WhoSampled).
        # Si el middleware no está disponible (tests/otros entornos), crear sesión propia.
        self.session = getattr(self._crawler, "_curl_session", None)
        if self.session is None:
            self.session = curl_requests.Session(impersonate="chrome124")
            logger.warning("ImageDescargaPipeline: session compartida no disponible, usando sesión propia")

        # Proxy: mismo que usan las pages (IP residencial, evita bloqueos de CDN)
        self.proxies = getattr(self._crawler, "_curl_proxies", None)

        self.session.headers.update(self._HEADERS)
        logger.info("ImageDescargaPipeline: almacenando en %s (proxy=%s)", store_path, bool(self.proxies))

    def close_spider(self):
        if hasattr(self, "session") and self.session:
            self.session.close()

    def process_item(self, item):
        if not isinstance(item, RelacionItem) or self.store_path is None:
            return item

        for clave in ("cancion_destino", "cancion_fuente"):
            datos = item.get(clave)
            if datos and datos.get("imagen_url"):
                url_local = self._descargar(datos["imagen_url"])
                if url_local:
                    datos["imagen_url"] = url_local
                else:
                    # Si la descarga fallo, limpiar la URL externa para no guardar URLs
                    # inaccesibles (WhoSampled bloquea hotlinking → 403 en el frontend)
                    datos["imagen_url"] = None

        return item

    _MAX_REINTENTOS = 3
    _ESPERA_BASE_SEG = 2

    def _descargar(self, url: str) -> str | None:
        """Descarga imagen con reintentos y retorna URL local. Retorna None si falla."""
        nombre = hashlib.sha256(url.encode()).hexdigest()[:40]
        ext = Path(urlparse(url).path).suffix.lower()
        if ext not in self._EXTENSIONES_VALIDAS:
            ext = ".jpg"

        archivo = self.store_path / f"{nombre}{ext}"
        url_local = f"{self.base_url}/{nombre}{ext}"

        # Dedup: si ya existe en disco, reusar
        if archivo.exists():
            return url_local

        for intento in range(1, self._MAX_REINTENTOS + 1):
            try:
                resp = self.session.get(url, proxies=self.proxies, timeout=15)
                resp.raise_for_status()

                # Verificar que el contenido es realmente una imagen (no HTML de error)
                content_type = resp.headers.get("content-type", "")
                if "text/html" in content_type or len(resp.content) < 100:
                    logger.warning(
                        "Imagen sospechosa (content-type=%s, size=%d): %s (intento %d/%d)",
                        content_type, len(resp.content), url, intento, self._MAX_REINTENTOS,
                    )
                    if intento < self._MAX_REINTENTOS:
                        time.sleep(self._ESPERA_BASE_SEG * intento)
                        continue
                    return None

                archivo.write_bytes(resp.content)
                logger.debug("Imagen descargada: %s → %s", url, archivo.name)
                return url_local
            except Exception as exc:
                logger.warning(
                    "Error descargando imagen %s: %s (intento %d/%d)",
                    url, exc, intento, self._MAX_REINTENTOS,
                )
                if intento < self._MAX_REINTENTOS:
                    time.sleep(self._ESPERA_BASE_SEG * intento)

        logger.error("Imagen NO descargada tras %d intentos: %s", self._MAX_REINTENTOS, url)
        return None


class PostgresPipeline:
    """
    Inserta RelacionItem en PostgreSQL.
    Flujo por item:
    1. Upsert artista destino + fuente
    2. Upsert cancion destino + fuente
    3. Insertar relaciones cancion-artista (principal + featuring + producer)
    4. Insertar relacion sample (ON CONFLICT DO NOTHING)
    """

    def open_spider(self):
        try:
            self.conn = get_connection()
            self.conn.autocommit = False
            logger.info("PostgresPipeline: conexion establecida")
        except Exception:
            logger.exception("PostgresPipeline: error abriendo conexion")
            raise

    def close_spider(self):
        if hasattr(self, "conn") and self.conn and not self.conn.closed:
            self.conn.close()
            logger.info("PostgresPipeline: conexion cerrada")

    def process_item(self, item):
        if isinstance(item, TrackMetadataItem):
            return self._procesar_track_metadata(item)

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

                # Featuring artists
                for feat in dest_data.get("featuring", []):
                    feat_id = self._upsert_artista(cur, feat["nombre"], feat.get("whosampled_slug", ""))
                    self._upsert_cancion_artista(cur, dest_cancion_id, feat_id, "featuring")

                for feat in fuente_data.get("featuring", []):
                    feat_id = self._upsert_artista(cur, feat["nombre"], feat.get("whosampled_slug", ""))
                    self._upsert_cancion_artista(cur, fuente_cancion_id, feat_id, "featuring")

                # 4. Insertar relación sample (DO UPDATE actualiza timings/votos si re-encontrada)
                cur.execute(
                    "INSERT INTO relaciones_sample "
                    "(cancion_destino_id, cancion_fuente_id, whosampled_id, "
                    "tipo_relacion, tipo_elemento, timings_destino, timings_fuente, "
                    "aparece_en_todo, votos_total, votos_promedio, fuente) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'scraping') "
                    "ON CONFLICT (whosampled_id) DO UPDATE SET "
                    "timings_destino = EXCLUDED.timings_destino, "
                    "timings_fuente = EXCLUDED.timings_fuente, "
                    "votos_total = EXCLUDED.votos_total, "
                    "votos_promedio = EXCLUDED.votos_promedio, "
                    "tipo_elemento = EXCLUDED.tipo_elemento, "
                    "aparece_en_todo = EXCLUDED.aparece_en_todo, "
                    "updated_at = NOW() "
                    "RETURNING id, (xmax = 0) AS insertado",
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
                    relacion_id = row[0]
                    es_nueva = row[1]
                    accion = "insertada" if es_nueva else "actualizada"
                    logger.info("Relacion %s: id=%d ws_id=%s", accion, relacion_id, item.get("whosampled_id"))

                    # Auto-encolar extracción bilateral para relaciones nuevas
                    if es_nueva:
                        self._encolar_extraccion(
                            cur, relacion_id, dest_data, fuente_data, item
                        )
                        self.conn.commit()

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
            "duracion_segundos, imagen_url, whosampled_url, youtube_id, spotify_id, genero) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (whosampled_url) DO UPDATE SET "
            "titulo = EXCLUDED.titulo, "
            "imagen_url = COALESCE(EXCLUDED.imagen_url, canciones.imagen_url), "
            "youtube_id = COALESCE(EXCLUDED.youtube_id, canciones.youtube_id), "
            "spotify_id = COALESCE(EXCLUDED.spotify_id, canciones.spotify_id), "
            "genero = COALESCE(EXCLUDED.genero, canciones.genero) "
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
                data.get("youtube_id"),
                data.get("spotify_id"),
                data.get("genero"),
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

    def _procesar_track_metadata(self, item) -> "TrackMetadataItem":
        """
        Actualiza una canción existente con metadata del track overview:
        genero, youtube_id, y tags (almacenados en metadata JSONB).
        """
        ws_url = item.get("whosampled_url", "")
        if not ws_url:
            logger.warning("TrackMetadataItem sin whosampled_url — ignorado")
            return item

        try:
            with self.conn.cursor() as cur:
                # Construir SET dinámico solo con campos que tengan valor
                sets = []
                params = []

                genero = item.get("genero")
                if genero:
                    sets.append("genero = COALESCE(%s, canciones.genero)")
                    params.append(genero)

                youtube_id = item.get("youtube_id")
                if youtube_id:
                    sets.append("youtube_id = COALESCE(%s, canciones.youtube_id)")
                    params.append(youtube_id)

                spotify_id = item.get("spotify_id")
                if spotify_id:
                    sets.append("spotify_id = COALESCE(%s, canciones.spotify_id)")
                    params.append(spotify_id)

                tags = item.get("tags")
                if tags:
                    # Merge tags en metadata JSONB sin sobreescribir otros campos
                    sets.append(
                        "metadata = COALESCE(canciones.metadata, '{}'::jsonb) || %s::jsonb"
                    )
                    params.append(json.dumps({"tags": tags}))

                if not sets:
                    logger.debug("TrackMetadataItem sin datos útiles para %s", ws_url)
                    return item

                params.append(ws_url)
                cur.execute(
                    f"UPDATE canciones SET {', '.join(sets)} WHERE whosampled_url = %s",
                    params,
                )

                self.conn.commit()

                if cur.rowcount > 0:
                    logger.info("Metadata actualizada para cancion: %s", ws_url)
                else:
                    logger.debug("Cancion no encontrada para metadata: %s", ws_url)

        except psycopg2.Error:
            self.conn.rollback()
            logger.exception("Error actualizando metadata para %s", ws_url)
        except Exception:
            self.conn.rollback()
            logger.exception("Error inesperado en _procesar_track_metadata")

        return item

    def _encolar_extraccion(
        self, cur, relacion_id: int, dest_data: dict, fuente_data: dict, item
    ) -> None:
        """
        Encola extracción bilateral (fuente + destino) para una relación recién insertada.
        Crea hasta 2 entradas en cola_extraccion_samples con ON CONFLICT DO NOTHING
        para dedup por (relacion_id, lado).
        """
        lados = {
            "fuente": {
                "youtube_id": fuente_data.get("youtube_id"),
                "spotify_id": fuente_data.get("spotify_id"),
                "timings": item.get("timings_fuente", []),
            },
            "destino": {
                "youtube_id": dest_data.get("youtube_id"),
                "spotify_id": dest_data.get("spotify_id"),
                "timings": item.get("timings_destino", []),
            },
        }

        encolados = 0
        for lado, datos in lados.items():
            yt_id = datos["youtube_id"]
            sp_id = datos["spotify_id"]

            if not yt_id and not sp_id:
                continue

            timings = datos["timings"]
            if isinstance(timings, str):
                try:
                    timings = json.loads(timings)
                except (json.JSONDecodeError, TypeError):
                    timings = []

            timing = int(timings[0]) if timings else 0

            try:
                cur.execute(
                    "INSERT INTO cola_extraccion_samples "
                    "(relacion_id, youtube_id, spotify_id, timing_inicio_seg, lado) "
                    "VALUES (%s, %s, %s, %s, %s) "
                    "ON CONFLICT (relacion_id, lado) DO NOTHING",
                    (relacion_id, yt_id, sp_id, timing, lado),
                )
                if cur.rowcount > 0:
                    encolados += 1
            except psycopg2.Error:
                logger.warning(
                    "Error encolando extraccion relacion=%d lado=%s",
                    relacion_id, lado, exc_info=True,
                )

        if encolados > 0:
            logger.info(
                "Auto-encolado: relacion=%d, %d lados encolados para extraccion",
                relacion_id, encolados,
            )
