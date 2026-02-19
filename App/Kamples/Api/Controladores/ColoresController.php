<?php

/**
 * ColoresController — Lista dinámica de imágenes colors/.
 *
 * Aislado para cumplir SRP. Lee el directorio y cachea con WP transient.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\KamplesLogger;

class ColoresController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/colors', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listar'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function listar(): \WP_REST_Response
    {
        try {
        $cacheKey = 'kamples_colors_list';
        $cached = get_transient($cacheKey);

        if ($cached !== false) {
            return new \WP_REST_Response([
                'ok' => true, 'imagenes' => $cached, 'total' => count($cached), 'cache' => true,
            ], 200);
        }

        $directorio = get_template_directory() . '/colors/';
        $imagenes = [];

        if (is_dir($directorio)) {
            $extensiones = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            $archivos = scandir($directorio);

            foreach ($archivos as $archivo) {
                if ($archivo === '.' || $archivo === '..') continue;
                $ext = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));
                if (in_array($ext, $extensiones, true)) {
                    $imagenes[] = $archivo;
                }
            }
            sort($imagenes);
        }

        set_transient($cacheKey, $imagenes, DAY_IN_SECONDS);

        return new \WP_REST_Response([
            'ok' => true, 'imagenes' => $imagenes, 'total' => count($imagenes), 'cache' => false,
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en ColoresController::listar', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }
}
