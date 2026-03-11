"""
Descarga de audio desde YouTube (yt-dlp) o Spotify (spotdl).

Prioridad: YouTube > Spotify > error.
Descarga audio en mejor calidad y convierte a WAV temporal para análisis BPM.
"""

import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile

logger = logging.getLogger(__name__)

# Patron de validacion para Spotify IDs (alfanumerico, 10-30 chars)
_SPOTIFY_ID_RE = re.compile(r"^[A-Za-z0-9]{10,30}$")


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
) -> str | None:
    """
    Descargar audio priorizando YouTube, fallback a Spotify.

    Args:
        youtube_id: ID del video de YouTube (ej: '81VrSMrS5F8')
        output_dir: directorio para el archivo temporal (default: tempdir del sistema)
        spotify_id: ID del track de Spotify como fallback
        artista: nombre del artista (para busqueda Spotify por nombre)
        titulo: titulo del track (para busqueda Spotify por nombre)

    Returns:
        Ruta al archivo WAV temporal, o None si falla.
    """
    if output_dir is None:
        output_dir = os.getenv("AUDIO_TMP_DIR", tempfile.gettempdir())
    os.makedirs(output_dir, exist_ok=True)

    if youtube_id and len(youtube_id) <= 20:
        resultado = _descargar_youtube(youtube_id, output_dir)
        if resultado:
            return resultado
        logger.warning("YouTube fallo para %s, intentando Spotify fallback", youtube_id)

    if spotify_id and _SPOTIFY_ID_RE.match(spotify_id):
        resultado = _descargar_spotify(spotify_id, output_dir)
        if resultado:
            return resultado
        logger.warning("Spotify por ID fallo para %s", spotify_id)

    # Fallback: buscar en Spotify por nombre de artista + titulo
    if artista and titulo:
        resultado = _descargar_spotify_por_nombre(artista, titulo, output_dir)
        if resultado:
            return resultado

    logger.error(
        "Sin fuente de audio: youtube_id=%s, spotify_id=%s, artista=%s",
        youtube_id, spotify_id, artista,
    )
    return None


def _descargar_youtube(youtube_id: str, output_dir: str) -> str | None:
    """Descargar audio de YouTube con PO Token plugin (bgutil-ytdlp-pot-provider).

    yt-dlp 2025+ requiere PO (Proof of Origin) Tokens para YouTube.
    El plugin bgutil genera tokens automaticamente si esta instalado y
    el servidor/scripts estan construidos en ~/bgutil-ytdlp-pot-provider/server/.

    Estrategia:
    1. yt-dlp nativo — el plugin PO token elige el mejor client automaticamente
    2. + cookies.txt — para videos con restriccion de edad (si el archivo existe)
    """
    output_path = os.path.join(output_dir, f"{youtube_id}.mp3")

    if os.path.exists(output_path):
        logger.debug("Audio ya en cache: %s", output_path)
        return output_path

    ytdlp_path = _resolver_ejecutable("yt-dlp")
    if not ytdlp_path:
        return None

    url = f"https://www.youtube.com/watch?v={youtube_id}"

    # Errores que indican restriccion de autenticacion (intentar con cookies)
    _ERRORES_AUTH = (
        "reloaded", "sign in", "login required", "bot",
        "age", "confirm your age", "not available",
    )

    # Comando base — yt-dlp + plugin PO token eligen client optimo automaticamente.
    # No forzar --extractor-args player_client: el plugin bgutil ya maneja
    # la generacion de tokens para el client que yt-dlp seleccione.
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
    ]

    # Estrategia 1: yt-dlp nativo con PO token plugin
    # Estrategia 2: agregar cookies.txt para videos con restriccion de edad
    estrategias: list[tuple[str, list[str]]] = [
        ("pot_nativo", []),
    ]

    cookies_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cookies.txt")
    if os.path.exists(cookies_path):
        estrategias.append(("pot_cookies", ["--cookies", cookies_path]))

    for nombre_estrategia, extra_args in estrategias:
        cmd = base_cmd + extra_args + [url]
        try:
            logger.debug("yt-dlp intento con estrategia: %s", nombre_estrategia)

            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300,
            )

            if result.returncode == 0 and os.path.exists(output_path):
                size_mb = os.path.getsize(output_path) / (1024 * 1024)
                logger.info(
                    "Audio descargado (YouTube/%s): %s (%.1f MB)",
                    nombre_estrategia, youtube_id, size_mb,
                )
                return output_path

            # yt-dlp puede retornar exit code != 0 por warnings pero generar el archivo
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                size_mb = os.path.getsize(output_path) / (1024 * 1024)
                logger.info(
                    "Audio descargado con warnings (YouTube/%s): %s (%.1f MB)",
                    nombre_estrategia, youtube_id, size_mb,
                )
                return output_path

            stderr = result.stderr or ""
            stderr_lower = stderr.lower()
            es_error_auth = any(err in stderr_lower for err in _ERRORES_AUTH)

            if es_error_auth:
                logger.warning(
                    "yt-dlp fallo para %s con %s (error auth/anti-bot): %s",
                    youtube_id, nombre_estrategia, stderr[:200],
                )
                continue

            logger.error(
                "yt-dlp fallo para %s con %s (error no recuperable): %s",
                youtube_id, nombre_estrategia, stderr[:500],
            )
            return None

        except subprocess.TimeoutExpired:
            logger.warning(
                "Timeout con estrategia %s para %s, intentando siguiente...",
                nombre_estrategia, youtube_id,
            )
            continue
        except Exception:
            logger.exception("Error inesperado descargando %s con %s", youtube_id, nombre_estrategia)
            return None

    logger.error("Todas las estrategias fallaron para %s", youtube_id)
    return None


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

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120,
        )

        if result.returncode != 0:
            logger.error("spotdl fallo para %s: %s", spotify_id, result.stderr[:500])
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

    except subprocess.TimeoutExpired:
        logger.error("Timeout descargando audio Spotify: %s", spotify_id)
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

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120,
        )

        if result.returncode != 0:
            logger.warning("spotdl busqueda fallo para '%s': %s", query, result.stderr[:300])
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

    except subprocess.TimeoutExpired:
        logger.error("Timeout buscando audio Spotify: '%s'", query)
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
