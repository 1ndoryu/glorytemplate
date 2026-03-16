<?php

/**
 * AnalizadoresModeracion — Capas de análisis IA para moderación.
 *
 * Capa 1: GPT-OSS-Safeguard (texto) — analizarTextoGuard / analizarTextoComentario
 * Capa 2: Llama Vision (imágenes) — analizarImagenes / analizarImagenComentario
 * Capa 3: Contextual (combinada) — analizarContextual
 *
 * QQ67: Migrado de Llama Guard 4 12B (deprecado) a GPT-OSS-Safeguard 20B.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogModeracion as KamplesLogger;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Kamples\Api\Helpers\GroqVisionInputHelper;

class AnalizadoresModeracion
{
    private const MODELO_GUARD = 'openai/gpt-oss-safeguard-20b';
    /* QL67: Listas de fallback — vision y contextual pueden rotar si el primero da 429 */
    private const MODELOS_VISION = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct',
    ];
    private const MODELOS_CONTEXTUAL = [
        'openai/gpt-oss-120b',
        'moonshotai/kimi-k2-instruct-0905',
        'llama-3.3-70b-versatile',
    ];
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
        $bloqueImagen = GroqVisionInputHelper::construirBloqueContenido($url, 'ModeracionIA/ImagenComentario');
        if ($bloqueImagen === null) {
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO,
                'modelo' => self::MODELOS_VISION[0],
                'error' => 'imagen_no_accesible_para_groq',
            ];
        }

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
                    $bloqueImagen,
                ],
            ],
        ];

        /* QL67: Rotar modelos vision si el primero falla por 429 */
        $respuesta = null;
        $modeloUsado = self::MODELOS_VISION[0];
        foreach (self::MODELOS_VISION as $modelo) {
            $modeloUsado = $modelo;
            GroqHttpClient::resetearEstadoRateLimit();
            $respuesta = self::llamarGroqVision($apiKey, $modelo, $mensajes);
            if ($respuesta !== null) break;
            if (!GroqHttpClient::fueRateLimited()) break;
            KamplesLogger::warning("AnalizadoresModeracion: 429 en vision/{$modelo}, intentando siguiente");
        }

        if ($respuesta === null) {
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => $modeloUsado, 'error' => 'timeout'];
        }

        $respuestaLimpia = \strtolower(\trim($respuesta));

        if (\str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = \explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? \trim($partes[1]) : 'sexual';
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'modelo' => $modeloUsado,
                'categoria' => $categoria,
            ];
        }

        return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => $modeloUsado];
    }

    /**
     * Capa 1 — GPT-OSS-Safeguard: detecta categorías de contenido peligroso en texto.
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
        $huboErrores = false;
        $modeloUsado = self::MODELOS_VISION[0];

        foreach ($imagenes as $url) {
            if (empty($url)) continue;

            $bloqueImagen = GroqVisionInputHelper::construirBloqueContenido($url, 'ModeracionIA/Imagenes');
            if ($bloqueImagen === null) {
                $huboErrores = true;
                $detalles[] = [
                    'url' => $url,
                    'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO,
                    'error' => 'imagen_no_accesible_para_groq',
                ];
                continue;
            }

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
                        $bloqueImagen,
                    ],
                ],
            ];

            /* QL67: Rotar modelos vision por imagen si 429 */
            $respuesta = null;
            foreach (self::MODELOS_VISION as $modelo) {
                $modeloUsado = $modelo;
                GroqHttpClient::resetearEstadoRateLimit();
                $respuesta = self::llamarGroqVision($apiKey, $modelo, $mensajes);
                if ($respuesta !== null) break;
                if (!GroqHttpClient::fueRateLimited()) break;
                KamplesLogger::warning("AnalizadoresModeracion: 429 en vision/{$modelo} para imagen, intentando siguiente");
            }

            if ($respuesta === null) {
                $huboErrores = true;
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

        return [
            'nivel' => $peorNivel,
            'modelo' => $modeloUsado,
            'imagenes' => $detalles,
            'error' => $huboErrores ? 'analisis_imagen_incompleto' : '',
        ];
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

        /* QL67: Rotar modelos contextual si el primero falla (429 o error) */
        $respuesta = null;
        $modeloUsado = self::MODELOS_CONTEXTUAL[0];
        foreach (self::MODELOS_CONTEXTUAL as $modelo) {
            $modeloUsado = $modelo;
            GroqHttpClient::resetearEstadoRateLimit();
            $respuesta = self::llamarGroq($apiKey, $modelo, $prompt);
            if ($respuesta !== null) break;
            /* Si no fue 429, no intentar otro modelo (error real, no quota) */
            if (!GroqHttpClient::fueRateLimited()) break;
            KamplesLogger::warning("AnalizadoresModeracion: 429 en contextual/{$modelo}, intentando siguiente");
        }

        if ($respuesta === null) {
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => $modeloUsado, 'error' => 'timeout'];
        }

        $json = \json_decode($respuesta, true);
        if (\json_last_error() !== \JSON_ERROR_NONE || $json === null) {
            if (\preg_match('/\{[^}]+\}/', $respuesta, $matches)) {
                $json = \json_decode($matches[0], true);
                if (\json_last_error() !== \JSON_ERROR_NONE) { $json = null; }
            }
        }

        if ($json && isset($json['safe'])) {
            if (!$json['safe']) {
                $confianza = (float) ($json['confidence'] ?? 0.5);
                return [
                    'nivel' => $confianza >= 0.8 ? PublicacionesEnums::MODERACION_ESTADO_RECHAZADO : PublicacionesEnums::MODERACION_ESTADO_REVISION,
                    'modelo' => $modeloUsado,
                    'razon' => $json['reason'] ?? '',
                    'confianza' => $confianza,
                ];
            }
            return [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO,
                'modelo' => $modeloUsado,
                'confianza' => (float) ($json['confidence'] ?? 0.95),
            ];
        }

        return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'modelo' => $modeloUsado, 'error' => 'parse_failed'];
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
        if (\json_last_error() !== \JSON_ERROR_NONE) { return null; }
        return $data['choices'][0]['message']['content'] ?? null;
    }
}
