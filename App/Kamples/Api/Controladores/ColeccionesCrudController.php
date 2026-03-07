<?php

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
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\SyncChangelogEnums;
use App\Kamples\KamplesLogger;

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

        /* F2.1: Registrar en changelog para delta sync */
        if ($id !== null) {
            SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_CREATED,
                $id,
                ['nombre' => $nombre, 'parentId' => $parentId]
            );
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

        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();

        $coleccion = ColeccionesRepository::verificarPropiedad($id, $userId);
        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
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

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios'], 400);
        }

        ColeccionesRepository::actualizarCampos($id, $campos, $params);

        /* F2.1: Registrar rename en changelog si cambio el nombre */
        if (isset($params['nombre'])) {
            SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_RENAMED,
                $id,
                ['nombreAnterior' => $coleccion[ColeccionesCols::NOMBRE] ?? '', 'nombreNuevo' => $params['nombre']]
            );
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

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        if ($esAdmin) {
            $rows = ColeccionesRepository::eliminarConSamples($id);
        } else {
            $rows = ColeccionesRepository::eliminarDelUsuario($id, $userId);
        }

        /* F2.1: Registrar eliminacion en changelog */
        if ($rows > 0) {
            SyncChangelogRepository::registrar(
                $userId,
                SyncChangelogEnums::TIPO_COLLECTION_DELETED,
                $id
            );
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

            $id = (int) $request->get_param('id');

            $coleccion = ColeccionesRepository::verificarPropiedad($id, $userId);
            if (!$coleccion) {
                return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
            }

            $files = $request->get_file_params();
            if (empty($files['imagen']) || $files['imagen']['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'imagen_requerida', 'message' => 'Se requiere un archivo de imagen'], 400);
            }

            $archivo = $files['imagen'];

            /* Validar tipo MIME — solo imágenes */
            $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!in_array($archivo['type'], $tiposPermitidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => 'Solo se permiten imágenes JPG, PNG, WebP o GIF'], 400);
            }

            /* Validar tamaño: máx 5 MB */
            if ($archivo['size'] > 5 * 1024 * 1024) {
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

        $coleccion = ColeccionesRepository::verificarPropiedad($colId, $userId);
        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        $nextPos = ColeccionSamplesRepository::siguientePosicion($colId);
        ColeccionSamplesRepository::agregar($colId, $sampleId, $nextPos);
        ColeccionesRepository::tocarTimestamp($colId);

        /* F2.1: Registrar sample agregado en changelog */
        SyncChangelogRepository::registrar(
            $userId,
            SyncChangelogEnums::TIPO_SAMPLE_ADDED,
            $sampleId,
            ['coleccionId' => $colId]
        );

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

        $coleccion = ColeccionesRepository::verificarPropiedad($colId, $userId);
        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        ColeccionSamplesRepository::quitar($colId, $sampleId);

        /* F2.1: Registrar sample quitado en changelog */
        SyncChangelogRepository::registrar(
            $userId,
            SyncChangelogEnums::TIPO_SAMPLE_REMOVED,
            $sampleId,
            ['coleccionId' => $colId]
        );

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesCrudController::quitarSample', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
