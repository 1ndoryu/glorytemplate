<?php

/**
 * DescargasController — Sistema de descargas con límites por plan.
 *
 * POST /samples/{id}/descargar — Descargar sample (registra + enforcer)
 * GET  /descargas/limites      — Límites actuales del usuario
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class DescargasController
{
    /* Límites de descargas por día según plan */
    private const LIMITES_PLAN = [
        'free'    => 5,
        'pro'     => 50,
        'premium' => -1, /* ilimitado */
    ];

    /* Calidad de descarga por plan */
    private const CALIDAD_PLAN = [
        'free'    => 'mp3',
        'pro'     => 'wav',
        'premium' => 'wav',
    ];

    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/samples/(?P<id>\d+)/descargar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'descargar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/descargas/limites', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'limites'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /samples/{id}/descargar — Registra descarga y retorna URL.
     */
    public static function descargar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $sampleId = (int) $request->get_param('id');

        /* Obtener plan del usuario */
        $usuario = UsuarioHelper::obtenerPorId($userId);
        $plan = $usuario['plan'] ?? 'free';

        /* Verificar límite de descargas diarias */
        $limite = self::LIMITES_PLAN[$plan] ?? 5;
        if ($limite > 0) {
            $descargasHoy = PostgresService::consultarUno(
                "SELECT COUNT(*) as total FROM descargas
                 WHERE usuario_id = :userId AND created_at >= CURRENT_DATE",
                ['userId' => $userId]
            );

            if ((int) ($descargasHoy['total'] ?? 0) >= $limite) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => "Has alcanzado el límite de {$limite} descargas diarias. Mejora tu plan para más.",
                    'limite' => $limite,
                    'usadas' => (int) $descargasHoy['total'],
                ], 429);
            }
        }

        /* Verificar que el sample existe y permite descarga */
        $sample = PostgresService::consultarUno(
            "SELECT id, titulo, ruta_original, ruta_optimizada, permitir_descarga, es_premium, creador_id
             FROM samples WHERE id = :id AND estado = 'activo'",
            ['id' => $sampleId]
        );

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        if (!(bool) $sample['permitir_descarga'] && (int) $sample['creador_id'] !== $userId) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Este sample no permite descargas'], 403);
        }

        /* Samples premium requieren plan pro o superior */
        if ((bool) $sample['es_premium'] && $plan === 'free') {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Se requiere plan Pro o Premium para descargar este sample'], 403);
        }

        /* Determinar calidad y archivo */
        $calidad = self::CALIDAD_PLAN[$plan] ?? 'mp3';
        $rutaArchivo = $calidad === 'wav'
            ? ($sample['ruta_original'] ?? $sample['ruta_optimizada'])
            : ($sample['ruta_optimizada'] ?? $sample['ruta_original']);

        /* Registrar descarga */
        PostgresService::ejecutar(
            "INSERT INTO descargas (usuario_id, sample_id, calidad) VALUES (:userId, :sampleId, :calidad)",
            ['userId' => $userId, 'sampleId' => $sampleId, 'calidad' => $calidad]
        );

        /* Actualizar contador en samples */
        PostgresService::ejecutar(
            "UPDATE samples SET total_descargas = total_descargas + 1 WHERE id = :id",
            ['id' => $sampleId]
        );

        /* Actualizar contador en usuario creador */
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_descargas = total_descargas + 1 WHERE id = :id",
            ['id' => $sample['creador_id']]
        );

        return new \WP_REST_Response([
            'ok' => true,
            'calidad' => $calidad,
            'archivo' => $rutaArchivo,
        ], 200);
    }

    /**
     * GET /descargas/limites — Límites y uso actual del usuario.
     */
    public static function limites(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);
        $plan = $usuario['plan'] ?? 'free';
        $limite = self::LIMITES_PLAN[$plan] ?? 5;

        $descargasHoy = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM descargas WHERE usuario_id = :userId AND created_at >= CURRENT_DATE",
            ['userId' => $userId]
        );

        return new \WP_REST_Response([
            'plan'     => $plan,
            'limite'   => $limite,
            'usadas'   => (int) ($descargasHoy['total'] ?? 0),
            'calidad'  => self::CALIDAD_PLAN[$plan] ?? 'mp3',
            'ilimitado' => $limite === -1,
        ], 200);
    }
}
