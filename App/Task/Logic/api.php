<?php

add_action('rest_api_init', 'logicRegisterPublicApiRoutes');

function logicRegisterPublicApiRoutes(): void
{
    register_rest_route('glory-logic/v1', '/state', [
        'methods'             => \WP_REST_Server::READABLE,
        'callback'            => 'logicApiEndpointState',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'historyLimit' => [
                'description' => 'Cantidad de registros de historial a incluir (1-100).',
                'type'        => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/history', [
        'methods'             => \WP_REST_Server::READABLE,
        'callback'            => 'logicApiEndpointHistory',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'limit' => [
                'description' => 'Cantidad de registros (1-100).',
                'type'        => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/history/(?P<historyId>\d+)', [
        'methods'             => \WP_REST_Server::DELETABLE,
        'callback'            => 'logicApiEndpointHistoryDelete',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'historyId' => [
                'required' => true,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/steps', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointCreateStep',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'titulo' => [
                'required' => true,
                'type'     => 'string',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/steps/(?P<taskId>\d+)/finish', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointFinishStep',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'taskId' => [
                'required' => true,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/steps/(?P<taskId>\d+)/pause', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointPauseStep',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'taskId' => [
                'required' => true,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/steps/(?P<taskId>\d+)/resume', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointResumeStep',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'taskId' => [
                'required' => true,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/habits', [
        'methods'             => \WP_REST_Server::READABLE,
        'callback'            => 'logicApiEndpointGetHabits',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs(),
    ]);

    register_rest_route('glory-logic/v1', '/habits', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointAddHabit',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'titulo' => [
                'required' => true,
                'type'     => 'string',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/habits/rename', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointRenameHabit',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'titulo'      => [
                'required' => true,
                'type'     => 'string',
            ],
            'nuevoTitulo' => [
                'required' => true,
                'type'     => 'string',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/habits/delete', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointDeleteHabit',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'titulo' => [
                'required' => true,
                'type'     => 'string',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/help-message', [
        'methods'             => \WP_REST_Server::READABLE,
        'callback'            => 'logicApiEndpointHelpMessageGet',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs(),
    ]);

    register_rest_route('glory-logic/v1', '/help-message', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointHelpMessageSave',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'mensaje'  => [
                'required' => true,
                'type'     => 'string',
            ],
            'duracion' => [
                'required' => false,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/help-message', [
        'methods'             => \WP_REST_Server::DELETABLE,
        'callback'            => 'logicApiEndpointHelpMessageDelete',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs(),
    ]);


    register_rest_route('glory-logic/v1', '/contexts', [
        'methods'             => \WP_REST_Server::READABLE,
        'callback'            => 'logicApiEndpointGetContexts',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'limit' => [
                'description' => 'Cantidad de contextos a retornar (1-100, -1 para todos). Por defecto: 10',
                'type'        => 'integer',
                'default'     => 10,
                'sanitize_callback' => 'intval',
            ],
            'dateFrom' => [
                'description' => 'Timestamp desde el cual filtrar por fecha de creación (>=).',
                'type'        => 'integer',
                'sanitize_callback' => 'absint',
            ],
            'dateTo' => [
                'description' => 'Timestamp hasta el cual filtrar por fecha de creación (<=).',
                'type'        => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/contexts', [
        'methods'             => \WP_REST_Server::CREATABLE,
        'callback'            => 'logicApiEndpointAddContext',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'texto' => [
                'required' => true,
                'type'     => 'string',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/contexts/(?P<contextId>\\d+)', [
        'methods'             => \WP_REST_Server::EDITABLE,
        'callback'            => 'logicApiEndpointUpdateContext',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'contextId' => [
                'required' => true,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
            'texto' => [
                'required' => true,
                'type'     => 'string',
            ],
        ]),
    ]);

    register_rest_route('glory-logic/v1', '/contexts/(?P<contextId>\\d+)', [
        'methods'             => \WP_REST_Server::DELETABLE,
        'callback'            => 'logicApiEndpointDeleteContext',
        'permission_callback' => 'logicApiPermissionCallback',
        'args'                => logicApiRouteArgs([
            'contextId' => [
                'required' => true,
                'type'     => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ]),
    ]);
}

function logicApiRouteArgs(array $extra = []): array
{
    return array_merge([
        'userId' => [
            'required'          => true,
            'description'       => 'ID del usuario dueño del tablero Logic.',
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'validate_callback' => static function ($value) {
                return absint($value) > 0;
            },
        ],
    ], $extra);
}

function logicApiPermissionCallback(\WP_REST_Request $request)
{
    $expected = defined('GLORY_LOGIC_PUBLIC_API_KEY') ? trim((string) GLORY_LOGIC_PUBLIC_API_KEY) : '';
    $expected = apply_filters('glory_logic_public_api_key', $expected, $request);

    if ($expected === '') {
        return new \WP_Error('logic_api_disabled', 'Configura la clave pública de Logic para habilitar la API.', ['status' => 403]);
    }

    $provided = (string) $request->get_header('x-glory-logic-key');
    if ($provided === '') {
        $provided = (string) $request->get_param('logic_key');
    }

    if ($provided === '') {
        return new \WP_Error('logic_api_key_missing', 'Incluye la cabecera X-Glory-Logic-Key o el parámetro logic_key.', ['status' => 401]);
    }

    if (!hash_equals($expected, $provided)) {
        return new \WP_Error('logic_api_key_invalid', 'API key inválida.', ['status' => 403]);
    }

    return true;
}

function logicApiResolveUserId(\WP_REST_Request $request)
{
    $userId = absint($request->get_param('userId'));
    if ($userId <= 0) {
        return new \WP_Error('logic_api_user_missing', 'Debes indicar el parámetro userId.', ['status' => 400]);
    }

    if (!get_user_by('id', $userId)) {
        return new \WP_Error('logic_api_user_not_found', 'No encuentro al usuario solicitado.', ['status' => 404]);
    }

    return $userId;
}

function logicApiHistoryLimitFromRequest(\WP_REST_Request $request, string $param = 'historyLimit'): int
{
    $limit = (int) $request->get_param($param);
    if ($limit <= 0) {
        $limit = GLORY_LOGIC_HISTORY_LIMIT;
    }

    return max(1, min($limit, 100));
}

function logicApiBuildFullState(int $usuarioId, ?int $historyLimit = null): array
{
    $historyLimit = $historyLimit ?? GLORY_LOGIC_HISTORY_LIMIT;
    $historyLimit = max(1, min((int) $historyLimit, 100));
    $tasks = logicGetActiveTasksData($usuarioId);

    return [
        'userId'       => $usuarioId,
        'limit'        => GLORY_LOGIC_MAX_STEPS,
        'limitReached' => count($tasks) >= GLORY_LOGIC_MAX_STEPS,
        'tasks'        => $tasks,
        'habits'       => logicGetQuickHabits($usuarioId),
        'history'      => logicFetchHistoryEntries($usuarioId, $historyLimit),
        'historyLimit' => $historyLimit,
        'helpMessage'  => logicGetHelpMessage($usuarioId),
        'contexts'     => logicGetContexts($usuarioId),
    ];
}

function logicApiEndpointState(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $historyLimit = logicApiHistoryLimitFromRequest($request);

    return logicApiBuildFullState($userId, $historyLimit);
}

function logicApiEndpointHistory(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $limit = logicApiHistoryLimitFromRequest($request, 'limit');
    return [
        'userId'  => $userId,
        'limit'   => $limit,
        'history' => logicFetchHistoryEntries($userId, $limit),
    ];
}

function logicApiEndpointHistoryDelete(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $historyId = absint($request->get_param('historyId'));
    if ($historyId <= 0) {
        return new \WP_Error('logic_api_history_invalid', 'Selecciona un registro para eliminar.', ['status' => 400]);
    }

    logicDeleteHistoryEntry($userId, $historyId);

    return [
        'userId'  => $userId,
        'history' => logicFetchHistoryEntries($userId, GLORY_LOGIC_HISTORY_LIMIT),
        'message' => 'Registro eliminado.',
    ];
}

function logicApiEndpointCreateStep(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $titulo = (string) $request->get_param('titulo');
    $resultado = logicStartStepForUser($userId, $titulo);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    $state = logicApiBuildFullState($userId);
    $state['message'] = 'Paso lógico fijado.';
    return $state;
}

function logicApiEndpointFinishStep(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $taskId = absint($request->get_param('taskId'));
    $resultado = logicFinishStepForUser($userId, $taskId);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    $state = logicApiBuildFullState($userId);
    $state['message'] = 'Paso liberado.';
    return $state;
}

function logicApiEndpointPauseStep(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $taskId = absint($request->get_param('taskId'));
    $resultado = logicPauseStepForUser($userId, $taskId);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    $state = logicApiBuildFullState($userId);
    $state['message'] = 'Paso pausado.';
    return $state;
}

function logicApiEndpointResumeStep(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $taskId = absint($request->get_param('taskId'));
    $resultado = logicResumeStepForUser($userId, $taskId);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    $state = logicApiBuildFullState($userId);
    $state['message'] = 'Paso reanudado.';
    return $state;
}

function logicApiEndpointGetHabits(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    return [
        'userId' => $userId,
        'habits' => logicGetQuickHabits($userId),
    ];
}

function logicApiEndpointAddHabit(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $titulo = sanitize_text_field((string) $request->get_param('titulo'));
    if ($titulo === '') {
        return new \WP_Error('logic_api_habit_empty', 'Escribe el nombre del hábito rápido.', ['status' => 400]);
    }

    $habits = logicAddQuickHabit($userId, $titulo);
    return [
        'userId' => $userId,
        'habits' => $habits,
        'message' => 'Hábito guardado.',
    ];
}

function logicApiEndpointRenameHabit(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $titulo = sanitize_text_field((string) $request->get_param('titulo'));
    $nuevoTitulo = sanitize_text_field((string) $request->get_param('nuevoTitulo'));

    if ($titulo === '' || $nuevoTitulo === '') {
        return new \WP_Error('logic_api_habit_empty', 'Completa ambos nombres del hábito.', ['status' => 400]);
    }

    $resultado = logicRenameQuickHabit($userId, $titulo, $nuevoTitulo);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    return [
        'userId' => $userId,
        'habits' => $resultado,
        'message' => 'Hábito actualizado.',
    ];
}

function logicApiEndpointDeleteHabit(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $titulo = sanitize_text_field((string) $request->get_param('titulo'));
    if ($titulo === '') {
        return new \WP_Error('logic_api_habit_empty', 'Indica el hábito que quieres eliminar.', ['status' => 400]);
    }

    $resultado = logicRemoveQuickHabit($userId, $titulo);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    return [
        'userId' => $userId,
        'habits' => $resultado,
        'message' => 'Hábito eliminado.',
    ];
}

function logicApiEndpointHelpMessageGet(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    return [
        'userId'      => $userId,
        'helpMessage' => logicGetHelpMessage($userId),
    ];
}

function logicApiEndpointHelpMessageSave(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $mensaje = (string) $request->get_param('mensaje');
    $duracion = (int) $request->get_param('duracion');
    if ($duracion <= 0) {
        $duracion = 3600;
    }

    $resultado = logicSaveHelpMessage($userId, $mensaje, $duracion);

    return [
        'userId'      => $userId,
        'helpMessage' => $resultado,
        'message'     => empty($resultado) ? 'Mensaje eliminado.' : 'Mensaje actualizado.',
    ];
}

function logicApiEndpointHelpMessageDelete(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $resultado = logicSaveHelpMessage($userId, '', 0);

    return [
        'userId'      => $userId,
        'helpMessage' => $resultado,
        'message'     => 'Mensaje eliminado.',
    ];
}

function logicApiEndpointGetContexts(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $limit = intval($request->get_param('limit'));
    if ($limit === 0) {
        $limit = 10; // Default
    }
    // Limitar entre -1 (todos) y 100
    if ($limit > 0) {
        $limit = min($limit, 100);
    }

    $dateFrom = absint($request->get_param('dateFrom'));
    $dateTo = absint($request->get_param('dateTo'));

    $contexts = logicGetContexts(
        $userId,
        $limit,
        $dateFrom > 0 ? $dateFrom : null,
        $dateTo > 0 ? $dateTo : null
    );

    return [
        'userId'   => $userId,
        'contexts' => $contexts,
        'limit'    => $limit,
        'count'    => count($contexts),
    ];
}

function logicApiEndpointAddContext(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $texto = sanitize_text_field((string) $request->get_param('texto'));
    if ($texto === '') {
        return new \WP_Error('logic_api_context_empty', 'El texto del contexto no puede estar vacío.', ['status' => 400]);
    }

    $resultado = logicAddContext($userId, $texto);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    return [
        'userId'   => $userId,
        'contexts' => $resultado,
        'message'  => 'Contexto agregado.',
    ];
}

function logicApiEndpointUpdateContext(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $contextId = absint($request->get_param('contextId'));
    if ($contextId <= 0) {
        return new \WP_Error('logic_api_context_invalid', 'ID de contexto inválido.', ['status' => 400]);
    }

    $texto = sanitize_text_field((string) $request->get_param('texto'));
    if ($texto === '') {
        return new \WP_Error('logic_api_context_empty', 'El texto del contexto no puede estar vacío.', ['status' => 400]);
    }

    $resultado = logicUpdateContext($userId, $contextId, $texto);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    return [
        'userId'   => $userId,
        'contexts' => $resultado,
        'message'  => 'Contexto actualizado.',
    ];
}

function logicApiEndpointDeleteContext(\WP_REST_Request $request)
{
    $userId = logicApiResolveUserId($request);
    if (is_wp_error($userId)) {
        return $userId;
    }

    $contextId = absint($request->get_param('contextId'));
    if ($contextId <= 0) {
        return new \WP_Error('logic_api_context_invalid', 'ID de contexto inválido.', ['status' => 400]);
    }

    $resultado = logicDeleteContext($userId, $contextId);
    if (is_wp_error($resultado)) {
        return $resultado;
    }

    return [
        'userId'   => $userId,
        'contexts' => $resultado,
        'message'  => 'Contexto eliminado.',
    ];
}

