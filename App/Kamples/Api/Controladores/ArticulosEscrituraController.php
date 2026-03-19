<?php

/* [183A-109] ArticulosEscrituraController — CRUD de artículos (crear, actualizar, eliminar).
 * Separado de ArticulosController (lectura) por SRP y límite de líneas. */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ArticulosRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Config\Schema\_generated\ArticulosCols;
use App\Config\Schema\_generated\ArticulosEnums;
use App\Kamples\KamplesLogger;
use WP_REST_Request;
use WP_REST_Response;

class ArticulosEscrituraController
{
    /* POST /articulos — Crear artículo */
    public static function crear(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            if (!$userId) {
                return new WP_REST_Response(['ok' => false, 'error' => 'No autenticado'], 401);
            }

            if (!RateLimiter::verificarUsuario($userId, 'crear_articulo', 5, 3600)) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Demasiados artículos. Intenta más tarde.'], 429);
            }

            $titulo = sanitize_text_field(trim($request->get_param('titulo') ?? ''));
            $contenido = wp_kses_post(trim($request->get_param('contenido') ?? ''));
            $extracto = sanitize_text_field(trim($request->get_param('extracto') ?? ''));
            $categoria = sanitize_text_field($request->get_param('categoria') ?? 'inspiracion');
            $portadaUrl = esc_url_raw($request->get_param('portada_url') ?? '');
            $embeds = $request->get_param('embeds') ?? '[]';
            $descargaPublica = (bool)($request->get_param('descarga_publica') ?? false);

            if (empty($titulo) || mb_strlen($titulo) < 5) {
                return new WP_REST_Response(['ok' => false, 'error' => 'El título debe tener al menos 5 caracteres'], 400);
            }
            if (mb_strlen($titulo) > 300) {
                return new WP_REST_Response(['ok' => false, 'error' => 'El título no puede superar 300 caracteres'], 400);
            }
            if (empty($contenido) || mb_strlen($contenido) < 50) {
                return new WP_REST_Response(['ok' => false, 'error' => 'El contenido debe tener al menos 50 caracteres'], 400);
            }
            if (!in_array($categoria, ArticulosEnums::TODOS_CATEGORIA, true)) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Categoría no válida'], 400);
            }

            $embedsSanitizados = self::sanitizarEmbeds($embeds);
            if ($embedsSanitizados === null) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Formato de embeds inválido'], 400);
            }

            $esAdmin = current_user_can('manage_options');
            $moderacion = $esAdmin ? ArticulosEnums::MODERACION_ESTADO_APROBADO : ArticulosEnums::MODERACION_ESTADO_PENDIENTE;

            $id = ArticulosRepository::crearArticulo(
                $userId, $titulo, $contenido, $extracto, $categoria,
                !empty($portadaUrl) ? $portadaUrl : null,
                json_encode($embedsSanitizados), $descargaPublica, $moderacion
            );

            if (!$id) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Error al crear artículo'], 500);
            }

            $articulo = ArticulosRepository::buscarPorId($id);

            return new WP_REST_Response([
                'ok'   => true,
                'data' => $articulo ? ArticulosController::normalizarArticulo($articulo) : ['id' => $id],
                'moderacion' => $moderacion,
            ], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosEscrituraController::crear', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al crear artículo'], 500);
        }
    }

    /* PUT /articulos/{id} — Actualizar artículo (solo autor o admin) */
    public static function actualizar(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $articuloId = (int)$request->get_param('id');

            $articulo = ArticulosRepository::buscarPorId($articuloId);
            if (!$articulo || $articulo['eliminado_en'] !== null) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Artículo no encontrado'], 404);
            }

            $esAutor = (int)$articulo['autor_id'] === $userId;
            $esAdmin = current_user_can('manage_options');
            if (!$esAutor && !$esAdmin) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Sin permisos'], 403);
            }

            $campos = [];
            $params = $request->get_json_params();

            if (isset($params['titulo'])) {
                $titulo = sanitize_text_field(trim($params['titulo']));
                if (mb_strlen($titulo) >= 5 && mb_strlen($titulo) <= 300) {
                    $campos[ArticulosCols::TITULO] = $titulo;
                }
            }
            if (isset($params['contenido'])) {
                $contenido = wp_kses_post(trim($params['contenido']));
                if (mb_strlen($contenido) >= 50) {
                    $campos[ArticulosCols::CONTENIDO] = $contenido;
                }
            }
            if (isset($params['extracto'])) {
                $campos[ArticulosCols::EXTRACTO] = sanitize_text_field(trim($params['extracto']));
            }
            if (isset($params['categoria']) && in_array($params['categoria'], ArticulosEnums::TODOS_CATEGORIA, true)) {
                $campos[ArticulosCols::CATEGORIA] = $params['categoria'];
            }
            if (isset($params['portada_url'])) {
                $campos[ArticulosCols::PORTADA_URL] = esc_url_raw($params['portada_url']);
            }
            if (isset($params['embeds'])) {
                $sanitized = self::sanitizarEmbeds($params['embeds']);
                if ($sanitized !== null) {
                    $campos[ArticulosCols::EMBEDS] = json_encode($sanitized);
                }
            }
            if (isset($params['descarga_publica'])) {
                $campos[ArticulosCols::DESCARGA_PUBLICA] = (bool)$params['descarga_publica'] ? 'true' : 'false';
            }

            if (empty($campos)) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Sin cambios válidos'], 400);
            }

            ArticulosRepository::actualizarArticulo($articuloId, $campos);
            return new WP_REST_Response(['ok' => true]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosEscrituraController::actualizar', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al actualizar artículo'], 500);
        }
    }

    /* DELETE /articulos/{id} — Soft-delete (solo autor o admin) */
    public static function eliminar(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $articuloId = (int)$request->get_param('id');

            $articulo = ArticulosRepository::buscarPorId($articuloId);
            if (!$articulo || $articulo['eliminado_en'] !== null) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Artículo no encontrado'], 404);
            }

            $esAutor = (int)$articulo['autor_id'] === $userId;
            $esAdmin = current_user_can('manage_options');
            if (!$esAutor && !$esAdmin) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Sin permisos'], 403);
            }

            ArticulosRepository::eliminar($articuloId);
            return new WP_REST_Response(['ok' => true]);
        } catch (\Throwable $e) {
            KamplesLogger::error('ArticulosEscrituraController::eliminar', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['ok' => false, 'error' => 'Error al eliminar artículo'], 500);
        }
    }

    /* Sanitizar array de embeds (samples/colecciones adjuntos) */
    private static function sanitizarEmbeds(mixed $embeds): ?array
    {
        if (is_string($embeds)) {
            $parsed = json_decode($embeds, true);
            if (json_last_error() !== JSON_ERROR_NONE) return null;
        } elseif (is_array($embeds)) {
            $parsed = $embeds;
        } else {
            return [];
        }

        $sanitizados = [];
        foreach ($parsed as $embed) {
            if (!is_array($embed) || !isset($embed['tipo'], $embed['id'])) continue;
            $tipo = sanitize_text_field($embed['tipo']);
            if (!in_array($tipo, ['sample', 'coleccion'], true)) continue;
            $sanitizados[] = ['tipo' => $tipo, 'id' => (int)$embed['id']];
        }
        return $sanitizados;
    }
}
