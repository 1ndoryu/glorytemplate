<?php

/* [183A-109] ArticulosController — Lectura y listado de artículos del blog.
 * Escritura CRUD en ArticulosEscrituraController.
 * Endpoints:
 *   GET    /articulos            — Listar publicados (público, filtrable por categoría)
 *   GET    /articulos/categorias — Conteo por categorías
 *   GET    /articulos/{slug}     — Detalle de artículo por slug
 *   GET    /articulos/mis-articulos — Artículos del usuario actual
 *   POST   /articulos            — Crear (→ ArticulosEscrituraController)
 *   PUT    /articulos/{id}       — Actualizar (→ ArticulosEscrituraController)
 *   DELETE /articulos/{id}       — Eliminar (→ ArticulosEscrituraController)
 *   POST   /articulos/{id}/like  — Toggle like
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ArticulosRepository;
use App\Kamples\Database\Repositories\ArticulosLikesRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Config\Schema\_generated\ArticulosEnums;
use App\Kamples\KamplesLogger;
use WP_REST_Request;
use WP_REST_Response;

class ArticulosController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/articulos', [
            [
                'methods' => 'GET', 'callback' => [self::class, 'listar'],
                'permission_callback' => '__return_true',
                'args' => [
                    'page'      => ['type' => 'integer', 'default' => 1],
                    'per_page'  => ['type' => 'integer', 'default' => 20],
                    'categoria' => ['type' => 'string', 'default' => ''],
                ],
            ],
            [
                'methods' => 'POST', 'callback' => [ArticulosEscrituraController::class, 'crear'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
        ]);

        register_rest_route($namespace, '/articulos/categorias', [
            'methods' => 'GET', 'callback' => [self::class, 'categorias'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/articulos/mis-articulos', [
            'methods' => 'GET', 'callback' => [self::class, 'misArticulos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/articulos/(?P<slug>[^/]+)', [
            [
                'methods' => 'GET', 'callback' => [self::class, 'obtener'],
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($namespace, '/articulos/(?P<id>\d+)', [
            [
                'methods' => 'PUT', 'callback' => [ArticulosEscrituraController::class, 'actualizar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
            [
                'methods' => 'DELETE', 'callback' => [ArticulosEscrituraController::class, 'eliminar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
        ]);

        register_rest_route($namespace, '/articulos/(?P<id>\d+)/like', [
            'methods' => 'POST', 'callback' => [self::class, 'toggleLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /* GET /articulos — Listado público paginado, filtrable por categoría */
    public static function listar(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $page = max(1, (int)$request->get_param('page'));
            $perPage = min(50, max(1, (int)$request->get_param('per_page')));
            $categoria = sanitize_text_field($request->get_param('categoria') ?? '');
            $offset = ($page - 1) * $perPage;

            /* Validar categoría contra whitelist */
            $catFiltro = null;
            if (!empty($categoria) && in_array($categoria, ArticulosEnums::TODOS_CATEGORIA, true)) {
                $catFiltro = $categoria;
            }

            $userId = get_current_user_id() ?: null;
            $articulos = ArticulosRepository::listarPublicados($perPage, $offset, $catFiltro, $userId);
            $total = ArticulosRepository::contarPublicados($catFiltro);

            return new WP_REST_Response([
                'ok'       => true,
                'data'     => array_map([self::class, 'normalizarArticulo'], $articulos),
                'total'    => $total,
                'page'     => $page,
                'per_page' => $perPage,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosController::listar', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al cargar artículos'], 500);
        }
    }

    /* GET /articulos/categorias — Conteo por categoría para navegación */
    public static function categorias(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $categorias = ArticulosRepository::contarPorCategorias();
            return new WP_REST_Response(['ok' => true, 'data' => $categorias]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosController::categorias', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al cargar categorías'], 500);
        }
    }

    /* GET /articulos/{slug} — Detalle de artículo por slug */
    public static function obtener(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $slug = sanitize_text_field($request->get_param('slug'));
            $userId = get_current_user_id() ?: null;
            $articulo = ArticulosRepository::buscarPorSlug($slug, $userId);

            if (!$articulo) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Artículo no encontrado'], 404);
            }

            /* Solo artículos aprobados son visibles públicamente (autor y admin ven siempre) */
            $esAutor = $userId && (int)$articulo['autor_id'] === $userId;
            $esAdmin = current_user_can('manage_options');

            if ($articulo['moderacion_estado'] !== ArticulosEnums::MODERACION_ESTADO_APROBADO && !$esAutor && !$esAdmin) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Artículo no encontrado'], 404);
            }

            return new WP_REST_Response(['ok' => true, 'data' => self::normalizarArticulo($articulo)]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosController::obtener', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al cargar artículo'], 500);
        }
    }

    /* POST /articulos/{id}/like — Toggle like */
    public static function toggleLike(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $articuloId = (int)$request->get_param('id');

            $articulo = ArticulosRepository::buscarPorId($articuloId);
            if (!$articulo || $articulo['eliminado_en'] !== null) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Artículo no encontrado'], 404);
            }

            $liked = ArticulosLikesRepository::toggleLike($userId, $articuloId);

            return new WP_REST_Response([
                'ok'    => true,
                'liked' => $liked,
                'total' => (int)ArticulosRepository::buscarPorId($articuloId)['total_likes'],
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosController::toggleLike', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al procesar like'], 500);
        }
    }

    /* GET /articulos/mis-articulos — Artículos del usuario autenticado */
    /* GET /articulos/mis-articulos — Artículos del usuario autenticado con filtro opcional de estado */
    public static function misArticulos(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            /* [183A-110-E] Filtro opcional por estado de moderación — whitelist via enum */
            $moderacionEstado = sanitize_text_field($request->get_param('moderacion_estado') ?? '');
            $estadoFiltro = null;
            if (!empty($moderacionEstado) && in_array($moderacionEstado, ArticulosEnums::TODOS_MODERACION_ESTADO, true)) {
                $estadoFiltro = $moderacionEstado;
            }
            $articulos = ArticulosRepository::listarPorAutor($userId, 50, 0, $estadoFiltro);
            return new WP_REST_Response([
                'ok'      => true,
                'data'    => ['articulos' => array_map([self::class, 'normalizarArticulo'], $articulos)],
                'hay_mas' => false,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosController::misArticulos', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al cargar artículos'], 500);
        }
    }

    /* Normalizar datos de artículo para respuesta API — público para reuso en ArticulosEscrituraController */
    public static function normalizarArticulo(array $articulo): array
    {
        $embeds = $articulo['embeds'] ?? '[]';
        if (is_string($embeds)) {
            $embeds = json_decode($embeds, true) ?: [];
        }

        return [
            'id'               => (int)$articulo['id'],
            'autor_id'         => (int)$articulo['autor_id'],
            'autor_username'   => $articulo['autor_username'] ?? null,
            'autor_avatar'     => $articulo['autor_avatar'] ?? null,
            'autor_nombre'     => $articulo['autor_nombre'] ?? null,
            'autor_verificado' => (bool)($articulo['autor_verificado'] ?? false),
            'titulo'           => $articulo['titulo'],
            'slug'             => $articulo['slug'],
            'contenido'        => $articulo['contenido'],
            'extracto'         => $articulo['extracto'] ?? '',
            'portada_url'      => $articulo['portada_url'] ?? null,
            'categoria'        => $articulo['categoria'],
            'embeds'           => $embeds,
            'descarga_publica' => (bool)($articulo['descarga_publica'] ?? false),
            'total_likes'      => (int)($articulo['total_likes'] ?? 0),
            'total_comentarios' => (int)($articulo['total_comentarios'] ?? 0),
            'moderacion_estado' => $articulo['moderacion_estado'] ?? 'pendiente',
            'created_at'       => $articulo['created_at'] ?? null,
            'updated_at'       => $articulo['updated_at'] ?? null,
            'publicado_en'     => $articulo['publicado_en'] ?? null,
            'liked_por_mi'     => (bool)($articulo['liked_por_mi'] ?? false),
        ];
    }
}
