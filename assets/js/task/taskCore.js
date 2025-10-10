// js/taskCore.js

let importancia = {
    selector: null,
    valor: 'media'
};

let tipoTarea = {
    selector: null,
    valor: 'una vez'
};

let fechaLimite = {
    selector: null,
    valor: null
};

let subTareaListenerAgregado = false;

function initTareas() {
    const tit = document.getElementById('tituloTarea');

    if (tit) {
        selectorTipoTarea();
        enviarTarea();
        editarTarea();
        completarTarea();
        cambiarPrioridad();
        prioridadTarea();
        borrarTareasCompletadas();
        cambiarFrecuencia();
        archivarTarea();
        ocultarBotones();
        borrarTareaVacia();

        iniciarManejadoresFechaLimiteMeta();
        iniciarManejadoresFechaProximaHabito();

        subTarea();
        window.initCal();
        //window.initNotas();
        window.initEnter();
        window.initMoverTarea();
        window.dividirTarea();
        window.initAsignarSeccionModal();
        initMarcarDiaHabito(); // Nueva función para los días de hábito
    }
}

window.hideAllOpenTaskMenus = function () {
    document.querySelectorAll('.opcionesPrioridad, .opcionesFrecuencia').forEach(menu => {
        if (menu) menu.remove();
    });

    const cal = document.getElementById('calCont');
    if (cal && cal.style.display === 'block') {
        ocultarCal(); // Llama a tu función para ocultar el calendario
    }

    if (window.cerrarMenuSiClicFueraPrioridadHandler) {
        document.removeEventListener('click', window.cerrarMenuSiClicFueraPrioridadHandler);
        window.cerrarMenuSiClicFueraPrioridadHandler = null;
    }
    if (window.cerrarMenuSiClicFueraFrecuenciaHandler) {
        document.removeEventListener('click', window.cerrarMenuSiClicFueraFrecuenciaHandler);
        window.cerrarMenuSiClicFueraFrecuenciaHandler = null;
    }
    // El listener para cerrar el calendario si se hace clic fuera ya se maneja en initCal y se limpia en ocultarCal.
};

window.guardarOrden = function () {
    const lista = document.querySelector('.listaTareas');
    if (!lista) return;

    const tareas = Array.from(lista.querySelectorAll('.draggable-element'));
    if (tareas.length < 2) return;

    const tareaMovida = tareas[0];
    const segundaTarea = tareas[0];
    lista.insertBefore(tareaMovida.closest('.tareaItem') || tareaMovida, (segundaTarea.closest('.tareaItem') || segundaTarea).nextSibling);

    const ordenNuevo = Array.from(lista.querySelectorAll('.draggable-element')).map(tarea => tarea.getAttribute('id-post'));
    const nuevaPosicion = ordenNuevo.indexOf(tareaMovida.getAttribute('id-post'));

    let sesionArriba = null;
    let dataSeccionArriba = null;
    let anterior = (tareaMovida.closest('.tareaItem') || tareaMovida).previousElementSibling;
    while (anterior) {
        const li = anterior.querySelector ? (anterior.querySelector('.POST-tarea') || anterior) : anterior;
        if (li.classList && li.classList.contains('POST-tarea')) {
            sesionArriba = li.getAttribute('sesion');
            if (dataSeccionArriba === null) {
                dataSeccionArriba = li.getAttribute('data-sesion');
            }
        } else if (anterior.classList && anterior.classList.contains('divisorTarea')) {
            if (sesionArriba === null) {
                sesionArriba = anterior.getAttribute('data-valor');
            }
            if (dataSeccionArriba === null) {
                dataSeccionArriba = anterior.getAttribute('data-valor');
            }
        }
        if (sesionArriba !== null && dataSeccionArriba !== null) break;
        anterior = anterior.previousElementSibling;
    }

    guardarOrdenTareas({
        idTarea: tareaMovida.getAttribute('id-post'),
        nuevaPos: nuevaPosicion,
        ordenNuevo: ordenNuevo,
        sesionArriba: sesionArriba,
        dataArriba: dataSeccionArriba,
        subtarea: tareaMovida.getAttribute('subtarea') === 'true',
        padre: tareaMovida.getAttribute('padre') || ''
    });
};

window.reiniciarTareaYSubtareas = async function (idTareaPrincipal) {
    const tareaElem = document.querySelector(`.POST-tarea[id-post="${idTareaPrincipal}"]`);
    let log = `reiniciarTareaYSubtareas: TareaID ${idTareaPrincipal}. `;

    if (tareaElem) {
        log += `Principal reiniciando. `;
        try { await window.reiniciarPost(idTareaPrincipal, 'tarea'); } catch (_) {}

        // Buscar subtareas directas de esta tarea
        // La clase 'tarea-padre' es un buen indicador, pero buscar por atributo 'padre' es más directo.
        const subtareasElems = document.querySelectorAll(`.POST-tarea[padre="${idTareaPrincipal}"]`);

        if (subtareasElems.length > 0) {
            log += `${subtareasElems.length} subtareas encontradas. `;
            for (const subElem of subtareasElems) {
                const idSub = subElem.getAttribute('id-post');
                if (idSub) {
                    log += `SubID ${idSub} reiniciando. `;
                    try { await window.reiniciarPost(idSub, 'tarea'); } catch (_) {}
                }
            }
        } else {
            log += `No se encontraron subtareas en DOM. `;
        }
    } else {
        log += `Elemento principal no encontrado en DOM. `;
    }
    console.log(log); // Descomenta si necesitas depurar esta función específicamente
};
