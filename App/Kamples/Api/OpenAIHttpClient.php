<?php

/**
 * OpenAIHttpClient — Cliente HTTP para la API de OpenAI (chat completions).
 *
 * QK80: Proveedor alternativo cuando Groq está rate-limited o caído.
 * Sigue el mismo patrón que GroqHttpClient pero apunta a api.openai.com.
 * Usado exclusivamente como fallback LLM por ServicioIA.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class OpenAIHttpClient
{
    private const TIMEOUT = 30;
    private const CONNECT_TIMEOUT = 8;
    private const BASE_URL = 'https://api.openai.com/v1/chat/completions';
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
