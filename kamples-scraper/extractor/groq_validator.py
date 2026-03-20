"""
Validacion de resultados de busqueda usando similitud textual + Groq LLM.

Arquitectura de 2 capas para reducir falsos positivos:
  1. Pre-screening con similitud textual normalizada (SequenceMatcher).
     Si la similitud es >= UMBRAL_SIMILITUD_ALTA se acepta sin LLM.
     Si es <= UMBRAL_SIMILITUD_BAJA se rechaza sin LLM.
  2. Para la zona gris intermedia, validacion con LLM (Groq).

Modelos: rotacion automatica llama-3.3-70b -> qwen3-32b -> llama-4-scout (QL117).

[193A-94] Rotacion de API keys: usa GROQ_API_1, GROQ_API_2, GROQ_API_3
(mismas que PHP/GroqHttpClient). Si no existen, cae en GROQ_API_KEY legacy.
Sin gap entre peticiones IA — el pipeline no necesita delays para validacion.

Manejo de errores (QL111):
  - 429 rate limit / errores de red: permisivo (True) — transitorios, no bloquean pipeline.
  - Respuesta JSON invalida / KeyError: restrictivo (False) — datos no confiables, rechazar match.
"""

import json
import logging
import os
import re
import unicodedata
import urllib.error
import urllib.request
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_TIMEOUT = 12

# QL117: Rotacion de modelos — si el primario falla (429/5xx), se intenta el siguiente.
# Cada modelo tiene cuota independiente en Groq, asi que un 429 en uno no afecta a otro.
_GROQ_MODELOS = [
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]

# Umbrales para pre-screening textual (0.0 - 1.0)
UMBRAL_SIMILITUD_ALTA = 0.80
UMBRAL_SIMILITUD_BAJA = 0.25


def _normalizar_texto(texto: str) -> str:
    """Normaliza para comparacion: lowercase, sin acentos, sin puntuacion extra."""
    texto = unicodedata.normalize("NFKD", texto.lower())
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def _similitud(a: str, b: str) -> float:
    """Ratio de similitud entre dos strings normalizados."""
    na = _normalizar_texto(a)
    nb = _normalizar_texto(b)
    if not na or not nb:
        return 0.0
    return SequenceMatcher(None, na, nb).ratio()


def _similitud_combinada(
    busqueda_artista: str,
    busqueda_titulo: str,
    resultado_artista: str,
    resultado_titulo: str,
) -> float:
    """
    Score combinado de similitud: 60% peso titulo, 40% peso artista.
    El titulo pesa mas porque es mas discriminante que el artista.
    """
    sim_titulo = _similitud(busqueda_titulo, resultado_titulo)
    sim_artista = _similitud(busqueda_artista, resultado_artista)
    return sim_titulo * 0.6 + sim_artista * 0.4


"""
[193A-94] Rotacion de API keys Groq — mismas env vars que PHP (GROQ_API_1/2/3).
Indice en memoria: rota por cada llamada exitosa. Sin gap entre peticiones.
Fallback a GROQ_API_KEY legacy si no hay keys numeradas.
"""
_groq_key_index = 0


def _obtener_todas_las_keys() -> list[str]:
    """Carga todas las keys Groq validas de las env vars."""
    keys = []
    for nombre in ("GROQ_API_1", "GROQ_API_2", "GROQ_API_3"):
        val = os.getenv(nombre, "").strip()
        if val and val.startswith("gsk_"):
            keys.append(val)
    if not keys:
        legacy = os.getenv("GROQ_API_KEY", "").strip()
        if legacy and legacy.startswith("gsk_"):
            keys.append(legacy)
    return keys


def _obtener_api_key() -> str | None:
    """Obtiene la key actual segun el indice de rotacion."""
    global _groq_key_index
    keys = _obtener_todas_las_keys()
    if not keys:
        return None
    return keys[_groq_key_index % len(keys)]


def _rotar_api_key() -> None:
    """Avanza al siguiente indice de rotacion."""
    global _groq_key_index
    keys = _obtener_todas_las_keys()
    if len(keys) > 1:
        _groq_key_index = (_groq_key_index + 1) % len(keys)


def habilitado() -> bool:
    """Retorna True si hay al menos una key Groq configurada."""
    return len(_obtener_todas_las_keys()) > 0


def validar_match(
    busqueda_artista: str,
    busqueda_titulo: str,
    resultado_artista: str,
    resultado_titulo: str,
) -> bool:
    """
    Valida si el resultado corresponde a la cancion buscada.

    Capa 1: Pre-screening textual rapido.
    Capa 2: Validacion LLM para zona gris.

    Retorna True si es match, False si no.
    En caso de error transitorio (429, red), retorna True (permisivo).
    En caso de respuesta corrupta (JSON invalido, KeyError), retorna False (restrictivo).
    """
    # Capa 1: Pre-screening por similitud textual
    score = _similitud_combinada(
        busqueda_artista, busqueda_titulo,
        resultado_artista, resultado_titulo,
    )

    if score >= UMBRAL_SIMILITUD_ALTA:
        logger.info(
            "Pre-screen ACEPTADO (score=%.2f): '%s - %s' vs '%s - %s'",
            score, busqueda_artista, busqueda_titulo,
            resultado_artista, resultado_titulo,
        )
        return True

    if score <= UMBRAL_SIMILITUD_BAJA:
        logger.info(
            "Pre-screen RECHAZADO (score=%.2f): '%s - %s' vs '%s - %s'",
            score, busqueda_artista, busqueda_titulo,
            resultado_artista, resultado_titulo,
        )
        return False

    # Capa 2: Zona gris — consultar LLM
    return _validar_con_llm(
        busqueda_artista, busqueda_titulo,
        resultado_artista, resultado_titulo,
        score,
    )


