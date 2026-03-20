<?php

/**
 * ColeccionesCombinarController — Combinar y deshacer combinación de colecciones.
 *
 * POST /colecciones/{id}/combinar              — Combinar colección {id} con otra
 * POST /colecciones/{id}/deshacer-combinacion   — Deshacer combinación de {id}
 *
 * QL115: Feature completa de combinación con undo de 7 días.
 * QL120: Manejo de subcolecciones (mover o aplanar).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\SyncChangelogRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\SyncChangelogEnums;
use App\Config\Schema\_generated\SyncChangelogCols;
use App\Kamples\KamplesLogger;

class ColeccionesCombinarController
{
    /**
     * POST /colecciones/{id}/crear-volumen
     *
     * Body JSON:
     *   numeroVolumen: int — número visible del volumen hijo a crear (2, 3, 4...)
     */
    public static function crearVolumen(
        \WP_REST_Request $request
    ): \WP_REST_Response {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $limitResp = RateLimiter::verificarUsuario($userId, 'crear_volumen_coleccion', 50, 3600);
            if ($limitResp) return $limitResp;

            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $coleccionId = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $numeroVolumen = (int) ($body['numeroVolumen'] ?? 0);

            if ($numeroVolumen < 2) {
                return new \WP_REST_Response([
                    'code' => 'numero_volumen_invalido',
                    'message' => 'El número de volumen debe ser 2 o mayor',
                ], 400);
            }

            $resultado = ColeccionesRepository::crearVolumenEnTransaccion($coleccionId, $userId, $numeroVolumen);

            if (!($resultado['ok'] ?? false)) {
                return match ($resultado['error'] ?? 'error_crear_volumen') {
                    'coleccion_no_encontrada' => new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404),
                    'solo_raiz' => new \WP_REST_Response(['code' => 'solo_raiz', 'message' => 'Solo las colecciones raíz pueden crear volúmenes'], 400),
                    'volumen_duplicado' => new \WP_REST_Response(['code' => 'volumen_duplicado', 'message' => 'Ya existe un volumen con ese número bajo esta colección'], 409),
                    'samples_insuficientes' => new \WP_REST_Response(['code' => 'samples_insuficientes', 'message' => 'La colección necesita al menos 2 samples directos para dividirse'], 400),
                    'numero_volumen_invalido' => new \WP_REST_Response(['code' => 'numero_volumen_invalido', 'message' => 'El número de volumen debe ser 2 o mayor'], 400),
                    default => new \WP_REST_Response(['code' => 'error_crear_volumen', 'message' => 'No se pudo crear el volumen'], 500),
                };
            }

            $nuevaColeccionId = (int) ($resultado['nuevaColeccionId'] ?? 0);
            $sampleIdsMovidos = $resultado['sampleIdsMovidos'] ?? [];

            $changelogCreado = SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_CREATED,
                $nuevaColeccionId,
                [
                    'parentId' => $coleccionId,
                    'nombre' => $resultado['nombreVolumen'] ?? '',
                    'tipoOperacion' => 'crear_volumen',
                ]
            );
            if ($changelogCreado === null) {
                KamplesLogger::critical('Fallo registrar changelog crear volumen', [
                    'userId' => $userId,
                    'coleccionId' => $coleccionId,
                    'nuevaColeccionId' => $nuevaColeccionId,
                ]);
            }

            foreach ($sampleIdsMovidos as $sampleId) {
                $sampleId = (int) $sampleId;

                $clRemoved = SyncChangelogRepository::registrar(
                    $userId,
                    SyncChangelogEnums::TIPO_SAMPLE_REMOVED,
                    $sampleId,
                    ['coleccionId' => $coleccionId]
                );
                if ($clRemoved === null) {
                    KamplesLogger::critical('Fallo registrar changelog volumen sample_removed', [
                        'userId' => $userId,
                        'sampleId' => $sampleId,
                        'coleccionId' => $coleccionId,
                    ]);
                }

                $clAdded = SyncChangelogRepository::registrar(
                    $userId,
                    SyncChangelogEnums::TIPO_SAMPLE_ADDED,
                    $sampleId,
                    ['coleccionId' => $nuevaColeccionId]
                );
                if ($clAdded === null) {
                    KamplesLogger::critical('Fallo registrar changelog volumen sample_added', [
                        'userId' => $userId,
                        'sampleId' => $sampleId,
                        'coleccionId' => $nuevaColeccionId,
                    ]);
                }
            }

            return new \WP_REST_Response([
                'ok' => true,
                'nuevaColeccionId' => $nuevaColeccionId,
                'nombreVolumen' => $resultado['nombreVolumen'] ?? '',
                'samplesMovidos' => (int) ($resultado['samplesMovidos'] ?? 0),
            ], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en crear volumen de colección', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * POST /colecciones/{id}/combinar
     *
     * Body JSON:
     *   origenId: int          — Colección que desaparece (se fusiona en {id})
     *   nombreFinal: string    — Nombre a conservar
     *   imagenFinal: ?string   — URL de imagen a conservar (null = mantener la del destino)
     *   manejoHijas: string    — 'mover' | 'aplanar' (default: 'mover')
     *   usuarioDestinoId: ?int — Solo admin: reasignar propietario (si usuarios diferentes)
     */
    public static function combinar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $limitResp = RateLimiter::verificarUsuario($userId, 'combinar_coleccion', 20, 3600);
            if ($limitResp) return $limitResp;

            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $destinoId = (int) $request->get_param('id');
            $body = $request->get_json_params();

            $origenId = (int) ($body['origenId'] ?? 0);
            $nombreFinal = sanitize_text_field($body['nombreFinal'] ?? '');
            $imagenFinal = isset($body['imagenFinal']) ? esc_url_raw($body['imagenFinal']) : null;
            $manejoHijas = ($body['manejoHijas'] ?? 'mover');
            $usuarioDestinoId = isset($body['usuarioDestinoId']) ? (int) $body['usuarioDestinoId'] : null;

            /* Validaciones básicas */
            if ($origenId === 0 || $destinoId === 0) {
                return new \WP_REST_Response(['code' => 'ids_requeridos', 'message' => 'Se requieren ambos IDs de colección'], 400);
            }
            if ($origenId === $destinoId) {
                return new \WP_REST_Response(['code' => 'misma_coleccion', 'message' => 'No se puede combinar una colección consigo misma'], 400);
            }
            if (empty($nombreFinal)) {
                return new \WP_REST_Response(['code' => 'nombre_requerido', 'message' => 'Se requiere el nombre final'], 400);
            }
            if (!in_array($manejoHijas, ['mover', 'aplanar'], true)) {
                $manejoHijas = 'mover';
            }

            $esAdmin = UsuarioHelper::esAdmin();

            /* Verificar propiedad de ambas colecciones */
            $origen = ColeccionesRepository::buscarPorId($origenId);
            $destino = ColeccionesRepository::buscarPorId($destinoId);

            if (!$origen || !$destino) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Una o ambas colecciones no existen'], 404);
            }

            $origenUserId = (int) $origen[ColeccionesCols::USUARIO_ID];
            $destinoUserId = (int) $destino[ColeccionesCols::USUARIO_ID];

            if (!$esAdmin) {
                if ($origenUserId !== $userId || $destinoUserId !== $userId) {
                    return new \WP_REST_Response(['code' => 'no_autorizado', 'message' => 'Solo puedes combinar tus propias colecciones'], 403);
                }
                /* Usuarios normales no pueden reasignar propietario */
                $usuarioDestinoId = null;
            } else {
                /* Admin: si son de usuarios diferentes y no especifica destino, usar el propietario del destino */
                if ($origenUserId !== $destinoUserId && $usuarioDestinoId === null) {
                    $usuarioDestinoId = $destinoUserId;
                }
            }

            /* Ejecutar combinación atómica */
            $resultado = ColeccionesRepository::combinarEnTransaccion(
                $origenId,
                $destinoId,
                $nombreFinal,
                $imagenFinal,
                $manejoHijas,
                $usuarioDestinoId
            );

            if ($resultado === null) {
                return new \WP_REST_Response(['code' => 'error_combinacion', 'message' => 'Error al combinar colecciones'], 500);
            }

            /* Registrar en changelog para undo (7 días) */
            $changelogId = SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_MERGED,
                $destinoId,
                $resultado['backupMeta']
            );

            if ($changelogId === null) {
                KamplesLogger::critical('Fallo registrar changelog combinacion — undo no disponible', [
                    'userId' => $userId, 'origenId' => $origenId, 'destinoId' => $destinoId,
                ]);
            }

            return new \WP_REST_Response([
                'ok' => true,
                'destinoId' => $destinoId,
                'samplesMovidos' => $resultado['samplesMovidos'],
                'totalEnDestino' => $resultado['totalEnDestino'],
                'undoId' => $changelogId,
                'undoExpira' => date('c', strtotime('+7 days')),
            ], 200);

        } catch (\Throwable $e) {
            KamplesLogger::error('Error en combinar colecciones', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * POST /colecciones/{id}/deshacer-combinacion
     *
     * Body JSON:
     *   undoId: int — ID del registro de changelog que contiene el backup
     */
    public static function deshacerCombinacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $limitResp = RateLimiter::verificarUsuario($userId, 'deshacer_combinacion', 10, 3600);
            if ($limitResp) return $limitResp;

            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $destinoId = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $undoId = (int) ($body['undoId'] ?? 0);

            if ($undoId === 0) {
                return new \WP_REST_Response(['code' => 'undo_id_requerido', 'message' => 'Se requiere el ID de la operación a deshacer'], 400);
            }

            /* Buscar el registro de changelog */
            $changelog = SyncChangelogRepository::consultarUno(
                "SELECT * FROM " . SyncChangelogCols::TABLA
                . " WHERE " . SyncChangelogCols::ID . " = :id"
                . " AND " . SyncChangelogCols::TIPO . " = :tipo"
                . " AND " . SyncChangelogCols::ENTIDAD_ID . " = :entidadId",
                ['id' => $undoId, 'tipo' => SyncChangelogEnums::TIPO_COLLECTION_MERGED, 'entidadId' => $destinoId]
            );

            if (!$changelog) {
                return new \WP_REST_Response(['code' => 'undo_no_encontrado', 'message' => 'Registro de combinación no encontrado'], 404);
            }

            /* Verificar que no han pasado más de 7 días */
            $creadoAt = $changelog[SyncChangelogCols::CREATED_AT] ?? '';
            $limite = strtotime($creadoAt) + (7 * 24 * 3600);
            if (time() > $limite) {
                return new \WP_REST_Response(['code' => 'undo_expirado', 'message' => 'El plazo de 7 días para deshacer ha expirado'], 410);
            }

            /* Verificar permisos */
            $esAdmin = UsuarioHelper::esAdmin();
            $changelogUserId = (int) ($changelog[SyncChangelogCols::USUARIO_ID] ?? 0);
            if (!$esAdmin && $changelogUserId !== $userId) {
                return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
            }

            /* Decodificar metadata */
            $metadataRaw = $changelog[SyncChangelogCols::METADATA] ?? '{}';
            $backupMeta = self::decodificarMetadataChangelog($metadataRaw);

            if (empty($backupMeta) || ($backupMeta['tipo_operacion'] ?? '') !== 'combinacion') {
                return new \WP_REST_Response(['code' => 'metadata_invalida', 'message' => 'Datos de backup inválidos'], 500);
            }

            /* Ejecutar restauración */
            $restaurado = ColeccionesRepository::deshacerCombinacionEnTransaccion($backupMeta);

            if (!$restaurado) {
                return new \WP_REST_Response(['code' => 'error_restauracion', 'message' => 'Error al restaurar la combinación'], 500);
            }

            /* Marcar el changelog como usado (eliminar para evitar doble-undo) */
            SyncChangelogRepository::ejecutar(
                "DELETE FROM " . SyncChangelogCols::TABLA . " WHERE " . SyncChangelogCols::ID . " = :id",
                ['id' => $undoId]
            );

            return new \WP_REST_Response([
                'ok' => true,
                'origenId' => (int) $backupMeta['origenId'],
                'message' => 'Combinación deshecha. La colección original ha sido restaurada.',
            ], 200);

        } catch (\Throwable $e) {
            KamplesLogger::error('Error en deshacer combinacion', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /colecciones/{id}/combinacion-pendiente
     * Verificar si hay una combinación reciente que se puede deshacer.
     */
    public static function combinacionPendiente(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $destinoId = (int) $request->get_param('id');

            $esAdmin = UsuarioHelper::esAdmin();

            /* Buscar la combinación más reciente para esta colección */
            $whereUser = $esAdmin ? '' : (" AND " . SyncChangelogCols::USUARIO_ID . " = :userId");
            $params = ['entidadId' => $destinoId, 'tipo' => SyncChangelogEnums::TIPO_COLLECTION_MERGED];
            if (!$esAdmin) $params['userId'] = $userId;

            $changelog = SyncChangelogRepository::consultarUno(
                "SELECT " . SyncChangelogCols::ID . ", " . SyncChangelogCols::CREATED_AT . ", " . SyncChangelogCols::METADATA
                . " FROM " . SyncChangelogCols::TABLA
                . " WHERE " . SyncChangelogCols::TIPO . " = :tipo"
                . " AND " . SyncChangelogCols::ENTIDAD_ID . " = :entidadId"
                . $whereUser
                . " ORDER BY " . SyncChangelogCols::CREATED_AT . " DESC LIMIT 1",
                $params
            );

            if (!$changelog) {
                return new \WP_REST_Response(['hayCombinacion' => false], 200);
            }

            /* Verificar que no haya expirado */
            $creadoAt = $changelog[SyncChangelogCols::CREATED_AT] ?? '';
            $limite = strtotime($creadoAt) + (7 * 24 * 3600);
            if (time() > $limite) {
                return new \WP_REST_Response(['hayCombinacion' => false], 200);
            }

            $metadataRaw = $changelog[SyncChangelogCols::METADATA] ?? '{}';
            $meta = self::decodificarMetadataChangelog($metadataRaw);

            return new \WP_REST_Response([
                'hayCombinacion' => true,
                'undoId' => (int) $changelog[SyncChangelogCols::ID],
                'origenNombre' => $meta['origenNombre'] ?? '',
                'combinadoEn' => $creadoAt,
                'expiraEn' => date('c', $limite),
            ], 200);

        } catch (\Throwable $e) {
            KamplesLogger::error('Error en combinacionPendiente', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    private static function decodificarMetadataChangelog(mixed $metadataRaw): array
    {
        if (!is_string($metadataRaw)) {
            return is_array($metadataRaw) ? $metadataRaw : [];
        }

        $decoded = json_decode($metadataRaw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            KamplesLogger::warning('ColeccionesCombinarController: metadata de changelog inválida', [
                'jsonError' => json_last_error_msg(),
            ]);
            return [];
        }

        return $decoded;
    }
}
