<?php

function plantillaTarea(\WP_Post $post, string $itemClass)
{
    // Usamos la función del helper para obtener todos los datos procesados de la tarea.
    $datos = obtenerDatosTarea($post->ID, 'tarea');
    ?>
    <div id="post-<?php echo esc_attr($datos['id']); ?>" class="<?php echo esc_attr($itemClass); ?>">
        <li class="POST-<?php echo esc_attr($datos['filtroHtml']); ?> EDYQHV <?php echo $datos['id']; ?> <?php echo $datos['esCompletada'] ? 'completada' : ''; ?> <?php echo (!$datos['idPadre'] && $datos['tieneSubtareasIncompletas']) ? 'tarea-padre' : ''; ?> draggable-element <?php echo esc_attr($datos['estado']); ?> <?php echo $datos['idPadre'] ? 'subtarea' : ''; ?>"
            filtro="<?php echo esc_attr($datos['filtroHtml']); ?>"
            tipo-tarea="<?php echo esc_attr($datos['tipo']); ?>"
            id-post="<?php echo $datos['id']; ?>"
            autor="<?php echo esc_attr($datos['autorId']); ?>"
            draggable="true" <?php echo $datos['esCompletada'] ? 'style="text-decoration: line-through;"' : ''; ?>
            data-sesion="<?php echo $datos['sesionHtml']; ?>"
            estado="<?php echo esc_attr($datos['estado']); ?>"
            impnum="<?php echo esc_attr($datos['impnum']); ?>"
            importancia="<?php echo esc_attr($datos['imp']); ?>"
            subtarea="<?php echo $datos['idPadre'] ? 'true' : 'false'; ?>"
            padre="<?php echo esc_attr($datos['idPadre'] ?: ''); ?>"
            dif="<?php echo esc_attr($datos['difDiasActivo']); ?>"
            data-fechalimite="<?php echo esc_attr($datos['fechaLimite'] ?? ''); ?>"
            data-proxima="<?php echo esc_attr($datos['proxima'] ?? ''); ?>">

            <button class="completaTarea <?php echo ($datos['esHabito'] && $datos['tipo'] !== 'habito rigido') ? 'habito' : ''; ?> <?php echo ($datos['tipo'] === 'habito flexible') ? 'habitoFlexible' : ''; ?>" data-tarea="<?php echo $datos['id']; ?>">
                <?php echo $GLOBALS['circulo'] ?? '[ ]'; ?>
            </button>

            <p class="tituloTarea" data-tarea="<?php echo $datos['id']; ?>">
                <?php echo esc_html($datos['titulo']); ?>
                <?php if (!empty($datos['infoDepuracionTitulo'])): ?>
                    <span class="info-ids-depuracion" style="font-size:0.75em; color: #666; margin-left: 8px; font-weight:normal;"><?php echo esc_html($datos['infoDepuracionTitulo']); ?></span>
                <?php endif; ?>
            </p>

            <p class="idtarea" style="display: none; font-size: 11px;">
                <?php echo $datos['id']; ?>
            </p>

            <?php
            if (!$datos['esHabito'] && $datos['limiteTieneTextoValido']) {
                echo renderizarFechaLimite($datos['id'], $datos['fechaLimite']);
            }
            ?>

            <div class="divSesion" data-tarea="<?php echo $datos['id']; ?>" style="display: none; cursor: pointer;">
                <p class="sesionTarea">
                    <?php echo $GLOBALS['carpetaIcon'] ?? ''; ?>
                </p>
            </div>

            <div class="divImportancia" data-tarea="<?php echo $datos['id']; ?>">
                <p class="importanciaTarea <?php echo $datos['mostrarIcono'] ? 'svgtask' : ''; ?>">
                    <?php echo $datos['mostrarIcono'] ? $datos['impIcono'] : '<span class="tituloImportancia">' . esc_html($datos['imp']) . '</span>'; ?>
                </p>
            </div>

            <p class="tipoTarea svgtask" style="display: none;"><?php echo $datos['tipoIcono']; ?></p>
            <p class="estadoTarea" style="display: none;"><?php echo esc_html($datos['estado']); ?></p>

            <?php
            if (function_exists('opcionesPost')) {
                echo opcionesPost($datos['id'], $datos['autorId']);
            }
            ?>

            <div class="divArchivado ocultadoAutomatico" data-tarea="<?php echo $datos['id']; ?>" style="display: none;">
                <p class="archivadoTarea" style="cursor: pointer;">
                    <?php echo $GLOBALS['archivadoIcon'] ?? '[A]'; ?>
                </p>
            </div>

            <?php if (!$datos['esHabito'] && !$datos['limiteTieneTextoValido']): ?>
                <div class="divFechaLimite ocultadoAutomatico" data-tarea="<?php echo $datos['id']; ?>" style="display: none; cursor: pointer;">
                    <p>
                        <span class="textoFechaLimite">
                            <?php echo $GLOBALS['calendario'] ?? '[F]'; ?>
                        </span>
                    </p>
                </div>
            <?php endif; ?>

            <div class="divCarpeta ocultadoAutomatico" data-tarea="<?php echo $datos['id']; ?>" style="display: none; cursor: pointer;">
                <p>
                    <span class="carpetaSpan">
                        <?php echo $GLOBALS['meterCarpeta'] ?? '[C]'; ?>
                    </span>
                </p>
            </div>

            <?php if ($datos['esHabito']): ?>
                <div class="divOpcionesHabito ocultadoAutomatico divFrecuencia" data-tarea="<?php echo $datos['id']; ?>" style="display: none; cursor: pointer;">
                    <span class="tituloFrecuencia"><?php echo esc_html($datos['frec']); ?></span>
                    <?php echo $GLOBALS['iconoHabitoRe']; ?>
                </div>
            <?php endif; ?>

            <?php
            if ($datos['esHabito'] && in_array($datos['tipo'], ['habito', 'habito rigido'])) {
                echo generarVisualizacionHabito($datos['id'], $datos['frec']);
            }
            ?>
        </li>
    </div>
    <?php
}
?>