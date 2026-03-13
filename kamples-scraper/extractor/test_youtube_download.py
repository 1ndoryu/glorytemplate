"""
Test de metodos de descarga de YouTube — Script de investigacion QQ122.

Prueba multiples estrategias de descarga de audio de YouTube sin modificar
el pipeline de extraccion principal. Diseñado para ejecutarse desde el panel
admin via DevController o manualmente.

Uso manual:
  python -m extractor.test_youtube_download --video-id dQw4w9WgXcQ
  python -m extractor.test_youtube_download --video-id dQw4w9WgXcQ --metodo todos
  python -m extractor.test_youtube_download --video-id dQw4w9WgXcQ --metodo innertube

Metodos disponibles:
  1. ytdlp_default     — yt-dlp sin opciones extras (auto-selecciona android_vr)
  2. ytdlp_cookies     — yt-dlp con cookies.txt
  3. ytdlp_nightly     — yt-dlp nightly (si disponible en PATH como yt-dlp-nightly)
  4. ytdlp_clients     — yt-dlp forzando clientes especificos uno a uno
  5. innertube_direct   — Llamada directa a InnerTube API con client spoofing
  6. cobalt_api         — API publica de cobalt.tools (servicio de descarga)
  7. ytdlp_po_token     — yt-dlp con generacion manual de PO token via bgutil

Cada metodo reporta: exito/fallo, tiempo, tamaño archivo, metodo/formato obtenido.
"""

import argparse
import dataclasses
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("test_youtube")


@dataclasses.dataclass
class ResultadoTest:
    """Resultado de una prueba de descarga."""
    metodo: str
    exito: bool
    tiempo_seg: float
    tamano_bytes: int = 0
    formato: str = ""
    error: str = ""
    detalles: str = ""


# Validacion estricta del youtube_id (11 chars alfanumerico + _ + -)
_YT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def _resolver_ejecutable(nombre: str) -> str | None:
    """Buscar ejecutable en venv o PATH."""
    directorio_python = os.path.dirname(sys.executable)
    for ext in [".exe", ""]:
        ruta = os.path.join(directorio_python, f"{nombre}{ext}")
        if os.path.isfile(ruta):
            return ruta
    return shutil.which(nombre)


def _tamano_archivo(ruta: str) -> int:
    """Tamaño en bytes, 0 si no existe."""
    try:
        return os.path.getsize(ruta) if os.path.exists(ruta) else 0
    except OSError:
        return 0


# --------------------------------------------------------------------------
# Metodo 1: yt-dlp default (sin opciones extras)
# --------------------------------------------------------------------------
def test_ytdlp_default(youtube_id: str, output_dir: str) -> ResultadoTest:
    """yt-dlp con configuracion default — auto-selecciona android_vr."""
    ytdlp = _resolver_ejecutable("yt-dlp")
    if not ytdlp:
        return ResultadoTest("ytdlp_default", False, 0, error="yt-dlp no encontrado")

    output_path = os.path.join(output_dir, f"test_default_{youtube_id}.mp3")
    url = f"https://www.youtube.com/watch?v={youtube_id}"

    cmd = [
        ytdlp,
        "--no-playlist",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", output_path.replace(".mp3", ".%(ext)s"),
        "--retries", "3",
        "--no-check-certificates",
        "--socket-timeout", "30",
        "--verbose",
        url,
    ]

    t0 = time.monotonic()
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        elapsed = time.monotonic() - t0
        size = _tamano_archivo(output_path)

        if result.returncode == 0 and size > 0:
            return ResultadoTest(
                "ytdlp_default", True, elapsed, size,
                detalles=_extraer_formato_ytdlp(result.stderr or result.stdout)
            )
        return ResultadoTest(
            "ytdlp_default", False, elapsed,
            error=(result.stderr or result.stdout or "Sin output")[:500]
        )
    except subprocess.TimeoutExpired:
        return ResultadoTest("ytdlp_default", False, time.monotonic() - t0, error="Timeout 120s")
    except Exception as e:
        return ResultadoTest("ytdlp_default", False, time.monotonic() - t0, error=str(e)[:300])


