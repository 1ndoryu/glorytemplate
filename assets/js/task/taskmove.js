//taskmove.js

window.initMoverTarea = () => {
    const tit = document.getElementById('tituloTarea');
    if (tit) moverTarea();
    //setTimeout(dibujarLineasSubtareas, 150);
};

function manejarSeleccionTarea(ev) {
    const tareaElem = ev.target.closest('.draggable-element');
    if (!tareaElem) return;

    // Si el clic fue en un control DENTRO de la tarea (ej: icono de prioridad, archivar, completar)
    // y NO se usó Ctrl, NO queremos modificar la selección actual.
    // La acción del control específico se encargará, y podría necesitar la selección múltiple.
    if (!ev.ctrlKey && ev.target.closest('.divImportancia, .divArchivado, .completaTarea, .divFrecuencia')) {
        //Añade aquí otros selectores de controles internos si los tienes
        return; // No modificar la selección, dejar que el control específico actúe.
    }

    const id = tareaElem.getAttribute('id-post');

    if (ev.ctrlKey) {
        // Lógica de selección/deselección con Ctrl (sin cambios)
        if (tareasSeleccionadas.includes(id)) {
            tareasSeleccionadas = tareasSeleccionadas.filter(selId => selId !== id);
            tareaElem.classList.remove('seleccionado');
        } else {
            tareasSeleccionadas.push(id);
            tareaElem.classList.add('seleccionado');
        }
    } else {
        // Clic simple (sin Ctrl) directamente en una tarea (no en un control específico dentro de ella)
        // Deseleccionar otras y seleccionar solo esta.
        if (!tareasSeleccionadas.includes(id) || tareasSeleccionadas.length > 1) {
            deseleccionarTareas(); // Limpia selecciones previas
            tareasSeleccionadas.push(id); // Selecciona la actual
            tareaElem.classList.add('seleccionado');
        }
        // Si se hace clic en una tarea que ya es la única seleccionada, no hace nada.
    }
}

function deseleccionarTareas() {
    tareasSeleccionadas.forEach(id => {
        const tarea = document.querySelector(`.draggable-element[id-post="${id}"]`);
        if (tarea) tarea.classList.remove('seleccionado');
    });
    tareasSeleccionadas = [];
}

function moverTarea() {
    listaMov = document.querySelector('.listaTareas');
    if (!listaMov || listaMov.listenersAdded) return;
    listaMov.listenersAdded = true;

    // La función 'inicializarVars' y otras relacionadas con el arrastre no cambian para esta solución.

    listaMov.addEventListener('mousedown', ev => {
        // ****** INICIO DE LA MODIFICACIÓN CLAVE ******
        // Verificar si el mousedown ocurrió dentro de un menú de opciones.
        const esEnMenuOpciones = ev.target.closest('.opcionesPrioridad, .opcionesFrecuencia');

        if (esEnMenuOpciones) {
            // Si el mousedown es en un menú, no hacer nada aquí.
            // Específicamente, NO deseleccionar y NO intentar iniciar un arrastre.
            // La interacción la manejará el listener de 'click' del propio menú.
            return;
        }
        // ****** FIN DE LA MODIFICACIÓN CLAVE ******

        const elem = ev.target.closest('.draggable-element');
        if (elem) {
            // Si el mousedown fue en un control DENTRO de la tarea que tiene su propia acción
            // (como el icono de prioridad, archivar, etc.), no queremos iniciar un arrastre.
            // Dejamos que el evento 'click' en ese control se maneje.
            // La función 'inicializarVars' se encargará de esto también.
            if (inicializarVars(ev)) {
                // inicializarVars ya llama a ocultarMenuesAbiertos
                // inicializarVars ahora también debería verificar esto
                listaMov.addEventListener('mousemove', manejarMov);
                listaMov.addEventListener('mouseup', finalizarArrastre);
            }
        } else {
            // Mousedown ocurrió FUERA de un draggable-element Y NO en un menú de opciones (ya cubierto arriba).
            // Esto implica un clic en el espacio vacío de la lista. Deseleccionar todo.
            deseleccionarTareas();
            // También cerramos menús por si acaso, aunque inicializarVars lo haría al arrastrar.
            // Y los listeners de clic fuera de los menús también deberían actuar.
            // Esta llamada es una salvaguarda adicional.
            if (typeof window.ocultarMenuesAbiertos === 'function') {
                window.ocultarMenuesAbiertos();
            }
        }
    });

    listaMov.addEventListener('click', manejarSeleccionTarea);
    listaMov.addEventListener('dragstart', ev => ev.preventDefault());

    document.addEventListener('click', ev => {
        const esEnControlInternoOmenu = ev.target.closest('.opcionesPrioridad, .opcionesFrecuencia, .divImportancia, .divFrecuencia, .divArchivado, .completaTarea');

        if (esEnControlInternoOmenu) {
            // Si el clic es en un menú, su botón de activación, u otro control interno de la tarea,
            // dejar que sus manejadores específicos actúen.
            return;
        }

        // Si el clic es fuera de la lista de tareas principal
        if (listaMov && !listaMov.contains(ev.target)) {
            deseleccionarTareas();
            if (typeof window.ocultarMenuesAbiertos === 'function') {
                window.ocultarMenuesAbiertos(); // Cerrar todos los menús abiertos
            }
        }
        // Nota: El clic en el espacio vacío DENTRO de listaMov (pero no en una tarea)
        // ya es manejado por el 'mousedown' listener de listaMov para deseleccionar tareas.
    });
}

