// js/taskProperties.js

window.ocultarBotones = function() {
    const elementosLi = document.querySelectorAll('.draggable-element'); // Asumo que esta es la clase de tus <li> o contenedores de tarea

    elementosLi.forEach(li => {
        // Evita añadir listeners múltiples veces al mismo elemento li
        if (li.dataset.botonesOcultosInicializados) {
            // Si los elementos ocultos pudieran cambiar dinámicamente DESPUÉS de esta inicialización,
            // se necesitaría una lógica más compleja para actualizar los listeners o los elementos cacheados.
            // Por ahora, asumimos que una vez que un li es procesado, sus hijos 'ocultadoAutomatico' no cambian.
            return;
        }

        const elementosOcultos = li.querySelectorAll('.ocultadoAutomatico'); // Clave: seleccionar TODOS

        if (elementosOcultos.length > 0) {
            const manejadorMouseOver = () => {
                elementosOcultos.forEach(eo => {
                    // La condición "solo aparecera cuando la tarea no tenga fecha limite"
                    // la maneja tu PHP al no generar el div si ya hay fecha, o no dándole la clase 'ocultadoAutomatico'.
                    // Por lo tanto, si el elemento está aquí y tiene 'ocultadoAutomatico', debe mostrarse.
                    eo.style.display = 'flex';
                });
            };

            const manejadorMouseOut = () => {
                elementosOcultos.forEach(eo => {
                    eo.style.display = 'none';
                });
            };

            li.addEventListener('mouseover', manejadorMouseOver);
            li.addEventListener('mouseout', manejadorMouseOut);

            // Guardar referencias a los manejadores si necesitaras removerlos específicamente después
            // li._manejadorMouseOverBotonesOcultos = manejadorMouseOver;
            // li._manejadorMouseOutBotonesOcultos = manejadorMouseOut;

            li.dataset.botonesOcultosInicializados = 'true'; // Marcar como inicializado
        }
    });
}

window.actSel = function(obj, val, txtPredeterminado = '') {
    // Manejo seguro: si no hay objeto o no tiene selector en DOM, actualizar solo el valor y salir
    if (!obj) return;
    if (!obj.selector) {
        obj.valor = val;
        return;
    }

    let ico = obj.selector.querySelector('span.icono');
    if (!ico) {
        // Si no existe el span.icono esperado, solo actualizar valor y salir sin fallar
        obj.valor = val;
        return;
    }

    // Limpiar contenido previo (texto) del span.icono, dejando el SVG/ícono base
    while (ico.childNodes.length > 1 && (ico.lastChild.nodeType === Node.TEXT_NODE || (ico.lastChild.tagName && ico.lastChild.tagName === 'P'))) {
        ico.removeChild(ico.lastChild);
    }

    let textoAMostrar = '';
    if (val) {
        if (obj === fechaLimite) {
            // Formatear fecha si es el selector de fecha
            const partesFecha = ('' + val).split('-'); // val es YYYY-MM-DD
            if (partesFecha.length === 3) {
                // Formato corto: DD/MM
                textoAMostrar = `${partesFecha[2]}/${partesFecha[1]}`;
            } else {
                textoAMostrar = val;
            }
        } else {
            textoAMostrar = val;
        }
    } else if (txtPredeterminado) {
        // Solo si se proporciona explícitamente un texto predeterminado
        textoAMostrar = txtPredeterminado;
    }

    if (textoAMostrar) {
        // Solo añadir el <p> si hay algo que mostrar
        let txtElem = document.createElement('p');
        txtElem.textContent = textoAMostrar;
        ico.appendChild(txtElem);
    }
    obj.valor = val;
}

window.selectorTipoTarea = function() {
    // Vincular los nuevos disparadores basados en data-submenu
    importancia.selector = document.querySelector('[data-submenu="importanciaSubmenu"]');
    tipoTarea.selector = document.querySelector('[data-submenu="tipoTareaSubmenu"]');
    // Fecha límite ahora la maneja el calendario Glory; mantenemos el objeto por compatibilidad
    fechaLimite.selector = document.querySelector('.gloryCalendario');

    // Delegar selección dentro de los submenus (apertura/cierre lo maneja submenus.js)
    const impMenu = document.getElementById('importanciaSubmenu');
    if (impMenu) {
        impMenu.addEventListener('click', event => {
            const btn = event.target.closest('button');
            if (!btn) return;
            const val = (btn.value || btn.textContent || '').trim().toLowerCase();
            if (!val) return;
            actSel(importancia, val);
        });
    }

    const tipoMenu = document.getElementById('tipoTareaSubmenu');
    if (tipoMenu) {
        tipoMenu.addEventListener('click', event => {
            const btn = event.target.closest('button');
            if (!btn) return;
            const val = (btn.value || btn.textContent || '').trim().toLowerCase();
            if (!val) return;
            actSel(tipoTarea, val);
        });
    }

    // Establecer valores iniciales coherentes con el HTML por defecto
    actSel(importancia, 'baja');
    actSel(tipoTarea, 'una vez');
    actSel(fechaLimite, null);
}

