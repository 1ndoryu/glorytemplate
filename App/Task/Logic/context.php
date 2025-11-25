<?php

/**
 * Logic Context
 *
 * Gestión de bloques de contexto (notas/textos) en la pestaña "Contexto".
 * Usa post_type 'tarea' con meta 'sesion' = 'logic_context'.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Obtiene los contextos del usuario, ordenados según su preferencia.
 * Los contextos fijados aparecen siempre primero.
 *
 * @param int $userId
 * @param int $limit Límite de contextos a retornar (default: 10, -1 para todos)
 * @param int|null $dateFrom Timestamp desde el cual filtrar (fecha creación >= dateFrom)
 * @param int|null $dateTo Timestamp hasta el cual filtrar (fecha creación <= dateTo)
 * @return array
 */
function logicGetContexts($userId, $limit = 30, $dateFrom = null, $dateTo = null)
{
    $metaQuery = [
        [
            'key'   => 'sesion',
            'value' => 'logic_context',
        ],
    ];

    // Filtro por fecha desde
    if ($dateFrom !== null && $dateFrom > 0) {
        $metaQuery[] = [
            'key'     => 'logic_context_created',
            'value'   => $dateFrom,
            'compare' => '>=',
            'type'    => 'NUMERIC',
        ];
    }

    // Filtro por fecha hasta
    if ($dateTo !== null && $dateTo > 0) {
        $metaQuery[] = [
            'key'     => 'logic_context_created',
            'value'   => $dateTo,
            'compare' => '<=',
            'type'    => 'NUMERIC',
        ];
    }

    $args = [
        'post_type'   => 'tarea',
        'post_status' => 'publish',
        'author'      => $userId,
        'numberposts' => -1,
        'meta_query'  => $metaQuery,
        'orderby'     => 'date',
        'order'       => 'DESC',
    ];

    $posts = get_posts($args);
    $pinnedContexts = [];
    $normalContexts = [];

    foreach ($posts as $p) {
        $creado = get_post_meta($p->ID, 'logic_context_created', true);
        $editado = get_post_meta($p->ID, 'logic_context_updated', true);
        $pinned = (bool) get_post_meta($p->ID, 'logic_context_pinned', true);
        
        $ctx = [
            'id'           => $p->ID,
            'texto'        => $p->post_title,
            'creado'       => $creado,
            'editado'      => $editado,
            'pinned'       => $pinned,
            'creadoLabel'  => date_i18n('d M Y H:i', $creado),
            'editadoLabel' => date_i18n('d M Y H:i', $editado),
        ];
        
        if ($pinned) {
            $pinnedContexts[] = $ctx;
        } else {
            $normalContexts[] = $ctx;
        }
    }

    // Aplicar límite solo a los no fijados (los fijados siempre se muestran)
    if ($limit > 0) {
        $normalContexts = array_slice($normalContexts, 0, $limit);
    }

    // Combinar: fijados primero, luego normales (limitados)
    return array_merge($pinnedContexts, $normalContexts);
}

/**
 * Crea un nuevo bloque de contexto.
 *
 * @param int $userId
 * @param string $texto
 * @param bool $pinned Si el contexto debe ser fijado
 * @return array|WP_Error
 */
function logicAddContext($userId, $texto, $pinned = false)
{
    $texto = sanitize_text_field($texto);
    if (empty($texto)) {
        return new WP_Error('empty_text', 'El texto no puede estar vacío.');
    }

    $now = current_time('timestamp');

    $postId = wp_insert_post([
        'post_title'  => $texto,
        'post_type'   => 'tarea',
        'post_status' => 'publish',
        'post_author' => $userId,
        'meta_input'  => [
            'sesion'                => 'logic_context',
            'logic_context_created' => $now,
            'logic_context_updated' => $now,
            'logic_context_pinned'  => $pinned ? 1 : 0,
        ],
    ]);

    if (is_wp_error($postId)) {
        return $postId;
    }

    // Actualizar orden: ponerlo al final
    $order = get_user_meta($userId, 'logic_context_order', true);
    if (!is_array($order)) {
        $order = [];
    }
    $order[] = $postId;
    update_user_meta($userId, 'logic_context_order', $order);

    return logicGetContexts($userId);
}

/**
 * Modifica un bloque de contexto existente.
 *
 * @param int $userId
 * @param int $contextId
 * @param string $texto
 * @return array|WP_Error
 */
function logicUpdateContext($userId, $contextId, $texto)
{
    $texto = sanitize_text_field($texto);
    if (empty($texto)) {
        return new WP_Error('empty_text', 'El texto no puede estar vacío.');
    }

    $post = get_post($contextId);
    if (!$post || $post->post_author != $userId || $post->post_type !== 'tarea') {
        return new WP_Error('invalid_context', 'Contexto no válido.');
    }

    // Verificar que sea un contexto de logic
    $sesion = get_post_meta($contextId, 'sesion', true);
    if ($sesion !== 'logic_context') {
        return new WP_Error('invalid_context', 'Este item no es un contexto.');
    }

    wp_update_post([
        'ID'         => $contextId,
        'post_title' => $texto,
    ]);

    update_post_meta($contextId, 'logic_context_updated', current_time('timestamp'));

    return logicGetContexts($userId);
}

/**
 * Elimina un bloque de contexto.
 *
 * @param int $userId
 * @param int $contextId
 * @return array|WP_Error
 */
function logicDeleteContext($userId, $contextId)
{
    $post = get_post($contextId);
    if (!$post || $post->post_author != $userId) {
        return new WP_Error('invalid_context', 'Contexto no válido.');
    }

    $sesion = get_post_meta($contextId, 'sesion', true);
    if ($sesion !== 'logic_context') {
        return new WP_Error('invalid_context', 'Este item no es un contexto.');
    }

    wp_trash_post($contextId);

    // Limpiar del orden
    $order = get_user_meta($userId, 'logic_context_order', true);
    if (is_array($order)) {
        $order = array_diff($order, [$contextId]);
        update_user_meta($userId, 'logic_context_order', array_values($order));
    }

    return logicGetContexts($userId);
}

/**
 * Reordena los contextos.
 *
 * @param int $userId
 * @param array $newOrderIds
 * @return array
 */
function logicReorderContexts($userId, $newOrderIds)
{
    // Validar que los IDs pertenezcan al usuario y sean contextos
    // (Para optimizar, confiamos en que el frontend envía lo correcto, pero saneamos)
    $cleanOrder = array_map('intval', $newOrderIds);
    update_user_meta($userId, 'logic_context_order', $cleanOrder);

    return logicGetContexts($userId);
}

/**
 * Fija o desfija un contexto.
 *
 * @param int $userId
 * @param int $contextId
 * @return array|WP_Error
 */
function logicTogglePinContext($userId, $contextId)
{
    $post = get_post($contextId);
    if (!$post || $post->post_author != $userId || $post->post_type !== 'tarea') {
        return new WP_Error('invalid_context', 'Contexto no válido.');
    }

    $sesion = get_post_meta($contextId, 'sesion', true);
    if ($sesion !== 'logic_context') {
        return new WP_Error('invalid_context', 'Este item no es un contexto.');
    }

    $currentPinned = (bool) get_post_meta($contextId, 'logic_context_pinned', true);
    $newPinned = !$currentPinned;
    
    update_post_meta($contextId, 'logic_context_pinned', $newPinned ? 1 : 0);

    return logicGetContexts($userId);
}