/* VARIABLES GLOBALES */
let listaMov,
    // Para el modo individual se usan estas variables:
    arrastrandoElem = null,
    idTarea = null,
    subtareasArrastradas = [],
    esSubtarea = false,
    // Para ambos modos (individual o grupal) se usará:
    arrastrandoElems = [],
    ordenViejo = [],
    posInicialY = null,
    movRealizado = false,
    tareasSeleccionadas = [];

const tolerancia = 10;

// Ajuste sugerido para inicializarVars para que no inicie arrastre
// si el clic es en un control interno que tiene su propia acción.
function inicializarVars(ev) {
    const targetOriginal = ev.target;
    const elemArrastrable = targetOriginal.closest('.draggable-element');

    if (!elemArrastrable) return false;

    if (targetOriginal.closest('.divImportancia, .divArchivado, .completaTarea, .divFrecuencia')) {
        return false;
    }

    if (typeof window.ocultarMenuesAbiertos === 'function') {
        window.ocultarMenuesAbiertos();
    }

    let grupo;
    if (tareasSeleccionadas.includes(elemArrastrable.getAttribute('id-post'))) {
        grupo = Array.from(listaMov.querySelectorAll('.draggable-element')).filter(el => tareasSeleccionadas.includes(el.getAttribute('id-post')));
        if (grupo.length === 0) {
            grupo = [elemArrastrable];
        }
    } else {
        grupo = [elemArrastrable];
    }
    arrastrandoElems = grupo;

    if (grupo.length === 1) {
        arrastrandoElem = grupo[0];
        esSubtarea = arrastrandoElem.getAttribute('subtarea') === 'true'; // Esto sigue siendo útil para la lógica de 'convertirse en subtarea'
        idTarea = arrastrandoElem.getAttribute('id-post');
        ordenViejo = Array.from(listaMov.querySelectorAll('.draggable-element')).map(t => t.getAttribute('id-post'));

        // ***** MODIFICACIÓN AQUÍ *****
        // Una tarea padre (con clase 'tarea-padre') siempre debe intentar mover sus subtareas,
        // independientemente de si ella misma es una subtarea.
        if (arrastrandoElem.classList.contains('tarea-padre')) {
            subtareasArrastradas = Array.from(listaMov.querySelectorAll(`.draggable-element[padre="${idTarea}"]`));
        } else {
            subtareasArrastradas = [];
        }
    } else {
        arrastrandoElem = null;
        subtareasArrastradas = [];
        esSubtarea = false; // Irrelevante para grupos, pero limpiar.
        idTarea = null;
        ordenViejo = [];
    }

    posInicialY = ev.clientY;
    movRealizado = false;

    arrastrandoElems.forEach(el => el.classList.add('dragging'));
    document.body.classList.add('dragging-active');
    return true;
}

