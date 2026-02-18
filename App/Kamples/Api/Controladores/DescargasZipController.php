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

use App\Kamples\Database\PostgresService;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionesCols;

class DescargasZipController
{
    /**
     * POST /colecciones/{id}/descargar-zip — Descarga todos los samples de una colección como ZIP.
     *
     * Lógica de créditos:
     * - Cada sample nuevo cuenta como 1 crédito de descarga.
     * - Samples ya descargados previamente no consumen créditos adicionales.
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

        /* S11: Verificar propiedad o acceso público para evitar IDOR */
        $esPropietario = (int) ($coleccion[ColeccionesCols::USUARIO_ID] ?? 0) === $userId;
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
        $sampleIds = \array_map(fn($s) => (int) $s[SamplesCols::ID], $samples);

        /* S12: Parametrizar IN clause en lugar de interpolar IDs */
        $downloadParams = ['userId' => $userId];
        $dlPlaceholders = [];
        foreach ($sampleIds as $idx => $sid) {
            $key = "dlSid{$idx}";
            $dlPlaceholders[] = ":{$key}";
            $downloadParams[$key] = $sid;
        }
        $dlIn = \implode(',', $dlPlaceholders);
        $yaDescargados = PostgresService::consultar(
            "SELECT DISTINCT sample_id FROM descargas
             WHERE usuario_id = :userId AND sample_id IN ({$dlIn})",
            $downloadParams
        );
        $idsYaDescargados = \array_map(fn($d) => (int) $d['sample_id'], $yaDescargados);
        $samplesNuevos = \array_filter($samples, fn($s) => !\in_array((int) $s['id'], $idsYaDescargados));
        $creditosNecesarios = \count($samplesNuevos);

        /* Verificar plan y límites */
        $usuario = UsuarioHelper::obtenerPorId($userId);
        $plan = $usuario[UsuariosExtCols::PLAN] ?? 'free';
        $configPlan = StripeService::obtenerConfigPlan($plan);
        $limite = $configPlan['descargas_dia'] ?? 5;

        if ($limite > 0) {
            /* C198: Incluir créditos bonus */
            $creditosBonus = (int) ($usuario[UsuariosExtCols::CREDITOS_BONUS] ?? 0);
            $limiteEfectivo = $limite + $creditosBonus;

            $descargasHoy = PostgresService::consultarUno(
                "SELECT COUNT(*) as total FROM descargas
                 WHERE usuario_id = :userId AND created_at >= CURRENT_DATE",
                ['userId' => $userId]
            );
            $usadas = (int) ($descargasHoy['total'] ?? 0);
            $disponibles = $limiteEfectivo - $usadas;

            if ($creditosNecesarios > $disponibles) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => "Créditos insuficientes. Necesitas {$creditosNecesarios} créditos pero solo tienes {$disponibles} disponibles hoy.",
                    'creditosNecesarios' => $creditosNecesarios,
                    'creditosDisponibles' => $disponibles,
                    'totalSamples' => \count($samples),
                    'yaDescargados' => \count($idsYaDescargados),
                    'sinCredito' => true,
                ], 429);
            }
        }

        /* Verificar samples premium */
        if ($plan === 'free') {
            $tienePremium = \array_filter($samplesNuevos, fn($s) => (bool) $s['es_premium']);
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
        if (!\file_exists($carpetaZips)) {
            \wp_mkdir_p($carpetaZips);
        }

        /* Hash incluye updated_at + count para invalidar cache tras cambios */
        $hashColeccion = \md5($coleccion[ColeccionesCols::UPDATED_AT] . \count($samples));
        $nombreZip = "coleccion_{$coleccionId}_{$hashColeccion}.zip";
        $rutaZip = $carpetaZips . '/' . $nombreZip;

        /* Limpiar ZIPs viejos de esta colección (cache invalidado) */
        $zipsViejos = \glob($carpetaZips . "/coleccion_{$coleccionId}_*.zip");
        foreach ($zipsViejos as $zipViejo) {
            if (\basename($zipViejo) !== $nombreZip) {
                @\unlink($zipViejo);
            }
        }

        /* Generar ZIP si no existe en cache o tiene más de 7 días */
        if (!\file_exists($rutaZip) || (\time() - filemtime($rutaZip) > 604800)) {
            $zip = new \ZipArchive();
            if ($zip->open($rutaZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Error al generar el archivo ZIP'], 500);
            }

            $nombresUsados = [];
            foreach ($samples as $sample) {
                $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL] ?? $sample[SamplesCols::RUTA_OPTIMIZADA];
                if (!$rutaArchivo || !\file_exists($rutaArchivo)) continue;

                /* Evitar nombres duplicados en el ZIP */
                $extension = \pathinfo($rutaArchivo, PATHINFO_EXTENSION);
                $nombreBase = \preg_replace('/[^a-zA-Z0-9_\-]/', '_', $sample[SamplesCols::TITULO] ?? 'sample');
                $nombreFinal = "{$nombreBase}.{$extension}";
                $contador = 1;
                while (\in_array($nombreFinal, $nombresUsados)) {
                    $nombreFinal = "{$nombreBase}_{$contador}.{$extension}";
                    $contador++;
                }
                $nombresUsados[] = $nombreFinal;

                $zip->addFile($rutaArchivo, $nombreFinal);
            }

            $zip->close();
        }

        if (!\file_exists($rutaZip)) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error al generar el archivo ZIP'], 500);
        }

        /* Registrar descargas solo de samples nuevos (no descargados previamente) */
        $calidad = DescargasController::CALIDAD_PLAN[$plan] ?? 'wav';
        foreach ($samplesNuevos as $sample) {
            $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL] ?? $sample[SamplesCols::RUTA_OPTIMIZADA];
            $tamanoBytes = ($rutaArchivo && \file_exists($rutaArchivo)) ? \filesize($rutaArchivo) : 0;

            PostgresService::ejecutar(
                "INSERT INTO descargas (usuario_id, sample_id, calidad, tamano_bytes) VALUES (:userId, :sampleId, :calidad, :tamano)",
                ['userId' => $userId, 'sampleId' => $sample[SamplesCols::ID], 'calidad' => $calidad, 'tamano' => $tamanoBytes]
            );

            PostgresService::ejecutar(
                "UPDATE samples SET total_descargas = total_descargas + 1 WHERE id = :id",
                ['id' => $sample[SamplesCols::ID]]
            );

            /* Revenue share por cada sample de otro creador */
            if ($plan !== 'free' && (int) $sample[SamplesCols::CREADOR_ID] !== $userId) {
                DescargasController::registrarTransaccionRevenueShare(
                    $userId,
                    (int) $sample[SamplesCols::CREADOR_ID],
                    (int) $sample[SamplesCols::ID],
                    $plan
                );
            }
        }

        /* Registrar interacción para el algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'descarga');

        /* URL pública del ZIP */
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
    }
}
