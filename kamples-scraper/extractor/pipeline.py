"""
Orquestador del pipeline de extraccion de audio.

Flujo unificado (dos fases):
1. Python: descargar audio -> analizar BPM -> recortar -> guardar MP3
2. PHP: publicar via PipelineAudio estandar (waveform, preview, IA, hash, embedding)

Python solo marca la cola como 'extraido' con la ruta del archivo.
PHP (DevController::publicarExtracciones) se encarga de la publicacion real.

Ejecutar:
  python -m extractor.pipeline --limit 100
  python -m extractor.pipeline --continuo --limite-diario 2000 --intervalo 60

Modo continuo: procesa lotes, auto-encola relaciones sin samples cuando la cola
esta vacia, reintenta despues de 30 minutos, y se detiene si SoundCloud devuelve
error de autenticacion (ban o token vencido).
"""

import argparse
import json
import logging
import os
import sys
import tempfile
import time
import urllib.request

from kamples_scraper.utils.db import get_connection
from extractor.audio_download import descargar_audio, limpiar_audio, SoundCloudAuthError
from extractor.bpm_analyzer import analizar_bpm
from extractor.sample_cutter import calcular_recorte, recortar_audio
from extractor.kamples_inserter import registrar_extraccion
from extractor.rate_limiter import RateLimiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Maximo de intentos antes de marcar revision_humana
MAX_INTENTOS = 5

# Backoff: delay en dias por intento (capped a 4 dias)
BACKOFF_MAX_DIAS = 4


def obtener_pendientes(limit: int = 100) -> list[dict]:
    """
    Obtener elementos pendientes de la cola de extracción (bilateral).
    QK20: Cover/remix se depriorizan. QK26: Cover/remix excluidos del pipeline.
    Artistas prioritarios (prioridad > 0) se procesan primero.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ce.id, ce.relacion_id, ce.youtube_id, ce.spotify_id, "
                "       ce.timing_inicio_seg, ce.lado, "
                "       rs.tipo_relacion, rs.tipo_elemento, "
                "       rs.cancion_destino_id, rs.cancion_fuente_id, "
                "       c_dest.titulo AS destino_titulo, "
                "       a_dest.nombre AS destino_artista, "
                "       c_fuente.titulo AS fuente_titulo, "
                "       a_fuente.nombre AS fuente_artista, "
                "       rs.votos_total "
                "FROM cola_extraccion_samples ce "
                "JOIN relaciones_sample rs ON ce.relacion_id = rs.id "
                "JOIN canciones c_dest ON rs.cancion_destino_id = c_dest.id "
                "JOIN artistas_musicales a_dest ON c_dest.artista_id = a_dest.id "
                "JOIN canciones c_fuente ON rs.cancion_fuente_id = c_fuente.id "
                "JOIN artistas_musicales a_fuente ON c_fuente.artista_id = a_fuente.id "
                "WHERE ce.estado = 'pendiente' AND ce.intentos < %s "
                "AND (ce.proximo_intento_at IS NULL OR ce.proximo_intento_at <= NOW()) "
                "AND rs.tipo_relacion NOT IN ('cover', 'remix') "
                "ORDER BY "
                "  CASE WHEN ce.intentos = 0 THEN 0 ELSE 1 END ASC, "
                "  GREATEST(COALESCE(a_fuente.prioridad, 0), COALESCE(a_dest.prioridad, 0)) DESC, "
                "  rs.votos_total DESC NULLS LAST, "
                "  ce.created_at ASC "
                "LIMIT %s",
                (MAX_INTENTOS, limit),
            )
            columnas = [desc[0] for desc in cur.description]
            return [dict(zip(columnas, row)) for row in cur.fetchall()]
    finally:
        conn.close()


def actualizar_estado_cola(cola_id: int, estado: str, error: str | None = None) -> None:
    """
    Actualizar estado de un elemento en la cola.
    Si hay error, aplica backoff exponencial y auto-marca revision_humana al
    alcanzar MAX_INTENTOS.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if error:
                # Backoff: min(2^intentos, BACKOFF_MAX_DIAS) dias
                cur.execute(
                    "UPDATE cola_extraccion_samples "
                    "SET estado = %s, error_mensaje = %s, "
                    "    proximo_intento_at = NOW() + (LEAST(POWER(2, intentos), %s) || ' days')::INTERVAL "
                    "WHERE id = %s",
                    (estado, error[:1000], BACKOFF_MAX_DIAS, cola_id),
                )
                # Auto-marcar revision_humana si se alcanzaron los intentos maximos
                cur.execute(
                    "UPDATE cola_extraccion_samples "
                    "SET estado = 'revision_humana' "
                    "WHERE id = %s AND intentos >= %s AND estado = 'error'",
                    (cola_id, MAX_INTENTOS),
                )
            elif estado == "descargando":
                # Inicio de intento de extraccion: incrementar intentos atomicamente
                cur.execute(
                    "UPDATE cola_extraccion_samples "
                    "SET estado = %s, intentos = intentos + 1 WHERE id = %s",
                    (estado, cola_id),
                )
            else:
                cur.execute(
                    "UPDATE cola_extraccion_samples SET estado = %s WHERE id = %s",
                    (estado, cola_id),
                )
            conn.commit()
    except Exception:
        conn.rollback()
        logger.exception("Error actualizando cola id=%d", cola_id)
    finally:
        conn.close()