/* MANEJO DEL MOVIMIENTO */
function manejarMov(ev) {
    if (arrastrandoElems.length === 0) return;
    ev.preventDefault();
    const mouseY = ev.clientY;
    const rectLista = listaMov.getBoundingClientRect();

    if (!movRealizado && Math.abs(mouseY - posInicialY) > tolerancia) {
        movRealizado = true;
    }
    if (mouseY < rectLista.top || mouseY > rectLista.bottom) return;

    const elemsVisibles = Array.from(listaMov.children).filter(child => child.style.display !== 'none' && !arrastrandoElems.includes(child));
    let insertado = false;

    const tareaPrincipalArrastrada = arrastrandoElems[0];
    const esArrastradaTareaPadre = tareaPrincipalArrastrada.classList.contains('tarea-padre');

    for (let i = 0; i < elemsVisibles.length; i++) {
        const elemActual = elemsVisibles[i];
        const rectElem = elemActual.getBoundingClientRect();
        const elemMedio = rectElem.top + rectElem.height / 2;

        if (mouseY < elemMedio) {
            if (esArrastradaTareaPadre) {
                const anteriorVisibleAelemActual = elemsVisibles[i - 1];

                if (elemActual.getAttribute('subtarea') === 'true' && anteriorVisibleAelemActual && anteriorVisibleAelemActual.getAttribute('subtarea') === 'true' && elemActual.getAttribute('padre') === anteriorVisibleAelemActual.getAttribute('padre') && elemActual.getAttribute('padre') !== tareaPrincipalArrastrada.getAttribute('id-post')) {
                    continue;
                }

                if (anteriorVisibleAelemActual && anteriorVisibleAelemActual.classList.contains('tarea-padre')) {
                    continue;
                }
            }

            arrastrandoElems.forEach(el => {
                const wrapper = el.closest('.tareaItem') || el;
                listaMov.insertBefore(wrapper, elemActual);
            });
            insertado = true;
            break;
        }
    }

    if (!insertado) {
        if (elemsVisibles.length > 0) {
            if (esArrastradaTareaPadre) {
                const ultimoElemVisible = elemsVisibles[elemsVisibles.length - 1];
                if (ultimoElemVisible && ultimoElemVisible.classList.contains('tarea-padre')) {
                    // No se puede añadir al final
                } else {
                    arrastrandoElems.forEach(el => {
                        const wrapper = el.closest('.tareaItem') || el;
                        listaMov.appendChild(wrapper);
                    });
                }
            } else {
                arrastrandoElems.forEach(el => {
                    const wrapper = el.closest('.tareaItem') || el;
                    listaMov.appendChild(wrapper);
                });
            }
        } else if (arrastrandoElems.length > 0) {
            arrastrandoElems.forEach(el => {
                const wrapper = el.closest('.tareaItem') || el;
                listaMov.appendChild(wrapper);
            });
        }
    }

    // ***** MODIFICACIÓN AQUÍ *****
    // Si se arrastra una tarea individual que es 'tarea-padre', reposicionar sus subtareas.
    // 'arrastrandoElem' es la tarea individual que se está moviendo.
    if (arrastrandoElems.length === 1 && arrastrandoElem && arrastrandoElem.classList.contains('tarea-padre')) {
        let actual = arrastrandoElem; // El padre que se acaba de mover
        subtareasArrastradas.forEach(subtarea => {
            // subtareasArrastradas fue poblado en inicializarVars
            const wrapSub = subtarea.closest('.tareaItem') || subtarea;
            const wrapAct = actual.closest('.tareaItem') || actual;
            listaMov.insertBefore(wrapSub, wrapAct.nextSibling);
            actual = subtarea; // La siguiente subtarea se insertará después de esta
        });
    }
}

