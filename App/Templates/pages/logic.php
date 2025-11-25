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
                                        <button
                                            type="button"
                                            class="logicItemRemove logicItemDelete"
                                            data-task-id="<?php echo esc_attr($tarea['id']); ?>"
                                            aria-label="Eliminar"
                                            title="Eliminar"
                                        >
                                            <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path></svg>
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
                    
                    <div class="logicContextSection">
                        <p class="logicLabel" style="margin-top: 1.5rem;">Contextos</p>
                        <ul class="logicList logicContextList" id="logicContextList">
                            <?php foreach ($contextos as $ctx): ?>
                                <?php $isPinned = !empty($ctx['pinned']); ?>
                                <li class="logicItem logicContextItem <?php echo $isPinned ? 'is-pinned' : ''; ?>" data-context-id="<?php echo esc_attr($ctx['id']); ?>" data-pinned="<?php echo $isPinned ? '1' : '0'; ?>">
                                    <span class="logicItemHandle logicContextHandle" aria-label="Reordenar" role="button" tabindex="0"></span>
                                    <div class="logicItemContent">
                                        <span class="logicItemTitle logicContextText" contenteditable="true" spellcheck="false"><?php echo esc_html($ctx['texto']); ?></span>
                                        <span class="logicItemTimer logicContextDate" style="font-size: 0.75em; opacity: 0.6;">
                                            <?php echo esc_html($ctx['editadoLabel']); ?>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        class="logicItemPin <?php echo $isPinned ? 'is-pinned' : ''; ?>"
                                        data-context-id="<?php echo esc_attr($ctx['id']); ?>"
                                        aria-label="<?php echo $isPinned ? 'Desfijar' : 'Fijar'; ?>"
                                        title="<?php echo $isPinned ? 'Desfijar' : 'Fijar'; ?>"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 17v5"></path>
                                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>
                                        </svg>
                                    </button>
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
                    </div>
                </div>

                <div class="pestanaContenido" data-pestana="Historial">
                    <div class="logicContextSection">
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
                                <button type="button" class="logicHistoryDelete" data-history-id="<?php echo esc_attr($entrada['id']); ?>" style="border:none; background:transparent; padding:4px; cursor:pointer;">
                                    <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path></svg>
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

                    <div class="logicAgentSection" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--logic-border);">
                        <p class="logicLabel">Agente Lógico (IA)</p>
                        <p class="logicHelpDisplay" style="margin-bottom: 1rem; opacity: 0.7;">
                            Ejecuta el agente manualmente para que analice tu estado y tome decisiones.
                        </p>
                        <button type="button" id="logicRunAgentBtn" class="logicBtnSecondary">Ejecutar Agente</button>
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

