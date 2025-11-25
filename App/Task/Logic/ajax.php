<?php

function logicStartStepAjax(): void
{
    $usuarioId = logicValidateRequest();
    $titulo = isset($_POST['titulo']) ? sanitize_text_field(wp_unslash((string) $_POST['titulo'])) : '';

    $resultado = logicStartStepForUser($usuarioId, $titulo);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        ['mensaje' => 'Paso lógico fijado.']
    ));
}

function logicFinishStepAjax(): void
{
    $usuarioId = logicValidateRequest();
    $taskId = isset($_POST['taskId']) ? (int) $_POST['taskId'] : 0;

    $resultado = logicFinishStepForUser($usuarioId, $taskId);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        ['mensaje' => 'Paso liberado.']
    ));
}

function logicGetStateAjax(): void
{
    $usuarioId = logicValidateRequest();

    wp_send_json_success(logicBuildResponse($usuarioId));
}

function logicReorderStepsAjax(): void
{
    $usuarioId = logicValidateRequest();
    $order = $_POST['order'] ?? [];
    if (!is_array($order)) {
        wp_send_json_error(['mensaje' => 'Formato de orden inválido.']);
    }

    $nuevoOrden = array_values(array_unique(array_map('intval', $order)));
    $tareas = logicFetchActiveTasks($usuarioId);
    $idsActuales = array_map('intval', wp_list_pluck($tareas, 'ID'));

    sort($nuevoOrden);
    $idsOrdenados = $idsActuales;
    sort($idsOrdenados);
    if ($nuevoOrden !== $idsOrdenados) {
        wp_send_json_error(['mensaje' => 'El orden recibido no coincide con los pasos activos.']);
    }

    $ordenLimpio = [];
    foreach ($order as $id) {
        $id = (int) $id;
        if ($id && in_array($id, $idsActuales, true) && !in_array($id, $ordenLimpio, true)) {
            $ordenLimpio[] = $id;
        }
    }

    logicSaveUserOrder($usuarioId, $ordenLimpio);

    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        ['mensaje' => 'Orden actualizado.']
    ));
}

function logicPauseStepAjax(): void
{
    $usuarioId = logicValidateRequest();
    $taskId = isset($_POST['taskId']) ? (int) $_POST['taskId'] : 0;

    $resultado = logicPauseStepForUser($usuarioId, $taskId);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        ['mensaje' => 'Paso pausado.']
    ));
}

function logicResumeStepAjax(): void
{
    $usuarioId = logicValidateRequest();
    $taskId = isset($_POST['taskId']) ? (int) $_POST['taskId'] : 0;
    $resultado = logicResumeStepForUser($usuarioId, $taskId);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        ['mensaje' => 'Paso reanudado.']
    ));
}

function logicGetHistoryAjax(): void
{
    $usuarioId = logicValidateRequest();
    $limite = isset($_POST['limit']) ? (int) $_POST['limit'] : GLORY_LOGIC_HISTORY_LIMIT;

    wp_send_json_success([
        'history' => logicFetchHistoryEntries($usuarioId, $limite),
        'limit'   => $limite,
    ]);
}

function logicDeleteHistoryAjax(): void
{
    $usuarioId = logicValidateRequest();
    $historialId = isset($_POST['historyId']) ? (int) $_POST['historyId'] : 0;
    $limite = isset($_POST['limit']) ? (int) $_POST['limit'] : GLORY_LOGIC_HISTORY_LIMIT;

    if ($historialId <= 0) {
        wp_send_json_error(['mensaje' => 'Selecciona un registro para eliminar.']);
    }

    logicDeleteHistoryEntry($usuarioId, $historialId);

    wp_send_json_success([
        'history' => logicFetchHistoryEntries($usuarioId, $limite),
        'mensaje' => 'Registro eliminado.',
        'limit'   => $limite,
    ]);
}

function logicAddHabitAjax(): void
{
    $usuarioId = logicValidateRequest();
    $titulo = isset($_POST['titulo']) ? (string) $_POST['titulo'] : '';

    $titulo = logicNormalizeHabit($titulo);
    if ($titulo === '') {
        wp_send_json_error(['mensaje' => 'Escribe el nombre del hábito rápido.']);
    }

    $habitos = logicAddQuickHabit($usuarioId, $titulo);

    wp_send_json_success([
        'habits'  => $habitos,
        'mensaje' => 'Hábito agregado.',
    ]);
}

