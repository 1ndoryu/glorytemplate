<?php

use Glory\Components\ContentRender;

/*
Contexto importante. 

La pagina task es un intento de hacer funcionar la funcionalidad de tareas, que antes corría otro proyecto que no usaba Glory. 
Se ira adaptando progresivamente a Glory. 

La estructura html se a simplificado y ajustado, tal vez los scripts requieran ajustes para soportar la nueva estructura html. 

*/

function task()
{
?>
    <div class="pageTask" style="margin-top: 150px;">

        <div class="taskConfig">
            <button class="borrarTareasCompletadas">
                <? echo $GLOBALS['borradorIcon']; ?>
            </button>

            <button class="prioridadTareas">
                <? echo $GLOBALS['estrellaCuatro']; ?>
            </button>

            <button class="tiempoTareas" style="display: none;">
                <? echo $GLOBALS['tiempoIcon']; ?>
            </button>

            <button class="restablecerTareas" style="display: none;">
                <? echo $GLOBALS['iconViento']; ?>
            </button>

            <button class="ORDENPOSTSL" id="ORDENPOSTSL">
                <? echo $GLOBALS['iconFiltro']; ?>
            </button>

            <!-- Aqui va un boton modal para los filtros 
            Los filtros son:
            - Ocultar tareas completadas 
            - Ocultar hábitos completados 
            -->
        </div>


        <div class="tareasForm">
            <?php echo formTarea() ?>
        </div>

        <div class="tareasList">
            <?php
            $argumentosConsulta = [];
            $argumentosConsulta = ordenamientoTareas([], get_current_user_id(), []);

            ContentRender::print('tarea', [
                'publicacionesPorPagina' => 34,
                'paginacion' => false,
                'plantillaCallback' => 'plantillaTarea',
                'claseContenedor' => 'listaTareas bloque',
                'claseItem' => 'tareaItem',
                'acciones' => ['eliminar'],
                'submenu' => true,
                'eventoAccion' => 'dblclick',
                'selectorItem' => '.tareaItem, .draggable-element, [id-post], [id^="post-"]',
                'argumentosConsulta' => $argumentosConsulta,
                'forzarSinCache' => true,
            ]);
            ?>
            
        </div>

    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            try {
                if (typeof initTareas === 'function') initTareas();
            } catch (e) {
                console.error('Error iniciando initTareas():', e);
            }
        });
    </script>

<?php
}