def procesar_elemento(item: dict, output_dir: str) -> bool:
    """
    Procesar un elemento de la cola: descargar -> analizar -> recortar -> insertar.
    Soporta bilateral (fuente/destino) y Spotify como fuente de audio alternativa.
    """
    cola_id = item["id"]
    youtube_id = item.get("youtube_id")
    spotify_id = item.get("spotify_id")
    timing = item["timing_inicio_seg"]
    lado = item.get("lado", "fuente")

    # QQ137: Usar artista/titulo del lado correspondiente para busqueda SoundCloud
    prefijo_lado = "destino" if lado == "destino" else "fuente"
    artista_lado = item.get(f"{prefijo_lado}_artista", "")
    titulo_lado = item.get(f"{prefijo_lado}_titulo", "")

    logger.info(
        "Procesando cola_id=%d lado=%s: %s - %s [timing=%ds] yt=%s spotify=%s",
        cola_id, lado,
        artista_lado,
        titulo_lado,
        timing,
        youtube_id or "N/A",
        spotify_id or "N/A",
    )

    wav_path = None
    recorte_path = None
    t_total = time.monotonic()

    try:
        # 1. Descargar audio (SoundCloud prioritario, fallback YouTube/Deezer/Spotify)
        actualizar_estado_cola(cola_id, "descargando")
        t0 = time.monotonic()
        resultado_descarga = descargar_audio(
            youtube_id, output_dir,
            spotify_id=spotify_id,
            artista=artista_lado,
            titulo=titulo_lado,
            timing_seg=timing,
        )
        if not resultado_descarga:
            actualizar_estado_cola(cola_id, "error", "Descarga de audio fallida (todas las fuentes)")
            item["_motivo_fallo"] = "sin_fuente_audio"
            return False
        wav_path = resultado_descarga.ruta
        size_mb = os.path.getsize(wav_path) / (1024 * 1024) if os.path.exists(wav_path) else 0
        logger.info(
            "[cola=%d] Paso 1/5 Descarga (%s): %.1fs, archivo=%s (%.1f MB)",
            cola_id, resultado_descarga.metodo, time.monotonic() - t0, wav_path, size_mb,
        )

        # 2. Analizar BPM
        actualizar_estado_cola(cola_id, "analizando")
        t0 = time.monotonic()
        analisis = analizar_bpm(wav_path)
        logger.info(
            "[cola=%d] Paso 2/5 BPM: %.1fs, bpm=%.0f, confianza=%.2f, beats=%d",
            cola_id, time.monotonic() - t0,
            analisis.bpm if analisis else 0,
            analisis.confianza if analisis else 0,
            len(analisis.beats) if analisis else 0,
        )

        # 3. Calcular recorte
        actualizar_estado_cola(cola_id, "recortando")
        t0 = time.monotonic()
        recorte = calcular_recorte(timing, analisis)
        logger.info(
            "[cola=%d] Paso 3/5 Calculo recorte: %.1fs, inicio=%.2f fin=%.2f dur=%.1fs alineado=%s",
            cola_id, time.monotonic() - t0,
            recorte.inicio, recorte.fin, recorte.duracion, recorte.recorte_por_compas,
        )

        # 4. Ejecutar recorte (MP3 320kbps)
        recorte_path = os.path.join(
            output_dir,
            f"sample_{cola_id}_{lado}_{youtube_id or spotify_id or 'unknown'}.mp3",
        )
        t0 = time.monotonic()
        exito = recortar_audio(wav_path, recorte, recorte_path)
        if not exito:
            actualizar_estado_cola(cola_id, "error", "Recorte de audio fallido")
            item["_motivo_fallo"] = "recorte_fallido"
            return False
        size_kb = os.path.getsize(recorte_path) / 1024 if os.path.exists(recorte_path) else 0
        logger.info(
            "[cola=%d] Paso 4/5 Recorte ffmpeg: %.1fs, salida=%s (%.0f KB)",
            cola_id, time.monotonic() - t0, recorte_path, size_kb,
        )

        # 5. Registrar extraccion (marca cola como 'extraido', PHP publica via PipelineAudio)
        metadata_cancion = {
            "fuente_titulo": item.get("fuente_titulo", ""),
            "fuente_artista": item.get("fuente_artista", ""),
            "destino_titulo": item.get("destino_titulo", ""),
            "destino_artista": item.get("destino_artista", ""),
            "tipo_elemento": item.get("tipo_elemento", ""),
            "votos_total": item.get("votos_total", 0),
            "cancion_fuente_id": item.get("cancion_fuente_id"),
            "cancion_destino_id": item.get("cancion_destino_id"),
            "descarga_metodo": resultado_descarga.metodo,
            "descarga_fuente_url": resultado_descarga.fuente_url,
            "descarga_fuente_titulo": resultado_descarga.fuente_titulo,
            "descarga_fuente_artista": resultado_descarga.fuente_artista,
            # QQ121: Registrar fuentes que fallaron antes de la exitosa
            "fuentes_descartadas": resultado_descarga.fuentes_intentadas,
        }

        t0 = time.monotonic()
        ok = registrar_extraccion(
            cola_id=cola_id,
            relacion_id=item["relacion_id"],
            recorte=recorte,
            audio_path=recorte_path,
            metadata_cancion=metadata_cancion,
            lado=lado,
            ruta_audio_completo=wav_path,
        )

        if ok:
            elapsed_total = time.monotonic() - t_total
            logger.info(
                "[cola=%d] Paso 5/5 Registro: %.1fs",
                cola_id, time.monotonic() - t0,
            )
            logger.info(
                "EXTRAIDO cola=%d lado=%s | total=%.1fs | dur=%.1fs BPM=%.0f alineado=%s",
                cola_id, lado, elapsed_total,
                recorte.duracion, recorte.bpm, recorte.recorte_por_compas,
            )
            return True
        else:
            actualizar_estado_cola(cola_id, "error", "Registro de extraccion fallido")
            item["_motivo_fallo"] = "registro_fallido"
            return False

    except Exception as e:
        logger.exception("Error procesando cola_id=%d lado=%s", cola_id, lado)
        actualizar_estado_cola(cola_id, "error", str(e)[:1000])
        item["_motivo_fallo"] = f"excepcion: {type(e).__name__}"
        return False
    finally:
        # Limpiar audio completo SOLO si la extraccion fallo.
        # Si fue exitosa, PHP copiara el archivo a uploads persistente y lo limpiara.
        if wav_path and wav_path != recorte_path:
            extraccion_exitosa = item.get("_motivo_fallo") is None
            if not extraccion_exitosa:
                limpiar_audio(wav_path)


