"""
Spider: Track — scraping de listas de samples/sampled por track.

Scrapea las páginas de samples y sampled de tracks individuales
en WhoSampled. Puede arrancar desde URLs directas de tracks
o recibir URLs via CrawlerProcess.

Uso:
    scrapy crawl track -a start_url=https://www.whosampled.com/James-Brown/Funky-Drummer/
    scrapy crawl track -a start_url=https://www.whosampled.com/James-Brown/Funky-Drummer/samples/
    scrapy crawl track -a start_url=...&modo=samples
    scrapy crawl track -a start_url=...&modo=sampled

Selectores basados en la estructura pública de WhoSampled.
"""

import logging

import scrapy

from kamples_scraper.items import TrackMetadataItem
from kamples_scraper.utils.dedup import url_ya_procesada, registrar_url, marcar_procesada, marcar_error
from kamples_scraper.utils.parsers import normalizar_url, extraer_metadata_track_overview

logger = logging.getLogger(__name__)


class TrackSpider(scrapy.Spider):
    name = "track"
    allowed_domains = ["whosampled.com"]

    MAX_PAGES = 10

    # Homepage de WhoSampled: primer request para establecer cookies de Cloudflare.
    # Sin este warm-up, un request directo a un track específico recibe 403.
    WARMUP_URL = "https://www.whosampled.com/"

    # Profundidad máxima de seguimiento cuando se usa con start_url específica.
    # 2 = track → detalle de relacion. Evita explotar el grafo completo de samples.
    DEPTH_LIMIT_TRACK = 2

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.modo = getattr(self, "modo", "ambos")

    async def start(self):
        """
        Punto de entrada (Scrapy 2.13+ — reemplaza start_requests() deprecated).
        Emite primero un warm-up a la homepage para establecer cookies de Cloudflare;
        luego sigue al track objetivo.
        - start_url: URL del track (/{Artista}/{Track}/)
        - modo: 'samples', 'sampled', o 'ambos' (default)
        """
        start_url = getattr(self, "start_url", "")
        if not start_url:
            logger.error("Se requiere start_url para el spider 'track'")
            return

        # Warm-up: homepage primero para obtener cookies de sesion de Cloudflare.
        # El callback determina qué sub-página del track visitar despues.
        yield scrapy.Request(
            self.WARMUP_URL,
            callback=self.parse_warmup,
            cb_kwargs={"target_url": start_url},
            dont_filter=True,
        )

    def parse_warmup(self, response, target_url):
        """
        Tras obtener cookies de la homepage, emitir el request al track objetivo.
        El warm-up establece la sesion curl_cffi con cookies validas de Cloudflare.
        """
        logger.info(
            "Warm-up completado (status=%d) — yendo a: %s",
            response.status,
            target_url,
        )

        if target_url.rstrip("/").endswith("/samples"):
            yield scrapy.Request(target_url, callback=self.parse_list, cb_kwargs={"tipo": "track_samples"})
        elif target_url.rstrip("/").endswith("/sampled"):
            yield scrapy.Request(target_url, callback=self.parse_list, cb_kwargs={"tipo": "track_sampled"})
        else:
            yield scrapy.Request(target_url, callback=self.parse_track_overview)

    def parse_track_overview(self, response):
        """
        Parsear la página overview de un track: /{Artista}/{Track}/
        Emite TrackMetadataItem con genre/tags/youtube_id para enriquecer la cancion.
        Genera requests a /samples/ y /sampled/ según el modo configurado.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        registrar_url(url_norm, "track", "procesado")

        base_url = response.url.rstrip("/")

        try:
            # Extraer metadata del track overview (genre, tags, youtube_id, spotify_id)
            meta = extraer_metadata_track_overview(response)
            if meta["genero"] or meta["youtube_id"] or meta["spotify_id"] or meta["tags"]:
                yield TrackMetadataItem(
                    whosampled_url=meta["whosampled_url"],
                    genero=meta["genero"],
                    youtube_id=meta["youtube_id"],
                    spotify_id=meta["spotify_id"],
                    tags=meta["tags"],
                )

            # Links directos a detalles de relación visibles en el overview
            for row in response.css("table.tdata tr"):
                yield from self._extraer_detail_links(response, row)

            # Generar requests a sublistas según modo
            if self.modo in ("ambos", "samples"):
                samples_url = f"{base_url}/samples/"
                samples_norm = normalizar_url(samples_url)
                if not url_ya_procesada(samples_norm):
                    registrar_url(samples_norm, "track_samples", "pendiente")
                    yield scrapy.Request(samples_url, callback=self.parse_list, cb_kwargs={"tipo": "track_samples"})

            if self.modo in ("ambos", "sampled"):
                sampled_url = f"{base_url}/sampled/"
                sampled_norm = normalizar_url(sampled_url)
                if not url_ya_procesada(sampled_norm):
                    registrar_url(sampled_norm, "track_sampled", "pendiente")
                    yield scrapy.Request(sampled_url, callback=self.parse_list, cb_kwargs={"tipo": "track_sampled"})

            marcar_procesada(url_norm, body_size, tipo_pagina="track")

        except Exception as e:
            logger.exception("Error parseando track overview %s", response.url)
            marcar_error(url_norm, str(e)[:1000])

    def parse_list(self, response, tipo="track_samples"):
        """
        Parsear lista paginada de samples o sampled.
        Estructura: tabla con filas, cada una con link a detalle de relación.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        registrar_url(url_norm, tipo, "procesado")

        try:
            entries_found = 0

            # Buscar entradas en la estructura de lista
            for entry in response.css("div.listEntry, li.listEntry"):
                link = entry.css("a[href*='/sample/']::attr(href), "
                                 "a[href*='/cover/']::attr(href), "
                                 "a[href*='/remix/']::attr(href)").get()
                if link:
                    yield from self._seguir_detalle(response, link)
                    entries_found += 1

            # Fallback: buscar en tablas
            for row in response.css("table.tdata tr"):
                links_emitidos = list(self._extraer_detail_links(response, row))
                if links_emitidos:
                    entries_found += len(links_emitidos)
                    yield from links_emitidos

            # Paginación
            next_page = response.css("span.next a::attr(href)").get()
            pagina = self._pagina_actual(response)
            if next_page and pagina < self.MAX_PAGES:
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse_list,
                    cb_kwargs={"tipo": tipo},
                )

            logger.info("Track list %s — %d entradas encontradas (pag %d)", response.url, entries_found, pagina)
            marcar_procesada(url_norm, body_size, tipo_pagina=tipo)

        except Exception as e:
            logger.exception("Error parseando lista de track %s", response.url)
            marcar_error(url_norm, str(e)[:1000])

    def _extraer_detail_links(self, response, row):
        """Extraer y seguir links a detalles de relación desde una fila de tabla."""
        for a_tag in row.css("a[href]"):
            href = a_tag.attrib.get("href", "")
            if any(p in href for p in ["/sample/", "/cover/", "/remix/"]):
                yield from self._seguir_detalle(response, href)
                return

    def _seguir_detalle(self, response, href):
        """Crear request al detalle si no está ya procesado."""
        detail_url = response.urljoin(href)
        detail_norm = normalizar_url(detail_url)

        if url_ya_procesada(detail_norm):
            return

        tipo_detalle = "sample_detail"
        if "/cover/" in href:
            tipo_detalle = "cover_detail"
        elif "/remix/" in href:
            tipo_detalle = "remix_detail"

        registrar_url(detail_norm, tipo_detalle, "pendiente")
        yield scrapy.Request(detail_url, callback=self._parse_detail)

    def _parse_detail(self, response):
        """Delegar al SampleDetailSpider para extraer la relación."""
        from kamples_scraper.spiders.sample_detail import SampleDetailSpider
        spider = SampleDetailSpider()
        yield from spider.parse_detail(response)

    def _pagina_actual(self, response) -> int:
        """Extraer número de página actual."""
        current = response.css("span.curr::text").get()
        if current and current.isdigit():
            return int(current)
        return 1
