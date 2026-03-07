<?php

/**
 * JsonRepairer — Parsing, limpieza y reparación de JSON de IA
 *
 * Extraído de ServicioIA.php (A06). Maneja las 5 estrategias
 * progresivas para obtener JSON válido de respuestas LLM:
 * parse directo → bloque ```json → regex {} → limpieza de control chars → reparación con Groq.
 *
 * También incluye validación de metadata creativa de audio.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;
use App\Config\Schema\_generated\SamplesEnums;

class JsonRepairer
{
    /* Modelos para reparación de JSON roto (contexto largo, sin audio) */
    private const MODELOS_REPARACION_JSON = [
        'openai/gpt-oss-120b',
        'moonshotai/kimi-k2-instruct-0905',
        'qwen/qwen3-32b',
        'openai/gpt-oss-20b',
    ];

    private const TIMEOUT_REPARACION = 15;

    /**
     * Parsea la respuesta de Groq (formato OpenAI) y extrae el JSON de metadata.
     *
     * @param string $respuestaRaw Body de respuesta Groq
     * @return array|null Metadata parseada o null
     */
    public static function parsearRespuestaGroq(string $respuestaRaw): ?array
    {
        $respuesta = \json_decode($respuestaRaw, true);
        if (\json_last_error() !== \JSON_ERROR_NONE || !$respuesta) {
            KamplesLogger::error('JsonRepairer: Respuesta Groq no es JSON válido', [
                'respuesta_raw' => \mb_substr($respuestaRaw, 0, 1000),
            ]);
            return null;
        }

        $texto = $respuesta['choices'][0]['message']['content'] ?? null;
        if (!$texto) {
            KamplesLogger::error('JsonRepairer: Sin texto en respuesta Groq', [
                'estructura' => \array_keys($respuesta),
                'error_api' => $respuesta['error'] ?? null,
            ]);
            return null;
        }

        return self::extraerJsonDeTexto($texto);
    }

    /**
     * Intenta extraer JSON de metadata desde un texto.
     * Estrategias en orden: parseo directo → bloque ```json → regex {} → limpieza → reparación con Groq.
     *
     * @param string $texto Texto con JSON embebido
     * @return array|null Metadata validada o null
     */
    public static function extraerJsonDeTexto(string $texto): ?array
    {
        /* Estrategia 1: parsear directamente */
        $metadata = \json_decode($texto, true);
        if ($metadata && \is_array($metadata)) {
            return self::validarMetadata($metadata);
        }

        /* Estrategia 2: extraer bloque ```json ... ``` */
        if (\preg_match('/```json\s*(.*?)\s*```/s', $texto, $matches)) {
            $metadata = \json_decode($matches[1], true);
            if ($metadata && \is_array($metadata)) {
                return self::validarMetadata($metadata);
            }
        }

        /* Estrategia 3: extraer cualquier {} */
        $jsonCandidato = null;
        if (\preg_match('/\{.*\}/s', $texto, $matches)) {
            $jsonCandidato = $matches[0];
            $metadata = \json_decode($jsonCandidato, true);
            if ($metadata && \is_array($metadata)) {
                return self::validarMetadata($metadata);
            }
        }

        /* Estrategia 4: limpiar caracteres de control dentro de strings JSON */
        $textoLimpio = $jsonCandidato ?? $texto;
        $textoSanitizado = self::limpiarJsonControlChars($textoLimpio);
        if ($textoSanitizado !== $textoLimpio) {
            $metadata = \json_decode($textoSanitizado, true);
            if ($metadata && \is_array($metadata)) {
                KamplesLogger::info('JsonRepairer: JSON recuperado tras limpiar caracteres de control');
                return self::validarMetadata($metadata);
            }
        }

        /* Estrategia 5: enviar JSON roto a Groq para reparación */
        KamplesLogger::warning('JsonRepairer: JSON irrecuperable localmente, intentando reparación con Groq', [
            'json_error' => json_last_error_msg(),
        ]);
        $jsonReparado = self::repararJsonConGroq($textoLimpio);
        if ($jsonReparado !== null) {
            return $jsonReparado;
        }

        KamplesLogger::error('JsonRepairer: No se pudo extraer JSON incluso con reparación', [
            'texto_raw' => \mb_substr($texto, 0, 1500),
            'json_error' => json_last_error_msg(),
        ]);
        return null;
    }

    /**
     * Limpia caracteres de control problemáticos dentro de strings JSON.
     * Reemplaza newlines/tabs literales dentro de valores por espacios.
     */
    private static function limpiarJsonControlChars(string $json): string
    {
        return preg_replace_callback('/"((?:[^"\\\\]|\\\\.)*)"/s', function ($m) {
            $interior = $m[1];
            $limpio = \preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $interior);
            $limpio = \preg_replace('/\s{2,}/', ' ', \trim($limpio));
            return '"' . $limpio . '"';
        }, $json);
    }

    /**
     * Envía JSON roto a Groq para que lo repare sin cambiar el contenido.
     * Usa modelos baratos y rápidos. Solo corrige estructura JSON.
     */
    private static function repararJsonConGroq(string $jsonRoto): ?array
    {
        $apiKey = GroqHttpClient::obtenerApiKey('GROQ_API');
        if (!$apiKey) {
            return null;
        }

        $fragmento = \mb_substr($jsonRoto, 0, 4000);

        $promptReparacion = <<<PROMPT
El siguiente texto es un JSON roto generado por una IA de análisis de audio. 
Tu ÚNICA tarea es reparar la estructura JSON para que sea válido.
NO cambies el contenido, NO agregues campos, NO traduzcas. Solo repara:
- Comillas sin cerrar
- Comas sobrantes (trailing commas)
- Caracteres de control
- Strings truncados (ciérralos con texto razonable)
- Arrays/objetos sin cerrar

Responde SOLO con el JSON reparado, sin explicaciones.

JSON roto:
{$fragmento}
PROMPT;

        $url = 'https://api.groq.com/openai/v1/chat/completions';

        foreach (self::MODELOS_REPARACION_JSON as $modelo) {
            KamplesLogger::info('JsonRepairer: Intentando reparación JSON con Groq/' . $modelo);

            $payload = [
                'model'    => $modelo,
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'Eres un reparador de JSON. Solo corrige la estructura, no modifiques el contenido.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => $promptReparacion,
                    ],
                ],
                'temperature'     => 0.0,
                'max_tokens'      => 2000,
                'response_format' => ['type' => 'json_object'],
            ];

            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ];

            $respuesta = GroqHttpClient::peticionCurl($url, $payload, $headers, "Groq-Reparar/{$modelo}", self::TIMEOUT_REPARACION);
            if ($respuesta === null) continue;

            $decodificado = \json_decode($respuesta, true);
            $textoReparado = $decodificado['choices'][0]['message']['content'] ?? null;
            if (!$textoReparado) continue;

            $metadata = \json_decode($textoReparado, true);
            if ($metadata && \is_array($metadata)) {
                KamplesLogger::info('JsonRepairer: JSON reparado exitosamente con Groq/' . $modelo);
                return self::validarMetadata($metadata);
            }

            /* Intentar extraer {} del texto reparado */
            if (\preg_match('/\{.*\}/s', $textoReparado, $matches)) {
                $metadata = \json_decode($matches[0], true);
                if ($metadata && \is_array($metadata)) {
                    KamplesLogger::info('JsonRepairer: JSON reparado (extraído) con Groq/' . $modelo);
                    return self::validarMetadata($metadata);
                }
            }
        }

        KamplesLogger::warning('JsonRepairer: Reparación JSON con Groq falló en todos los modelos');
        return null;
    }

    /**
     * Valida y normaliza la metadata creativa extraída por la IA.
     * Solo valida campos creativos, NO campos técnicos.
     */
    public static function validarMetadata(array $data): array
    {
        /* Bug fix: 'one shot' (con espacio) era inconsistente con CHECK constraint 'oneshot'. Se acepta ambos formatos de input pero se normaliza al valor del enum */
        $tiposValidos = [SamplesEnums::TIPO_ONESHOT, SamplesEnums::TIPO_LOOP, 'one shot'];

        $tipoRaw = isset($data['tipo']) ? \strtolower($data['tipo']) : '';
        /* Normalizar 'one shot' → 'oneshot' para coincidir con el CHECK constraint */
        if ($tipoRaw === 'one shot') $tipoRaw = SamplesEnums::TIPO_ONESHOT;
        $tipo = \in_array($tipoRaw, [SamplesEnums::TIPO_ONESHOT, SamplesEnums::TIPO_LOOP], true)
            ? $tipoRaw
            : SamplesEnums::TIPO_ONESHOT;

        return [
            'nombre_archivo_base'  => self::sanitizarTexto($data['nombre_archivo_base'] ?? '', 80),
            'tags'                 => self::validarArrayStrings($data['tags'] ?? [], 15),
            'tags_es'              => self::validarArrayStrings($data['tags_es'] ?? [], 15),
            'tipo'                 => $tipo,
            'genero'               => self::validarArrayStrings($data['genero'] ?? [], 5),
            'emocion'              => self::validarArrayStrings($data['emocion'] ?? [], 5),
            'emocion_es'           => self::validarArrayStrings($data['emocion_es'] ?? [], 5),
            'instrumentos'         => self::validarArrayStrings($data['instrumentos'] ?? [], 10),
            'artista_vibes'        => self::validarArrayStrings($data['artista_vibes'] ?? [], 5),
            'descripcion_corta'    => self::sanitizarTexto($data['descripcion_corta'] ?? '', 150),
            'descripcion_corta_es' => self::sanitizarTexto($data['descripcion_corta_es'] ?? '', 150),
            'descripcion'          => self::sanitizarTexto($data['descripcion'] ?? '', 500),
            'descripcion_es'       => self::sanitizarTexto($data['descripcion_es'] ?? '', 500),
        ];
    }

    /**
     * Sanitiza un string de texto: recorta, limpia HTML y limita longitud.
     */
    private static function sanitizarTexto(mixed $texto, int $maxLen): string
    {
        if (!\is_string($texto)) return '';
        $limpio = \sanitize_text_field(\trim($texto));
        return \mb_substr($limpio, 0, $maxLen);
    }

    /**
     * Valida un array de strings: filtra no-strings y limita tamaño.
     */
    private static function validarArrayStrings(mixed $arr, int $max): array
    {
        if (!\is_array($arr)) return [];
        return \array_slice(
            \array_map(fn($s) => \sanitize_text_field(\trim($s)), \array_filter($arr, 'is_string')),
            0,
            $max
        );
    }
}
