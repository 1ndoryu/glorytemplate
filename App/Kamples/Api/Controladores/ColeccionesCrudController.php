<?php
/* sentinel-disable-file limite-lineas — CRUD colecciones cohesivo: crear/editar/eliminar/reordenar, apenas sobre limite (314/300) */

/**
 * ColeccionesCrudController — Operaciones de escritura de colecciones.
 *
 * POST   /colecciones                — Crear colección
 * PUT    /colecciones/{id}           — Editar colección
 * DELETE /colecciones/{id}           — Eliminar colección
 * POST   /colecciones/{id}/samples   — Agregar sample a colección
 * DELETE /colecciones/{id}/samples   — Quitar sample
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\ColeccionSamplesRepository;
use App\Kamples\Database\Repositories\SyncChangelogRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\ServicioBan;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\SyncChangelogEnums;
use App\Kamples\KamplesLogger;
use App\Kamples\Servicios\ServicioMedia;

/*
 * TO-DO [A3+A4]: Extraer lógica de negocio a ColeccionesService.php
 * Este controller excede 300 LOC y mezcla validación, lógica de negocio y respuesta HTTP.
 * Refactor propuesto:
 *   - A3: Crear App\Kamples\Services\ColeccionesService con métodos:
 *     crearColeccion(), actualizarColeccion(), eliminarColeccion(), listarSamples(), etc.
 *   - A4: Strategy pattern para campos de actualizar(): cada campo (nombre, imagen, orden)
 *     se valida y aplica con un handler independiente. Hoy el switch/if es frágil.
 *   - El controller queda como delegador: validar request → llamar service → responder.
 *   - Prioridad: MEDIA. No hay bug, pero dificulta testing y crece con cada feature.
 */
class ColeccionesCrudController
{
    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limit — 500 colecciones por hora (Alto para permitir Desktop Sync de carpetas anidadas) */
        $limitResp = RateLimiter::verificarUsuario($userId, 'crear_coleccion', 500, 3600);
        if ($limitResp) return $limitResp;

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

        $body = $request->get_json_params();
        $nombre = sanitize_text_field($body['nombre'] ?? '');
        $descripcion = sanitize_textarea_field($body['descripcion'] ?? '');
        $publica = (bool) ($body['publica'] ?? true);
        $parentId = isset($body['parent_id']) ? (int) $body['parent_id'] : null;

        if (empty($nombre)) {
            return new \WP_REST_Response(['code' => 'nombre_requerido', 'message' => 'El nombre es obligatorio'], 400);
        }

        $errorNombre = Validador::validarLongitud($nombre, Validador::MAX_NOMBRE_COLECCION, 'El nombre');
        if ($errorNombre) return Validador::respuestaError($errorNombre);
        if (!empty($descripcion)) {
            $errorDesc = Validador::validarLongitud($descripcion, Validador::MAX_DESCRIPCION_COLECCION, 'La descripción');
            if ($errorDesc) return Validador::respuestaError($errorDesc);
        }

        /* parentId: la validación de profundidad y propiedad se delega al repository */
        $id = ColeccionesRepository::crear($userId, $nombre, $descripcion, $publica, $parentId);

        if ($id === null && $parentId !== null) {
            return new \WP_REST_Response([
                'code' => 'parent_invalido',
                'message' => 'El padre no existe, no pertenece al usuario o excede la profundidad máxima (2 niveles)',
            ], 400);
        }

