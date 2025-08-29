<?

/*
Contexto importante. 

La pagina task es un intento de hacer funcionar la funcionalidad de tareas, que antes corría otro proyecto que no usaba Glory. 
Se ira adaptando progresivamente a Glory. 

*/

function formTarea()
{
    ob_start();
?>
    <div class="bloque tareasbloque" style="padding: 10px 10px;">
        <input type="text" name="titulo" placeholder="Agregar nueva tarea" id="tituloTarea" style="border-bottom: none !important;">


        <div class="selectorIcono" data-submenu="importanciaSubmenu">
            <span class="icono">
                <? echo $GLOBALS['importancia']; ?>baja
            </span>
        </div>

        <div id="importanciaSubmenu" class="submenu" style="display:none;">
            <button value="baja">baja</button>
            <button value="media">media</button>
            <button value="alta">alta</button>
            <button value="importante">importante</button>
        </div>

        <div class="selectorIcono" data-submenu="tipoTareaSubmenu">
            <span class="icono"><? echo $GLOBALS['tipoTarea']; ?>Una vez</span>
        </div>

        <div id="tipoTareaSubmenu" class="submenu" style="display:none;">
            <button value="una vez">Una vez</button>
            <button value="habito">Hábito flexible</button>
            <button value="habito rigido" style="display: none;">Hábito rígido</button>
            <button value="meta" style="display: none;">Meta</button>
        </div>

        <!-- se maneja por JS, antes usaba taskCal.js ahora gloryCalendario -->
        <button class="selectorIcono gloryCalendario" data-target="#fecha" data-target-input="#fechaInput">
            <span class="icono"><? echo $GLOBALS['calendario']; ?><span id="fecha"></span></span>
            <input type="hidden" id="fechaInput" name="fecha_input" value="">
        </button>

        <!-- se maneja por JS, id anterior: sSeccion -->
        <div class="selectorIcono sSeccion openModal" data-modal="asignarSeccion" id="sSeccion" style="display: flex;">
            <span class="icono"><? echo $GLOBALS['meterCarpeta'] ?></span>
            <span class="nombreSeccionSeleccionada"></span>
        </div>

        <div class="modal" id="asignarSeccion" style="display: none;">
            <div class="asignarSeccion" style="gap: 5px;">
                <input type="text" id="inputNuevaSeccionModalForm" placeholder="Crear sección" maxlength="30">
                <button id="btnCrearAsignarSeccionModalForm" style="display: none;">Crear</button>
            </div>
            <div id="listaSeccionesExistentesModalForm"></div>
            <button id="btnCerrarModalSeccionForm" style="display: none;">Cerrar</button>
        </div>

        <!-- Calendario: generado dinámicamente por JS -->
    </div>

    <? echo formTareaEstilo(); ?>
<?
    return ob_get_clean();
}
