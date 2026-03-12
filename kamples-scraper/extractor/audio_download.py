"""
Descarga de audio desde YouTube (yt-dlp) o Spotify (spotdl).

Prioridad: YouTube ID > YouTube search > Spotify ID > Spotify search > error.

Youtube:
- Estrategia primaria tv_embedded: player_client=tv_embedded bypasea restricciones de
  canales de labels sin PO tokens ni cookies. Contexto embed, diferente anti-bot.
- android_vr: segundo cliente, sin cookies (evita mismatch de API con cookies web).
- tv_embedded + cookies: para contenido con restriccion de edad.
- web+bgutil (condicional): si bgutil HTTP server activo en localhost:4416.
- CRITICO: NUNCA combinar android_vr con cookies de navegador web — contextos de
  API incompatibles => 'Requested format is not available' de forma sistematica.
- YouTube search: ytsearch5 itera tv_embedded → android_vr para busqueda por nombre.

Spotify: spotdl como fallback para contenido no disponible en YouTube.
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
        logger.warning("YouTube (ID directo) fallo para %s, intentando busqueda por nombre", youtube_id)

    # Fallback: buscar en YouTube por nombre — evita restricciones de canales oficiales.
    # Las subidas no oficiales no tienen DRM de labels y funcionan con android_vr.
    if artista and titulo:
        resultado = _descargar_youtube_search(artista, titulo, output_dir)
        if resultado:
            return resultado

    if spotify_id and _SPOTIFY_ID_RE.match(spotify_id):
        resultado = _descargar_spotify(spotify_id, output_dir)
        if resultado:
            return resultado
        logger.warning("Spotify por ID fallo para %s", spotify_id)

    # Ultimo fallback: buscar en Spotify por nombre de artista + titulo
    if artista and titulo:
        resultado = _descargar_spotify_por_nombre(artista, titulo, output_dir)
        if resultado:
            return resultado

    logger.error(
        "Sin fuente de audio: youtube_id=%s, spotify_id=%s, artista=%s",
        youtube_id, spotify_id, artista,
    )
    return None


_bgutil_activo_cache: bool | None = None


def _bgutil_servidor_activo() -> bool:
    """Verificar si el servidor HTTP de bgutil esta activo en localhost:4416.

    Resultado cacheado por proceso para evitar multiples checks por video.
    Si no esta activo, se usa android_vr como cliente primario (no requiere PO tokens).
    """
    global _bgutil_activo_cache
    if _bgutil_activo_cache is not None:
        return _bgutil_activo_cache
    import urllib.request
    try:
        with urllib.request.urlopen("http://localhost:4416/ping", timeout=2) as resp:
            _bgutil_activo_cache = resp.status == 200
    except Exception:
        _bgutil_activo_cache = False
    if _bgutil_activo_cache:
        logger.info("bgutil: servidor HTTP activo — web+fetch_pot disponible como fallback")
    else:
        logger.debug("bgutil: servidor HTTP no disponible. Usando android_vr como cliente primario.")
    return _bgutil_activo_cache


def _descargar_youtube(youtube_id: str, output_dir: str) -> str | None:
    """Descargar audio de YouTube con estrategia progresiva de clientes.

    Orden de preferencia:
    1. tv_embedded: bypasea restricciones de labels sin PO tokens ni cookies.
       Contexto de embed, diferente deteccion anti-bot que web/android.
    2. android_vr: cliente movil alternativo, sin cookies (evita mismatch de API).
    3. tv_embedded + cookies: para contenido con restriccion de edad.
       tv_embedded acepta cookies de sesion web sin mismatch de formato.
    4. web + fetch_pot=always: solo si bgutil esta activo en localhost:4416.
    
    PROHIBIDO: mezclar android_vr con cookies; sus contextos de API son incompatibles
    y producen 'Requested format is not available' de forma sistematica.
    """
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

    # Comando base — argumentos compartidos por todas las estrategias.
    # El player_client y fetch_pot se inyectan por estrategia en extra_args.
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

    cookies_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cookies.txt")
    cookies_existe = os.path.exists(cookies_path)

    # tv_embedded: primario — contexto embed, diferente anti-bot al web/android.
    # No requiere PO tokens ni cookies; bypasea restricciones de canales de labels.
    estrategias: list[tuple[str, list[str]]] = [
        ("tv_embedded", ["--extractor-args", "youtube:player_client=tv_embedded"]),
        ("android_vr",  ["--extractor-args", "youtube:player_client=android_vr"]),
    ]

    if cookies_existe:
        # tv_embedded acepta cookies de sesion web sin mismatch de formato.
        # NUNCA: android_vr + cookies (mismatch de API → Requested format not available).
        estrategias.append((
            "tv_embedded_cookies",
            ["--extractor-args", "youtube:player_client=tv_embedded", "--cookies", cookies_path],
        ))

    # web+bgutil: fallback para contenido que requiere PO token del web client.
    # Solo se activa si bgutil HTTP server esta corriendo en localhost:4416.
    if _bgutil_servidor_activo():
        extra_web: list[str] = ["--extractor-args", "youtube:player_client=web;fetch_pot=always"]
        if cookies_existe:
            extra_web += ["--cookies", cookies_path]
        estrategias.append(("web_bgutil", extra_web))

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
            es_error_continuar = any(err in stderr_lower for err in _ERRORES_CONTINUAR)

            if es_error_continuar:
                logger.warning(
                    "yt-dlp fallo para %s con %s (client incompatible): %s",
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


def _descargar_youtube_search(artista: str, titulo: str, output_dir: str) -> str | None:
    """Buscar en YouTube por nombre y descargar el primer resultado accesible.

    Itera sobre clientes (tv_embedded, android_vr) hasta que uno funcione.
    tv_embedded como primario: mismo contexto que descarga directa, sin mismatch de API.
    Encuentra subidas no oficiales sin restricciones DRM de canales de labels.
    """
    nombre_seguro = re.sub(r"[^\w\s-]", "", f"{artista}_{titulo}")[:80].strip()
    output_path = os.path.join(output_dir, f"ytsearch_{nombre_seguro}.mp3")

    if os.path.exists(output_path):
        logger.debug("Audio YT search ya en cache: %s", output_path)
        return output_path

    ytdlp_path = _resolver_ejecutable("yt-dlp")
    if not ytdlp_path:
        return None

    query = f"ytsearch5:{artista} {titulo}"
    logger.info("YouTube search fallback: buscando '%s %s'", artista, titulo)

    # tv_embedded acepta cookies de sesion web sin mismatch de formato.
    # NUNCA pasar cookies con android_vr en search (mismo mismatch que en descarga directa).
    cookies_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cookies.txt")
    cookies_args = ["--cookies", cookies_path] if os.path.exists(cookies_path) else []

    for player_client in ("tv_embedded", "android_vr"):
        resultado = _ejecutar_ytsearch(
            ytdlp_path, query, player_client, cookies_args, output_path, artista, titulo,
        )
        if resultado:
            return resultado

    logger.warning(
        "YouTube search sin resultado con ningun cliente para '%s %s'",
        artista, titulo,
    )
    return None


def _ejecutar_ytsearch(
    ytdlp_path: str,
    query: str,
    player_client: str,
    cookies_args: list[str],
    output_path: str,
    artista: str,
    titulo: str,
) -> str | None:
    """Ejecutar ytsearch5 con un player_client especifico.

    Retorna la ruta al MP3 si descarga algun resultado, None si todos los resultados fallan.
    Usa directorio temporal para capturar el archivo antes de renombrarlo al destino final.
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
            "--extractor-args", f"youtube:player_client={player_client}",
            *cookies_args,
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
                    "Audio descargado (YouTube/search/%s): '%s %s' (%.1f MB)",
                    player_client, artista, titulo, size_mb,
                )
                return output_path

            stderr = (result.stderr or "")[:500]
            logger.warning(
                "YouTube search/%s: sin resultado para '%s %s': %s",
                player_client, artista, titulo, stderr,
            )
            return None

        except subprocess.TimeoutExpired:
            logger.error("Timeout en YouTube search/%s para '%s %s'", player_client, artista, titulo)
            return None
        except Exception:
            logger.exception("Error en YouTube search/%s '%s %s'", player_client, artista, titulo)
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
