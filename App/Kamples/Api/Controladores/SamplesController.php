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
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
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

        /*
         * GET + DELETE + PUT en la misma ruta para evitar conflicto de regex
         * WP evalúa la primera ruta que coincide con la URL; si GET y DELETE
         * están separados, la ruta slug ([a-zA-Z0-9_-]+) captura los IDs numéricos
         * primero y devuelve 404 para DELETE.
         */
        register_rest_route($namespace, '/samples/(?P<slug>[a-zA-Z0-9_-]+)', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'obtener'],
                'permission_callback' => '__return_true',
                'args'                => [
                    'slug' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'eliminar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
                'args'                => [
                    'slug' => ['required' => true, 'type' => 'string'],
                ],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'actualizar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
                'args'                => [
                    'slug' => ['required' => true, 'type' => 'string'],
                ],
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

        /* DELETE ahora registrado junto con GET en la ruta slug (arriba) */

        /* C87: Endpoints para librería personal del usuario */
        register_rest_route($namespace, '/me/favoritos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'favoritos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        register_rest_route($namespace, '/me/descargas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misDescargas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        /* C140: Sugerencias "Más Ideas" para descargas y favoritos */
        register_rest_route($namespace, '/me/descargas/sugerencias', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'sugerenciasDescargas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'pagina' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'limite' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        register_rest_route($namespace, '/me/favoritos/sugerencias', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'sugerenciasFavoritos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'pagina' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'limite' => ['required' => false, 'type' => 'integer', 'default' => 20],
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

        /*
         * Envolver data + pagination bajo una clave 'data' para que
         * apiPeticion (que extrae json.data) entregue el objeto completo
         * al frontend como RespuestaListaSamples { data, pagination }.
         */
        return new \WP_REST_Response([
            'data' => [
                'data'       => NormalizadorSample::normalizarLista($samples),
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => $total,
                    'pages'    => $total > 0 ? (int) ceil($total / $perPage) : 0,
                ],
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

        /* C164: Rate limit — 10 uploads por hora */
        $pgId = UsuarioHelper::obtenerIdPg();
        if ($pgId) {
            $limitResp = RateLimiter::verificarUsuario($pgId, 'subir_sample', 10, 3600);
            if ($limitResp) return $limitResp;
        }

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
        /* C220: Toggle de visibilidad en comunidad */
        $mostrarEnComunidad = \filter_var($request->get_param('mostrar_en_comunidad') ?? true, \FILTER_VALIDATE_BOOLEAN);
        $precio = $request->get_param('precio');
        $precio = $precio !== null ? (float) $precio : null;

        if (count($tags) < 2) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'Se requieren al menos 2 tags para subir un sample. Agrega hashtags (#) en tu descripción.',
            ], 400);
        }

        $idCorto = GeneradorIdCorto::generar();
        $slug = \sanitize_title($titulo) . '-' . $idCorto;

        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $sampleId = null;
        $tagsPostgres = NormalizadorSample::phpArrayToPg(array_map('\sanitize_text_field', $tags));

        try {
            $resultado = PostgresService::consultarUno(
                "INSERT INTO samples (creador_id, titulo, slug, id_corto, descripcion, formato, tamano,
                 ruta_original, estado, es_premium, precio, tags, permitir_descarga, licencia_libre, mostrar_en_comunidad, publicado_at, created_at, updated_at)
                 VALUES (:creadorId, :titulo, :slug, :idCorto, :descripcion, :formato, :tamano,
                 :rutaOriginal, 'procesando', :esPremium, :precio, :tags, :descarga, :licencia, :comunidad, NOW(), NOW(), NOW())
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
                    'comunidad' => $mostrarEnComunidad ? 'true' : 'false',
                ]
            );
            $sampleId = $resultado['id'] ?? null;
        } catch (\Exception $e) {
            KamplesLogger::error('Error al insertar sample en Postgres', ['error' => $e->getMessage()]);
        }

        /* C198: Sumar 1 crédito bonus por publicar sample */
        if ($sampleId) {
            try {
                PostgresService::ejecutar(
                    "UPDATE usuarios_ext SET creditos_bonus = creditos_bonus + 1 WHERE id = :userId",
                    ['userId' => $userId]
                );
            } catch (\Exception $e) {
                KamplesLogger::warning('No se pudo sumar crédito bonus al publicar sample', ['error' => $e->getMessage()]);
            }
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
     * PUT /samples/{id} — Actualizar metadatos de un sample.
     * Solo el propietario o un admin pueden editar.
     * Campos editables: titulo, descripcion, tags, tipo, esPremium, precio, permitirDescarga, licenciaLibre, imagenUrl.
     */
    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        $sampleId = (int) $request->get_param('slug');
        $usuarioId = UsuarioHelper::obtenerIdPg();
        $esAdmin = UsuarioHelper::esAdmin();

        if (!$usuarioId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $sample = PostgresService::consultarUno(
            "SELECT id, creador_id FROM samples WHERE id = :id AND estado != 'eliminado'",
            ['id' => $sampleId]
        );

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        /* Solo el propietario o un admin pueden editar */
        if ((int) $sample['creador_id'] !== $usuarioId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para editar este sample'], 403);
        }

        $body = $request->get_json_params();
        $campos = [];
        $params = ['id' => $sampleId];

        if (isset($body['titulo'])) {
            $titulo = \sanitize_text_field($body['titulo']);
            if (strlen($titulo) < 1 || strlen($titulo) > 200) {
                return new \WP_REST_Response(['code' => 'titulo_invalido', 'message' => 'El título debe tener entre 1 y 200 caracteres'], 400);
            }
            $campos[] = 'titulo = :titulo';
            $params['titulo'] = $titulo;
        }

        if (isset($body['descripcion'])) {
            $campos[] = 'descripcion = :descripcion';
            $params['descripcion'] = \sanitize_textarea_field($body['descripcion']);
        }

        if (isset($body['tags'])) {
            $tags = is_array($body['tags']) ? $body['tags'] : [];
            $tags = array_map('\sanitize_text_field', $tags);
            if (count($tags) < 2) {
                return new \WP_REST_Response(['code' => 'tags_insuficientes', 'message' => 'Se requieren al menos 2 tags'], 400);
            }
            $campos[] = 'tags = :tags';
            $params['tags'] = NormalizadorSample::phpArrayToPg($tags);
        }

        if (isset($body['tipo'])) {
            $tiposValidos = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];
            if (!in_array($body['tipo'], $tiposValidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
            }
            $campos[] = 'tipo = :tipo';
            $params['tipo'] = $body['tipo'];
        }

        if (isset($body['esPremium'])) {
            $campos[] = 'es_premium = :esPremium';
            $params['esPremium'] = ((bool) $body['esPremium']) ? 'true' : 'false';
        }

        if (isset($body['precio'])) {
            $campos[] = 'precio = :precio';
            $params['precio'] = $body['precio'] !== null ? (float) $body['precio'] : null;
        }

        if (isset($body['permitirDescarga'])) {
            $campos[] = 'permitir_descarga = :descarga';
            $params['descarga'] = ((bool) $body['permitirDescarga']) ? 'true' : 'false';
        }

        if (isset($body['licenciaLibre'])) {
            $campos[] = 'licencia_libre = :licencia';
            $params['licencia'] = ((bool) $body['licenciaLibre']) ? 'true' : 'false';
        }

        /* C220: Toggle de visibilidad en comunidad */
        if (isset($body['mostrarEnComunidad'])) {
            $campos[] = 'mostrar_en_comunidad = :comunidad';
            $params['comunidad'] = ((bool) $body['mostrarEnComunidad']) ? 'true' : 'false';
        }

        if (isset($body['imagenUrl'])) {
            $campos[] = 'imagen_url = :imagenUrl';
            $params['imagenUrl'] = \esc_url_raw($body['imagenUrl']);
        }

        /* Solo admin puede verificar/desverificar */
        if (isset($body['verificado']) && $esAdmin) {
            $campos[] = 'verificado = :verificado';
            $params['verificado'] = ((bool) $body['verificado']) ? 'true' : 'false';
        }

        /* Solo admin puede cambiar el estado */
        if (isset($body['estado']) && $esAdmin) {
            $estadosValidos = ['activo', 'inactivo', 'procesando'];
            if (in_array($body['estado'], $estadosValidos, true)) {
                $campos[] = 'estado = :estado';
                $params['estado'] = $body['estado'];
            }
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No se recibieron campos para actualizar'], 400);
        }

        PostgresService::ejecutar(
            "UPDATE samples SET " . implode(', ', $campos) . ", updated_at = NOW() WHERE id = :id",
            $params
        );

        KamplesLogger::info('Sample actualizado', [
            'sampleId' => $sampleId,
            'campos' => array_keys(array_diff_key($params, ['id' => 1])),
            'por' => $esAdmin && (int) $sample['creador_id'] !== $usuarioId ? 'admin' : 'propietario',
        ]);

        /* Devolver sample actualizado */
        $sampleActualizado = PostgresService::consultarUno(
            NormalizadorSample::sqlSelectSamples($usuarioId)
            . " WHERE s.id = :id",
            ['id' => $sampleId]
        );

        if ($sampleActualizado) {
            return new \WP_REST_Response(['data' => NormalizadorSample::normalizar($sampleActualizado)], 200);
        }

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * DELETE /samples/{id} — Eliminar sample.
     * Solo el propietario o un admin pueden borrar.
     * Elimina archivos físicos (original, mp3, preview, waveform) y registros relacionados.
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        /* El param llega como 'slug' porque comparte ruta con obtener() */
        $sampleId = (int) $request->get_param('slug');
        $usuarioId = UsuarioHelper::obtenerIdPg();
        $esAdmin = UsuarioHelper::esAdmin();

        if (!$usuarioId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        /* Verificar que el sample existe — columnas reales: ruta_original, ruta_optimizada, ruta_preview */
        $sample = PostgresService::consultarUno(
            "SELECT id, creador_id, ruta_original, ruta_optimizada, ruta_preview, ruta_waveform, titulo FROM samples WHERE id = :id",
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
        $rutasAEliminar = ['ruta_original', 'ruta_optimizada', 'ruta_preview', 'ruta_waveform'];

        foreach ($rutasAEliminar as $campo) {
            if (!empty($sample[$campo])) {
                $rutaCompleta = $sample[$campo];
                if (!file_exists($rutaCompleta)) {
                    $rutaCompleta = $baseDir . '/' . ltrim($sample[$campo], '/');
                }
                if (file_exists($rutaCompleta)) {
                    @unlink($rutaCompleta);
                }
            }
        }

        /* Eliminar waveform JSON derivado si no estaba en ruta_waveform */
        $rutaBase = $sample['ruta_original'] ?? '';
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

        /* Eliminar registros relacionados en cascada — columna correcta: tipo (no target_type) */
        PostgresService::ejecutar("DELETE FROM likes WHERE tipo = 'sample' AND target_id = :id", ['id' => $sampleId]);
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

    /**
     * GET /me/favoritos — Samples que el usuario ha dado like.
     */
    public static function favoritos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
            . " JOIN likes l ON l.target_id = s.id AND l.tipo = 'sample' AND l.usuario_id = :favUser"
            . " WHERE s.estado = 'activo'"
            . " ORDER BY l.created_at DESC LIMIT :limit OFFSET :offset";

        $rows = PostgresService::consultar($sql, [
            'favUser' => $userId,
            'limit'   => $perPage,
            'offset'  => $offset,
        ]);

        $samples = NormalizadorSample::normalizarLista($rows);

        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM likes l JOIN samples s ON l.target_id = s.id WHERE l.tipo = 'sample' AND l.usuario_id = :uid AND s.estado = 'activo'",
            ['uid' => $userId]
        );

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => (int) ($total['total'] ?? 0),
                    'pages'    => max(1, (int) ceil(($total['total'] ?? 0) / $perPage)),
                ],
            ],
        ], 200);
    }

    /**
     * GET /me/descargas — Samples que el usuario ha descargado.
     */
    public static function misDescargas(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
            . " JOIN descargas d ON d.sample_id = s.id AND d.usuario_id = :dlUser"
            . " WHERE s.estado = 'activo'"
            . " ORDER BY d.created_at DESC LIMIT :limit OFFSET :offset";

        $rows = PostgresService::consultar($sql, [
            'dlUser' => $userId,
            'limit'  => $perPage,
            'offset' => $offset,
        ]);

        $samples = NormalizadorSample::normalizarLista($rows);

        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM descargas d JOIN samples s ON d.sample_id = s.id WHERE d.usuario_id = :uid AND s.estado = 'activo'",
            ['uid' => $userId]
        );

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => (int) ($total['total'] ?? 0),
                    'pages'    => max(1, (int) ceil(($total['total'] ?? 0) / $perPage)),
                ],
            ],
        ], 200);
    }

    /*
     * C140: Sugerencias basadas en historial del usuario.
     * Patrón idéntico a ColeccionesController::sugerencias() — scoring por tags + BPM + key.
     */

    /**
     * GET /me/descargas/sugerencias — "Más Ideas" basadas en descargas.
     */
    public static function sugerenciasDescargas(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();
        return self::calcularSugerencias(
            "SELECT s.tags, s.bpm, s.key FROM samples s JOIN descargas d ON d.sample_id = s.id WHERE d.usuario_id = :uid AND s.estado = 'activo'",
            "SELECT sample_id FROM descargas WHERE usuario_id = :uid",
            $userId,
            $request
        );
    }

    /**
     * GET /me/favoritos/sugerencias — "Más Ideas" basadas en favoritos.
     */
    public static function sugerenciasFavoritos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();
        return self::calcularSugerencias(
            "SELECT s.tags, s.bpm, s.key FROM samples s JOIN likes l ON l.target_id = s.id AND l.tipo = 'sample' WHERE l.usuario_id = :uid AND s.estado = 'activo'",
            "SELECT target_id AS sample_id FROM likes WHERE tipo = 'sample' AND usuario_id = :uid",
            $userId,
            $request
        );
    }

    /**
     * Motor de sugerencias genérico: analiza tags/BPM/key del contexto del usuario
     * y devuelve samples similares excluyendo los ya vistos.
     */
    private static function calcularSugerencias(
        string $sqlContexto,
        string $sqlExcluir,
        int $userId,
        \WP_REST_Request $request
    ): \WP_REST_Response {
        $pagina = max(1, (int) $request->get_param('pagina'));
        $limite = min(50, max(1, (int) $request->get_param('limite')));
        $offset = ($pagina - 1) * $limite;

        /* Obtener contexto: tags, BPM, keys del usuario */
        $contexto = PostgresService::consultar($sqlContexto, ['uid' => $userId]);

        if (empty($contexto)) {
            return new \WP_REST_Response(['data' => []], 200);
        }

        $allTags = [];
        $allBpms = [];
        $allKeys = [];
        foreach ($contexto as $row) {
            $tags = NormalizadorSample::pgArrayToPhp($row['tags'] ?? '');
            $allTags = array_merge($allTags, $tags);
            if (!empty($row['bpm'])) $allBpms[] = (int) $row['bpm'];
            if (!empty($row['key'])) $allKeys[] = $row['key'];
        }

        /* Top 10 tags más frecuentes */
        $tagCounts = array_count_values($allTags);
        arsort($tagCounts);
        $topTags = array_slice(array_keys($tagCounts), 0, 10);

        /* IDs a excluir (ya descargados/favoritos) — parametrizados para prevenir SQL injection */
        $idsExistentes = PostgresService::consultar($sqlExcluir, ['uid' => $userId]);
        $idsExcluir = array_map(fn($r) => (int) $r['sample_id'], $idsExistentes);

        $excludePlaceholders = '';
        if (!empty($idsExcluir)) {
            $excludeParts = [];
            foreach ($idsExcluir as $idx => $exId) {
                $key = "excl{$idx}";
                $excludeParts[] = ":{$key}";
                $params[$key] = $exId;
            }
            $excludePlaceholders = implode(',', $excludeParts);
        }
        $excludeClause = !empty($excludePlaceholders) ? "AND s.id NOT IN ({$excludePlaceholders})" : '';

        /* Scoring: tags + key + BPM proximity */
        $avgBpm = !empty($allBpms) ? (int) (array_sum($allBpms) / count($allBpms)) : 120;
        $topKey = !empty($allKeys) ? array_count_values($allKeys) : [];
        arsort($topKey);
        $dominantKey = !empty($topKey) ? array_key_first($topKey) : null;

        $tagConditions = [];
        $params = ['limit' => $limite, 'offset' => $offset, 'avgBpm' => $avgBpm];
        foreach ($topTags as $i => $tag) {
            $tagConditions[] = "CASE WHEN :tag{$i} = ANY(s.tags) THEN 1 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagConditions) ? '(' . implode(' + ', $tagConditions) . ')' : '0';

        $keyScore = $dominantKey ? "CASE WHEN s.key = :domKey THEN 3 ELSE 0 END" : "0";
        if ($dominantKey) $params['domKey'] = $dominantKey;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo' {$excludeClause}"
             . " ORDER BY ({$tagScore} + {$keyScore} + CASE WHEN s.bpm IS NOT NULL THEN GREATEST(0, 5 - ABS(s.bpm - :avgBpm) / 10) ELSE 0 END) DESC,"
             . " s.total_likes DESC, s.publicado_at DESC"
             . " LIMIT :limit OFFSET :offset";

        $samples = PostgresService::consultar($sql, $params);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
        ], 200);
    }
}
