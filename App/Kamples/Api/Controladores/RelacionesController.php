<?php

/**
 * RelacionesController — API REST para Relaciones de Sampleo.
 *
 * Extraído de CancionesController (SOLID split — limite 300 lineas).
 *
 * Endpoints:
 *   GET  /sample-discovery/relacion/{id}            — Relacion vinculada a un sample
 *   GET  /relaciones/{id}                           — Detalle completo de relacion
 *   GET  /relaciones/{id}/samples                   — Samples publicados de una relacion
 *   POST /relaciones/{id}/vincular-sample            — Vincular sample existente
 *   DELETE /relaciones/{id}/sample/{lado}            — Desvincular sample
 *   PUT  /relaciones/{id}/verificar                 — Verificar/desverificar (admin)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorCancion;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\KamplesLogger;

class RelacionesController
{
    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/sample-discovery/relacion/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'relacionPorSampleId'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
            ],
        ]);

        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalleRelacion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
            ],
        ]);

        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'samplesDeRelacion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
            ],
        ]);

        $auth = [AuthMiddleware::class, 'requerirAuth'];

        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)/vincular-sample', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'vincularSample'],
            'permission_callback' => $auth,
            'args'                => [
                'id'        => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
                'sample_id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                'lado'      => [
                    'required'          => true,
                    'type'              => 'string',
                    'validate_callback' => static fn($v) => \in_array($v, ColaExtraccionSamplesEnums::TODOS_LADO, true),
                ],
            ],
        ]);

        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)/sample/(?P<lado>fuente|destino)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'desvincularSample'],
            'permission_callback' => $auth,
            'args'                => [
                'id'   => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
                'lado' => ['required' => true, 'type' => 'string', 'validate_callback' => static fn($v) => \in_array($v, ColaExtraccionSamplesEnums::TODOS_LADO, true)],
            ],
        ]);

        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)/verificar', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'verificarRelacion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
            'args'                => [
                'id'         => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
                'verificada' => ['required' => true, 'type' => 'boolean'],
            ],
        ]);

        \register_rest_route($namespace, '/sample-discovery/estadisticas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estadisticas'],
            'permission_callback' => '__return_true',
        ]);

        \register_rest_route($namespace, '/canciones/(?P<slug>[a-zA-Z0-9_-]+)/cadena', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'cadena'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug'        => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'profundidad' => ['type' => 'integer', 'default' => 5, 'minimum' => 1, 'maximum' => 10],
            ],
        ]);

        \register_rest_route($namespace, '/canciones/(?P<slug>[a-zA-Z0-9_-]+)/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'samplesDeCancion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug'  => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'limit' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50],
            ],
        ]);
    }

    /**
     * GET /sample-discovery/relacion/{id} — Relacion vinculada a un sample de Kamples.
     */
    public static function relacionPorSampleId(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $sampleId = (int) $request->get_param('id');
            $relacion = RelacionesSampleRepository::porSampleId($sampleId);

            if (!$relacion) {
                return new \WP_REST_Response(['ok' => true, 'data' => null]);
            }

            $data = NormalizadorCancion::relacionCompleta($relacion);

            $esFuente  = ((int) ($relacion['sample_fuente_id'] ?? 0)) === $sampleId;
            $esDestino = ((int) ($relacion['sample_destino_id'] ?? 0)) === $sampleId;
            $data['ladoExtraccion'] = $esFuente ? ColaExtraccionSamplesEnums::LADO_FUENTE : ($esDestino ? ColaExtraccionSamplesEnums::LADO_DESTINO : null);

            $destinoId = (int) $relacion['cancion_destino_id'];
            $fuenteId  = (int) $relacion['cancion_fuente_id'];
            $relacionId = (int) $relacion['id'];

            $filtrar = fn(array $rels) => array_values(array_filter(
                $rels,
                fn($r) => (int) $r['id'] !== $relacionId
            ));

            $data['destinoSamplesDe']   = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::samplesDe($destinoId, 20)));
            $data['destinoSampleadaEn'] = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::sampleadaEn($destinoId, 20)));
            $data['fuenteSamplesDe']    = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::samplesDe($fuenteId, 20)));
            $data['fuenteSampleadaEn']  = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::sampleadaEn($fuenteId, 20)));

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            \error_log('[RelacionesController::relacionPorSampleId] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /relaciones/{id} — Detalle completo de una relacion de sampleo.
     */
    public static function detalleRelacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $relacion = RelacionesSampleRepository::porRelacionId($id);

            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relación no encontrada'], 404);
            }

            $destinoId = (int) $relacion['cancion_destino_id'];
            $fuenteId  = (int) $relacion['cancion_fuente_id'];

            $destinoSamplesDe   = RelacionesSampleRepository::samplesDe($destinoId, 20);
            $destinoSampleadaEn = RelacionesSampleRepository::sampleadaEn($destinoId, 20);
            $fuenteSamplesDe    = RelacionesSampleRepository::samplesDe($fuenteId, 20);
            $fuenteSampleadaEn  = RelacionesSampleRepository::sampleadaEn($fuenteId, 20);

            $filtrar = fn(array $rels) => array_values(array_filter(
                $rels,
                fn($r) => (int) $r['id'] !== $id
            ));

            $data = NormalizadorCancion::relacionCompleta($relacion);
            $data['destinoSamplesDe']   = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($destinoSamplesDe));
            $data['destinoSampleadaEn'] = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($destinoSampleadaEn));
            $data['fuenteSamplesDe']    = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($fuenteSamplesDe));
            $data['fuenteSampleadaEn']  = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($fuenteSampleadaEn));

            $data['liked']    = false;
            $data['reaccion'] = null;

            $userId = UsuarioHelper::obtenerIdPg();
            if ($userId) {
                $reaccionUsuario = LikesRepository::obtenerReaccionUsuario($userId, LikesEnums::TIPO_RELACION, $id);
                if ($reaccionUsuario) {
                    $data['liked']    = true;
                    $data['reaccion'] = $reaccionUsuario;
                }
            }

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            \error_log('[RelacionesController::detalleRelacion] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /relaciones/{id}/samples — Samples publicados de una relacion.
     */
    public static function samplesDeRelacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $relacionId = (int) $request->get_param('id');
            $userId     = UsuarioHelper::obtenerIdPg();
            $filas      = SamplesRepository::buscarPorRelacionId($relacionId, $userId);
            $normalizados = NormalizadorSample::normalizarLista($filas);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $normalizados,
            ]);
        } catch (\Throwable $e) {
            \error_log('[RelacionesController::samplesDeRelacion] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /relaciones/{id}/vincular-sample — Vincular sample existente a relacion.
     */
    public static function vincularSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $relacionId = (int) $request['id'];
            $sampleId   = (int) $request->get_param('sample_id');
            $lado       = (string) $request->get_param('lado');

            $relacion = RelacionesSampleRepository::buscarPorId($relacionId);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relación no encontrada'], 404);
            }

            $sample = SamplesRepository::buscarPorId($sampleId);
            if (!$sample) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Sample no encontrado'], 404);
            }
            $creadorId = $sample[SamplesCols::CREADOR_ID] ?? null;
            if ((int) $creadorId !== $userId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Solo puedes vincular tus propios samples'], 403);
            }
            $estado = $sample[SamplesCols::ESTADO] ?? null;
            if ($estado !== SamplesEnums::ESTADO_ACTIVO) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'El sample no está disponible'], 400);
            }

            $colVinculo = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
                ? RelacionesSampleCols::SAMPLE_FUENTE_ID
                : RelacionesSampleCols::SAMPLE_DESTINO_ID;
            $sampleExistente = $relacion[$colVinculo] ?? null;
            if ($sampleExistente !== null) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Ya existe un sample vinculado en ese lado'], 409);
            }

            RelacionesSampleRepository::actualizarPorId($relacionId, [
                $colVinculo => $sampleId,
            ]);

            SamplesRepository::agregarMetadata($sampleId, [
                'relacion_id'      => $relacionId,
                'lado_extraccion'  => $lado,
                'adjuncion_manual' => true,
            ]);

            KamplesLogger::info('Sample vinculado a relación', [
                'sampleId' => $sampleId, 'relacionId' => $relacionId, 'lado' => $lado, 'userId' => $userId,
            ]);

            return new \WP_REST_Response(['ok' => true]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error al vincular sample a relación', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * DELETE /relaciones/{id}/sample/{lado} — Desvincular sample de relacion.
     */
    public static function desvincularSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $relacionId = (int) $request['id'];
            $lado       = (string) $request['lado'];

            $relacion = RelacionesSampleRepository::buscarPorId($relacionId);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relación no encontrada'], 404);
            }

            $colVinculo = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
                ? RelacionesSampleCols::SAMPLE_FUENTE_ID
                : RelacionesSampleCols::SAMPLE_DESTINO_ID;
            $sampleIdVinculado = $relacion[$colVinculo] ?? null;
            if ($sampleIdVinculado === null) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No hay sample vinculado en ese lado'], 400);
            }
            $sampleIdVinculado = (int) $sampleIdVinculado;

            $sample = SamplesRepository::buscarPorId($sampleIdVinculado);
            $creadorId = $sample ? (int) ($sample[SamplesCols::CREADOR_ID] ?? 0) : 0;
            if ($creadorId !== $userId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Solo el creador del sample puede desvincularlo'], 403);
            }

            $colTimings = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
                ? RelacionesSampleCols::TIMINGS_FUENTE
                : RelacionesSampleCols::TIMINGS_DESTINO;

            RelacionesSampleRepository::actualizarPorId($relacionId, [
                $colVinculo => null,
                $colTimings => null,
            ]);

            KamplesLogger::info('Sample desvinculado de relación', [
                'sampleId' => $sampleIdVinculado, 'relacionId' => $relacionId, 'lado' => $lado, 'userId' => $userId,
            ]);

            return new \WP_REST_Response(['ok' => true]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error al desvincular sample de relación', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * PUT /relaciones/{id}/verificar — Verificar/desverificar relacion (admin).
     */
    public static function verificarRelacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $relacionId = (int) $request['id'];
            $verificada = \filter_var($request->get_param('verificada'), \FILTER_VALIDATE_BOOLEAN);

            $relacion = RelacionesSampleRepository::buscarPorId($relacionId);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relación no encontrada'], 404);
            }

            RelacionesSampleRepository::actualizarPorId($relacionId, [
                RelacionesSampleCols::VERIFICADA => $verificada ? 'true' : 'false',
            ]);

            KamplesLogger::info('Relación verificada/desverificada por admin', [
                'relacionId' => $relacionId,
                'verificada' => $verificada,
            ]);

            return new \WP_REST_Response(['ok' => true, 'verificada' => $verificada]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error al verificar relación', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /sample-discovery/estadisticas — Stats generales del módulo.
     */
    public static function estadisticas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $porTipo = RelacionesSampleRepository::estadisticasPorTipo();
            $relacionesPorTipo = \array_map([NormalizadorCancion::class, 'estadisticaTipo'], $porTipo);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'relacionesPorTipo' => $relacionesPorTipo,
                ],
            ]);
        } catch (\Throwable $e) {
            \error_log('[RelacionesController::estadisticas] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/{slug}/cadena — Cadena de samples recursiva.
     */
    public static function cadena(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = (string) $request->get_param('slug');
            $profundidad = (int) $request->get_param('profundidad');
            $cancion = CancionesRepository::buscarPorSlug($slug);

            if (!$cancion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Canción no encontrada'], 404);
            }

            $cadena = RelacionesSampleRepository::cadena((int) $cancion['id'], $profundidad);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'cancion_raiz' => NormalizadorCancion::cancion($cancion),
                    'cadena'       => $cadena,
                ],
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('[RelacionesController::cadena] ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/{slug}/samples — Samples extraidos de una cancion.
     */
    public static function samplesDeCancion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug   = (string) $request->get_param('slug');
            $limit  = (int) $request->get_param('limit');
            $userId = UsuarioHelper::obtenerIdPg();

            $cancion = CancionesRepository::buscarPorSlug($slug);
            if (!$cancion) {
                return new \WP_REST_Response(['ok' => true, 'data' => []]);
            }

            $filas        = SamplesRepository::buscarPorCancionOrigenId((int) $cancion['id'], $userId, $limit);
            $normalizados = NormalizadorSample::normalizarLista($filas);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $normalizados,
            ]);
        } catch (\Throwable $e) {
            \error_log('[RelacionesController::samplesDeCancion] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }
}