window.prioridadTarea = function() {
    const boton = document.querySelector('.prioridadTareas');

    if (boton.dataset.eventoAgregado) return;

    boton.addEventListener('click', async () => {
        try {
            // Pedir al backend que calcule y persista el orden por prioridad
            await enviarAjax('priorizarTareas', {});
            // Refrescar lista agnósticamente desde ContentRender (34 sin paginación)
            await window.reiniciarContenido({
                postType: 'tarea',
                publicacionesPorPagina: 34,
                claseContenedor: 'listaTareas bloque',
                claseItem: 'tareaItem',
                plantilla: 'plantillaTarea'
            });
            try { if (typeof initTareas === 'function') initTareas(); } catch (_) {}
        } catch (e) {
            console.error('prioridadTarea: error', e);
        }
    });

    boton.dataset.eventoAgregado = 'true';
}

window.cambiarFrecuencia = function() {
    document.querySelectorAll('.divFrecuencia').forEach(div => {
        const listenerExistente = div.funcionListenerFrecuencia;
        if (listenerExistente) {
            div.removeEventListener('click', listenerExistente);
        }

        const nuevaFuncionListener = async function (event) {
            event.stopPropagation(); // Evita que el listener del documento cierre el menú inmediatamente

            const divClicado = this;
            const tareaId = divClicado.dataset.tarea;
            const li = document.querySelector(`.POST-tarea[id-post="${tareaId}"]`);

            if (!li) return;

            // Verificar si ya hay un menú de frecuencia abierto PARA ESTA TAREA
            const menuExistente = li.nextElementSibling;
            if (menuExistente && menuExistente.classList.contains('opcionesFrecuencia') && menuExistente.dataset.tareaMenuId === tareaId) {
                menuExistente.remove();
                if (window.cerrarMenuSiClicFueraFrecuenciaHandler) {
                    document.removeEventListener('click', window.cerrarMenuSiClicFueraFrecuenciaHandler);
                    window.cerrarMenuSiClicFueraFrecuenciaHandler = null;
                }
                return; // Menú estaba abierto, ahora cerrado (toggle)
            }

            // Si no hay menú para esta tarea, o si hay otro menú abierto, cerrar todos los menús primero
            window.hideAllOpenTaskMenus();

            const ops = document.createElement('div');
            ops.classList.add('opcionesFrecuencia');
            ops.dataset.tareaMenuId = tareaId; // Marcar el menú con el ID de la tarea
            ops.innerHTML = `
                <p data-frecuencia="1">diaria</p>
                <p data-frecuencia="7">semanal</p>
                <p data-frecuencia="30">mensual</p>
                <div class="frecuenciaPersonalizada">
                    <input type="number" id="diasPersonalizados" min="2" max="365" placeholder="Cada X dias">
                    <button id="btnPersonalizar">${window.enviarMensaje || 'Enviar'}</button>
                </div>
            `;

            li.after(ops);

            // Definir y guardar el manejador para poder removerlo
            window.cerrarMenuSiClicFueraFrecuenciaHandler = e => {
                if (!ops.contains(e.target) && !divClicado.contains(e.target)) {
                    ops.remove();
                    if (window.cerrarMenuSiClicFueraFrecuenciaHandler) {
                        document.removeEventListener('click', window.cerrarMenuSiClicFueraFrecuenciaHandler);
                        window.cerrarMenuSiClicFueraFrecuenciaHandler = null;
                    }
                }
            };

            setTimeout(() => {
                // Añadir listener después del ciclo de evento actual
                document.addEventListener('click', window.cerrarMenuSiClicFueraFrecuenciaHandler);
            }, 0);

            const ps = ops.querySelectorAll('p:not([data-frecuencia="personalizada"])');
            ps.forEach(p => {
                p.addEventListener('click', evP => {
                    evP.stopPropagation();
                    const frec = p.dataset.frecuencia;
                    const data = {
                        tareaId: tareaId,
                        frecuencia: parseInt(frec)
                    };
                    actualizarFrecuencia(data, divClicado); // Asumiendo que actualizarFrecuencia existe
                    ops.remove();
                    if (window.cerrarMenuSiClicFueraFrecuenciaHandler) {
                        document.removeEventListener('click', window.cerrarMenuSiClicFueraFrecuenciaHandler);
                        window.cerrarMenuSiClicFueraFrecuenciaHandler = null;
                    }
                });
            });

            const btn = ops.querySelector('#btnPersonalizar');
            btn.addEventListener('click', evBtn => {
                evBtn.stopPropagation();
                const input = ops.querySelector('#diasPersonalizados');
                const dias = parseInt(input.value);
                if (dias >= 2 && dias <= 365) {
                    const data = {
                        tareaId: tareaId,
                        frecuencia: dias
                    };
                    actualizarFrecuencia(data, divClicado); // Asumiendo que actualizarFrecuencia existe
                    ops.remove();
                    if (window.cerrarMenuSiClicFueraFrecuenciaHandler) {
                        document.removeEventListener('click', window.cerrarMenuSiClicFueraFrecuenciaHandler);
                        window.cerrarMenuSiClicFueraFrecuenciaHandler = null;
                    }
                }
            });
        };

        div.addEventListener('click', nuevaFuncionListener);
        div.funcionListenerFrecuencia = nuevaFuncionListener;
    });
}