def notificar_publicacion(exitosos: int) -> None:
    """
    Llama al endpoint REST de publicacion automatica cuando Python termina la extraccion.
    Usa X-Kamples-Secret para autenticarse sin sesion WordPress.
    Esto garantiza que la publicacion ocurre DESPUES de que los items esten en 'extraido'.
    """
    if exitosos == 0:
        return

    # Preferir URL interna (http://localhost) para evitar SSL desde dentro del container
    site_url = os.getenv("KAMPLES_INTERNAL_URL", "").rstrip("/") or os.getenv(
        "KAMPLES_SITE_URL", ""
    ).rstrip("/")
    secret = os.getenv("KAMPLES_CRON_SECRET", "")

    if not site_url or not secret:
        logger.warning(
            "KAMPLES_INTERNAL_URL/KAMPLES_SITE_URL o KAMPLES_CRON_SECRET no configurados — publicacion manual requerida."
        )
        return

    endpoint = f"{site_url}/wp-json/kamples/v1/dev/extraccion/publicar-auto"
    try:
        req = urllib.request.Request(endpoint, method="POST", data=b"")
        req.add_header("Content-Type", "application/json")
        req.add_header("X-Kamples-Secret", secret)
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            logger.info(
                "Publicacion automatica disparada [HTTP %s]: %s",
                resp.status, body[:200],
            )
    except Exception as e:
        logger.warning("No se pudo llamar al endpoint de publicacion: %s", e)