# --------------------------------------------------------------------------
# Metodo 2: yt-dlp con cookies
# --------------------------------------------------------------------------
def test_ytdlp_cookies(youtube_id: str, output_dir: str) -> ResultadoTest:
    """yt-dlp con cookies.txt — usa tv_downgraded/web/web_safari."""
    cookies_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cookies.txt")
    if not os.path.exists(cookies_path):
        return ResultadoTest("ytdlp_cookies", False, 0, error="cookies.txt no encontrado")

    ytdlp = _resolver_ejecutable("yt-dlp")
    if not ytdlp:
        return ResultadoTest("ytdlp_cookies", False, 0, error="yt-dlp no encontrado")

    output_path = os.path.join(output_dir, f"test_cookies_{youtube_id}.mp3")
    url = f"https://www.youtube.com/watch?v={youtube_id}"

    cmd = [
        ytdlp,
        "--no-playlist",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", output_path.replace(".mp3", ".%(ext)s"),
        "--cookies", cookies_path,
        "--retries", "3",
        "--no-check-certificates",
        "--socket-timeout", "30",
        "--verbose",
        url,
    ]

    t0 = time.monotonic()
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        elapsed = time.monotonic() - t0
        size = _tamano_archivo(output_path)

        if (result.returncode == 0 or size > 0) and size > 0:
            return ResultadoTest(
                "ytdlp_cookies", True, elapsed, size,
                detalles=_extraer_formato_ytdlp(result.stderr or result.stdout)
            )
        return ResultadoTest(
            "ytdlp_cookies", False, elapsed,
            error=(result.stderr or result.stdout or "Sin output")[:500]
        )
    except subprocess.TimeoutExpired:
        return ResultadoTest("ytdlp_cookies", False, time.monotonic() - t0, error="Timeout 120s")
    except Exception as e:
        return ResultadoTest("ytdlp_cookies", False, time.monotonic() - t0, error=str(e)[:300])


# --------------------------------------------------------------------------
# Metodo 3: yt-dlp con clientes especificos forzados
# --------------------------------------------------------------------------
def test_ytdlp_clients(youtube_id: str, output_dir: str) -> list[ResultadoTest]:
    """Probar cada cliente InnerTube individualmente via yt-dlp --extractor-args."""
    ytdlp = _resolver_ejecutable("yt-dlp")
    if not ytdlp:
        return [ResultadoTest("ytdlp_clients", False, 0, error="yt-dlp no encontrado")]

    # Clientes a probar individualmente
    # android_vr: historitamente el mejor, degradado marzo 2026
    # tv_embedded: removido de yt-dlp 2026.03.03 pero se prueba por si nightly lo reintrodujo
    # ios: cliente iOS, evita SABR
    # web_safari: genera HLS (m3u8), no SABR
    # web_creator: authenticated client con manifiestos completos
    # tv: Smart TV client, firmware legacy
    clientes = [
        "android_vr",
        "tv_embedded",
        "ios",
        "web_safari",
        "web_creator",
        "tv",
        "mediaconnect",
    ]

    resultados = []
    url = f"https://www.youtube.com/watch?v={youtube_id}"

    cookies_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cookies.txt")
    cookies_args = ["--cookies", cookies_path] if os.path.exists(cookies_path) else []

    for cliente in clientes:
        output_path = os.path.join(output_dir, f"test_client_{cliente}_{youtube_id}.mp3")

        cmd = [
            ytdlp,
            "--no-playlist",
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--output", output_path.replace(".mp3", ".%(ext)s"),
            "--extractor-args", f"youtube:player_client={cliente}",
            "--retries", "2",
            "--no-check-certificates",
            "--socket-timeout", "30",
            "--verbose",
            *cookies_args,
            url,
        ]

        t0 = time.monotonic()
        metodo_nombre = f"ytdlp_client_{cliente}"
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
            elapsed = time.monotonic() - t0
            size = _tamano_archivo(output_path)

            if size > 0:
                resultados.append(ResultadoTest(
                    metodo_nombre, True, elapsed, size,
                    detalles=_extraer_formato_ytdlp(result.stderr or result.stdout)
                ))
            else:
                resultados.append(ResultadoTest(
                    metodo_nombre, False, elapsed,
                    error=(result.stderr or "")[-300:]
                ))
        except subprocess.TimeoutExpired:
            resultados.append(ResultadoTest(
                metodo_nombre, False, time.monotonic() - t0, error="Timeout 90s"
            ))
        except Exception as e:
            resultados.append(ResultadoTest(
                metodo_nombre, False, time.monotonic() - t0, error=str(e)[:200]
            ))

    return resultados