function logicGetHabitsAjax(): void
{
    $usuarioId = logicValidateRequest();
    wp_send_json_success([
        'habits' => logicGetQuickHabits($usuarioId),
    ]);
}

function logicDeleteHabitAjax(): void
{
    $usuarioId = logicValidateRequest();
    $titulo = isset($_POST['titulo']) ? (string) $_POST['titulo'] : '';

    $resultado = logicRemoveQuickHabit($usuarioId, $titulo);

    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success([
        'habits'  => $resultado,
        'mensaje' => 'Hábito eliminado.',
    ]);
}

function logicRenameHabitAjax(): void
{
    $usuarioId = logicValidateRequest();
    $tituloAnterior = isset($_POST['titulo']) ? (string) $_POST['titulo'] : '';
    $tituloNuevo = isset($_POST['nuevoTitulo']) ? (string) $_POST['nuevoTitulo'] : '';

    $resultado = logicRenameQuickHabit($usuarioId, $tituloAnterior, $tituloNuevo);

    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success([
        'habits'  => $resultado,
        'mensaje' => 'Hábito actualizado.',
    ]);
}

function logicSaveHelpMessageAjax(): void
{
    $usuarioId = logicValidateRequest();
    $mensaje = isset($_POST['mensaje']) ? (string) $_POST['mensaje'] : '';
    $duracion = isset($_POST['duracion']) ? (int) $_POST['duracion'] : 0;

    $resultado = logicSaveHelpMessage($usuarioId, $mensaje, $duracion);

    wp_send_json_success([
        'helpMessage' => $resultado,
        'mensaje'     => empty($resultado) ? 'Mensaje eliminado.' : 'Mensaje guardado.',
    ]);
}

function logicGetHelpMessageAjax(): void
{
    $usuarioId = logicValidateRequest();
    wp_send_json_success([
        'helpMessage' => logicGetHelpMessage($usuarioId),
    ]);
}

add_action('wp_ajax_logic_start_step', 'logicStartStepAjax');
add_action('wp_ajax_logic_finish_step', 'logicFinishStepAjax');
add_action('wp_ajax_logic_get_state', 'logicGetStateAjax');
add_action('wp_ajax_logic_reorder_steps', 'logicReorderStepsAjax');
add_action('wp_ajax_logic_pause_step', 'logicPauseStepAjax');
add_action('wp_ajax_logic_resume_step', 'logicResumeStepAjax');
add_action('wp_ajax_logic_get_history', 'logicGetHistoryAjax');
add_action('wp_ajax_logic_delete_history', 'logicDeleteHistoryAjax');
add_action('wp_ajax_logic_add_habit', 'logicAddHabitAjax');
add_action('wp_ajax_logic_get_habits', 'logicGetHabitsAjax');
add_action('wp_ajax_logic_delete_habit', 'logicDeleteHabitAjax');
add_action('wp_ajax_logic_rename_habit', 'logicRenameHabitAjax');
add_action('wp_ajax_logic_save_help_message', 'logicSaveHelpMessageAjax');
add_action('wp_ajax_logic_get_help_message', 'logicGetHelpMessageAjax');

function logicAddContextAjax(): void
{
    $usuarioId = logicValidateRequest();
    $texto = isset($_POST['texto']) ? (string) $_POST['texto'] : '';
    $pinned = isset($_POST['pinned']) && $_POST['pinned'];

    $resultado = logicAddContext($usuarioId, $texto, $pinned);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success([
        'contexts' => $resultado,
        'mensaje'  => 'Contexto agregado.',
    ]);
}

function logicUpdateContextAjax(): void
{
    $usuarioId = logicValidateRequest();
    $contextId = isset($_POST['contextId']) ? (int) $_POST['contextId'] : 0;
    $texto = isset($_POST['texto']) ? (string) $_POST['texto'] : '';

    $resultado = logicUpdateContext($usuarioId, $contextId, $texto);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success([
        'contexts' => $resultado,
        'mensaje'  => 'Contexto actualizado.',
    ]);
}

function logicDeleteContextAjax(): void
{
    $usuarioId = logicValidateRequest();
    $contextId = isset($_POST['contextId']) ? (int) $_POST['contextId'] : 0;

    $resultado = logicDeleteContext($usuarioId, $contextId);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success([
        'contexts' => $resultado,
        'mensaje'  => 'Contexto eliminado.',
    ]);
}

