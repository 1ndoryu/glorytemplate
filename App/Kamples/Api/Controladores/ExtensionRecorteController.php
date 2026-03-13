<?php

/**
 * ExtensionRecorteController — QQ130: Extender y generar nuevos recortes.
 *
 * Endpoints admin-only para:
 *   POST /samples/{id}/extender-recorte  — Extiende el recorte existente
 *   POST /samples/{id}/generar-siguiente — Genera sample del segmento siguiente
 *
 * Solo funciona con samples provenientes de extracciones automaticas
 * (tienen relacion_id y youtube_id en cola_extraccion_samples).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\ServicioExtensionRecorte;
use App\Kamples\KamplesLogger;

class ExtensionRecorteController
{
    public static function registrarRutas(string $namespace): void
    {
        /* QQ130: Extender recorte existente */
        \register_rest_route($namespace, '/samples/(?P<id>\d+)/extender-recorte', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'extender'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint'],
            ],
        ]);

        /* QQ130-B: Generar sample del segmento siguiente */
        \register_rest_route($namespace, '/samples/(?P<id>\d+)/generar-siguiente', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'generarSiguiente'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint'],
            ],
        ]);
    }

    /**
     * POST /samples/{id}/extender-recorte
     *
     * Body JSON: { segundosAntes: number, segundosDespues: number }
     */
    public static function extender(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $sampleId = (int) $request->get_param('id');
            $body = $request->get_json_params();

            $segAntes = (float) ($body['segundosAntes'] ?? 0);
            $segDespues = (float) ($body['segundosDespues'] ?? 0);

            /* Validacion basica de entrada */
            if (!\is_numeric($body['segundosAntes'] ?? null) && !\is_numeric($body['segundosDespues'] ?? null)) {
                return new \WP_REST_Response([
                    'ok'      => false,
                    'mensaje' => 'Se requiere al menos segundosAntes o segundosDespues',
                ], 400);
            }

            $resultado = ServicioExtensionRecorte::extender($sampleId, $segAntes, $segDespues);

            $status = $resultado['ok'] ? 200 : 400;
            return new \WP_REST_Response($resultado, $status);
        } catch (\Throwable $e) {
            KamplesLogger::error('ExtensionRecorteController::extender error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response([
                'ok'      => false,
                'mensaje' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * POST /samples/{id}/generar-siguiente
     *
     * Body JSON: { duracion: number }
     */
    public static function generarSiguiente(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $sampleId = (int) $request->get_param('id');
            $body = $request->get_json_params();

            $duracion = (float) ($body['duracion'] ?? 0);

            if ($duracion <= 0) {
                return new \WP_REST_Response([
                    'ok'      => false,
                    'mensaje' => 'Se requiere una duracion en segundos mayor a 0',
                ], 400);
            }

            $resultado = ServicioExtensionRecorte::generarSiguiente($sampleId, $duracion);

            $status = $resultado['ok'] ? 200 : 400;
            return new \WP_REST_Response($resultado, $status);
        } catch (\Throwable $e) {
            KamplesLogger::error('ExtensionRecorteController::generarSiguiente error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response([
                'ok'      => false,
                'mensaje' => 'Error interno del servidor',
            ], 500);
        }
    }
}