def _validar_con_llm(
    busqueda_artista: str,
    busqueda_titulo: str,
    resultado_artista: str,
    resultado_titulo: str,
    score_textual: float,
) -> bool:
    """Capa 2: validacion via Groq LLM con prompt few-shot."""
    api_key = _obtener_api_key()
    if not api_key:
        return True

    prompt = (
        "You are a music metadata validator. Determine if a search result is the SAME song.\n\n"
        "RULES:\n"
        "- Minor artist name variations are OK: spacing, punctuation, abbreviations, "
        "transliterations (e.g. 'Honey Drippers' = 'Honeydrippers', 'DJ Shadow' = 'Dj Shadow', "
        "'Led Zeppelin' = 'Led Zepellin').\n"
        "- Uploader name may differ from original artist — focus on whether the SONG is correct.\n"
        "- Extra tags in title are OK if the core song title matches: "
        "'Sea of Love (Official Audio)' = 'Sea of Love'.\n"
        "- NOT the same: remixes, covers, live versions, DJ sets, medleys, mashups, "
        "sped up/slowed versions, or completely different songs.\n\n"
        "EXAMPLES:\n"
        "Search: 'Sea of Love' by 'The Honeydrippers' | Result: 'Sea of Love' by 'Honey Drippers' -> yes\n"
        "Search: 'Roxanne' by 'The Police' | Result: 'Roxanne (Live at MSG)' by 'The Police' -> no\n"
        "Search: 'No Diggity' by 'Blackstreet' | Result: 'No Diggity' by 'BLACKstreet ft Dr Dre' -> yes\n"
        "Search: 'Billie Jean' by 'Michael Jackson' | Result: 'Billie Jean (Remix)' by 'MJ' -> no\n"
        "Search: 'Superstition' by 'Stevie Wonder' | Result: 'Superstition' by 'stevie_wonder_official' -> yes\n\n"
        f"Search: '{busqueda_titulo}' by '{busqueda_artista}'\n"
        f"Result: '{resultado_titulo}' by '{resultado_artista}'\n\n"
        "Answer ONLY 'yes' or 'no'."
    )

    # QL117: Intentar cada modelo en orden; si falla con 429/5xx, probar el siguiente.
    for modelo in _GROQ_MODELOS:
        resultado = _intentar_modelo(
            modelo, api_key, prompt,
            busqueda_artista, busqueda_titulo,
            resultado_artista, resultado_titulo,
            score_textual,
        )
        if resultado is not None:
            _rotar_api_key()
            return resultado
        # None = error reintentable, probar siguiente modelo

    # [193A-94] Todos los modelos fallaron con esta key — rotar para la siguiente llamada
    _rotar_api_key()
    # Todos los modelos fallaron: permisivo para no bloquear pipeline
    logger.warning("Todos los modelos Groq fallaron — permitiendo sin validacion")
    return True


def _intentar_modelo(
    modelo: str,
    api_key: str,
    prompt: str,
    busqueda_artista: str,
    busqueda_titulo: str,
    resultado_artista: str,
    resultado_titulo: str,
    score_textual: float,
) -> bool | None:
    """Intenta validar con un modelo especifico. Retorna bool si exito, None si reintentable."""
    payload = json.dumps({
        "model": modelo,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 5,
        "temperature": 0,
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            _GROQ_API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=_GROQ_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        respuesta = data["choices"][0]["message"]["content"].strip().lower()
        es_match = respuesta.startswith("yes") or respuesta.startswith("si")

        logger.info(
            "Groq LLM [%s] (score=%.2f): '%s - %s' vs '%s - %s' -> %s (%s)",
            modelo, score_textual,
            busqueda_artista, busqueda_titulo,
            resultado_artista, resultado_titulo,
            "MATCH" if es_match else "RECHAZADO",
            respuesta,
        )
        return es_match

    except urllib.error.HTTPError as e:
        if e.code == 429:
            retry_info = ""
            try:
                body = e.read().decode("utf-8", errors="replace")
                import re as _re
                m = _re.search(r"Please retry in\s*([0-9]+(?:\.[0-9]+)?)s", body)
                if m:
                    retry_info = f" (retry sugerido: {m.group(1)}s)"
            except Exception:
                pass
            logger.warning("Groq [%s] rate limit (429)%s — probando siguiente modelo", modelo, retry_info)
            return None
        if e.code >= 500:
            logger.warning("Groq [%s] server error %d — probando siguiente modelo", modelo, e.code)
            return None
        # 400/401/403: error permanente, no reintentar con otro modelo
        logger.warning("Groq [%s] HTTP %d — permitiendo sin validacion", modelo, e.code)
        return True
    except (urllib.error.URLError, OSError) as e:
        logger.warning("Groq [%s] conexion fallida — probando siguiente modelo: %s", modelo, e)
        return None
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        # QL111: Respuesta corrupta = datos no confiables → rechazar match
        logger.error("Groq [%s] respuesta invalida — rechazando match: %s", modelo, e)
        return False
