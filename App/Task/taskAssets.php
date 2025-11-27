<?php

add_action('wp_enqueue_scripts', function () {
    if (\Glory\Core\GloryFeatures::isActive('task')) {
        // Asegurarse de que el script handle coincida con el generado por AssetManager
        // En App/Config/assets.php: prefix 'tema-task-' + filename (sin extensión probablemente, o con ella dependiendo de la implementación)
        // Asumiremos 'tema-task-taskmove'
        
        $nonce = wp_create_nonce('borrar_tarea_nonce');
        
        wp_localize_script('tema-task-taskmove', 'task_vars', [
            'borrar_tarea_nonce' => $nonce
        ]);
    }
}, 99); // Alta prioridad para asegurar que los scripts ya estén registrados
