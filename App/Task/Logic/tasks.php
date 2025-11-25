<?php

function logicFindActiveTask(int $usuarioId, int $taskId): ?\WP_Post
{
    if ($usuarioId <= 0 || $taskId <= 0) {
        return null;
    }

    $tarea = get_post($taskId);
    if (!$tarea instanceof \WP_Post) {
        return null;
    }

    if ((int) $tarea->post_author !== $usuarioId || $tarea->post_type !== 'tarea') {
        return null;
    }

    $sesion = get_post_meta($taskId, 'sesion', true);
    $estado = get_post_meta($taskId, 'estado', true);

    if ($sesion !== 'logic' || $estado !== 'pendiente') {
        return null;
    }

    return $tarea;
}

function logicCountActiveTasks(int $usuarioId): int
{
    $query = new \WP_Query([
        'post_type'      => 'tarea',
        'post_status'    => ['publish'],
        'author'         => $usuarioId,
        'fields'         => 'ids',
        'posts_per_page' => GLORY_LOGIC_MAX_STEPS + 1,
        'meta_query'     => [
            'relation' => 'AND',
            [
                'key'     => 'sesion',
                'value'   => 'logic',
            ],
            [
                'key'     => 'estado',
                'value'   => 'pendiente',
            ],
        ],
    ]);

    return (int) $query->found_posts;
}

function logicFetchActiveTasks(int $usuarioId): array
{
    $tareas = get_posts([
        'post_type'      => 'tarea',
        'post_status'    => ['publish'],
        'posts_per_page' => -1,
        'author'         => $usuarioId,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'meta_query'     => [
            'relation' => 'AND',
            [
                'key'     => 'sesion',
                'value'   => 'logic',
                'compare' => '=',
            ],
            [
                'key'     => 'estado',
                'value'   => 'pendiente',
                'compare' => '=',
            ],
        ],
    ]);

    return logicApplyOrder($tareas, $usuarioId);
}

function logicFormatDuration(int $segundos): string
{
    $segundos = max(0, $segundos);
    $horas = (int) floor($segundos / 3600);
    $minutos = (int) floor(($segundos % 3600) / 60);
    $resto = $segundos % 60;

    return sprintf('%02d:%02d:%02d', $horas, $minutos, $resto);
}

function logicGetTimeline(int $taskId): array
{
    $timeline = get_post_meta($taskId, 'logicTimeline', true);
    return is_array($timeline) ? $timeline : [];
}

function logicAppendTimeline(int $taskId, string $accion, array $extra = []): void
{
    $timeline = logicGetTimeline($taskId);
    $timeline[] = [
        'accion'    => $accion,
        'utc'       => gmdate('Y-m-d H:i:s'),
        'timestamp' => current_time('timestamp', true),
        'extra'     => $extra,
    ];
    update_post_meta($taskId, 'logicTimeline', $timeline);
}

function logicBuildTaskPayload(\WP_Post $tarea): array
{
    $timestamp = (int) get_post_meta($tarea->ID, 'logicInicioTimestamp', true);
    if ($timestamp <= 0) {
        $fechaGmt = get_post_field('post_date_gmt', $tarea->ID);
        if (!$fechaGmt || $fechaGmt === '0000-00-00 00:00:00') {
            $fechaGmt = get_post_field('post_date', $tarea->ID);
        }
        $timestamp = $fechaGmt ? strtotime($fechaGmt . ' UTC') : time();
    }

    $inicioUtc = get_post_meta($tarea->ID, 'logicInicioUtc', true);
    if (empty($inicioUtc)) {
        $inicioUtc = gmdate('Y-m-d H:i:s', $timestamp);
    }

    $pausado = (bool) get_post_meta($tarea->ID, 'logicPausado', true);
    $pausadoElapsed = (int) get_post_meta($tarea->ID, 'logicPausadoElapsed', true);

    $elapsed = $pausado
        ? max(0, $pausadoElapsed)
        : max(0, time() - $timestamp);

    return [
        'id'               => $tarea->ID,
        'titulo'           => $tarea->post_title,
        'inicioUtc'        => $inicioUtc,
        'inicioTimestamp'  => $timestamp,
        'elapsedSeconds'   => $elapsed,
        'elapsedLabel'     => logicFormatDuration($elapsed),
        'pausado'          => $pausado,
        'createdUtc'       => get_post_meta($tarea->ID, 'logicCreadoUtc', true) ?: $inicioUtc,
        'finishedUtc'      => get_post_meta($tarea->ID, 'logicFinUtc', true) ?: null,
        'timeline'         => logicGetTimeline($tarea->ID),
    ];
}

