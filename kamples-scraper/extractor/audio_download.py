"""
Descarga de audio desde multiples fuentes con fallback inteligente.

Prioridad (timing-aware):
1. SoundCloud API v2 (gratis, tracks completos 128kbps, sin auth)
2. YouTube ID local (sin proxy, gratis)
3. Deezer preview (30s, gratis, para timing <= 30s)
4. YouTube search local
5. Spotify ID (spotdl)
6. Spotify search por nombre

YouTube (yt-dlp nightly 2026.03.11+, verificado manualmente):
- Estrategia 1 (sin cookies): yt-dlp auto-selecciona android_vr como cliente
  primario. Funciona para contenido publico sin restricciones.
- Estrategia 2 (con cookies): para contenido restringido (edad, login).
  yt-dlp usa tv_downgraded/web/web_safari (android_vr se descarta con cookies).
- NOTA: tv_embedded fue ELIMINADO de yt-dlp 2026.03.03 (silently skipped).
- NOTA: android_vr NO soporta cookies — yt-dlp lo rechaza con warning.
- NOTA GVS (junio 2026): YouTube GVS experiment invalida PO tokens de bgutil
  (1.3.1). Se omite web+fetch_pot hasta que bgutil actualice.

Deezer API:
- Gratis, sin auth. 30s preview MP3 128kbps.
- Catalogo 90M+ tracks. Cobertura excelente mainstream.
- Limitacion: solo 30s desde ~inicio de la cancion, sin control de seccion.

Proxy DataImpulse:
- Residencial rotativo gw.dataimpulse.com:823, $1/GB.
- ~33% exito por intento (IP rota entre metadata/download en googlevideo CDN).
- Con 8 retries: ~95% exito. Cada retry fallido ~100KB (solo metadata).

Spotify: spotdl como fallback final.
"""

import dataclasses
import json
import logging
import os
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

from extractor.groq_validator import validar_match as _groq_validar, habilitado as _groq_habilitado

logger = logging.getLogger(__name__)


@dataclasses.dataclass
class ResultadoDescarga:
    """Resultado de una descarga con metadata de la fuente."""
    ruta: str
    metodo: str  # soundcloud, youtube_local, deezer, youtube_search, spotify, spotify_search
    fuente_url: str | None = None
    fuente_titulo: str | None = None
    fuente_artista: str | None = None
    # QQ121: Fuentes que se intentaron sin exito antes de la exitosa
    fuentes_intentadas: list[str] = dataclasses.field(default_factory=list)


class SoundCloudAuthError(Exception):
    """SoundCloud devolvio error de autenticacion (ban o token vencido).

    Cuando se lanza esta excepcion, el pipeline debe detenerse inmediatamente
    para evitar saturar SoundCloud con requests fallidos y permitir intervencion
    humana (renovar token, verificar estado de la cuenta).
    """
    pass

# Patron de validacion para Spotify IDs (alfanumerico, 10-30 chars)
_SPOTIFY_ID_RE = re.compile(r"^[A-Za-z0-9]{10,30}$")

# Configuracion SoundCloud
_SOUNDCLOUD_ENABLED = os.getenv("SOUNDCLOUD_ENABLED", "true").lower() == "true"
# Duracion minima en ms para considerar un track completo (no snippet/preview)
_SOUNDCLOUD_MIN_DURATION_MS = 60_000
# Duracion maxima en ms — compilaciones/DJ sets suelen superar este limite.
# A 128kbps: 15min = ~14MB. Canciones reales rara vez superan 12 min.
_SOUNDCLOUD_MAX_DURATION_MS = 720_000
# client_id se extrae del frontend y se cachea por sesion
_soundcloud_client_id: str | None = None
# OAuth token de SoundCloud GO (suscripcion de pago).
# Desbloquea tracks con policy='SNIP'. Obtener desde DevTools despues de login en
# soundcloud.com: Application -> Cookies -> oauth_token (formato: 2-000000-xxxxx).
# O desde localStorage: soundcloud.com -> DevTools -> Application -> localStorage -> oauth_token
_soundcloud_oauth_token: str | None = os.getenv("SOUNDCLOUD_OAUTH_TOKEN", "").strip() or None
# Regex para extraer client_id de los scripts JS de SoundCloud
_SOUNDCLOUD_CLIENT_ID_RE = re.compile(r'client_id\s*[:=]\s*["\']([a-zA-Z0-9]{20,})["\']')
# Headers para requests HTTP a SoundCloud y Deezer
_HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
}

# Configuracion Deezer
_DEEZER_PREVIEW_ENABLED = os.getenv("DEEZER_PREVIEW_ENABLED", "true").lower() == "true"
_DEEZER_MAX_TIMING = int(os.getenv("DEEZER_PREVIEW_MAX_TIMING", "30"))

# Directorio raiz del scraper (para resolver paths de cookies)
_SCRAPER_ROOT = os.path.dirname(os.path.dirname(__file__))


def _resolver_cookies_youtube() -> str | None:
    """Resuelve ruta a cookies de YouTube. Prioridad: cookies_youtube.txt > cookies.txt (legacy)."""
    for nombre in ("cookies_youtube.txt", "cookies.txt"):
        ruta = os.path.join(_SCRAPER_ROOT, nombre)
        if os.path.exists(ruta):
            return ruta
    return None


def _resolver_cookies_soundcloud() -> str | None:
    """Resuelve ruta a cookies de SoundCloud para yt-dlp (si se usa como fallback)."""
    ruta = os.path.join(_SCRAPER_ROOT, "cookies_soundcloud.txt")
    if os.path.exists(ruta):
        return ruta
    return None


def _construir_proxy_url() -> str | None:
    """
    Construir URL de proxy desde variables .env del proyecto.
    Formato: http://USER:PASS@HOST:PORT
    Retorna None si no hay proxy configurado.
    """
    host = os.getenv("PROXY_HOST", "")
    port = os.getenv("PROXY_PORT", "")
    user = os.getenv("PROXY_USER", "")
    password = os.getenv("PROXY_PASSWORD", "")

    if not host or not port:
        return None

    if user and password:
        return f"http://{user}:{password}@{host}:{port}"
    return f"http://{host}:{port}"


