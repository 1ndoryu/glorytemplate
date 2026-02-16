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
        $inicio = microtime(true);
        $actualizados = GeneradorEmbeddings::generarTodos();
        $tiempo = round((microtime(true) - $inicio) * 1000);

        return new \WP_REST_Response([
            'ok' => true,
            'actualizados' => $actualizados,
            'tiempoMs' => $tiempo,
            'mensaje' => "Se generaron {$actualizados} embeddings en {$tiempo}ms",
        ]);
    }

    /**
     * Regenera TODOS los embeddings (borra y recalcula).
     * Útil cuando cambia la lógica de generación.
     */
    public static function regenerarTodos(\WP_REST_Request $req): \WP_REST_Response
    {
        $inicio = microtime(true);

        /* Borrar todos los embeddings existentes */
        \App\Kamples\Database\PostgresService::ejecutar(
            "UPDATE samples SET embedding = NULL WHERE embedding IS NOT NULL"
        );

        /* Regenerar todos */
        $actualizados = GeneradorEmbeddings::generarTodos();
        $tiempo = round((microtime(true) - $inicio) * 1000);

        return new \WP_REST_Response([
            'ok' => true,
            'actualizados' => $actualizados,
            'tiempoMs' => $tiempo,
            'mensaje' => "Se regeneraron {$actualizados} embeddings en {$tiempo}ms",
        ]);
    }

    /**
     * Retorna estadísticas del estado de embeddings.
     */
    public static function estado(\WP_REST_Request $req): \WP_REST_Response
    {
        $stats = \App\Kamples\Database\PostgresService::consultarUno(
            "SELECT
                COUNT(*) as total_samples,
                COUNT(embedding) as con_embedding,
                COUNT(*) - COUNT(embedding) as sin_embedding,
                CASE WHEN COUNT(*) > 0
                    THEN ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 1)
                    ELSE 0
                END as porcentaje
             FROM samples WHERE estado = 'activo'"
        );

        return new \WP_REST_Response([
            'ok' => true,
            'totalSamples' => (int) ($stats['total_samples'] ?? 0),
            'conEmbedding' => (int) ($stats['con_embedding'] ?? 0),
            'sinEmbedding' => (int) ($stats['sin_embedding'] ?? 0),
            'porcentaje' => (float) ($stats['porcentaje'] ?? 0),
            'pgvectorActivo' => true,
        ]);
    }

    /**
     * Estado del planificador del algoritmo para el usuario autenticado (C45).
     */
    public static function estadoAlgoritmo(\WP_REST_Request $req): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

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
    }

    /**
     * Forzar recalculo global de todos los usuarios (C45).
     */
    public static function forzarRecalculo(\WP_REST_Request $req): \WP_REST_Response
    {
        $inicio = microtime(true);
        $procesados = PlanificadorAlgoritmo::forzarRecalculoGlobal();
        $tiempo = round((microtime(true) - $inicio) * 1000);

        return new \WP_REST_Response([
            'ok' => true,
            'usuariosProcesados' => $procesados,
            'tiempoMs' => $tiempo,
        ]);
    }

    /**
     * Procesar recalculos temporales pendientes (C45).
     * Pensado para invocarse desde un cron o manualmente.
     */
    public static function procesarTemporales(\WP_REST_Request $req): \WP_REST_Response
    {
        $inicio = microtime(true);
        $resultado = PlanificadorAlgoritmo::procesarTemporales();
        $tiempo = round((microtime(true) - $inicio) * 1000);

        return new \WP_REST_Response([
            'ok' => true,
            'rapidos' => $resultado['rapidos'],
            'precisos' => $resultado['precisos'],
            'tiempoMs' => $tiempo,
        ]);
    }
}