function logicGetActiveTasksData(int $usuarioId): array
{
    $tareas = logicFetchActiveTasks($usuarioId);
    if (empty($tareas)) {
        return [];
    }
    return array_map('logicBuildTaskPayload', $tareas);
}

function logicBuildResponse(int $usuarioId): array
{
    $tasks = logicGetActiveTasksData($usuarioId);
    return [
        'tasks'         => $tasks,
        'limit'         => GLORY_LOGIC_MAX_STEPS,
        'limitReached'  => count($tasks) >= GLORY_LOGIC_MAX_STEPS,
    ];
}

function logicFinalizeTask(\WP_Post $tarea, int $usuarioId): void
{
    $ahora = current_time('timestamp', true);
    update_post_meta($tarea->ID, 'estado', 'completada');
    update_post_meta($tarea->ID, 'logicFinTimestamp', $ahora);
    update_post_meta($tarea->ID, 'logicFinUtc', gmdate('Y-m-d H:i:s', $ahora));
    delete_post_meta($tarea->ID, 'logicPausado');
    delete_post_meta($tarea->ID, 'logicPausadoElapsed');

    $inicio = (int) get_post_meta($tarea->ID, 'logicInicioTimestamp', true);
    $elapsed = max(0, $ahora - ($inicio ?: $ahora));
    logicAppendTimeline($tarea->ID, 'finalizado', ['elapsedSeconds' => $elapsed]);

    logicRemoveTaskFromOrder($usuarioId, (int) $tarea->ID);
}

function logicStartStepForUser(int $usuarioId, string $titulo)
{
    $titulo = sanitize_text_field($titulo);
    if ($titulo === '') {
        return new \WP_Error('logic_step_empty', 'Describe el paso antes de fijarlo.', ['status' => 400]);
    }

    if (logicCountActiveTasks($usuarioId) >= GLORY_LOGIC_MAX_STEPS) {
        return new \WP_Error(
            'logic_step_limit',
            sprintf('Solo puedes fijar %d pasos activos a la vez.', GLORY_LOGIC_MAX_STEPS),
            ['status' => 409]
        );
    }

    $inicioTimestamp = current_time('timestamp', true);
    $inicioUtc = gmdate('Y-m-d H:i:s', $inicioTimestamp);
    $metaInput = [
        'importancia'          => 'importante',
        'impnum'               => 4,
        'tipo'                 => 'una vez',
        'tipnum'               => 1,
        'estado'               => 'pendiente',
        'sesion'               => 'logic',
        'logicCreadoUtc'       => $inicioUtc,
        'logicCreadoTimestamp' => $inicioTimestamp,
        'logicInicioUtc'       => $inicioUtc,
        'logicInicioTimestamp' => $inicioTimestamp,
    ];

    $postId = wp_insert_post([
        'post_title'  => $titulo,
        'post_type'   => 'tarea',
        'post_status' => 'publish',
        'post_author' => $usuarioId,
        'meta_input'  => $metaInput,
    ], true);

    if (is_wp_error($postId)) {
        return new \WP_Error('logic_step_create_failed', 'No pude crear la tarea Logic.', ['status' => 500]);
    }

    logicAppendTimeline((int) $postId, 'creado', ['titulo' => $titulo]);
    logicAppendTimeline((int) $postId, 'inicio', []);

    $orden = logicGetUserOrder($usuarioId);
    array_unshift($orden, (int) $postId);
    logicSaveUserOrder($usuarioId, $orden);

    return true;
}