async function actualizarFrecuencia(data, div) {
    try {
        const rta = await enviarAjax('cambiarFrecuencia', data);
        if (rta && rta.success) {
            try {
                const html = await window.reiniciarPost(data.tareaId, 'tarea');
                if (html) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const nuevaTarea = doc.querySelector('.POST-tarea');
                    const tareaActual = document.querySelector(`.POST-tarea[id-post="${data.tareaId}"]`);
                    if (nuevaTarea && tareaActual) {
                        tareaActual.outerHTML = nuevaTarea.outerHTML;
                        try { if (typeof initTareas === 'function') initTareas(); } catch (_) {}
                    } else if (nuevaTarea) {
                        const lista = document.querySelector('.listaTareas');
                        if (lista) {
                            lista.insertAdjacentHTML('afterbegin', nuevaTarea.outerHTML);
                            try { if (typeof initTareas === 'function') initTareas(); } catch (_) {}
                        }
                    }
                }
            } catch (errDom) {
                console.error('actualizarFrecuencia: Error al actualizar UI:', errDom);
            }
        } else {
            console.error('actualizarFrecuencia: Error en respuesta AJAX', rta && rta.data ? rta.data : rta);
        }
    } catch (e) {
        console.error('actualizarFrecuencia: Excepción', e);
    }
}

window.cambiarPrioridad = function() {
    document.querySelectorAll('.divImportancia').forEach(div => {
        const listenerExistente = div.funcionListenerPrioridad;
        if (listenerExistente) {
            div.removeEventListener('click', listenerExistente);
        }
        const nuevaFuncionListener = manejarClicPrioridad;
        div.addEventListener('click', nuevaFuncionListener);
        div.funcionListenerPrioridad = nuevaFuncionListener;
    });
}

