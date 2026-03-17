<?php

/**
 * OpenAIHttpClient — Cliente HTTP para la API de OpenAI (chat completions + STT).
 *
 * QK80: Proveedor alternativo cuando Groq está rate-limited o caído.
 * Sigue el mismo patrón que GroqHttpClient pero apunta a api.openai.com.
 * Usado como fallback LLM por ServicioIA y fallback STT (Whisper) si Groq falla.
 *
 * QL111: Agregado transcribirAudio() — fallback STT con OpenAI Whisper ($0.006/min).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class OpenAIHttpClient
{
    private const TIMEOUT = 30;
    private const TIMEOUT_AUDIO = 45;
    private const CONNECT_TIMEOUT = 8;
    private const BASE_URL = 'https://api.openai.com/v1/chat/completions';
    private const STT_URL = 'https://api.openai.com/v1/audio/transcriptions';
    private const STT_MODEL = 'whisper-1';
    private const API_KEY_ENV = 'OPENAI_API_KEY';

    /**
     * Verifica si hay una API key de OpenAI configurada.
     */
    public static function estaConfigurada(): bool
    {
        return self::obtenerApiKey() !== null;
    }

    /**
     * Obtiene la API key de OpenAI desde variables de entorno.
     * Reutiliza GroqHttpClient::obtenerApiKey() que soporta $_ENV, getenv() y constantes.
     */
    public static function obtenerApiKey(): ?string
    {
        return GroqHttpClient::obtenerApiKey(self::API_KEY_ENV);
    }

    /**
     * Envía un chat completion a OpenAI y retorna el contenido parseado como array.
     * Compatible con JsonRepairer::parsearRespuestaGroq (mismo formato de respuesta).
     *
     * QL39: Si responde con json_validate_failed (HTTP 400), reintenta sin response_format
     * y usa JsonRepairer para extraer JSON del texto libre.
     *
     * @param string $modelo Modelo a usar (ej: 'gpt-4o-mini')
     * @param string $prompt Prompt del usuario
     * @param string $systemPrompt Instrucciones del sistema
     * @param float $temperature Temperatura de generación
     * @param int $maxTokens Máximo de tokens de respuesta
     * @return array|null Respuesta parseada como array o null si falla
     */
    public static function chatCompletion(
        string $modelo,
        string $prompt,
        string $systemPrompt = 'Eres un experto en producción musical y clasificación de audio. Responde ÚNICAMENTE con JSON válido, sin texto adicional.',
        float $temperature = 0.2,
        int $maxTokens = 1500
    ): ?array {
        $apiKey = self::obtenerApiKey();
        if (!$apiKey) {
            KamplesLogger::warning('OpenAIHttpClient: API key no configurada');
            return null;
        }

        $mensajes = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $prompt],
        ];

        $payload = [
            'model'    => $modelo,
            'messages' => $mensajes,
            'temperature'     => $temperature,
            'max_tokens'      => $maxTokens,
            'response_format' => ['type' => 'json_object'],
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];

        $resultado = self::ejecutarPeticion($payload, $headers, $modelo);
        if ($resultado !== null) {
            return $resultado;
        }

        /* QL39: Reintentar sin response_format si el modelo no pudo generar JSON estructurado */
        KamplesLogger::warning("OpenAIHttpClient: reintentando {$modelo} sin response_format");
        unset($payload['response_format']);
        return self::ejecutarPeticion($payload, $headers, "{$modelo}-sinJSON");
    }

    /**
     * QL111: Transcribe audio usando OpenAI Whisper API (fallback STT).
     * POST multipart /v1/audio/transcriptions — modelo whisper-1.
     * Costo: ~$0.006/min de audio. Solo se usa cuando Groq STT falla completamente.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $mimeType MIME type del archivo (audio/wav, audio/mpeg, etc.)
     * @return string|null Texto transcrito o null si falla
     */
    public static function transcribirAudio(string $rutaArchivo, string $mimeType = 'audio/wav'): ?string
    {
        $apiKey = self::obtenerApiKey();
        if (!$apiKey) {
            KamplesLogger::warning('OpenAIHttpClient: API key no configurada para STT fallback');
            return null;
        }

        if (!\file_exists($rutaArchivo)) {
            KamplesLogger::error('OpenAIHttpClient: Archivo no encontrado para STT', ['ruta' => $rutaArchivo]);
            return null;
        }

        /* OpenAI Whisper soporta hasta 25 MB */
        $tamano = \filesize($rutaArchivo);
        if ($tamano > 25 * 1024 * 1024) {
            KamplesLogger::warning('OpenAIHttpClient: Archivo demasiado grande para OpenAI STT', ['tamano' => $tamano]);
            return null;
        }

        $ch = null;
        try {
            $ch = \curl_init(self::STT_URL);
            if ($ch === false) {
                KamplesLogger::error('OpenAIHttpClient: curl_init() falló (STT)');
                return null;
            }

            $archivo = new \CURLFile($rutaArchivo, $mimeType, \basename($rutaArchivo));
            $payload = [
                'model'           => self::STT_MODEL,
                'file'            => $archivo,
                'response_format' => 'verbose_json',
                'temperature'     => 0,
            ];

            \curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $apiKey],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
                CURLOPT_TIMEOUT        => self::TIMEOUT_AUDIO,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
            ]);

            $respuesta = \curl_exec($ch);
            $httpCode  = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = \curl_error($ch);
            \curl_close($ch);
            $ch = null;

            if ($curlError) {
                KamplesLogger::error('OpenAIHttpClient: cURL error (STT)', ['error' => $curlError]);
                return null;
            }

            if ($httpCode !== 200) {
                $respuestaTexto = \is_string($respuesta) ? $respuesta : '';
                KamplesLogger::error('OpenAIHttpClient: HTTP ' . $httpCode . ' (STT)', [
                    'respuesta' => \mb_substr($respuestaTexto, 0, 800),
                ]);
                return null;
            }

            if (!\is_string($respuesta)) {
                return null;
            }

            $data = \json_decode($respuesta, true);
            if (\json_last_error() !== JSON_ERROR_NONE || !\is_array($data)) {
                KamplesLogger::error('OpenAIHttpClient: STT respuesta JSON inválida', [
                    'error' => \json_last_error_msg(),
                    'respuesta' => \mb_substr($respuesta, 0, 500),
                ]);
                return null;
            }

            $texto = \trim((string) ($data['text'] ?? ''));
            if ($texto === '') {
                KamplesLogger::warning('OpenAIHttpClient: STT sin texto útil');
                return null;
            }

            KamplesLogger::info('OpenAIHttpClient: Transcripción STT exitosa', [
                'chars' => \mb_strlen($texto),
            ]);
            return $texto;
        } catch (\Throwable $e) {
            KamplesLogger::error('OpenAIHttpClient: excepción (STT)', ['error' => $e->getMessage()]);
            return null;
        } finally {
            if ($ch !== null) {
                \curl_close($ch);
            }
        }
    }

    /**
     * Ejecuta la petición cURL a OpenAI y parsea la respuesta.
     */
    private static function ejecutarPeticion(array $payload, array $headers, string $etiqueta): ?array
    {
        $ch = null;
        try {
            $ch = \curl_init(self::BASE_URL);
            if ($ch === false) {
                KamplesLogger::error("OpenAIHttpClient: curl_init() falló ({$etiqueta})");
                return null;
            }

            \curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => \json_encode($payload),
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
                CURLOPT_TIMEOUT        => self::TIMEOUT,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
            ]);

            $respuesta = \curl_exec($ch);
            $httpCode  = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = \curl_error($ch);
            \curl_close($ch);
            $ch = null;

            if ($curlError) {
                KamplesLogger::error("OpenAIHttpClient: cURL error ({$etiqueta})", ['error' => $curlError]);
                return null;
            }

            if ($httpCode !== 200) {
                $respuestaTexto = \is_string($respuesta) ? $respuesta : '';
                KamplesLogger::error("OpenAIHttpClient: HTTP {$httpCode} ({$etiqueta})", [
                    'respuesta' => \mb_substr($respuestaTexto, 0, 800),
                ]);
                return null;
            }

            if (!\is_string($respuesta)) {
                return null;
            }

            /* Mismo parser que Groq — formato de respuesta idéntico (OpenAI API spec) */
            return JsonRepairer::parsearRespuestaGroq($respuesta);
        } catch (\Throwable $e) {
            KamplesLogger::error("OpenAIHttpClient: excepción ({$etiqueta})", ['error' => $e->getMessage()]);
            return null;
        } finally {
            if ($ch !== null) {
                \curl_close($ch);
            }
        }
    }
}
