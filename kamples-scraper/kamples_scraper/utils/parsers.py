"""
Utilidades de parsing para HTML de WhoSampled.

Selectores verificados contra HTML real (estructura.html).
Toda la lógica de extracción de datos del HTML centralizada aquí.
"""

import re
from urllib.parse import unquote


# --- Mapeo de textos WhoSampled a valores normalizados ---

TIPO_RELACION_MAP = {
    "direct sample": "sample",
    "sample": "sample",
    "interpolation": "interpolation",
    "cover": "cover",
    "remix": "remix",
}

TIPO_ELEMENTO_MAP = {
    "hook / riff": "hook_riff",
    "hook/riff": "hook_riff",
    "vocals / lyrics": "vocals_lyrics",
    "vocals/lyrics": "vocals_lyrics",
    "drums": "drums",
    "bass": "bass",
    "keys / synth": "keys_synth",
    "keys/synth": "keys_synth",
    "sound effect": "sound_effect",
    "multiple elements": "multiple_elements",
}


def normalizar_url(url: str) -> str:
    """
    Normalizar URL de WhoSampled para dedup.
    - Decodificar %27, %20, etc.
    - Lowercase
    - Quitar trailing slash
    - Quitar dominio (solo ruta relativa)
    """
    if not url:
        return ""
    # Quitar dominio si está presente
    url = re.sub(r"^https?://(?:www\.)?whosampled\.com", "", url)
    # Decode URL encoding
    url = unquote(url)
    # Lowercase
    url = url.lower()
    # Quitar trailing slash
    url = url.rstrip("/")
    return url


def extraer_whosampled_id(url: str) -> int | None:
    """
    Extraer ID numérico de URL de WhoSampled.
    /sample/1425265/... → 1425265
    /cover/123456/... → 123456
    /remix/789012/... → 789012
    """
    match = re.search(r"/(?:sample|cover|remix)/(\d+)/", url)
    if match:
        return int(match.group(1))
    return None


def parsear_timings(raw: str | None) -> list[int]:
    """
    Parsear el atributo data-timings.
    "4" → [4]
    "4,30,120" → [4, 30, 120]
    None → []
    """
    if not raw:
        return []
    try:
        return [int(t.strip()) for t in raw.split(",") if t.strip().isdigit()]
    except (ValueError, AttributeError):
        return []


def parsear_duracion_iso(iso: str | None) -> int | None:
    """
    Parsear duración ISO 8601 a segundos.
    "PT0H3M38S" → 218
    "PT0H6M36S" → 396
    """
    if not iso:
        return None
    match = re.match(r"PT(\d+)H(\d+)M(\d+)S", iso)
    if match:
        h, m, s = int(match.group(1)), int(match.group(2)), int(match.group(3))
        return h * 3600 + m * 60 + s
    return None


def parsear_tipo_relacion(section_title: str) -> tuple[str, str | None]:
    """
    Parsear header de sección para tipo de relación y tipo de elemento.
    "Direct Sample of Hook / Riff" → ('sample', 'hook_riff')
    "Interpolation of Vocals / Lyrics" → ('interpolation', 'vocals_lyrics')
    "Cover" → ('cover', None)
    "Remix" → ('remix', None)
    """
    if not section_title:
        return ("sample", "multiple_elements")

    title_lower = section_title.strip().lower()

    tipo_relacion = "sample"
    tipo_elemento = None

    # Detectar tipo de relación
    for key, val in TIPO_RELACION_MAP.items():
        if key in title_lower:
            tipo_relacion = val
            break

    # Detectar tipo de elemento (solo aplica a sample/interpolation)
    if tipo_relacion in ("sample", "interpolation"):
        # Buscar después de "of " en el título
        of_match = re.search(r"\bof\s+(.+)", title_lower)
        if of_match:
            elemento_text = of_match.group(1).strip()
            for key, val in TIPO_ELEMENTO_MAP.items():
                if key in elemento_text:
                    tipo_elemento = val
                    break
        if tipo_elemento is None:
            tipo_elemento = "multiple_elements"

    return (tipo_relacion, tipo_elemento)


def parsear_rating(style: str | None, count_text: str | None) -> tuple[int, float]:
    """
    Parsear rating del overlay.
    style="width: 125px" → 5.0
    "50 Votes" → 50
    Retorna (votos_total, votos_promedio)
    """
    votos_total = 0
    votos_promedio = 0.0

    if style:
        width_match = re.search(r"width:\s*(\d+)px", style)
        if width_match:
            width = int(width_match.group(1))
            votos_promedio = round(width / 25.0, 1)

    if count_text:
        count_match = re.search(r"(\d+)", count_text)
        if count_match:
            votos_total = int(count_match.group(1))

    return (votos_total, votos_promedio)


