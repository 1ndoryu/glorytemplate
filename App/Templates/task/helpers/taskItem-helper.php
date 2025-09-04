<?php
/**
 * taskItem-helper.php
 *
 * Funciones de ayuda para la plantilla de tareas.
 * Se encarga de toda la lógica de negocio para obtener y preparar los datos de una tarea.
 */

/**
 * Obtiene y prepara todos los datos necesarios para renderizar una tarea.
 *
 * @param int    $id     ID del post de la tarea.
 * @param string $filtro Filtro actual de la vista.
 * @return array         Array con todos los datos de la tarea listos para la plantilla.
 */
function obtenerDatosTarea(int $id, string $filtro = 'tarea'): array
{
    global $depurarTitulo;
    $depurarTitulo = false;

    $datos = [
        'id'          => $id,
        'titulo'      => get_the_title($id),
        'imp'         => get_post_meta($id, 'importancia', true) ?: 'media',
        'tipo'        => get_post_meta($id, 'tipo', true) ?: 'una vez',
        'estado'      => get_post_meta($id, 'estado', true) ?: 'pendiente',
        'frec'        => (int) (get_post_meta($id, 'frecuencia', true) ?: 1),
        'autorId'     => (int) get_post_field('post_author', $id),
        'proxima'     => get_post_meta($id, 'fechaProxima', true) ?: null,
        'fechaLimite' => get_post_meta($id, 'fechaLimite', true) ?: null,
        'sesion'      => get_post_meta($id, 'sesion', true) ?: '',
        'impnum'      => (int) (get_post_meta($id, 'impnum', true) ?: 0),
        'idPadre'     => get_post_meta($id, 'subtarea', true),
    ];

    // Lógica de filtrado
    $datos['filtroHtml'] = ($filtro === 'tareaPrioridad') ? 'tarea' : $filtro;

    // Configuración de visualización de iconos
    $mostrarIconoMeta     = get_user_meta($datos['autorId'], 'mostrarIconoTareas', true);
    $datos['mostrarIcono'] = ($mostrarIconoMeta === '') ? false : filter_var($mostrarIconoMeta, FILTER_VALIDATE_BOOLEAN);
    $datos['impIcono']     = obtenerIconoImportancia($datos['imp'], $datos['mostrarIcono']);
    $datos['tipoIcono']    = obtenerIconoTipo($datos['tipo'], $datos['mostrarIcono']);

    // Estados booleanos para simplificar la plantilla
    $datos['esCompletada'] = ($datos['estado'] === 'completada');
    $datos['esHabito']     = in_array($datos['tipo'], ['habito', 'habito rigido', 'habito flexible']);
    $datos['esMeta']       = ($datos['tipo'] === 'meta');

    // Lógica de subtareas
    $datos['tieneSubtareasIncompletas'] = false;
    $datos['idsSubtareas']              = [];
    if (!$datos['idPadre']) {
        $postTypeActual    = get_post_type($id) ?: 'post';
        $argsSubtareas     = [
            'post_type'      => $postTypeActual,
            'post_status'    => 'any',
            'meta_query'     => [
                ['key' => 'subtarea', 'value' => $id, 'compare' => '='],
                ['key' => 'estado', 'value' => ['completada', 'eliminada'], 'compare' => 'NOT IN'],
            ],
            'fields'         => 'ids',
            'posts_per_page' => -1,
            'orderby'        => 'menu_order',
            'order'          => 'ASC',
        ];
        $datos['idsSubtareas'] = get_posts($argsSubtareas);
        $datos['tieneSubtareasIncompletas'] = !empty($datos['idsSubtareas']);
    }

    // Lógica de depuración
    $datos['infoDepuracionTitulo'] = '';
    if ($depurarTitulo) {
        $partesDepuracion   = ['ID: ' . $id];
        if (!empty($datos['sesion'])) {
            $partesDepuracion[] = 'Sesión: ' . esc_html($datos['sesion']);
        }
        $datos['infoDepuracionTitulo'] = '(' . implode(' | ', $partesDepuracion) . ')';
        if ($datos['idPadre']) {
            $datos['infoDepuracionTitulo'] .= ' (Padre: ' . esc_html($datos['idPadre']) . ')';
        } elseif (!empty($datos['idsSubtareas'])) {
            $datos['infoDepuracionTitulo'] .= ' (SubT: ' . implode(', ', $datos['idsSubtareas']) . ')';
        }
    }

    // Cálculos de tiempo
    $datos['tiempoProxima']          = calcularTextoTiempo($datos['proxima']);
    $datos['tiempoLimite']           = calcularTextoTiempo($datos['fechaLimite']);
    $datos['limiteTieneTextoValido'] = !empty($datos['tiempoLimite']['txt']);
    $difDiasHabito                   = $datos['esHabito'] ? ($datos['tiempoProxima']['diasDif'] ?? 0) : 0;
    $difDiasMeta                     = $datos['esMeta'] ? ($datos['tiempoLimite']['diasDif'] ?? 0) : 0;
    $datos['difDiasActivo']          = $datos['esHabito'] ? $difDiasHabito : $difDiasMeta;


    // Lógica de sesión
    $sesionPredeterminada = ($datos['estado'] === 'archivado' ? 'Archivado' : 'General');
    $sesionValor          = empty($datos['sesion']) ? $sesionPredeterminada : $datos['sesion'];
    if (in_array(strtolower($sesionValor), ['general', 'archivado', 'archivada'])) {
        $sesionValor = ucfirst(str_replace('archivada', 'archivado', strtolower($sesionValor)));
    }
    $datos['sesionHtml'] = esc_attr($sesionValor);

    // Texto de frecuencia
    $datos['frecTxt'] = obtenerFrecuenciaTexto($datos['frec']);

    return $datos;
}

