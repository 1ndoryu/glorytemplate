<?php



if (\Glory\Core\GloryFeatures::isActive('task') === false) { return; }
function ordenamientoTareas($queryArgs, $usu, $args, $prioridad = false)
{
    // Hacer función independiente: normalizar entradas y permitir control por $args
    if (!is_array($queryArgs)) $queryArgs = [];
    if (!is_array($args)) $args = [];
    $usu = intval($usu) ?: get_current_user_id();

    // Permite activar ordenamiento por prioridad desde $args['prioridad'] o parámetro explícito
    $usarPrioridad = (isset($args['prioridad']) ? (bool)$args['prioridad'] : (bool)$prioridad);
    if ($usarPrioridad) {
        return ordenamientoTareasPorPrioridad($queryArgs, $usu);
    }

    $ordenarServidor = false; // Mantener falso: orden usa post__in desde meta de usuario

    $orden = get_user_meta($usu, 'ordenTareas', true);
    $log = "ordenamientoTareas usu: $usu";

    if (!is_array($orden)) {
        $orden = [];
    }

    if (!$ordenarServidor) {
        $log .= ", ordenMetaInicialCant: " . count($orden);
        $todasTareasArgs = [
            'post_type'      => 'tarea',
            'author'         => $usu,
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ];
        $todasTareas = get_posts($todasTareasArgs);
        $log .= ", todasTareasCant: " . count($todasTareas);

        $ordenValido = array_intersect($orden, $todasTareas);
        $log .= ", ordenValidoCant: " . count($ordenValido);

        $faltantes = array_diff($todasTareas, $ordenValido);
        $log .= ", faltantesEnOrdenCant: " . count($faltantes);

        // Mantener el orden guardado del usuario y agregar faltantes al final
        $ordenFinal = array_merge($ordenValido, $faltantes);
        $log .= ", ordenConsolidadoCant: " . count($ordenFinal);

        $ordenFinalReordenado = [];
        $subtareasOrdenadas = []; // Para rastrear las subtareas ya colocadas por su padre

        foreach ($ordenFinal as $tareaId) {
            $tarea = get_post($tareaId);
            if (!$tarea) continue; // Por si la tarea fue eliminada mientras tanto

            // Si es una tarea padre (o una subtarea que ya fue procesada por su padre y está en $subtareasOrdenadas)
            if ($tarea->post_parent == 0) {
                if (in_array($tareaId, $ordenFinalReordenado)) continue; // Ya añadida
                $ordenFinalReordenado[] = $tareaId;

                $subtareas = get_children([
                    'post_parent' => $tareaId,
                    'post_type'   => 'tarea',
                    'fields'      => 'ids',
                    'posts_per_page' => -1, // Asegurar traer todas las subtareas
                ]);

                if (!empty($subtareas)) {
                    $log .= ", padre $tareaId tieneSubtareas: " . implode(',', $subtareas);
                    // Subtareas que ya estaban en el orden del usuario, mantener su orden relativo
                    $subtareasExistentesEnOrden = array_intersect($ordenFinal, $subtareas);
                    // Subtareas que no estaban en el orden (nuevas o descolocadas)
                    $subtareasNuevasOTras = array_diff($subtareas, $subtareasExistentesEnOrden);
                    
                    $subtareasParaAgregar = array_merge($subtareasExistentesEnOrden, $subtareasNuevasOTras);

                    foreach ($subtareasParaAgregar as $subtareaId) {
                        if (!in_array($subtareaId, $ordenFinalReordenado)) { // Evitar duplicados
                           $ordenFinalReordenado[] = $subtareaId;
                        }
                        $subtareasOrdenadas[] = $subtareaId; // Marcar como procesada
                    }
                }
            } else if (!in_array($tareaId, $subtareasOrdenadas)) {
                // Es una subtarea, pero no fue procesada por su padre (quizás el padre no está en $ordenFinal o viene después).
                // O es una subtarea "huérfana" (padre eliminado o no accesible).
                // La añadimos para que no se pierda, aunque podría no estar junto a su padre si este se procesa después.
                // Esta situación debería minimizarse si el orden es generalmente coherente.
                if (in_array($tareaId, $ordenFinalReordenado)) continue; // Ya añadida de alguna forma
                $log .= ", subtareaHuerfanaOAdelantada $tareaId (padre {$tarea->post_parent})";
                $ordenFinalReordenado[] = $tareaId;
            }
        }
        // Asegurarse de que no haya duplicados al final
        $ordenFinalReordenado = array_values(array_unique($ordenFinalReordenado));
        $log .= ", ordenFinalReordenadoCant: " . count($ordenFinalReordenado);
        
        if ($ordenFinalReordenado !== $orden || count($ordenFinalReordenado) !== count($orden)) { // Comparar también cantidad
            update_user_meta($usu, 'ordenTareas', $ordenFinalReordenado);
            $log .= ", ordenMetaActualizado";
        } else {
            $log .= ", ordenMetaNoCambio";
        }

        $queryArgs['post__in'] = !empty($ordenFinalReordenado) ? $ordenFinalReordenado : [0]; // Evitar error con array vacío
        // No forzamos orderby aquí si el llamador decide otra cosa, pero por defecto usamos post__in
        if (empty($queryArgs['orderby'])) {
            $queryArgs['orderby'] = 'post__in';
        }
    } else {
        // Esta rama no se ejecuta si $ordenarServidor siempre es false.
        // Si se implementara, debería retornar $queryArgs modificado o no.
        $log .= ", ordenamientoServidorActivoRetornandoOriginal";
        // return $queryArgs; // Comentado para que siempre se ejecute la lógica principal
    }

    guardarLog($log);
    return $queryArgs;
}


