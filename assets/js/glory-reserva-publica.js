
function inicializarFormularioReserva() {
    const formulario = document.querySelector('.formularioBarberia');
    if (!formulario) {
        return;
    }

    const selectorServicio = formulario.querySelector('.selector-servicio');
    const selectorBarbero = formulario.querySelector('.selector-barbero');
    const selectorFecha = formulario.querySelector('.selector-fecha');
    const selectorHora = formulario.querySelector('.selector-hora');
    const botonEnviar = formulario.querySelector('.dataSubir');

    function actualizarHorariosDisponibles() {
        const servicioId = selectorServicio.value;
        const barberoId = selectorBarbero.value;
        const fecha = selectorFecha.value;

        // Limpiar y deshabilitar el selector de hora
        selectorHora.innerHTML = '<option value="">Cargando...</option>';
        selectorHora.disabled = true;
        botonEnviar.disabled = true;

        if (!servicioId || !barberoId || !fecha) {
            selectorHora.innerHTML = '<option value="">Selecciona fecha, servicio y barbero</option>';
            return;
        }

        const datos = {
            servicio_id: servicioId,
            barbero_id: barberoId,
            fecha: fecha,
        };

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
                        botonEnviar.disabled = false;
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

    selectorServicio.addEventListener('change', actualizarHorariosDisponibles);
    selectorBarbero.addEventListener('change', actualizarHorariosDisponibles);
    selectorFecha.addEventListener('change', actualizarHorariosDisponibles);
}

document.addEventListener('gloryRecarga', inicializarFormularioReserva);