def _resolver_ejecutable(nombre: str) -> str | None:
    """
    Buscar ejecutable en el mismo directorio que sys.executable (venv/Scripts),
    con fallback a shutil.which (PATH global).
    Resuelve el problema de subprocess no encontrar binarios del venv
    cuando el venv no esta activado en el shell.
    """
    directorio_python = os.path.dirname(sys.executable)
    candidatos = [
        os.path.join(directorio_python, f"{nombre}.exe"),
        os.path.join(directorio_python, nombre),
    ]
    for ruta in candidatos:
        if os.path.isfile(ruta):
            logger.debug("Ejecutable %s encontrado en venv: %s", nombre, ruta)
            return ruta

    ruta_global = shutil.which(nombre)
    if ruta_global:
        logger.debug("Ejecutable %s encontrado en PATH: %s", nombre, ruta_global)
        return ruta_global

    logger.error(
        "Ejecutable '%s' no encontrado ni en venv (%s) ni en PATH. Instalar: pip install %s",
        nombre, directorio_python, nombre,
    )
    return None


def descargar_audio(
    youtube_id: str | None,
    output_dir: str | None = None,
    spotify_id: str | None = None,
    artista: str | None = None,
    titulo: str | None = None,
    timing_seg: int = 0,
) -> ResultadoDescarga | None:
    """
    Descargar audio con fallback multi-fuente.

    Prioridad:
    1. SoundCloud (track completo, gratis, 128kbps)
    2. YouTube local (gratis si IP no flaggeada)
    3. Deezer preview (30s, gratis — solo si timing <= 30s)
    4. YouTube search (busca subidas alternativas)
    5. Spotify ID (spotdl)
    6. Spotify search por nombre

    Args:
        youtube_id: ID del video de YouTube (ej: '81VrSMrS5F8')
        output_dir: directorio para el archivo temporal (default: tempdir del sistema)
        spotify_id: ID del track de Spotify como fallback
        artista: nombre del artista (para busqueda por nombre)
        titulo: titulo del track (para busqueda por nombre)
        timing_seg: segundo donde WhoSampled indica el sample. Determina si
            Deezer preview es viable (solo cubre primeros 30s de la cancion).

    Returns:
        ResultadoDescarga con ruta al archivo y metadata de fuente, o None si falla.

    Raises:
        SoundCloudAuthError: Si SoundCloud devuelve 401/403 (ban o token vencido).
            El pipeline debe detenerse para intervencion humana.
    """
    if output_dir is None:
        output_dir = os.getenv("AUDIO_TMP_DIR", tempfile.gettempdir())
    os.makedirs(output_dir, exist_ok=True)

    deezer_viable = (
        _DEEZER_PREVIEW_ENABLED
        and timing_seg <= _DEEZER_MAX_TIMING
        and artista
        and titulo
    )

    # QQ121: Trackear fuentes intentadas para registrar en metadata
    intentadas: list[str] = []

    # 1. SoundCloud (track completo, gratis, sin auth)
    if _SOUNDCLOUD_ENABLED and artista and titulo:
        resultado = _descargar_soundcloud(artista, titulo, output_dir)
        if resultado:
            resultado.fuentes_intentadas = intentadas
            return resultado
        intentadas.append("soundcloud")

    # 2. YouTube local (gratis, IP del VPS puede estar flaggeada — sin proxy para
    #    ahorrar bandwidth. Si falla, SoundCloud/Deezer cubren la mayoria de tracks)
    if youtube_id and len(youtube_id) <= 20:
        ruta = _descargar_youtube(youtube_id, output_dir)
        if ruta:
            res = ResultadoDescarga(
                ruta=ruta,
                metodo="youtube_local",
                fuente_url=f"https://www.youtube.com/watch?v={youtube_id}",
                fuentes_intentadas=intentadas,
            )
            return res
        intentadas.append("youtube_local")
        logger.warning(
            "YouTube local fallo para %s, continuando con fuentes alternativas",
            youtube_id,
        )

    # 3. Deezer preview (30s, gratis — solo si timing <= 30s)
    if deezer_viable:
        ruta = _descargar_deezer_preview(artista, titulo, output_dir)
        if ruta:
            return ResultadoDescarga(
                ruta=ruta,
                metodo="deezer",
                fuente_url=None,
                fuente_titulo=titulo,
                fuente_artista=artista,
                fuentes_intentadas=intentadas,
            )
        intentadas.append("deezer")

    # 4. YouTube search (busca subidas alternativas sin restricciones DRM — sin proxy)
    if artista and titulo:
        ruta = _descargar_youtube_search(artista, titulo, output_dir)
        if ruta:
            return ResultadoDescarga(
                ruta=ruta,
                metodo="youtube_search",
                fuente_url=None,
                fuente_titulo=titulo,
                fuente_artista=artista,
                fuentes_intentadas=intentadas,
            )
        intentadas.append("youtube_search")

    # 5. Spotify por ID
    if spotify_id and _SPOTIFY_ID_RE.match(spotify_id):
        ruta = _descargar_spotify(spotify_id, output_dir)
        if ruta:
            return ResultadoDescarga(
                ruta=ruta,
                metodo="spotify",
                fuente_url=f"https://open.spotify.com/track/{spotify_id}",
                fuentes_intentadas=intentadas,
            )
        intentadas.append("spotify")
        logger.warning("Spotify por ID fallo para %s", spotify_id)

    # 6. Spotify por nombre
    if artista and titulo:
        ruta = _descargar_spotify_por_nombre(artista, titulo, output_dir)
        if ruta:
            return ResultadoDescarga(
                ruta=ruta,
                metodo="spotify_search",
                fuente_url=None,
                fuente_titulo=titulo,
                fuente_artista=artista,
                fuentes_intentadas=intentadas,
            )
        intentadas.append("spotify_search")

    logger.error(
        "Sin fuente de audio: youtube_id=%s, spotify_id=%s, artista=%s, timing=%ds",
        youtube_id, spotify_id, artista, timing_seg,
    )
    return None


