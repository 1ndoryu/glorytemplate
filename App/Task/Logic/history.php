<?php

function logicFetchHistoryEntries(int $usuarioId, int $limite = GLORY_LOGIC_HISTORY_LIMIT): array
{
    if ($usuarioId <= 0) {
        return [];
    }

    $limite = max(1, min($limite, 100));
    $entradas = get_posts([
        'post_type'      => 'tarea',
        'post_status'    => ['publish'],
        'posts_per_page' => $limite,
        'author'         => $usuarioId,
        'orderby'        => 'meta_value_num',
        'meta_key'       => 'logicFinTimestamp',
        'order'          => 'DESC',
        'meta_query'     => [
            'relation' => 'AND',
            [
                'key'   => 'sesion',
                'value' => 'logic',
            ],
            [
                'key'   => 'estado',
                'value' => 'completada',
            ],
        ],
    ]);

    if (empty($entradas)) {
        return [];
    }

    return array_map('logicBuildHistoryPayload', $entradas);
}

function logicBuildHistoryPayload(\WP_Post $tarea): array
{
    $inicioTimestamp = (int) get_post_meta($tarea->ID, 'logicInicioTimestamp', true);
    $finTimestamp = (int) get_post_meta($tarea->ID, 'logicFinTimestamp', true);

    if ($inicioTimestamp <= 0) {
        $fechaGmt = get_post_field('post_date_gmt', $tarea->ID);
        if (!$fechaGmt || $fechaGmt === '0000-00-00 00:00:00') {
            $fechaGmt = get_post_field('post_date', $tarea->ID);
        }
        $inicioTimestamp = $fechaGmt ? strtotime($fechaGmt . ' UTC') : time();
    }

    if ($finTimestamp <= 0) {
        $finTimestamp = $inicioTimestamp;
    }

    $duracion = max(0, $finTimestamp - $inicioTimestamp);

    return [
        'id'                 => $tarea->ID,
        'titulo'             => $tarea->post_title,
        'inicioUtc'          => get_post_meta($tarea->ID, 'logicInicioUtc', true) ?: gmdate('Y-m-d H:i:s', $inicioTimestamp),
        'inicioTimestamp'    => $inicioTimestamp,
        'finUtc'             => get_post_meta($tarea->ID, 'logicFinUtc', true) ?: gmdate('Y-m-d H:i:s', $finTimestamp),
        'finTimestamp'       => $finTimestamp,
        'duracionSegundos'   => $duracion,
        'duracionLabel'      => logicFormatDuration($duracion),
        'timeline'           => logicGetTimeline($tarea->ID),
    ];
}

function logicDeleteHistoryEntry(int $usuarioId, int $historialId): void
{
    if ($usuarioId <= 0 || $historialId <= 0) {
        return;
    }

    $tarea = get_post($historialId);
    if (!$tarea instanceof \WP_Post) {
        return;
    }

    if ((int) $tarea->post_author !== $usuarioId || $tarea->post_type !== 'tarea') {
        return;
    }

    $sesion = get_post_meta($tarea->ID, 'sesion', true);
    $estado = get_post_meta($tarea->ID, 'estado', true);

    if ($sesion !== 'logic' || $estado !== 'completada') {
        return;
    }

    wp_trash_post($tarea->ID);
}




