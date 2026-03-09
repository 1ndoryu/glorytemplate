"""
Tests de utilidades de parsing de WhoSampled.

Utilizan fixtures de HTML real guardados localmente.
Ejecutar: cd kamples-scraper && python -m pytest tests/ -v
"""

import os
import pytest
from scrapy.http import HtmlResponse, Request
from kamples_scraper.utils.parsers import (
    normalizar_url,
    extraer_whosampled_id,
    parsear_timings,
    parsear_duracion_iso,
    parsear_tipo_relacion,
    parsear_rating,
    generar_slug,
    generar_slug_artista,
    extraer_cancion_de_box,
    extraer_productores_de_box,
    extraer_featuring_artists,
    identificar_subseccion,
)

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def cargar_response(filename: str) -> HtmlResponse:
    """Crear HtmlResponse de Scrapy a partir de un archivo fixture."""
    filepath = os.path.join(FIXTURES_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        body = f.read()
    url = "https://www.whosampled.com/sample/1425265/Ol-Dirty-Bastard-Brooklyn-Zoo-Eddie-Harris-Exodus/"
    return HtmlResponse(
        url=url,
        request=Request(url=url),
        body=body,
        encoding="utf-8",
    )


# --- Tests de funciones puras ---

class TestNormalizarUrl:
    def test_con_dominio(self):
        url = "https://www.whosampled.com/Ol%27-Dirty-Bastard/Brooklyn-Zoo/"
        resultado = normalizar_url(url)
        assert resultado == "/ol'-dirty-bastard/brooklyn-zoo"

    def test_ruta_relativa(self):
        assert normalizar_url("/Eddie-Harris/Exodus/") == "/eddie-harris/exodus"

    def test_vacia(self):
        assert normalizar_url("") == ""

    def test_none_segura(self):
        """normalizar_url no recibe None — probar string vacío."""
        assert normalizar_url("") == ""


class TestExtraerWhosampledId:
    def test_sample_url(self):
        url = "/sample/1425265/Ol-Dirty-Bastard-Brooklyn-Zoo-Eddie-Harris-Exodus/"
        assert extraer_whosampled_id(url) == 1425265

    def test_cover_url(self):
        assert extraer_whosampled_id("/cover/55231/algo/") == 55231

    def test_remix_url(self):
        assert extraer_whosampled_id("/remix/91641/algo/") == 91641

    def test_url_sin_id(self):
        assert extraer_whosampled_id("/Eddie-Harris/Exodus/") is None


class TestParsearTimings:
    def test_simple(self):
        assert parsear_timings("4") == [4]

    def test_multiples(self):
        assert parsear_timings("4,30,120") == [4, 30, 120]

    def test_none(self):
        assert parsear_timings(None) == []

    def test_vacio(self):
        assert parsear_timings("") == []

    def test_con_espacios(self):
        assert parsear_timings("4, 30, 120") == [4, 30, 120]


class TestParsearDuracionIso:
    def test_3m38s(self):
        assert parsear_duracion_iso("PT0H3M38S") == 218

    def test_6m36s(self):
        assert parsear_duracion_iso("PT0H6M36S") == 396

    def test_none(self):
        assert parsear_duracion_iso(None) is None

    def test_invalido(self):
        assert parsear_duracion_iso("invalid") is None


class TestParsearTipoRelacion:
    def test_direct_sample_hook_riff(self):
        r, e = parsear_tipo_relacion("Direct Sample of Hook / Riff")
        assert r == "sample"
        assert e == "hook_riff"

    def test_interpolation_vocals(self):
        r, e = parsear_tipo_relacion("Interpolation of Vocals / Lyrics")
        assert r == "interpolation"
        assert e == "vocals_lyrics"

    def test_cover(self):
        r, e = parsear_tipo_relacion("Cover")
        assert r == "cover"
        assert e is None

    def test_remix(self):
        r, e = parsear_tipo_relacion("Remix")
        assert r == "remix"
        assert e is None

    def test_sample_drums(self):
        r, e = parsear_tipo_relacion("Direct Sample of Drums")
        assert r == "sample"
        assert e == "drums"

    def test_vacio(self):
        r, e = parsear_tipo_relacion("")
        assert r == "sample"
        assert e == "multiple_elements"


class TestParsearRating:
    def test_rating_5(self):
        votos, promedio = parsear_rating("width: 125px", "50 Votes")
        assert votos == 50
        assert promedio == 5.0

    def test_rating_3(self):
        votos, promedio = parsear_rating("width: 75px", "10 Votes")
        assert votos == 10
        assert promedio == 3.0

    def test_sin_datos(self):
        votos, promedio = parsear_rating(None, None)
        assert votos == 0
        assert promedio == 0.0


class TestGenerarSlug:
    def test_basico(self):
        slug = generar_slug("Ol' Dirty Bastard", "Brooklyn Zoo")
        assert slug == "ol-dirty-bastard-brooklyn-zoo"

    def test_caracteres_especiales(self):
        slug = generar_slug("Jay-Z", "99 Problems")
        assert slug == "jay-z-99-problems"


class TestGenerarSlugArtista:
    def test_basico(self):
        assert generar_slug_artista("Eddie Harris") == "eddie-harris"

    def test_con_apostrofe(self):
        assert generar_slug_artista("Ol' Dirty Bastard") == "ol-dirty-bastard"


class TestIdentificarSubseccion:
    def test_otros_samples(self):
        h = "Other songs sampled in Ol' Dirty Bastard's Brooklyn Zoo"
        assert identificar_subseccion(h) == "otros_samples_en_destino"

    def test_sampleada_por(self):
        h = "Sample chain found! Songs that sampled Ol' Dirty Bastard's Brooklyn Zoo"
        assert identificar_subseccion(h) == "sampleada_por"

    def test_fuente_es_cover(self):
        h = "Eddie Harris's Exodus is a cover of"
        assert identificar_subseccion(h) == "fuente_es_cover_de"

    def test_covers_de(self):
        h = "Covers of Ol' Dirty Bastard's Brooklyn Zoo"
        assert identificar_subseccion(h) == "covers_de_destino"

    def test_remixes_de(self):
        h = "Remixes of Ol' Dirty Bastard's Brooklyn Zoo"
        assert identificar_subseccion(h) == "remixes_de_destino"

    def test_desconocido(self):
        assert identificar_subseccion("Random text") is None

    def test_none(self):
        assert identificar_subseccion(None) is None


# --- Tests con HTML fixture real ---

class TestExtraerCancionDeBox:
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_destino(self, response):
        datos = extraer_cancion_de_box(response, "#sampleWrap_dest")
        assert datos["nombre"] == "Brooklyn Zoo"
        assert datos["artista"] == "Ol' Dirty Bastard"
        assert datos["album"] == "Return to the 36 Chambers: The Dirty Version"
        assert datos["sello"] == "Elektra"
        assert datos["anio"] == 1995
        assert datos["duracion_segundos"] == 218

    def test_fuente(self, response):
        datos = extraer_cancion_de_box(response, "#sampleWrap_source")
        assert datos["nombre"] == "Exodus"
        assert datos["artista"] == "Eddie Harris"
        assert datos["album"] == "Exodus to Jazz"
        assert datos["sello"] == "Vee Jay"
        assert datos["anio"] == 1961
        assert datos["duracion_segundos"] == 396


class TestExtraerProductoresDeBox:
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_productores_destino(self, response):
        prods = extraer_productores_de_box(response, 0)
        nombres = [p["nombre"] for p in prods]
        assert "True Master" in nombres
        assert "Ol' Dirty Bastard" in nombres

    def test_productores_fuente(self, response):
        prods = extraer_productores_de_box(response, 1)
        nombres = [p["nombre"] for p in prods]
        assert "Sid McCoy" in nombres


class TestExtraerFeaturing:
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_artista_principal_destino(self, response):
        artistas = extraer_featuring_artists(response, "#sampleWrap_dest")
        assert len(artistas) >= 1
        assert artistas[0]["rol"] == "principal"
        assert artistas[0]["nombre"] == "Ol' Dirty Bastard"

    def test_artista_principal_fuente(self, response):
        artistas = extraer_featuring_artists(response, "#sampleWrap_source")
        assert len(artistas) >= 1
        assert artistas[0]["nombre"] == "Eddie Harris"


class TestParsingHeaderSection:
    """Tests del header principal que contiene tipo de relación y rating."""
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_section_header(self, response):
        title = response.css(".section-header-title::text").get("")
        tipo, elemento = parsear_tipo_relacion(title)
        assert tipo == "sample"
        assert elemento == "hook_riff"

    def test_rating_overlay(self, response):
        style = response.css(".ratingOverlay::attr(style)").get()
        count = response.css(".ratingCount::text").get()
        votos, promedio = parsear_rating(style, count)
        assert votos == 50
        assert promedio == 5.0


class TestParsingTimings:
    """Tests de extracción de timings de la página."""
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_timing_destino(self, response):
        raw = response.css("#sample-dest-timing::attr(data-timings)").get()
        assert parsear_timings(raw) == [4]

    def test_timing_fuente(self, response):
        raw = response.css("#sample-source-timing::attr(data-timings)").get()
        assert parsear_timings(raw) == [30]


class TestRelatedSections:
    """Tests de secciones de Related Songs."""
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_todas_las_subsecciones(self, response):
        headers = response.css(".subsection .section-header-title::text").getall()
        # Hay headers que mezclan texto y <a>, así que recoger todo el texto
        headers_full = []
        for sub_header in response.css(".subsection .section-header-title"):
            full_text = "".join(sub_header.css("*::text").getall())
            headers_full.append(full_text.strip())

        tipos = [identificar_subseccion(h) for h in headers_full]
        assert "otros_samples_en_destino" in tipos
        assert "sampleada_por" in tipos
        assert "fuente_es_cover_de" in tipos
        assert "covers_de_destino" in tipos
        assert "remixes_de_destino" in tipos

    def test_related_songs_count(self, response):
        """Verificar que se detectan related songs en la tabla."""
        rows = response.css(".subsection .tdata tbody tr")
        # El fixture tiene al menos 8 related songs total
        assert len(rows) >= 8


class TestYoutubeIdExtraction:
    """Test de extracción de YouTube ID de los embeds."""
    @pytest.fixture
    def response(self):
        return cargar_response("sample_detail_page.html")

    def test_youtube_destino(self, response):
        yt_id = response.css(".embed-dest .embed-placeholder::attr(data-id)").get()
        assert yt_id == "81VrSMrS5F8"

    def test_youtube_fuente(self, response):
        yt_id = response.css(".embed-source .embed-placeholder::attr(data-id)").get()
        assert yt_id == "-RX2WPN3oYI"
