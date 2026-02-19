<?php

/**
 * DescargasController — Sistema de descargas con límites por plan.
 *
 * POST /samples/{id}/descargar — Descargar sample (registra + enforcer)
 * GET  /descargas/limites      — Límites actuales del usuario
 *
 * Streaming delegado a DescargasStreamController, ZIP a DescargasZipController.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\DescargasRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\TransaccionesRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Kamples\KamplesLogger;

class DescargasController
{
    /*
     * C72: Todas las descargas sirven el archivo original WAV.
     * Los límites de descargas/día se obtienen de StripeService::obtenerConfigPlan() (fuente única).
     */
    public const CALIDAD_PLAN = [
        'free'    => 'wav',
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

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/descargar-zip', [
            'methods'             => 'POST',
            'callback'            => [DescargasZipController::class, 'descargarZipColeccion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C202: Endpoint de streaming seguro con token firmado temporal */
        register_rest_route($namespace, '/descargas/stream', [
            'methods'             => 'GET',
            'callback'            => [DescargasStreamController::class, 'streamDescarga'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * POST /samples/{id}/descargar — Registra descarga y retorna URL.
     */
    public static function descargar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $sampleId = (int) $request->get_param('id');

        /* Obtener plan del usuario */
        $usuario = UsuarioHelper::obtenerPorId($userId);
        $plan = $usuario[UsuariosExtCols::PLAN] ?? UsuariosExtEnums::PLAN_FREE;
        $configPlan = StripeService::obtenerConfigPlan($plan);

        /* Verificar que el sample existe y permite descarga */
        $sample = SamplesRepository::buscarParaDescarga($sampleId);

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        if (!(bool) $sample[SamplesCols::PERMITIR_DESCARGA] && (int) $sample[SamplesCols::CREADOR_ID] !== $userId) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Este sample no permite descargas'], 403);
        }

        /*
         * C138: Determinar si la descarga consume créditos.
         * Gratis si: el usuario es el creador, o ya lo descargó antes.
         */
        $esPropietario = (int) $sample[SamplesCols::CREADOR_ID] === $userId;
        $yaDescargado = !$esPropietario && DescargasRepository::yaDescargado($userId, $sampleId);
        $consumeCredito = !$esPropietario && !$yaDescargado;

        /* Samples premium requieren plan pro o superior (excepto para el creador) */
        if ((bool) $sample[SamplesCols::ES_PREMIUM] && $plan === UsuariosExtEnums::PLAN_FREE && !$esPropietario) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Se requiere plan Pro o Premium para descargar este sample'], 403);
        }

        /* Determinar calidad y archivo */
        $calidad = self::CALIDAD_PLAN[$plan] ?? 'mp3';
        $rutaArchivo = $calidad === 'wav'
            ? ($sample[SamplesCols::RUTA_ORIGINAL] ?? $sample[SamplesCols::RUTA_OPTIMIZADA])
            : ($sample[SamplesCols::RUTA_OPTIMIZADA] ?? $sample[SamplesCols::RUTA_ORIGINAL]);

        /*
         * C138: Solo verificar límites y registrar descarga si consume crédito.
         * Samples propios y re-descargas no consumen créditos.
         */
        if ($consumeCredito) {
            $limite = $configPlan['descargas_dia'] ?? 5;
            /* O14: Advisory lock para evitar race condition TOCTOU */
            if ($limite > 0) {
                UsuariosExtRepository::advisoryLock($userId);

                /* C198: Sumar creditos_bonus al límite diario */
                $creditosBonus = UsuariosExtRepository::obtenerCreditosBonus($userId);
                $limiteEfectivo = $limite + $creditosBonus;

                $descargasHoy = DescargasRepository::contarHoy($userId);

                if ($descargasHoy >= $limiteEfectivo) {
                    return new \WP_REST_Response([
                        'ok' => false,
                        'error' => "Has alcanzado el límite de {$limiteEfectivo} descargas diarias.",
                        'limite' => $limiteEfectivo,
                        'usadas' => $descargasHoy,
                        'sinCredito' => true,
                    ], 429);
                }
            }

            /* Verificar límite de transferencia mensual (GB) */
            $limiteGb = $configPlan['transferencia_gb'] ?? 1;
            if ($limiteGb > 0 && $rutaArchivo) {
                $tamanoArchivo = @\filesize($rutaArchivo) ?: 0;
                $totalBytes = DescargasRepository::transferidoMesBytes($userId);
                $limiteBytes = $limiteGb * 1073741824;
                if (($totalBytes + $tamanoArchivo) > $limiteBytes) {
                    $usadoGb = \round($totalBytes / 1073741824, 2);
                    return new \WP_REST_Response([
                        'ok' => false,
                        'error' => "Límite de {$limiteGb} GB de transferencia mensual alcanzado ({$usadoGb} GB usados).",
                        'limiteGb' => $limiteGb,
                        'usadoGb' => $usadoGb,
                    ], 429);
                }
            }
        }

        $tamanoBytes = ($rutaArchivo && \file_exists($rutaArchivo)) ? \filesize($rutaArchivo) : 0;

        /* Registrar descarga si consume crédito */
        if ($consumeCredito) {
            DescargasRepository::registrar($userId, $sampleId, $calidad, $tamanoBytes);
            SamplesRepository::incrementarDescargas($sampleId);
            UsuariosExtRepository::incrementarDescargas((int) $sample[SamplesCols::CREADOR_ID]);
        }

        PlanificadorAlgoritmo::registrarInteraccion($userId, 'descarga');

        /* Revenue share si descargador tiene plan de pago */
        if ($plan !== UsuariosExtEnums::PLAN_FREE && (int) $sample[SamplesCols::CREADOR_ID] !== $userId) {
            self::registrarTransaccionRevenueShare($userId, (int) $sample[SamplesCols::CREADOR_ID], $sampleId, $plan);
        }

        /* C202: Generar token firmado temporal (30 min) para streaming seguro */
        if (!$rutaArchivo || !\file_exists($rutaArchivo)) {
            return new \WP_REST_Response(['code' => 'archivo_no_encontrado'], 404);
        }

        $expira = \time() + 1800;
        $firma = DescargasStreamController::generarFirmaDescarga($sampleId, $userId, $expira);
        $tokenDescarga = \base64_encode("{$sampleId}:{$userId}:{$expira}:{$firma}");

        return new \WP_REST_Response([
            'ok'      => true,
            'url'     => rest_url("kamples/v1/descargas/stream?token=" . \urlencode($tokenDescarga)),
            'nombre'  => ($sample[SamplesCols::TITULO] ?? 'sample') . '.' . $calidad,
            'formato' => $calidad,
            'tamano'  => $tamanoBytes,
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DescargasController::descargar', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * GET /descargas/limites — Límites y uso actual del usuario.
     */
    public static function limites(): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);
        $plan = $usuario[UsuariosExtCols::PLAN] ?? UsuariosExtEnums::PLAN_FREE;
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $limite = $configPlan['descargas_dia'] ?? 5;

        /* C198: Incluir créditos bonus por publicar samples */
        $creditosBonus = (int) ($usuario[UsuariosExtCols::CREDITOS_BONUS] ?? 0);
        $limiteEfectivo = ($limite > 0) ? $limite + $creditosBonus : $limite;

        $descargasHoy = DescargasRepository::contarHoy($userId);
        $totalBytes = DescargasRepository::transferidoMesBytes($userId);

        $limiteGb = $configPlan['transferencia_gb'] ?? 1;
        $usadoGb = \round($totalBytes / 1073741824, 2);

        return new \WP_REST_Response([
            'plan'          => $plan,
            'limite'        => $limiteEfectivo,
            'limiteBase'    => $limite,
            'creditosBonus' => $creditosBonus,
            'usadas'        => $descargasHoy,
            'calidad'       => self::CALIDAD_PLAN[$plan] ?? 'mp3',
            'ilimitado'     => $limite === -1,
            'transferenciaGb'      => $limiteGb,
            'transferenciaUsadaGb' => $usadoGb,
            'transferenciaIlimitada' => $limiteGb <= 0,
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DescargasController::limites', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * Registra transacción de revenue share al descargar un sample.
     * Usado también por DescargasZipController.
     */
    public static function registrarTransaccionRevenueShare(
        int $compradorId,
        int $creadorId,
        int $sampleId,
        string $plan
    ): void {
        try {
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $precioMensual = $configPlan['precio_mensual'] ?? 0;
        $revenueShare = $configPlan['revenue_share'] ?? 0;

        if ($precioMensual <= 0 || $revenueShare <= 0) return;

        /* Modelo: fracción del precio mensual / 200 descargas estimadas × revenue share */
        $descargasBaseEstimadas = 200;
        $montoPorDescarga = $precioMensual / $descargasBaseEstimadas;
        $pagoCreador = \round($montoPorDescarga * $revenueShare, 4);
        $comisionPlataforma = \round($montoPorDescarga * (1 - $revenueShare), 4);

        TransaccionesRepository::registrarRevenueShare(
            $compradorId, $creadorId, $sampleId,
            \round($montoPorDescarga, 4), $pagoCreador, $comisionPlataforma
        );
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en registrarTransaccionRevenueShare', [
                'compradorId' => $compradorId,
                'creadorId' => $creadorId,
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
