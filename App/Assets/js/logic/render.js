/* eslint-disable func-names */
(function (window) {
    'use strict';

    const app = window.GloryLogic;
    if (!app) return;

    const {
        refs,
        state,
        timerRefs,
        timers,
        habitButtonsRefs,
        helpFallback,
        helpFallbackGlobal,
    } = app;
    const { formatear, formatearFechaLocal, limpiarHabitos, normalizarHistorial } = app.utils;
    const iconos = {
        pausa: '<svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 2.5V1.75H4V2.5V13.5V14.25H5.5V13.5V2.5ZM12 2.5V1.75H10.5V2.5V13.5V14.25H12V13.5V2.5Z" fill="currentColor"></path></svg>',
        liberar: '<svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z" fill="currentColor"></path></svg>',
    };

    function renderHabitos() {
        if (!refs.habitsContainer) return;
        refs.habitsContainer.innerHTML = '';
        habitButtonsRefs.length = 0;

        if (refs.habitMenu) {
            refs.habitMenu.classList.remove('activo');
            refs.habitMenu.style.display = 'none';
        }
        state.habitMenuTarget = '';

        const botonAgregar = document.createElement('button');
        botonAgregar.type = 'button';
        botonAgregar.className = 'logicHabitBtn logicHabitAddBtn';
        botonAgregar.dataset.logicHabitTrigger = 'create';
        botonAgregar.textContent = 'Añadir otro';

        if (!state.habitos.length) {
            const mensaje = document.createElement('p');
            mensaje.className = 'logicHabitEmpty';
            mensaje.textContent = 'Agrega hábitos rápidos para reutilizarlos.';
            refs.habitsContainer.appendChild(mensaje);
            refs.habitsContainer.appendChild(botonAgregar);
            return;
        }

        state.habitos.forEach((habito) => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'logicHabitBtn';
            boton.textContent = habito;
            boton.dataset.logicHabit = habito;
            boton.addEventListener('click', () => {
                if (app.actions && app.actions.fijarPaso) {
                    app.actions.fijarPaso(habito);
                }
            });
            refs.habitsContainer.appendChild(boton);
            habitButtonsRefs.push(boton);
        });

        refs.habitsContainer.appendChild(botonAgregar);

        actualizarDisponibilidad();
    }

    function renderList() {
        if (!refs.lista) return;

        timerRefs.clear();
        refs.lista.innerHTML = '';

        if (!Array.isArray(state.tareas) || state.tareas.length === 0) {
            if (refs.vacio) refs.vacio.classList.remove('is-hidden');
            return;
        }
        if (refs.vacio) refs.vacio.classList.add('is-hidden');

        state.tareas.forEach((tarea) => {
            const item = document.createElement('li');
            item.className = `logicItem${tarea.pausado ? ' is-paused' : ''}`;
            item.dataset.taskId = String(tarea.id);
            item.dataset.paused = tarea.pausado ? '1' : '0';

            item.setAttribute('draggable', state.tareas.length > 1 ? 'true' : 'false');
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);

            const content = document.createElement('div');
            content.className = 'logicItemContent';

            const titulo = document.createElement('span');
            titulo.className = 'logicItemTitle';
            titulo.textContent = tarea.titulo || '';
            content.appendChild(titulo);

            const timer = document.createElement('span');
            timer.className = 'logicItemTimer';
            timer.textContent = tarea.elapsedLabel || '00:00:00';
            timerRefs.set(String(tarea.id), timer);
            content.appendChild(timer);

            if (tarea.pausado) {
                const badge = document.createElement('span');
                badge.className = 'logicItemBadge';
                badge.textContent = 'En pausa';
                content.appendChild(badge);
            }

            item.appendChild(content);

            const botonPausa = document.createElement('button');
            botonPausa.type = 'button';
            botonPausa.className = 'logicItemPause';
            botonPausa.dataset.taskId = String(tarea.id);
            const etiquetaPausa = tarea.pausado ? (app.mensajes.resume || 'Reanudar') : (app.mensajes.pause || 'Pausar');
            botonPausa.setAttribute('aria-label', etiquetaPausa);
            botonPausa.title = etiquetaPausa;
            botonPausa.innerHTML = iconos.pausa;
            botonPausa.addEventListener('click', () => {
                if (app.actions && app.actions.alternarPausa) {
                    app.actions.alternarPausa(tarea.id, tarea.pausado);
                }
            });
            item.appendChild(botonPausa);

            const botonEliminar = document.createElement('button');
            botonEliminar.type = 'button';
            botonEliminar.className = 'logicItemRemove';
            botonEliminar.dataset.taskId = String(tarea.id);
            const etiquetaLiberar = 'Liberar';
            botonEliminar.setAttribute('aria-label', etiquetaLiberar);
            botonEliminar.title = etiquetaLiberar;
            botonEliminar.innerHTML = iconos.liberar;
            botonEliminar.addEventListener('click', () => {
                if (app.actions && app.actions.liberarPaso) {
                    app.actions.liberarPaso(tarea.id);
                }
            });
            item.appendChild(botonEliminar);

            const botonBorrar = document.createElement('button');
            botonBorrar.type = 'button';
            botonBorrar.className = 'logicItemRemove logicItemDelete';
            botonBorrar.dataset.taskId = String(tarea.id);
            const etiquetaBorrar = 'Eliminar';
            botonBorrar.setAttribute('aria-label', etiquetaBorrar);
            botonBorrar.title = etiquetaBorrar;
            botonBorrar.innerHTML = '<svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path></svg>';
            botonBorrar.addEventListener('click', () => {
                if (app.actions && app.actions.eliminarPaso) {
                    app.actions.eliminarPaso(tarea.id);
                }
            });
            item.appendChild(botonBorrar);

            refs.lista.appendChild(item);
        });

        actualizarDisponibilidad();
    }

    function renderHistorial() {
        if (!refs.historyList) return;
        refs.historyList.innerHTML = '';

        if (!state.historial.length) {
            if (refs.historyEmpty) refs.historyEmpty.classList.remove('is-hidden');
            return;
        }
        if (refs.historyEmpty) refs.historyEmpty.classList.add('is-hidden');

        state.historial.forEach((entrada) => {
            const item = document.createElement('li');
            item.className = 'logicHistoryItem';
            item.dataset.historyId = String(entrada.id);

            const info = document.createElement('div');
            info.className = 'logicHistoryInfo';

            const titulo = document.createElement('span');
            titulo.className = 'logicHistoryTitle';
            titulo.textContent = entrada.titulo || 'Paso completado';
            info.appendChild(titulo);

            if (entrada.duracionLabel) {
                const duracion = document.createElement('span');
                duracion.className = 'logicHistoryDuration';
                duracion.textContent = `Duración: ${entrada.duracionLabel}`;
                info.appendChild(duracion);
            }

            const fechas = document.createElement('span');
            fechas.className = 'logicHistoryDates';
            const inicio = formatearFechaLocal(entrada.inicioUtc, entrada.inicioTimestamp);
            const fin = formatearFechaLocal(entrada.finUtc, entrada.finTimestamp);
            fechas.textContent = `${inicio} — ${fin}`;
            info.appendChild(fechas);

            item.appendChild(info);

            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'logicHistoryDelete';
            boton.dataset.historyId = String(entrada.id);
            boton.style.border = 'none';
            boton.style.background = 'transparent';
            boton.style.padding = '4px';
            boton.style.cursor = 'pointer';
            boton.innerHTML = '<svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path></svg>';
            boton.addEventListener('click', () => {
                if (app.actions && app.actions.eliminarHistorial) {
                    app.actions.eliminarHistorial(entrada.id);
                }
            });

            item.appendChild(boton);

            refs.historyList.appendChild(item);
        });
    }

    function renderMensajeAyuda() {
        const texto = state.mensajeAyuda ? state.mensajeAyuda.texto : '';
        const expira = state.mensajeAyuda && state.mensajeAyuda.visibleHastaTimestamp
            ? formatearFechaLocal(state.mensajeAyuda.visibleHastaUtc, state.mensajeAyuda.visibleHastaTimestamp)
            : '';

        if (refs.helpDisplay) {
            refs.helpDisplay.textContent = texto
                ? `${texto}${expira ? ` · Visible hasta ${expira}` : ''}`
                : helpFallback;
            refs.helpDisplay.classList.toggle('is-empty', !texto);
        }

        if (refs.helpGlobal) {
            refs.helpGlobal.textContent = texto || helpFallbackGlobal;
            refs.helpGlobal.classList.toggle('is-empty', !texto);
            refs.helpGlobal.setAttribute('aria-hidden', !texto ? 'true' : 'false');
        }
    }

    function prepararFormularios() {
        if (refs.helpInput && state.mensajeAyuda && state.mensajeAyuda.texto) {
            refs.helpInput.value = state.mensajeAyuda.texto;
        }
        if (refs.helpDuration && state.mensajeAyuda && state.mensajeAyuda.duracionSegundos) {
            const duracion = String(state.mensajeAyuda.duracionSegundos);
            const opcionExiste = Array.from(refs.helpDuration.options)
                .some((opcion) => opcion.value === duracion);
            if (opcionExiste) {
                refs.helpDuration.value = duracion;
            }
        }
    }

    function initTabs() {
        if (!refs.tabsWrapper) return;
        const barra = refs.tabsWrapper.querySelector('.pestanas');
        const paneles = refs.tabsWrapper.querySelectorAll('.pestanaContenido');
        if (!barra || paneles.length === 0) return;

        function activar(panel, boton) {
            paneles.forEach((panelItem) => panelItem.classList.remove('activa'));
            barra.querySelectorAll('button').forEach((btn) => btn.classList.remove('activa'));
            panel.classList.add('activa');
            boton.classList.add('activa');
        }

        paneles.forEach((panel, index) => {
            const etiqueta = panel.dataset.pestana || `Vista ${index + 1}`;
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.textContent = etiqueta;
            boton.addEventListener('click', () => activar(panel, boton));
            barra.appendChild(boton);
            if (panel.classList.contains('activa') || index === 0) {
                activar(panel, boton);
            }
        });
    }

    function actualizarDisponibilidad() {
        state.estadoLimite = app.limit > 0 && state.tareas.length >= app.limit;
        const sinEspacio = state.estadoLimite || state.bloqueado;

        if (refs.botonFijar) {
            refs.botonFijar.disabled = sinEspacio;
        }
        habitButtonsRefs.forEach((btn) => {
            btn.disabled = sinEspacio;
        });

        if (refs.lista) {
            refs.lista.querySelectorAll('button').forEach((btn) => {
                btn.disabled = state.bloqueado;
            });
        }
    }

    function actualizarTimers() {
        const ahora = Math.floor(Date.now() / 1000);
        state.tareas.forEach((tarea) => {
            const nodo = timerRefs.get(String(tarea.id));
            if (!nodo || tarea.pausado) return;
            const inicio = parseInt(tarea.inicioTimestamp, 10) || ahora;
            const transcurrido = Math.max(0, ahora - inicio);
            nodo.textContent = formatear(transcurrido);
        });
    }

    function detenerTicker() {
        if (!timers.intervalId) return;
        window.clearInterval(timers.intervalId);
        timers.intervalId = null;
    }

    function refrescarTicker() {
        detenerTicker();
        if (!Array.isArray(state.tareas) || state.tareas.length === 0) return;
        const hayActivos = state.tareas.some((tarea) => !tarea.pausado);
        if (!hayActivos) return;
        actualizarTimers();
        timers.intervalId = window.setInterval(actualizarTimers, 1000);
    }

    function setTareas(nuevas, limitFlag = null) {
        state.tareas = Array.isArray(nuevas) ? nuevas.slice() : [];
        if (typeof limitFlag === 'boolean') {
            state.estadoLimite = limitFlag;
        } else {
            state.estadoLimite = app.limit > 0 && state.tareas.length >= app.limit;
        }
        renderList();
        refrescarTicker();
        actualizarDisponibilidad();
    }

    function setHistorial(nuevos) {
        state.historial = normalizarHistorial(nuevos);
        renderHistorial();
    }

    function setHabitos(nuevos) {
        state.habitos = limpiarHabitos(nuevos);
        renderHabitos();
    }

    function handleDragStart(event) {
        if (!refs.lista || state.tareas.length < 2) {
            event.preventDefault();
            return;
        }
        const fila = event.currentTarget.closest('.logicItem');
        if (!fila) {
            event.preventDefault();
            return;
        }
        const esInteractivo = event.target.closest && event.target.closest('button, a, input, select, textarea');
        if (esInteractivo) {
            event.preventDefault();
            return;
        }
        state.dragId = fila.dataset.taskId || null;
        fila.classList.add('is-dragging');
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', state.dragId || '');
        }
    }

    function handleDragOver(event) {
        if (!state.dragId || !refs.lista) return;
        event.preventDefault();
        const despues = getDragAfterElement(refs.lista, event.clientY);
        const arrastrando = refs.lista.querySelector('.logicItem.is-dragging');
        if (!arrastrando) return;
        if (!despues) {
            refs.lista.appendChild(arrastrando);
        } else if (despues !== arrastrando) {
            refs.lista.insertBefore(arrastrando, despues);
        }
    }

    function handleDrop(event) {
        if (!state.dragId) return;
        event.preventDefault();
        actualizarOrdenDesdeDom();
    }

    function handleDragEnd(event) {
        const fila = event.currentTarget.closest('.logicItem');
        if (fila) {
            fila.classList.remove('is-dragging');
        }
        state.dragId = null;
        actualizarOrdenDesdeDom();
    }

    function getDragAfterElement(container, y) {
        const elementos = [...container.querySelectorAll('.logicItem:not(.is-dragging)')];
        return elementos.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    function actualizarOrdenDesdeDom() {
        if (!refs.lista) return;
        const nuevoOrden = Array.from(refs.lista.children)
            .map((li) => parseInt(li.dataset.taskId, 10))
            .filter((id) => !Number.isNaN(id));

        if (nuevoOrden.length !== state.tareas.length) {
            renderList();
            refrescarTicker();
            return;
        }

        const actual = state.tareas.map((t) => t.id);
        const igual = nuevoOrden.every((id, index) => id === actual[index]);
        if (igual) return;

        const mapa = new Map();
        state.tareas.forEach((t) => mapa.set(t.id, t));
        state.tareas = nuevoOrden.map((id) => mapa.get(id)).filter(Boolean);
        renderList();
        refrescarTicker();

        if (app.actions && app.actions.guardarOrden) {
            app.actions.guardarOrden(nuevoOrden);
        }
    }

    function renderContextos() {
        if (!refs.contextList) return;
        refs.contextList.innerHTML = '';

        if (!Array.isArray(state.contextos) || state.contextos.length === 0) {
            if (refs.contextEmpty) refs.contextEmpty.classList.remove('is-hidden');
            return;
        }
        if (refs.contextEmpty) refs.contextEmpty.classList.add('is-hidden');

        state.contextos.forEach((ctx) => {
            const item = document.createElement('li');
            item.className = `logicItem logicContextItem${ctx.pinned ? ' is-pinned' : ''}`;
            item.dataset.contextId = String(ctx.id);
            item.dataset.pinned = ctx.pinned ? '1' : '0';
            item.setAttribute('draggable', state.contextos.length > 1 ? 'true' : 'false');

            item.addEventListener('dragstart', handleContextDragStart);
            item.addEventListener('dragend', handleContextDragEnd);

            const handle = document.createElement('span');
            handle.className = 'logicItemHandle logicContextHandle';
            handle.setAttribute('aria-label', 'Reordenar');
            handle.setAttribute('role', 'button');
            handle.setAttribute('tabindex', '0');
            item.appendChild(handle);

            const content = document.createElement('div');
            content.className = 'logicItemContent';

            const texto = document.createElement('span');
            texto.className = 'logicItemTitle logicContextText';
            texto.contentEditable = 'true';
            texto.spellcheck = false;
            texto.textContent = ctx.texto || '';
            
            texto.addEventListener('blur', function() {
                const nuevoTexto = this.textContent.trim();
                if (nuevoTexto && nuevoTexto !== ctx.texto) {
                    if (app.actions && app.actions.actualizarContexto) {
                        app.actions.actualizarContexto(ctx.id, nuevoTexto);
                    }
                } else if (!nuevoTexto) {
                    this.textContent = ctx.texto;
                }
            });

            texto.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });

            content.appendChild(texto);

            const fecha = document.createElement('span');
            fecha.className = 'logicItemTimer logicContextDate';
            fecha.style.fontSize = '0.75em';
            fecha.style.opacity = '0.6';
            fecha.textContent = ctx.editadoLabel || ctx.creadoLabel || '';
            content.appendChild(fecha);

            item.appendChild(content);

            const botonPin = document.createElement('button');
            botonPin.type = 'button';
            botonPin.className = `logicItemPin${ctx.pinned ? ' is-pinned' : ''}`;
            botonPin.dataset.contextId = String(ctx.id);
            const etiquetaPin = ctx.pinned ? 'Desfijar' : 'Fijar';
            botonPin.setAttribute('aria-label', etiquetaPin);
            botonPin.title = etiquetaPin;
            botonPin.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>';
            botonPin.addEventListener('click', () => {
                if (app.actions && app.actions.togglePinContexto) {
                    app.actions.togglePinContexto(ctx.id);
                }
            });
            item.appendChild(botonPin);

            const botonEliminar = document.createElement('button');
            botonEliminar.type = 'button';
            botonEliminar.className = 'logicItemRemove logicContextDelete';
            botonEliminar.dataset.contextId = String(ctx.id);
            botonEliminar.setAttribute('aria-label', 'Eliminar');
            botonEliminar.title = 'Eliminar';
            botonEliminar.innerHTML = iconos.liberar;
            botonEliminar.addEventListener('click', () => {
                if (app.actions && app.actions.eliminarContexto) {
                    app.actions.eliminarContexto(ctx.id);
                }
            });
            item.appendChild(botonEliminar);

            refs.contextList.appendChild(item);
        });
    }

    function handleContextDragStart(event) {
        if (!refs.contextList || state.contextos.length < 2) {
            event.preventDefault();
            return;
        }
        const fila = event.currentTarget.closest('.logicContextItem');
        if (!fila) {
            event.preventDefault();
            return;
        }
        const esInteractivo = event.target.closest && event.target.closest('button, a, input, select, textarea, [contenteditable="true"]');
        if (esInteractivo) {
            event.preventDefault();
            return;
        }
        state.dragContextId = fila.dataset.contextId || null;
        fila.classList.add('is-dragging');
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', state.dragContextId || '');
        }
    }

    function handleContextDragOver(event) {
        if (!state.dragContextId || !refs.contextList) return;
        event.preventDefault();
        const despues = getDragAfterElementContext(refs.contextList, event.clientY);
        const arrastrando = refs.contextList.querySelector('.logicContextItem.is-dragging');
        if (!arrastrando) return;
        if (!despues) {
            refs.contextList.appendChild(arrastrando);
        } else if (despues !== arrastrando) {
            refs.contextList.insertBefore(arrastrando, despues);
        }
    }

    function handleContextDrop(event) {
        if (!state.dragContextId) return;
        event.preventDefault();
        actualizarOrdenContextosDesdeDom();
    }

    function handleContextDragEnd(event) {
        const fila = event.currentTarget.closest('.logicContextItem');
        if (fila) {
            fila.classList.remove('is-dragging');
        }
        state.dragContextId = null;
        actualizarOrdenContextosDesdeDom();
    }

    function getDragAfterElementContext(container, y) {
        const elementos = [...container.querySelectorAll('.logicContextItem:not(.is-dragging)')];
        return elementos.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    function actualizarOrdenContextosDesdeDom() {
        if (!refs.contextList) return;
        const nuevoOrden = Array.from(refs.contextList.children)
            .map((li) => parseInt(li.dataset.contextId, 10))
            .filter((id) => !Number.isNaN(id));

        if (nuevoOrden.length !== state.contextos.length) {
            renderContextos();
            return;
        }

        const actual = state.contextos.map((c) => c.id);
        const igual = nuevoOrden.every((id, index) => id === actual[index]);
        if (igual) return;

        const mapa = new Map();
        state.contextos.forEach((c) => mapa.set(c.id, c));
        state.contextos = nuevoOrden.map((id) => mapa.get(id)).filter(Boolean);
        renderContextos();

        if (app.actions && app.actions.guardarOrdenContextos) {
            app.actions.guardarOrdenContextos(nuevoOrden);
        }
    }

    function init() {
        initTabs();
        renderHabitos();
        renderList();
        renderHistorial();
        renderMensajeAyuda();
        renderContextos();
        prepararFormularios();
        refrescarTicker();
        actualizarDisponibilidad();

        if (refs.contextList) {
            refs.contextList.addEventListener('dragover', handleContextDragOver);
            refs.contextList.addEventListener('drop', handleContextDrop);
        }
    }

    app.render = {
        init,
        renderList,
        renderHabitos,
        renderHistorial,
        renderMensajeAyuda,
        renderContextos,
        prepararFormularios,
        actualizarDisponibilidad,
        actualizarTimers,
        detenerTicker,
        refrescarTicker,
        setTareas,
        setHistorial,
        setHabitos,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        actualizarOrdenDesdeDom,
    };
})(window);