// Refactor(Org): Funcion ordenamientoTareasPorPrioridad() movida desde app/Services/TaskService.php
function ordenamientoTareasPorPrioridad($queryArgs, $usu)
{
    $logPartes = [];
    $logPartes[] = "ordenamientoTareasPorPrioridad usu: $usu";

    // Obtener todas las tareas del usuario
    $todas = get_posts([
        'post_type'      => 'tarea',
        'author'         => $usu,
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ]);
    if (empty($todas)) {
        $logPartes[] = 'sinTareas';
        guardarLog(implode(', ', $logPartes));
        return $queryArgs;
    }

    // Clasificar por estado
    $pendientes = [];
    $noPendientes = [];
    foreach ($todas as $id) {
        $estado = strtolower((string) get_post_meta($id, 'estado', true));
        if ($estado === 'pendiente') { $pendientes[] = $id; } else { $noPendientes[] = $id; }
    }

    // Utilidades para obtener impnum y dif (con valores por defecto)
    $imp = function($id) {
        $v = get_post_meta($id, 'impnum', true);
        if (is_numeric($v)) return (int) $v;
        // Fallback: mapear la cadena 'importancia' si 'impnum' no existe
        $impStr = strtolower((string) get_post_meta($id, 'importancia', true));
        $mapa = [
            'importante' => 4,
            'alta'       => 3,
            'media'      => 2,
            'baja'       => 1,
        ];
        return isset($mapa[$impStr]) ? $mapa[$impStr] : 0;
    };
    $dif = function($id) { $v = get_post_meta($id, 'dif', true); return (int) (is_numeric($v) ? $v : 0); };
    $tipo = function($id) { return strtolower((string) get_post_meta($id, 'tipo', true)); };

    // Ordenar padres por prioridad (impnum DESC), tie-breaker para hábitos por dif ASC
    $ordenarGrupo = function(array $ids) use ($imp, $dif, $tipo) {
        // Construir mapa padre->hijos y lista de huérfanas
        $padres = [];
        $huerfanas = [];
        foreach ($ids as $id) {
            $post = get_post($id);
            if (!$post) continue;
            if ((int)$post->post_parent === 0) {
                $padres[$id] = $padres[$id] ?? [];
            } else {
                $pp = (int)$post->post_parent;
                if (!array_key_exists($pp, $padres)) {
                    // Padre puede no estar en la lista filtrada; se tratará la subtarea como huérfana
                    $huerfanas[] = $id;
                } else {
                    $padres[$pp][] = $id;
                }
            }
        }

        // Rellenar hijos para padres que sí están en $ids pero aún no fueron listados
        foreach (array_keys($padres) as $pid) {
            $hijos = get_children([
                'post_parent' => $pid,
                'post_type'   => 'tarea',
                'fields'      => 'ids',
                'posts_per_page' => -1,
            ]);
            if ($hijos) {
                foreach ($hijos as $hid) {
                    if (in_array($hid, $ids, true) && !in_array($hid, $padres[$pid] ?? [], true)) {
                        $padres[$pid][] = $hid;
                    }
                }
            }
        }

        // Ordenar lista de padres por prioridad
        $listaPadres = array_keys($padres);
        usort($listaPadres, function($a, $b) use ($imp, $dif, $tipo) {
            $impA = $imp($a); $impB = $imp($b);
            if ($impA !== $impB) return $impB <=> $impA; // DESC
            $esHabA = in_array($tipo($a), ['habito', 'habito rigido'], true);
            $esHabB = in_array($tipo($b), ['habito', 'habito rigido'], true);
            if ($esHabA && $esHabB) { return $dif($a) <=> $dif($b); } // ASC para tie habits
            return 0;
        });

        $resultado = [];
        foreach ($listaPadres as $pid) {
            $resultado[] = $pid; // padre primero
            $hijos = $padres[$pid] ?? [];
            // Ordenar hijos por impnum DESC, tie habits por dif ASC
            usort($hijos, function($a, $b) use ($imp, $dif, $tipo) {
                $impA = $imp($a); $impB = $imp($b);
                if ($impA !== $impB) return $impB <=> $impA;
                $esHabA = in_array($tipo($a), ['habito', 'habito rigido'], true);
                $esHabB = in_array($tipo($b), ['habito', 'habito rigido'], true);
                if ($esHabA && $esHabB) { return $dif($a) <=> $dif($b); }
                return 0;
            });
            foreach ($hijos as $hid) { $resultado[] = $hid; }
        }

        // Añadir huérfanas al final del grupo (ordenadas por impnum DESC)
        if (!empty($huerfanas)) {
            usort($huerfanas, function($a, $b) use ($imp) { return $imp($b) <=> $imp($a); });
            foreach ($huerfanas as $hid) { $resultado[] = $hid; }
        }

        // Eliminar duplicados por si algún hijo se añadió dos veces
        return array_values(array_unique($resultado));
    };

    $ordenPend = $ordenarGrupo($pendientes);
    $ordenNoPend = $ordenarGrupo($noPendientes);
    $ordenFinal = array_merge($ordenPend, $ordenNoPend);

    update_user_meta($usu, 'ordenTareas', $ordenFinal);
    $logPartes[] = 'ordenTareasActualizadoCant: ' . count($ordenFinal);
    guardarLog(implode(', ', $logPartes));

    $queryArgs['post__in'] = !empty($ordenFinal) ? $ordenFinal : [0];
    $queryArgs['orderby'] = 'post__in';
    unset($queryArgs['meta_key']);
    unset($queryArgs['meta_query']);
    return $queryArgs;
}




