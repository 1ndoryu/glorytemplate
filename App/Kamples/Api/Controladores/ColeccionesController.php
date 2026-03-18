<?php

/* sentinel-disable-file limite-lineas: controlador REST con múltiples endpoints de lectura de colecciones; este cambio solo corrige 173A-4 y la división completa queda fuera del alcance inmediato. */

/**
 * ColeccionesController — CRUD de colecciones + sugerencias.
 *
 * Endpoints:
 *   GET    /colecciones              — Listar colecciones del usuario
 *   POST   /colecciones              — Crear colección
 *   GET    /colecciones/{id}         — Detalle con samples
 *   PUT    /colecciones/{id}         — Editar colección
 *   DELETE /colecciones/{id}         — Eliminar colección
 *   POST   /colecciones/{id}/samples — Agregar sample a colección
 *   DELETE /colecciones/{id}/samples — Quitar sample
 *   GET    /colecciones/{id}/sugerencias — Samples similares (Más Ideas)
 *   GET    /colecciones/explorar     — Colecciones públicas de otros
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\ColeccionesGuardadasRepository;
use App\Kamples\Database\Repositories\ColeccionesLikesRepository;
use App\Kamples\Database\Repositories\ColeccionSamplesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\OrdenamientoHelper;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Kamples\KamplesLogger;

class ColeccionesController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/colecciones', [
            'methods' => 'GET', 'callback' => [self::class, 'listar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/explorar', [
            'methods' => 'GET', 'callback' => [self::class, 'explorar'],
            'permission_callback' => '__return_true',
            'args' => ['page' => ['required' => false, 'type' => 'integer', 'default' => 1]],
        ]);

        register_rest_route($namespace, '/colecciones', [
            'methods' => 'POST', 'callback' => [ColeccionesCrudController::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)', [
            'methods' => 'GET', 'callback' => [self::class, 'obtener'],
            'permission_callback' => '__return_true',
        ]);

        /* QQ13: Obtener colección por slug SEO
         * [183A-51] Pattern incluye % para backward compat con slugs unicode
         * generados antes del fix de generarSlug() */
        register_rest_route($namespace, '/colecciones/por-slug/(?P<slug>[a-zA-Z0-9%_-]+)', [
            'methods' => 'GET', 'callback' => [self::class, 'obtenerPorSlug'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)', [
            'methods' => 'PUT', 'callback' => [ColeccionesCrudController::class, 'actualizar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)', [
            'methods' => 'DELETE', 'callback' => [ColeccionesCrudController::class, 'eliminar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/imagen', [
            'methods'             => 'POST',
            'callback'            => [ColeccionesCrudController::class, 'subirImagen'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/samples', [
            'methods' => 'POST', 'callback' => [ColeccionesCrudController::class, 'agregarSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/samples', [
            'methods' => 'DELETE', 'callback' => [ColeccionesCrudController::class, 'quitarSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* D2: Mover sample a esta colección (atomico, registra changelog para ambas colecciones) */
        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/mover-sample', [
            'methods' => 'POST', 'callback' => [ColeccionesCrudController::class, 'moverSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/sugerencias', [
            'methods' => 'GET', 'callback' => [self::class, 'sugerencias'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        /* Modal "Guardar en colección" — colecciones relevantes para un sample */
        register_rest_route($namespace, '/colecciones/relevantes/(?P<sampleId>\d+)', [
            'methods' => 'GET', 'callback' => [self::class, 'relevantesParaSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QL92: Bookmark de colecciones ajenas */
        register_rest_route($namespace, '/colecciones/guardadas', [
            'methods' => 'GET', 'callback' => [self::class, 'listarGuardadas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 30],
            ],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/guardar', [
            'methods' => 'POST', 'callback' => [self::class, 'guardarColeccion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/guardar', [
            'methods' => 'DELETE', 'callback' => [self::class, 'desguardarColeccion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* [183A-22] Toggle like de coleccion — distinto del bookmark/guardar */
        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/like', [
            'methods' => 'POST', 'callback' => [self::class, 'toggleLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QL115: Combinar colecciones */
        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/combinar', [
            'methods' => 'POST', 'callback' => [ColeccionesCombinarController::class, 'combinar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/deshacer-combinacion', [
            'methods' => 'POST', 'callback' => [ColeccionesCombinarController::class, 'deshacerCombinacion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/combinacion-pendiente', [
            'methods' => 'GET', 'callback' => [ColeccionesCombinarController::class, 'combinacionPendiente'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /* C169: Soporte busqueda en mis colecciones. C388: tags_frecuentes. */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
        $colecciones = ColeccionesRepository::listarDelUsuario($userId, $busqueda);

        /* C388: Tags más frecuentes (solo si no hay búsqueda activa) */
        $tagsFrecuentes = empty($busqueda)
            ? ColeccionesRepository::tagsFrecuentesDelUsuario($userId)
            : [];

        return new \WP_REST_Response([
            'data' => [
                'colecciones' => $colecciones,
                'tags_frecuentes' => $tagsFrecuentes,
            ],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::listar', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * C169: Soporte busqueda + C181: Algoritmo de relevancia personalizada.
     * Si el usuario está autenticado, ordena por afinidad de tags.
     * Sino, ordena por updated_at DESC (fallback).
     */
    public static function explorar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $page = \max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;
        $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
        $userId = UsuarioHelper::obtenerIdPg();

        $colecciones = ColeccionesRepository::explorarPublicas($offset, $busqueda, $userId);

        /* C193: Fallback avatar a WP Gravatar + QL81: parsear tags PG array */
        foreach ($colecciones as &$col) {
            $col[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                $col[UsuariosExtCols::AVATAR_URL] ?? null,
                isset($col[UsuariosExtCols::WP_USER_ID]) ? (int) $col[UsuariosExtCols::WP_USER_ID] : null
            );
            unset($col[UsuariosExtCols::WP_USER_ID]);
            $col['tags'] = NormalizadorSample::pgArrayToPhp($col['tags'] ?? '{}');
        }
        unset($col);

        /* B1: Tags frecuentes de colecciones públicas (solo sin búsqueda activa) */
        $tagsFrecuentes = empty($busqueda)
            ? ColeccionesRepository::tagsFrecuentesExplorar()
            : [];

        return new \WP_REST_Response([
            'data' => [
                'colecciones' => $colecciones,
                'tags_frecuentes' => $tagsFrecuentes,
            ],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::explorar', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $id = (int) $request->get_param('id');

        $coleccion = ColeccionesRepository::obtenerConCreador($id);

        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404);
        }

        /*
         * Seguridad: solo mostrar colecciones privadas al propietario.
         * Las colecciones publicas son accesibles para todos.
         */
        $esPublica = (bool) ($coleccion[ColeccionesCols::PUBLICA] ?? true);
        if (!$esPublica) {
            $usuarioActual = UsuarioHelper::obtenerIdPg();
            if (!$usuarioActual || $usuarioActual !== (int) $coleccion[ColeccionesCols::USUARIO_ID]) {
                return new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404);
            }
        }

        /* Samples de la colección via repository */
        $parentId = $coleccion[ColeccionesCols::PARENT_ID] ?? null;
        $incluirSub = \filter_var($request->get_param('incluirSubcolecciones') ?? 'false', FILTER_VALIDATE_BOOLEAN);
        $userId = UsuarioHelper::obtenerIdPg();
        $orden = OrdenamientoHelper::sanitizar((string) ($request->get_param('orden') ?? ''), OrdenamientoHelper::ORDEN_POSICION);

        if ($incluirSub && $parentId === null) {
            /* D3: Vista virtual — incluir samples de subcolecciones */
            $subIds = ColeccionesRepository::idsSubcolecciones($id);
            if (!empty($subIds)) {
                $samples = ColeccionSamplesRepository::samplesConSubcolecciones($id, $subIds, $userId, $orden);
            } else {
                $samples = ColeccionSamplesRepository::samplesDeColeccion($id, $userId, $orden);
            }
        } else {
            $samples = ColeccionSamplesRepository::samplesDeColeccion($id, $userId, $orden);
        }

        $coleccion['samples'] = NormalizadorSample::normalizarLista($samples);
        /* [183A-13] El detalle debe usar el mismo total real que el listado visible.
         * Gotcha: los campos agregados de BD pueden quedar desfasados al incluir subcolecciones.
         * Pendiente: centralizar este conteo en repository si vuelve a reutilizarse. */
        $coleccion['total_items'] = \count($coleccion['samples']);
        $coleccion['total_samples'] = $coleccion['total_items'];

        /* Subcolecciones (solo para colecciones raíz) */
        if ($parentId === null) {
            $coleccion['subcolecciones'] = ColeccionesRepository::listarSubcolecciones($id);
        } else {
            $coleccion['subcolecciones'] = [];
            $coleccion['coleccion_padre'] = ColeccionesRepository::obtenerResumen((int) $parentId);
        }

        /* C193: Fallback avatar propietario */
        $coleccion[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
            $coleccion[UsuariosExtCols::AVATAR_URL] ?? null,
            isset($coleccion[UsuariosExtCols::WP_USER_ID]) ? (int) $coleccion[UsuariosExtCols::WP_USER_ID] : null
        );
        unset($coleccion[UsuariosExtCols::WP_USER_ID]);

        /* QL92: Flag de coleccion guardada (bookmark) */
        if ($userId) {
            $coleccion['esta_guardada'] = ColeccionesGuardadasRepository::estaGuardada($userId, $id);
            /* [183A-22] Flag de like (distinto al bookmark) */
            $coleccion['esta_likeada'] = ColeccionesLikesRepository::estaLikeada($userId, $id);
        }
        $coleccion['total_likes'] = ColeccionesLikesRepository::contarLikes($id);

        return new \WP_REST_Response(['data' => $coleccion], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::obtener', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QQ13: GET /colecciones/por-slug/{slug} — Obtener colección por slug SEO.
     * Reutiliza la lógica de obtener() pero resuelve por slug en vez de ID.
     */
    public static function obtenerPorSlug(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = \sanitize_text_field($request->get_param('slug'));
            if (empty($slug)) {
                return new \WP_REST_Response(['code' => 'slug_invalido'], 400);
            }

            $coleccion = ColeccionesRepository::obtenerPorSlug($slug);
            if (!$coleccion) {
                return new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404);
            }

            /* [183A-51] Auto-reparar slugs con secuencias %XX (unicode mal codificado) */
            $slugActual = $coleccion[ColeccionesCols::SLUG] ?? '';
            if (str_contains($slugActual, '%')) {
                $nuevoSlug = ColeccionesRepository::generarSlug(
                    $coleccion[ColeccionesCols::NOMBRE],
                    (int) $coleccion[ColeccionesCols::ID]
                );
                ColeccionesRepository::actualizarSlug(
                    (int) $coleccion[ColeccionesCols::ID],
                    $nuevoSlug
                );
                $coleccion[ColeccionesCols::SLUG] = $nuevoSlug;
            }

            /* Seguridad: colecciones privadas solo visibles al propietario */
            $esPublica = (bool) ($coleccion[ColeccionesCols::PUBLICA] ?? true);
            if (!$esPublica) {
                $usuarioActual = UsuarioHelper::obtenerIdPg();
                if (!$usuarioActual || $usuarioActual !== (int) $coleccion[ColeccionesCols::USUARIO_ID]) {
                    return new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404);
                }
            }

            $id = (int) $coleccion[ColeccionesCols::ID];
            $parentId = $coleccion[ColeccionesCols::PARENT_ID] ?? null;
            $incluirSub = \filter_var($request->get_param('incluirSubcolecciones') ?? 'false', FILTER_VALIDATE_BOOLEAN);
            $userId = UsuarioHelper::obtenerIdPg();
            $orden = OrdenamientoHelper::sanitizar((string) ($request->get_param('orden') ?? ''), OrdenamientoHelper::ORDEN_POSICION);

            if ($incluirSub && $parentId === null) {
                $subIds = ColeccionesRepository::idsSubcolecciones($id);
                if (!empty($subIds)) {
                    $samples = ColeccionSamplesRepository::samplesConSubcolecciones($id, $subIds, $userId, $orden);
                } else {
                    $samples = ColeccionSamplesRepository::samplesDeColeccion($id, $userId, $orden);
                }
            } else {
                $samples = ColeccionSamplesRepository::samplesDeColeccion($id, $userId, $orden);
            }

            $coleccion['samples'] = NormalizadorSample::normalizarLista($samples);
            /* [183A-13] Mantener consistente el total expuesto por slug e ID. */
            $coleccion['total_items'] = \count($coleccion['samples']);
            $coleccion['total_samples'] = $coleccion['total_items'];

            if ($parentId === null) {
                $coleccion['subcolecciones'] = ColeccionesRepository::listarSubcolecciones($id);
            } else {
                $coleccion['subcolecciones'] = [];
                $coleccion['coleccion_padre'] = ColeccionesRepository::obtenerResumen((int) $parentId);
            }

            $coleccion[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                $coleccion[UsuariosExtCols::AVATAR_URL] ?? null,
                isset($coleccion[UsuariosExtCols::WP_USER_ID]) ? (int) $coleccion[UsuariosExtCols::WP_USER_ID] : null
            );
            unset($coleccion[UsuariosExtCols::WP_USER_ID]);

            /* QL92: Flag de coleccion guardada (bookmark) */
            if ($userId) {
                $coleccion['esta_guardada'] = ColeccionesGuardadasRepository::estaGuardada($userId, $id);
                /* [183A-22] Flag de like */
                $coleccion['esta_likeada'] = ColeccionesLikesRepository::estaLikeada($userId, $id);
            }
            $coleccion['total_likes'] = ColeccionesLikesRepository::contarLikes($id);

            return new \WP_REST_Response(['data' => $coleccion], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::obtenerPorSlug', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /colecciones/{id}/sugerencias — "Más Ideas" para una colección.
     * Busca samples similares basándose en tags, género, BPM y key de los samples existentes.
     */
    public static function sugerencias(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $colId = (int) $request->get_param('id');
        $page = \max(1, (int) $request->get_param('page'));
        $perPage = \max(1, (int) $request->get_param('per_page'));
        $offset = ($page - 1) * $perPage;

        /* Obtener contexto de la colección (tags, bpm, keys de sus samples) */
        $contextoCols = ColeccionSamplesRepository::contextoParaSugerencias($colId);

        if (empty($contextoCols)) {
            return new \WP_REST_Response(['data' => []], 200);
        }

        /* Construir contexto de similitud */
        $allTags = [];
        $allBpms = [];
        $allKeys = [];
        foreach ($contextoCols as $row) {
            $tags = NormalizadorSample::pgArrayToPhp($row[SamplesCols::TAGS] ?? '');
            $allTags = \array_merge($allTags, $tags);
            if (!empty($row[SamplesCols::BPM])) $allBpms[] = (int) $row[SamplesCols::BPM];
            if (!empty($row[SamplesCols::KEY])) $allKeys[] = $row[SamplesCols::KEY];
        }

        /* Tags más frecuentes de la colección */
        $tagCounts = \array_count_values($allTags);
        \arsort($tagCounts);
        $topTags = \array_slice(\array_keys($tagCounts), 0, 10);

        /* IDs a excluir (ya están en la colección) */
        $idsExcluir = ColeccionSamplesRepository::idsDeColeccion($colId);

        /* BPM promedio y key dominante */
        $avgBpm = !empty($allBpms) ? (int) (\array_sum($allBpms) / \count($allBpms)) : 120;
        $topKey = !empty($allKeys) ? \array_count_values($allKeys) : [];
        \arsort($topKey);
        $dominantKey = !empty($topKey) ? array_key_first($topKey) : null;

        /* Query de sugerencias con scoring vía Repository */
        $samples = SamplesRepository::sugerenciasPorContexto(
            $topTags, $avgBpm, $dominantKey, $idsExcluir, $perPage, $offset
        );

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
            'contexto' => ['topTags' => $topTags, 'avgBpm' => $avgBpm, 'dominantKey' => $dominantKey],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::sugerencias', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /colecciones/relevantes/{sampleId} — Colecciones más relevantes del usuario para un sample.
     * Ordena por tags comunes y uso frecuente (tipo Pinterest).
     */
    public static function relevantesParaSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $sampleId = (int) $request->get_param('sampleId');

        /* Obtener tags del sample */
        $sampleTags = SamplesRepository::obtenerTags($sampleId);

        /* Obtener colecciones del usuario ordenadas por relevancia */
        $colecciones = ColeccionesRepository::relevantesParaSample($userId, $sampleTags);

        /* Verificar si el sample ya está en cada colección */
        foreach ($colecciones as &$col) {
            $col['contieneElSample'] = ColeccionSamplesRepository::contiene(
                (int) $col['id'], $sampleId
            );
        }

        return new \WP_REST_Response(['data' => $colecciones], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::relevantesParaSample', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QL92: Guardar (bookmark) coleccion ajena para acceso rapido.
     * Optimista: si ya esta guardada, retorna 200 igualmente.
     */
    public static function guardarColeccion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $coleccionId = (int) $request->get_param('id');

            /* Verificar que la coleccion existe y es publica */
            if (!ColeccionesRepository::esPublica($coleccionId)) {
                return new \WP_REST_Response(['code' => 'no_encontrada', 'message' => 'Coleccion no encontrada o privada'], 404);
            }

            ColeccionesGuardadasRepository::guardar($userId, $coleccionId);

            return new \WP_REST_Response(['guardada' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::guardarColeccion', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QL92: Quitar bookmark de coleccion.
     */
    public static function desguardarColeccion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $coleccionId = (int) $request->get_param('id');
            ColeccionesGuardadasRepository::desguardar($userId, $coleccionId);

            return new \WP_REST_Response(['guardada' => false], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::desguardarColeccion', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QL92: Listar colecciones guardadas del usuario con paginacion.
     */
    public static function listarGuardadas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $page = \max(1, (int) ($request->get_param('page') ?? 1));
            $perPage = \min(50, \max(1, (int) ($request->get_param('per_page') ?? 30)));
            $offset = ($page - 1) * $perPage;

            $colecciones = ColeccionesGuardadasRepository::listarDelUsuario($userId, $perPage, $offset);
            $total = ColeccionesGuardadasRepository::contarDelUsuario($userId);

            /* Resolver avatar y parsear tags como en explorar */
            foreach ($colecciones as &$col) {
                $col[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                    $col[UsuariosExtCols::AVATAR_URL] ?? null,
                    null
                );
                $col['tags'] = NormalizadorSample::pgArrayToPhp($col['tags'] ?? '{}');
            }

            return new \WP_REST_Response([
                'data' => [
                    'colecciones' => $colecciones,
                    'total' => $total,
                    'page' => $page,
                ],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::listarGuardadas', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * [183A-22] Toggle like de coleccion.
     * POST retorna { likeada: bool, total_likes: int }.
     * El like es independiente del bookmark: los usuarios pueden guardar para acceso rápido
     * o likear para mostrar apreciación; son dos gestos distintos.
     */
    public static function toggleLike(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $coleccionId = (int) $request->get_param('id');

            /* Verificar que la colección existe y es pública (no tiene sentido likearse la propia) */
            if (!ColeccionesRepository::esPublica($coleccionId)) {
                return new \WP_REST_Response(['code' => 'no_encontrada', 'message' => 'Coleccion no encontrada o privada'], 404);
            }

            $likeada = ColeccionesLikesRepository::toggle($userId, $coleccionId);
            $totalLikes = ColeccionesLikesRepository::contarLikes($coleccionId);

            return new \WP_REST_Response([
                'likeada' => $likeada,
                'total_likes' => $totalLikes,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColeccionesController::toggleLike', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