def reportar_lote(exitosos: int, fallidos: int, motivos_fallo: dict[str, int] | None = None) -> None:
    """
    [223A-3] Reporta resultados del lote al endpoint de automatizacion PHP.
    Usa KAMPLES_BATCH_ID (inyectado por ServicioAutomatizacion) para identificar el lote.
    Si no hay batch_id (ejecucion manual), no reporta.
    """
    batch_id = os.getenv("KAMPLES_BATCH_ID", "").strip()
    if not batch_id:
        return

    site_url = os.getenv("KAMPLES_INTERNAL_URL", "").rstrip("/") or os.getenv(
        "KAMPLES_SITE_URL", ""
    ).rstrip("/")
    secret = os.getenv("KAMPLES_CRON_SECRET", "")

    if not site_url or not secret:
        logger.warning("No se puede reportar lote — URL/secret no configurados")
        return

    payload = json.dumps({
        "batch_id": int(batch_id),
        "exitosos": exitosos,
        "fallidos": fallidos,
        "recortes": exitosos,
        "metadata": {"motivos_fallo": motivos_fallo or {}},
    }).encode("utf-8")

    endpoint = f"{site_url}/wp-json/kamples/v1/admin/automatizacion/reporte-lote"
    try:
        req = urllib.request.Request(endpoint, method="POST", data=payload)
        req.add_header("Content-Type", "application/json")
        req.add_header("X-Kamples-Secret", secret)
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            logger.info("Reporte de lote enviado [HTTP %s]: %s", resp.status, body[:200])
    except Exception as e:
        logger.warning("No se pudo reportar lote batch_id=%s: %s", batch_id, e)


def _parsear_timings(raw) -> list:
    """Parsear campo timings (puede ser string JSON, lista, o None)."""
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str) and raw:
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, ValueError):
            return []
    return []


