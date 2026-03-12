<?php

/**
 * ServicioModeracionIA — Orquestador de moderación de contenido con IA (Groq).
 *
 * Coordina 3 capas de análisis (delegadas a AnalizadoresModeracion):
 * - Llama Guard 4: detecta toxicidad en textos
 * - Llama 4 Scout: modera imágenes adjuntas
 * - gpt-oss-120b: moderación contextual combinada
 *
 * Niveles: 'aprobado', 'revision', 'rechazado'
 * Soporta publicaciones y comentarios (C131).
 *
 * A07: Análisis extraídos a AnalizadoresModeracion (SRP).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\ColaProcesamientoIaEnums;

use App\Kamples\LogModeracion as KamplesLogger;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\ColaProcesamientoIaRepository;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\Api\GroqHttpClient;
use App\Kamples\Api\AnalizadoresModeracion;

class ServicioModeracionIA
{
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
        $apiKey = GroqHttpClient::obtenerApiKey();
        if (!$apiKey) {
            /* O10: Sin API key la moderación aprueba TODO — log crítico para detectar si key expira en prod */
            KamplesLogger::error('ModeracionIA: API key de Groq NO configurada — TODO EL CONTENIDO SE APRUEBA SIN REVISIÓN', [
                'publicacionId' => $publicacionId,
            ]);
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'razon' => 'sin_api_key', 'detalles' => []];
        }

        $resultados = [];

        /* C356: Resetear estado rate limit para no arrastrar estado previo */
        GroqHttpClient::resetearEstadoRateLimit();

        /* Capa 1: Guardia de texto (toxicidad) */
        if (!empty(\trim($texto))) {
            $resultados['guard_texto'] = AnalizadoresModeracion::analizarTextoGuard($apiKey, $texto);
        }

        /* Capa 2: Moderación de imágenes (si hay) */
        if (!empty($imagenes)) {
            $resultados['guard_imagenes'] = AnalizadoresModeracion::analizarImagenes($apiKey, $imagenes);
        }

        /* Capa 3: Moderación contextual (combina todo) */
        if (!empty(\trim($texto)) || !empty($imagenes)) {
            $resultados['contextual'] = AnalizadoresModeracion::analizarContextual($apiKey, $texto, $imagenes);
        }

        /*
         * C356: Si Groq devolvio rate limit, encolar para moderar despues.
         * El contenido queda en 'revision' (requiere moderacion humana o reproceso).
         * Esto es mas seguro que aprobar por defecto cuando IA no responde.
         */
        if (GroqHttpClient::fueRateLimited()) {
            KamplesLogger::warning('ModeracionIA: Rate limit, encolando publicacion para moderar despues', [
                'publicacionId' => $publicacionId,
                'retryAfter' => GroqHttpClient::obtenerRetryAfterSegundos(),
            ]);

            try {
                ColaProcesamientoIaRepository::encolar(
                    ColaProcesamientoIaEnums::TIPO_PUBLICACION,
                    $publicacionId,
                    ColaProcesamientoIaEnums::OPERACION_MODERACION_COMPLETA,
                    [
                        'texto' => \mb_substr($texto, 0, 5000),
                        'imagenes' => $imagenes,
                        'retryAfterSugerido' => GroqHttpClient::obtenerRetryAfterSegundos(),
                    ]
                );
            } catch (\Throwable $e) {
                KamplesLogger::error('ModeracionIA: Error encolando publicacion', [
                    'publicacionId' => $publicacionId,
                    'error' => $e->getMessage(),
                ]);
            }

            /* Forzar veredicto a 'revision' en vez de aprobar por defecto */
            $veredictoRateLimit = [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_REVISION,
                'razon' => 'rate_limit_ia',
                'detalles' => ['motivo' => 'Groq rate limit 429, encolado para reproceso'],
            ];

            try {
                PublicacionesRepository::actualizarVeredictoModeracion(
                    $publicacionId,
                    $veredictoRateLimit['nivel'],
                    \json_encode($veredictoRateLimit)
                );
            } catch (\Throwable $e) {
                KamplesLogger::error('ModeracionIA: Error guardando veredicto rate limit', [
                    'publicacionId' => $publicacionId,
                    'error' => $e->getMessage(),
                ]);
            }

            return $veredictoRateLimit;
        }

        /*
         * C351: Si no hay texto ni imágenes (post audio-only), registrar razón explícita.
         * Audio no puede analizarse con modelos de texto/visión, se aprueba con nota.
         */
        if (empty($resultados)) {
            $resultados['sin_contenido_analizable'] = [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO,
                'razon' => 'audio_sin_analisis',
                'nota' => 'Post sin texto ni imágenes — contenido de audio no analizable por IA',
            ];
        }

        /* Determinar veredicto final (el más restrictivo gana) */
        $veredicto = self::determinarVeredicto($resultados);

        KamplesLogger::info('ModeracionIA: Veredicto', [
            'publicacionId' => $publicacionId,
            'nivel' => $veredicto['nivel'],
            'razon' => $veredicto['razon'],
        ]);

        /* Guardar resultado en BD */
        try {
            PublicacionesRepository::actualizarVeredictoModeracion(
                $publicacionId,
                $veredicto['nivel'],
                \json_encode($veredicto)
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
     * @return array{nivel: string, razon: string, detalles: array}
     */
    public static function moderarComentario(int $comentarioId, int $autorId, string $texto, ?string $mediaUrl = null, string $tipoContenido = ComentariosEnums::TIPO_CONTENIDO_TEXTO): array
    {
        $apiKey = GroqHttpClient::obtenerApiKey();
        if (!$apiKey) {
            KamplesLogger::error('ModeracionIA: API key NO configurada — comentario aprobado sin revisión', [
                'comentarioId' => $comentarioId,
            ]);
            return ['nivel' => PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'razon' => 'sin_api_key', 'detalles' => []];
        }

        $resultados = [];

        /* C356: Resetear estado rate limit */
        GroqHttpClient::resetearEstadoRateLimit();

        /* Capa Guard: solo si hay texto, y solo detecta spam/contenido sexual/ilegal */
        if (!empty(\trim($texto))) {
            $resultados['guard_texto'] = AnalizadoresModeracion::analizarTextoComentario($apiKey, $texto);
        }

        /* Capa Vision: solo si el comentario tiene imagen */
        if ($tipoContenido === ComentariosEnums::TIPO_CONTENIDO_IMAGEN && !empty($mediaUrl)) {
            $resultados['guard_imagen'] = AnalizadoresModeracion::analizarImagenComentario($apiKey, $mediaUrl);
        }

        /*
         * C356: Si Groq devolvio rate limit, encolar comentario para moderar despues.
         * Mas seguro que aprobar por defecto cuando la IA no responde.
         */
        if (GroqHttpClient::fueRateLimited()) {
            KamplesLogger::warning('ModeracionIA: Rate limit, encolando comentario', [
                'comentarioId' => $comentarioId,
                'retryAfter' => GroqHttpClient::obtenerRetryAfterSegundos(),
            ]);

            try {
                ColaProcesamientoIaRepository::encolar(
                    ColaProcesamientoIaEnums::TIPO_COMENTARIO,
                    $comentarioId,
                    ColaProcesamientoIaEnums::OPERACION_MODERACION_TEXTO,
                    [
                        'autorId' => $autorId,
                        'texto' => \mb_substr($texto, 0, 5000),
                        'mediaUrl' => $mediaUrl,
                        'tipoContenido' => $tipoContenido,
                        'retryAfterSugerido' => GroqHttpClient::obtenerRetryAfterSegundos(),
                    ]
                );
            } catch (\Throwable $e) {
                KamplesLogger::error('ModeracionIA: Error encolando comentario', [
                    'comentarioId' => $comentarioId,
                    'error' => $e->getMessage(),
                ]);
            }

            $veredictoRateLimit = [
                'nivel' => PublicacionesEnums::MODERACION_ESTADO_REVISION,
                'razon' => 'rate_limit_ia',
                'detalles' => ['motivo' => 'Groq rate limit 429, encolado para reproceso'],
            ];

            try {
                ComentariosRepository::actualizarVeredictoModeracion(
                    $comentarioId,
                    $veredictoRateLimit['nivel'],
                    \json_encode($veredictoRateLimit)
                );
            } catch (\Throwable $e) {
                KamplesLogger::error('ModeracionIA: Error guardando veredicto rate limit comentario', [
                    'comentarioId' => $comentarioId,
                    'error' => $e->getMessage(),
                ]);
            }

            return $veredictoRateLimit;
        }

        $veredicto = self::determinarVeredicto($resultados);

        KamplesLogger::info('ModeracionIA: Veredicto comentario', [
            'comentarioId' => $comentarioId,
            'nivel' => $veredicto['nivel'],
            'razon' => $veredicto['razon'],
        ]);

        /* Guardar estado en BD */
        try {
            ComentariosRepository::actualizarVeredictoModeracion(
                $comentarioId,
                $veredicto['nivel'],
                \json_encode($veredicto)
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionIA: Error guardando veredicto comentario', [
                'comentarioId' => $comentarioId,
                'error' => $e->getMessage(),
            ]);
        }

        /* C132: Si rechazado, registrar violación y posible ban */
        if ($veredicto['nivel'] === PublicacionesEnums::MODERACION_ESTADO_RECHAZADO) {
            ServicioBan::registrarViolacion($autorId, $veredicto['razon'], 'comentario');
            ServicioNotificaciones::comentarioRechazado($autorId, $veredicto['razon']);
        }

        return $veredicto;
    }

    /**
     * Determina el veredicto final combinando las capas de análisis.
     * El resultado más restrictivo gana.
     */
    private static function determinarVeredicto(array $resultados): array
    {
        $prioridad = [
            PublicacionesEnums::MODERACION_ESTADO_RECHAZADO => 3,
            PublicacionesEnums::MODERACION_ESTADO_REVISION => 2,
            PublicacionesEnums::MODERACION_ESTADO_APROBADO => 1,
        ];
        $nivelFinal = PublicacionesEnums::MODERACION_ESTADO_APROBADO;
        $razonFinal = '';

        foreach ($resultados as $capa => $resultado) {
            $nivel = $resultado['nivel'] ?? PublicacionesEnums::MODERACION_ESTADO_APROBADO;
            $razonCandidata = self::resolverRazonResultado($capa, $resultado);

            if (($prioridad[$nivel] ?? 0) > ($prioridad[$nivelFinal] ?? 0)) {
                $nivelFinal = $nivel;
                $razonFinal = $razonCandidata;
                continue;
            }

            if ($nivel === $nivelFinal && $razonFinal === '' && $razonCandidata !== '') {
                $razonFinal = $razonCandidata;
            }
        }

        if ($razonFinal === '') {
            $razonFinal = $nivelFinal === PublicacionesEnums::MODERACION_ESTADO_APROBADO
                ? 'sin_hallazgos'
                : ($nivelFinal === PublicacionesEnums::MODERACION_ESTADO_REVISION ? 'revision_manual' : 'desconocida');
        }

        return [
            'nivel' => $nivelFinal,
            'razon' => $razonFinal,
            'detalles' => $resultados,
        ];
    }

    private static function resolverRazonResultado(string $capa, array $resultado): string
    {
        foreach (['categoria', 'razon', 'error', 'nota'] as $campo) {
            $valor = $resultado[$campo] ?? '';
            if (\is_string($valor) && \trim($valor) !== '') {
                return \sanitize_key($valor);
            }
        }

        return match ($capa) {
            'guard_texto' => 'texto_seguro',
            'guard_imagen', 'guard_imagenes' => 'imagenes_seguras',
            'contextual' => 'sin_hallazgos',
            'sin_contenido_analizable' => 'audio_sin_analisis',
            default => \sanitize_key($capa),
        };
    }
}