/* FINALIZAR ARRASTRE */
function finalizarArrastre() {
    if (arrastrandoElems.length === 0) return;
    const ordenNuevo = Array.from(listaMov.querySelectorAll('.draggable-element')).map(t => t.getAttribute('id-post'));

    if (movRealizado) {
        // MODO INDIVIDUAL: se conserva la lógica original (con manejo de “subtarea”)
        if (arrastrandoElems.length === 1) {
            const nuevaPos = ordenNuevo.indexOf(idTarea);
            const {sesionArriba, dataArriba} = obtenerSesionYData();
            const {nuevaEsSubtarea} = cambioASubtarea();
            let padre = '';
            if (nuevaEsSubtarea) {
                // Determinar padre según vecinos con wrappers .tareaItem
                const wrap = (arrastrandoElem.closest && arrastrandoElem.closest('.tareaItem')) || arrastrandoElem;
                function buscarAnteriorPost(w) {
                    let p = w.previousElementSibling;
                    while (p) {
                        if (p.classList && p.classList.contains('divisorTarea')) { p = p.previousElementSibling; continue; }
                        const cand = p.querySelector ? (p.querySelector('.POST-tarea') || null) : (p.classList && p.classList.contains('POST-tarea') ? p : null);
                        if (cand) return cand;
                        p = p.previousElementSibling;
                    }
                    return null;
                }
                function buscarSiguientePost(w) {
                    let n = w.nextElementSibling;
                    while (n) {
                        if (n.classList && n.classList.contains('divisorTarea')) { n = n.nextElementSibling; continue; }
                        const cand = n.querySelector ? (n.querySelector('.POST-tarea') || null) : (n.classList && n.classList.contains('POST-tarea') ? n : null);
                        if (cand) return cand;
                        n = n.nextElementSibling;
                    }
                    return null;
                }
                const anteriorPost = buscarAnteriorPost(wrap);
                const siguientePost = buscarSiguientePost(wrap);
                const prevSibling = wrap.previousElementSibling;
                const topOdivisor = !prevSibling || (prevSibling.classList && prevSibling.classList.contains('divisorTarea'));

                // 1) Entre dos subtareas del mismo padre → adopta ese padre
                if (anteriorPost && siguientePost && anteriorPost.getAttribute('subtarea') === 'true' && siguientePost.getAttribute('subtarea') === 'true' && anteriorPost.getAttribute('padre') && anteriorPost.getAttribute('padre') === siguientePost.getAttribute('padre')) {
                    padre = anteriorPost.getAttribute('padre');
                }
                // 2) Si no, si siguiente es subtarea → adopta el padre del siguiente
                if (!padre && !topOdivisor && siguientePost && siguientePost.getAttribute('subtarea') === 'true') {
                    padre = siguientePost.getAttribute('padre') || '';
                }
                // 3) Si no, si anterior es subtarea → adopta el padre del anterior
                if (!padre && !topOdivisor && anteriorPost && anteriorPost.getAttribute('subtarea') === 'true') {
                    padre = anteriorPost.getAttribute('padre') || '';
                }
                // 4) Fallback: si el siguiente es el padre original, SOLO si arriba hay una subtarea de ese padre (sigue dentro del bloque)
                if (!padre && siguientePost && siguientePost.getAttribute('id-post') === arrastrandoElem.getAttribute('padre')) {
                    if (anteriorPost && anteriorPost.getAttribute('subtarea') === 'true' && anteriorPost.getAttribute('padre') === siguientePost.getAttribute('id-post')) {
                        padre = siguientePost.getAttribute('id-post');
                    }
                }

                if (padre) {
                    arrastrandoElem.setAttribute('padre', padre);
                    arrastrandoElem.setAttribute('subtarea', 'true');
                    arrastrandoElem.classList.add('subtarea');
                } else {
                    // Si no se pudo determinar padre, no marcar como subtarea
                    arrastrandoElem.removeAttribute('padre');
                    arrastrandoElem.setAttribute('subtarea', 'false');
                    arrastrandoElem.classList.remove('subtarea');
                }
                arrastrandoElem.setAttribute('data-sesion', dataArriba);
                arrastrandoElem.setAttribute('sesion', sesionArriba);
            } else {
                padre = '';
                arrastrandoElem.removeAttribute('padre');
                arrastrandoElem.setAttribute('subtarea', 'false');
                arrastrandoElem.classList.remove('subtarea');
                arrastrandoElem.setAttribute('data-sesion', dataArriba);
                subtareasArrastradas.forEach(subtarea => subtarea.setAttribute('data-sesion', dataArriba));
                arrastrandoElem.setAttribute('sesion', sesionArriba);
                subtareasArrastradas.forEach(subtarea => subtarea.setAttribute('sesion', sesionArriba));
            }
            guardarOrdenTareas({
                idTarea,
                nuevaPos,
                ordenNuevo,
                sesionArriba,
                dataArriba,
                subtarea: nuevaEsSubtarea,
                padre
            });
        } else {
            // MODO GRUPAL: se toma el array de ids de las tareas arrastradas y se determina la posición
            const draggedIds = arrastrandoElems.map(el => el.getAttribute('id-post'));
            // Se toma la menor posición (la del primer elemento en el nuevo orden)
            const primeraPos = Math.min(...draggedIds.map(id => ordenNuevo.indexOf(id)));
            guardarOrdenTareasGrupo({
                tareasMovidas: draggedIds,
                nuevaPos: primeraPos,
                ordenNuevo
            });
        }
    }

    // Se quitan las clases de “arrastre” y se limpian las variables
    arrastrandoElems.forEach(el => el.classList.remove('dragging'));
    document.body.classList.remove('dragging-active');
    listaMov.removeEventListener('mousemove', manejarMov);
    listaMov.removeEventListener('mouseup', finalizarArrastre);

    arrastrandoElem = null;
    arrastrandoElems = [];
    idTarea = null;
    ordenViejo = [];
    posInicialY = null;
    movRealizado = false;
    subtareasArrastradas = [];
    esSubtarea = false;
}

