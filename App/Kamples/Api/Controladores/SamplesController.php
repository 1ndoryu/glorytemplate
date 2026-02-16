<?php

/**
 * SamplesController — CRUD de samples + feed + upload.
 *
 * Endpoints:
 *   GET    /samples          — Listado con filtros y paginación
 *   GET    /samples/{slug}   — Detalle por slug o id_corto
 *   GET    /feed             — Feed algorítmico
 *   POST   /samples/upload   — Subida con pipeline async
 *   DELETE /samples/{id}     — Eliminar sample (propietario o admin)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\GeneradorIdCorto;
use App\Kamples\Api\PipelineAudio;
use App\Kamples\KamplesLogger;

class SamplesController
{
    private const FORMATOS_AUDIO_VALIDOS = [
        'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac',
        'audio/aiff', 'audio/x-wav', 'audio/x-aiff'
    ];
    private const MAX_TAMANO_AUDIO = 50 * 1024 * 1024;

    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args'                => self::argsListar(),
        ]);

        register_rest_route($namespace, '/samples/(?P<slug>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtener'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        register_rest_route($namespace, '/feed', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'feed'],
            'permission_callback' => '__return_true',
            'args'                => [
                'tipo'     => ['required' => false, 'type' => 'string', 'default' => 'descubrir', 'enum' => ['descubrir', 'trending', 'recientes']],
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1, 'minimum' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        register_rest_route($namespace, '/samples/upload', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'subir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/samples/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'eliminar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint'],
            ],
        ]);
    }

    /**
     * GET /samples — Listado con filtros y paginación.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $where  = ["s.estado = 'activo'"];
        $params = [];

        /*
         * Si se filtra por creador, mostrar también samples en procesamiento.
         * Solo excluir eliminados. Así el creador puede ver su propio contenido.
         */
        $creador = $request->get_param('creador');
        if (!empty($creador)) {
            $where  = ["s.estado NOT IN ('eliminado')"];
            $where[]  = "LOWER(u.username) = LOWER(:creador)";
            $params['creador'] = $creador;
        }

        $busqueda = $request->get_param('busqueda');
        if (!empty($busqueda)) {
            $where[]  = "(s.titulo ILIKE :busqueda OR s.descripcion ILIKE :busqueda)";
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        $genero = $request->get_param('genero');
        if (!empty($genero)) {
            $where[]  = "s.metadata->'genero' ? :genero";
            $params['genero'] = $genero;
        }

        $bpmMin = $request->get_param('bpm_min');
        if ($bpmMin !== null) {
            $where[]  = "s.bpm >= :bpm_min";
            $params['bpm_min'] = (int) $bpmMin;
        }

        $bpmMax = $request->get_param('bpm_max');
        if ($bpmMax !== null) {
            $where[]  = "s.bpm <= :bpm_max";
            $params['bpm_max'] = (int) $bpmMax;
        }

        $key = $request->get_param('key');
        if (!empty($key)) {
            $where[]  = "s.key = :key";
            $params['key'] = $key;
        }

        $tipo = $request->get_param('tipo');
        if (!empty($tipo)) {
            $where[]  = "s.tipo = :tipo";
            $params['tipo'] = $tipo;
        }

        $whereSQL = implode(' AND ', $where);

        $totalRow = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM samples s
             LEFT JOIN usuarios_ext u ON s.creador_id = u.id
             WHERE {$whereSQL}",
            $params
        );
        $total = $totalRow ? (int) $totalRow['total'] : 0;

        $params['limit']  = $perPage;
        $params['offset'] = $offset;

        /* Obtener userId para subquery liked — null si no autenticado */
        $userId = UsuarioHelper::obtenerIdPg();

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE {$whereSQL} ORDER BY s.publicado_at DESC NULLS LAST LIMIT :limit OFFSET :offset";

        $samples = PostgresService::consultar($sql, $params);

        return new \WP_REST_Response([
            'data'       => NormalizadorSample::normalizarLista($samples),
            'pagination' => [
                'page'     => $page,
                'per_page' => $perPage,
                'total'    => $total,
                'pages'    => $total > 0 ? (int) ceil($total / $perPage) : 0,
            ],
        ], 200);
    }

    /**
     * GET /samples/{slug} — Detalle por slug o id_corto (lookup dual).
     */
    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        $slug = $request->get_param('slug');

        /*
         * Lookup dual: intenta por slug primero, luego por id_corto.
         * No filtra por estado para permitir ver samples en procesamiento.
         * El frontend muestra badge de estado si no es 'activo'.
         */
        $userId = UsuarioHelper::obtenerIdPg();
        $sample = PostgresService::consultarUno(
            NormalizadorSample::sqlSelectSamples($userId)
            . " WHERE (LOWER(s.slug) = LOWER(:slug) OR s.id_corto = :slug)"
            . " AND s.estado NOT IN ('eliminado')",
            ['slug' => $slug]
        );

        if ($sample === null) {
            KamplesLogger::debug('Sample no encontrado', ['slug' => $slug]);
            return new \WP_REST_Response([
                'code'    => 'sample_no_encontrado',
                'message' => 'El sample no existe o no está disponible.',
            ], 404);
        }

        return new \WP_REST_Response(['data' => NormalizadorSample::normalizar($sample)], 200);
    }

    /**
     * GET /feed — Feed algorítmico con scoring.
     * Usa MotorRecomendacion cuando está disponible, con fallback a ORDER BY simple.
     */
    public static function feed(\WP_REST_Request $request): \WP_REST_Response
    {
        $tipo    = $request->get_param('tipo');
        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        /* Intentar usar el motor de recomendación para 'descubrir' */
        if ($tipo === 'descubrir') {
            $userId = UsuarioHelper::obtenerIdPg();
            KamplesLogger::info('Feed descubrir solicitado', [
                'userId' => $userId, 'page' => $page, 'perPage' => $perPage,
            ], 'algoritmo');
            if ($userId) {
                try {
                    $recomendados = \App\Kamples\Services\MotorRecomendacion::feedPersonalizado(
                        $userId, $perPage, $offset
                    );
                    KamplesLogger::info('Feed descubrir: MotorRecomendacion retornó', [
                        'resultados' => count($recomendados),
                    ], 'algoritmo');
                    if (!empty($recomendados)) {
                        return new \WP_REST_Response([
                            'data' => NormalizadorSample::normalizarLista($recomendados),
                            'feed' => 'descubrir',
                            'page' => $page,
                            'algoritmo' => true,
                        ], 200);
                    }
                } catch (\Throwable $e) {
                    /* Fallback al ORDER BY simple si el motor falla */
                    KamplesLogger::warning('Motor de recomendación falló, usando fallback', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ], 'algoritmo');
                }
            } else {
                KamplesLogger::debug('Feed descubrir: Sin userId PG, usando fallback', [], 'algoritmo');
            }
        }

        $orderBy = match ($tipo) {
            'trending'  => 'ORDER BY (s.total_descargas + s.total_likes * 2 + s.total_reproducciones) DESC',
            'recientes' => 'ORDER BY s.publicado_at DESC NULLS LAST',
            default     => 'ORDER BY s.publicado_at DESC NULLS LAST',
        };

        /* Obtener userId para subquery liked en fallback */
        $userIdFallback = UsuarioHelper::obtenerIdPg();

        $sql = NormalizadorSample::sqlSelectSamples($userIdFallback)
             . " WHERE s.estado = 'activo' {$orderBy} LIMIT :limit OFFSET :offset";

        $samples = PostgresService::consultar($sql, ['limit' => $perPage, 'offset' => $offset]);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
            'feed' => $tipo,
            'page' => $page,
        ], 200);
    }

    /**
     * POST /samples/upload — Subida de audio con pipeline asíncrono.
     */
    public static function subir(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $archivos = $request->get_file_params();

        if (empty($archivos['audio'])) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'No se recibió archivo de audio'], 400);
        }

        $audio = $archivos['audio'];

        if (!in_array($audio['type'], self::FORMATOS_AUDIO_VALIDOS, true)) {
            return new \WP_REST_Response([
                'ok' => false, 'error' => 'Formato de audio no válido. Formatos aceptados: WAV, MP3, FLAC, AIFF'
            ], 400);
        }

        if ($audio['size'] > self::MAX_TAMANO_AUDIO) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'El archivo excede el tamaño máximo de 50 MB'], 400);
        }

        if (!\function_exists('wp_handle_upload')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $anio = date('Y');
        $mes = date('m');
        $subDir = "kamples/{$wpUserId}/{$anio}/{$mes}";
        $uploadDir = \wp_upload_dir();
        $directorioDestino = $uploadDir['basedir'] . '/' . $subDir;

        if (!file_exists($directorioDestino)) {
            \wp_mkdir_p($directorioDestino);
        }

        $filtroDir = function ($paths) use ($subDir) {
            $paths['subdir'] = '/' . $subDir;
            $paths['path'] = $paths['basedir'] . '/' . $subDir;
            $paths['url'] = $paths['baseurl'] . '/' . $subDir;
            return $paths;
        };

        \add_filter('upload_dir', $filtroDir);

        $subido = \wp_handle_upload($audio, [
            'test_form' => false,
            'mimes'     => [
                'wav' => 'audio/wav', 'mp3' => 'audio/mpeg',
                'flac' => 'audio/flac', 'aiff' => 'audio/aiff',
            ],
        ]);

        \remove_filter('upload_dir', $filtroDir);

        if (isset($subido['error'])) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error al subir archivo: ' . $subido['error']], 500);
        }

        $titulo = \sanitize_text_field($request->get_param('titulo') ?? $audio['name']);
        $contenido = \sanitize_textarea_field($request->get_param('contenido') ?? '');
        $tagsRaw = $request->get_param('tags');
        $tags = is_string($tagsRaw) ? json_decode($tagsRaw, true) ?? [] : (array) ($tagsRaw ?? []);
        $permitirDescarga = \filter_var($request->get_param('permitir_descarga') ?? true, \FILTER_VALIDATE_BOOLEAN);
        $licenciaLibre = \filter_var($request->get_param('licencia_libre') ?? false, \FILTER_VALIDATE_BOOLEAN);
        $esPremium = \filter_var($request->get_param('es_premium') ?? false, \FILTER_VALIDATE_BOOLEAN);
        $precio = $request->get_param('precio');
        $precio = $precio !== null ? (float) $precio : null;

        if (count($tags) < 5) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'Se requieren al menos 5 tags para subir un sample. Agrega más hashtags (#) en tu descripción.',
            ], 400);
        }

        $idCorto = GeneradorIdCorto::generar();
        $slug = \sanitize_title($titulo) . '-' . $idCorto;

        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $sampleId = null;
        $tagsPostgres = '{' . implode(',', array_map('\sanitize_text_field', $tags)) . '}';

        try {
            $resultado = PostgresService::consultarUno(
                "INSERT INTO samples (creador_id, titulo, slug, id_corto, descripcion, formato, tamano,
                 ruta_original, estado, es_premium, precio, tags, permitir_descarga, licencia_libre, publicado_at, created_at, updated_at)
                 VALUES (:creadorId, :titulo, :slug, :idCorto, :descripcion, :formato, :tamano,
                 :rutaOriginal, 'procesando', :esPremium, :precio, :tags, :descarga, :licencia, NOW(), NOW(), NOW())
                 RETURNING id",
                [
                    'creadorId' => $userId, 'titulo' => $titulo, 'slug' => $slug,
                    'idCorto' => $idCorto, 'descripcion' => $contenido,
                    'formato' => strtolower(pathinfo($audio['name'], PATHINFO_EXTENSION)),
                    'tamano' => $audio['size'], 'rutaOriginal' => $subido['file'],
                    'tags' => $tagsPostgres,
                    'esPremium' => $esPremium ? 'true' : 'false',
                    'precio' => $precio,
                    'descarga' => $permitirDescarga ? 'true' : 'false',
                    'licencia' => $licenciaLibre ? 'true' : 'false',
                ]
            );
            $sampleId = $resultado['id'] ?? null;
        } catch (\Exception $e) {
            KamplesLogger::error('Error al insertar sample en Postgres', ['error' => $e->getMessage()]);
        }

        /* Pipeline asíncrono post-respuesta */
        if ($sampleId) {
            $datosPipeline = [
                'sampleId' => $sampleId, 'rutaArchivo' => $subido['file'],
                'nombreOriginal' => $audio['name'], 'idCorto' => $idCorto,
                'descripcion' => $contenido, 'tags' => $tags,
            ];

            \add_action('shutdown', function () use ($datosPipeline) {
                /*
                 * Cerrar la conexión con el cliente ANTES de ejecutar el pipeline.
                 * Sin esto, Apache/mod_php espera a que PHP termine completamente,
                 * causando timeout 500 en subidas cuando la IA tarda mucho.
                 */
                if (function_exists('fastcgi_finish_request')) {
                    \fastcgi_finish_request();
                } else {
                    /* Fallback para Apache/mod_php */
                    ignore_user_abort(true);
                    if (session_id()) session_write_close();
                    if (!headers_sent()) {
                        header('Connection: close');
                    }
                    while (ob_get_level() > 0) {
                        ob_end_flush();
                    }
                    flush();
                }

                @set_time_limit(600);
                @ini_set('memory_limit', '256M');

                try {
                    PipelineAudio::procesar(
                        $datosPipeline['sampleId'], $datosPipeline['rutaArchivo'],
                        $datosPipeline['nombreOriginal'], $datosPipeline['idCorto'],
                        $datosPipeline['descripcion'], $datosPipeline['tags']
                    );
                } catch (\Throwable $e) {
                    KamplesLogger::error('Pipeline async error', [
                        'sampleId' => $datosPipeline['sampleId'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }, 0);
        }

        return new \WP_REST_Response([
            'ok' => true, 'sample_id' => $sampleId, 'id_corto' => $idCorto,
            'slug' => $slug, 'url' => $subido['url'], 'estado' => 'procesando',
        ], 201);
    }

    /**
     * DELETE /samples/{id} — Eliminar sample.
     * Solo el propietario o un admin pueden borrar.
     * Elimina archivos físicos (original, mp3, preview, waveform) y registros relacionados.
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        $sampleId = (int) $request->get_param('id');
        $usuarioId = UsuarioHelper::obtenerIdPg();
        $esAdmin = UsuarioHelper::esAdmin();

        if (!$usuarioId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        /* Verificar que el sample existe */
        $sample = PostgresService::consultarUno(
            "SELECT id, creador_id, ruta_archivo, ruta_mp3, ruta_preview, titulo FROM samples WHERE id = :id",
            ['id' => $sampleId]
        );

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        /* Solo el propietario o un admin pueden borrar */
        if ((int) $sample['creador_id'] !== $usuarioId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para eliminar este sample'], 403);
        }

        /* Eliminar archivos físicos del disco */
        $uploadDir = \wp_upload_dir();
        $baseDir = $uploadDir['basedir'];
        $rutasAEliminar = ['ruta_archivo', 'ruta_mp3', 'ruta_preview'];

        foreach ($rutasAEliminar as $campo) {
            if (!empty($sample[$campo])) {
                /* La ruta puede ser absoluta o relativa a uploads */
                $rutaCompleta = $sample[$campo];
                if (!file_exists($rutaCompleta)) {
                    $rutaCompleta = $baseDir . '/' . ltrim($sample[$campo], '/');
                }
                if (file_exists($rutaCompleta)) {
                    @unlink($rutaCompleta);
                }
            }
        }

        /* Eliminar waveform JSON si existe */
        $rutaBase = $sample['ruta_archivo'] ?? '';
        if ($rutaBase) {
            $rutaWaveform = preg_replace('/\.[^.]+$/', '.json', $rutaBase);
            if ($rutaWaveform && file_exists($rutaWaveform)) {
                @unlink($rutaWaveform);
            }
            $rutaAbsWaveform = $baseDir . '/' . ltrim($rutaWaveform, '/');
            if (file_exists($rutaAbsWaveform)) {
                @unlink($rutaAbsWaveform);
            }
        }

        /* Eliminar registros relacionados en cascada */
        PostgresService::ejecutar("DELETE FROM likes WHERE target_type = 'sample' AND target_id = :id", ['id' => $sampleId]);
        PostgresService::ejecutar("DELETE FROM coleccion_samples WHERE sample_id = :id", ['id' => $sampleId]);
        PostgresService::ejecutar("DELETE FROM reproducciones WHERE sample_id = :id", ['id' => $sampleId]);
        PostgresService::ejecutar("DELETE FROM descargas WHERE sample_id = :id", ['id' => $sampleId]);

        /* Eliminar el sample */
        PostgresService::ejecutar("DELETE FROM samples WHERE id = :id", ['id' => $sampleId]);

        KamplesLogger::info('Sample eliminado', [
            'sampleId' => $sampleId,
            'titulo'   => $sample['titulo'] ?? '',
            'por'      => $esAdmin && (int) $sample['creador_id'] !== $usuarioId ? 'admin' : 'propietario',
        ]);

        return new \WP_REST_Response(['ok' => true, 'eliminado' => true], 200);
    }

    private static function argsListar(): array
    {
        return [
            'page'     => ['required' => false, 'type' => 'integer', 'default' => 1, 'minimum' => 1],
            'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100],
            'busqueda' => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'genero'   => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'bpm_min'  => ['required' => false, 'type' => 'integer', 'minimum' => 1, 'maximum' => 999],
            'bpm_max'  => ['required' => false, 'type' => 'integer', 'minimum' => 1, 'maximum' => 999],
            'key'      => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'tipo'     => ['required' => false, 'type' => 'string', 'enum' => ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro']],
            'creador'  => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
        ];
    }
}
