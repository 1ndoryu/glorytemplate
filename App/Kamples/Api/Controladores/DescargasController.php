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
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;

class DescargasController
{
    /*
     * Calidad de descarga por plan.
     * Los límites de descargas/día se obtienen de StripeService::obtenerConfigPlan() (fuente única).
     */
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

        /* Verificar límite de descargas diarias (fuente única: StripeService) */
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $limite = $configPlan['descargas_dia'] ?? 5;
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

        /* Verificar límite de transferencia mensual (GB) */
        $limiteGb = $configPlan['transferencia_gb'] ?? 1;
        if ($limiteGb > 0 && $rutaArchivo) {
            $tamanoArchivo = @filesize($rutaArchivo) ?: 0;
            $transferidoMes = PostgresService::consultarUno(
                "SELECT COALESCE(SUM(tamano_bytes), 0) as total FROM descargas
                 WHERE usuario_id = :userId
                   AND created_at >= date_trunc('month', CURRENT_DATE)",
                ['userId' => $userId]
            );
            $totalBytes = (int) ($transferidoMes['total'] ?? 0);
            $limiteBytes = $limiteGb * 1073741824; /* 1 GB = 1024^3 */
            if (($totalBytes + $tamanoArchivo) > $limiteBytes) {
                $usadoGb = round($totalBytes / 1073741824, 2);
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => "Has alcanzado el límite de {$limiteGb} GB de transferencia mensual ({$usadoGb} GB usados). Mejora tu plan para más.",
                    'limiteGb' => $limiteGb,
                    'usadoGb' => $usadoGb,
                ], 429);
            }
        }

        /* Obtener tamaño del archivo para registrar en la descarga */
        $tamanoBytes = ($rutaArchivo && file_exists($rutaArchivo)) ? filesize($rutaArchivo) : 0;

        /* Registrar descarga con tamaño para tracking de transferencia */
        PostgresService::ejecutar(
            "INSERT INTO descargas (usuario_id, sample_id, calidad, tamano_bytes) VALUES (:userId, :sampleId, :calidad, :tamano)",
            ['userId' => $userId, 'sampleId' => $sampleId, 'calidad' => $calidad, 'tamano' => $tamanoBytes]
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

        /* C45: registrar interacción para el planificador del algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'descarga');

        /* Revenue share: registrar transacción si el descargador tiene plan de pago */
        if ($plan !== 'free' && (int) $sample['creador_id'] !== $userId) {
            self::registrarTransaccionRevenueShare(
                $userId,
                (int) $sample['creador_id'],
                $sampleId,
                $plan
            );
        }

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
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $limite = $configPlan['descargas_dia'] ?? 5;

        $descargasHoy = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM descargas WHERE usuario_id = :userId AND created_at >= CURRENT_DATE",
            ['userId' => $userId]
        );

        /* Transferencia mensual */
        $transferidoMes = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(tamano_bytes), 0) as total FROM descargas
             WHERE usuario_id = :userId
               AND created_at >= date_trunc('month', CURRENT_DATE)",
            ['userId' => $userId]
        );
        $limiteGb = $configPlan['transferencia_gb'] ?? 1;
        $usadoGb = round((int) ($transferidoMes['total'] ?? 0) / 1073741824, 2);

        return new \WP_REST_Response([
            'plan'          => $plan,
            'limite'        => $limite,
            'usadas'        => (int) ($descargasHoy['total'] ?? 0),
            'calidad'       => self::CALIDAD_PLAN[$plan] ?? 'mp3',
            'ilimitado'     => $limite === -1,
            'transferenciaGb'      => $limiteGb,
            'transferenciaUsadaGb' => $usadoGb,
            'transferenciaIlimitada' => $limiteGb <= 0,
        ], 200);
    }

    /**
     * Registra una transacción de revenue share al descargar un sample.
     * El monto por descarga se calcula dividiendo el precio mensual del plan
     * entre las descargas estimadas del mes, aplicando el % de revenue share.
     */
    private static function registrarTransaccionRevenueShare(
        int $compradorId,
        int $creadorId,
        int $sampleId,
        string $plan
    ): void {
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $precioMensual = $configPlan['precio_mensual'] ?? 0;
        $revenueShare = $configPlan['revenue_share'] ?? 0;

        if ($precioMensual <= 0 || $revenueShare <= 0) return;

        /*
         * Modelo de reparto: cada descarga genera una fracción del precio mensual.
         * Estimamos 200 descargas/mes como base para dividir el pool de ingresos.
         * El creador recibe su % de revenue share sobre esa fracción.
         */
        $descargasBaseEstimadas = 200;
        $montoPorDescarga = $precioMensual / $descargasBaseEstimadas;
        $pagoCreador = round($montoPorDescarga * $revenueShare, 4);
        $comisionPlataforma = round($montoPorDescarga * (1 - $revenueShare), 4);

        PostgresService::ejecutar(
            "INSERT INTO transacciones (comprador_id, creador_id, sample_id, tipo, monto, pago_creador, comision_plataforma, estado)
             VALUES (:comprador, :creador, :sample, 'descarga', :monto, :pago, :comision, 'completed')",
            [
                'comprador' => $compradorId,
                'creador'   => $creadorId,
                'sample'    => $sampleId,
                'monto'     => round($montoPorDescarga, 4),
                'pago'      => $pagoCreador,
                'comision'  => $comisionPlataforma,
            ]
        );
    }
}
