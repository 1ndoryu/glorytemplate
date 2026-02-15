<?php

/**
 * ServicioImagenIA — Análisis de imágenes con Groq (Llama Vision)
 *
 * Analiza imágenes adjuntas a publicaciones para generar metadata automática:
 * tags visuales, descripción, contenido, sentimiento, y moderación básica.
 *
 * Modelos: Llama 4 Maverick (visión) → Llama 4 Scout (fallback visión)
 * Las imágenes se envían como URLs (ya alojadas en WordPress uploads).
 *
 * Proceso no bloqueante: se ejecuta en shutdown hook después de responder al usuario.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\KamplesLogger;

class ServicioImagenIA
{
    /* Modelos Groq con soporte de visión, en orden de preferencia */
    private const MODELOS_VISION = [
        'meta-llama/llama-4-maverick-17b-128e',
        'meta-llama/llama-4-scout-17b-16e',
    ];

    private const TIMEOUT = 30;

    /*
     * Analiza una imagen por URL y retorna metadata descriptiva.
     * La imagen ya está alojada en WP uploads, se envía la URL a Groq.
     *
     * @param string $urlImagen URL pública de la imagen
     * @return array|null Metadata extraída o null si falla
     */
    public static function analizarImagen(string $urlImagen): ?array
    {
        if (empty($urlImagen)) {
            return null;
        }

        $apiKey = self::obtenerApiKey();
        if (!$apiKey) {
            KamplesLogger::warning('ServicioImagenIA: API key de Groq no configurada');
            return null;
        }

        foreach (self::MODELOS_VISION as $modelo) {
            KamplesLogger::info('ServicioImagenIA: Intentando ' . $modelo, ['url' => $urlImagen]);
            $resultado = self::llamarGroqVision($modelo, $apiKey, $urlImagen);
            if ($resultado !== null) {
                KamplesLogger::info('ServicioImagenIA: Análisis exitoso con ' . $modelo);
                return $resultado;
            }
        }

        KamplesLogger::warning('ServicioImagenIA: Todos los modelos de visión fallaron');
        return null;
    }

    /*
     * Analiza múltiples imágenes y retorna array con metadata de cada una.
     * Procesa secuencialmente para no saturar la API.
     *
     * @param array $urls Array de URLs de imágenes
     * @return array Array de metadata (índice → metadata), puede tener nulls
     */
    public static function analizarMultiples(array $urls): array
    {
        $resultados = [];
        foreach ($urls as $i => $url) {
            $resultados[$i] = self::analizarImagen($url);
        }
        return $resultados;
    }

    /*
     * Llama a Groq API con un modelo de visión específico.
     * Usa el formato OpenAI-compatible con content multimodal.
     */
    private static function llamarGroqVision(string $modelo, string $apiKey, string $urlImagen): ?array
    {
        $url = 'https://api.groq.com/openai/v1/chat/completions';

        $payload = [
            'model'    => $modelo,
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'Eres un experto en análisis visual y producción musical. Responde ÚNICAMENTE con JSON válido.',
                ],
                [
                    'role'    => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => self::construirPrompt(),
                        ],
                        [
                            'type'      => 'image_url',
                            'image_url' => [
                                'url' => $urlImagen,
                            ],
                        ],
                    ],
                ],
            ],
            'temperature'     => 0.2,
            'max_tokens'      => 800,
            'response_format' => ['type' => 'json_object'],
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];

        $respuesta = self::peticionCurl($url, $payload, $headers, $modelo);
        if ($respuesta === null) return null;

        return self::parsearRespuesta($respuesta);
    }

    /*
     * Prompt para análisis visual de imágenes en contexto musical.
     */
    private static function construirPrompt(): string
    {
        return <<<PROMPT
Analiza esta imagen que fue publicada en una comunidad de productores musicales.
Genera ÚNICAMENTE un JSON con esta estructura:

- "tags": Array de strings con etiquetas descriptivas en INGLÉS (ej: "studio", "vinyl", "gradient", "artwork").
- "tags_es": Las mismas etiquetas traducidas al ESPAÑOL.
- "descripcion": Descripción breve (15-25 palabras) en INGLÉS.
- "descripcion_es": La misma descripción en ESPAÑOL.
- "tipo_contenido": String — uno de: "foto_estudio", "artwork", "meme", "screenshot", "portada_album", "equipo", "tutorial", "otro".
- "sentimiento": String — uno de: "positivo", "neutral", "negativo".
- "seguro": Boolean — true si el contenido es seguro para la comunidad (sin violencia, NSFW, odio).
- "razon_no_seguro": String opcional — solo si "seguro" es false, explica por qué.
PROMPT;
    }

    /*
     * Parsea la respuesta de Groq y extrae metadata de imagen.
     */
    private static function parsearRespuesta(string $respuestaRaw): ?array
    {
        $respuesta = json_decode($respuestaRaw, true);
        if (!$respuesta) {
            KamplesLogger::error('ServicioImagenIA: Respuesta no es JSON válido', [
                'respuesta_raw' => mb_substr($respuestaRaw, 0, 500),
            ]);
            return null;
        }

        $texto = $respuesta['choices'][0]['message']['content'] ?? null;
        if (!$texto) {
            KamplesLogger::error('ServicioImagenIA: Sin texto en respuesta', [
                'error_api' => $respuesta['error'] ?? null,
            ]);
            return null;
        }

        $metadata = json_decode($texto, true);
        if (!$metadata || !is_array($metadata)) {
            /* Intentar extraer {} del texto */
            if (preg_match('/\{.*\}/s', $texto, $matches)) {
                $metadata = json_decode($matches[0], true);
            }
        }

        if (!$metadata || !is_array($metadata)) {
            KamplesLogger::error('ServicioImagenIA: No se pudo extraer JSON', [
                'texto' => mb_substr($texto, 0, 500),
            ]);
            return null;
        }

        return self::validarMetadata($metadata);
    }

    /*
     * Valida y normaliza la metadata de imagen extraída.
     */
    private static function validarMetadata(array $data): array
    {
        $tiposValidos = [
            'foto_estudio', 'artwork', 'meme', 'screenshot',
            'portada_album', 'equipo', 'tutorial', 'otro',
        ];

        $sentimientosValidos = ['positivo', 'neutral', 'negativo'];

        $tipo = isset($data['tipo_contenido']) && in_array($data['tipo_contenido'], $tiposValidos, true)
            ? $data['tipo_contenido']
            : 'otro';

        $sentimiento = isset($data['sentimiento']) && in_array($data['sentimiento'], $sentimientosValidos, true)
            ? $data['sentimiento']
            : 'neutral';

        return [
            'tags'            => self::validarArrayStrings($data['tags'] ?? [], 10),
            'tags_es'         => self::validarArrayStrings($data['tags_es'] ?? [], 10),
            'descripcion'     => self::sanitizarTexto($data['descripcion'] ?? '', 200),
            'descripcion_es'  => self::sanitizarTexto($data['descripcion_es'] ?? '', 200),
            'tipo_contenido'  => $tipo,
            'sentimiento'     => $sentimiento,
            'seguro'          => (bool) ($data['seguro'] ?? true),
            'razon_no_seguro' => self::sanitizarTexto($data['razon_no_seguro'] ?? '', 150),
        ];
    }

    /* ===================== UTILIDADES ===================== */

    private static function sanitizarTexto(mixed $texto, int $maxLen): string
    {
        if (!is_string($texto)) return '';
        $limpio = \sanitize_text_field(trim($texto));
        return mb_substr($limpio, 0, $maxLen);
    }

    private static function validarArrayStrings(mixed $arr, int $max): array
    {
        if (!is_array($arr)) return [];
        return array_slice(
            array_map(fn($s) => \sanitize_text_field(trim($s)), array_filter($arr, 'is_string')),
            0,
            $max
        );
    }

    private static function obtenerApiKey(): ?string
    {
        $key = $_ENV['GROQ_API'] ?? getenv('GROQ_API') ?: null;
        if (!$key || $key === '') return null;
        return $key;
    }

    private static function peticionCurl(string $url, array $payload, array $headers, string $etiqueta): ?string
    {
        $json = json_encode($payload);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $respuesta = curl_exec($ch);
        $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            KamplesLogger::error("ServicioImagenIA: cURL error ({$etiqueta})", ['error' => $curlError]);
            return null;
        }

        if ($httpCode !== 200) {
            KamplesLogger::error("ServicioImagenIA: HTTP {$httpCode} ({$etiqueta})", [
                'respuesta' => mb_substr($respuesta, 0, 500),
            ]);
            return null;
        }

        return $respuesta;
    }
}