# --------------------------------------------------------------------------
# Metodo 4: InnerTube API directa con client spoofing
# --------------------------------------------------------------------------
def test_innertube_direct(youtube_id: str, output_dir: str) -> list[ResultadoTest]:
    """
    Llamada directa a la API InnerTube con diferentes identidades de cliente.

    No usa yt-dlp — hace la request HTTP directamente a /youtubei/v1/player.
    Verifica si la respuesta contiene URLs de audio disponibles para descarga.
    NO descarga el archivo completo, solo verifica disponibilidad de formatos.
    """
    resultados = []

    # Configuraciones de clientes para InnerTube
    configs_clientes = [
        {
            "nombre": "ANDROID_VR",
            "payload": {
                "context": {
                    "client": {
                        "clientName": "ANDROID_VR",
                        "clientVersion": "1.62.17",
                        "androidSdkVersion": 34,
                        "osName": "Android",
                        "osVersion": "14",
                        "platform": "MOBILE",
                    }
                },
                "videoId": youtube_id,
                "contentCheckOk": True,
                "racyCheckOk": True,
            }
        },
        {
            "nombre": "TV_EMBEDDED",
            "payload": {
                "context": {
                    "client": {
                        "clientName": "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
                        "clientVersion": "2.0",
                    }
                },
                "videoId": youtube_id,
                "contentCheckOk": True,
                "racyCheckOk": True,
            }
        },
        {
            "nombre": "IOS",
            "payload": {
                "context": {
                    "client": {
                        "clientName": "IOS",
                        "clientVersion": "19.45.4",
                        "deviceMake": "Apple",
                        "deviceModel": "iPhone16,2",
                        "osName": "iPhone",
                        "osVersion": "18.2.0",
                    }
                },
                "videoId": youtube_id,
                "contentCheckOk": True,
                "racyCheckOk": True,
            }
        },
        {
            "nombre": "WEB_CREATOR",
            "payload": {
                "context": {
                    "client": {
                        "clientName": "WEB_CREATOR",
                        "clientVersion": "1.20260310.01.00",
                    }
                },
                "videoId": youtube_id,
                "contentCheckOk": True,
                "racyCheckOk": True,
            }
        },
        {
            "nombre": "MWEB",
            "payload": {
                "context": {
                    "client": {
                        "clientName": "MWEB",
                        "clientVersion": "2.20260308.05.00",
                    }
                },
                "videoId": youtube_id,
                "contentCheckOk": True,
                "racyCheckOk": True,
            }
        },
    ]

    endpoint = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.apps.youtube.vr.oculus/1.62.17 (Linux; U; Android 14; eureka-user Build/SDX55) gzip",
        "X-YouTube-Client-Name": "27",
        "X-YouTube-Client-Version": "1.62.17",
    }

    for config in configs_clientes:
        nombre = config["nombre"]
        metodo_nombre = f"innertube_{nombre}"
        t0 = time.monotonic()

        try:
            body = json.dumps(config["payload"]).encode("utf-8")
            req = urllib.request.Request(endpoint, data=body, method="POST")
            for k, v in headers.items():
                req.add_header(k, v)

            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            elapsed = time.monotonic() - t0

            # Analizar respuesta
            playability = data.get("playabilityStatus", {})
            status = playability.get("status", "UNKNOWN")
            reason = playability.get("reason", "")

            streaming = data.get("streamingData", {})
            adaptive = streaming.get("adaptiveFormats", [])
            formats_all = streaming.get("formats", [])

            # Buscar formatos de audio
            audio_formats = [
                f for f in adaptive
                if f.get("mimeType", "").startswith("audio/")
            ]

            # Buscar URLs disponibles (no encriptadas)
            audio_con_url = [f for f in audio_formats if f.get("url")]
            audio_cipher = [f for f in audio_formats if f.get("signatureCipher")]

            detalles_parts = [
                f"status={status}",
                f"adaptive={len(adaptive)}",
                f"audio_total={len(audio_formats)}",
                f"audio_url_directa={len(audio_con_url)}",
                f"audio_cipher={len(audio_cipher)}",
                f"formats_legacy={len(formats_all)}",
            ]

            if audio_formats:
                # Listar itags y calidades disponibles
                itags = [str(f.get("itag", "?")) for f in audio_formats]
                detalles_parts.append(f"itags=[{','.join(itags)}]")

                # Mejor formato
                mejores = sorted(audio_formats, key=lambda f: f.get("bitrate", 0), reverse=True)
                mejor = mejores[0]
                detalles_parts.append(
                    f"mejor=itag{mejor.get('itag')} {mejor.get('mimeType','')} "
                    f"{mejor.get('bitrate',0)//1000}kbps"
                )

            exito = status == "OK" and len(audio_con_url) > 0
            error_msg = ""
            if status != "OK":
                error_msg = f"{status}: {reason}"
            elif len(audio_con_url) == 0 and len(audio_cipher) > 0:
                error_msg = "Audio disponible pero requiere descifrado de firma (cipher)"
            elif len(audio_formats) == 0:
                error_msg = "Sin formatos de audio en la respuesta"

            # Si hay URL directa, intentar descargar para verificar que funciona
            if exito and audio_con_url:
                mejor_url = audio_con_url[0].get("url", "")
                descarga_ok = _verificar_url_descarga(mejor_url)
                if not descarga_ok:
                    exito = False
                    error_msg = "URL disponible pero 403 al intentar descargar (requiere PoToken)"
                    detalles_parts.append("descarga=403_FORBIDDEN")
                else:
                    detalles_parts.append("descarga=OK")

            resultados.append(ResultadoTest(
                metodo_nombre, exito, elapsed,
                detalles=", ".join(detalles_parts),
                error=error_msg,
            ))

        except urllib.error.HTTPError as e:
            resultados.append(ResultadoTest(
                metodo_nombre, False, time.monotonic() - t0,
                error=f"HTTP {e.code}: {e.reason}"
            ))
        except Exception as e:
            resultados.append(ResultadoTest(
                metodo_nombre, False, time.monotonic() - t0,
                error=str(e)[:300]
            ))

    return resultados


