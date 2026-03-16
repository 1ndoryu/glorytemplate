<?php

/**
 * ServicioIA — Orquestador de análisis creativo de audio con IA
 *
 * Cadena de fallback: Groq Whisper (audio→texto) → Groq LLM (texto→JSON) → OpenAI LLM (fallback)
 * Whisper: whisper-large-v3 → whisper-large-v3-turbo
 * LLM Groq: openai/gpt-oss-120b → llama-3.3-70b → kimi-k2 → qwen3-32b → llama-4-scout → gpt-oss-20b
 * LLM OpenAI (fallback): gpt-4o-mini (si OPENAI_API_KEY está configurada)
 *
 * QK80: Cuando todos los modelos Groq fallan (rate limit de cuenta o downtime),
 * se intenta OpenAI como proveedor alternativo para la etapa LLM.
 * Whisper STT NO tiene fallback a OpenAI (Groq STT es gratuito; la cola retríes).
 *
 * Analiza archivos de audio para extraer metadata CREATIVA:
 * tags, emociones, instrumentos, géneros, descripción, artistas similares.
 *
 * NO analiza BPM, tonalidad ni escala — eso lo hace AnalizadorAudio.php
 *
 * A06: Refactorizado — HTTP delegado a GroqHttpClient, parsing a JsonRepairer.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;
use App\Kamples\Api\GroqHttpClient;
use App\Kamples\Api\OpenAIHttpClient;
use App\Kamples\Api\PromptsIA;
use App\Kamples\Api\JsonRepairer;

class ServicioIA
{
    /* Modelos Whisper para análisis de audio (Groq Speech-to-Text) */
    private const MODELOS_WHISPER = [
        'whisper-large-v3',
        'whisper-large-v3-turbo',
    ];

    /*
     * QL67: Modelos Groq ordenados por inteligencia (fallback por cuota/error).
     * Cada modelo se reintenta hasta MAX_REINTENTOS_POR_MODELO veces antes de pasar al siguiente.
     * 429 en un modelo NO cancela la cadena — cada modelo tiene cuota independiente en Groq.
     * Solo si >3 modelos consecutivos dan 429 se considera limite de cuenta.
     */
    private const MODELOS_GROQ = [
        'openai/gpt-oss-120b',                         /* 120B — mejor calidad, 200K tok/dia */
        'moonshotai/kimi-k2-instruct-0905',             /* Kimi K2 actualizado, alta calidad */
        'moonshotai/kimi-k2-instruct',                  /* Kimi K2, 300K tok/dia, 60 RPM */
        'llama-3.3-70b-versatile',                      /* 70B — buena calidad, 100K tok/dia */
        'qwen/qwen3-32b',                               /* 32B MoE, 500K tok/dia, 60 RPM */
        'meta-llama/llama-4-scout-17b-16e-instruct',    /* 17B x 16 expertos MoE, 500K tok/dia */
        'openai/gpt-oss-20b',                           /* 20B fallback, 200K tok/dia */
        'groq/compound',                                /* Router — selecciona mejor modelo internamente */
    ];

    /*
     * QK80: Modelo OpenAI como fallback final cuando Groq falla completamente.
     * gpt-4o-mini: bajo costo ($0.15/1M input, $0.60/1M output), 128K contexto.
     * Solo se usa si OPENAI_API_KEY está configurada en .env.
     */
    private const MODELO_OPENAI_FALLBACK = 'gpt-4o-mini';

    private const TIMEOUT_AUDIO = 45;
    private const MAX_TAMANO_AUDIO = 25 * 1024 * 1024; /* 25 MB free tier Groq STT */

    /* QL67: Reintentos y pausas para modo cola (cron) */
    private const MAX_REINTENTOS_POR_MODELO = 3;
    private const PAUSA_REINTENTO_SEGUNDOS = 60;

    /* QL67: Umbral para considerar rate limit de cuenta (no individual) */
    private const UMBRAL_429_CONSECUTIVOS = 3;

    /**
     * Analiza un archivo de audio y retorna metadata creativa.
     * Flujo solo Groq: Whisper (audio->texto) + LLM (texto->JSON).
     * NO incluye campos técnicos (BPM, key, escala) — esos vienen de AnalizadorAudio.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $nombreOriginal Nombre original del archivo
     * @param string $descripcionUsuario Descripción proporcionada por el usuario
     * @param array $contextoTecnico Datos técnicos calculados previamente (bpm, key, escala, duracion, tags)
     * @param bool $modoCola Si true, reintentos lentos con sleep(60) por modelo (usado en ProcesadorColaIA)
     * @return array|null Metadata creativa extraída o null si falla
     */
    public static function analizarAudio(string $rutaArchivo, string $nombreOriginal, string $descripcionUsuario = '', array $contextoTecnico = [], bool $modoCola = false): ?array
    {
        if (!\file_exists($rutaArchivo)) {
            KamplesLogger::error('ServicioIA: Archivo no encontrado', ['ruta' => $rutaArchivo]);
            return null;
        }

        $prompt = PromptsIA::construirAnalisis($nombreOriginal, $descripcionUsuario, $contextoTecnico);

        $resultadoGroq = self::intentarGroqDesdeAudio($rutaArchivo, $prompt, $modoCola);
        if ($resultadoGroq !== null) {
            return $resultadoGroq;
        }

        KamplesLogger::critical('ServicioIA: Todos los proveedores fallaron (Groq + OpenAI) — sin transcripción Whisper no se puede continuar');
        return null;
    }

    /**
     * Ejecuta el flujo Groq para audio:
     * 1) Whisper transcribe audio
     * 2) LLM genera metadata creativa JSON (Groq → OpenAI fallback)
     *
     * QK80: Si Groq LLM falla (rate limit o error), intenta OpenAI como fallback.
     */
    private static function intentarGroqDesdeAudio(string $rutaArchivo, string $promptBase, bool $modoCola = false): ?array
    {
        $apiKey = GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA: API key de Groq no configurada');
            return null;
        }

        $tamano = \filesize($rutaArchivo);
        if ($tamano > self::MAX_TAMANO_AUDIO) {
            KamplesLogger::warning('ServicioIA: Archivo demasiado grande para Groq STT', ['tamano' => $tamano, 'max' => self::MAX_TAMANO_AUDIO]);
            return null;
        }

        $transcripcion = self::transcribirAudioConWhisper($rutaArchivo, $apiKey);
        if ($transcripcion === null) {
            KamplesLogger::warning('ServicioIA: No se obtuvo transcripción de audio con Whisper');
            return null;
        }

        $promptAnalisis = PromptsIA::conTranscripcion($promptBase, $transcripcion);

        /* Intentar todos los modelos Groq primero */
        $resultado = self::intentarGroq($promptAnalisis, $apiKey, $modoCola);
        if ($resultado !== null) {
            return $resultado;
        }

        /* QK80: Fallback a OpenAI si Groq falla completamente */
        return self::intentarOpenAIFallback($promptAnalisis);
    }

    /**
     * Transcribe audio con endpoint oficial Groq:
     * POST /openai/v1/audio/transcriptions (multipart/form-data)
     */
    private static function transcribirAudioConWhisper(string $rutaArchivo, string $apiKey): ?string
    {
        if (!\file_exists($rutaArchivo)) {
            return null;
        }

        $url = 'https://api.groq.com/openai/v1/audio/transcriptions';
        $mimeType = self::detectarMime($rutaArchivo);

        foreach (self::MODELOS_WHISPER as $modelo) {
            /* C356: Cortar cadena de fallback si Groq esta rate-limited (429 es cuenta completa, no por modelo) */
            if (GroqHttpClient::fueRateLimited()) {
                KamplesLogger::warning('ServicioIA: Rate limit Groq detectado, cancelando STT restante');
                return null;
            }

            KamplesLogger::info('ServicioIA: Transcribiendo audio con Groq/' . $modelo);

            $campos = [
                'model' => $modelo,
                'response_format' => 'verbose_json',
                'temperature' => '0',
            ];

            $archivo = new \CURLFile($rutaArchivo, $mimeType, \basename($rutaArchivo));
            $respuestaRaw = GroqHttpClient::peticionCurlMultipart(
                $url,
                $campos,
                'file',
                $archivo,
                ['Authorization: Bearer ' . $apiKey],
                "Groq-STT/{$modelo}",
                self::TIMEOUT_AUDIO
            );

            if ($respuestaRaw === null) {
                continue;
            }

            $respuesta = \json_decode($respuestaRaw, true);
            if (!\is_array($respuesta)) {
                KamplesLogger::error('ServicioIA: STT devolvió JSON inválido', [
                    'modelo' => $modelo,
                    'respuesta' => \mb_substr($respuestaRaw, 0, 800),
                ]);
                continue;
            }

            $texto = \trim((string) ($respuesta['text'] ?? ''));
            if ($texto !== '') {
                KamplesLogger::info('ServicioIA: Transcripción obtenida con Groq/' . $modelo, [
                    'chars' => \mb_strlen($texto),
                ]);
                return $texto;
            }

            KamplesLogger::warning('ServicioIA: STT sin texto útil', ['modelo' => $modelo]);
        }

        KamplesLogger::warning('ServicioIA: Todos los modelos Whisper fallaron en STT');
        return null;
    }

    /**
     * QL67: Intenta analizar con todos los modelos LLM Groq disponibles.
     * Cada modelo se reintenta hasta MAX_REINTENTOS_POR_MODELO veces.
     * En modoCola, espera PAUSA_REINTENTO_SEGUNDOS entre reintentos.
     * 429 en un modelo solo salta ese modelo (no cancela la cadena).
     * Si UMBRAL_429_CONSECUTIVOS modelos consecutivos dan 429, asume rate limit de cuenta.
     */
    private static function intentarGroq(string $prompt, ?string $apiKey = null, bool $modoCola = false): ?array
    {
        $apiKey = $apiKey ?: GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA: API key de Groq no configurada');
            return null;
        }

        $maxReintentos = $modoCola ? self::MAX_REINTENTOS_POR_MODELO : 1;
        $pausa = $modoCola ? self::PAUSA_REINTENTO_SEGUNDOS : 0;
        $consecutivos429 = 0;

        foreach (self::MODELOS_GROQ as $modelo) {
            /* QL67: Si demasiados modelos consecutivos dan 429, es rate limit de cuenta */
            if ($consecutivos429 >= self::UMBRAL_429_CONSECUTIVOS) {
                KamplesLogger::warning('ServicioIA: Rate limit de cuenta detectado (>= ' . self::UMBRAL_429_CONSECUTIVOS . ' modelos consecutivos con 429)');
                break;
            }

            $exitoModelo = false;
            for ($intento = 1; $intento <= $maxReintentos; $intento++) {
                if ($intento > 1 && $pausa > 0) {
                    KamplesLogger::info("ServicioIA: Esperando {$pausa}s antes de reintento {$intento}/{$maxReintentos} con {$modelo}");
                    \sleep($pausa);
                    /* Resetear flag de rate limit antes de reintentar (puede haberse recuperado) */
                    GroqHttpClient::resetearEstadoRateLimit();
                }

                KamplesLogger::info("ServicioIA: Intentando Groq/{$modelo} (intento {$intento}/{$maxReintentos})");
                $resultado = self::llamarGroq($modelo, $apiKey, $prompt);

                if ($resultado !== null) {
                    KamplesLogger::info("ServicioIA: Analisis exitoso con Groq/{$modelo}");
                    return $resultado;
                }

                /* Si fue 429, incrementar contador pero no cancelar toda la cadena */
                if (GroqHttpClient::fueRateLimited()) {
                    KamplesLogger::warning("ServicioIA: 429 en {$modelo} (intento {$intento}/{$maxReintentos})");
                    if (!$modoCola) break; /* En modo live, no esperar — saltar a siguiente modelo */
                    continue; /* En modo cola, reintentar con pausa */
                }

                /* Error no-429: saltar a siguiente modelo inmediatamente */
                break;
            }

            /* Verificar si este modelo dio 429 para el contador consecutivo */
            if (GroqHttpClient::fueRateLimited()) {
                $consecutivos429++;
                GroqHttpClient::resetearEstadoRateLimit();
            } else {
                $consecutivos429 = 0; /* Resetear si un modelo fallo por razón distinta a 429 */
            }
        }

        KamplesLogger::warning('ServicioIA: Todos los modelos Groq fallaron');
        return null;
    }

    /**
     * QK80: Fallback a OpenAI cuando todos los modelos Groq fallan.
     * Solo se activa si OPENAI_API_KEY está configurada en el entorno.
     * Usa gpt-4o-mini: económico y suficiente para clasificación de audio JSON.
     */
    private static function intentarOpenAIFallback(string $prompt): ?array
    {
        if (!OpenAIHttpClient::estaConfigurada()) {
            KamplesLogger::warning('ServicioIA: OpenAI API key no configurada, sin fallback disponible');
            return null;
        }

        KamplesLogger::info('ServicioIA: Intentando fallback OpenAI/' . self::MODELO_OPENAI_FALLBACK);

        $resultado = OpenAIHttpClient::chatCompletion(self::MODELO_OPENAI_FALLBACK, $prompt);
        if ($resultado !== null) {
            KamplesLogger::info('ServicioIA: Análisis exitoso con OpenAI/' . self::MODELO_OPENAI_FALLBACK);
            return $resultado;
        }

        KamplesLogger::critical('ServicioIA: Fallback OpenAI también falló — sin proveedores disponibles');
        return null;
    }

    /**
     * Llama a la API de Groq (OpenAI-compatible) con un modelo específico.
     * HTTP delegado a GroqHttpClient, parsing a JsonRepairer.
     *
     * QL39: Si el modelo falla con json_validate_failed (HTTP 400), reintenta
     * sin response_format y usa JsonRepairer para extraer JSON del texto libre.
     */
    private static function llamarGroq(string $modelo, string $apiKey, string $prompt): ?array
    {
        $url = 'https://api.groq.com/openai/v1/chat/completions';

        $mensajes = [
            [
                'role'    => 'system',
                'content' => 'Eres un experto en producción musical y clasificación de audio. Responde ÚNICAMENTE con JSON válido, sin texto adicional.',
            ],
            [
                'role'    => 'user',
                'content' => $prompt,
            ],
        ];

        $payload = [
            'model'           => $modelo,
            'messages'        => $mensajes,
            'temperature'     => 0.2,
            'max_tokens'      => 1500,
            'response_format' => ['type' => 'json_object'],
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];

        $httpCode = null;
        $respuesta = GroqHttpClient::peticionCurl($url, $payload, $headers, "Groq/{$modelo}", 0, $httpCode);

        /* QL39: json_validate_failed — el modelo no pudo generar JSON estructurado.
         * Reintentar sin response_format y dejar que JsonRepairer extraiga el JSON. */
        if ($respuesta === null && $httpCode === 400) {
            KamplesLogger::warning("ServicioIA: json_validate_failed en {$modelo}, reintentando sin response_format");
            unset($payload['response_format']);
            $respuesta = GroqHttpClient::peticionCurl($url, $payload, $headers, "Groq/{$modelo}-sinJSON");
            if ($respuesta !== null) {
                $resultado = JsonRepairer::parsearRespuestaGroq($respuesta);
                if ($resultado !== null) {
                    KamplesLogger::info("ServicioIA: JSON recuperado de {$modelo} sin response_format via JsonRepairer");
                    return $resultado;
                }
            }
            return null;
        }

        if ($respuesta === null) return null;

        return JsonRepairer::parsearRespuestaGroq($respuesta);
    }

    /**
     * C800: Corrige metadata generada por IA basandose en instrucciones del usuario.
     * Usa el LLM con un prompt de correccion (delegado a PromptsIA).
     *
     * @param array $metadataActual Metadata JSONB actual del sample
     * @param string $titulo Titulo actual del sample
     * @param string $instrucciones Instrucciones de correccion del usuario
     * @param array $contextoTecnico BPM, key, escala existentes
     * @return array|null Metadata corregida o null si falla
     */
    public static function corregirMetadata(array $metadataActual, string $titulo, string $instrucciones, array $contextoTecnico = []): ?array
    {
        $metadataJson = \json_encode($metadataActual, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($metadataJson === false) {
            KamplesLogger::error('ServicioIA::corregirMetadata: json_encode fallo');
            return null;
        }

        $prompt = PromptsIA::construirCorreccion($metadataJson, $titulo, $instrucciones, $contextoTecnico);

        $apiKey = GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            KamplesLogger::warning('ServicioIA::corregirMetadata: API key de Groq no configurada');
            return self::intentarOpenAIFallback($prompt);
        }

        $resultado = self::intentarGroq($prompt, $apiKey);
        if ($resultado !== null) {
            return $resultado;
        }

        return self::intentarOpenAIFallback($prompt);
    }

    /**
     * Detecta el MIME type de un archivo de audio por extension.
     */
    private static function detectarMime(string $ruta): string
    {
        $ext = \strtolower(\pathinfo($ruta, PATHINFO_EXTENSION));
        return match ($ext) {
            'wav'          => 'audio/wav',
            'mp3'          => 'audio/mpeg',
            'flac'         => 'audio/flac',
            'aiff', 'aif'  => 'audio/aiff',
            'ogg'          => 'audio/ogg',
            'm4a'          => 'audio/mp4',
            default        => 'audio/wav',
        };
    }
}

