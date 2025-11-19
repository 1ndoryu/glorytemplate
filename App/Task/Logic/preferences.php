<?php

function logicGetDefaultHabits(): array
{
    return GLORY_LOGIC_DEFAULT_HABITS;
}

function logicNormalizeHabit(string $valor): string
{
    return trim(sanitize_text_field($valor));
}

function logicPersistQuickHabits(int $usuarioId, array $habitos): array
{
    $limpios = array_values(array_filter(array_unique(array_map(static function ($valor) {
        return logicNormalizeHabit((string) $valor);
    }, $habitos))));

    if (empty($limpios)) {
        $limpios = logicGetDefaultHabits();
    }

    $limpios = array_slice($limpios, 0, 12);
    update_user_meta($usuarioId, 'logic_quick_habits', $limpios);

    return $limpios;
}

function logicGetQuickHabits(int $usuarioId): array
{
    if ($usuarioId <= 0) {
        return logicGetDefaultHabits();
    }

    $habitos = get_user_meta($usuarioId, 'logic_quick_habits', true);
    if (!is_array($habitos)) {
        $habitos = [];
    }

    return logicPersistQuickHabits($usuarioId, $habitos);
}

function logicAddQuickHabit(int $usuarioId, string $titulo): array
{
    $titulo = logicNormalizeHabit($titulo);
    if ($titulo === '') {
        return logicGetQuickHabits($usuarioId);
    }

    $habitos = logicGetQuickHabits($usuarioId);
    if (!in_array($titulo, $habitos, true)) {
        $habitos[] = $titulo;
        $habitos = logicPersistQuickHabits($usuarioId, $habitos);
    }

    return $habitos;
}

function logicRemoveQuickHabit(int $usuarioId, string $titulo)
{
    if ($usuarioId <= 0) {
        return new \WP_Error('logic_habit_user', 'Usuario inválido.');
    }

    $titulo = logicNormalizeHabit($titulo);
    if ($titulo === '') {
        return new \WP_Error('logic_habit_empty', 'Selecciona un hábito.');
    }

    $habitos = logicGetQuickHabits($usuarioId);
    if (!in_array($titulo, $habitos, true)) {
        return new \WP_Error('logic_habit_missing', 'No encuentro ese hábito.');
    }

    $filtrados = array_values(array_filter($habitos, static function ($valor) use ($titulo) {
        return $valor !== $titulo;
    }));

    return logicPersistQuickHabits($usuarioId, $filtrados);
}

function logicRenameQuickHabit(int $usuarioId, string $anterior, string $nuevo)
{
    if ($usuarioId <= 0) {
        return new \WP_Error('logic_habit_user', 'Usuario inválido.');
    }

    $anterior = logicNormalizeHabit($anterior);
    $nuevo = logicNormalizeHabit($nuevo);

    if ($anterior === '' || $nuevo === '') {
        return new \WP_Error('logic_habit_empty', 'Completa el nombre del hábito.');
    }

    $habitos = logicGetQuickHabits($usuarioId);
    $indice = array_search($anterior, $habitos, true);
    if ($indice === false) {
        return new \WP_Error('logic_habit_missing', 'No encuentro ese hábito.');
    }

    if ($anterior === $nuevo) {
        return $habitos;
    }

    if (in_array($nuevo, $habitos, true)) {
        return new \WP_Error('logic_habit_duplicate', 'Ya guardaste un hábito con ese nombre.');
    }

    $habitos[$indice] = $nuevo;

    return logicPersistQuickHabits($usuarioId, $habitos);
}

function logicGetHelpMessage(int $usuarioId): array
{
    if ($usuarioId <= 0) {
        return [];
    }

    $mensaje = get_user_meta($usuarioId, 'logic_help_message', true);
    if (!is_array($mensaje) || empty($mensaje['texto'])) {
        delete_user_meta($usuarioId, 'logic_help_message');
        return [];
    }

    $texto = sanitize_text_field((string) $mensaje['texto']);
    $hasta = isset($mensaje['hasta']) ? (int) $mensaje['hasta'] : 0;
    if ($hasta > 0 && time() > $hasta) {
        delete_user_meta($usuarioId, 'logic_help_message');
        return [];
    }

    return [
        'texto'                 => $texto,
        'visibleHastaUtc'       => $hasta > 0 ? gmdate('Y-m-d H:i:s', $hasta) : null,
        'visibleHastaTimestamp' => $hasta > 0 ? $hasta : null,
        'duracionSegundos'      => isset($mensaje['duracion']) ? (int) $mensaje['duracion'] : null,
    ];
}

function logicSaveHelpMessage(int $usuarioId, string $texto, int $duracionSegundos): array
{
    if ($usuarioId <= 0) {
        return [];
    }

    $texto = trim(wp_strip_all_tags($texto));
    $duracionSegundos = max(0, (int) $duracionSegundos);

    if ($texto === '' || $duracionSegundos === 0) {
        delete_user_meta($usuarioId, 'logic_help_message');
        return [];
    }

    $duracionSegundos = max(60, min($duracionSegundos, DAY_IN_SECONDS));
    $expira = time() + $duracionSegundos;

    update_user_meta($usuarioId, 'logic_help_message', [
        'texto'    => $texto,
        'hasta'    => $expira,
        'duracion' => $duracionSegundos,
    ]);

    return logicGetHelpMessage($usuarioId);
}