function actualizarOrden($ordenTar, $ordenNue) // $ordenTar (anterior) no se usa actualmente en esta función
{
    $usu = get_current_user_id();
    // Podrías loguear $ordenTar aquí si quisieras comparar el antes y el después en este log específico.
    $log = "actualizarOrden usu:$usu, ordenAnteriorCant:" . (is_array($ordenTar) ? count($ordenTar) : 'N/A');
    
    update_user_meta($usu, 'ordenTareas', $ordenNue);
    $log .= ", ordenNuevoGuardadoCant:" . count($ordenNue);

    guardarLog($log);
    return $ordenNue;
}



function actualizarOrdenTareasGrupo()
{
    $usu = get_current_user_id();
    $log = "actualizarOrdenTareasGrupo usu:$usu";

    $tareasMovIdsInput = isset($_POST['tareasMovidas']) ? $_POST['tareasMovidas'] : null;
    $ordenNueInput = isset($_POST['ordenNuevo']) ? $_POST['ordenNuevo'] : null;

    $log .= ", tareasMovInput:" . var_export($tareasMovIdsInput, true);
    $log .= ", ordenNueInput:" . var_export($ordenNueInput, true);

    $tareasMovIds = [];
    if (is_array($tareasMovIdsInput)) {
        $tareasMovIds = array_map('intval', $tareasMovIdsInput);
    } elseif (is_string($tareasMovIdsInput) && !empty($tareasMovIdsInput)) {
        $tareasMovIds = array_map('intval', explode(',', $tareasMovIdsInput));
    }

    $ordenNue = [];
    if (is_array($ordenNueInput)) {
        $ordenNue = array_map('intval', $ordenNueInput);
    } elseif (is_string($ordenNueInput) && !empty($ordenNueInput)) {
        $ordenNue = array_map('intval', explode(',', $ordenNueInput));
    }

    $log .= ", tareasMovFinal:" . implode(',', $tareasMovIds) . ", ordenNueFinal:" . implode(',', $ordenNue);

    if (empty($tareasMovIds) || empty($ordenNue)) {
        $log .= ", error:datosInsuficientes";
        guardarLog($log);
        wp_send_json_error(['error' => 'Datos insuficientes para actualizar el orden del grupo.'], 400);
        return;
    }
    
    $ordenTarMetaAnterior = get_user_meta($usu, 'ordenTareas', true) ?: [];
    actualizarOrden($ordenTarMetaAnterior, $ordenNue); // $ordenTarMetaAnterior se pasa pero no se usa dentro de actualizarOrden
    
    // Verificar si el cambio fue efectivo (opcional, para log)
    $ordenTarMetaPosterior = get_user_meta($usu, 'ordenTareas', true) ?: [];
    if ($ordenTarMetaPosterior === $ordenNue) {
        $log .= ", exito:ordenMetaCoincideConOrdenNuevo";
    } else {
        $log .= ", advertencia:ordenMetaNoCoincideTrasActualizar";
        $log .= ", metaPosterior: " . implode(',', $ordenTarMetaPosterior);
    }

    guardarLog($log);
    wp_send_json_success(['mensaje' => 'Orden de grupo de tareas actualizado.', 'ordenGuardado' => $ordenNue]);
}
add_action('wp_ajax_actualizarOrdenTareasGrupo', 'actualizarOrdenTareasGrupo');
add_action('wp_ajax_nopriv_actualizarOrdenTareasGrupo', 'actualizarOrdenTareasGrupo');

