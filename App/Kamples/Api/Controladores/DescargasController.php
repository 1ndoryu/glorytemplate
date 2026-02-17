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
     * C72: Todas las descargas sirven el archivo original WAV.
     * Los límites de descargas/día se obtienen de StripeService::obtenerConfigPlan() (fuente única).
     */
    private const CALIDAD_PLAN = [
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
            'callback'            => [self::class, 'descargarZipColeccion'],
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
        $configPlan = StripeService::obtenerConfigPlan($plan);

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

        /*
         * C138: Determinar si la descarga consume créditos.
         * Gratis si: el usuario es el creador, o ya lo descargó antes.
         */
        $esPropietario = (int) $sample['creador_id'] === $userId;
        $yaDescargado = false;
        if (!$esPropietario) {
            $descargaPrevia = PostgresService::consultarUno(
                "SELECT id FROM descargas WHERE usuario_id = :userId AND sample_id = :sampleId LIMIT 1",
                ['userId' => $userId, 'sampleId' => $sampleId]
            );
            $yaDescargado = !empty($descargaPrevia);
        }
        $consumeCredito = !$esPropietario && !$yaDescargado;

        /* Samples premium requieren plan pro o superior (excepto para el creador) */
        if ((bool) $sample['es_premium'] && $plan === 'free' && !$esPropietario) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Se requiere plan Pro o Premium para descargar este sample'], 403);
        }

        /* Determinar calidad y archivo */
        $calidad = self::CALIDAD_PLAN[$plan] ?? 'mp3';
        $rutaArchivo = $calidad === 'wav'
            ? ($sample['ruta_original'] ?? $sample['ruta_optimizada'])
            : ($sample['ruta_optimizada'] ?? $sample['ruta_original']);

        /*
         * C138: Solo verificar límites y registrar descarga si consume crédito.
         * Samples propios y re-descargas no consumen créditos.
         */
        if ($consumeCredito) {
            /* Verificar límite de descargas diarias */
            $limite = $configPlan['descargas_dia'] ?? 5;
            /* O14: Verificar límite con advisory lock para evitar race condition TOCTOU */
            if ($limite > 0) {
                /* Advisory lock basado en userId para serializar descargas del mismo usuario */
                PostgresService::ejecutar(
                    "SELECT pg_advisory_xact_lock(:lockId)",
                    ['lockId' => $userId]
                );
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
                $limiteBytes = $limiteGb * 1073741824;
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
        }

        /* Obtener tamaño del archivo para registrar en la descarga */
        $tamanoBytes = ($rutaArchivo && file_exists($rutaArchivo)) ? filesize($rutaArchivo) : 0;

        /* Registrar descarga (siempre, para historial; los contadores se actualizan solo si consume crédito) */
        if ($consumeCredito) {
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
        }

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

        /*
         * Convertir ruta absoluta del filesystem a URL pública.
         * El frontend espera { url, nombre, formato, tamano }.
         */
        $uploadDir = \wp_upload_dir();
        $urlDescarga = '';
        if ($rutaArchivo && file_exists($rutaArchivo)) {
            $rutaRelativa = str_replace(
                wp_normalize_path($uploadDir['basedir']),
                '',
                wp_normalize_path($rutaArchivo)
            );
            $urlDescarga = $uploadDir['baseurl'] . $rutaRelativa;
        }

        return new \WP_REST_Response([
            'ok'      => true,
            'url'     => $urlDescarga,
            'nombre'  => $sample['titulo'] ?? 'sample',
            'formato' => $calidad,
            'tamano'  => $tamanoBytes,
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
     * POST /colecciones/{id}/descargar-zip — Descarga todos los samples de una colección como ZIP.
     *
     * Lógica de créditos:
     * - Cada sample cuenta como 1 crédito de descarga.
     * - Samples que el usuario ya descargó antes no consumen créditos adicionales.
     * - Si créditos insuficientes, retorna error con desglose.
     * - El ZIP se cachea 7 días y se invalida si la colección cambia.
     */
    public static function descargarZipColeccion(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $coleccionId = (int) $request->get_param('id');

        /* Verificar que la colección existe */
        $coleccion = PostgresService::consultarUno(
            "SELECT id, nombre, usuario_id, updated_at FROM colecciones WHERE id = :id",
            ['id' => $coleccionId]
        );

        if (!$coleccion) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Colección no encontrada'], 404);
        }

        /* S11: Verificar que la colección pertenezca al usuario o sea pública para evitar IDOR */
        $esPropietario = (int) ($coleccion['usuario_id'] ?? 0) === $userId;
        if (!$esPropietario) {
            $esPub = PostgresService::consultarUno(
                "SELECT 1 FROM colecciones WHERE id = :id AND publica = true",
                ['id' => $coleccionId]
            );
            if (!$esPub) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No tienes acceso a esta colección'], 403);
            }
        }

        /* Obtener samples de la colección */
        $samples = PostgresService::consultar(
            "SELECT s.id, s.titulo, s.ruta_original, s.ruta_optimizada, s.es_premium, s.creador_id
             FROM samples s
             INNER JOIN coleccion_samples cs ON cs.sample_id = s.id
             WHERE cs.coleccion_id = :coleccionId AND s.estado = 'activo'
             ORDER BY cs.created_at ASC",
            ['coleccionId' => $coleccionId]
        );

        if (empty($samples)) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'La colección no tiene samples'], 400);
        }

        /* Verificar créditos: descontar samples ya descargados previamente */
        $sampleIds = array_map(fn($s) => (int) $s['id'], $samples);
        $placeholders = implode(',', array_fill(0, count($sampleIds), '?'));
        $params = array_merge([$userId], $sampleIds);

        /* S12: Parametrizar IN clause en lugar de interpolar IDs directamente */
        $downloadParams = ['userId' => $userId];
        $dlPlaceholders = [];
        foreach ($sampleIds as $idx => $sid) {
            $key = "dlSid{$idx}";
            $dlPlaceholders[] = ":{$key}";
            $downloadParams[$key] = $sid;
        }
        $dlIn = implode(',', $dlPlaceholders);
        $yaDescargados = PostgresService::consultar(
            "SELECT DISTINCT sample_id FROM descargas
             WHERE usuario_id = :userId AND sample_id IN ({$dlIn})",
            $downloadParams
        );
        $idsYaDescargados = array_map(fn($d) => (int) $d['sample_id'], $yaDescargados);
        $samplesNuevos = array_filter($samples, fn($s) => !in_array((int) $s['id'], $idsYaDescargados));
        $creditosNecesarios = count($samplesNuevos);

        /* Verificar plan y límites */
        $usuario = UsuarioHelper::obtenerPorId($userId);
        $plan = $usuario['plan'] ?? 'free';
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $limite = $configPlan['descargas_dia'] ?? 5;

        if ($limite > 0) {
            $descargasHoy = PostgresService::consultarUno(
                "SELECT COUNT(*) as total FROM descargas
                 WHERE usuario_id = :userId AND created_at >= CURRENT_DATE",
                ['userId' => $userId]
            );
            $usadas = (int) ($descargasHoy['total'] ?? 0);
            $disponibles = $limite - $usadas;

            if ($creditosNecesarios > $disponibles) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => "Créditos insuficientes. Necesitas {$creditosNecesarios} créditos pero solo tienes {$disponibles} disponibles hoy.",
                    'creditosNecesarios' => $creditosNecesarios,
                    'creditosDisponibles' => $disponibles,
                    'totalSamples' => count($samples),
                    'yaDescargados' => count($idsYaDescargados),
                ], 429);
            }
        }

        /* Verificar samples premium */
        if ($plan === 'free') {
            $tienePremium = array_filter($samplesNuevos, fn($s) => (bool) $s['es_premium']);
            if (!empty($tienePremium)) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'La colección contiene samples premium. Se requiere plan Pro o Premium.',
                ], 403);
            }
        }

        /* Generar o servir ZIP cacheado */
        $uploadDir = \wp_upload_dir();
        $carpetaZips = $uploadDir['basedir'] . '/kamples-zips';
        if (!file_exists($carpetaZips)) {
            \wp_mkdir_p($carpetaZips);
        }

        /*
         * Nombre del ZIP incluye colección ID + hash de updated_at para invalidar cache
         * cuando la colección cambie.
         */
        $hashColeccion = md5($coleccion['updated_at'] . count($samples));
        $nombreZip = "coleccion_{$coleccionId}_{$hashColeccion}.zip";
        $rutaZip = $carpetaZips . '/' . $nombreZip;

        /* Limpiar ZIPs viejos de esta colección (cache invalidado) */
        $zipsViejos = glob($carpetaZips . "/coleccion_{$coleccionId}_*.zip");
        foreach ($zipsViejos as $zipViejo) {
            if (basename($zipViejo) !== $nombreZip) {
                @unlink($zipViejo);
            }
        }

        /* Generar ZIP si no existe en cache o tiene más de 7 días */
        if (!file_exists($rutaZip) || (time() - filemtime($rutaZip) > 604800)) {
            $zip = new \ZipArchive();
            if ($zip->open($rutaZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'Error al generar el archivo ZIP',
                ], 500);
            }

            $nombresUsados = [];
            foreach ($samples as $sample) {
                $rutaArchivo = $sample['ruta_original'] ?? $sample['ruta_optimizada'];
                if (!$rutaArchivo || !file_exists($rutaArchivo)) continue;

                /* Evitar nombres duplicados en el ZIP */
                $extension = pathinfo($rutaArchivo, PATHINFO_EXTENSION);
                $nombreBase = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $sample['titulo'] ?? 'sample');
                $nombreFinal = "{$nombreBase}.{$extension}";
                $contador = 1;
                while (in_array($nombreFinal, $nombresUsados)) {
                    $nombreFinal = "{$nombreBase}_{$contador}.{$extension}";
                    $contador++;
                }
                $nombresUsados[] = $nombreFinal;

                $zip->addFile($rutaArchivo, $nombreFinal);
            }

            $zip->close();
        }

        if (!file_exists($rutaZip)) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'Error al generar el archivo ZIP',
            ], 500);
        }

        /* Registrar descargas solo de samples nuevos (no descargados previamente) */
        $calidad = self::CALIDAD_PLAN[$plan] ?? 'wav';
        foreach ($samplesNuevos as $sample) {
            $rutaArchivo = $sample['ruta_original'] ?? $sample['ruta_optimizada'];
            $tamanoBytes = ($rutaArchivo && file_exists($rutaArchivo)) ? filesize($rutaArchivo) : 0;

            PostgresService::ejecutar(
                "INSERT INTO descargas (usuario_id, sample_id, calidad, tamano_bytes) VALUES (:userId, :sampleId, :calidad, :tamano)",
                ['userId' => $userId, 'sampleId' => $sample['id'], 'calidad' => $calidad, 'tamano' => $tamanoBytes]
            );

            PostgresService::ejecutar(
                "UPDATE samples SET total_descargas = total_descargas + 1 WHERE id = :id",
                ['id' => $sample['id']]
            );

            /* Revenue share por cada sample de otro creador */
            if ($plan !== 'free' && (int) $sample['creador_id'] !== $userId) {
                self::registrarTransaccionRevenueShare($userId, (int) $sample['creador_id'], (int) $sample['id'], $plan);
            }
        }

        /* Registrar interacción para el algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'descarga');

        /* URL pública del ZIP */
        $rutaRelativa = str_replace(
            wp_normalize_path($uploadDir['basedir']),
            '',
            wp_normalize_path($rutaZip)
        );
        $urlZip = $uploadDir['baseurl'] . $rutaRelativa;

        $tamanoZip = filesize($rutaZip);
        $nombreColeccion = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $coleccion['nombre'] ?? 'coleccion');

        return new \WP_REST_Response([
            'ok' => true,
            'url' => $urlZip,
            'nombre' => "{$nombreColeccion}.zip",
            'tamano' => $tamanoZip,
            'totalSamples' => count($samples),
            'creditosUsados' => $creditosNecesarios,
            'yaDescargados' => count($idsYaDescargados),
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
