"""
Spider: BrowseYear — cobertura sistemática por año/década.

Navega las páginas de browse por año de WhoSampled para descubrir
tracks y relaciones de samples de forma amplia.

Uso:
    scrapy crawl browse_year
    scrapy crawl browse_year -a start_year=2020 -a end_year=2025
    scrapy crawl browse_year -a start_year=1990 -a end_year=1999

Selectores basados en la estructura pública de WhoSampled.
"""

import logging
from datetime import datetime

import scrapy

from kamples_scraper.utils.dedup import url_ya_procesada, registrar_url, marcar_procesada, marcar_error
from kamples_scraper.utils.parsers import normalizar_url

logger = logging.getLogger(__name__)


class BrowseYearSpider(scrapy.Spider):
    name = "browse_year"
    allowed_domains = ["whosampled.com"]

    MAX_PAGES_POR_ANO = 10

    CATEGORIAS = ["samples", "covered", "remixed"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        anio_actual = datetime.now().year
        self.start_year = int(getattr(self, "start_year", str(anio_actual - 5)))
        self.end_year = int(getattr(self, "end_year", str(anio_actual)))
        self.categoria = getattr(self, "categoria", "samples")

        if self.categoria not in self.CATEGORIAS:
            logger.warning("Categoria '%s' no válida, usando 'samples'", self.categoria)
            self.categoria = "samples"

    def start_requests(self):
        """
        Genera requests para cada año en el rango configurado.
        URL pattern: /browse/year/{YYYY}/{categoria}/
        """
        for anio in range(self.start_year, self.end_year + 1):
            url = f"https://www.whosampled.com/browse/year/{anio}/{self.categoria}/"
            url_norm = normalizar_url(url)
            if not url_ya_procesada(url_norm):
                registrar_url(url_norm, "browse_year", "pendiente")
                yield scrapy.Request(url, callback=self.parse_year_page, cb_kwargs={"anio": anio})
            else:
                logger.info("Año %d ya procesado, skip", anio)

    def parse_year_page(self, response, anio=0):
        """
        Parsear página de browse por año.
        Estructura: lista de tracks con conteo de samples.
        Cada entrada tiene link al track o directamente al detalle.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        registrar_url(url_norm, "browse_year", "procesado")

        try:
            entries_found = 0

            # Estructura tipo lista: entradas individuales con link
            for entry in response.css("div.listEntry, li.listEntry"):
                link = self._extraer_link_relevante(entry)
                if link:
                    yield from self._seguir_link(response, link)
                    entries_found += 1

            # Estructura tipo tabla
            for row in response.css("table.tdata tr"):
                link = self._extraer_link_relevante(row)
                if link:
                    yield from self._seguir_link(response, link)
                    entries_found += 1

            # Fallback: cualquier link a track (2 segmentos en URL)
            if entries_found == 0:
                for a_tag in response.css("a.trackName[href], td a[href]"):
                    href = a_tag.attrib.get("href", "")
                    segments = [s for s in href.strip("/").split("/") if s]
                    if len(segments) == 2 and not any(p in href for p in ["/browse/", "/most-", "/sample/", "/cover/", "/remix/"]):
                        yield from self._seguir_link(response, href)
                        entries_found += 1

            # Paginación
            next_page = response.css("span.next a::attr(href)").get()
            pagina = self._pagina_actual(response)
            if next_page and pagina < self.MAX_PAGES_POR_ANO:
                yield scrapy.Request(
                    response.urljoin(next_page),
                    callback=self.parse_year_page,
                    cb_kwargs={"anio": anio},
                )

            logger.info("Browse year %d pag %d — %d entradas", anio, pagina, entries_found)
            marcar_procesada(url_norm, body_size)

        except Exception as e:
            logger.exception("Error parseando browse year %d: %s", anio, response.url)
            marcar_error(url_norm, str(e)[:1000])

    def _extraer_link_relevante(self, selector):
        """
        Buscar el link más relevante en una entrada.
        Prioridad: detalle de relación > link de track.
        """
        # Primero: links directos a detalles
        for patron in ["a[href*='/sample/']", "a[href*='/cover/']", "a[href*='/remix/']"]:
            link = selector.css(f"{patron}::attr(href)").get()
            if link:
                return link

        # Segundo: links a tracks (dos segmentos)
        for a_tag in selector.css("a[href]"):
            href = a_tag.attrib.get("href", "")
            segments = [s for s in href.strip("/").split("/") if s]
            if len(segments) == 2 and not any(p in href for p in ["/browse/", "/most-"]):
                return href

        return None

    def _seguir_link(self, response, href):
        """Clasificar link y crear request apropiado."""
        full_url = response.urljoin(href)
        full_norm = normalizar_url(full_url)

        if url_ya_procesada(full_norm):
            return

        # Links a detalles de relación → delegar a SampleDetailSpider
        if any(p in href for p in ["/sample/", "/cover/", "/remix/"]):
            tipo = "sample_detail"
            if "/cover/" in href:
                tipo = "cover_detail"
            elif "/remix/" in href:
                tipo = "remix_detail"
            registrar_url(full_norm, tipo, "pendiente")
            yield scrapy.Request(full_url, callback=self._parse_detail)
        else:
            # Link a track → scrapearlo para descubrir sus samples
            registrar_url(full_norm, "track", "pendiente")
            yield scrapy.Request(full_url, callback=self._parse_track_overview)

    def _parse_track_overview(self, response):
        """Parsear overview de track y seguir a sublistas."""
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0

        try:
            # Buscar detalles de relación directos
            for row in response.css("table.tdata tr"):
                for a_tag in row.css("a[href]"):
                    href = a_tag.attrib.get("href", "")
                    if any(p in href for p in ["/sample/", "/cover/", "/remix/"]):
                        detail_url = response.urljoin(href)
                        detail_norm = normalizar_url(detail_url)
                        if not url_ya_procesada(detail_norm):
                            tipo = "sample_detail"
                            if "/cover/" in href:
                                tipo = "cover_detail"
                            elif "/remix/" in href:
                                tipo = "remix_detail"
                            registrar_url(detail_norm, tipo, "pendiente")
                            yield scrapy.Request(detail_url, callback=self._parse_detail)
                        break

            marcar_procesada(url_norm, body_size)

        except Exception as e:
            logger.exception("Error en track overview %s", response.url)
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