/**
 * Genera el HTML para la visualización de seguimiento de hábitos.
 *
 * @param int $id ID de la tarea.
 * @param int $frec Frecuencia del hábito.
 * @return string HTML generado.
 */
function generarVisualizacionHabito(int $id, int $frec): string
{
    $modoVisualizacionDias = 2;  // 1 para frecuencia, 2 para consecutivos
    $maxDiasMostrar        = 5;
    $hoy                   = (new DateTime())->format('Y-m-d');

    $fechasCompletado = get_post_meta($id, 'fechasCompletado', true) ?: [];
    $fechasSaltado    = get_post_meta($id, 'fechasSaltado', true) ?: [];

    $diasParaMostrar = [];

    if ($modoVisualizacionDias == 1) { // Lógica para modo frecuencia (no implementado en detalle aquí)
        $fechaActualConsiderada = new DateTime($hoy);
        for ($i = 0; $i < $maxDiasMostrar; $i++) {
            $diasParaMostrar[$fechaActualConsiderada->format('Y-m-d')] = $fechaActualConsiderada->format('Y-m-d');
            $fechaActualConsiderada->modify("-$frec days");
        }
    } else { // Modo 2: Consecutivos
        $fechaActualConsiderada = new DateTime($hoy);
        for ($i = 0; $i < $maxDiasMostrar; $i++) {
            $diasParaMostrar[$fechaActualConsiderada->format('Y-m-d')] = $fechaActualConsiderada->format('Y-m-d');
            $fechaActualConsiderada->modify('-1 day');
        }
    }
    ksort($diasParaMostrar);

    ob_start();
    if (!empty($diasParaMostrar)) {
        echo '<div class="habito-dias-visualizacion">';
        foreach ($diasParaMostrar as $fechaDia) {
            $estadoDia   = 'pendiente';
            $iconoDia    = $GLOBALS['equis'] ?? 'X';
            $claseEstado = 'estado-pendiente';

            if (in_array($fechaDia, $fechasCompletado)) {
                $estadoDia   = 'completado';
                $iconoDia    = $GLOBALS['iconoCheck1'] ?? 'V';
                $claseEstado = 'estado-completado';
            } elseif (in_array($fechaDia, $fechasSaltado)) {
                $estadoDia   = 'saltado';
                $iconoDia    = $GLOBALS['minus'] ?? '-';
                $claseEstado = 'estado-saltado';
            }
            echo '<span class="dia-habito-item ' . esc_attr($claseEstado) . '" data-fecha="' . esc_attr($fechaDia) . '" data-tarea-id="' . esc_attr($id) . '" data-estado="' . esc_attr($estadoDia) . '">' . $iconoDia . '</span>';
        }
        echo '</div>';
    }
    return ob_get_clean();
}


/**
 * Obtiene el icono de importancia.
 *
 * @param string $imp             Valor de importancia ('baja', 'media', 'alta').
 * @param bool   $mostrarIcono    Si se debe mostrar el icono o el texto.
 * @return string                 Icono o texto de importancia.
 */