def generar_slug(artista: str, titulo: str) -> str:
    """
    Generar slug para una canción: artista-titulo.
    "Ol' Dirty Bastard" + "Brooklyn Zoo" → "ol-dirty-bastard-brooklyn-zoo"
    """
    text = f"{artista}-{titulo}"
    text = unquote(text)
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")[:550]


def generar_slug_artista(nombre: str) -> str:
    """
    Generar slug para un artista.
    "Ol' Dirty Bastard" → "ol-dirty-bastard"
    """
    text = unquote(nombre)
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")[:350]


def extraer_cancion_de_box(response, box_id: str) -> dict:
    """
    Extraer datos de una canción de un sampleEntryBox.
    box_id: '#sampleWrap_dest' o '#sampleWrap_source'
    """
    nombre = response.css(f"{box_id} .trackName span[itemprop='name']::text").get("")
    artista = response.css(f"{box_id} .sampleTrackArtists a::text").get("")
    artista_slug = response.css(f"{box_id} .sampleTrackArtists a::attr(href)").get("")
    album = response.css(f"{box_id} .release-name a::text").get()
    sello = response.css(f"{box_id} span[itemprop='recordLabel']::text").get()
    anio_raw = response.css(f"{box_id} span[itemprop='datePublished']::text").get()
    duracion_iso = response.css(f"{box_id} meta[itemprop='duration']::attr(content)").get()
    imagen = response.css(f"{box_id} meta[itemprop='image']::attr(content)").get()
    track_url = response.css(f"{box_id} .trackName::attr(href)").get("")

    anio = None
    if anio_raw:
        anio_match = re.search(r"\d{4}", anio_raw)
        if anio_match:
            anio = int(anio_match.group())

    return {
        "nombre": nombre.strip() if nombre else "",
        "artista": artista.strip() if artista else "",
        "artista_slug": normalizar_url(artista_slug),
        "album": album.strip() if album else None,
        "sello": sello.strip() if sello else None,
        "anio": anio,
        "duracion_segundos": parsear_duracion_iso(duracion_iso),
        "imagen_url": imagen,
        "whosampled_url": normalizar_url(track_url),
    }


def extraer_productores_de_box(response, box_index: int) -> list[dict]:
    """
    Extraer productores del sampleEntryBox por índice (0=dest, 1=source).
    Cada productor tiene nombre y slug de WhoSampled.
    """
    boxes = response.css(".sampleEntryBox")
    if box_index >= len(boxes):
        return []

    box = boxes[box_index]
    nombres = box.css("span[itemprop='producer'] span[itemprop='name']::text").getall()
    slugs = box.css("span[itemprop='producer'] a::attr(href)").getall()

    productores = []
    for i, nombre in enumerate(nombres):
        slug = normalizar_url(slugs[i]) if i < len(slugs) else ""
        productores.append({"nombre": nombre.strip(), "whosampled_slug": slug})

    return productores


def extraer_featuring_artists(response, box_id: str) -> list[dict]:
    """
    Extraer artistas featuring del box.
    "Jay-Z feat. The Notorious B.I.G." → primer <a> = principal, resto = featuring
    """
    links = response.css(f"{box_id} .sampleTrackArtists a")
    artistas = []
    for i, link in enumerate(links):
        nombre = link.css("::text").get("").strip()
        slug = normalizar_url(link.attrib.get("href", ""))
        rol = "principal" if i == 0 else "featuring"
        artistas.append({"nombre": nombre, "whosampled_slug": slug, "rol": rol})
    return artistas


def identificar_subseccion(header_text: str) -> str | None:
    """
    Identificar tipo de subsección por texto del header.
    NUNCA parsear por índice — el número y orden de subsecciones varía.
    """
    if not header_text:
        return None

    text = header_text.lower()

    if "other songs sampled in" in text:
        return "otros_samples_en_destino"
    if "songs that sampled" in text:
        return "sampleada_por"
    if "is a cover of" in text:
        return "fuente_es_cover_de"
    if "covers of" in text:
        return "covers_de_destino"
    if "remixes of" in text:
        return "remixes_de_destino"

    return None