function logicReorderContextsAjax(): void
{
    $usuarioId = logicValidateRequest();
    $order = $_POST['order'] ?? [];
    if (!is_array($order)) {
        wp_send_json_error(['mensaje' => 'Formato de orden inválido.']);
    }

    $resultado = logicReorderContexts($usuarioId, $order);

    wp_send_json_success([
        'contexts' => $resultado,
        'mensaje'  => 'Orden de contextos actualizado.',
    ]);
}

function logicGetContextsAjax(): void
{
    $usuarioId = logicValidateRequest();
    wp_send_json_success([
        'contexts' => logicGetContexts($usuarioId),
    ]);
}

function logicTogglePinContextAjax(): void
{
    $usuarioId = logicValidateRequest();
    $contextId = isset($_POST['contextId']) ? (int) $_POST['contextId'] : 0;

    $resultado = logicTogglePinContext($usuarioId, $contextId);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success([
        'contexts' => $resultado,
        'mensaje'  => 'Contexto actualizado.',
    ]);
}

add_action('wp_ajax_logic_add_context', 'logicAddContextAjax');
add_action('wp_ajax_logic_update_context', 'logicUpdateContextAjax');
add_action('wp_ajax_logic_delete_context', 'logicDeleteContextAjax');
add_action('wp_ajax_logic_reorder_contexts', 'logicReorderContextsAjax');
add_action('wp_ajax_logic_get_contexts', 'logicGetContextsAjax');
add_action('wp_ajax_logic_toggle_pin_context', 'logicTogglePinContextAjax');

function logicDeleteStepAjax(): void
{
    $usuarioId = logicValidateRequest();
    $taskId = isset($_POST['taskId']) ? (int) $_POST['taskId'] : 0;

    $resultado = logicDeleteStepForUser($usuarioId, $taskId);
    if (is_wp_error($resultado)) {
        wp_send_json_error(['mensaje' => $resultado->get_error_message()]);
    }

    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        ['mensaje' => 'Paso eliminado.']
    ));
}

add_action('wp_ajax_logic_delete_step', 'logicDeleteStepAjax');

function logicRunAgentAjax(): void
{
    $usuarioId = logicValidateRequest();

    $scriptPath = __DIR__ . '/run_agent.js';
    if (!file_exists($scriptPath)) {
        wp_send_json_error(['mensaje' => 'No encuentro el script del agente.']);
    }

    // Attempt to locate node. In many local setups 'node' is in PATH.
    // If this fails, the user might need to specify the full path to node.
    $nodeCommand = 'node'; 

    // Prepare command
    // We pass the user ID as an env var just in case, though the script uses a default or env.
    // We assume API_OPENROUTER is in the system env or set via other means.
    // If not, we might need to pass it explicitly if we had access to it here.
    
    // On Windows, setting env vars for a single command: "set VAR=val && cmd"
    // On Linux: "VAR=val cmd"
    // We'll try to run it directly first.
    
    $cmd = sprintf('%s %s 2>&1', $nodeCommand, escapeshellarg($scriptPath));
    
    // If we are on Windows, we might want to ensure we are in the correct directory
    // but using absolute path for script should be enough.
    
    $output = [];
    $returnVar = 0;
    
    // Increase time limit for this request as AI might take time
    set_time_limit(60);
    
    exec($cmd, $output, $returnVar);
    
    $fullOutput = implode("\n", $output);
    
    if ($returnVar !== 0) {
        // Check if it's a missing API key error
        if (strpos($fullOutput, 'API_OPENROUTER environment variable is missing') !== false) {
             wp_send_json_error(['mensaje' => 'Falta la variable API_OPENROUTER en el entorno del servidor.']);
        }
        wp_send_json_error(['mensaje' => 'Error del agente: ' . $fullOutput]);
    }

    // Refresh state to show changes made by agent
    wp_send_json_success(array_merge(
        logicBuildResponse($usuarioId),
        [
            'mensaje' => 'Agente ejecutado correctamente.',
            'agentOutput' => $fullOutput
        ]
    ));
}

add_action('wp_ajax_logic_run_agent', 'logicRunAgentAjax');
