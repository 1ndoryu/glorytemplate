<?php

/**
 * DescargasZipController — Descarga de colecciones completas como archivo ZIP.
 *
 * POST /colecciones/{id}/descargar-zip — Descarga todos los samples como ZIP.
 * Créditos por sample, cache ZIP 7 días, invalidación por updated_at.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\DescargasRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;
use App\Kamples\Database\Repositories\CodigoGratisRepository;

class DescargasZipController
{
    /* QK69: Limites para prevenir DoS via colecciones masivas */
    private const MAX_SAMPLES_ZIP = 500;
    private const MAX_ZIP_BYTES = 2 * 1024 * 1024 * 1024; /* 2 GB */
    private const CACHE_TTL_SEGUNDOS = 604800; /* 7 dias */
    private const MAX_NOMBRE_ARCHIVO = 100;

    /**
     * POST /colecciones/{id}/descargar-zip — Descarga todos los samples de una coleccion como ZIP.
     *
     * Logica de creditos:
     * - Cada sample nuevo cuenta como 1 credito de descarga.
     * - Samples ya descargados previamente no consumen creditos adicionales.
     * - El ZIP se cachea 7 dias y se invalida si la coleccion cambia.
     *
     * QK69 Auditoria: limites de tamano, lock concurrencia, realpath en glob, nombre truncado.
     */
    public static function descargarZipColeccion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            /* QQ71: Verificar ban + suspension antes de permitir descarga ZIP */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $coleccionId = (int) $request->get_param('id');

            /* Verificar que la coleccion existe */
            $coleccion = ColeccionesRepository::buscarPorId($coleccionId);

            if (!$coleccion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Coleccion no encontrada'], 404);
            }

            /* S11: Verificar propiedad o acceso publico para evitar IDOR */
            $esPropietario = (int) ($coleccion[ColeccionesCols::USUARIO_ID] ?? 0) === $userId;
            if (!$esPropietario) {
                $esPub = ColeccionesRepository::esPublica($coleccionId);
                if (!$esPub) {
                    return new \WP_REST_Response(['ok' => false, 'error' => 'No tienes acceso a esta coleccion'], 403);
                }
            }

            /* Obtener samples de la coleccion */
            $samples = ColeccionesRepository::samplesDeColeccion($coleccionId);

            if (empty($samples)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'La coleccion no tiene samples'], 400);
            }

            /* QK69: Limite maximo de samples por ZIP para prevenir DoS */
            if (\count($samples) > self::MAX_SAMPLES_ZIP) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'La coleccion tiene demasiados samples (' . \count($samples) . '). Maximo ' . self::MAX_SAMPLES_ZIP . ' por descarga ZIP.',
                ], 400);
            }

            /* Verificar creditos: descontar samples ya descargados previamente */
            $sampleIds = \array_map(fn($s) => (int) $s[SamplesCols::ID], $samples);

            $idsYaDescargados = DescargasRepository::filtrarYaDescargados($userId, $sampleIds);
            $samplesNuevos = \array_filter($samples, fn($s) => !\in_array((int) $s['id'], $idsYaDescargados));
            $creditosNecesarios = \count($samplesNuevos);

            /* [183A-106] Codigo de descarga gratis: salta verificacion de creditos y premium */
            $codigoGratis = sanitize_text_field((string) ($request->get_param('codigoGratis') ?? ''));
            $esCodigoGratis = false;
            if ($codigoGratis && !$esPropietario) {
                $esCodigoGratis = CodigoGratisRepository::usuarioPuedeDescargar($codigoGratis, 'coleccion', $coleccionId, $userId);
            }

            /* Verificar plan y limites */
            $usuario = UsuarioHelper::obtenerPorId($userId);
            $plan = $usuario[UsuariosExtCols::PLAN] ?? 'free';
            $configPlan = StripeService::obtenerConfigPlan($plan);
            $limite = $configPlan['descargas_dia'] ?? 5;

            if (!$esCodigoGratis && $limite > 0) {
                /* C198: Incluir creditos bonus */
                $creditosBonus = (int) ($usuario[UsuariosExtCols::CREDITOS_BONUS] ?? 0);
                $limiteEfectivo = $limite + $creditosBonus;

                $usadas = DescargasRepository::contarHoy($userId);
                $disponibles = $limiteEfectivo - $usadas;

                if ($creditosNecesarios > $disponibles) {
                    return new \WP_REST_Response([
                        'ok' => false,
                        'error' => "Creditos insuficientes. Necesitas {$creditosNecesarios} creditos pero solo tienes {$disponibles} disponibles hoy.",
                        'creditosNecesarios' => $creditosNecesarios,
                        'creditosDisponibles' => $disponibles,
                        'totalSamples' => \count($samples),
                        'yaDescargados' => \count($idsYaDescargados),
                        'sinCredito' => true,
                    ], 429);
                }
            }

            /* Verificar samples premium */
            if (!$esCodigoGratis && $plan === UsuariosExtEnums::PLAN_FREE) {
                $tienePremium = \array_filter($samplesNuevos, fn($s) => (bool) $s['es_premium']);
                if (!empty($tienePremium)) {
                    return new \WP_REST_Response([
                        'ok' => false,
                        'error' => 'La coleccion contiene samples premium. Se requiere plan Pro o Premium.',
                    ], 403);
                }
            }

            /* Generar o servir ZIP cacheado */
            $uploadDir = \wp_upload_dir();
            $carpetaZips = $uploadDir['basedir'] . '/kamples-zips';
            if (!\file_exists($carpetaZips)) {
                \wp_mkdir_p($carpetaZips);
            }

            /* Hash incluye updated_at + count para invalidar cache tras cambios */
            $hashColeccion = \md5($coleccion[ColeccionesCols::UPDATED_AT] . \count($samples));
            $nombreZip = "coleccion_{$coleccionId}_{$hashColeccion}.zip";
            $rutaZip = $carpetaZips . '/' . $nombreZip;

            /* QK69: Limpiar ZIPs viejos con validacion realpath para prevenir path traversal */
            self::limpiarZipsViejos($carpetaZips, $coleccionId, $nombreZip);

            /* Generar ZIP si no existe en cache o supero TTL */
            if (!\file_exists($rutaZip) || (\time() - \filemtime($rutaZip) > self::CACHE_TTL_SEGUNDOS)) {
                /* QK69: Lock por coleccion para evitar race condition en escritura concurrente */
                $lockFile = $carpetaZips . "/lock_{$coleccionId}.lock";
                $lockHandle = \fopen($lockFile, 'w');
                if (!$lockHandle) {
                    return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al preparar descarga'], 500);
                }

                try {
                    if (!\flock($lockHandle, LOCK_EX | LOCK_NB)) {
                        /* Otro proceso ya esta generando este ZIP — esperar brevemente */
                        \fclose($lockHandle);
                        \usleep(500000);
                        /* Si ya existe despues de esperar, usar cache */
                        if (\file_exists($rutaZip)) {
                            goto servir_zip;
                        }
                        return new \WP_REST_Response([
                            'ok' => false,
                            'error' => 'La descarga se esta preparando. Intenta de nuevo en unos segundos.',
                        ], 409);
                    }

                    /* Doble check tras obtener lock (otro proceso pudo haber terminado primero) */
                    if (\file_exists($rutaZip) && (\time() - \filemtime($rutaZip) <= self::CACHE_TTL_SEGUNDOS)) {
                        \flock($lockHandle, LOCK_UN);
                        \fclose($lockHandle);
                        goto servir_zip;
                    }

                    $zip = new \ZipArchive();
                    if ($zip->open($rutaZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                        \flock($lockHandle, LOCK_UN);
                        \fclose($lockHandle);
                        return new \WP_REST_Response(['ok' => false, 'error' => 'Error al generar el archivo ZIP'], 500);
                    }

                    $nombresUsados = [];
                    $tamanoAcumulado = 0;
                    foreach ($samples as $sample) {
                        $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL] ?? $sample[SamplesCols::RUTA_OPTIMIZADA];
                        if (!$rutaArchivo || !\file_exists($rutaArchivo)) continue;

                        /* QK69: Respetar limite de tamano total del ZIP */
                        $tamanoArchivo = \filesize($rutaArchivo);
                        if ($tamanoArchivo === false) continue;
                        if ($tamanoAcumulado + $tamanoArchivo > self::MAX_ZIP_BYTES) {
                            KamplesLogger::warning('ZIP truncado por limite de tamano', [
                                'coleccionId' => $coleccionId,
                                'acumulado' => $tamanoAcumulado,
                                'limite' => self::MAX_ZIP_BYTES,
                            ]);
                            break;
                        }
                        $tamanoAcumulado += $tamanoArchivo;

                        /* Evitar nombres duplicados en el ZIP, con longitud truncada */
                        $extension = \pathinfo($rutaArchivo, PATHINFO_EXTENSION);
                        $nombreBase = \preg_replace('/[^a-zA-Z0-9_\-]/', '_', $sample[SamplesCols::TITULO] ?? 'sample');
                        $nombreBase = \substr($nombreBase, 0, self::MAX_NOMBRE_ARCHIVO);
                        $nombreFinal = "{$nombreBase}.{$extension}";
                        $contador = 1;
                        while (\in_array($nombreFinal, $nombresUsados, true)) {
                            $nombreFinal = "{$nombreBase}_{$contador}.{$extension}";
                            $contador++;
                        }
                        $nombresUsados[] = $nombreFinal;

                        $zip->addFile($rutaArchivo, $nombreFinal);
                    }

                    $zip->close();

                    \flock($lockHandle, LOCK_UN);
                    \fclose($lockHandle);
                } catch (\Throwable $zipError) {
                    \flock($lockHandle, LOCK_UN);
                    \fclose($lockHandle);
                    /* Eliminar ZIP parcial si existe */
                    self::eliminarArchivoSiExiste($rutaZip);
                    throw $zipError;
                }
            }

            servir_zip:

            if (!\file_exists($rutaZip)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Error al generar el archivo ZIP'], 500);
            }

            /* Registrar descargas solo de samples nuevos (no descargados previamente) */
            $calidad = DescargasController::CALIDAD_PLAN[$plan] ?? 'wav';
            foreach ($samplesNuevos as $sample) {
                $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL] ?? $sample[SamplesCols::RUTA_OPTIMIZADA];
                $tamanoBytes = ($rutaArchivo && \file_exists($rutaArchivo)) ? \filesize($rutaArchivo) : 0;

                DescargasRepository::registrar($userId, (int) $sample[SamplesCols::ID], $calidad, (int) $tamanoBytes);

                SamplesRepository::incrementarDescargas((int) $sample[SamplesCols::ID]);

                /* Revenue share por cada sample de otro creador */
                if ($plan !== UsuariosExtEnums::PLAN_FREE && (int) $sample[SamplesCols::CREADOR_ID] !== $userId) {
                    DescargasController::registrarTransaccionRevenueShare(
                        $userId,
                        (int) $sample[SamplesCols::CREADOR_ID],
                        (int) $sample[SamplesCols::ID],
                        $plan
                    );
                }
            }

            /* Registrar interaccion para el algoritmo */
            PlanificadorAlgoritmo::registrarInteraccion($userId, 'descarga');

            /* URL publica del ZIP */
            $rutaRelativa = \str_replace(
                wp_normalize_path($uploadDir['basedir']),
                '',
                wp_normalize_path($rutaZip)
            );
            $urlZip = $uploadDir['baseurl'] . $rutaRelativa;

            $tamanoZip = \filesize($rutaZip);
            $nombreColeccion = \preg_replace('/[^a-zA-Z0-9_\-]/', '_', $coleccion['nombre'] ?? 'coleccion');

            return new \WP_REST_Response([
                'ok' => true,
                'url' => $urlZip,
                'nombre' => "{$nombreColeccion}.zip",
                'tamano' => $tamanoZip,
                'totalSamples' => \count($samples),
                'creditosUsados' => $creditosNecesarios,
                'yaDescargados' => \count($idsYaDescargados),
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DescargasZipController::descargarZipColeccion', [
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
     * QK69: Limpiar ZIPs viejos de una coleccion con validacion realpath.
     * Previene path traversal al verificar que cada archivo resuelve dentro de la carpeta permitida.
     */
    private static function limpiarZipsViejos(string $carpetaZips, int $coleccionId, string $nombreZipActual): void
    {
        $zipsViejos = \glob($carpetaZips . "/coleccion_{$coleccionId}_*.zip");
        if (!\is_array($zipsViejos)) return;

        $dirReal = \realpath($carpetaZips);
        if (!$dirReal) return;

        foreach ($zipsViejos as $zipViejo) {
            $realPath = \realpath($zipViejo);
            /* Verificar que el archivo esta dentro de la carpeta permitida */
            if (!$realPath || \strpos($realPath, $dirReal . DIRECTORY_SEPARATOR) !== 0) {
                continue;
            }
            if (\basename($realPath) !== $nombreZipActual) {
                self::eliminarArchivoSiExiste($realPath);
            }
        }
    }

    /**
     * QK69: Cron de limpieza global — elimina ZIPs con mas de 7 dias.
     * Registrar con: add_action('kamples_limpiar_zips_cache', [DescargasZipController::class, 'cronLimpiarZips']);
     */
    public static function cronLimpiarZips(): void
    {
        $carpetaZips = \wp_upload_dir()['basedir'] . '/kamples-zips';
        if (!\is_dir($carpetaZips)) return;

        $ahora = \time();
        $archivos = \glob($carpetaZips . '/*.zip');
        if (!\is_array($archivos)) return;

        $eliminados = 0;
        foreach ($archivos as $archivo) {
            try {
                if ($ahora - \filemtime($archivo) > self::CACHE_TTL_SEGUNDOS) {
                    self::eliminarArchivoSiExiste($archivo);
                    $eliminados++;
                }
            } catch (\Throwable $e) {
                KamplesLogger::warning('Error en cron limpieza ZIP', ['archivo' => $archivo, 'error' => $e->getMessage()]);
            }
        }

        /* Limpiar tambien archivos .lock huerfanos (>1 hora) */
        $locks = \glob($carpetaZips . '/*.lock');
        if (\is_array($locks)) {
            foreach ($locks as $lock) {
                try {
                    if ($ahora - \filemtime($lock) > 3600) {
                        self::eliminarArchivoSiExiste($lock);
                    }
                } catch (\Throwable $e) {
                    /* Silenciar — locks huerfanos no son criticos */
                }
            }
        }

        if ($eliminados > 0) {
            KamplesLogger::info("Cron limpieza ZIPs: {$eliminados} archivos eliminados.");
        }
    }

    private static function eliminarArchivoSiExiste(string $ruta): void
    {
        if (!\file_exists($ruta)) {
            return;
        }

        try {
            if (!\unlink($ruta)) {
                KamplesLogger::warning('No se pudo eliminar archivo de cache', ['ruta' => $ruta]);
            }
        } catch (\Throwable $e) {
            KamplesLogger::warning('Error eliminando archivo de cache', [
                'ruta' => $ruta,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
