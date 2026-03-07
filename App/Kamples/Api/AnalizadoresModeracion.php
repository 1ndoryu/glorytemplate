<?php

/**
 * AnalizadoresModeracion — Capas de análisis IA para moderación.
 *
 * Capa 1: Llama Guard (texto) — analizarTextoGuard / analizarTextoComentario
 * Capa 2: Llama Vision (imágenes) — analizarImagenes / analizarImagenComentario
 * Capa 3: Contextual (combinada) — analizarContextual
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogModeracion as KamplesLogger;
use App\Config\Schema\_generated\PublicacionesEnums;

class AnalizadoresModeracion
{
    private const MODELO_GUARD = 'meta-llama/llama-guard-4-12b';
    private const MODELO_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';
    private const MODELO_CONTEXTUAL = 'openai/gpt-oss-120b';
    private const TIMEOUT = 25;

    /**
     * Guard de texto para comentarios: detecta SOLO spam y contenido sexual/ilegal.
     * C132: Toxicidad e insultos NO son baneables — debates libres permitidos.
     */
    public static function analizarTextoComentario(string $apiKey, string $texto): array
    {
        $prompt = "You are moderating a comment on Kamples, a music production platform.\n"
            . "IMPORTANT: Toxicity, arguments, and insults between users are ALLOWED. Do NOT flag these.\n"
            . "Only flag as unsafe if the content is:\n"
            . "- Spam or phishing (promotional links, crypto scams, repetitive ads)\n"
            . "- Explicit sexual content or pornography\n"
            . "- Illegal activity promotion (drugs, weapons trafficking)\n"
            . "- Harassment with personal info (doxxing)\n\n"
            . "Respond with EXACTLY one word: 'safe' or 'unsafe'.\n"
            . "If unsafe, add a comma and the category: spam, sexual, illegal, doxxing.\n\n"
            . "Comment: " . \mb_substr($texto, 0, 2000);

        $respuesta = self::llamarGroq($apiKey, self::MODELO_GUARD, $prompt);

        if ($respuesta === null) {
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_GUARD, 'error' => 'timeout'];
        }

        $respuestaLimpia = \strtolower(\trim($respuesta));

        if (\str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = \explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? \trim($partes[1]) : 'spam';
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'modelo' => self::MODELO_GUARD,
                'categoria' => $categoria,
                'raw' => $respuestaLimpia,
            ];
        }

        return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_GUARD];
    }

    /**
     * Moderación de imagen en comentario.
     * C132: Contexto musical — portadas con algo de piel son OK.
     * Solo rechazar pornografía explícita.
     */
    public static function analizarImagenComentario(string $apiKey, string $url): array
    {
        $mensajes = [
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'text',
                        'text' => "You are moderating an image on Kamples, a music production platform.\n"
                            . "CONTEXT: This is a music community. Album covers and artistic images with some skin/revealing clothing are NORMAL and ALLOWED.\n"
                            . "Only flag as unsafe if the image contains:\n"
                            . "- Explicit pornography (visible genitalia, sexual acts)\n"
                            . "- Extreme graphic violence\n"
                            . "- Illegal content\n\n"
                            . "Suggestive, artistic, or provocative images that could be album covers are SAFE.\n"
                            . "Respond with EXACTLY one word: 'safe' or 'unsafe'. If unsafe, add comma and reason: sexual, violence, illegal."
                    ],
                    [
                        'type' => 'image_url',
                        'image_url' => ['url' => $url],
                    ],
                ],
            ],
        ];

        $respuesta = self::llamarGroqVision($apiKey, self::MODELO_VISION, $mensajes);

        if ($respuesta === null) {
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_VISION, 'error' => 'timeout'];
        }

        $respuestaLimpia = \strtolower(\trim($respuesta));

        if (\str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = \explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? \trim($partes[1]) : 'sexual';
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'modelo' => self::MODELO_VISION,
                'categoria' => $categoria,
            ];
        }

        return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_VISION];
    }

    /**
     * Capa 1 — Llama Guard: detecta categorías de contenido peligroso en texto.
     */
    public static function analizarTextoGuard(string $apiKey, string $texto): array
    {
        $prompt = "Analyze the following user-generated content for safety. "
            . "Respond with EXACTLY one word: 'safe' or 'unsafe'. "
            . "If unsafe, add a comma and the category: violence, sexual, hate, harassment, spam, harmful_info, illegal.\n\n"
            . "Content: " . \mb_substr($texto, 0, 2000);

        $respuesta = self::llamarGroq($apiKey, self::MODELO_GUARD, $prompt);

        if ($respuesta === null) {
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_GUARD, 'error' => 'timeout'];
        }

        $respuestaLimpia = \strtolower(\trim($respuesta));

        if (\str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = \explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? \trim($partes[1]) : 'desconocida';
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'modelo' => self::MODELO_GUARD,
                'categoria' => $categoria,
                'raw' => $respuestaLimpia,
            ];
        }

        return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_GUARD];
    }

    /**
     * Capa 2 — Llama Vision: modera imágenes adjuntas.
     */
    public static function analizarImagenes(string $apiKey, array $imagenes): array
    {
        $peorNivel = PublicacionesEnums::MODERACION_ESTADO_APROBADO;
        $detalles = [];

        foreach ($imagenes as $url) {
            if (empty($url)) continue;

            $mensajes = [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "Analyze this image for content moderation. "
                                . "Respond with EXACTLY one word: 'safe' or 'unsafe'. "
                                . "If unsafe, add a comma and the reason: violence, sexual, hate, harmful, illegal."
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => ['url' => $url],
                        ],
                    ],
                ],
            ];

            $respuesta = self::llamarGroqVision($apiKey, self::MODELO_VISION, $mensajes);

            if ($respuesta === null) {
                $detalles[] = ['url' => $url, 'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'error' => 'timeout'];
                continue;
            }

            $respuestaLimpia = \strtolower(\trim($respuesta));

            if (\str_starts_with($respuestaLimpia, 'unsafe')) {
                $partes = \explode(',', $respuestaLimpia, 2);
                $categoria = isset($partes[1]) ? \trim($partes[1]) : 'desconocida';
                $detalles[] = ['url' => $url, 'nivel' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO, 'categoria' => $categoria];
                $peorNivel = PublicacionesEnums::MODERACION_ESTADO_RECHAZADO;
            } else {
                $detalles[] = ['url' => $url, 'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO];
            }
        }

        return ['nivel' => $peorNivel, 'modelo' => self::MODELO_VISION, 'imagenes' => $detalles];
    }

    /**
     * Capa 3 — Moderación contextual: evalúa la publicación de forma holística.
     */
    public static function analizarContextual(string $apiKey, string $texto, array $imagenes): array
    {
        $prompt = "You are a content moderator for Kamples, a music sample sharing platform.\n"
            . "Evaluate this post for community guidelines compliance:\n\n"
            . "Rules:\n"
            . "- No hate speech, harassment, or discrimination\n"
            . "- No spam, phishing, or deceptive content\n"
            . "- No explicit violence or sexual content\n"
            . "- No illegal content promotion\n"
            . "- Music-related discussion is always welcome\n\n"
            . "Post content: " . \mb_substr($texto, 0, 2000) . "\n";

        if (!empty($imagenes)) {
            $prompt .= "Attached images: " . \count($imagenes) . "\n";
        }

        $prompt .= "\nRespond in EXACTLY this JSON format:\n"
            . '{"safe": true, "confidence": 0.95, "reason": ""}' . "\n"
            . "If unsafe: " . '{"safe": false, "confidence": 0.85, "reason": "brief reason"}';

        $respuesta = self::llamarGroq($apiKey, self::MODELO_CONTEXTUAL, $prompt);

        if ($respuesta === null) {
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_CONTEXTUAL, 'error' => 'timeout'];
        }

        $json = \json_decode($respuesta, true);
        if ($json === null) {
            if (\preg_match('/\{[^}]+\}/', $respuesta, $matches)) {
                $json = \json_decode($matches[0], true);
            }
        }

        if ($json && isset($json['safe'])) {
            if (!$json['safe']) {
                $confianza = (float) ($json['confidence'] ?? 0.5);
                return [
                    'nivel' => $confianza >= 0.8 ? PublicacionesEnums::MODERACION_ESTADO_RECHAZADO : PublicacionesEnums::MODERACION_ESTADO_REVISION,
                    'modelo' => self::MODELO_CONTEXTUAL,
                    'razon' => $json['reason'] ?? '',
                    'confianza' => $confianza,
                ];
            }
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO,
                'modelo' => self::MODELO_CONTEXTUAL,
                'confianza' => (float) ($json['confidence'] ?? 0.95),
            ];
        }

        return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => self::MODELO_CONTEXTUAL, 'error' => 'parse_failed'];
    }

    /**
     * Llama a Groq con un modelo de texto.
     */
    private static function llamarGroq(string $apiKey, string $modelo, string $prompt): ?string
    {
        $payload = [
            'model' => $modelo,
            'messages' => [['role' => 'user', 'content' => $prompt]],
            'max_tokens' => 150,
            'temperature' => 0.1,
        ];
        return self::peticionHttp($apiKey, $payload);
    }

    /**
     * Llama a Groq con un modelo de visión (mensajes multimodales).
     */
    private static function llamarGroqVision(string $apiKey, string $modelo, array $mensajes): ?string
    {
        $payload = [
            'model' => $modelo,
            'messages' => $mensajes,
            'max_tokens' => 150,
            'temperature' => 0.1,
        ];
        return self::peticionHttp($apiKey, $payload);
    }

    /**
     * Petición HTTP a Groq API via GroqHttpClient.
     */
    private static function peticionHttp(string $apiKey, array $payload): ?string
    {
        $url = 'https://api.groq.com/openai/v1/chat/completions';
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];
        $etiqueta = 'Moderacion/' . ($payload['model'] ?? 'desconocido');

        $respuesta = GroqHttpClient::peticionCurl($url, $payload, $headers, $etiqueta);
        if ($respuesta === null) return null;

        $data = \json_decode($respuesta, true);
        return $data['choices'][0]['message']['content'] ?? null;
    }
}