function logicFinishStepForUser(int $usuarioId, int $taskId = 0)
{
    $tareas = logicFetchActiveTasks($usuarioId);
    $objetivo = null;

    if ($taskId > 0) {
        foreach ($tareas as $tarea) {
            if ((int) $tarea->ID === $taskId) {
                $objetivo = $tarea;
                break;
            }
        }
    } else {
        $objetivo = $tareas[0] ?? null;
    }

    if (!$objetivo instanceof \WP_Post) {
        return new \WP_Error('logic_step_missing', 'No encuentro el paso seleccionado.', ['status' => 404]);
    }

    logicFinalizeTask($objetivo, $usuarioId);

    return true;
}

function logicPauseStepForUser(int $usuarioId, int $taskId)
{
    if ($taskId <= 0) {
        return new \WP_Error('logic_step_invalid', 'Selecciona el paso que quieres pausar.', ['status' => 400]);
    }

    $tarea = logicFindActiveTask($usuarioId, $taskId);
    if (!$tarea instanceof \WP_Post) {
        return new \WP_Error('logic_step_pause_missing', 'No pude pausar ese paso.', ['status' => 404]);
    }

    $yaPausado = (bool) get_post_meta($tarea->ID, 'logicPausado', true);
    if ($yaPausado) {
        return new \WP_Error('logic_step_already_paused', 'El paso ya está en pausa.', ['status' => 409]);
    }

    $inicio = (int) get_post_meta($tarea->ID, 'logicInicioTimestamp', true);
    if ($inicio <= 0) {
        $inicio = current_time('timestamp', true);
    }

    $ahora = current_time('timestamp', true);
    $elapsed = max(0, $ahora - $inicio);

    update_post_meta($tarea->ID, 'logicPausado', 1);
    update_post_meta($tarea->ID, 'logicPausadoElapsed', $elapsed);
    logicAppendTimeline($tarea->ID, 'pausado', ['elapsedSeconds' => $elapsed]);

    return true;
}

function logicResumeStepForUser(int $usuarioId, int $taskId)
{
    if ($taskId <= 0) {
        return new \WP_Error('logic_step_invalid', 'Selecciona el paso que quieres reanudar.', ['status' => 400]);
    }

    $tarea = logicFindActiveTask($usuarioId, $taskId);
    if (!$tarea instanceof \WP_Post) {
        return new \WP_Error('logic_step_resume_missing', 'No pude reanudar ese paso.', ['status' => 404]);
    }

    $pausado = (bool) get_post_meta($tarea->ID, 'logicPausado', true);
    $acumulado = (int) get_post_meta($tarea->ID, 'logicPausadoElapsed', true);
    if (!$pausado) {
        return new \WP_Error('logic_step_not_paused', 'El paso no está en pausa.', ['status' => 409]);
    }

    $ahora = current_time('timestamp', true);
    $nuevoInicio = max(0, $ahora - $acumulado);

    update_post_meta($tarea->ID, 'logicInicioTimestamp', $nuevoInicio);
    update_post_meta($tarea->ID, 'logicInicioUtc', gmdate('Y-m-d H:i:s', $nuevoInicio));
    update_post_meta($tarea->ID, 'logicPausado', 0);
    update_post_meta($tarea->ID, 'logicPausadoElapsed', 0);
    logicAppendTimeline($tarea->ID, 'continuado', ['elapsedSeconds' => $acumulado]);

    return true;
}

function logicDeleteStepForUser(int $usuarioId, int $taskId)
{
    if ($taskId <= 0) {
        return new \WP_Error('logic_step_invalid', 'Selecciona el paso que quieres eliminar.', ['status' => 400]);
    }

    $tarea = logicFindActiveTask($usuarioId, $taskId);
    if (!$tarea instanceof \WP_Post) {
        return new \WP_Error('logic_step_delete_missing', 'No pude eliminar ese paso.', ['status' => 404]);
    }

    wp_trash_post($tarea->ID);
    logicRemoveTaskFromOrder($usuarioId, (int) $tarea->ID);

    return true;
}