def _verificar_url_descarga(url: str) -> bool:
    """Verificar si una URL de googlevideo retorna contenido (HEAD + Range)."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("Range", "bytes=0-1023")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 206)
    except Exception:
        return False


# --------------------------------------------------------------------------
# Metodo 5: yt-dlp con PO token via bgutil (experimental)
# --------------------------------------------------------------------------
def test_ytdlp_po_token(youtube_id: str, output_dir: str) -> ResultadoTest:
    """
    yt-dlp con --extractor-args youtube:player_client=web,po_token=...

    Requiere generar un PO token externamente (bgutil-rs, bgutil-js, o similar).
    Si no hay token configurado, reporta como no disponible.
    """
    pot = os.getenv("YOUTUBE_PO_TOKEN", "").strip()
    visitor_data = os.getenv("YOUTUBE_VISITOR_DATA", "").strip()

    if not pot:
        return ResultadoTest(
            "ytdlp_po_token", False, 0,
            error="YOUTUBE_PO_TOKEN no configurado en .env. "
                  "Generar con: npx bgutil-rs generate-po-token"
        )

    ytdlp = _resolver_ejecutable("yt-dlp")
    if not ytdlp:
        return ResultadoTest("ytdlp_po_token", False, 0, error="yt-dlp no encontrado")

    output_path = os.path.join(output_dir, f"test_pot_{youtube_id}.mp3")
    url = f"https://www.youtube.com/watch?v={youtube_id}"

    extractor_args = f"youtube:player_client=web"
    if visitor_data:
        extractor_args += f";po_token=web+{pot}"

    cmd = [
        ytdlp,
        "--no-playlist",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", output_path.replace(".mp3", ".%(ext)s"),
        "--extractor-args", extractor_args,
        "--retries", "3",
        "--no-check-certificates",
        "--socket-timeout", "30",
        "--verbose",
        url,
    ]

    t0 = time.monotonic()
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        elapsed = time.monotonic() - t0
        size = _tamano_archivo(output_path)

        if size > 0:
            return ResultadoTest(
                "ytdlp_po_token", True, elapsed, size,
                detalles=_extraer_formato_ytdlp(result.stderr or result.stdout)
            )
        return ResultadoTest(
            "ytdlp_po_token", False, elapsed,
            error=(result.stderr or "")[-400:]
        )
    except subprocess.TimeoutExpired:
        return ResultadoTest("ytdlp_po_token", False, time.monotonic() - t0, error="Timeout 120s")
    except Exception as e:
        return ResultadoTest("ytdlp_po_token", False, time.monotonic() - t0, error=str(e)[:300])


# --------------------------------------------------------------------------
# Metodo 6: cobalt.tools API
# --------------------------------------------------------------------------
def test_cobalt_api(youtube_id: str, output_dir: str) -> ResultadoTest:
    """
    Descarga via cobalt.tools (servicio publico de descarga de YouTube).
    API: POST https://api.cobalt.tools/ con body JSON.
    """
    t0 = time.monotonic()

    # cobalt.tools API v10
    api_url = "https://api.cobalt.tools/"
    yt_url = f"https://www.youtube.com/watch?v={youtube_id}"

    payload = {
        "url": yt_url,
        "audioFormat": "mp3",
        "isAudioOnly": True,
        "filenameStyle": "basic",
    }

    try:
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(api_url, data=body, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        status = data.get("status", "unknown")

        if status == "tunnel" or status == "redirect":
            download_url = data.get("url", "")
            if not download_url:
                return ResultadoTest(
                    "cobalt_api", False, time.monotonic() - t0,
                    error=f"Respuesta sin URL de descarga: {json.dumps(data)[:300]}"
                )

            # Descargar el archivo
            output_path = os.path.join(output_dir, f"test_cobalt_{youtube_id}.mp3")
            dl_req = urllib.request.Request(download_url)
            dl_req.add_header("User-Agent", "Mozilla/5.0")

            with urllib.request.urlopen(dl_req, timeout=60) as dl_resp:
                with open(output_path, "wb") as f:
                    while True:
                        chunk = dl_resp.read(8192)
                        if not chunk:
                            break
                        f.write(chunk)

            elapsed = time.monotonic() - t0
            size = _tamano_archivo(output_path)

            if size > 0:
                return ResultadoTest(
                    "cobalt_api", True, elapsed, size,
                    detalles=f"status={status}"
                )

            return ResultadoTest(
                "cobalt_api", False, elapsed,
                error="Archivo descargado vacio"
            )

        elif status == "error":
            error_info = data.get("error", {})
            error_code = error_info.get("code", "unknown") if isinstance(error_info, dict) else str(error_info)
            return ResultadoTest(
                "cobalt_api", False, time.monotonic() - t0,
                error=f"Error cobalt: {error_code}"
            )
        else:
            return ResultadoTest(
                "cobalt_api", False, time.monotonic() - t0,
                error=f"Status inesperado: {status}, data={json.dumps(data)[:300]}"
            )

    except urllib.error.HTTPError as e:
        body_err = ""
        try:
            body_err = e.read().decode("utf-8", errors="replace")[:300]
        except Exception:
            pass
        return ResultadoTest(
            "cobalt_api", False, time.monotonic() - t0,
            error=f"HTTP {e.code}: {body_err}"
        )
    except Exception as e:
        return ResultadoTest(
            "cobalt_api", False, time.monotonic() - t0,
            error=str(e)[:300]
        )


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------
def _extraer_formato_ytdlp(output: str) -> str:
    """Extraer info de formato del verbose output de yt-dlp."""
    lineas = output.strip().split("\n") if output else []
    info_parts = []
    for linea in lineas:
        lower = linea.lower()
        if "downloading" in lower and "format" in lower:
            info_parts.append(linea.strip()[:100])
        elif "[info]" in lower and ("audio" in lower or "format" in lower or "itag" in lower):
            info_parts.append(linea.strip()[:100])
        elif "extracting url" in lower or "player_client" in lower:
            info_parts.append(linea.strip()[:100])
    return " | ".join(info_parts[-5:]) if info_parts else ""


def ejecutar_todos_los_tests(youtube_id: str) -> list[ResultadoTest]:
    """Ejecutar todos los metodos de test y retornar resultados."""
    if not _YT_ID_RE.match(youtube_id):
        return [ResultadoTest("validacion", False, 0, error=f"ID invalido: {youtube_id}")]

    resultados: list[ResultadoTest] = []

    with tempfile.TemporaryDirectory(prefix="yt_test_") as tmpdir:
        logger.info("=" * 60)
        logger.info("TEST YouTube download — video_id=%s", youtube_id)
        logger.info("Output dir: %s", tmpdir)
        logger.info("=" * 60)

        # 1. InnerTube directo (rapido, sin descarga real, prueba disponibilidad)
        logger.info("\n--- InnerTube API directa ---")
        resultados.extend(test_innertube_direct(youtube_id, tmpdir))

        # 2. yt-dlp default
        logger.info("\n--- yt-dlp default ---")
        resultados.append(test_ytdlp_default(youtube_id, tmpdir))

        # 3. yt-dlp cookies
        logger.info("\n--- yt-dlp cookies ---")
        resultados.append(test_ytdlp_cookies(youtube_id, tmpdir))

        # 4. yt-dlp clientes especificos
        logger.info("\n--- yt-dlp clientes especificos ---")
        resultados.extend(test_ytdlp_clients(youtube_id, tmpdir))

        # 5. yt-dlp PO token
        logger.info("\n--- yt-dlp PO token ---")
        resultados.append(test_ytdlp_po_token(youtube_id, tmpdir))

        # 6. cobalt.tools API
        logger.info("\n--- cobalt.tools API ---")
        resultados.append(test_cobalt_api(youtube_id, tmpdir))

    return resultados


def ejecutar_metodo_especifico(youtube_id: str, metodo: str) -> list[ResultadoTest]:
    """Ejecutar un metodo especifico de test."""
    if not _YT_ID_RE.match(youtube_id):
        return [ResultadoTest("validacion", False, 0, error=f"ID invalido: {youtube_id}")]

    with tempfile.TemporaryDirectory(prefix="yt_test_") as tmpdir:
        if metodo == "innertube":
            return test_innertube_direct(youtube_id, tmpdir)
        elif metodo == "ytdlp_default":
            return [test_ytdlp_default(youtube_id, tmpdir)]
        elif metodo == "ytdlp_cookies":
            return [test_ytdlp_cookies(youtube_id, tmpdir)]
        elif metodo == "ytdlp_clients":
            return test_ytdlp_clients(youtube_id, tmpdir)
        elif metodo == "ytdlp_po_token":
            return [test_ytdlp_po_token(youtube_id, tmpdir)]
        elif metodo == "cobalt":
            return [test_cobalt_api(youtube_id, tmpdir)]
        else:
            return [ResultadoTest("error", False, 0, error=f"Metodo desconocido: {metodo}")]


def resultados_a_dict(resultados: list[ResultadoTest]) -> list[dict]:
    """Convertir resultados a lista de dicts serializables."""
    return [dataclasses.asdict(r) for r in resultados]


def imprimir_resumen(resultados: list[ResultadoTest]) -> None:
    """Imprimir tabla resumen de resultados."""
    print("\n" + "=" * 80)
    print(f"{'METODO':<30} {'EXITO':<8} {'TIEMPO':<10} {'TAMANO':<12} {'DETALLES/ERROR'}")
    print("-" * 80)
    for r in resultados:
        estado = "OK" if r.exito else "FALLO"
        tamano = f"{r.tamano_bytes // 1024}KB" if r.tamano_bytes > 0 else "-"
        tiempo = f"{r.tiempo_seg:.1f}s"
        info = r.detalles[:40] if r.exito else r.error[:40]
        print(f"{r.metodo:<30} {estado:<8} {tiempo:<10} {tamano:<12} {info}")
    print("=" * 80)

    exitosos = sum(1 for r in resultados if r.exito)
    total = len(resultados)
    print(f"\nResumen: {exitosos}/{total} metodos exitosos")


def main():
    parser = argparse.ArgumentParser(
        description="Test de metodos de descarga YouTube — Investigacion QQ122"
    )
    parser.add_argument(
        "--video-id", type=str, default="dQw4w9WgXcQ",
        help="YouTube video ID para testear (default: dQw4w9WgXcQ)"
    )
    parser.add_argument(
        "--metodo", type=str, default="todos",
        choices=["todos", "innertube", "ytdlp_default", "ytdlp_cookies",
                 "ytdlp_clients", "ytdlp_po_token", "cobalt"],
        help="Metodo especifico a probar (default: todos)"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Salida en formato JSON"
    )
    args = parser.parse_args()

    if args.metodo == "todos":
        resultados = ejecutar_todos_los_tests(args.video_id)
    else:
        resultados = ejecutar_metodo_especifico(args.video_id, args.metodo)

    if args.json:
        print(json.dumps(resultados_a_dict(resultados), indent=2, ensure_ascii=False))
    else:
        imprimir_resumen(resultados)


if __name__ == "__main__":
    main()
