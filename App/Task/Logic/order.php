<?php

function logicGetUserOrder(int $usuarioId): array
{
    $orden = get_user_meta($usuarioId, 'logic_order', true);
    if (!is_array($orden)) {
        return [];
    }
    return array_values(array_unique(array_map('intval', $orden)));
}

function logicSaveUserOrder(int $usuarioId, array $orden): void
{
    $sanitizado = array_values(array_unique(array_map('intval', $orden)));
    update_user_meta($usuarioId, 'logic_order', $sanitizado);
}

function logicRemoveTaskFromOrder(int $usuarioId, int $taskId): void
{
    $orden = logicGetUserOrder($usuarioId);
    if (empty($orden)) {
        return;
    }
    $filtrado = array_values(array_filter($orden, static fn ($id) => (int) $id !== $taskId));
    logicSaveUserOrder($usuarioId, $filtrado);
}

function logicApplyOrder(array $tareas, int $usuarioId): array
{
    if (empty($tareas)) {
        logicSaveUserOrder($usuarioId, []);
        return [];
    }

    $orden = logicGetUserOrder($usuarioId);
    if (empty($orden)) {
        logicSaveUserOrder($usuarioId, wp_list_pluck($tareas, 'ID'));
        return $tareas;
    }

    $mapa = [];
    foreach ($tareas as $tarea) {
        $mapa[$tarea->ID] = $tarea;
    }

    $ordenadas = [];
    foreach ($orden as $id) {
        if (isset($mapa[$id])) {
            $ordenadas[] = $mapa[$id];
            unset($mapa[$id]);
        }
    }

    if (!empty($mapa)) {
        foreach ($tareas as $tarea) {
            if (isset($mapa[$tarea->ID])) {
                $ordenadas[] = $tarea;
                unset($mapa[$tarea->ID]);
            }
        }
    }

    logicSaveUserOrder($usuarioId, wp_list_pluck($ordenadas, 'ID'));

    return $ordenadas;
}





