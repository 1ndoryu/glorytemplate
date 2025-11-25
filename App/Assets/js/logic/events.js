/* eslint-disable func-names */
(function (window) {
    'use strict';

    const app = window.GloryLogic;
    if (!app) return;

    const HABIT_MODAL_ID = 'logicHabitModal';
    const {
        fijarPaso,
        guardarHabitoRapido,
        cargarHistorial,
        guardarMensajeAyudaDesdeForm,
        limpiarMensajeAyuda,
        eliminarHabitoRapido,
        renombrarHabitoRapido,
    } = app.actions;
    const { handleDragOver, handleDrop } = app.render;
    const { refs, state } = app;

    const textosModal = {
        create: {
            titulo: 'Añadir hábito rápido',
            descripcion: 'Guarda un atajo corto para fijar pasos sin escribir.',
            submit: 'Guardar',
        },
        rename: {
            titulo: 'Cambiar nombre',
            descripcion: 'Actualiza el hábito seleccionado sin perder su posición.',
            submit: 'Actualizar',
        },
    };

    function manejarEnter(evento) {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            fijarPaso();
        }
    }

    function abrirHabitModal(modo, valor = '') {
        if (!refs.habitModalForm || !refs.habitModalInput) return;
        const tipo = textosModal[modo] ? modo : 'create';
        state.habitModalMode = tipo;
        state.habitModalTarget = tipo === 'rename' ? valor : '';
        refs.habitModalForm.dataset.mode = tipo;
        refs.habitModalInput.value = tipo === 'rename' ? valor : '';
        if (refs.habitModalTitle) {
            refs.habitModalTitle.textContent = textosModal[tipo].titulo;
        }
        if (refs.habitModalDescription) {
            refs.habitModalDescription.textContent = textosModal[tipo].descripcion;
        }
        if (refs.habitModalSubmit) {
            refs.habitModalSubmit.textContent = textosModal[tipo].submit;
        }
        document.dispatchEvent(new CustomEvent('gloryModal:openRequest', { detail: { modalId: HABIT_MODAL_ID } }));
        window.setTimeout(() => {
            if (refs.habitModalInput) refs.habitModalInput.focus();
        }, 150);
    }

    function limpiarHabitModal() {
        state.habitModalMode = 'create';
        state.habitModalTarget = '';
        if (refs.habitModalForm) {
            refs.habitModalForm.dataset.mode = 'create';
        }
        if (refs.habitModalInput) {
            refs.habitModalInput.value = '';
        }
        if (refs.habitModalTitle) {
            refs.habitModalTitle.textContent = textosModal.create.titulo;
        }
        if (refs.habitModalDescription) {
            refs.habitModalDescription.textContent = textosModal.create.descripcion;
        }
        if (refs.habitModalSubmit) {
            refs.habitModalSubmit.textContent = textosModal.create.submit;
        }
    }

    function cerrarHabitModal() {
        limpiarHabitModal();
        if (typeof window.ocultarFondo === 'function') {
            window.ocultarFondo();
        }
    }

    async function manejarEnvioHabitModal(event) {
        event.preventDefault();
        if (!refs.habitModalInput) return;
        const valor = refs.habitModalInput.value.trim();
        if (!valor) {
            refs.habitModalInput.focus();
            return;
        }
        let exito = false;
        if (state.habitModalMode === 'rename' && state.habitModalTarget) {
            exito = await renombrarHabitoRapido(state.habitModalTarget, valor);
        } else {
            exito = await guardarHabitoRapido(valor);
        }
        if (exito) {
            cerrarHabitModal();
        }
    }

    function ocultarHabitMenu() {
        if (!refs.habitMenu) return;
        refs.habitMenu.classList.remove('activo');
        refs.habitMenu.style.display = 'none';
        refs.habitMenu.style.visibility = '';
        state.habitMenuTarget = '';
    }

    function posicionarHabitMenu(event, boton) {
        if (!refs.habitMenu) return;
        state.habitMenuTarget = boton.dataset.logicHabit;
        refs.habitMenu.style.visibility = 'hidden';
        refs.habitMenu.style.display = 'flex';
        refs.habitMenu.classList.add('activo');
        const ancho = refs.habitMenu.offsetWidth || 0;
        const alto = refs.habitMenu.offsetHeight || 0;
        const margen = 12;
        let posX = event.clientX;
        let posY = event.clientY;
        if (posX + ancho > window.innerWidth) {
            posX = window.innerWidth - ancho - margen;
        }
        if (posY + alto > window.innerHeight) {
            posY = window.innerHeight - alto - margen;
        }
        refs.habitMenu.style.left = `${Math.max(margen, posX)}px`;
        refs.habitMenu.style.top = `${Math.max(margen, posY)}px`;
        refs.habitMenu.style.visibility = 'visible';
    }

    async function manejarAccionHabitMenu(event) {
        const accion = event.target.dataset ? event.target.dataset.logicHabitAction : null;
        if (!accion) return;
        event.preventDefault();
        event.stopPropagation();
        const objetivo = state.habitMenuTarget;
        if (!objetivo) {
            ocultarHabitMenu();
            return;
        }
        if (accion === 'rename') {
            ocultarHabitMenu();
            abrirHabitModal('rename', objetivo);
            return;
        }
        if (accion === 'delete') {
            const exito = await eliminarHabitoRapido(objetivo);
            if (exito) {
                ocultarHabitMenu();
            }
        }
    }

    function registrar() {
        if (refs.botonFijar) {
            refs.botonFijar.addEventListener('click', () => fijarPaso());
        }
        if (refs.input) {
            refs.input.addEventListener('keydown', manejarEnter);
        }
        if (refs.lista) {
            refs.lista.addEventListener('dragover', handleDragOver);
            refs.lista.addEventListener('drop', handleDrop);
        }
        if (refs.historyRefresh) {
            refs.historyRefresh.addEventListener('click', () => cargarHistorial(true));
        }
        if (refs.habitModalForm) {
            refs.habitModalForm.addEventListener('submit', manejarEnvioHabitModal);
        }
        if (refs.habitModalCancel) {
            refs.habitModalCancel.addEventListener('click', (event) => {
                event.preventDefault();
                cerrarHabitModal();
            });
        }
        if (refs.habitMenu) {
            refs.habitMenu.addEventListener('click', manejarAccionHabitMenu);
        }
        if (refs.habitsContainer) {
            refs.habitsContainer.addEventListener('click', (event) => {
                const trigger = event.target.closest('[data-logic-habit-trigger]');
                if (!trigger) return;
                event.preventDefault();
                abrirHabitModal(trigger.dataset.logicHabitTrigger || 'create');
            });
        }
        document.addEventListener('contextmenu', (event) => {
            const boton = event.target.closest ? event.target.closest('.logicHabitBtn') : null;
            if (!boton || !boton.dataset.logicHabit) {
                ocultarHabitMenu();
                return;
            }
            event.preventDefault();
            posicionarHabitMenu(event, boton);
        });
        document.addEventListener('click', (event) => {
            if (refs.habitMenu && event.target.closest && event.target.closest('#logicHabitMenu')) {
                return;
            }
            ocultarHabitMenu();
        });
        document.addEventListener('scroll', ocultarHabitMenu, true);
        window.addEventListener('resize', ocultarHabitMenu);
        document.addEventListener('gloryModal:close', (event) => {
            if (event.detail && event.detail.modalId === HABIT_MODAL_ID) {
                limpiarHabitModal();
            }
        });
        if (refs.helpSave) {
            refs.helpSave.addEventListener('click', guardarMensajeAyudaDesdeForm);
        }
        if (refs.helpInput) {
            refs.helpInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    guardarMensajeAyudaDesdeForm();
                }
            });
        }
        if (refs.helpClear) {
            refs.helpClear.addEventListener('click', limpiarMensajeAyuda);
        }
        if (refs.contextAddBtn) {
            refs.contextAddBtn.addEventListener('click', () => {
                if (app.actions && app.actions.agregarContexto) {
                    app.actions.agregarContexto();
                }
            });
        }
        if (refs.contextInput) {
            refs.contextInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    if (app.actions && app.actions.agregarContexto) {
                        app.actions.agregarContexto();
                    }
                }
            });
        }
        if (refs.contextAddBtnQuick) {
            refs.contextAddBtnQuick.addEventListener('click', () => {
                if (app.actions && app.actions.agregarContexto) {
                    app.actions.agregarContexto(refs.contextInputQuick);
                }
            });
        }
        if (refs.contextInputQuick) {
            refs.contextInputQuick.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    if (app.actions && app.actions.agregarContexto) {
                        app.actions.agregarContexto(refs.contextInputQuick);
                    }
                }
            });
        }
        
        const runAgentBtn = document.getElementById('logicRunAgentBtn');
        if (runAgentBtn) {
            runAgentBtn.addEventListener('click', () => {
                if (app.actions && app.actions.runAgent) {
                    app.actions.runAgent();
                }
            });
        }

    }

    app.events = { registrar };
})(window);