        /* F2.1: Registrar en changelog para delta sync (M4: verificar retorno) */
        if ($id !== null) {
            $changelogId = SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_CREATED,
                $id,
                ['nombre' => $nombre, 'parentId' => $parentId]
            );
            if ($changelogId === null) {
                KamplesLogger::critical('Fallo registrar changelog crear coleccion', ['userId' => $userId, 'colId' => $id]);
            }
        }

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::crear', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* QQ10: Rate limit ediciones — 100 por hora */
        $limitResp = RateLimiter::verificarUsuario($userId, 'editar_coleccion', 100, 3600);
        if ($limitResp) return $limitResp;

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();

        /* QL74: Admin puede editar cualquier coleccion, usuario normal solo las propias */
        $esAdmin = UsuarioHelper::esAdmin();
        if (!$esAdmin) {
            $coleccion = ColeccionesRepository::verificarPropiedad($id, $userId);
            if (!$coleccion) {
                return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
            }
        } else {
            $coleccion = ColeccionesRepository::obtenerConCreador($id);
            if (!$coleccion) {
                return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
            }
        }

        $campos = [];
        $params = [];

        if (isset($body['nombre'])) {
            $errorNombre = Validador::validarLongitud($body['nombre'], Validador::MAX_NOMBRE_COLECCION, 'El nombre');
            if ($errorNombre) return Validador::respuestaError($errorNombre);
            $campos[] = ColeccionesCols::NOMBRE . ' = :nombre';
            $params['nombre'] = sanitize_text_field($body['nombre']);
        }
        if (isset($body[ColeccionesCols::DESCRIPCION])) {
            $errorDesc = Validador::validarLongitud($body[ColeccionesCols::DESCRIPCION], Validador::MAX_DESCRIPCION_COLECCION, 'La descripción');
            if ($errorDesc) return Validador::respuestaError($errorDesc);
            $campos[] = ColeccionesCols::DESCRIPCION . ' = :desc';
            $params['desc'] = sanitize_textarea_field($body[ColeccionesCols::DESCRIPCION]);
        }
        if (isset($body['publica'])) {
            $campos[] = ColeccionesCols::PUBLICA . ' = :publica';
            $params[ColeccionesCols::PUBLICA] = ((bool) $body['publica']) ? 'true' : 'false';
        }
        /* imagenUrl es el campo canónico del frontend (normalizarColeccion → imagen_url) */
        if (isset($body['imagenUrl'])) {
            $campos[] = ColeccionesCols::IMAGEN_URL . ' = :imagen';
            $params['imagen'] = esc_url_raw($body['imagenUrl']);
        }

        /*
         * QL114: Cambio de parent_id — mover colección a otro padre o hacerla raíz.
         * array_key_exists porque null es un valor válido (= hacer raíz).
         */
        if (array_key_exists('parent_id', $body)) {
            $nuevoParentId = $body['parent_id'] !== null ? (int) $body['parent_id'] : null;

            /* No puede ser su propio padre */
            if ($nuevoParentId === $id) {
                return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'Una colección no puede ser su propio padre'], 400);
            }

            if ($nuevoParentId !== null) {
                /* Verificar que el padre existe y pertenece al mismo usuario */
                $padre = ColeccionesRepository::obtenerConCreador($nuevoParentId);
                if (!$padre) {
                    return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'La colección padre no existe'], 400);
                }
                $ownerIdPadre = (int) ($padre[ColeccionesCols::USUARIO_ID] ?? 0);
                if (!$esAdmin && $ownerIdPadre !== $userId) {
                    return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'La colección padre no pertenece al usuario'], 403);
                }
                /* Profundidad máxima 2: padre no puede tener parent_id */
                if (!empty($padre[ColeccionesCols::PARENT_ID])) {
                    return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'Profundidad máxima excedida (2 niveles)'], 400);
                }
                /* No puede mover a un hijo propio (circular) */
                $hijos = ColeccionesRepository::listarSubcolecciones($id);
                foreach ($hijos as $hijo) {
                    if ((int) $hijo[ColeccionesCols::ID] === $nuevoParentId) {
                        return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'No se puede mover a una subcolección propia'], 400);
                    }
                }
            }

            $campos[] = ColeccionesCols::PARENT_ID . ' = :parentId';
            $params['parentId'] = $nuevoParentId;
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios'], 400);
        }

        /* F5.2: Optimistic locking — si el cliente envia version, verificar coincidencia */
        $versionCliente = isset($body['version']) ? (int) $body['version'] : null;
        $actualizado = ColeccionesRepository::actualizarCampos($id, $campos, $params, $versionCliente);

        if (!$actualizado && $versionCliente !== null) {
            /* Version mismatch: otro cliente/tab modifico la coleccion primero */
            return new \WP_REST_Response([
                'code' => 'conflicto_version',
                'message' => 'La colección fue modificada por otro cliente. Sincroniza y reintenta.',
                'versionServidor' => (int) ($coleccion[ColeccionesCols::VERSION] ?? 1),
            ], 409);
        }

        /* F2.1: Registrar rename en changelog si cambio el nombre (M4: verificar retorno) */
        if (isset($params['nombre'])) {
            $changelogId = SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_RENAMED,
                $id,
                ['nombreAnterior' => $coleccion[ColeccionesCols::NOMBRE] ?? '', 'nombreNuevo' => $params['nombre']]
            );
            if ($changelogId === null) {
                KamplesLogger::critical('Fallo registrar changelog rename coleccion', ['userId' => $userId, 'colId' => $id]);
            }
        }

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::actualizar', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* QQ10: Rate limit eliminaciones — 50 por hora */
        $limitResp = RateLimiter::verificarUsuario($userId, 'eliminar_coleccion', 50, 3600);
        if ($limitResp) return $limitResp;

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        if ($esAdmin) {
            $rows = ColeccionesRepository::eliminarConSamples($id);
        } else {
            $rows = ColeccionesRepository::eliminarDelUsuario($id, $userId);
        }

        /* F2.1: Registrar eliminacion en changelog (M4: verificar retorno) */
        if ($rows > 0) {
            $changelogId = SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_DELETED,
                $id
            );
            if ($changelogId === null) {
                KamplesLogger::critical('Fallo registrar changelog eliminar coleccion', ['userId' => $userId, 'colId' => $id]);
            }
        }

        return new \WP_REST_Response(['ok' => $rows > 0], $rows > 0 ? 200 : 404);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::eliminar', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * POST /colecciones/{id}/imagen — Sube imagen de portada y actualiza imagen_url.
     * Acepta multipart/form-data con campo 'imagen'. Retorna { imagenUrl }.
     */
    public static function subirImagen(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            /* QQ10: Rate limit subida imágenes — 30 por hora */
            $limitResp = RateLimiter::verificarUsuario($userId, 'subir_imagen_col', 30, 3600);
            if ($limitResp) return $limitResp;

            $id = (int) $request->get_param('id');

            /* QL74: Admin puede subir imagen a cualquier coleccion */
            if (!UsuarioHelper::esAdmin()) {
                $coleccion = ColeccionesRepository::verificarPropiedad($id, $userId);
                if (!$coleccion) {
                    return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
                }
            }

            $files = $request->get_file_params();
            if (empty($files['imagen']) || $files['imagen']['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'imagen_requerida', 'message' => 'Se requiere un archivo de imagen'], 400);
            }

            $archivo = $files['imagen'];

            /* A1: Validar tipo MIME desde el archivo real del servidor (no del header HTTP del cliente) */
            $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            $tipoReal = \function_exists('mime_content_type') ? \mime_content_type($archivo['tmp_name']) : $archivo['type'];
            if (!in_array($tipoReal, $tiposPermitidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => 'Solo se permiten imágenes JPG, PNG, WebP o GIF'], 400);
            }

            /* Validar tamaño desde el archivo real del servidor: máx 5 MB */
            $tamanoReal = \filesize($archivo['tmp_name']);
            if ($tamanoReal === false || $tamanoReal > 5 * 1024 * 1024) {
                return new \WP_REST_Response(['code' => 'archivo_muy_grande', 'message' => 'La imagen no puede superar 5MB'], 400);
            }

            if (!function_exists('wp_handle_upload')) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
            }

            $resultado = wp_handle_upload($archivo, ['test_form' => false]);
            if (isset($resultado['error'])) {
                KamplesLogger::error('Error al subir imagen de colección', ['error' => $resultado['error'], 'coleccionId' => $id]);
                return new \WP_REST_Response(['code' => 'error_subida', 'message' => $resultado['error']], 500);
            }

            /* QQ56: Optimizar imagen de colección */
            ServicioMedia::optimizarImagen(
                $resultado['file'],
                ServicioMedia::CALIDAD_PUBLICACION,
                ServicioMedia::DIMENSION_PUBLICACION
            );

            $url = esc_url_raw($resultado['url']);

            /* Persistir la URL en imagen_url — campo canónico leído por el frontend */
            ColeccionesRepository::actualizarCampos(
                $id,
                [ColeccionesCols::IMAGEN_URL . ' = :imagen'],
                ['imagen' => $url]
            );

            return new \WP_REST_Response(['imagenUrl' => $url], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::subirImagen', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function agregarSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limit — 2000 adiciones a colección por hora (subido para soportar sync masivo de carpetas) */
        $limitResp = RateLimiter::verificarUsuario($userId, 'agregar_sample_col', 2000, 3600);
        if ($limitResp) return $limitResp;

        $colId = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $sampleId = (int) ($body['sampleId'] ?? 0);

        if ($sampleId <= 0) {
            return new \WP_REST_Response(['code' => 'sample_id_requerido'], 400);
        }

        /* QL74: Admin puede agregar samples a cualquier coleccion */
        if (!UsuarioHelper::esAdmin()) {
            $coleccion = ColeccionesRepository::verificarPropiedad($colId, $userId);
            if (!$coleccion) {
                return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
            }
        }

        /*
         * D2: moverAColeccion maneja atomicamente el INSERT + posible UPDATE si
         * el sample ya estaba en otra coleccion (constraint UNIQUE(usuario_id, sample_id)).
         */
        $resultado = ColeccionSamplesRepository::moverAColeccion($colId, $sampleId, $userId);
        ColeccionesRepository::tocarTimestamp($colId);

        $colAnterior = $resultado['coleccionAnterior'] ?? null;

        if ($colAnterior !== null) {
            /* Registrar removal de la coleccion anterior */
            $clRemoved = SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_SAMPLE_REMOVED,
                $sampleId,
                ['coleccionId' => $colAnterior]
            );
            if ($clRemoved === null) {
                KamplesLogger::critical('Fallo registrar changelog mover sample (removed)', [
                    'userId' => $userId, 'sampleId' => $sampleId, 'colAnterior' => $colAnterior,
                ]);
            }
        }

        /* F2.1: Registrar sample agregado en changelog (M4: verificar retorno) */
        $changelogId = SyncChangelogRepository::registrar(
            $userId,
            SyncChangelogEnums::TIPO_SAMPLE_ADDED,
            $sampleId,
            ['coleccionId' => $colId]
        );
        if ($changelogId === null) {
            KamplesLogger::critical('Fallo registrar changelog agregar sample', ['userId' => $userId, 'sampleId' => $sampleId, 'colId' => $colId]);
        }

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::agregarSample', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function quitarSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $colId = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $sampleId = (int) ($body['sampleId'] ?? 0);

        /* QL74: Admin puede quitar samples de cualquier coleccion */
        if (!UsuarioHelper::esAdmin()) {
            $coleccion = ColeccionesRepository::verificarPropiedad($colId, $userId);
            if (!$coleccion) {
                return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
            }
        }

        ColeccionSamplesRepository::quitar($colId, $sampleId);

        /* F2.1: Registrar sample quitado en changelog (M4: verificar retorno) */
        $changelogId = SyncChangelogRepository::registrar(
            $userId,
            SyncChangelogEnums::TIPO_SAMPLE_REMOVED,
            $sampleId,
            ['coleccionId' => $colId]
        );
        if ($changelogId === null) {
            KamplesLogger::critical('Fallo registrar changelog quitar sample', ['userId' => $userId, 'sampleId' => $sampleId, 'colId' => $colId]);
        }

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::quitarSample', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * POST /colecciones/{id}/mover-sample — Mover sample a esta coleccion (D2).
     *
     * Si el sample ya esta en otra coleccion, lo mueve atomicamente.
     * Registra changelog para ambas colecciones (removal + added).
     */
    public static function moverSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $colId = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $sampleId = (int) ($body['sampleId'] ?? 0);

            if ($sampleId <= 0) {
                return new \WP_REST_Response(['code' => 'sample_id_requerido'], 400);
            }

            /* QL74: Admin puede mover samples en cualquier coleccion */
            if (!UsuarioHelper::esAdmin()) {
                $coleccion = ColeccionesRepository::verificarPropiedad($colId, $userId);
                if (!$coleccion) {
                    return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
                }
            }

            $resultado = ColeccionSamplesRepository::moverAColeccion($colId, $sampleId, $userId);
            ColeccionesRepository::tocarTimestamp($colId);

            $colAnterior = $resultado['coleccionAnterior'] ?? null;

            /* Registrar changelog de movimiento */
            if ($colAnterior !== null) {
                SyncChangelogRepository::registrar(
                    $userId,
                    SyncChangelogEnums::TIPO_SAMPLE_REMOVED,
                    $sampleId,
                    ['coleccionId' => $colAnterior]
                );
            }

            if ($resultado['accion'] !== 'ya_en_coleccion') {
                SyncChangelogRepository::registrar(
                    $userId,
                    SyncChangelogEnums::TIPO_SAMPLE_ADDED,
                    $sampleId,
                    ['coleccionId' => $colId]
                );
            }

            return new \WP_REST_Response([
                'ok' => true,
                'accion' => $resultado['accion'],
                'coleccionAnterior' => $colAnterior,
                'coleccionNueva' => $colId,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::moverSample', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
