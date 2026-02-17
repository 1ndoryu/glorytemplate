<?php

/**
 * ServicioModeracionIA — Moderación de contenido con IA (Groq)
 *
 * Sistema async de moderación con 3 capas:
 * - Llama Guard 4: detecta toxicidad en textos
 * - Llama 4 Scout: modera imágenes adjuntas
 * - gpt-oss-120b: moderación contextual combinada
 *
 * Niveles: 'aprobado', 'revision', 'rechazado'
 * Soporta publicaciones y comentarios (C131).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\KamplesLogger;
use App\Kamples\Database\PostgresService;
use App\Kamples\Services\ServicioBan;

class ServicioModeracionIA
{
    /* Modelo para detectar toxicidad en texto */
    private const MODELO_GUARD = 'meta-llama/llama-guard-4-12b';

    /* Modelo de visión para moderar imágenes */
    private const MODELO_VISION = 'meta-llama/llama-4-scout-17b-16e';

    /* Modelo para moderación contextual combinada */
    private const MODELO_CONTEXTUAL = 'openai/gpt-oss-120b';

    private const TIMEOUT = 25;

    /*
     * Categorías de contenido prohibido.
     * Se usan como referencia para los prompts.
     */
    private const CATEGORIAS_PROHIBIDAS = [
        'violencia_explicita',
        'contenido_sexual',
        'discurso_odio',
        'acoso',
        'spam_phishing',
        'informacion_danina',
        'contenido_ilegal',
    ];

    /**
     * Modera una publicación completa (texto + imágenes).
     * Ejecuta las 3 capas de moderación y retorna veredicto final.
     *
     * @param int $publicacionId ID de la publicación
     * @param string $texto Contenido textual
     * @param array $imagenes URLs de imágenes adjuntas
     * @return array { nivel: 'aprobado'|'revision'|'rechazado', razon: string, detalles: array }
     */
    public static function moderarPublicacion(int $publicacionId, string $texto, array $imagenes = []): array
    {
        $apiKey = self::obtenerApiKey();
        if (!$apiKey) {
            /* Sin API key → aprobar por defecto (modo desarrollo) */
            KamplesLogger::warning('ModeracionIA: API key de Groq no configurada, aprobando por defecto');
            return ['nivel' => 'aprobado', 'razon' => 'sin_api_key', 'detalles' => []];
        }

        $resultados = [];

        /* Capa 1: Guardia de texto (toxicidad) */
        if (!empty(trim($texto))) {
            $guardTexto = self::analizarTextoGuard($apiKey, $texto);
            $resultados['guard_texto'] = $guardTexto;
        }

        /* Capa 2: Moderación de imágenes (si hay) */
        if (!empty($imagenes)) {
            $guardImagenes = self::analizarImagenes($apiKey, $imagenes);
            $resultados['guard_imagenes'] = $guardImagenes;
        }

        /* Capa 3: Moderación contextual (combina todo) */
        if (!empty(trim($texto)) || !empty($imagenes)) {
            $contextual = self::analizarContextual($apiKey, $texto, $imagenes);
            $resultados['contextual'] = $contextual;
        }

        /* Determinar veredicto final (el más restrictivo gana) */
        $veredicto = self::determinarVeredicto($resultados);

        /* Registrar resultado */
        KamplesLogger::info('ModeracionIA: Veredicto', [
            'publicacionId' => $publicacionId,
            'nivel' => $veredicto['nivel'],
            'razon' => $veredicto['razon'],
        ]);

        /* Guardar resultado en BD */
        try {
            PostgresService::ejecutar(
                "UPDATE publicaciones
                 SET moderacion_estado = :estado, moderacion_detalle = :detalle
                 WHERE id = :id",
                [
                    'estado' => $veredicto['nivel'],
                    'detalle' => json_encode($veredicto),
                    'id' => $publicacionId,
                ]
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionIA: Error guardando veredicto', [
                'publicacionId' => $publicacionId,
                'error' => $e->getMessage(),
            ]);
        }

        return $veredicto;
    }

    /**
     * C131: Modera un comentario (texto + opcional imagen/audio).
     * Más ligero que moderarPublicacion: solo Guard para texto, Vision para imágenes.
     * Spam y desnudo explícito = rechazado. Toxicidad = permitida (C132: insultos no son baneables).
     *
     * @param int $comentarioId ID del comentario
     * @param int $autorId ID del autor
     * @param string $texto Contenido textual
     * @param string|null $mediaUrl URL del archivo multimedia adjunto
     * @param string $tipoContenido 'texto', 'imagen', 'audio'
     * @return array { nivel, razon, detalles }
     */
    public static function moderarComentario(int $comentarioId, int $autorId, string $texto, ?string $mediaUrl = null, string $tipoContenido = 'texto'): array
    {
        $apiKey = self::obtenerApiKey();
        if (!$apiKey) {
            return ['nivel' => 'aprobado', 'razon' => 'sin_api_key', 'detalles' => []];
        }

        $resultados = [];

        /* Capa Guard: solo si hay texto, y solo detecta spam/contenido sexual/ilegal */
        if (!empty(trim($texto))) {
            $guardResult = self::analizarTextoComentario($apiKey, $texto);
            $resultados['guard_texto'] = $guardResult;
        }

        /* Capa Vision: solo si el comentario tiene imagen */
        if ($tipoContenido === 'imagen' && !empty($mediaUrl)) {
            $visionResult = self::analizarImagenComentario($apiKey, $mediaUrl);
            $resultados['guard_imagen'] = $visionResult;
        }

        $veredicto = self::determinarVeredicto($resultados);

        KamplesLogger::info('ModeracionIA: Veredicto comentario', [
            'comentarioId' => $comentarioId,
            'nivel' => $veredicto['nivel'],
            'razon' => $veredicto['razon'],
        ]);

        /* Guardar estado en BD */
        try {
            PostgresService::ejecutar(
                "UPDATE comentarios SET moderacion_estado = :estado, moderacion_detalle = :detalle::jsonb WHERE id = :id",
                [
                    'estado' => $veredicto['nivel'],
                    'detalle' => json_encode($veredicto),
                    'id' => $comentarioId,
                ]
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionIA: Error guardando veredicto comentario', [
                'comentarioId' => $comentarioId,
                'error' => $e->getMessage(),
            ]);
        }

        /* C132: Si rechazado, registrar violación y posible ban */
        if ($veredicto['nivel'] === 'rechazado') {
            ServicioBan::registrarViolacion($autorId, $veredicto['razon'], 'comentario');
        }

        return $veredicto;
    }

    /**
     * Guard de texto para comentarios: detecta SOLO spam y contenido sexual/ilegal.
     * C132: La toxicidad e insultos NO son baneables — debates libres permitidos.
     */
    private static function analizarTextoComentario(string $apiKey, string $texto): array
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
            . "Comment: " . mb_substr($texto, 0, 2000);

        $respuesta = self::llamarGroq($apiKey, self::MODELO_GUARD, $prompt);

        if ($respuesta === null) {
            return ['nivel' => 'aprobado', 'modelo' => self::MODELO_GUARD, 'error' => 'timeout'];
        }

        $respuestaLimpia = strtolower(trim($respuesta));

        if (str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? trim($partes[1]) : 'spam';
            return [
                'nivel' => 'rechazado',
                'modelo' => self::MODELO_GUARD,
                'categoria' => $categoria,
                'raw' => $respuestaLimpia,
            ];
        }

        return ['nivel' => 'aprobado', 'modelo' => self::MODELO_GUARD];
    }

    /**
     * Moderación de imagen en comentario.
     * C132: Contexto musical — portadas de álbumes con algo de piel son OK.
     * Solo rechazar pornografía explícita (partes íntimas, actividades sexuales).
     */
    private static function analizarImagenComentario(string $apiKey, string $url): array
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
            return ['nivel' => 'aprobado', 'modelo' => self::MODELO_VISION, 'error' => 'timeout'];
        }

        $respuestaLimpia = strtolower(trim($respuesta));

        if (str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? trim($partes[1]) : 'sexual';
            return [
                'nivel' => 'rechazado',
                'modelo' => self::MODELO_VISION,
                'categoria' => $categoria,
            ];
        }

        return ['nivel' => 'aprobado', 'modelo' => self::MODELO_VISION];
    }

    /**
     * Capa 1 — Llama Guard: detecta categorías de contenido peligroso en texto.
     */
    private static function analizarTextoGuard(string $apiKey, string $texto): array
    {
        $prompt = "Analyze the following user-generated content for safety. "
            . "Respond with EXACTLY one word: 'safe' or 'unsafe'. "
            . "If unsafe, add a comma and the category: violence, sexual, hate, harassment, spam, harmful_info, illegal.\n\n"
            . "Content: " . mb_substr($texto, 0, 2000);

        $respuesta = self::llamarGroq($apiKey, self::MODELO_GUARD, $prompt);

        if ($respuesta === null) {
            return ['nivel' => 'aprobado', 'modelo' => self::MODELO_GUARD, 'error' => 'timeout'];
        }

        $respuestaLimpia = strtolower(trim($respuesta));

        if (str_starts_with($respuestaLimpia, 'unsafe')) {
            $partes = explode(',', $respuestaLimpia, 2);
            $categoria = isset($partes[1]) ? trim($partes[1]) : 'desconocida';
            return [
                'nivel' => 'rechazado',
                'modelo' => self::MODELO_GUARD,
                'categoria' => $categoria,
                'raw' => $respuestaLimpia,
            ];
        }

        return ['nivel' => 'aprobado', 'modelo' => self::MODELO_GUARD];
    }

    /**
     * Capa 2 — Llama Vision: modera imágenes adjuntas.
     */
    private static function analizarImagenes(string $apiKey, array $imagenes): array
    {
        $peorNivel = 'aprobado';
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
                $detalles[] = ['url' => $url, 'nivel' => 'aprobado', 'error' => 'timeout'];
                continue;
            }

            $respuestaLimpia = strtolower(trim($respuesta));

            if (str_starts_with($respuestaLimpia, 'unsafe')) {
                $partes = explode(',', $respuestaLimpia, 2);
                $categoria = isset($partes[1]) ? trim($partes[1]) : 'desconocida';
                $detalles[] = ['url' => $url, 'nivel' => 'rechazado', 'categoria' => $categoria];
                $peorNivel = 'rechazado';
            } else {
                $detalles[] = ['url' => $url, 'nivel' => 'aprobado'];
            }
        }

        return ['nivel' => $peorNivel, 'modelo' => self::MODELO_VISION, 'imagenes' => $detalles];
    }

    /**
     * Capa 3 — Moderación contextual: evalúa la publicación de forma holística.
     * Detecta contenido que pasa los filtros individuales pero es problemático en contexto.
     */
    private static function analizarContextual(string $apiKey, string $texto, array $imagenes): array
    {
        $prompt = "You are a content moderator for Kamples, a music sample sharing platform.\n"
            . "Evaluate this post for community guidelines compliance:\n\n"
            . "Rules:\n"
            . "- No hate speech, harassment, or discrimination\n"
            . "- No spam, phishing, or deceptive content\n"
            . "- No explicit violence or sexual content\n"
            . "- No illegal content promotion\n"
            . "- Music-related discussion is always welcome\n\n"
            . "Post content: " . mb_substr($texto, 0, 2000) . "\n";

        if (!empty($imagenes)) {
            $prompt .= "Attached images: " . count($imagenes) . "\n";
        }

        $prompt .= "\nRespond in EXACTLY this JSON format:\n"
            . '{"safe": true, "confidence": 0.95, "reason": ""}' . "\n"
            . "If unsafe: " . '{"safe": false, "confidence": 0.85, "reason": "brief reason"}';

        $respuesta = self::llamarGroq($apiKey, self::MODELO_CONTEXTUAL, $prompt);

        if ($respuesta === null) {
            return ['nivel' => 'aprobado', 'modelo' => self::MODELO_CONTEXTUAL, 'error' => 'timeout'];
        }

        /* Intentar parsear JSON de respuesta */
        $json = json_decode($respuesta, true);
        if ($json === null) {
            /* Intentar extraer JSON con regex */
            if (preg_match('/\{[^}]+\}/', $respuesta, $matches)) {
                $json = json_decode($matches[0], true);
            }
        }

        if ($json && isset($json['safe'])) {
            if (!$json['safe']) {
                $confianza = (float) ($json['confidence'] ?? 0.5);
                return [
                    'nivel' => $confianza >= 0.8 ? 'rechazado' : 'revision',
                    'modelo' => self::MODELO_CONTEXTUAL,
                    'razon' => $json['reason'] ?? '',
                    'confianza' => $confianza,
                ];
            }
            return [
                'nivel' => 'aprobado',
                'modelo' => self::MODELO_CONTEXTUAL,
                'confianza' => (float) ($json['confidence'] ?? 0.95),
            ];
        }

        /* Fallback: si no puede parsear, aprobar con baja confianza */
        return ['nivel' => 'aprobado', 'modelo' => self::MODELO_CONTEXTUAL, 'error' => 'parse_failed'];
    }

    /**
     * Determina el veredicto final combinando las 3 capas.
     * El resultado más restrictivo gana.
     */
    private static function determinarVeredicto(array $resultados): array
    {
        $prioridad = ['rechazado' => 3, 'revision' => 2, 'aprobado' => 1];
        $nivelFinal = 'aprobado';
        $razonFinal = '';

        foreach ($resultados as $capa => $resultado) {
            $nivel = $resultado['nivel'] ?? 'aprobado';
            if (($prioridad[$nivel] ?? 0) > ($prioridad[$nivelFinal] ?? 0)) {
                $nivelFinal = $nivel;
                $razonFinal = $resultado['categoria'] ?? $resultado['razon'] ?? $capa;
            }
        }

        return [
            'nivel' => $nivelFinal,
            'razon' => $razonFinal,
            'detalles' => $resultados,
        ];
    }

    /**
     * Llama a Groq con un modelo de texto.
     */
    private static function llamarGroq(string $apiKey, string $modelo, string $prompt): ?string
    {
        $payload = [
            'model' => $modelo,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 150,
            'temperature' => 0.1,
        ];

        $respuesta = self::peticionHttp($apiKey, $payload);
        return $respuesta;
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

        $respuesta = self::peticionHttp($apiKey, $payload);
        return $respuesta;
    }

    /**
     * Petición HTTP a Groq API.
     */
    private static function peticionHttp(string $apiKey, array $payload): ?string
    {
        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => self::TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            KamplesLogger::warning('ModeracionIA: Groq HTTP error', [
                'modelo' => $payload['model'],
                'httpCode' => $httpCode,
            ]);
            return null;
        }

        $data = json_decode($response, true);
        return $data['choices'][0]['message']['content'] ?? null;
    }

    /**
     * Obtiene la API key de Groq desde el entorno.
     */
    private static function obtenerApiKey(): ?string
    {
        $key = $_ENV['GROQ_API'] ?? getenv('GROQ_API') ?? null;
        if (empty($key)) {
            $key = defined('GROQ_API') ? GROQ_API : null;
        }
        return $key ?: null;
    }
}