/* Función para obtener datos de la tarea de referencia (sin cambios respecto a la versión original) */
function obtenerSesionYData() {
    let sesionArriba = null;
    let dataArriba = null;
    let anterior = (arrastrandoElem || arrastrandoElems[0]).previousElementSibling;
    while (anterior) {
        if (anterior.classList.contains('POST-tarea')) {
            sesionArriba = anterior.getAttribute('sesion');
            dataArriba = anterior.getAttribute('data-sesion');
        } else if (anterior.classList.contains('divisorTarea')) {
            sesionArriba = sesionArriba || anterior.getAttribute('data-valor');
            dataArriba = dataArriba || anterior.getAttribute('data-valor');
        }
        if (sesionArriba !== null && dataArriba !== null) break;
        anterior = anterior.previousElementSibling;
    }
    return {sesionArriba, dataArriba};
}

/* Función que determina si la tarea cambia a subtarea (se usa en modo individual) */
function esSubtareaNueva() {
    // Si la tarea que se está arrastrando es una tarea padre por clase, NUNCA puede ser una subtarea nueva.
    // arrastrandoElem es la tarea individual que se está evaluando.
    if (arrastrandoElem && arrastrandoElem.classList.contains('tarea-padre')) {
        return false;
    }

    // Usar wrappers .tareaItem y .POST-tarea para evaluar vecinos reales
    const wrap = (arrastrandoElem.closest && arrastrandoElem.closest('.tareaItem')) || arrastrandoElem;

    function buscarAnteriorPost(w) {
        let p = w.previousElementSibling;
        while (p) {
            if (p.classList && p.classList.contains('divisorTarea')) { p = p.previousElementSibling; continue; }
            const cand = p.querySelector ? (p.querySelector('.POST-tarea') || null) : (p.classList && p.classList.contains('POST-tarea') ? p : null);
            if (cand) return cand;
            p = p.previousElementSibling;
        }
        return null;
    }

    function buscarSiguientePost(w) {
        let n = w.nextElementSibling;
        while (n) {
            if (n.classList && n.classList.contains('divisorTarea')) { n = n.nextElementSibling; continue; }
            const cand = n.querySelector ? (n.querySelector('.POST-tarea') || null) : (n.classList && n.classList.contains('POST-tarea') ? n : null);
            if (cand) return cand;
            n = n.nextElementSibling;
        }
        return null;
    }

    const anteriorPost = buscarAnteriorPost(wrap);
    const siguientePost = buscarSiguientePost(wrap);
    const prevSibling = wrap.previousElementSibling;
    const topOdivisor = !prevSibling || (prevSibling && prevSibling.classList && prevSibling.classList.contains('divisorTarea'));

    if (anteriorPost && siguientePost) {
        const antEsSub = anteriorPost.getAttribute('subtarea') === 'true';
        const sigEsSub = siguientePost.getAttribute('subtarea') === 'true';
        const padreAnt = anteriorPost.getAttribute('padre');
        const padreSig = siguientePost.getAttribute('padre');
        const idArr = arrastrandoElem.getAttribute('id-post');
        if (antEsSub && sigEsSub && padreAnt && padreAnt === padreSig && padreAnt !== idArr) {
            return true;
        }
    }

    // Si está al inicio o justo después de un divisor de sección, NO convertir a subtarea
    if (topOdivisor) {
        // salvo si el siguiente es su padre original Y arriba hay una subtarea del mismo padre (sigue en bloque)
        if (siguientePost && siguientePost.getAttribute('id-post') === arrastrandoElem.getAttribute('padre')) {
            if (anteriorPost && anteriorPost.getAttribute('subtarea') === 'true' && anteriorPost.getAttribute('padre') === siguientePost.getAttribute('id-post')) {
                return true;
            }
        }
        return false;
    }

    if (siguientePost && siguientePost.getAttribute('subtarea') === 'true') {
        if (arrastrandoElem.getAttribute('id-post') !== siguientePost.getAttribute('padre')) {
            return true;
        }
    }

    if (siguientePost && siguientePost.getAttribute('id-post') === arrastrandoElem.getAttribute('padre')) {
        return true;
    }

    return false;
}

