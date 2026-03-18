<?php

/* sentinel-disable-file limite-lineas — Controller REST con 4 rutas + advisory lock + anti-abuso IP + revenue share + GB limit.
 * La lógica de descarga es inherentemente larga por la atomicidad requerida (try/finally unlock).
 * Streaming y ZIP ya están en subcontroladores separados. TO-DO: extraer lógica de anti-abuso
 * y revenue share a servicios dedicados cuando el controller supere 500 líneas. */

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
use App\Kamples\Database\Repositories\SyncChangelogRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\SyncChangelogEnums;
use App\Kamples\KamplesLogger;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\RateLimiter;

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

        register_rest_route($namespace, '/descargas/comprados', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarComprados'],
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

        /* QQ71: Verificar ban + suspensión antes de permitir descarga */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

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

        /*
         * QQ11+QQ16: Control de acceso a descargas por condiciones del sample.
         * Dos ejes independientes: esPremium (solo Pro descarga gratis) y precio (compra individual).
         * Un sample puede tener ambas condiciones: Pro descarga gratis, non-Pro paga precio.
         */
        $esPremium = (bool) ($sample[SamplesCols::ES_PREMIUM] ?? false);
        $precioSample = isset($sample[SamplesCols::PRECIO]) ? (float) $sample[SamplesCols::PRECIO] : 0;

        if (!$esPropietario) {
            if ($precioSample > 0) {
                /* Sample con precio: verificar compra o plan Pro en samples premium */
                $yaComprado = TransaccionesRepository::haComprado($userId, $sampleId);
                if (!$yaComprado) {
                    /* Pro users pueden descargar samples premium con precio sin pagar */
                    if ($esPremium && $plan !== UsuariosExtEnums::PLAN_FREE) {
                        $consumeCredito = false;
                    } else {
                        return new \WP_REST_Response([
                            'ok' => false,
                            'error' => 'Este sample requiere compra individual',
                            'requiereCompra' => true,
                            'precio' => $precioSample,
                        ], 403);
                    }
                } else {
                    /* Ya comprado: descarga sin crédito */
                    $consumeCredito = false;
                }
            } elseif ($esPremium) {
                /* Sample premium sin precio: requiere plan Pro+ */
                if ($plan === UsuariosExtEnums::PLAN_FREE) {
                    return new \WP_REST_Response(['ok' => false, 'error' => 'Se requiere plan Pro o Premium para descargar este sample'], 403);
                }
            }
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

            /* [183A-69] Anti-abuso por IP: máx 5 descargas/día desde la misma IP
             * independientemente de cuántas cuentas tenga el usuario.
             * El check es previo al advisory lock para fallar rápido sin bloquear.
             * Solo aplica a free: Pro/Premium no tienen restricción de IP. */
            if ($plan === UsuariosExtEnums::PLAN_FREE && $limite > 0) {
                $limiteIP = 5;
                if (RateLimiter::excedeLimiteDescargasIP($limiteIP)) {
                    return new \WP_REST_Response([
                        'ok'       => false,
                        'error'    => 'Límite de descargas diarias por red alcanzado. Intenta mañana.',
                        'sinCredito' => true,
                    ], 429);
                }
            }

            /* [183A-69] Cuentas nuevas (< 3 días): límite reducido a 2 descargas/día.
             * Gotcha: created_at viene de PG como string ISO, necesita strtotime(). */
            $cuentaNueva = false;
            if ($plan === UsuariosExtEnums::PLAN_FREE && $limite > 0) {
                $createdAt = $usuario[UsuariosExtCols::CREATED_AT] ?? null;
                if ($createdAt) {
                    $diasCuenta = (\time() - \strtotime((string) $createdAt)) / 86400;
                    if ($diasCuenta < 3) {
                        $cuentaNueva = true;
                        $limite = min($limite, 2);
                    }
                }
            }
            /* O14: Advisory lock para evitar race condition TOCTOU — try/finally garantiza unlock */
            $lockAdquirido = false;
            if ($limite > 0) {
                UsuariosExtRepository::advisoryLock($userId);
                $lockAdquirido = true;

                try {
                    /* C198: Sumar creditos_bonus al límite diario */
                    $creditosBonus = UsuariosExtRepository::obtenerCreditosBonus($userId);
                    $limiteEfectivo = $limite + $creditosBonus;

                    $descargasHoy = DescargasRepository::contarHoy($userId);

                    if ($descargasHoy >= $limiteEfectivo) {
                        /* [183A-69] Mensaje diferenciado para cuentas nuevas */
                        $msgLimite = $cuentaNueva
                            ? "Las cuentas nuevas tienen un límite de {$limiteEfectivo} descargas diarias. El límite completo se activa a los 3 días."
                            : "Has alcanzado el límite de {$limiteEfectivo} descargas diarias.";
                        return new \WP_REST_Response([
                            'ok' => false,
                            'error' => $msgLimite,
                            'limite' => $limiteEfectivo,
                            'usadas' => $descargasHoy,
                            'sinCredito' => true,
                        ], 429);
                    }

                    /* Verificar límite de transferencia mensual (GB) */
                    $limiteGb = $configPlan['transferencia_gb'] ?? 1;
                    if ($limiteGb > 0 && $rutaArchivo) {
                        $tamanoArchivo = \is_readable($rutaArchivo) ? \filesize($rutaArchivo) : 0;
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

                    /* Registrar descarga DENTRO del lock para atomicidad */
                    $tamanoBytes = ($rutaArchivo && \file_exists($rutaArchivo)) ? \filesize($rutaArchivo) : 0;

                    DescargasRepository::registrar($userId, $sampleId, $calidad, $tamanoBytes);
                } finally {
                    UsuariosExtRepository::advisoryUnlock($userId);
                    $lockAdquirido = false;
                }

                /* Re-verificar permiso de descarga justo después del registro (M2: anti race condition estado) */
                $sampleActualizado = SamplesRepository::buscarParaDescarga($sampleId);
                if (!$sampleActualizado || (!(bool) $sampleActualizado[SamplesCols::PERMITIR_DESCARGA] && !$esPropietario)) {
                    KamplesLogger::warning('Sample cambió de estado durante descarga', ['sampleId' => $sampleId]);
                }

                /* Incrementar contadores con verificación de retorno (M3) */
                if (!SamplesRepository::incrementarDescargas($sampleId)) {
                    KamplesLogger::warning('Fallo incrementar descargas sample', ['sampleId' => $sampleId]);
                }
                if (!UsuariosExtRepository::incrementarDescargas((int) $sample[SamplesCols::CREADOR_ID])) {
                    KamplesLogger::warning('Fallo incrementar descargas creador', ['creadorId' => (int) $sample[SamplesCols::CREADOR_ID]]);
                }

                /* F2.1: Nuevo sample disponible para sync desktop */
                $changelogId = SyncChangelogRepository::registrar(
                    $userId,
                    SyncChangelogEnums::TIPO_SAMPLE_ADDED,
                    $sampleId,
                    ['titulo' => $sample[SamplesCols::TITULO] ?? '', 'formato' => $calidad]
                );
                if ($changelogId === null) {
                    KamplesLogger::critical('Fallo registrar changelog sync descarga', [
                        'userId' => $userId, 'sampleId' => $sampleId,
                    ]);
                }
            } else {
                /* Límite deshabilitado (-1 = ilimitado): registrar sin lock */
                $tamanoBytes = ($rutaArchivo && \file_exists($rutaArchivo)) ? \filesize($rutaArchivo) : 0;

                DescargasRepository::registrar($userId, $sampleId, $calidad, $tamanoBytes);

                if (!SamplesRepository::incrementarDescargas($sampleId)) {
                    KamplesLogger::warning('Fallo incrementar descargas sample', ['sampleId' => $sampleId]);
                }
                if (!UsuariosExtRepository::incrementarDescargas((int) $sample[SamplesCols::CREADOR_ID])) {
                    KamplesLogger::warning('Fallo incrementar descargas creador', ['creadorId' => (int) $sample[SamplesCols::CREADOR_ID]]);
                }

                $changelogId = SyncChangelogRepository::registrar(
                    $userId,
                    SyncChangelogEnums::TIPO_SAMPLE_ADDED,
                    $sampleId,
                    ['titulo' => $sample[SamplesCols::TITULO] ?? '', 'formato' => $calidad]
                );
                if ($changelogId === null) {
                    KamplesLogger::critical('Fallo registrar changelog sync descarga', [
                        'userId' => $userId, 'sampleId' => $sampleId,
                    ]);
                }
            }
        } else {
            $tamanoBytes = ($rutaArchivo && \file_exists($rutaArchivo)) ? \filesize($rutaArchivo) : 0;
        }

        PlanificadorAlgoritmo::registrarInteraccion($userId, 'descarga');

        /* C3: Revenue share — si falla, encolar retry (la descarga ya se registró, creador debe recibir pago) */
        if ($plan !== UsuariosExtEnums::PLAN_FREE && (int) $sample[SamplesCols::CREADOR_ID] !== $userId) {
            $revenueOk = self::registrarTransaccionRevenueShare($userId, (int) $sample[SamplesCols::CREADOR_ID], $sampleId, $plan);
            if (!$revenueOk) {
                KamplesLogger::critical('Revenue share fallido — encolar retry', [
                    'compradorId' => $userId,
                    'creadorId' => (int) $sample[SamplesCols::CREADOR_ID],
                    'sampleId' => $sampleId,
                    'plan' => $plan,
                ]);
                /* TO-DO: wp_schedule_single_event() para reintentar revenue share en background */
            }
        }

        /* C202: Generar token firmado temporal (30 min) para streaming seguro */
        if (!$rutaArchivo || !\file_exists($rutaArchivo)) {
            return new \WP_REST_Response(['code' => 'archivo_no_encontrado'], 404);
        }

        $expira = \time() + 1800;
        $firma = DescargasStreamController::generarFirmaDescarga($sampleId, $userId, $expira);
        $tokenDescarga = \base64_encode("{$sampleId}:{$userId}:{$expira}:{$firma}");

        return new \WP_REST_Response([
            'ok'        => true,
            'url'       => rest_url('kamples/v1/descargas/stream?token=' . \urlencode($tokenDescarga)),
            'nombre'    => ($sample[SamplesCols::TITULO] ?? 'sample') . '.' . $calidad,
            'formato'   => $calidad,
            'tamano'    => $tamanoBytes,
            /* true si ya estaba coleccionado (propietario o descarga previa) — no consume crédito */
            'yaExistia' => !$consumeCredito,
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
     * Retorna true si la transacción se registró, false si falló.
     * Usado también por DescargasZipController.
     */
    public static function registrarTransaccionRevenueShare(
        int $compradorId,
        int $creadorId,
        int $sampleId,
        string $plan
    ): bool {
        try {
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $precioMensual = $configPlan['precio_mensual'] ?? 0;
        $revenueShare = $configPlan['revenue_share'] ?? 0;

        if ($precioMensual <= 0 || $revenueShare <= 0) return true;

        /* Modelo: fracción del precio mensual / 200 descargas estimadas x revenue share */
        $descargasBaseEstimadas = 200;
        $montoPorDescarga = $precioMensual / $descargasBaseEstimadas;
        $pagoCreador = \round($montoPorDescarga * $revenueShare, 4);
        $comisionPlataforma = \round($montoPorDescarga * (1 - $revenueShare), 4);

        TransaccionesRepository::registrarRevenueShare(
            $compradorId, $creadorId, $sampleId,
            \round($montoPorDescarga, 4), $pagoCreador, $comisionPlataforma
        );
        return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en registrarTransaccionRevenueShare', [
                'compradorId' => $compradorId,
                'creadorId' => $creadorId,
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * GET /descargas/comprados — Lista samples comprados por el usuario.
     * Consulta transacciones de tipo compra_sample completadas y retorna samples normalizados.
     */
    public static function listarComprados(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $compras = TransaccionesRepository::listarSamplesComprados($userId, 50);

            if (empty($compras)) {
                return new \WP_REST_Response(['ok' => true, 'data' => []], 200);
            }

            $sampleIds = array_map(fn($c) => (int) $c['sample_id'], $compras);

            /* Obtener samples completos via NormalizadorSample SQL (incluye creador, flags, etc.) */
            $selectBase = NormalizadorSample::sqlSelectSamples($userId);
            $placeholders = implode(',', array_fill(0, count($sampleIds), '?'));
            $sql = $selectBase . " WHERE s." . SamplesCols::ID . " IN ({$placeholders})";

            $params = [];
            foreach ($sampleIds as $i => $sid) {
                $params['sid' . $i] = $sid;
            }
            $namedPlaceholders = implode(',', array_map(fn($k) => ':' . $k, array_keys($params)));
            $sql = $selectBase . " WHERE s." . SamplesCols::ID . " IN ({$namedPlaceholders})";

            $samples = SamplesRepository::consultar($sql, $params);
            $normalizados = NormalizadorSample::normalizarLista($samples);

            /* Marcar todos como yaComprado = true (redundante con flag del SQL, pero explícito) */
            foreach ($normalizados as &$s) {
                $s['yaComprado'] = true;
            }
            unset($s);

            return new \WP_REST_Response(['ok' => true, 'data' => $normalizados], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DescargasController::listarComprados', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }
}
