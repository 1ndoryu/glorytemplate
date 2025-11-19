/* eslint-disable func-names */
(function (window) {
    'use strict';

    const root = document.querySelector('.logicPage');
    if (!root) {
        window.GloryLogic = null;
        return;
    }

    const config = window.logicInitialState || {};
    const refs = {
        input: document.getElementById('logicInput'),
        botonFijar: document.getElementById('logicStartBtn'),
        estado: document.getElementById('logicStatus'),
        lista: document.getElementById('logicList'),
        vacio: document.getElementById('logicEmpty'),
        historyList: document.getElementById('logicHistoryList'),
        historyEmpty: document.getElementById('logicHistoryEmpty'),
        historyRefresh: document.getElementById('logicHistoryRefresh'),
        helpDisplay: document.getElementById('logicHelpDisplay'),
        helpGlobal: document.getElementById('logicHelpGlobal'),
        helpInput: document.getElementById('logicHelpInput'),
        helpDuration: document.getElementById('logicHelpDuration'),
        helpSave: document.getElementById('logicHelpSave'),
        helpClear: document.getElementById('logicHelpClear'),
        habitsContainer: document.getElementById('logicHabitsButtons'),
        habitModal: document.getElementById('logicHabitModal'),
        habitModalForm: document.getElementById('logicHabitModalForm'),
        habitModalInput: document.getElementById('logicHabitModalInput'),
        habitModalTitle: document.getElementById('logicHabitModalTitle'),
        habitModalDescription: document.getElementById('logicHabitModalDescription'),
        habitModalSubmit: document.getElementById('logicHabitModalSubmit'),
        habitModalCancel: document.querySelector('[data-logic-habit-cancel]'),
        habitMenu: document.getElementById('logicHabitMenu'),
        tabsWrapper: document.querySelector('[data-logic-tabs]'),
        contextInput: document.getElementById('logicContextInput'),
        contextAddBtn: document.getElementById('logicContextAddBtn'),
        contextList: document.getElementById('logicContextList'),
        contextEmpty: document.getElementById('logicContextEmpty'),
        contextInputQuick: document.getElementById('logicContextInputQuick'),
        contextAddBtnQuick: document.getElementById('logicContextAddBtnQuick'),
    };

    const mensajes = config.strings || {};
    const ajaxUrl = config.ajaxUrl || window.ajaxurl || '';
    const nonce = config.nonce || '';
    const limit = Number(config.limit) || 0;
    const historyLimit = Number(config.historyLimit) || 30;
    const helpFallback = 'Agrega un recordatorio corto que verás en esta página.';
    const helpFallbackGlobal = '';

    function limpiarHabitos(lista) {
        if (!Array.isArray(lista)) {
            return [];
        }
        return lista
            .map((valor) => (typeof valor === 'string' ? valor : String(valor || '')))
            .map((valor) => valor.trim())
            .filter((valor) => valor !== '')
            .slice(0, 12);
    }

    function normalizarHistorial(lista) {
        if (!Array.isArray(lista)) {
            return [];
        }
        return lista
            .map((entrada) => {
                if (!entrada || typeof entrada !== 'object') {
                    return null;
                }
                const id = Number(entrada.id) || 0;
                if (!id) {
                    return null;
                }
                return {
                    id,
                    titulo: String(entrada.titulo || ''),
                    inicioUtc: entrada.inicioUtc || '',
                    inicioTimestamp: Number(entrada.inicioTimestamp) || 0,
                    finUtc: entrada.finUtc || '',
                    finTimestamp: Number(entrada.finTimestamp) || 0,
                    duracionLabel: entrada.duracionLabel || '',
                };
            })
            .filter(Boolean);
    }

    function normalizarMensaje(data) {
        if (!data || typeof data !== 'object' || !data.texto) {
            return null;
        }
        return {
            texto: String(data.texto),
            visibleHastaUtc: data.visibleHastaUtc || null,
            visibleHastaTimestamp: data.visibleHastaTimestamp ? Number(data.visibleHastaTimestamp) : null,
            duracionSegundos: data.duracionSegundos ? Number(data.duracionSegundos) : null,
        };
    }

    const state = {
        tareas: Array.isArray(config.tasks) ? config.tasks.slice() : [],
        historial: normalizarHistorial(config.history),
        habitos: limpiarHabitos(config.habits),
        mensajeAyuda: normalizarMensaje(config.helpMessage),
        contextos: Array.isArray(config.contexts) ? config.contexts : [],
        bloqueado: false,
        guardandoOrden: false,
        dragId: null,
        cargandoHistorial: false,
        habitModalMode: 'create',
        habitModalTarget: '',
        habitMenuTarget: '',
        guardandoContexto: false,
    };

    state.estadoLimite = typeof config.limitReached === 'boolean'
        ? config.limitReached
        : (limit > 0 && state.tareas.length >= limit);

    const timerRefs = new Map();
    const habitButtonsRefs = [];
    const timers = { intervalId: null };

    function formatear(segundos) {
        const seguro = Math.max(0, parseInt(segundos, 10) || 0);
        const horas = Math.floor(seguro / 3600);
        const minutos = Math.floor((seguro % 3600) / 60);
        const resto = seguro % 60;
        return [horas, minutos, resto]
            .map((parte) => parte.toString().padStart(2, '0'))
            .join(':');
    }

    function formatearFechaLocal(utcString, timestamp) {
        const tieneTimestamp = Number.isFinite(timestamp) && timestamp > 0;
        const base = tieneTimestamp
            ? new Date(timestamp * 1000)
            : new Date(`${utcString}Z`);
        if (Number.isNaN(base.getTime())) {
            return utcString || '';
        }
        return base.toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    }

    function setEstado(texto, esError = false) {
        if (!refs.estado) return;
        refs.estado.textContent = texto || '';
        refs.estado.style.color = esError ? '#f87171' : '';
    }

    function prepararCuerpo(accion, payload = {}) {
        const cuerpo = new URLSearchParams();
        cuerpo.append('action', accion);
        if (nonce) cuerpo.append('nonce', nonce);
        Object.entries(payload).forEach(([clave, valor]) => {
            if (Array.isArray(valor)) {
                valor.forEach((item) => cuerpo.append(`${clave}[]`, item));
                return;
            }
            if (valor !== undefined && valor !== null) {
                cuerpo.append(clave, valor);
            }
        });
        return cuerpo.toString();
    }

    async function enviarPeticion(accion, payload = {}) {
        if (!ajaxUrl) {
            throw new Error('Ajax URL no disponible.');
        }
        const respuesta = await fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: prepararCuerpo(accion, payload),
        });
        const datos = await respuesta.json();
        if (!datos.success) {
            const mensajeError = (datos.data && datos.data.mensaje) || mensajes.error || 'No pude guardar el paso.';
            throw new Error(mensajeError);
        }
        return datos.data || {};
    }

    const app = {
        root,
        config,
        refs,
        mensajes,
        ajaxUrl,
        nonce,
        limit,
        historyLimit,
        helpFallback,
        helpFallbackGlobal,
        state,
        timerRefs,
        timers,
        habitButtonsRefs,
    };

    app.utils = {
        formatear,
        formatearFechaLocal,
        limpiarHabitos,
        normalizarHistorial,
        normalizarMensaje,
    };

    app.net = {
        prepararCuerpo,
        enviarPeticion,
    };

    app.feedback = { setEstado };

    window.GloryLogic = app;
})(window);

