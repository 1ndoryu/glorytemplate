<?php

function logic()
{
    $usuarioId = get_current_user_id();
    $tareasActivas = $usuarioId ? logicGetActiveTasksData($usuarioId) : [];
    $hayTareas = !empty($tareasActivas);
    $limite = defined('GLORY_LOGIC_MAX_STEPS') ? GLORY_LOGIC_MAX_STEPS : 5;
    $habitosRapidos = $usuarioId
        ? logicGetQuickHabits($usuarioId)
        : logicGetDefaultHabits();
    $historialPasos = $usuarioId
        ? logicFetchHistoryEntries($usuarioId, GLORY_LOGIC_HISTORY_LIMIT)
        : [];
    $mensajeAyuda = $usuarioId ? logicGetHelpMessage($usuarioId) : [];
    $contextos = $usuarioId ? logicGetContexts($usuarioId) : [];

    $configLogic = [
        'ajaxUrl'       => admin_url('admin-ajax.php'),
        'nonce'         => wp_create_nonce('logic_actions'),
        'tasks'         => $tareasActivas,
        'limit'         => $limite,
        'limitReached'  => $hayTareas && count($tareasActivas) >= $limite,
        'habits'        => $habitosRapidos,
        'history'       => $historialPasos,
        'historyLimit'  => GLORY_LOGIC_HISTORY_LIMIT,
        'historyLimit'  => GLORY_LOGIC_HISTORY_LIMIT,
        'helpMessage'   => $mensajeAyuda,
        'contexts'      => $contextos,
        'strings'       => [
            'emptyInput'   => 'Describe el paso antes de fijarlo.',
            'saving'       => 'Guardando…',
            'ready'        => 'Listo.',
            'error'        => 'No pude guardar el paso.',
            'limit'        => sprintf('Solo puedes fijar hasta %d pasos activos.', $limite),
            'reorderError' => 'No pude guardar el nuevo orden.',
            'removeDone'   => 'Paso liberado.',
            'historyEmpty' => 'Todavía no registras pasos completados.',
            'historyLoaded' => 'Historial actualizado.',
            'historyRemoved' => 'Registro eliminado.',
            'habitAdded'   => 'Hábito guardado.',
            'habitError'   => 'No pude guardar el hábito.',
            'habitDeleted' => 'Hábito eliminado.',
            'habitDeleteError' => 'No pude eliminar el hábito.',
            'habitRenamed' => 'Hábito actualizado.',
            'habitRenameError' => 'No pude renombrar el hábito.',
            'helpSaved'    => 'Mensaje actualizado.',
            'helpCleared'  => 'Mensaje eliminado.',
            'helpError'    => 'No pude guardar el mensaje.',
            'paused'       => 'Paso pausado.',
            'resumed'      => 'Paso reanudado.',
            'pause'        => 'Pausar',
            'resume'       => 'Reanudar',
        ],
    ];

    if (!wp_style_is('tema-logic', 'enqueued')) {
        if (!wp_style_is('tema-logic', 'registered')) {
            wp_register_style(
                'tema-logic',
                get_template_directory_uri() . '/App/Assets/css/logic.css',
                [],
                null
            );
        }
        wp_enqueue_style('tema-logic');
    }

    $logicScripts = [
        'tema-logic-core' => [
            'path' => '/App/Assets/js/logic/core.js',
            'deps' => ['jquery'],
        ],
        'tema-logic-render' => [
            'path' => '/App/Assets/js/logic/render.js',
            'deps' => ['tema-logic-core'],
        ],
        'tema-logic-actions' => [
            'path' => '/App/Assets/js/logic/actions.js',
            'deps' => ['tema-logic-render'],
        ],
        'tema-logic-events' => [
            'path' => '/App/Assets/js/logic/events.js',
            'deps' => ['tema-logic-actions'],
        ],
        'tema-logic-main' => [
            'path' => '/App/Assets/js/logic/main.js',
            'deps' => ['tema-logic-events'],
        ],
    ];

    foreach ($logicScripts as $handle => $datosScript) {
        if (!wp_script_is($handle, 'registered')) {
            wp_register_script(
                $handle,
                get_template_directory_uri() . $datosScript['path'],
                $datosScript['deps'],
                null,
                true
            );
        }
    }

    wp_localize_script('tema-logic-core', 'logicInitialState', $configLogic);
    wp_enqueue_script('tema-logic-main');
    ?>

    <div class="logicPage">
        <div class="logicCard">
            <div class="logicTabs gloryTabs" data-logic-tabs>
                <div class="pestanas"></div>

                <div class="pestanaContenido activa" data-pestana="Pasos">
                    <p class="logicQuestion">¿Cuál es el siguiente paso lógico?</p>

                    <div class="logicInputWrapper">
                        <input
                            type="text"
                            id="logicInput"
                            placeholder="Describe el paso en una frase corta"
                            autocomplete="off"
                            spellcheck="false"
                        >
                        <button type="button" id="logicStartBtn">Fijar</button>
                    </div>

                    <div class="logicListWrapper">
                        <p class="logicLabel">Pasos fijados</p>
                        <ul class="logicList" id="logicList">
                            <?php if ($hayTareas): ?>
                                <?php foreach ($tareasActivas as $tarea): ?>
                                    <?php $pausado = !empty($tarea['pausado']); ?>
                                    <li class="logicItem <?php echo $pausado ? 'is-paused' : ''; ?>" data-task-id="<?php echo esc_attr($tarea['id']); ?>" data-paused="<?php echo $pausado ? '1' : '0'; ?>">
                                        <span class="logicItemHandle" aria-label="Reordenar" role="button" tabindex="0"></span>
                                        <div class="logicItemContent">
                                            <span class="logicItemTitle"><?php echo esc_html($tarea['titulo']); ?></span>
                                            <span class="logicItemTimer"><?php echo esc_html($tarea['elapsedLabel']); ?></span>
                                            <?php if ($pausado): ?>
                                                <span class="logicItemBadge">En pausa</span>
                                            <?php endif; ?>
                                        </div>
                                        <button
                                            type="button"
                                            class="logicItemPause"
                                            data-task-id="<?php echo esc_attr($tarea['id']); ?>"
                                            aria-label="<?php echo $pausado ? 'Reanudar' : 'Pausar'; ?>"
                                            title="<?php echo $pausado ? 'Reanudar' : 'Pausar'; ?>"
                                        >
                                            <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 2.5V1.75H4V2.5V13.5V14.25H5.5V13.5V2.5ZM12 2.5V1.75H10.5V2.5V13.5V14.25H12V13.5V2.5Z" fill="currentColor"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="logicItemRemove"
                                            data-task-id="<?php echo esc_attr($tarea['id']); ?>"
                                            aria-label="Liberar"
                                            title="Liberar"
                                        >
                                            <svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor" viewBox="0 0 16 16" width="16">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z" fill="currentColor"></path>
                                            </svg>
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </ul>
                        <p class="logicEmpty <?php echo $hayTareas ? 'is-hidden' : ''; ?>" id="logicEmpty">
                            Fija tu primer paso para comenzar a contar.
                        </p>
                    </div>

                    <div class="logicInputWrapper" style="margin-top: 2rem;">
                        <input
                            type="text"
                            id="logicContextInputQuick"
                            placeholder="Añadir nota o contexto rápido..."
                            autocomplete="off"
                        >
                        <button type="button" id="logicContextAddBtnQuick">Guardar</button>
                    </div>

                    <div class="logicHabits">
                        <p class="logicLabel">Hábitos rápidos</p>
                        <div class="logicHabitsButtons" id="logicHabitsButtons">
                            <?php foreach ($habitosRapidos as $habito): ?>
                                <button
                                    type="button"
                                    class="logicHabitBtn"
                                    data-logic-habit="<?php echo esc_attr($habito); ?>"
                                >
                                    <?php echo esc_html($habito); ?>
                                </button>
                            <?php endforeach; ?>
                            <button
                                type="button"
                                class="logicHabitBtn logicHabitAddBtn"
                                data-logic-habit-trigger="create"
                            >
                                Añadir otro
                            </button>
                        </div>
                    </div>
                </div>

                <div class="pestanaContenido" data-pestana="Contexto">
                    <div class="logicInputWrapper">
                        <input
                            type="text"
                            id="logicContextInput"
                            placeholder="Añadir nuevo bloque de contexto..."
                            autocomplete="off"
                        >
                        <button type="button" id="logicContextAddBtn">Añadir</button>
                    </div>
                    <ul class="logicList logicContextList" id="logicContextList">
                        <?php foreach ($contextos as $ctx): ?>
                            <li class="logicItem logicContextItem" data-context-id="<?php echo esc_attr($ctx['id']); ?>">
                                <span class="logicItemHandle logicContextHandle" aria-label="Reordenar" role="button" tabindex="0"></span>
                                <div class="logicItemContent">
                                    <span class="logicItemTitle logicContextText" contenteditable="true" spellcheck="false"><?php echo esc_html($ctx['texto']); ?></span>
                                    <span class="logicItemTimer logicContextDate" style="font-size: 0.75em; opacity: 0.6;">
                                        <?php echo esc_html($ctx['editadoLabel']); ?>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    class="logicItemRemove logicContextDelete"
                                    data-context-id="<?php echo esc_attr($ctx['id']); ?>"
                                    aria-label="Eliminar"
                                    title="Eliminar"
                                >
                                    <svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor" viewBox="0 0 16 16" width="16">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z" fill="currentColor"></path>
                                    </svg>
                                </button>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                    <p class="logicEmpty <?php echo !empty($contextos) ? 'is-hidden' : ''; ?>" id="logicContextEmpty">
                        No hay bloques de contexto definidos.
                    </p>
                </div>

                <div class="pestanaContenido" data-pestana="Historial">
                    <div class="logicHistoryHeader">
                        <p class="logicLabel">Historial reciente</p>
                        <button type="button" id="logicHistoryRefresh">Actualizar</button>
                    </div>
                    <ul class="logicHistoryList" id="logicHistoryList">
                        <?php foreach ($historialPasos as $entrada): ?>
                            <li class="logicHistoryItem" data-history-id="<?php echo esc_attr($entrada['id']); ?>">
                                <div class="logicHistoryInfo">
                                    <span class="logicHistoryTitle"><?php echo esc_html($entrada['titulo']); ?></span>
                                    <span class="logicHistoryDuration"><?php echo esc_html($entrada['duracionLabel']); ?></span>
                                    <span class="logicHistoryDates">
                                        <?php echo esc_html($entrada['inicioUtc']); ?> — <?php echo esc_html($entrada['finUtc']); ?>
                                    </span>
                                </div>
                                <button type="button" class="logicHistoryDelete" data-history-id="<?php echo esc_attr($entrada['id']); ?>">
                                    Eliminar
                                </button>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                    <p class="logicEmpty <?php echo !empty($historialPasos) ? 'is-hidden' : ''; ?>" id="logicHistoryEmpty">
                        No hay pasos completados todavía.
                    </p>
                </div>

                <div class="pestanaContenido" data-pestana="Configuración">
                    <div class="logicHelpSection">
                        <p class="logicLabel">Mensaje de ayuda</p>
                        <p class="logicHelpDisplay" id="logicHelpDisplay">
                            <?php if (!empty($mensajeAyuda['texto'])): ?>
                                <?php echo esc_html($mensajeAyuda['texto']); ?>
                            <?php else: ?>
                                Agrega un recordatorio corto que verás en esta página.
                            <?php endif; ?>
                        </p>
                        <div class="logicHelpControls">
                            <input
                                type="text"
                                id="logicHelpInput"
                                placeholder="Comparte una frase que te mantenga enfocado"
                                autocomplete="off"
                            >
                            <select id="logicHelpDuration">
                                <option value="900">15 minutos</option>
                                <option value="3600">1 hora</option>
                                <option value="14400">4 horas</option>
                                <option value="86400">1 día</option>
                            </select>
                            <button type="button" id="logicHelpSave">Guardar mensaje</button>
                            <button type="button" id="logicHelpClear">Quitar</button>
                        </div>
                    </div>
                </div>
            </div>

            <p class="logicHelpGlobal <?php echo empty($mensajeAyuda['texto']) ? 'is-empty' : ''; ?>" id="logicHelpGlobal">
                <?php if (!empty($mensajeAyuda['texto'])): ?>
                    <?php echo esc_html($mensajeAyuda['texto']); ?>
                <?php endif; ?>
            </p>

            <p class="logicStatus" id="logicStatus"></p>
        </div>

        <div class="logicHabitMenu submenus" id="logicHabitMenu" style="display:none;">
            <button type="button" data-logic-habit-action="rename">Cambiar nombre</button>
            <button type="button" data-logic-habit-action="delete">Eliminar</button>
        </div>
    </div>

    <div id="logicHabitModal" class="modal" style="display:none;" data-close-on-overlay="1">
        <h3 id="logicHabitModalTitle">Añadir hábito rápido</h3>
        <p id="logicHabitModalDescription">Guarda un atajo corto para fijar pasos sin escribir.</p>
        <form id="logicHabitModalForm" data-mode="create">
            <input
                type="text"
                id="logicHabitModalInput"
                placeholder="Escribe el hábito"
                autocomplete="off"
                spellcheck="false"
            >
            <div class="logicModalActions">
                <button type="button" class="logicModalCancel" data-logic-habit-cancel>Cerrar</button>
                <button type="submit" id="logicHabitModalSubmit">Guardar</button>
            </div>
        </form>
    </div>
    <?php
}

