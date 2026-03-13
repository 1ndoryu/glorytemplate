<?php

/**
 * PapeleraController — Vista y restauración de items en papelera.
 *
 * GET    /papelera           — Listar items eliminados del usuario autenticado
 * POST   /papelera/restaurar — Restaurar un item (tipo + id)
 *
 * Solo samples y publicaciones van a papelera (30 días).
 * Comentarios y mensajes se eliminan permanentemente.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Servicios\ServicioPapelera;
use App\Kamples\KamplesLogger;

class PapeleraController
{
    public static function registrarRutas(string $namespace): void
    {
        $auth = [AuthMiddleware::class, 'requerirAuth'];

        \register_rest_route($namespace, '/papelera', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listar'],
            'permission_callback' => $auth,
        ]);

        \register_rest_route($namespace, '/papelera/restaurar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'restaurar'],
            'permission_callback' => $auth,
            'args'                => [
                'tipo' => [
                    'required' => true,
                    'type'     => 'string',
                    'enum'     => [ServicioPapelera::TIPO_SAMPLE, ServicioPapelera::TIPO_PUBLICACION],
                ],
                'id' => [
                    'required' => true,
                    'type'     => 'integer',
                    'minimum'  => 1,
                ],
            ],
        ]);
    }

    /* GET /papelera — devuelve lista unificada de samples y publicaciones eliminados */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $items = ServicioPapelera::listar($userId);

            return new \WP_REST_Response(['ok' => true, 'data' => $items], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PapeleraController::listar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* POST /papelera/restaurar — restaura un item de la papelera */
    public static function restaurar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $limitResp = RateLimiter::verificarUsuario($userId, 'restaurar_papelera', 30, 60);
            if ($limitResp) return $limitResp;

            $tipo = $request->get_param('tipo');
            $id   = (int) $request->get_param('id');

            if ($tipo === ServicioPapelera::TIPO_SAMPLE) {
                $ok = ServicioPapelera::restaurarSample($id, $userId);
            } elseif ($tipo === ServicioPapelera::TIPO_PUBLICACION) {
                $ok = ServicioPapelera::restaurarPublicacion($id, $userId);
            } else {
                return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
            }

            if (!$ok) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Item no encontrado en papelera o no te pertenece'], 404);
            }

            KamplesLogger::info('Item restaurado de papelera', ['tipo' => $tipo, 'id' => $id]);

            return new \WP_REST_Response(['ok' => true, 'restaurado' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PapeleraController::restaurar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
