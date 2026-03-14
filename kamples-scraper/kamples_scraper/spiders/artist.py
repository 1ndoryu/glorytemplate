"""
Spider: Artistas — scraping de artistas top y sus tracks.

Scrapea las páginas de artistas más sampleados en WhoSampled.
Para cada artista, sigue a sus tracks y de ahí a los detalles de samples.

Uso:
    scrapy crawl artist
    scrapy crawl artist -a max_artists=30
    scrapy crawl artist -a start_url=https://www.whosampled.com/James-Brown/

Selectores basados en la estructura pública de WhoSampled.
"""

import logging

import scrapy

from kamples_scraper.utils.dedup import url_ya_procesada, registrar_url, marcar_procesada, marcar_error
from kamples_scraper.utils.parsers import normalizar_url

logger = logging.getLogger(__name__)


class ArtistSpider(scrapy.Spider):
    name = "artist"
    allowed_domains = ["whosampled.com"]

    MAX_ARTIST_PAGES = 10
    MAX_TRACK_PAGES = 5

    # Artistas con prioridad en el sistema, se scraper primero con -a priority=true
    ARTISTAS_PRIORITARIOS = [
        "https://www.whosampled.com/DJ-Smokey/",
        "https://www.whosampled.com/Soudiere/",
        "https://www.whosampled.com/Juicy-J/",
        "https://www.whosampled.com/Three-6-Mafia/",
        "https://www.whosampled.com/Project-Pat/",
        "https://www.whosampled.com/Tyler,-The-Creator/",
        "https://www.whosampled.com/Freddie-Dredd/",
        "https://www.whosampled.com/Kanye-West/",
        "https://www.whosampled.com/Daft-Punk/",
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_artists = int(getattr(self, "max_artists", "100"))
        self.artists_scraped = 0
        self.priority_mode = getattr(self, "priority", "").lower() in ("true", "1", "yes")

    def start_requests(self):
        """
        Punto de entrada. Acepta:
        - start_url: URL directa de un artista
        - priority=true: scrapea artistas prioritarios primero, luego continua con los mas sampleados
        - Sin args: empieza por la lista de mas sampleados
        Uso: scrapy crawl artist -a priority=true
        """
        start_url = getattr(self, "start_url", "")
        if start_url:
            yield scrapy.Request(start_url, callback=self.parse_artist)
        elif self.priority_mode:
            for url in self.ARTISTAS_PRIORITARIOS:
                yield scrapy.Request(url, callback=self.parse_artist, priority=10)
            yield scrapy.Request(
                "https://www.whosampled.com/most-sampled-artists/",
                callback=self.parse_artist_list,
            )
        else:
            yield scrapy.Request(
                "https://www.whosampled.com/most-sampled-artists/",
                callback=self.parse_artist_list,
            )

    def parse_artist_list(self, response):
        """
        Parsear lista de artistas más sampleados.
        Estructura: tabla con filas <tr> que contienen link al artista.
        Columnas: ranking, nombre (link), canciones, etc.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        registrar_url(url_norm, "artist", "procesado")

        for row in response.css("table.tdata tbody tr, table.tdata tr"):
            link = row.css("td a[href]::attr(href)").get()
            if not link:
                continue

            artist_url = response.urljoin(link)
            artist_norm = normalizar_url(artist_url)

            if url_ya_procesada(artist_norm):
                logger.debug("Skip artista (ya procesado): %s", artist_norm)
                continue

            if self.artists_scraped >= self.max_artists:
                logger.info("Limite de artistas alcanzado (%d)", self.max_artists)
                return

            registrar_url(artist_norm, "artist", "pendiente")
            self.artists_scraped += 1
            yield scrapy.Request(artist_url, callback=self.parse_artist)

        # Paginación de la lista de artistas
        next_page = response.css("span.next a::attr(href)").get()
        pagina = self._pagina_actual(response)
        if next_page and pagina < self.MAX_ARTIST_PAGES and self.artists_scraped < self.max_artists:
            yield scrapy.Request(response.urljoin(next_page), callback=self.parse_artist_list)

        marcar_procesada(url_norm, body_size, tipo_pagina="artist")

    def parse_artist(self, response):
        """
        Parsear página de artista. Estructura típica:
        - Secciones: "Was Sampled in N Songs", "Contains samples of N Songs"
        - Cada sección tiene tabla con links a tracks
        - También links a /sampled/ y /samples/ del artista (paginados)
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        registrar_url(url_norm, "artist", "procesado")

        try:
            # Buscar secciones de tracks del artista
            # Las secciones típicas son divs con header + tabla de tracks
            for section in response.css(".artist-content-wrapper section, .content-wrapper section, div.sectionHeader + table, .artistContent"):
                yield from self._extraer_tracks_de_seccion(response, section)

            # Fallback: buscar todas las tablas con links a tracks
            for row in response.css("table.tdata tr"):
                yield from self._procesar_fila_track(response, row)

            # Seguir links a "View all" de samples/sampled (paginados)
            for link in response.css("a.moreButton::attr(href), a.viewAll::attr(href), .section-header a::attr(href)"):
                href = link.get()
                if not href:
                    continue
                # Solo seguir links que lleven a listas de samples/sampled del artista
                if "/samples/" in href or "/sampled/" in href:
                    full_url = response.urljoin(href)
                    full_norm = normalizar_url(full_url)
                    if not url_ya_procesada(full_norm):
                        tipo = "track_samples" if "/samples/" in href else "track_sampled"
                        registrar_url(full_norm, tipo, "pendiente")
                        yield scrapy.Request(full_url, callback=self.parse_track_list)

            marcar_procesada(url_norm, body_size, tipo_pagina="artist")

        except Exception as e:
            logger.exception("Error parseando artista %s", response.url)
            marcar_error(url_norm, str(e)[:1000])

    def parse_track_list(self, response):
        """
        Parsear lista de tracks (samples/sampled) — paginada.
        Cada fila tiene link a página de detalle de relación.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        registrar_url(url_norm, "track", "procesado")

        for row in response.css("table.tdata tr"):
            yield from self._procesar_fila_track(response, row)

        # Paginación
        next_page = response.css("span.next a::attr(href)").get()
        pagina = self._pagina_actual(response)
        if next_page and pagina < self.MAX_TRACK_PAGES:
            yield scrapy.Request(response.urljoin(next_page), callback=self.parse_track_list)

        marcar_procesada(url_norm, body_size, tipo_pagina="track")

    def _extraer_tracks_de_seccion(self, response, section):
        """Extraer links a tracks de una sección del artista."""
        for row in section.css("tr"):
            yield from self._procesar_fila_track(response, row)

    def _procesar_fila_track(self, response, row):
        """
        Procesar una fila de tabla que contiene un link a detalle de relación.
        Busca links a /sample/, /cover/, /remix/ y los delega al SampleDetailSpider.
        QK20: Cover/remix se scrape con prioridad baja (Scrapy priority=-5).
        """
        # Buscar link al detalle de la relación
        for a_tag in row.css("a[href]"):
            href = a_tag.attrib.get("href", "")
            if any(p in href for p in ["/sample/", "/cover/", "/remix/"]):
                detail_url = response.urljoin(href)
                detail_norm = normalizar_url(detail_url)

                if url_ya_procesada(detail_norm):
                    continue

                tipo_detalle = "sample_detail"
                scrapy_priority = 0
                if "/cover/" in href:
                    tipo_detalle = "cover_detail"
                    scrapy_priority = -5
                elif "/remix/" in href:
                    tipo_detalle = "remix_detail"
                    scrapy_priority = -5

                registrar_url(detail_norm, tipo_detalle, "pendiente")
                yield scrapy.Request(
                    detail_url, callback=self._parse_detail, priority=scrapy_priority,
                )
                return

        # Si no hay link directo a detalle, buscar link al track
        for a_tag in row.css("td a[href]"):
            href = a_tag.attrib.get("href", "")
            # Links de track: /{Artista}/{Track}/ (dos segmentos)
            segments = [s for s in href.strip("/").split("/") if s]
            if len(segments) == 2 and not any(p in href for p in ["/sample/", "/cover/", "/remix/", "/browse/"]):
                track_url = response.urljoin(href)
                track_norm = normalizar_url(track_url)
                if not url_ya_procesada(track_norm):
                    registrar_url(track_norm, "track", "pendiente")
                    yield scrapy.Request(track_url, callback=self.parse_track_overview)
                return

    def parse_track_overview(self, response):
        """
        Parsear la página overview de un track: /{Artista}/{Track}/
        Contiene resumen de samples y links a las sublistas.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0

        try:
            # Buscar links directos a detalles de relación en la página del track
            for row in response.css("table.tdata tr"):
                yield from self._procesar_fila_track(response, row)

            # Seguir links a subpáginas /samples/ y /sampled/
            base_url = response.url.rstrip("/")
            for suffix in ["/samples/", "/sampled/"]:
                sub_url = base_url + suffix
                sub_norm = normalizar_url(sub_url)
                if not url_ya_procesada(sub_norm):
                    tipo = "track_samples" if "/samples/" in suffix else "track_sampled"
                    registrar_url(sub_norm, tipo, "pendiente")
                    yield scrapy.Request(sub_url, callback=self.parse_track_list)

            marcar_procesada(url_norm, body_size, tipo_pagina="track")

        except Exception as e:
            logger.exception("Error parseando track %s", response.url)
            marcar_error(url_norm, str(e)[:1000])

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
