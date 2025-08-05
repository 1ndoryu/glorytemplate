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

    // Deshabilitar al inicio hasta que se seleccione una hora
    if (botonEnviar) {
        botonEnviar.disabled = true;
    }
    if(selectorHora) {
        selectorHora.disabled = true;
    }


    function actualizarHorariosDisponibles() {
        const servicioId = selectorServicio.value;
        const barberoId = selectorBarbero.value;
        const fecha = selectorFecha.value;

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
}


// Asegurar que se ejecute en la carga inicial y en recargas AJAX de Glory.
document.addEventListener('DOMContentLoaded', inicializarFormularioReserva);
document.addEventListener('gloryRecarga', inicializarFormularioReserva);