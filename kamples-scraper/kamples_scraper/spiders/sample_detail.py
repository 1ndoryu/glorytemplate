"""
Spider: Detalle de relación sample/cover/remix.

Parsea la página de detalle (/sample/{id}/..., /cover/{id}/..., /remix/{id}/...).
Extrae: canción destino, canción fuente, timings, tipo, productores, related songs.
Genera RelacionItem para el pipeline de PostgreSQL.

Selectores verificados contra HTML real (estructura.html).
"""

import logging

import scrapy

from kamples_scraper.items import RelacionItem, TrackMetadataItem
from kamples_scraper.utils.dedup import marcar_procesada, marcar_error, url_ya_procesada, registrar_url
from kamples_scraper.utils.parsers import (
    extraer_cancion_de_box,
    extraer_featuring_artists,
    extraer_metadata_track_overview,
    extraer_productores_de_box,
    extraer_whosampled_id,
    identificar_subseccion,
    normalizar_url,
    parsear_rating,
    parsear_timings,
    parsear_tipo_relacion,
)

logger = logging.getLogger(__name__)


class SampleDetailSpider(scrapy.Spider):
    name = "sample_detail"
    allowed_domains = ["whosampled.com"]

    def start_requests(self):
        """
        Puede recibir URLs via -a urls=url1,url2 o como argumento.
        También funciona como callback desde HotSamplesSpider.
        """
        urls = getattr(self, "urls", "")
        if urls:
            for url in urls.split(","):
                url = url.strip()
                if url:
                    yield scrapy.Request(url, callback=self.parse_detail)

    def parse_detail(self, response):
        """Parsear página de detalle de relación."""
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0

        try:
            item = self._extraer_relacion(response)
            if item:
                marcar_procesada(url_norm, body_size)
                yield item

                # [223A-3-F] Seguir a las overview de ambos tracks para obtener género.
                # extraer_cancion_de_box no tiene access al género (solo en track overview).
                yield from self._seguir_track_overviews(item)

                # Seguir links a related songs (cadena de samples)
                yield from self._seguir_related(response)
            else:
                logger.warning("No se pudo extraer relacion de %s", response.url)
                marcar_error(url_norm, "Extraccion fallida: datos insuficientes")

        except Exception as e:
            logger.exception("Error parseando %s", response.url)
            marcar_error(url_norm, str(e)[:1000])

    def _extraer_relacion(self, response) -> RelacionItem | None:
        """Extraer RelacionItem completo de la página de detalle."""
        # Canción destino
        dest_data = extraer_cancion_de_box(response, "#sampleWrap_dest")
        if not dest_data["nombre"]:
            return None

        # Canción fuente
        fuente_data = extraer_cancion_de_box(response, "#sampleWrap_source")
        if not fuente_data["nombre"]:
            return None

        # YouTube IDs
        dest_youtube = response.css(".embed-dest .embed-placeholder::attr(data-id)").get()
        fuente_youtube = response.css(".embed-source .embed-placeholder::attr(data-id)").get()
        dest_data["youtube_id"] = dest_youtube
        fuente_data["youtube_id"] = fuente_youtube

        # Productores
        dest_data["productores"] = extraer_productores_de_box(response, 0)
        fuente_data["productores"] = extraer_productores_de_box(response, 1)

        # Featuring artists
        dest_data["featuring"] = extraer_featuring_artists(response, "#sampleWrap_dest")
        fuente_data["featuring"] = extraer_featuring_artists(response, "#sampleWrap_source")

        # Timings
        dest_timings_raw = response.css("#sample-dest-timing::attr(data-timings)").get()
        fuente_timings_raw = response.css("#sample-source-timing::attr(data-timings)").get()
        timings_destino = parsear_timings(dest_timings_raw)
        timings_fuente = parsear_timings(fuente_timings_raw)

        # Throughout
        timing_sections = response.css(".sample-timings").getall()
        aparece_en_todo = any("(and throughout)" in s for s in timing_sections)

        # Tipo de relación y elemento
        section_title = response.css(".section-header-title::text").get("")
        tipo_relacion, tipo_elemento = parsear_tipo_relacion(section_title)

        # WhoSampled ID
        ws_id = extraer_whosampled_id(response.url)

        # Rating
        overlay_style = response.css(".ratingOverlay::attr(style)").get()
        votes_text = response.css(".ratingCount::text").get()
        votos_total, votos_promedio = parsear_rating(overlay_style, votes_text)

        item = RelacionItem(
            cancion_destino=dict(dest_data),
            cancion_fuente=dict(fuente_data),
            whosampled_id=ws_id,
            tipo_relacion=tipo_relacion,
            tipo_elemento=tipo_elemento,
            timings_destino=timings_destino,
            timings_fuente=timings_fuente,
            aparece_en_todo=aparece_en_todo,
            votos_total=votos_total,
            votos_promedio=votos_promedio,
            url_detalle=response.url,
        )

        logger.info(
            "Extraido: %s - %s -> %s - %s [%s] ws_id=%s",
            dest_data["artista"],
            dest_data["nombre"],
            fuente_data["artista"],
            fuente_data["nombre"],
            tipo_relacion,
            ws_id,
        )

        return item

    def _seguir_related(self, response):
        """
        Seguir links de secciones "Related Songs" para ampliar la cadena de samples.
        Parsear por texto del header, NUNCA por índice.
        """
        for subsection in response.css(".subsection"):
            header_html = subsection.css(".section-header-title").get("")
            tipo_sub = identificar_subseccion(header_html)

            if not tipo_sub:
                continue

            for row in subsection.css("tr"):
                link = row.css(".tdata__td2 a::attr(href)").get()
                if not link:
                    continue

                full_url = response.urljoin(link)
                norm_url = normalizar_url(full_url)

                # Solo seguir links de tipo /sample/, /cover/, /remix/
                if not any(p in link for p in ["/sample/", "/cover/", "/remix/"]):
                    continue

                if url_ya_procesada(norm_url):
                    continue

                tipo_det = "sample_detail"
                if "/cover/" in link:
                    tipo_det = "cover_detail"
                elif "/remix/" in link:
                    tipo_det = "remix_detail"

                registrar_url(norm_url, tipo_det, "pendiente")
                yield scrapy.Request(full_url, callback=self.parse_detail)

    def _seguir_track_overviews(self, item: RelacionItem):
        """
        [223A-3-F] Generar requests a las páginas overview de ambos tracks
        para extraer genre/tags/youtube_id que no están en la página de detalle.
        Solo si no fueron ya procesadas.
        """
        for cancion_data in [item["cancion_destino"], item["cancion_fuente"]]:
            ws_url = cancion_data.get("whosampled_url", "")
            if not ws_url:
                continue
            overview_url = f"https://www.whosampled.com{ws_url}"
            norm = normalizar_url(overview_url)
            if url_ya_procesada(norm):
                continue
            registrar_url(norm, "track_overview", "pendiente")
            yield scrapy.Request(
                overview_url,
                callback=self._parse_track_overview,
                priority=-1,
            )

    def _parse_track_overview(self, response):
        """
        [223A-3-F] Callback para track overview: extrae metadata (genero, tags, youtube_id)
        y emite TrackMetadataItem para actualizar la canción en BD.
        """
        url_norm = normalizar_url(response.url)
        body_size = len(response.body) if response.body else 0
        try:
            meta = extraer_metadata_track_overview(response)
            if meta["genero"] or meta["youtube_id"] or meta["spotify_id"] or meta["tags"]:
                yield TrackMetadataItem(
                    whosampled_url=meta["whosampled_url"],
                    genero=meta["genero"],
                    youtube_id=meta["youtube_id"],
                    spotify_id=meta["spotify_id"],
                    tags=meta["tags"],
                )
            marcar_procesada(url_norm, body_size, tipo_pagina="track_overview")
        except Exception as e:
            logger.exception("Error parseando overview %s", response.url)
            marcar_error(url_norm, str(e)[:500])
