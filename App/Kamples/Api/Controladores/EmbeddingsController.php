<?php

/**
 * EmbeddingsController — Gestion de embeddings y planificador del algoritmo.
 *
 * Endpoints admin-only para generar/regenerar embeddings de samples,
 * y para controlar el planificador de recalculo del algoritmo (C45).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\GeneradorEmbeddings;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Database\Repositories\SamplesRepository;

class EmbeddingsController
{
    public static function registrarRutas(string $ns): void
    {
        /* POST /admin/embeddings/generar — genera embeddings faltantes (batch) */
        register_rest_route($ns, '/admin/embeddings/generar', [
            'methods'  => 'POST',
            'callback' => [self::class, 'generarBatch'],
            'permission_callback' => fn() => UsuarioHelper::esAdmin(),
        ]);

        /* POST /admin/embeddings/regenerar — regenera todos los embeddings */
        register_rest_route($ns, '/admin/embeddings/regenerar', [
            'methods'  => 'POST',
            'callback' => [self::class, 'regenerarTodos'],
            'permission_callback' => fn() => UsuarioHelper::esAdmin(),
        ]);

        /* GET /admin/embeddings/estado — estado actual de los embeddings */
        register_rest_route($ns, '/admin/embeddings/estado', [
            'methods'  => 'GET',
            'callback' => [self::class, 'estado'],
            'permission_callback' => fn() => UsuarioHelper::esAdmin(),
        ]);

        /* GET /admin/algoritmo/estado — estado del planificador de recalculo (C45) */
        register_rest_route($ns, '/admin/algoritmo/estado', [
            'methods'  => 'GET',
            'callback' => [self::class, 'estadoAlgoritmo'],
            'permission_callback' => fn() => UsuarioHelper::esAdmin(),
        ]);

        /* POST /admin/algoritmo/recalcular — forzar recalculo global (C45) */
        register_rest_route($ns, '/admin/algoritmo/recalcular', [
            'methods'  => 'POST',
            'callback' => [self::class, 'forzarRecalculo'],
            'permission_callback' => fn() => UsuarioHelper::esAdmin(),
        ]);

        /* POST /admin/algoritmo/procesar-temporales — ejecutar recalculos por tiempo (C45) */
        register_rest_route($ns, '/admin/algoritmo/procesar-temporales', [
            'methods'  => 'POST',
            'callback' => [self::class, 'procesarTemporales'],
            'permission_callback' => fn() => UsuarioHelper::esAdmin(),
        ]);
    }

    /**
     * Genera embeddings para samples que no tienen uno.
     * Útil para ejecución inicial o después de importar datos.
     */
    public static function generarBatch(\WP_REST_Request $req): \WP_REST_Response
    {
        try {
            $inicio = microtime(true);
            $actualizados = GeneradorEmbeddings::generarTodos();
            $tiempo = round((microtime(true) - $inicio) * 1000);

            return new \WP_REST_Response([
                'ok' => true,
                'actualizados' => $actualizados,
                'tiempoMs' => $tiempo,
                'mensaje' => "Se generaron {$actualizados} embeddings en {$tiempo}ms",
            ]);
        } catch (\Throwable $e) {
            error_log('[EmbeddingsController::generarBatch] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al generar embeddings'], 500);
        }
    }

    /**
     * Regenera TODOS los embeddings (borra y recalcula).
     * Útil cuando cambia la lógica de generación.
     */
    public static function regenerarTodos(\WP_REST_Request $req): \WP_REST_Response
    {
        try {
            $inicio = microtime(true);

            /* Borrar todos los embeddings existentes */
            SamplesRepository::limpiarEmbeddings();

            /* Regenerar todos */
            $actualizados = GeneradorEmbeddings::generarTodos();
            $tiempo = round((microtime(true) - $inicio) * 1000);

            return new \WP_REST_Response([
                'ok' => true,
                'actualizados' => $actualizados,
                'tiempoMs' => $tiempo,
                'mensaje' => "Se regeneraron {$actualizados} embeddings en {$tiempo}ms",
            ]);
        } catch (\Throwable $e) {
            error_log('[EmbeddingsController::regenerarTodos] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al regenerar embeddings'], 500);
        }
    }

    /**
     * Retorna estadísticas del estado de embeddings.
     */
    public static function estado(\WP_REST_Request $req): \WP_REST_Response
    {
        try {
            $stats = SamplesRepository::estadisticasEmbeddings();

            return new \WP_REST_Response([
                'ok' => true,
                'totalSamples' => (int) ($stats['total_samples'] ?? 0),
                'conEmbedding' => (int) ($stats['con_embedding'] ?? 0),
                'sinEmbedding' => (int) ($stats['sin_embedding'] ?? 0),
                'porcentaje' => (float) ($stats['porcentaje'] ?? 0),
                'pgvectorActivo' => true,
            ]);
        } catch (\Throwable $e) {
            error_log('[EmbeddingsController::estado] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al obtener estado'], 500);
        }
    }

    /**
     * Estado del planificador del algoritmo para el usuario autenticado (C45).
     */
    public static function estadoAlgoritmo(\WP_REST_Request $req): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $estado = PlanificadorAlgoritmo::obtenerEstado($userId);

            /* Cargar config de frecuencia para mostrarla junto al estado */
            $ruta = dirname(__DIR__, 2) . '/Config/algoritmoPesos.php';
            $config = file_exists($ruta) ? require $ruta : [];
            $frecuencia = $config['frecuencia'] ?? [];

            return new \WP_REST_Response([
                'ok' => true,
                'estado' => $estado,
                'configuracion' => $frecuencia,
            ]);
        } catch (\Throwable $e) {
            error_log('[EmbeddingsController::estadoAlgoritmo] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al obtener estado del algoritmo'], 500);
        }
    }

    /**
     * Forzar recalculo global de todos los usuarios (C45).
     */
    public static function forzarRecalculo(\WP_REST_Request $req): \WP_REST_Response
    {
        try {
            $inicio = microtime(true);
            $procesados = PlanificadorAlgoritmo::forzarRecalculoGlobal();
            $tiempo = round((microtime(true) - $inicio) * 1000);

            return new \WP_REST_Response([
                'ok' => true,
                'usuariosProcesados' => $procesados,
                'tiempoMs' => $tiempo,
            ]);
        } catch (\Throwable $e) {
            error_log('[EmbeddingsController::forzarRecalculo] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al forzar recalculo'], 500);
        }
    }

    /**
     * Procesar recalculos temporales pendientes (C45).
     * Pensado para invocarse desde un cron o manualmente.
     */
    public static function procesarTemporales(\WP_REST_Request $req): \WP_REST_Response
    {
        try {
            $inicio = microtime(true);
            $resultado = PlanificadorAlgoritmo::procesarTemporales();
            $tiempo = round((microtime(true) - $inicio) * 1000);

            return new \WP_REST_Response([
                'ok' => true,
                'rapidos' => $resultado['rapidos'],
                'precisos' => $resultado['precisos'],
                'tiempoMs' => $tiempo,
            ]);
        } catch (\Throwable $e) {
            error_log('[EmbeddingsController::procesarTemporales] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al procesar temporales'], 500);
        }
    }
}
