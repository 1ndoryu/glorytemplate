function inicializarFormularioReserva() {
    const formulario = document.querySelector('.formularioBarberia');
    if (!formulario) {
        return;
    }

    // Prevenir que se inicialice múltiples veces en el mismo elemento
    if (formulario.dataset.inicializado) {
        return;
    }
    formulario.dataset.inicializado = 'true';

    const selectorServicio = formulario.querySelector('.selector-servicio');
    const selectorBarbero = formulario.querySelector('.selector-barbero');
    const selectorFecha = formulario.querySelector('.selector-fecha');
    const selectorHora = formulario.querySelector('.selector-hora');
    const botonEnviar = formulario.querySelector('.dataSubir');

    // Si alguno de los elementos críticos no existe, salir silenciosamente
    if (!selectorServicio || !selectorBarbero || !selectorFecha || !selectorHora) {
        return;
    }

    // Deshabilitar al inicio hasta que se seleccione una hora
    if (botonEnviar) {
        botonEnviar.disabled = true;
    }
    if(selectorHora) {
        selectorHora.disabled = true;
    }

    // Variables para edición
    let datosEdicion = null; // { objectId, data: { servicio_id, barbero_id, fecha_reserva, hora_reserva, ... } }


    function actualizarHorariosDisponibles() {
        const servicioId = selectorServicio.value;
        const barberoId = selectorBarbero.value;
        const fecha = selectorFecha.value;
        // si estamos editando, el contenedor del formulario trae data-object-id
        const objectId = formulario.getAttribute('data-object-id');
        // guardar hora actual (si la hay) antes de resetear opciones
        const horaActualAntes = selectorHora ? selectorHora.value : '';

        // Resetear y deshabilitar
        selectorHora.innerHTML = '<option value="">Cargando...</option>';
        selectorHora.disabled = true;
        botonEnviar.disabled = true;

        if (!servicioId || !barberoId || !fecha) {
            selectorHora.innerHTML = '<option value="">Selecciona servicio, barbero y fecha</option>';
            return;
        }

        const datos = new FormData();
        datos.append('servicio_id', servicioId);
        datos.append('barbero_id', barberoId);
        datos.append('fecha', fecha);
        if (objectId) {
            datos.append('exclude_id', objectId);
        }

        gloryAjax('glory_verificar_disponibilidad', datos)
            .then(respuesta => {
                if (respuesta.success && respuesta.data.horarios) {
                    selectorHora.innerHTML = '<option value="">Selecciona una hora</option>';
                    if (respuesta.data.horarios.length > 0) {
                        respuesta.data.horarios.forEach(hora => {
                            const option = document.createElement('option');
                            option.value = hora;
                            option.textContent = hora;
                            selectorHora.appendChild(option);
                        });
                        selectorHora.disabled = false;
                        // si existe un valor actual de hora (modo edición), re-seleccionarlo
                        const horaEdit = (datosEdicion && datosEdicion.data && datosEdicion.data.hora_reserva) ? datosEdicion.data.hora_reserva : '';
                        const horaActual = horaEdit || horaActualAntes || selectorHora.value;
                        if (horaActual) {
                            selectorHora.value = horaActual;
                            // Notificar cambios para que los observadores del formulario habiliten el submit
                            selectorHora.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else {
                        selectorHora.innerHTML = '<option value="">No hay horas disponibles</option>';
                    }
                } else {
                    selectorHora.innerHTML = `<option value="">${respuesta.data.mensaje || 'Error al cargar'}</option>`;
                }
            })
            .catch(error => {
                console.error('Error AJAX al verificar disponibilidad:', error);
                selectorHora.innerHTML = '<option value="">Error de conexión</option>';
            });
    }
    
    function verificarSeleccionHora() {
        if(selectorHora.value) {
            botonEnviar.disabled = false;
        } else {
            botonEnviar.disabled = true;
        }
    }

    selectorServicio.addEventListener('change', actualizarHorariosDisponibles);
    selectorBarbero.addEventListener('change', actualizarHorariosDisponibles);
    selectorFecha.addEventListener('change', actualizarHorariosDisponibles);
    selectorHora.addEventListener('change', verificarSeleccionHora);

    // Si el modal se abre en modo edición, forzar precarga y habilitar
    document.addEventListener('gloryFormModal:afterEdit', (ev) => {
        datosEdicion = ev && ev.detail ? ev.detail : null;
        actualizarHorariosDisponibles();
        // habilitar submit si ya hay hora
        setTimeout(() => {
            verificarSeleccionHora();
        }, 0);
    });
}


// Asegurar que se ejecute en la carga inicial y en recargas AJAX de Glory.
document.addEventListener('DOMContentLoaded', inicializarFormularioReserva);
document.addEventListener('gloryRecarga', inicializarFormularioReserva);