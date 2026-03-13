"""
Validacion de resultados de busqueda usando similitud textual + Groq LLM.

Arquitectura de 2 capas para reducir falsos positivos:
  1. Pre-screening con similitud textual normalizada (SequenceMatcher).
     Si la similitud es >= UMBRAL_SIMILITUD_ALTA se acepta sin LLM.
     Si es <= UMBRAL_SIMILITUD_BAJA se rechaza sin LLM.
  2. Para la zona gris intermedia, validacion con LLM (Groq).

Modelo: llama-3.3-70b-versatile (mejor razonamiento que 8b, igual de rapido en Groq).
Fallback: si Groq falla (timeout, rate limit, API down), retorna True (permisivo) para
no bloquear el pipeline.

Requiere: GROQ_API_KEY en .env
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
_GROQ_MODEL = "llama-3.3-70b-versatile"
_GROQ_TIMEOUT = 12

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


def _obtener_api_key() -> str | None:
    """Lee GROQ_API_KEY de variables de entorno (via load_dotenv)."""
    return os.getenv("GROQ_API_KEY", "").strip() or None


def habilitado() -> bool:
    """Retorna True si la validacion Groq esta configurada."""
    return _obtener_api_key() is not None


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
    En caso de error de LLM, retorna True (permisivo).
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

    payload = json.dumps({
        "model": _GROQ_MODEL,
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
                "User-Agent": "groq-python/0.13.0",
                "x-stainless-lang": "python",
                "x-stainless-os": "Windows",
                "x-stainless-runtime": "CPython",
            },
        )
        with urllib.request.urlopen(req, timeout=_GROQ_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        respuesta = data["choices"][0]["message"]["content"].strip().lower()
        es_match = respuesta.startswith("yes") or respuesta.startswith("si")

        logger.info(
            "Groq LLM (score_textual=%.2f): '%s - %s' vs '%s - %s' -> %s (%s)",
            score_textual,
            busqueda_artista, busqueda_titulo,
            resultado_artista, resultado_titulo,
            "MATCH" if es_match else "RECHAZADO",
            respuesta,
        )
        return es_match

    except urllib.error.HTTPError as e:
        if e.code == 429:
            logger.warning("Groq rate limit (429) — permitiendo sin validacion")
        else:
            logger.warning("Groq HTTP error %d — permitiendo sin validacion", e.code)
        return True
    except (urllib.error.URLError, OSError) as e:
        logger.warning("Groq conexion fallida — permitiendo sin validacion: %s", e)
        return True
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.warning("Groq respuesta invalida — permitiendo sin validacion: %s", e)
        return True