window.manejarClicPrioridad = async function(event) {
    // Este es el listener para el click en .divImportancia
    event.stopPropagation(); //Añadido para que el listener global no lo cierre al instante

    const divPrioridadOriginal = this;
    const idOriginal = divPrioridadOriginal.dataset.tarea;
    const liOriginal = document.querySelector(`.POST-tarea[id-post="${idOriginal}"]`);

    if (!liOriginal) return;

    // Lógica de Toggle: Buscar si ya hay un menú de prioridad abierto PARA ESTA TAREA
    const menuExistente = liOriginal.nextElementSibling;
    if (menuExistente && menuExistente.classList.contains('opcionesPrioridad') && menuExistente.dataset.tareaMenuId === idOriginal) {
        menuExistente.remove();
        if (window.cerrarMenuSiClicFueraPrioridadHandler) {
            document.removeEventListener('click', window.cerrarMenuSiClicFueraPrioridadHandler);
            window.cerrarMenuSiClicFueraPrioridadHandler = null;
        }
        return; // Menú estaba abierto, ahora cerrado (toggle)
    }

    // Si no hay menú para esta tarea, o si hay otro menú abierto, cerramos cualquier otro menú de prioridad/frecuencia que esté abierto
    window.hideAllOpenTaskMenus();

    const ops = document.createElement('div');
    ops.classList.add('opcionesPrioridad');
    ops.dataset.tareaMenuId = idOriginal; // Marcar el menú con el ID de la tarea
    ops.innerHTML = `
        <p data-prioridad="baja">${window.iconbaja || 'B'} baja</p>
        <p data-prioridad="media">${window.iconMedia || 'M'} media</p>
        <p data-prioridad="alta">${window.iconAlta || 'A'} alta</p>
        <p data-prioridad="importante">${window.iconimportante || 'I'} importante</p>
      `;
    liOriginal.after(ops); // Insertar el menú después del elemento de la tarea

    // Definir y guardar el manejador para poder removerlo
    window.cerrarMenuSiClicFueraPrioridadHandler = e => {
        // Si el clic NO es dentro del menú Y NO es en el botón que lo abrió
        if (!ops.contains(e.target) && !divPrioridadOriginal.contains(e.target)) {
            ops.remove();
            if (window.cerrarMenuSiClicFueraPrioridadHandler) {
                document.removeEventListener('click', window.cerrarMenuSiClicFueraPrioridadHandler);
                window.cerrarMenuSiClicFueraPrioridadHandler = null;
            }
        }
    };

    setTimeout(() => {
        // Añadir listener después del ciclo de evento actual
        document.addEventListener('click', window.cerrarMenuSiClicFueraPrioridadHandler);
    }, 0);

    const ps = ops.querySelectorAll('p');
    ps.forEach(p => {
        p.addEventListener('click', async evP => {
            // Renombrado event a evP
            evP.stopPropagation(); // Detener la propagación para clics en items del menú

            const prioSeleccionada = p.dataset.prioridad;
            const tareasSelActuales = tareasSeleccionadas || []; // Asegurarse que tareasSeleccionadas existe

            // console.log(`DEBUG cambiarPrioridad: idOriginal: "${idOriginal}", Prio: ${prioSeleccionada}, tareasSelActuales: ${JSON.stringify(tareasSelActuales)}, incluyeOriginal: ${tareasSelActuales.includes(idOriginal)}, longitud > 1: ${tareasSelActuales.length > 1}`);

            let logs = `cambiarPrioridad: Opción '${prioSeleccionada}' seleccionada para tarea original ${idOriginal}. `;

            let idsParaProcesar = [idOriginal];
            if (tareasSelActuales.length > 1 && tareasSelActuales.includes(idOriginal)) {
                idsParaProcesar = [...tareasSelActuales];
                logs += `Detectada seleccion multiple (${idsParaProcesar.length} tareas). `;
            } else {
                logs += `Accion individual. `;
            }

            // Cerrar menú y remover listener de clic fuera
            ops.remove();
            if (window.cerrarMenuSiClicFueraPrioridadHandler) {
                document.removeEventListener('click', window.cerrarMenuSiClicFueraPrioridadHandler);
                window.cerrarMenuSiClicFueraPrioridadHandler = null;
            }

            let logsFinales = logs;

            async function procesarUnaTarea(id, prio) {
                const data = {tareaId: id, prioridad: prio};
                try {
                    const rta = await enviarAjax('cambiarPrioridad', data);
                    if (rta.success) {
                        logsFinales += `Éxito AJAX para ${id}. Reiniciando post. `;
                        try {
                            // Esperar el HTML actualizado del servidor y reemplazar la tarea en el DOM
                            const html = await window.reiniciarPost(id, 'tarea');
                            if (html) {
                                try {
                                    const parser = new DOMParser();
                                    const doc = parser.parseFromString(html, 'text/html');
                                    const nuevaTarea = doc.querySelector('.POST-tarea');
                                    const tareaActual = document.querySelector(`.POST-tarea[id-post="${id}"]`);
                                    if (nuevaTarea && tareaActual) {
                                        tareaActual.outerHTML = nuevaTarea.outerHTML;
                                        try { if (typeof initTareas === 'function') initTareas(); } catch (_) {}
                                    } else if (nuevaTarea) {
                                        // Si no existe la tarea en el DOM por alguna razón, añadir al inicio de la lista
                                        const lista = document.querySelector('.listaTareas');
                                        if (lista) {
                                            lista.insertAdjacentHTML('afterbegin', nuevaTarea.outerHTML);
                                            try { if (typeof initTareas === 'function') initTareas(); } catch (_) {}
                                        }
                                    }
                                } catch (errDom) {
                                    console.error('Error al parsear/reemplazar HTML de tarea:', errDom);
                                }
                            }
                        } catch (err) {
                            console.error('Error al reiniciarPost para actualizar tarea:', err);
                        }
                    } else {
                        let m = `Error AJAX para ${id}.`;
                        if (rta.data) m += ' Detalles: ' + rta.data;
                        logsFinales += m + ' ';
                    }
                } catch (err) {
                    logsFinales += `Excepcion AJAX para ${id}: ${err}. `;
                }
            }

            for (let i = 0; i < idsParaProcesar.length; i++) {
                const id = idsParaProcesar[i];
                await procesarUnaTarea(id, prioSeleccionada);
                if (idsParaProcesar.length > 1 && i < idsParaProcesar.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            console.log(logsFinales + 'Fin cambiarPrioridad.');
        });
    });
}
