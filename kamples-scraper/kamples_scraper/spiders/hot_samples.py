"""
Spider: Hot Samples / Hot Covers / Hot Remixes (diario).

Scrapea las 3 listas hot de WhoSampled (5 páginas c/u).
Cada entry tiene link a la página de detalle de la relación.
Delega al spider de detalle para extraer toda la información.

Selectores verificados contra HTML real (estructura.html).
"""

import logging

import scrapy

from kamples_scraper.utils.dedup import url_ya_procesada, registrar_url, marcar_procesada, marcar_error
from kamples_scraper.utils.parsers import normalizar_url, extraer_whosampled_id

logger = logging.getLogger(__name__)


class HotSamplesSpider(scrapy.Spider):
    name = "hot_samples"
    allowed_domains = ["whosampled.com"]

    start_urls = [
        "https://www.whosampled.com/hot-samples/",
        "https://www.whosampled.com/hot-covers/",
        "https://www.whosampled.com/hot-remixes/",
    ]

    # Máximo 5 páginas por lista (20 entries/página)
    MAX_PAGES = 5

    def parse(self, response):
        """
        Parsear lista hot-samples/covers/remixes.
        Cada entry: <li class="listEntry sampleEntry chartsEntry">
        """
        url_norm = normalizar_url(response.url)
        tipo_pagina = self._tipo_pagina(response.url)
        body_size = len(response.body) if response.body else 0

        registrar_url(url_norm, tipo_pagina, "procesado")

        entries = response.css("li.listEntry")
        logger.info("Pagina %s: %d entries encontrados", response.url, len(entries))

        for entry in entries:
            # Link al detalle (en span.sampleLink > a)
            detail_href = entry.css("span.sampleLink a::attr(href)").get()
            if not detail_href:
                continue

            detail_url = response.urljoin(detail_href)
            detail_norm = normalizar_url(detail_url)

            if url_ya_procesada(detail_norm):
                logger.debug("Skip (ya procesada): %s", detail_norm)
                continue

            # Determinar tipo de detalle por la URL
            tipo_detalle = self._tipo_detalle(detail_href)
            registrar_url(detail_norm, tipo_detalle, "pendiente")

            yield scrapy.Request(
                detail_url,
                callback=self.parse_detail,
                meta={"tipo_detalle": tipo_detalle},
            )

        # Paginación
        pagina_actual = self._pagina_actual(response)
        if pagina_actual < self.MAX_PAGES:
            next_page = response.css("span.next a::attr(href)").get()
            if next_page:
                yield scrapy.Request(response.urljoin(next_page), callback=self.parse)

        marcar_procesada(url_norm, body_size)

    def parse_detail(self, response):
        """
        Parsear página de detalle de relación.
        Delegado desde SampleDetailSpider para reutilizar la lógica.
        """
        from kamples_scraper.spiders.sample_detail import SampleDetailSpider

        spider = SampleDetailSpider()
        yield from spider.parse_detail(response)

    def _tipo_pagina(self, url: str) -> str:
        """Determinar tipo_pagina para scraping_log."""
        if "/hot-covers" in url:
            return "hot_covers"
        if "/hot-remixes" in url:
            return "hot_remixes"
        return "hot_samples"

    def _tipo_detalle(self, href: str) -> str:
        """Determinar tipo de detalle por el path."""
        if "/cover/" in href:
            return "cover_detail"
        if "/remix/" in href:
            return "remix_detail"
        return "sample_detail"

    def _pagina_actual(self, response) -> int:
        """Extraer número de página actual de la paginación."""
        current = response.css("span.curr::text").get()
        if current and current.isdigit():
            return int(current)
        return 1
