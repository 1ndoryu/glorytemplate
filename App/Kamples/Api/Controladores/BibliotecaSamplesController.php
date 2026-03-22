<?php

/**
 * BibliotecaSamplesController — Librería personal del usuario.
 *
 * Extraído de SamplesController (A04 SOLID split).
 *
 * Endpoints:
 *   GET /me/favoritos              — Samples likeados
 *   GET /me/descargas              — Samples descargados
 *   GET /me/coleccionados          — UNION descargas + subidos (C281)
 *   GET /me/coleccionados/carpetas — Carpetas con conteos (C281)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\OrdenamientoHelper;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Database\Repositories\DescargasRepository;
use App\Config\Schema\_generated\LikesEnums;
use App\Kamples\KamplesLogger;

class BibliotecaSamplesController
{
    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/me/favoritos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'favoritos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
                'orden'    => ['required' => false, 'type' => 'string', 'default' => 'recientes'],
                'busqueda' => ['required' => false, 'type' => 'string', 'default' => ''],
                'solo_encanta' => ['required' => false, 'type' => 'boolean', 'default' => false],
                'solo_like' => ['required' => false, 'type' => 'boolean', 'default' => false],
            ],
        ]);

        \register_rest_route($namespace, '/me/descargas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misDescargas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
                'orden'    => ['required' => false, 'type' => 'string', 'default' => 'recientes'],
            ],
        ]);

        /* C281: Explorador */
        \register_rest_route($namespace, '/me/coleccionados', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'coleccionados'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'carpeta'  => ['required' => false, 'type' => 'string', 'default' => ''],
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 100],
                'orden'    => ['required' => false, 'type' => 'string', 'default' => 'recientes'],
                'busqueda' => ['required' => false, 'type' => 'string', 'default' => ''],
                'solo_encanta' => ['required' => false, 'type' => 'boolean', 'default' => false],
                'solo_like' => ['required' => false, 'type' => 'boolean', 'default' => false],
            ],
        ]);

        \register_rest_route($namespace, '/me/coleccionados/carpetas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'carpetasColeccionados'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C338: Mover sample a otra carpeta (explorador file-manager) */
        \register_rest_route($namespace, '/me/coleccionados/(?P<id>\\d+)/carpeta', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'moverSampleACarpeta'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'id'                  => ['required' => true, 'type' => 'integer'],
                'carpeta_primaria'    => ['required' => true, 'type' => 'string'],
                'carpeta_secundaria'  => ['required' => false, 'type' => 'string', 'default' => ''],
            ],
        ]);
    }

    /**
     * GET /me/favoritos — Samples que el usuario ha dado like.
     */
    public static function favoritos(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;
        $orden   = OrdenamientoHelper::sanitizar((string) $request->get_param('orden'));
        $busqueda = \trim((string) $request->get_param('busqueda'));

        $soloEncanta = (bool) $request->get_param('solo_encanta');
        $soloLike = !$soloEncanta && (bool) $request->get_param('solo_like');
        /* [223A-5] filtroReaccion unifica ambos filtros para pasarlos al repo */
        $filtroReaccion = $soloEncanta ? LikesEnums::REACCION_ENCANTA : ($soloLike ? LikesEnums::REACCION_LIKE : null);

        $rows = SamplesRepository::favoritosDeUsuario($userId, $perPage, $offset, $orden, $busqueda, $filtroReaccion);

        $samples = NormalizadorSample::normalizarLista($rows);

        $total = LikesRepository::contarFavoritosSamples($userId, $busqueda, $filtroReaccion);

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => $total,
                    'pages'    => \max(1, (int) \ceil($total / $perPage)),
                ],
            ],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en BibliotecaSamplesController::favoritos', [
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
     * GET /me/descargas — Samples que el usuario ha descargado.
     */
    public static function misDescargas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;
        $orden   = OrdenamientoHelper::sanitizar((string) $request->get_param('orden'));

        $rows = SamplesRepository::descargadosDeUsuario($userId, $perPage, $offset, $orden);

        $samples = NormalizadorSample::normalizarLista($rows);

        $total = DescargasRepository::contarSamplesDescargados($userId);

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => $total,
                    'pages'    => \max(1, (int) \ceil($total / $perPage)),
                ],
            ],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en BibliotecaSamplesController::misDescargas', [
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
     * GET /me/coleccionados — UNION de descargas + samples propios.
     * C281: Soporta filtro por carpeta_primaria (metadata JSONB).
     */
    public static function coleccionados(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = \max(1, (int) $request->get_param('page'));
        $perPage = \min(200, \max(1, (int) $request->get_param('per_page')));
        $offset  = ($page - 1) * $perPage;
        $carpeta = \trim((string) $request->get_param('carpeta'));
        $orden   = OrdenamientoHelper::sanitizar((string) $request->get_param('orden'));
        $busqueda = \trim((string) $request->get_param('busqueda'));

        $soloEncanta = (bool) $request->get_param('solo_encanta');
        $soloLike = !$soloEncanta && (bool) $request->get_param('solo_like');
        $filtroReaccion = $soloEncanta ? LikesEnums::REACCION_ENCANTA : ($soloLike ? LikesEnums::REACCION_LIKE : null);

        $rows = SamplesRepository::coleccionadosDeUsuario($userId, $perPage, $offset, $carpeta, $orden, $busqueda, $filtroReaccion);
        $samples = NormalizadorSample::normalizarLista($rows);

        $total = SamplesRepository::contarColeccionados($userId, $carpeta, $busqueda, $filtroReaccion);

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => $total,
                    'pages'    => \max(1, (int) \ceil($total / $perPage)),
                ],
            ],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en BibliotecaSamplesController::coleccionados', [
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
     * GET /me/coleccionados/carpetas — Estructura de carpetas con conteos.
     */
    public static function carpetasColeccionados(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $rows = SamplesRepository::carpetasColeccionados($userId);

        /* Construir árbol jerárquico */
        $arbol = [];
        $indice = [];
        foreach ($rows as $row) {
            $pri = $row['primaria'] ?? SamplesRepository::CARPETA_DEFAULT;
            $sec = $row['secundaria'] ?? null;
            $cnt = (int) ($row['total'] ?? 0);

            if (!isset($indice[$pri])) {
                $indice[$pri] = \count($arbol);
                $arbol[] = ['primaria' => $pri, 'total' => 0, 'subcarpetas' => []];
            }

            $arbol[$indice[$pri]]['total'] += $cnt;

            if ($sec) {
                $arbol[$indice[$pri]]['subcarpetas'][] = ['nombre' => $sec, 'total' => $cnt];
            }
        }

        return new \WP_REST_Response(['data' => $arbol], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en BibliotecaSamplesController::carpetasColeccionados', [
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
     * PUT /me/coleccionados/{id}/carpeta — Mover sample a otra carpeta.
     * C338: Explorador como file-manager real (crear carpetas, mover audios).
     */
    public static function moverSampleACarpeta(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $sampleId = (int) $request->get_param('id');
            $primaria = \trim((string) $request->get_param('carpeta_primaria'));
            $secundaria = \trim((string) $request->get_param('carpeta_secundaria'));

            /* Validar que el nombre de carpeta no sea vacío ni peligroso */
            if (empty($primaria) || \mb_strlen($primaria) > 100) {
                return new \WP_REST_Response([
                    'code'    => 'carpeta_invalida',
                    'message' => 'El nombre de carpeta primaria es inválido.',
                ], 400);
            }

            if (\mb_strlen($secundaria) > 100) {
                return new \WP_REST_Response([
                    'code'    => 'carpeta_invalida',
                    'message' => 'El nombre de subcarpeta es inválido.',
                ], 400);
            }

            /* Verificar que el sample pertenece al usuario (coleccionado) */
            if (!SamplesRepository::esColeccionadoPorUsuario($sampleId, $userId)) {
                return new \WP_REST_Response([
                    'code'    => 'no_autorizado',
                    'message' => 'No tienes acceso a este sample.',
                ], 403);
            }

            $movido = SamplesRepository::moverACarpeta($sampleId, $primaria, $secundaria);

            if (!$movido) {
                return new \WP_REST_Response([
                    'code'    => 'error_mover',
                    'message' => 'No se pudo mover el sample.',
                ], 500);
            }

            return new \WP_REST_Response([
                'data' => [
                    'movido'            => true,
                    'sampleId'          => $sampleId,
                    'carpetaPrimaria'   => $primaria,
                    'carpetaSecundaria' => $secundaria,
                ],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en BibliotecaSamplesController::moverSampleACarpeta', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }
}