function obtenerIconoImportancia(string $imp, bool $mostrarIcono): string
{
    if (!$mostrarIcono) {
        return esc_html($imp);
    }
    $iconos = [
        'baja'       => $GLOBALS['baja'] ?? 'B',
        'media'      => $GLOBALS['media'] ?? 'M',
        'alta'       => $GLOBALS['alta'] ?? 'A',
        'importante' => $GLOBALS['importante'] ?? 'I'
    ];
    return $iconos[$imp] ?? '';
}

/**
 * Obtiene el icono de tipo de tarea.
 *
 * @param string $tipo         Valor del tipo ('una vez', 'habito', etc.).
 * @param bool   $mostrarIcono Si se debe mostrar el icono o el texto.
 * @return string              Icono o texto del tipo.
 */
function obtenerIconoTipo(string $tipo, bool $mostrarIcono): string
{
    if (!$mostrarIcono) {
        return esc_html($tipo);
    }
    $iconos = [
        'una vez'         => $GLOBALS['unavez'] ?? '1',
        'habito'          => $GLOBALS['habito'] ?? 'H',
        'habito rigido'   => $GLOBALS['habito'] ?? 'H',
        'habito flexible' => $GLOBALS['habito'] ?? 'H',
        'meta'            => $GLOBALS['meta'] ?? 'G'
    ];
    return $iconos[$tipo] ?? '';
}

/**
 * Convierte la frecuencia numérica a un texto descriptivo.
 *
 * @param int $frec Frecuencia en días.
 * @return string   Texto descriptivo.
 */
function obtenerFrecuenciaTexto(int $frec): string
{
    return match (true) {
        $frec == 1                 => 'diaria',
        $frec == 7                 => 'semanal',
        $frec >= 27 && $frec <= 32 => 'mensual',
        $frec == 365               => 'anual',
        default                    => "{$frec}d",
    };
}

/**
 * Calcula el texto relativo al tiempo desde una fecha de referencia hasta hoy.
 *
 * @param string|null $fechaReferencia Fecha en formato Y-m-d.
 * @return array                      Array con 'txt', 'simbolo', 'claseNeg' y 'diasDif'.
 */
function calcularTextoTiempo(?string $fechaReferencia): array
{
    $valRetDefecto = ['txt' => '', 'simbolo' => '', 'claseNeg' => '', 'diasDif' => 0];
    if (empty($fechaReferencia) || $fechaReferencia === '0000-00-00') {
        return $valRetDefecto;
    }

    $tsReferencia = strtotime($fechaReferencia);
    if ($tsReferencia === false || $tsReferencia < 0) {
        return $valRetDefecto;
    }

    $tsHoy   = strtotime(date('Y-m-d'));
    $difDias = floor(($tsReferencia - $tsHoy) / (60 * 60 * 24));

    $txt = '';
    $simbolo = '';
    $claseNeg = '';

    if ($difDias == 0) $txt = 'Hoy';
    elseif ($difDias == 1) $txt = 'Mañana';
    elseif ($difDias == -1) {
        $txt = 'Ayer';
        $claseNeg = 'diaNegativo';
    } elseif ($difDias > 1) $txt = $difDias . 'd';
    elseif ($difDias < -1) {
        $txt = abs($difDias) . 'd';
        $simbolo = '-';
        $claseNeg = 'diaNegativo';
    }

    return ['txt' => $txt, 'simbolo' => $simbolo, 'claseNeg' => $claseNeg, 'diasDif' => $difDias];
}

/**
 * Genera el HTML para el botón de fecha límite.
 *
 * @param int         $id          ID de la tarea.
 * @param string|null $fechaLimite Fecha límite.
 * @return string                  HTML del botón.
 */
function renderizarFechaLimite(int $id, ?string $fechaLimite): string
{
    $tiempo = calcularTextoTiempo($fechaLimite);
    if (empty($tiempo['txt'])) {
        return '';
    }
    ob_start();
    ?>
    <div class="divFechaLimite" data-tarea="<? echo $id; ?>" style="cursor: pointer;">
        <p class="fechaLimiteMeta svgtask">
            <span
                class="textoFechaLimite <? echo esc_attr($tiempo['claseNeg']); ?>"><? echo esc_html($tiempo['simbolo'] . $tiempo['txt']); ?></span>
        </p>
    </div>
    <?
    return ob_get_clean();
}
