/* eslint-disable func-names */
(function (window) {
    'use strict';

    const app = window.GloryLogic;
    if (!app) return;

    const { refs, state, mensajes } = app;
    const { limpiarHabitos, normalizarMensaje } = app.utils;
    const { enviarPeticion } = app.net;
    const { setEstado } = app.feedback;

    async function fijarPaso(tituloManual = null) {
        if (state.bloqueado) return;
        const sinCupo = app.limit > 0 && state.tareas.length >= app.limit;
        if (sinCupo) {
            setEstado(mensajes.limit || 'Ya alcanzaste el límite de pasos.', true);
            return;
        }

        const valorEntrada = tituloManual !== null
            ? String(tituloManual).trim()
            : (refs.input ? refs.input.value.trim() : '');

        if (!valorEntrada) {
            setEstado(mensajes.emptyInput || 'Describe el paso antes de fijarlo.', true);
            if (refs.input && tituloManual === null) refs.input.focus();
            return;
        }

        state.bloqueado = true;
        app.render.actualizarDisponibilidad();
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_start_step', { titulo: valorEntrada });
            app.render.setTareas(respuesta.tasks, respuesta.limitReached);
            if (!tituloManual && refs.input) refs.input.value = '';
            setEstado(respuesta.mensaje || mensajes.ready || 'Listo.');
        } catch (error) {
            setEstado(error.message || mensajes.error || 'No pude guardar el paso.', true);
        } finally {
            state.bloqueado = false;
            app.render.actualizarDisponibilidad();
        }
    }

    async function liberarPaso(taskId) {
        if (!taskId || state.bloqueado) return;
        state.bloqueado = true;
        app.render.actualizarDisponibilidad();
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_finish_step', { taskId });
            app.render.setTareas(respuesta.tasks, respuesta.limitReached);
            setEstado(respuesta.mensaje || mensajes.removeDone || 'Paso liberado.');
            cargarHistorial(false);
        } catch (error) {
            setEstado(error.message || mensajes.error || 'No pude actualizar el paso.', true);
        } finally {
            state.bloqueado = false;
            app.render.actualizarDisponibilidad();
        }
    }

    async function eliminarPaso(taskId) {
        if (!taskId || state.bloqueado) return;
        state.bloqueado = true;
        app.render.actualizarDisponibilidad();
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_delete_step', { taskId });
            app.render.setTareas(respuesta.tasks, respuesta.limitReached);
            setEstado(respuesta.mensaje || 'Paso eliminado.');
        } catch (error) {
            setEstado(error.message || mensajes.error || 'No pude eliminar el paso.', true);
        } finally {
            state.bloqueado = false;
            app.render.actualizarDisponibilidad();
        }
    }

    async function alternarPausa(taskId, estaPausado) {
        if (!taskId || state.bloqueado) return;
        state.bloqueado = true;
        app.render.actualizarDisponibilidad();
        setEstado(mensajes.saving || 'Guardando…');

        const accion = estaPausado ? 'logic_resume_step' : 'logic_pause_step';
        try {
            const respuesta = await enviarPeticion(accion, { taskId });
            app.render.setTareas(respuesta.tasks, respuesta.limitReached);
            setEstado(respuesta.mensaje || (estaPausado
                ? (mensajes.resumed || 'Paso reanudado.')
                : (mensajes.paused || 'Paso pausado.')));
        } catch (error) {
            setEstado(error.message || mensajes.error || 'No pude actualizar el paso.', true);
        } finally {
            state.bloqueado = false;
            app.render.actualizarDisponibilidad();
        }
    }

    async function guardarOrden(nuevoOrden) {
        if (state.guardandoOrden) return;
        state.guardandoOrden = true;
        try {
            const respuesta = await enviarPeticion('logic_reorder_steps', { order: nuevoOrden });
            app.render.setTareas(respuesta.tasks, respuesta.limitReached);
            setEstado(respuesta.mensaje || mensajes.ready || 'Listo.');
        } catch (error) {
            setEstado(error.message || mensajes.reorderError || 'No pude guardar el nuevo orden.', true);
            app.render.renderList();
            app.render.refrescarTicker();
        } finally {
            state.guardandoOrden = false;
        }
    }

    async function guardarHabitoRapido(tituloManual) {
        const valor = typeof tituloManual === 'string' ? tituloManual.trim() : '';
        if (!valor) {
            return false;
        }
        setEstado(mensajes.saving || 'Guardando…');
        try {
            const respuesta = await enviarPeticion('logic_add_habit', { titulo: valor });
            state.habitos = limpiarHabitos(respuesta.habits);
            app.render.setHabitos(state.habitos);
            setEstado(respuesta.mensaje || mensajes.habitAdded || 'Hábito guardado.');
            return true;
        } catch (error) {
            setEstado(error.message || mensajes.habitError || 'No pude guardar el hábito.', true);
            return false;
        }
    }

    async function eliminarHabitoRapido(titulo) {
        const valor = typeof titulo === 'string' ? titulo.trim() : '';
        if (!valor) {
            return false;
        }
        setEstado(mensajes.saving || 'Guardando…');
        try {
            const respuesta = await enviarPeticion('logic_delete_habit', { titulo: valor });
            state.habitos = limpiarHabitos(respuesta.habits);
            app.render.setHabitos(state.habitos);
            setEstado(respuesta.mensaje || mensajes.habitDeleted || 'Hábito eliminado.');
            return true;
        } catch (error) {
            setEstado(error.message || mensajes.habitDeleteError || 'No pude eliminar el hábito.', true);
            return false;
        }
    }

    async function renombrarHabitoRapido(actual, nuevo) {
        const previo = typeof actual === 'string' ? actual.trim() : '';
        const actualizado = typeof nuevo === 'string' ? nuevo.trim() : '';
        if (!previo || !actualizado) {
            return false;
        }
        setEstado(mensajes.saving || 'Guardando…');
        try {
            const respuesta = await enviarPeticion('logic_rename_habit', {
                titulo: previo,
                nuevoTitulo: actualizado,
            });
            state.habitos = limpiarHabitos(respuesta.habits);
            app.render.setHabitos(state.habitos);
            setEstado(respuesta.mensaje || mensajes.habitRenamed || 'Hábito actualizado.');
            return true;
        } catch (error) {
            setEstado(error.message || mensajes.habitRenameError || 'No pude renombrar el hábito.', true);
            return false;
        }
    }

    async function cargarHistorial(mostrarEstado = false) {
        if (state.cargandoHistorial) return;
        state.cargandoHistorial = true;
        if (refs.historyRefresh) refs.historyRefresh.disabled = true;

        try {
            const respuesta = await enviarPeticion('logic_get_history', { limit: app.historyLimit });
            app.render.setHistorial(respuesta.history || []);
            if (mostrarEstado) {
                setEstado(respuesta.mensaje || mensajes.historyLoaded || 'Historial actualizado.');
            }
        } catch (error) {
            if (mostrarEstado) {
                setEstado(error.message || mensajes.error || 'No pude consultar el historial.', true);
            }
        } finally {
            state.cargandoHistorial = false;
            if (refs.historyRefresh) refs.historyRefresh.disabled = false;
        }
    }

    async function eliminarHistorial(historyId) {
        if (historyId <= 0 || state.cargandoHistorial) return;
        state.cargandoHistorial = true;
        if (refs.historyRefresh) refs.historyRefresh.disabled = true;
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_delete_history', {
                historyId,
                limit: app.historyLimit,
            });
            app.render.setHistorial(respuesta.history || []);
            setEstado(respuesta.mensaje || mensajes.historyRemoved || 'Registro eliminado.');
        } catch (error) {
            setEstado(error.message || mensajes.error || 'No pude eliminar el registro.', true);
        } finally {
            state.cargandoHistorial = false;
            if (refs.historyRefresh) refs.historyRefresh.disabled = false;
        }
    }

    async function guardarMensajeAyudaDesdeForm() {
        if (!refs.helpInput || !refs.helpDuration) return;
        const texto = refs.helpInput.value.trim();
        const duracion = parseInt(refs.helpDuration.value, 10) || 0;
        await persistirMensajeAyuda(texto, duracion);
    }

    async function limpiarMensajeAyuda() {
        if (refs.helpInput) refs.helpInput.value = '';
        await persistirMensajeAyuda('', 0);
    }

    async function persistirMensajeAyuda(texto, duracion) {
        if (refs.helpSave) refs.helpSave.disabled = true;
        setEstado(mensajes.saving || 'Guardando…');
        try {
            const respuesta = await enviarPeticion('logic_save_help_message', {
                mensaje: texto,
                duracion,
            });
            state.mensajeAyuda = normalizarMensaje(respuesta.helpMessage);
            app.render.renderMensajeAyuda();
            setEstado(respuesta.mensaje || (texto
                ? (mensajes.helpSaved || 'Mensaje actualizado.')
                : (mensajes.helpCleared || 'Mensaje eliminado.')));
        } catch (error) {
            setEstado(error.message || mensajes.helpError || 'No pude guardar el mensaje.', true);
        } finally {
            if (refs.helpSave) refs.helpSave.disabled = false;
        }
    }


    async function agregarContexto(inputRef = null, pinned = false) {
        if (state.guardandoContexto) return;
        
        const input = inputRef || refs.contextInput;
        if (!input) return;
        
        const texto = input.value.trim();
        if (!texto) {
            setEstado('Escribe el texto del contexto.', true);
            return;
        }

        state.guardandoContexto = true;
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_add_context', { texto, pinned });
            state.contextos = Array.isArray(respuesta.contexts) ? respuesta.contexts : [];
            app.render.renderContextos();
            input.value = '';
            setEstado(respuesta.mensaje || 'Contexto agregado.');
        } catch (error) {
            setEstado(error.message || 'No pude guardar el contexto.', true);
        } finally {
            state.guardandoContexto = false;
        }
    }

    async function togglePinContexto(contextId) {
        if (state.guardandoContexto || !contextId) return;

        state.guardandoContexto = true;
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_toggle_pin_context', { contextId });
            state.contextos = Array.isArray(respuesta.contexts) ? respuesta.contexts : [];
            app.render.renderContextos();
            setEstado(respuesta.mensaje || 'Contexto actualizado.');
        } catch (error) {
            setEstado(error.message || 'No pude actualizar el contexto.', true);
        } finally {
            state.guardandoContexto = false;
        }
    }


    async function actualizarContexto(contextId, texto) {
        if (state.guardandoContexto || !contextId) return;
        const textoLimpio = String(texto || '').trim();
        if (!textoLimpio) {
            setEstado('El texto no puede estar vacío.', true);
            return;
        }

        state.guardandoContexto = true;
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_update_context', { contextId, texto: textoLimpio });
            state.contextos = Array.isArray(respuesta.contexts) ? respuesta.contexts : [];
            app.render.renderContextos();
            setEstado(respuesta.mensaje || 'Contexto actualizado.');
        } catch (error) {
            setEstado(error.message || 'No pude actualizar el contexto.', true);
            app.render.renderContextos();
        } finally {
            state.guardandoContexto = false;
        }
    }

    async function eliminarContexto(contextId) {
        if (state.guardandoContexto || !contextId) return;

        state.guardandoContexto = true;
        setEstado(mensajes.saving || 'Guardando…');

        try {
            const respuesta = await enviarPeticion('logic_delete_context', { contextId });
            state.contextos = Array.isArray(respuesta.contexts) ? respuesta.contexts : [];
            app.render.renderContextos();
            setEstado(respuesta.mensaje || 'Contexto eliminado.');
        } catch (error) {
            setEstado(error.message || 'No pude eliminar el contexto.', true);
        } finally {
            state.guardandoContexto = false;
        }
    }

    async function guardarOrdenContextos(nuevoOrden) {
        if (state.guardandoContexto) return;
        state.guardandoContexto = true;
        try {
            const respuesta = await enviarPeticion('logic_reorder_contexts', { order: nuevoOrden });
            state.contextos = Array.isArray(respuesta.contexts) ? respuesta.contexts : [];
            app.render.renderContextos();
            setEstado(respuesta.mensaje || 'Orden actualizado.');
        } catch (error) {
            setEstado(error.message || 'No pude guardar el orden.', true);
            app.render.renderContextos();
        } finally {
            state.guardandoContexto = false;
        }
    }

    async function runAgent() {
        if (state.ejecutandoAgente) return;
        state.ejecutandoAgente = true;
        setEstado('Ejecutando agente (esto puede tardar unos segundos)…');
        
        try {
            const respuesta = await enviarPeticion('logic_run_agent', {});
            
            // Update full state if returned
            if (respuesta.tasks) app.render.setTareas(respuesta.tasks, respuesta.limitReached);
            if (respuesta.habits) {
                state.habitos = limpiarHabitos(respuesta.habits);
                app.render.setHabitos(state.habitos);
            }
            if (respuesta.history) app.render.setHistorial(respuesta.history);
            if (respuesta.helpMessage) {
                state.mensajeAyuda = normalizarMensaje(respuesta.helpMessage);
                app.render.renderMensajeAyuda();
            }
            if (respuesta.contexts) {
                state.contextos = respuesta.contexts;
                app.render.renderContextos();
            }

            setEstado(respuesta.mensaje || 'Agente finalizado.');
            if (respuesta.agentOutput) {
                console.log('Agent Output:', respuesta.agentOutput);
            }
        } catch (error) {
            setEstado(error.message || 'Error al ejecutar el agente.', true);
        } finally {
            state.ejecutandoAgente = false;
        }
    }

    app.actions = {
        fijarPaso,
        liberarPaso,
        eliminarPaso,
        alternarPausa,
        guardarOrden,
        guardarHabitoRapido,
        eliminarHabitoRapido,
        renombrarHabitoRapido,
        cargarHistorial,
        eliminarHistorial,
        guardarMensajeAyudaDesdeForm,
        limpiarMensajeAyuda,
        agregarContexto,
        actualizarContexto,
        eliminarContexto,
        guardarOrdenContextos,
        togglePinContexto,
        runAgent,
    };
})(window);