function cambioASubtarea() {
    const nuevaEsSubtarea = esSubtareaNueva();
    const cambioSubtarea = nuevaEsSubtarea !== esSubtarea;
    if (cambioSubtarea) {
        window.reiniciarPost(idTarea, 'tarea');
    }
    return {nuevaEsSubtarea};
}

/* Función para guardar el nuevo orden cuando se mueve una sola tarea (modo individual) */
// js/taskmove.js

async function guardarOrdenTareas({idTarea, nuevaPos, ordenNuevo, sesionArriba, dataArriba, subtarea, padre}) {
    let log = `guardarOrdenTareas: TareaID ${idTarea}, NuevaPos ${nuevaPos}, Sesion ${sesionArriba}, EsSubtarea ${subtarea}, PadreID ${padre}. `;
    let datosParaServidor = {
        tareaMovida: idTarea,
        nuevaPos,
        ordenNuevo,
        sesionArriba,
        dataArriba,
        subtarea,
        padre: subtarea ? padre : null
    };

    // console.log(log + `Datos enviados: ${JSON.stringify(datosParaServidor)}`);

    try {
        const res = await enviarAjax('actualizarOrdenTareas', datosParaServidor);
        let logRes = `guardarOrdenTareas AJAX Res: TareaID ${idTarea}. `;
        if (res && res.success) {
            logRes += `Éxito. `;

            await window.reiniciarPost(idTarea, 'tarea'); // Esperamos a que el post se reinicie y actualice en el DOM

            // --- INICIO DE LA MODIFICACIÓN ---
            const tareaElem = document.querySelector(`.POST-tarea[id-post="${idTarea}"]`);
            if (tareaElem) {
                const idPadre = tareaElem.getAttribute('padre');
                if (idPadre) {
                    // Si ahora es una subtarea y tiene un padre definido
                    const padreElem = document.querySelector(`.POST-tarea[id-post="${idPadre}"]`);
                    if (padreElem && padreElem.parentNode === listaMov) {
                        // Asegurarse que el padre está en la misma lista
                        // Mover la tarea para que esté directamente después de su padre
                        // Si el padre ya tiene otras subtareas, la nueva se colocará al final de ellas.
                        let ultimoHermano = padreElem;
                        while (ultimoHermano.nextElementSibling && ultimoHermano.nextElementSibling.getAttribute('padre') === idPadre) {
                            ultimoHermano = ultimoHermano.nextElementSibling;
                        }

                        if (ultimoHermano.nextSibling) {
                            listaMov.insertBefore(tareaElem.closest('.tareaItem') || tareaElem, (ultimoHermano.closest('.tareaItem') || ultimoHermano).nextSibling);
                        } else {
                            listaMov.appendChild(tareaElem.closest('.tareaItem') || tareaElem);
                        }
                        logRes += `Tarea ${idTarea} reubicada bajo padre ${idPadre}. `;
                    } else {
                        logRes += `Padre ${idPadre} no encontrado o no en la lista para tarea ${idTarea}. `;
                    }
                }
            } else {
                logRes += `Tarea ${idTarea} no encontrada en el DOM después de reiniciarPost. `;
            }
            // --- FIN DE LA MODIFICACIÓN ---

            // Opcional: Si la reorganización general de secciones es necesaria después de esto.
            // if (typeof window.dividirTarea === 'function') {
            //     await window.dividirTarea();
            // }
        } else {
            logRes += `Error en respuesta: ${JSON.stringify(res)}. `;
            console.error('Hubo un error en la respuesta del servidor:', res);
        }
        // console.log(logRes);
    } catch (err) {
        // console.log(`guardarOrdenTareas AJAX Catch: TareaID ${idTarea}. Error: ${err}`);
        console.error('Error en la petición AJAX:', err);
    }
}

/* Función para guardar el nuevo orden cuando se mueven varias tareas (modo grupal) */
function guardarOrdenTareasGrupo({tareasMovidas, nuevaPos, ordenNuevo}) {
    let data = {
        tareasMovidas, // array de ids de las tareas arrastradas
        nuevaPos, // posición de inserción (la del primer elemento del grupo)
        ordenNuevo
    };
    enviarAjax('actualizarOrdenTareasGrupo', data)
        .then(res => {
            if (res && res.success) {
                // Opcional: reiniciar cada tarea del grupo
                tareasMovidas.forEach(id => window.reiniciarPost(id, 'tarea'));
                //dibujarLineasSubtareas();
            } else {
                console.error('Hubo un error en la respuesta del servidor:', res);
            }
        })
        .catch(err => {
            console.error('Error en la petición AJAX:', err);
        });
}
