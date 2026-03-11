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
) -> str | None:
    """
    Descargar audio priorizando YouTube, fallback a Spotify.

    Args:
        youtube_id: ID del video de YouTube (ej: '81VrSMrS5F8')
        output_dir: directorio para el archivo temporal (default: tempdir del sistema)
        spotify_id: ID del track de Spotify como fallback

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
        return _descargar_spotify(spotify_id, output_dir)

    logger.error("Sin fuente de audio: youtube_id=%s, spotify_id=%s", youtube_id, spotify_id)
    return None


def _descargar_youtube(youtube_id: str, output_dir: str) -> str | None:
    """Descargar audio de YouTube y convertir a MP3 intermedio."""
    output_path = os.path.join(output_dir, f"{youtube_id}.mp3")

    if os.path.exists(output_path):
        logger.debug("Audio ya en cache: %s", output_path)
        return output_path

    ytdlp_path = _resolver_ejecutable("yt-dlp")
    if not ytdlp_path:
        return None

    url = f"https://www.youtube.com/watch?v={youtube_id}"

    # Errores que indican cookies invalidas/expiradas
    _ERRORES_COOKIES = ("reloaded", "sign in", "login required", "bot")

    cookie_browser = os.getenv("YTDLP_COOKIE_BROWSER", "chrome")

    # Estrategias de cookies: primero cookies.txt, luego navegador
    estrategias: list[tuple[str, list[str]]] = []
    if os.path.exists("cookies.txt"):
        estrategias.append(("cookies.txt", ["--cookies", "cookies.txt"]))
        estrategias.append(("navegador " + cookie_browser, ["--cookies-from-browser", cookie_browser]))
    else:
        estrategias.append(("navegador " + cookie_browser, ["--cookies-from-browser", cookie_browser]))

    for nombre_estrategia, cookie_args in estrategias:
        try:
            cmd = [
                ytdlp_path,
                "--no-playlist",
                "--extract-audio",
                "--audio-format", "mp3",
                "--audio-quality", "0",
                "--js-runtimes", "node",
                "--remote-components", "ejs:github",
                "--output", output_path.replace(".mp3", ".%(ext)s"),
                "--quiet",
                "--no-warnings",
                "--retries", "3",
                "--extractor-retries", "3",
                "--file-access-retries", "3",
                "--no-check-certificates",
            ]
            cmd.extend(cookie_args)
            cmd.append(url)

            logger.debug("yt-dlp intento con estrategia: %s", nombre_estrategia)

            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300,
            )

            if result.returncode != 0:
                stderr_lower = (result.stderr or "").lower()
                es_error_cookies = any(err in stderr_lower for err in _ERRORES_COOKIES)

                if es_error_cookies and len(estrategias) > 1:
                    logger.warning(
                        "yt-dlp fallo para %s con %s (posible cookies expiradas): %s. Intentando siguiente estrategia...",
                        youtube_id, nombre_estrategia, result.stderr[:300],
                    )
                    continue

                logger.error("yt-dlp fallo para %s con %s: %s", youtube_id, nombre_estrategia, result.stderr[:500])
                return None

            if os.path.exists(output_path):
                size_mb = os.path.getsize(output_path) / (1024 * 1024)
                logger.info("Audio descargado (YouTube/%s): %s (%.1f MB)", nombre_estrategia, youtube_id, size_mb)
                return output_path

            logger.error("Archivo MP3 no encontrado tras descarga: %s", output_path)
            return None

        except subprocess.TimeoutExpired:
            logger.error("Timeout descargando audio (%s): %s", nombre_estrategia, youtube_id)
            return None
        except Exception:
            logger.exception("Error inesperado descargando %s con %s", youtube_id, nombre_estrategia)
            return None

    logger.error("Todas las estrategias de cookies fallaron para %s", youtube_id)
    return None
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


def limpiar_audio(path: str) -> None:
    """Eliminar archivo de audio temporal."""
    try:
        if path and os.path.exists(path):
            os.unlink(path)
            logger.debug("Audio temporal eliminado: %s", path)
    except OSError:
        logger.warning("No se pudo eliminar %s", path)
