/**
 * SeccionCalendario
 *
 * Vista del calendario de clases CAP.
 * Integra el calendario semanal con navegación, generación, edición y resolución de conflictos.
 */

import {useMemo} from 'react';
import {CalendarioSemanal, ModalConflictoAforo, ModalDetalleClase} from '../calendario';
import type {CambiosClase} from '../calendario';
import {useCalendario} from '../../hooks/useCalendario';
import {Alerta} from '../ui';
import type {ExclusionesConflicto, Clase, DiaSemana} from '../../types';

export function SeccionCalendario() {
    const {clases, semanaActual, fechasSemana, cargando, error, generando, conflictos, mostrarModalConflictos, claseSeleccionada, mostrarModalEdicion, guardandoEdicion, puedeDeshacer, eliminando, irSemanaAnterior, irSemanaSiguiente, irASemanaActual, toggleBloqueoClase, generarCalendario, generarConExclusiones, cerrarModalConflictos, limpiarError, seleccionarClase, cerrarModalEdicion, actualizarClase, deshacer, moverClase, eliminarClase} = useCalendario();

    /*
     * Obtener la clase actualizada desde el array de clases
     * Esto asegura que el modal refleja cambios en tiempo real (ej: toggle bloqueo)
     */
    const claseActualizada = useMemo(() => {
        if (!claseSeleccionada) return null;
        return clases.find(c => c.id === claseSeleccionada.id) || claseSeleccionada;
    }, [clases, claseSeleccionada]);

    /*
     * Calcular clases por día para el selector de movimiento
     * Se necesita para mostrar el contador de clases en cada día
     */
    const clasesPorDia = useMemo(() => {
        const mapa: Record<DiaSemana, Clase[]> = {
            lunes: [],
            martes: [],
            miercoles: [],
            jueves: [],
            viernes: []
        };

        clases.forEach(clase => {
            const fechaClase = new Date(clase.fecha);
            const indiceDia = fechaClase.getDay();
            const diasMap: Record<number, DiaSemana> = {
                1: 'lunes',
                2: 'martes',
                3: 'miercoles',
                4: 'jueves',
                5: 'viernes'
            };
            const dia = diasMap[indiceDia];
            if (dia) {
                mapa[dia].push(clase);
            }
        });

        return mapa;
    }, [clases]);

    const handleClaseClick = (clase: Clase) => {
        seleccionarClase(clase);
    };

    const handleConfirmarExclusiones = (exclusiones: ExclusionesConflicto) => {
        generarConExclusiones(exclusiones);
    };

    const handleGuardarClase = async (claseId: number, cambios: CambiosClase) => {
        await actualizarClase(claseId, cambios);
    };

    const handleMoverClase = async (claseId: number, nuevaFecha: string) => {
        await moverClase(claseId, nuevaFecha);
    };

    const handleEliminarClase = async (claseId: number, forzar: boolean) => {
        await eliminarClase(claseId, forzar);
    };

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Calendario</h2>
                <p className="capTexto capTexto--secundario">Gestiona las clases del curso CAP!</p>
            </div>

            {error && (
                <Alerta variante="error" className="capMt--md" cerrable onCerrar={limpiarError}>
                    {error}
                </Alerta>
            )}

            <div className="capMt--lg">
                <CalendarioSemanal clases={clases} semanaActual={semanaActual} fechasSemana={fechasSemana} cargando={cargando} generando={generando} onSemanaAnterior={irSemanaAnterior} onSemanaSiguiente={irSemanaSiguiente} onIrHoy={irASemanaActual} onToggleBloqueo={toggleBloqueoClase} onGenerar={generarCalendario} onClaseClick={handleClaseClick} puedeDeshacer={puedeDeshacer} onDeshacer={deshacer} onMoverClase={moverClase} />
            </div>

            {/* Modal para resolver conflictos de aforo */}
            <ModalConflictoAforo abierto={mostrarModalConflictos} conflictos={conflictos} onCerrar={cerrarModalConflictos} onConfirmar={handleConfirmarExclusiones} cargando={generando} />

            {/* Modal para editar detalles de clase - usa claseActualizada para reflejar cambios en tiempo real */}
            {/* La key fuerza un remount cuando cambia la clase, reseteando el estado interno */}
            {/* Los datos de alumnos vienen directamente con la clase (alumnosData) */}
            <ModalDetalleClase key={`modal-clase-${claseActualizada?.id ?? 'none'}`} clase={claseActualizada} abierto={mostrarModalEdicion} onCerrar={cerrarModalEdicion} onGuardar={handleGuardarClase} onToggleBloqueo={toggleBloqueoClase} onMoverClase={handleMoverClase} fechasSemana={fechasSemana} clasesPorDia={clasesPorDia} guardando={guardandoEdicion} onEliminar={handleEliminarClase} eliminando={eliminando} />
        </div>
    );
}

export default SeccionCalendario;