def _obtener_soundcloud_client_id() -> str | None:
    """
    Extraer client_id dinamico del frontend de SoundCloud.

    SoundCloud embebe el client_id en sus scripts JS. Se cachea a nivel de modulo
    para reutilizar durante toda la sesion del pipeline.
    Si falla (SoundCloud caido, cambio de estructura), retorna None.
    """
    global _soundcloud_client_id
    if _soundcloud_client_id:
        return _soundcloud_client_id

    try:
        req = urllib.request.Request("https://soundcloud.com/", headers=_HTTP_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        scripts = re.findall(r'src="(https://a-v2\.sndcdn\.com/assets/[^"]+\.js)"', html)
        if not scripts:
            logger.warning("SoundCloud: no se encontraron scripts JS en el frontend")
            return None

        # client_id suele estar en los ultimos scripts cargados
        for script_url in scripts[-3:]:
            try:
                req = urllib.request.Request(script_url, headers=_HTTP_HEADERS)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    js = resp.read().decode("utf-8", errors="replace")
                matches = _SOUNDCLOUD_CLIENT_ID_RE.findall(js)
                if matches:
                    _soundcloud_client_id = matches[0]
                    logger.debug("SoundCloud client_id obtenido: %s", _soundcloud_client_id)
                    return _soundcloud_client_id
            except (urllib.error.URLError, OSError):
                continue

        logger.warning("SoundCloud: client_id no encontrado en ningun script JS")
        return None

    except (urllib.error.URLError, OSError) as e:
        logger.warning("SoundCloud: error obteniendo client_id: %s", e)
        return None


def _score_relevancia_soundcloud(track: dict, artista: str, titulo: str) -> int:
    """
    Puntua la relevancia de un resultado de SoundCloud respecto a la busqueda original.

    Cuenta palabras significativas (>3 chars, no stop-words) que aparecen tanto en
    el query como en el titulo/artista del resultado. Un score=0 indica que el
    resultado probablemente no es el track buscado (ej: compilacion, DJ set).

    Retorna int >= 0. Mayor = mas relevante.
    """
    stop_words = {
        "the", "and", "for", "with", "from", "this", "that", "have", "will",
        "your", "are", "was", "were", "not", "but", "each",
    }

    def tokens(text: str) -> set[str]:
        words = re.findall(r"\w+", text.lower())
        return {w for w in words if len(w) > 3 and w not in stop_words}

    track_title_tokens = tokens(track.get("title", ""))
    user = track.get("user", {})
    track_artist_tokens = tokens(
        user.get("username", "") + " " + user.get("full_name", "")
    )

    titulo_tokens = tokens(titulo)
    title_score = len(titulo_tokens & track_title_tokens)
    # El artista coincidente vale doble: indica match directo
    artist_score = len(tokens(artista) & track_artist_tokens) * 2

    # Si el titulo tiene palabras significativas (>3 chars) y NINGUNA aparece en
    # el resultado, rechazar aunque el artista coincida. Previene descargar
    # otra cancion del mismo artista (ej: "Matrix" -> "Salt Peanuts" de Dizzy Gillespie).
    if titulo_tokens and title_score == 0:
        return 0

    return title_score + artist_score


# Terminos en el titulo del track que indican que NO es la cancion original.
# Se usa coincidencia de palabra completa (word boundary) para evitar falsos positivos
# (ej: "recovery" no debe matchear "cover", "format" no debe matchear "remix").
_SOUNDCLOUD_TITULO_EXCLUIDO_RE = re.compile(
    r"\b("
    r"remix|remixed|rmx|re-mix"
    r"|cover|covered|coverversion|cover version"
    r"|full album|full lp|full ep|complete album|side [ab]"
    r"|mixtape|mix tape|megamix|mega mix"
    r"|mashup|mash-up|mash up|bootleg"
    r"|dj set|djset|live set|live mix|radio mix|radio edit"
    r"|compilation|compil|best of|greatest hits|collection|recopilacion"
    r"|medley|megalo|nonstop|non-stop|non stop"
    r"|tribute|homenaje|karaoke"
    r"|slowed|reverb|sped up|nightcore|8d audio"
    r"|reloop|relooped"
    r"|edit"
    r")\b",
    re.IGNORECASE,
)


def _titulo_soundcloud_es_valido(track: dict, titulo_buscado: str) -> bool:
    """
    Retorna False si el titulo del track contiene terminos que indican
    que no es la cancion original (remix, cover, full album, reloop, edit, etc.).

    Excepcion: si el titulo buscado tambien contiene el termino (ej: busqueda
    de "Jazzy Jeff Remix"), no se descarta — el usuario quiere ese tipo de track.
    """
    track_title = track.get("title", "")
    match = _SOUNDCLOUD_TITULO_EXCLUIDO_RE.search(track_title)
    if not match:
        return True

    # El termino encontrado esta en el titulo buscado originalmente -> es intencional
    termino = match.group(1).lower()
    if termino in titulo_buscado.lower():
        return True

    return False


def _soundcloud_request_headers() -> dict:
    """
    Headers para requests a la API de SoundCloud.
    Incluye Authorization: OAuth si hay token GO configurado,
    lo que desbloquea tracks con policy='SNIP' (SoundCloud GO).

    El token se lee en cada llamada (no a nivel de modulo) para que
    funcione aunque load_dotenv() se llame despues de importar este modulo.
    """
    headers = dict(_HTTP_HEADERS)
    token = os.getenv("SOUNDCLOUD_OAUTH_TOKEN", "").strip() or None
    if token:
        headers["Authorization"] = f"OAuth {token}"
    return headers


def _descargar_soundcloud(artista: str, titulo: str, output_dir: str) -> ResultadoDescarga | None:
    """
    Buscar y descargar track completo desde SoundCloud API v2 (gratis, sin auth).

    Flujo:
    1. Obtener client_id dinamico (cacheado por sesion)
    2. Buscar track por artista + titulo
    3. Filtrar snippets (<60s) y seleccionar mejor match
    4. Validacion IA con Groq (si configurado)
    5. Elegir transcoding: progressive MP3 > HLS MP3 > HLS AAC
    6. Descargar: progressive (URL directa) o HLS (m3u8 + segmentos)

    Retorna ResultadoDescarga con ruta al MP3 y metadata SC, o None si falla.

    Raises:
        SoundCloudAuthError: Si SC devuelve HTTP 401/403 (ban o token vencido).
    """
    client_id = _obtener_soundcloud_client_id()
    if not client_id:
        return None

    nombre_seguro = re.sub(r"[^\w\s-]", "", f"{artista}_{titulo}")[:80].strip()
    output_path = os.path.join(output_dir, f"sc_{nombre_seguro}.mp3")

    if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
        logger.debug("Audio SoundCloud ya en cache: %s", output_path)
        return ResultadoDescarga(ruta=output_path, metodo="soundcloud")

    # Buscar track — con GO (OAuth token) se amplian resultados y se incluyen tracks GO
    query = f"{artista} {titulo}"
    tiene_oauth = bool(os.getenv("SOUNDCLOUD_OAUTH_TOKEN", "").strip())
    search_limit = 10 if tiene_oauth else 5
    search_url = (
        f"https://api-v2.soundcloud.com/search/tracks"
        f"?q={urllib.parse.quote(query)}&client_id={client_id}&limit={search_limit}"
    )
    sc_headers = _soundcloud_request_headers()
    try:
        req = urllib.request.Request(search_url, headers=sc_headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise SoundCloudAuthError(
                f"SoundCloud search HTTP {e.code}: probable ban de cuenta o token vencido. "
                f"Verificar SOUNDCLOUD_OAUTH_TOKEN en .env."
            )
        logger.warning("SoundCloud search fallo para '%s': HTTP %d", query, e.code)
        return None
    except (urllib.error.URLError, json.JSONDecodeError, OSError) as e:
        logger.warning("SoundCloud search fallo para '%s': %s", query, e)
        return None

    tracks = data.get("collection", [])
    if not tracks:
        logger.debug("SoundCloud: sin resultados para '%s'", query)
        return None

    # Filtrar por policy: sin token GO, descartar tracks que requieren suscripcion.
    # policy='SNIP' = solo preview 30s hasta que el usuario pague GO.
    # Con OAuth token activo se incluyen (GO los desbloquea).
    if not tiene_oauth:
        go_tracks = [t for t in tracks if t.get("policy") not in ("ALLOW", None, "")]
        if go_tracks:
            logger.info(
                "SoundCloud: %d track(s) GO/bloqueado(s) descartados para '%s' "
                "(configurar SOUNDCLOUD_OAUTH_TOKEN en .env para acceder con tu suscripcion GO): %s",
                len(go_tracks), query,
                [t.get("title", "?") for t in go_tracks],
            )
        tracks = [t for t in tracks if t.get("policy") in ("ALLOW", None, "")]

    # Filtrar por duracion: excluir snippets (<60s) y compilaciones/DJ sets (>12min).
    # Un track de 2h a 128kbps ocupa ~108 MB — causa OOM y uso extremo de disco.
    tracks_validos = [
        t for t in tracks
        if _SOUNDCLOUD_MIN_DURATION_MS <= t.get("duration", 0) <= _SOUNDCLOUD_MAX_DURATION_MS
    ]
    if not tracks_validos:
        logger.debug(
            "SoundCloud: sin tracks en rango de duracion valido para '%s' "
            "(resultados: %d, todos fuera de [%ds, %ds])",
            query, len(tracks),
            _SOUNDCLOUD_MIN_DURATION_MS // 1000,
            _SOUNDCLOUD_MAX_DURATION_MS // 1000,
        )
        return None

    # Excluir tracks cuyo titulo delata que no son la cancion original:
    # remixes, covers, full albums, compilaciones, medleys, karaoke, etc.
    excluidos = [t for t in tracks_validos if not _titulo_soundcloud_es_valido(t, titulo)]
    if excluidos:
        logger.debug(
            "SoundCloud: descartados %d resultado(s) por titulo no-original para '%s': %s",
            len(excluidos), query, [t.get("title", "?") for t in excluidos],
        )
    tracks_validos = [t for t in tracks_validos if _titulo_soundcloud_es_valido(t, titulo)]
    if not tracks_validos:
        logger.debug("SoundCloud: todos los resultados descartados por titulo no-original para '%s'", query)
        return None

    # Ordenar por relevancia: preferir tracks cuyo titulo/artista comparte
    # palabras con la busqueda. Evita descargar compilaciones sin relacion.
    tracks_validos.sort(key=lambda t: _score_relevancia_soundcloud(t, artista, titulo), reverse=True)

    # Seleccionar mejor track con score + validacion Groq IA (opcional).
    # Itera candidatos: si el top score pasa Groq, se usa. Si no, intenta el siguiente.
    groq_activo = _groq_habilitado()
    track = None
    for candidato in tracks_validos[:5]:
        score = _score_relevancia_soundcloud(candidato, artista, titulo)
        if score == 0:
            continue

        if groq_activo:
            sc_title = candidato.get("title", "")
            sc_artist = candidato.get("user", {}).get("username", "")
            if not _groq_validar(artista, titulo, sc_artist, sc_title):
                logger.info(
                    "Groq rechazo: '%s - %s' no es '%s - %s' (score=%d)",
                    sc_artist, sc_title, artista, titulo, score,
                )
                continue

        track = candidato
        break

    if not track:
        titulos_encontrados = [t.get("title", "?") for t in tracks_validos[:3]]
        logger.warning(
            "SoundCloud: ningun resultado paso validacion para '%s' -> %s. "
            "Abortando para evitar descarga incorrecta.",
            query, titulos_encontrados,
        )
        return None

    transcodings = track.get("media", {}).get("transcodings", [])
    tc = _elegir_transcoding_soundcloud(transcodings)
    if not tc:
        logger.debug(
            "SoundCloud: sin transcoding valido para '%s' (track: %s)",
            query, track.get("title", "?"),
        )
        return None

    # Resolver stream URL real
    tc_url = tc.get("url", "")
    if not tc_url:
        return None

    try:
        stream_api_url = f"{tc_url}?client_id={client_id}"
        req = urllib.request.Request(stream_api_url, headers=sc_headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            stream_data = json.loads(resp.read().decode("utf-8"))
        stream_url = stream_data.get("url", "")
        if not stream_url:
            logger.warning("SoundCloud: URL de stream vacia para '%s'", query)
            return None
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            raise SoundCloudAuthError(
                f"SoundCloud stream HTTP {e.code}: probable ban de cuenta o token vencido."
            )
        logger.warning("SoundCloud: error resolviendo stream URL para '%s': HTTP %d", query, e.code)
        return None
    except (urllib.error.URLError, json.JSONDecodeError, OSError) as e:
        logger.warning("SoundCloud: error resolviendo stream URL para '%s': %s", query, e)
        return None

    # Descargar segun protocolo
    protocol = tc.get("format", {}).get("protocol", "")
    try:
        if protocol == "progressive":
            _descargar_progressive(stream_url, output_path)
        else:
            _descargar_hls(stream_url, output_path)
    except (urllib.error.URLError, OSError) as e:
        logger.warning("SoundCloud: error descargando audio para '%s': %s", query, e)
        if os.path.exists(output_path):
            os.unlink(output_path)
        return None

    if not os.path.exists(output_path) or os.path.getsize(output_path) < 1000:
        logger.warning("SoundCloud: archivo descargado invalido para '%s'", query)
        if os.path.exists(output_path):
            os.unlink(output_path)
        return None

    size_kb = os.path.getsize(output_path) / 1024
    # Guardia post-descarga: si el archivo supera ~15 MB es muy probable una
    # compilacion o DJ set descargado por coincidencia en la busqueda.
    # A 128kbps: 15 MB = ~17min. Todas las canciones validas para sampleo son <12min.
    _MAX_SIZE_KB = 15_000
    if size_kb > _MAX_SIZE_KB:
        logger.warning(
            "SoundCloud: archivo %.0f KB supera limite %.0f KB \u2014 posible compilacion. "
            "Eliminando: '%s' -> %s",
            size_kb, _MAX_SIZE_KB, query, output_path,
        )
        os.unlink(output_path)
        return None

    sc_title = track.get("title", "?")
    sc_user = track.get("user", {}).get("username", "?")
    sc_permalink = track.get("permalink_url", "")
    logger.info(
        "Audio descargado (SoundCloud/%s): '%s' -> %s - %s (%.0f KB)",
        protocol, query, sc_user, sc_title, size_kb,
    )
    return ResultadoDescarga(
        ruta=output_path,
        metodo="soundcloud",
        fuente_url=sc_permalink,
        fuente_titulo=sc_title,
        fuente_artista=sc_user,
    )


def _elegir_transcoding_soundcloud(transcodings: list[dict]) -> dict | None:
    """
    Elegir el mejor transcoding de SoundCloud.

    Prioridad: progressive MP3 > HLS MP3 > HLS AAC.
    Se descartan transcodings encriptados (ctr-encrypted-hls, cbc-encrypted-hls).
    """
    progressive_mp3 = None
    hls_mp3 = None
    hls_aac = None

    for tc in transcodings:
        protocol = tc.get("format", {}).get("protocol", "")
        mime = tc.get("format", {}).get("mime_type", "")

        if "encrypted" in protocol:
            continue

        if protocol == "progressive" and "mpeg" in mime:
            progressive_mp3 = tc
        elif protocol == "hls" and "audio/mpeg" in mime and "mpegurl" not in mime:
            hls_mp3 = tc
        elif protocol == "hls" and "mp4" in mime and not hls_aac:
            hls_aac = tc

    return progressive_mp3 or hls_mp3 or hls_aac


def _descargar_progressive(stream_url: str, output_path: str) -> None:
    """Descargar audio desde URL directa (protocolo progressive)."""
    req = urllib.request.Request(stream_url, headers=_HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        with open(output_path, "wb") as f:
            while True:
                chunk = resp.read(8192)
                if not chunk:
                    break
                f.write(chunk)


def _descargar_hls(playlist_url: str, output_path: str) -> None:
    """Descargar audio HLS: parsear m3u8, descargar segmentos, concatenar."""
    req = urllib.request.Request(playlist_url, headers=_HTTP_HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        m3u8_content = resp.read().decode("utf-8")

    segments = [
        line.strip()
        for line in m3u8_content.split("\n")
        if line.strip() and not line.strip().startswith("#")
    ]

    if not segments:
        raise OSError("HLS playlist vacio: sin segmentos de audio")

    with open(output_path, "wb") as f:
        for seg_url in segments:
            req = urllib.request.Request(seg_url, headers=_HTTP_HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                f.write(resp.read())


def _descargar_deezer_preview(artista: str, titulo: str, output_dir: str) -> str | None:
    """
    Descargar preview de 30s desde Deezer API (gratis, sin auth).

    La API publica de Deezer retorna un campo `preview` con URL directa a MP3 128kbps.
    Catalogo de 90M+ tracks. Sin rate limit agresivo.

    Limitacion: los previews siempre empiezan ~30s del inicio de la cancion,
    sin control sobre la seccion. Solo viable cuando timing <= 30s.
    """
    nombre_seguro = re.sub(r"[^\w\s-]", "", f"{artista}_{titulo}")[:80].strip()
    output_path = os.path.join(output_dir, f"deezer_{nombre_seguro}.mp3")

    if os.path.exists(output_path):
        logger.debug("Audio Deezer ya en cache: %s", output_path)
        return output_path

    query = f"{artista} {titulo}"
    query_encoded = urllib.parse.quote(query)
    api_url = f"https://api.deezer.com/search?q={query_encoded}&limit=3"

    try:
        req = urllib.request.Request(api_url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        tracks = data.get("data", [])
        if not tracks:
            logger.warning("Deezer: sin resultados para '%s'", query)
            return None

        # Intentar cada resultado hasta encontrar uno con preview disponible
        for track in tracks:
            preview_url = track.get("preview")
            if not preview_url:
                continue

            try:
                req_preview = urllib.request.Request(preview_url)
                with urllib.request.urlopen(req_preview, timeout=30) as preview_resp:
                    audio_data = preview_resp.read()

                if len(audio_data) < 1000:
                    logger.debug("Deezer preview muy pequeno (%d bytes), saltando", len(audio_data))
                    continue

                with open(output_path, "wb") as f:
                    f.write(audio_data)

                size_kb = len(audio_data) / 1024
                logger.info(
                    "Audio descargado (Deezer preview): '%s' (%.1f KB) — track: %s - %s",
                    query, size_kb, track.get("artist", {}).get("name", "?"), track.get("title", "?"),
                )
                return output_path

            except (urllib.error.URLError, OSError) as e:
                logger.debug("Deezer preview download fallo para track %s: %s", track.get("id"), e)
                continue

        logger.warning("Deezer: ningun resultado con preview valido para '%s'", query)
        return None

    except (urllib.error.URLError, json.JSONDecodeError, OSError) as e:
        logger.warning("Deezer API fallo para '%s': %s", query, e)
        return None


def _descargar_youtube(
    youtube_id: str,
    output_dir: str,
    proxy_url: str | None = None,
    max_retries: int = 1,
) -> str | None:
    """Descargar audio de YouTube con estrategia progresiva y soporte proxy.

    IMPORTANTE: NUNCA usar proxy para descargar videos/audio de YouTube.
    El proxy residencial (DataImpulse) cambia IP entre la request de metadata
    y la descarga del CDN (googlevideo), causando ~67% de fallos por request.
    El fallback multi-fuente (SoundCloud + Deezer + Spotify) compensa sin
    el costo de bandwidth del proxy. Si la IP del VPS esta flaggeada, las
    alternativas cubren la gran mayoria de tracks.

    Orden de preferencia:
    1. Sin cookies, sin explicit client: yt-dlp auto-selecciona android_vr
       como cliente primario. Funciona para contenido publico sin restricciones.
    2. Con cookies, sin explicit client: para contenido restringido (edad, login).
       yt-dlp usa tv_downgraded/web/web_safari (android_vr no soporta cookies).

    Con proxy habilitado:
    - googlevideo CDN vincula la IP al URL de descarga (param `ip=`).
    - Proxy rotativo cambia IP entre metadata y download → ~33% exito/intento.
    - max_retries permite reintentar hasta que las IPs coincidan (~95% con 8 retries).
    - Cada retry fallido consume ~100KB (solo metadata).

    NOTA tv_embedded: eliminado de yt-dlp 2026.03.03 — silently skipped con warning.
    NOTA bgutil GVS: PO tokens de bgutil (1.3.1) rechazados por GVS experiment.
    Se omite web+fetch_pot hasta que bgutil actualice.
    """
    logger.info("TRIP PO youtube_id=%s", youtube_id)
    output_path = os.path.join(output_dir, f"{youtube_id}.mp3")

    if os.path.exists(output_path):
        logger.debug("Audio ya en cache: %s", output_path)
        return output_path

    ytdlp_path = _resolver_ejecutable("yt-dlp")
    if not ytdlp_path:
        return None

    url = f"https://www.youtube.com/watch?v={youtube_id}"

    # Errores que indican client incompatible o deteccion anti-bot (continuar al siguiente)
    _ERRORES_CONTINUAR = (
        "reloaded",               # GVS experiment: PO token requerido
        "sign in",                # anti-bot o auth requerida
        "login required",         # auth requerida
        "bot",                    # anti-bot detection
        "age", "confirm your age",   # restriccion de edad
        "not available",          # contenido no disponible para este client
        "unavailable",            # video no disponible
        "requested format",       # formato incompatible con el client elegido
        "private video",          # video privado
    )

    # Errores que indican que el video no existe o es permanentemente inaccesible (no reintentar)
    _ERRORES_PERMANENTES = (
        "private video",
        "video has been removed",
        "copyright",
        "does not exist",
    )

    # Comando base — argumentos compartidos por todas las estrategias.
    base_cmd = [
        ytdlp_path,
        "--no-playlist",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", output_path.replace(".mp3", ".%(ext)s"),
        "--quiet",
        "--no-warnings",
        "--retries", "3",
        "--extractor-retries", "3",
        "--file-access-retries", "3",
        "--no-check-certificates",
        "--socket-timeout", "30",
        "--js-runtimes", "node",
    ]

    if proxy_url:
        base_cmd.extend(["--proxy", proxy_url])

    cookies_path = _resolver_cookies_youtube()

    # Sin explicit player_client: yt-dlp selecciona el mejor cliente disponible.
    # Sin cookies: android_vr se auto-selecciona (funciona para contenido publico).
    # Con cookies: android_vr descartado (no soporta cookies), usa tv_downgraded/web/web_safari.
    estrategias: list[tuple[str, list[str]]] = [
        ("default", []),
    ]

    if cookies_path:
        estrategias.append(("default_cookies", ["--cookies", cookies_path]))

    # Retry loop: con proxy rotativo, ~33% exito por intento (IP mismatch en CDN).
    # Cada retry consume ~100KB (solo metadata). 8 retries → ~95% acumulado.
    # Sin proxy, max_retries=1 (un solo intento por estrategia).
    for intento in range(max_retries):
        if intento > 0:
            logger.debug(
                "Proxy retry %d/%d para %s (pausa %.1fs)",
                intento + 1, max_retries, youtube_id, _PROXY_RETRY_DELAY_SEG,
            )
            time.sleep(_PROXY_RETRY_DELAY_SEG)

        for nombre_estrategia, extra_args in estrategias:
            cmd = base_cmd + extra_args + [url]
            etiqueta = f"{nombre_estrategia}{'@proxy' if proxy_url else ''}"
            try:
                logger.debug("yt-dlp intento %d con estrategia: %s", intento + 1, etiqueta)

                result = subprocess.run(
                    cmd, capture_output=True, text=True, timeout=300,
                )

                if result.returncode == 0 and os.path.exists(output_path):
                    size_mb = os.path.getsize(output_path) / (1024 * 1024)
                    logger.info(
                        "Audio descargado (YouTube/%s intento %d): %s (%.1f MB)",
                        etiqueta, intento + 1, youtube_id, size_mb,
                    )
                    return output_path

                # yt-dlp puede retornar exit code != 0 por warnings pero generar el archivo
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    size_mb = os.path.getsize(output_path) / (1024 * 1024)
                    logger.info(
                        "Audio descargado con warnings (YouTube/%s intento %d): %s (%.1f MB)",
                        etiqueta, intento + 1, youtube_id, size_mb,
                    )
                    return output_path

                stderr = result.stderr or ""
                stderr_lower = stderr.lower()

                # Errores permanentes: no sirve reintentar con otro client ni con proxy
                if any(err in stderr_lower for err in _ERRORES_PERMANENTES):
                    logger.error(
                        "yt-dlp error permanente para %s: %s", youtube_id, stderr[:200],
                    )
                    return None

                es_error_continuar = any(err in stderr_lower for err in _ERRORES_CONTINUAR)

                if es_error_continuar:
                    logger.warning(
                        "yt-dlp fallo para %s con %s intento %d: %s",
                        youtube_id, etiqueta, intento + 1, stderr[:200],
                    )
                    # Con proxy, un 403 por IP mismatch es retryable
                    if proxy_url and ("403" in stderr or "forbidden" in stderr_lower):
                        break  # salir del loop de estrategias para reintentar
                    continue

                # Error 403 explicito (CDN IP mismatch con proxy) — retryable
                if proxy_url and ("403" in stderr or "forbidden" in stderr_lower):
                    logger.debug(
                        "yt-dlp 403 para %s (IP mismatch CDN), reintentando...", youtube_id,
                    )
                    break  # reintentar con nueva IP

                logger.error(
                    "yt-dlp fallo para %s con %s (error no recuperable): %s",
                    youtube_id, etiqueta, stderr[:500],
                )
                return None

            except subprocess.TimeoutExpired:
                logger.warning(
                    "Timeout con %s intento %d para %s",
                    etiqueta, intento + 1, youtube_id,
                )
                continue
            except Exception:
                logger.exception("Error inesperado descargando %s con %s", youtube_id, etiqueta)
                return None

    logger.error(
        "Todas las estrategias fallaron para %s (intentos=%d, proxy=%s)",
        youtube_id, max_retries, "si" if proxy_url else "no",
    )
    return None


def _descargar_youtube_search(
    artista: str, titulo: str, output_dir: str,
    proxy_url: str | None = None,
) -> str | None:
    """Buscar en YouTube por nombre y descargar el primer resultado accesible.

    ytsearch3 sin cookies primero (android_vr auto-seleccionado para publicos).
    Encuentra subidas no oficiales sin restricciones DRM de canales de labels.
    Reducido de ytsearch5 a ytsearch3 para minimizar API calls y bot detection.
    """
    nombre_seguro = re.sub(r"[^\w\s-]", "", f"{artista}_{titulo}")[:80].strip()
    output_path = os.path.join(output_dir, f"ytsearch_{nombre_seguro}.mp3")

    if os.path.exists(output_path):
        logger.debug("Audio YT search ya en cache: %s", output_path)
        return output_path

    ytdlp_path = _resolver_ejecutable("yt-dlp")
    if not ytdlp_path:
        return None

    query = f"ytsearch3:{artista} {titulo}"
    logger.info("YouTube search fallback: buscando '%s %s'", artista, titulo)

    cookies_path = _resolver_cookies_youtube()

    # Sin cookies primero: android_vr auto-seleccionado, funciona para contenido publico.
    # Con cookies despues: para resultados restringidos (tv_downgraded/web/web_safari).
    intentos_cookies: list[tuple[str, list[str]]] = [("sin_cookies", [])]
    if cookies_path:
        intentos_cookies.append(("con_cookies", ["--cookies", cookies_path]))

    for nombre_intento, cookies_args in intentos_cookies:
        resultado = _ejecutar_ytsearch(
            ytdlp_path, query, cookies_args, output_path, artista, titulo,
            proxy_url=proxy_url,
        )
        if resultado:
            return resultado
        logger.debug("YouTube search/%s: sin resultado, probando siguiente intento", nombre_intento)

    logger.warning(
        "YouTube search sin resultado para '%s %s'",
        artista, titulo,
    )
    return None


def _ejecutar_ytsearch(
    ytdlp_path: str,
    query: str,
    cookies_args: list[str],
    output_path: str,
    artista: str,
    titulo: str,
    proxy_url: str | None = None,
) -> str | None:
    """Ejecutar ytsearch3 sin explicit player_client (yt-dlp auto-selecciona).

    Retorna la ruta al MP3 si descarga algun resultado, None si todos los resultados fallan.
    Usa directorio temporal para capturar el archivo antes de renombrarlo al destino final.
    Sin explicit player_client: yt-dlp elige el mejor cliente segun disponibilidad de cookies.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        cmd = [
            ytdlp_path,
            # Sin --no-playlist: ytsearch necesita tratarse como playlist para iterar
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--output", os.path.join(tmpdir, "%(id)s.%(ext)s"),
            "--quiet",
            "--no-warnings",
            "--max-downloads", "1",
            "--ignore-errors",
            "--retries", "2",
            "--extractor-retries", "2",
            "--no-check-certificates",
            "--socket-timeout", "30",
            "--js-runtimes", "node",
            *(cookies_args),
            *(["--proxy", proxy_url] if proxy_url else []),
            query,
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300,
            )

            mp3_archivos = [
                os.path.join(tmpdir, f)
                for f in os.listdir(tmpdir)
                if f.endswith(".mp3") and os.path.getsize(os.path.join(tmpdir, f)) > 0
            ]

            if mp3_archivos:
                shutil.move(mp3_archivos[0], output_path)
                size_mb = os.path.getsize(output_path) / (1024 * 1024)
                logger.info(
                    "Audio descargado (YouTube/search): '%s %s' (%.1f MB)",
                    artista, titulo, size_mb,
                )
                return output_path

            stderr = (result.stderr or "")[:500]
            logger.warning(
                "YouTube search: sin resultado para '%s %s': %s",
                artista, titulo, stderr,
            )
            return None

        except subprocess.TimeoutExpired:
            logger.error("Timeout en YouTube search para '%s %s'", artista, titulo)
            return None
        except Exception:
            logger.exception("Error en YouTube search '%s %s'", artista, titulo)
            return None


def _ejecutar_spotdl(cmd: list[str], timeout: int = 120) -> tuple[int, str, str]:
    """
    Ejecutar spotdl con deteccion temprana de rate limits.

    Usa Popen para leer stdout/stderr en tiempo real y matar el proceso
    inmediatamente si detecta un mensaje de rate limit (evita esperas de 24h).
    Retorna (returncode, stdout, stderr).
    """
    import threading

    stdout_lines: list[str] = []
    stderr_lines: list[str] = []
    killed_by_ratelimit = [False]

    def _leer_stream(stream, buffer: list[str], proc: subprocess.Popen) -> None:
        for line in stream:
            buffer.append(line)
            if "rate" in line.lower() and "limit" in line.lower():
                killed_by_ratelimit[0] = True
                proc.kill()
                break

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        # Leer stdout y stderr en threads separados para no bloquear
        t_out = threading.Thread(target=_leer_stream, args=(proc.stdout, stdout_lines, proc))
        t_err = threading.Thread(target=_leer_stream, args=(proc.stderr, stderr_lines, proc))
        t_out.start()
        t_err.start()
        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        t_out.join(timeout=5)
        t_err.join(timeout=5)

        returncode = proc.returncode if not killed_by_ratelimit[0] else 1
        return returncode, "".join(stdout_lines), "".join(stderr_lines)
    except Exception as exc:
        raise RuntimeError(f"Error ejecutando spotdl: {exc}") from exc


def _descargar_spotify(spotify_id: str, output_dir: str) -> str | None:
    """Descargar audio desde Spotify via spotdl (busca match en YouTube Music)."""
    output_path = os.path.join(output_dir, f"spotify_{spotify_id}.wav")

    if os.path.exists(output_path):
        logger.debug("Audio Spotify ya en cache: %s", output_path)
        return output_path

    spotdl_path = _resolver_ejecutable("spotdl")
    if not spotdl_path:
        return None

    url = f"https://open.spotify.com/track/{spotify_id}"

    try:
        cmd = [
            spotdl_path,
            "download", url,
            "--output", output_path.replace(".wav", ""),
            "--format", "wav",
        ]

        returncode, stdout, stderr = _ejecutar_spotdl(cmd, timeout=120)

        if returncode != 0:
            combined = (stdout + stderr).lower()
            if "rate" in combined and "limit" in combined:
                logger.warning("spotdl: rate limit de Spotify alcanzado para %s. Reintentando en 24h.", spotify_id)
            else:
                logger.error("spotdl fallo para %s: %s", spotify_id, stderr[:500])
            return None

        # spotdl puede generar archivos con nombres distintos; buscar el wav descargado
        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            logger.info("Audio descargado (Spotify): %s (%.1f MB)", spotify_id, size_mb)
            return output_path

        # Buscar cualquier wav recien creado en output_dir para este spotify
        for fname in os.listdir(output_dir):
            fpath = os.path.join(output_dir, fname)
            if fname.endswith(".wav") and spotify_id in fname:
                os.rename(fpath, output_path)
                logger.info("Audio Spotify renombrado: %s -> %s", fname, output_path)
                return output_path

        logger.error("Archivo WAV no encontrado tras spotdl: %s", spotify_id)
        return None

    except Exception:
        logger.exception("Error inesperado descargando Spotify %s", spotify_id)
        return None


def _descargar_spotify_por_nombre(artista: str, titulo: str, output_dir: str) -> str | None:
    """Buscar y descargar audio desde Spotify via spotdl usando nombre de artista + titulo.

    Fallback para cuando no hay spotify_id disponible.
    spotdl busca automaticamente en Spotify y descarga el match mas cercano.
    """
    # Nombre seguro para archivo (sin caracteres especiales)
    nombre_seguro = re.sub(r"[^\w\s-]", "", f"{artista}_{titulo}")[:80].strip()
    output_path = os.path.join(output_dir, f"spotify_search_{nombre_seguro}.wav")

    if os.path.exists(output_path):
        logger.debug("Audio Spotify (busqueda) ya en cache: %s", output_path)
        return output_path

    spotdl_path = _resolver_ejecutable("spotdl")
    if not spotdl_path:
        return None

    query = f"{artista} - {titulo}"
    logger.info("Spotify fallback: buscando '%s' por nombre", query)

    try:
        cmd = [
            spotdl_path,
            "download", query,
            "--output", output_path.replace(".wav", ""),
            "--format", "wav",
        ]

        returncode, stdout, stderr = _ejecutar_spotdl(cmd, timeout=120)

        if returncode != 0:
            combined = (stdout + stderr).lower()
            if "rate" in combined and "limit" in combined:
                logger.warning("spotdl: rate limit de Spotify alcanzado para '%s'. Reintentando en 24h.", query)
            else:
                logger.warning("spotdl busqueda fallo para '%s': %s", query, stderr[:300])
            return None

        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            logger.info("Audio descargado (Spotify/busqueda): '%s' (%.1f MB)", query, size_mb)
            return output_path

        # spotdl genera archivos con nombres del track, buscar wav reciente
        for fname in os.listdir(output_dir):
            fpath = os.path.join(output_dir, fname)
            if fname.endswith(".wav") and nombre_seguro in fname:
                os.rename(fpath, output_path)
                logger.info("Audio Spotify busqueda renombrado: %s -> %s", fname, output_path)
                return output_path

        logger.warning("Archivo WAV no encontrado tras spotdl busqueda: '%s'", query)
        return None

    except Exception:
        logger.exception("Error inesperado en Spotify busqueda '%s'", query)
        return None


def limpiar_audio(path: str) -> None:
    """Eliminar archivo de audio temporal."""
    try:
        if path and os.path.exists(path):
            os.unlink(path)
            logger.debug("Audio temporal eliminado: %s", path)
    except OSError:
        logger.warning("No se pudo eliminar %s", path)