def auto_encolar_pendientes(limit: int = 50) -> int:
    """
    Busca relaciones sin samples vinculados y las encola automaticamente.

    Consulta relaciones_sample donde sample_fuente_id o sample_destino_id es NULL,
    y no existe entrada activa en cola_extraccion_samples para ese lado.
    Crea entradas con ON CONFLICT DO NOTHING para dedup atomica.

    Retorna el numero de items encolados.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT rs.id, "
                "       c_fuente.youtube_id AS fuente_youtube_id, "
                "       c_dest.youtube_id AS destino_youtube_id, "
                "       c_fuente.spotify_id AS fuente_spotify_id, "
                "       c_dest.spotify_id AS destino_spotify_id, "
                "       rs.timings_fuente, rs.timings_destino, "
                "       rs.sample_fuente_id, rs.sample_destino_id "
                "FROM relaciones_sample rs "
                "JOIN canciones c_fuente ON rs.cancion_fuente_id = c_fuente.id "
                "JOIN canciones c_dest ON rs.cancion_destino_id = c_dest.id "
                "JOIN artistas_musicales a_fuente ON c_fuente.artista_id = a_fuente.id "
                "JOIN artistas_musicales a_dest ON c_dest.artista_id = a_dest.id "
                "WHERE (rs.sample_fuente_id IS NULL OR rs.sample_destino_id IS NULL) "
                "AND rs.tipo_relacion NOT IN ('cover', 'remix') "
                "ORDER BY "
                "  GREATEST(COALESCE(a_fuente.prioridad, 0), COALESCE(a_dest.prioridad, 0)) DESC, "
                "  rs.votos_total DESC NULLS LAST "
                "LIMIT %s",
                (limit,),
            )
            columnas = [desc[0] for desc in cur.description]
            relaciones = [dict(zip(columnas, row)) for row in cur.fetchall()]

            if not relaciones:
                return 0

            encolados = 0
            for rel in relaciones:
                # Lado fuente
                if (
                    rel["sample_fuente_id"] is None
                    and (rel.get("fuente_youtube_id") or rel.get("fuente_spotify_id"))
                ):
                    timings = _parsear_timings(rel.get("timings_fuente"))
                    timing = int(timings[0]) if timings else 0
                    cur.execute(
                        "INSERT INTO cola_extraccion_samples "
                        "(relacion_id, youtube_id, spotify_id, timing_inicio_seg, lado) "
                        "VALUES (%s, %s, %s, %s, 'fuente') "
                        "ON CONFLICT (relacion_id, lado) DO NOTHING",
                        (rel["id"], rel.get("fuente_youtube_id"), rel.get("fuente_spotify_id"), timing),
                    )
                    encolados += cur.rowcount

                # Lado destino
                if (
                    rel["sample_destino_id"] is None
                    and (rel.get("destino_youtube_id") or rel.get("destino_spotify_id"))
                ):
                    timings = _parsear_timings(rel.get("timings_destino"))
                    timing = int(timings[0]) if timings else 0
                    cur.execute(
                        "INSERT INTO cola_extraccion_samples "
                        "(relacion_id, youtube_id, spotify_id, timing_inicio_seg, lado) "
                        "VALUES (%s, %s, %s, %s, 'destino') "
                        "ON CONFLICT (relacion_id, lado) DO NOTHING",
                        (rel["id"], rel.get("destino_youtube_id"), rel.get("destino_spotify_id"), timing),
                    )
                    encolados += cur.rowcount

            conn.commit()
            return encolados

    except Exception:
        conn.rollback()
        logger.exception("Error auto-encolando relaciones sin samples")
        return 0
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Pipeline de extraccion de audio Kamples")
    parser.add_argument("--limit", type=int, default=100, help="Maximo de items a procesar por lote")
    parser.add_argument("--output-dir", type=str, default=None, help="Directorio de salida")
    parser.add_argument(
        "--continuo", action="store_true",
        help="Modo continuo: auto-encola relaciones, reintenta cuando la cola esta vacia",
    )
    parser.add_argument(
        "--intervalo", type=float, default=60.0,
        help="Segundos minimos entre acciones, medido de inicio a inicio (default: 60)",
    )
    parser.add_argument(
        "--limite-diario", type=int, default=2000,
        help="Maximo de operaciones por dia (default: 2000)",
    )
    parser.add_argument(
        "--espera-vacio", type=int, default=1800,
        help="Segundos de espera cuando la cola esta vacia (default: 1800 = 30 min)",
    )
    parser.add_argument(
        "--jitter-min", type=float, default=60.0,
        help="Jitter aleatorio minimo en segundos entre items (default: 60 = 1 min)",
    )
    parser.add_argument(
        "--jitter-max", type=float, default=300.0,
        help="Jitter aleatorio maximo en segundos entre items (default: 300 = 5 min)",
    )
    args = parser.parse_args()

    output_dir = args.output_dir or os.getenv("AUDIO_TMP_DIR", tempfile.gettempdir())
    os.makedirs(output_dir, exist_ok=True)

    limiter = RateLimiter(
        intervalo_seg=args.intervalo,
        limite_diario=args.limite_diario,
        jitter_min_seg=args.jitter_min,
        jitter_max_seg=args.jitter_max,
    )
    logger.info(
        "Pipeline iniciado — modo=%s, intervalo=%.0fs, jitter=%.0fs-%.0fs, limite_diario=%d, restantes_hoy=%d",
        "continuo" if args.continuo else "lote",
        args.intervalo, args.jitter_min, args.jitter_max,
        args.limite_diario, limiter.restantes_hoy,
    )

    while True:
        pendientes = obtener_pendientes(args.limit)

        if not pendientes:
            # Auto-enqueue: buscar relaciones sin samples y crear entradas en cola
            encolados = auto_encolar_pendientes(limit=args.limit)
            if encolados > 0:
                logger.info("Auto-encolados %d items desde relaciones sin samples", encolados)
                pendientes = obtener_pendientes(args.limit)

        if not pendientes:
            if not args.continuo:
                logger.info("No hay elementos pendientes en la cola de extraccion")
                break
            logger.info(
                "Cola vacia. Reintentando en %d minutos...",
                args.espera_vacio // 60,
            )
            time.sleep(args.espera_vacio)
            continue

        logger.info("Procesando %d elementos de la cola!!!", len(pendientes))

        exitosos = 0
        fallidos = 0
        motivos_fallo: dict[str, int] = {}

        try:
            for item in pendientes:
                if not limiter.esperar():
                    logger.warning(
                        "Limite diario alcanzado (%d/%d). Deteniendo pipeline.",
                        limiter.operaciones_hoy, limiter.limite_diario,
                    )
                    break

                if procesar_elemento(item, output_dir):
                    exitosos += 1
                else:
                    fallidos += 1
                    motivo = item.get("_motivo_fallo", "desconocido")
                    motivos_fallo[motivo] = motivos_fallo.get(motivo, 0) + 1

        except SoundCloudAuthError as e:
            logger.critical(
                "PIPELINE DETENIDO: SoundCloud error de autenticacion. "
                "Probable ban de cuenta o token vencido. "
                "Verificar SOUNDCLOUD_OAUTH_TOKEN en .env y estado de la cuenta SC. "
                "Error: %s", e,
            )
            notificar_publicacion(exitosos)
            reportar_lote(exitosos, fallidos, motivos_fallo)
            return

        logger.info(
            "Lote completado: %d exitosos, %d fallidos de %d total",
            exitosos, fallidos, len(pendientes),
        )
        if motivos_fallo:
            logger.info(
                "Resumen de fallos: %s",
                ", ".join(f"{m}: {c}" for m, c in sorted(motivos_fallo.items(), key=lambda x: -x[1])),
            )

        notificar_publicacion(exitosos)
        reportar_lote(exitosos, fallidos, motivos_fallo)

        if not args.continuo:
            break


if __name__ == "__main__":
    main()
