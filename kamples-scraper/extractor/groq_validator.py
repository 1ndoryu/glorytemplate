"""
Validacion de resultados de busqueda usando Groq LLM.

Pregunta a un modelo LLM rapido si el resultado de SoundCloud/YouTube es realmente
la cancion buscada. Previene descargas incorrectas cuando la puntuacion textual no
es suficiente para distinguir versiones (live, covered, variaciones de nombre).

Modelo: llama-3.1-8b-instant (rapido, bajo costo, suficiente para clasificacion yes/no).
Fallback: si Groq falla (timeout, rate limit, API down), retorna True (permisivo) para
no bloquear el pipeline.

Requiere: GROQ_API_KEY en .env
"""

import json
import logging
import os
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "llama-3.1-8b-instant"
_GROQ_TIMEOUT = 10


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
    Pregunta a Groq si el resultado encontrado corresponde a la cancion buscada.

    Retorna True si es match, False si no.
    En caso de error (timeout, rate limit, API down), retorna True (permisivo)
    para no bloquear el pipeline.
    """
    api_key = _obtener_api_key()
    if not api_key:
        return True

    prompt = (
        f"I'm searching for the specific song \"{busqueda_titulo}\" by \"{busqueda_artista}\".\n"
        f"A music platform returned this result: \"{resultado_titulo}\" by \"{resultado_artista}\".\n\n"
        f"Is this the SAME specific song? Minor spelling differences in artist names are OK "
        f"(e.g. 'Honey Drippers' vs 'Honeydrippers', 'Dj' vs 'DJ'). Also OK if the uploader "
        f"name differs but the song title and original artist match. "
        f"NOT OK: remixes, covers, live versions, DJ sets, medleys, or different songs by the "
        f"same artist — unless the search specifically asked for that version.\n"
        f"Answer ONLY 'yes' or 'no'."
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
                # Cloudflare bloquea Python-urllib con 403 1010 — simular SDK oficial
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
            "Groq validacion: '%s - %s' vs '%s - %s' -> %s (%s)",
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
