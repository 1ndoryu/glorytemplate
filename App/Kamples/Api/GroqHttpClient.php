<?php

/**
 * GroqHttpClient — Cliente HTTP compartido para APIs de Groq
 *
 * Centraliza peticiones cURL JSON y multipart usadas por
 * ServicioIA, ServicioImagenIA y ServicioModeracionIA.
 * Elimina duplicación de código HTTP entre los 3 servicios (A10).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\KamplesLogger;

class GroqHttpClient
{
    private const TIMEOUT = 30;
    private const CONNECT_TIMEOUT = 8;

    /**
     * POST JSON genérica a la API de Groq.
     * Retorna body como string o null si falla.
     *
     * @param string $url URL completa del endpoint
     * @param array $payload Datos a enviar como JSON
     * @param array $headers Headers HTTP adicionales
     * @param string $etiqueta Identificador para logs
     * @param int $timeout Timeout personalizado (0 = default 30s)
     * @param int|null &$httpCodeOut Código HTTP de salida
     * @param float|null &$retryAfterOut Tiempo de retry sugerido por Groq
     * @param string|null &$curlErrorOut Error de cURL si falla
     * @return string|null Body de respuesta o null
     */
    public static function peticionCurl(
        string $url,
        array $payload,
        array $headers,
        string $etiqueta,
        int $timeout = 0,
        ?int &$httpCodeOut = null,
        ?float &$retryAfterOut = null,
        ?string &$curlErrorOut = null
    ): ?string {
        $json = \json_encode($payload);

        $ch = \curl_init($url);
        \curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT        => $timeout > 0 ? $timeout : self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $respuesta = \curl_exec($ch);
        $httpCode  = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = \curl_error($ch);
        \curl_close($ch);

        $httpCodeOut = $httpCode;
        $retryAfterOut = 0.0;
        $curlErrorOut = $curlError;

        if ($curlError) {
            KamplesLogger::error("GroqHttpClient: cURL error ({$etiqueta})", ['error' => $curlError]);
            return null;
        }

        if ($httpCode !== 200) {
            $respuestaTexto = \is_string($respuesta) ? $respuesta : '';
            $retryAfterOut = self::extraerRetryAfter($respuestaTexto);
            KamplesLogger::error("GroqHttpClient: HTTP {$httpCode} ({$etiqueta})", [
                'respuesta' => \mb_substr($respuestaTexto, 0, 1000),
                'retryAfterSugerido' => $retryAfterOut,
                'url' => \preg_replace('/key=[^&]+/', 'key=***', $url),
            ]);
            return null;
        }

        return $respuesta;
    }

    /**
     * POST multipart/form-data para endpoints de audio (Groq Whisper STT).
     */
    public static function peticionCurlMultipart(
        string $url,
        array $campos,
        string $campoArchivo,
        \CURLFile $archivo,
        array $headers,
        string $etiqueta,
        int $timeout = 0
    ): ?string {
        $payload = $campos;
        $payload[$campoArchivo] = $archivo;

        $ch = \curl_init($url);
        \curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT        => $timeout > 0 ? $timeout : self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $respuesta = \curl_exec($ch);
        $httpCode  = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = \curl_error($ch);
        \curl_close($ch);

        if ($curlError) {
            KamplesLogger::error("GroqHttpClient: cURL error ({$etiqueta})", ['error' => $curlError]);
            return null;
        }

        if ($httpCode !== 200) {
            $respuestaTexto = \is_string($respuesta) ? $respuesta : '';
            KamplesLogger::error("GroqHttpClient: HTTP {$httpCode} ({$etiqueta})", [
                'respuesta' => \mb_substr($respuestaTexto, 0, 1000),
                'url' => $url,
            ]);
            return null;
        }

        return \is_string($respuesta) ? $respuesta : null;
    }

    /**
     * Extrae segundos de retry desde mensaje de error API Groq.
     * Ej: "Please retry in 23.71s."
     */
    public static function extraerRetryAfter(string $respuestaRaw): float
    {
        if ($respuestaRaw === '') {
            return 0.0;
        }

        if (\preg_match('/Please retry in\s*([0-9]+(?:\.[0-9]+)?)s\.?/i', $respuestaRaw, $match)) {
            return (float) $match[1];
        }

        return 0.0;
    }

    /**
     * Obtiene API key de Groq desde variables de entorno.
     * Soporta $_ENV, getenv() y constante PHP (wp-config / .env loader).
     *
     * @param string $nombre Nombre de la variable (default: GROQ_API)
     * @return string|null
     */
    public static function obtenerApiKey(string $nombre = 'GROQ_API'): ?string
    {
        $key = $_ENV[$nombre] ?? getenv($nombre) ?: null;

        if (!$key || $key === '') {
            if (\defined($nombre)) {
                $key = \constant($nombre);
            }
        }

        if (!$key || $key === '') {
            return null;
        }

        /* Validar formato de keys conocidas */
        if ($nombre === 'GROQ_API' && !\str_starts_with($key, 'gsk_')) {
            KamplesLogger::warning("GroqHttpClient: {$nombre} no tiene formato válido (debe empezar con 'gsk_')", [
                'keyPreview' => \substr($key, 0, 8) . '***',
            ]);
        }

        return $key;
    }
}