function actualizarOrdenTareas()
{
    $usu = get_current_user_id();
    $tareaMov = isset($_POST['tareaMovida']) ? intval($_POST['tareaMovida']) : null;
    $ordenNueInput = isset($_POST['ordenNuevo']) ? $_POST['ordenNuevo'] : ""; // Default a string vacío para explode
    $ordenNue = array_map('intval', array_filter(explode(',', $ordenNueInput))); // array_filter para quitar vacíos si el string es ""

    $sesionArr = isset($_POST['sesionArriba']) ? strtolower(sanitize_text_field($_POST['sesionArriba'])) : null;
    $esSubtareaCliente = isset($_POST['subtarea']) ? $_POST['subtarea'] === 'true' : false;
    $padreCliente = isset($_POST['padre']) ? intval($_POST['padre']) : 0;

    $ordenTarAnt = get_user_meta($usu, 'ordenTareas', true) ?: [];

    $log = "actualizarOrdenTareas usu:$usu, tareaMov:$tareaMov, ordenNueRecibido:" . $ordenNueInput;
    $log .= ", ordenAntCant:" . count($ordenTarAnt) . ", sesionArr:$sesionArr, esSubtareaCliente:$esSubtareaCliente, padreCliente:$padreCliente";

    if ($tareaMov !== null && !empty($ordenNue)) {
        $logManejoSubtarea = "";
        if ($esSubtareaCliente) { // Cliente indica que $tareaMov debería ser subtarea de $padreCliente
            $logManejoSubtarea = manejarSubtarea($tareaMov, $padreCliente);
        } else { // Cliente indica que $tareaMov debería ser tarea principal
            $tareaObj = get_post($tareaMov);
            // Solo convertir a principal si actualmente tiene un padre
            if ($tareaObj && ($tareaObj->post_parent != 0 || get_post_meta($tareaMov, 'subtarea', true))) {
                $logManejoSubtarea = manejarSubtarea($tareaMov, 0); // 0 para convertir en tarea principal
            } else {
                $logManejoSubtarea = "tareaYaEsPrincipalONoRequiereCambioParent";
            }
        }
        $log .= ", manejoSubtareaLog:'$logManejoSubtarea'";
        
        $ordenTarActualizado = actualizarOrden($ordenTarAnt, $ordenNue);
        actualizarSeccionEstado($tareaMov, $sesionArr);
        
        $log .= ", ordenActualizadoExitoso";
        guardarLog($log);
        wp_send_json_success(['ordenTareas' => $ordenTarActualizado]);
    } else {
        $log .= ", error:datosInsuficientes (tareaMov:$tareaMov, ordenNueCant:" . count($ordenNue) . ")";
        guardarLog($log);
        wp_send_json_error(['error' => 'Falta información para actualizar el orden de tareas.'], 400);
    }
}
add_action('wp_ajax_actualizarOrdenTareas', 'actualizarOrdenTareas');
add_action('wp_ajax_nopriv_actualizarOrdenTareas', 'actualizarOrdenTareas');

function priorizarTareasBackend()
{
    $usu = get_current_user_id();
    $log = "priorizarTareasBackend usu:$usu";

    // Obtener orden resultante con prioridad
    $queryArgsPrior = ordenamientoTareasPorPrioridad([], $usu);

    // Persistir orden (ya lo hace ordenamientoTareasPorPrioridad via update_user_meta)
    $nuevoOrden = isset($queryArgsPrior['post__in']) && is_array($queryArgsPrior['post__in']) ? $queryArgsPrior['post__in'] : [];
    if (!empty($nuevoOrden)) {
        update_user_meta($usu, 'ordenTareas', $nuevoOrden);
        $log .= ", ordenGuardadoCant:" . count($nuevoOrden);
    } else {
        $log .= ", sinOrdenNuevo";
    }

    if (function_exists('guardarLog')) guardarLog($log);
    wp_send_json_success(['orden' => $nuevoOrden]);
}
add_action('wp_ajax_priorizarTareas', 'priorizarTareasBackend');
add_action('wp_ajax_nopriv_priorizarTareas', 'priorizarTareasBackend');

?>