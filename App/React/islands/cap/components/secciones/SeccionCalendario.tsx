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
import {useAlumnos} from '../../hooks/useAlumnos';
import {Alerta} from '../ui';
import type {ExclusionesConflicto, Clase} from '../../types';

export function SeccionCalendario() {
    const {clases, semanaActual, fechasSemana, cargando, error, generando, conflictos, mostrarModalConflictos, claseSeleccionada, mostrarModalEdicion, guardandoEdicion, puedeDeshacer, irSemanaAnterior, irSemanaSiguiente, irASemanaActual, toggleBloqueoClase, generarCalendario, generarConExclusiones, cerrarModalConflictos, limpiarError, seleccionarClase, cerrarModalEdicion, actualizarClase, deshacer, moverClase} = useCalendario();

    /* Obtener lista de alumnos para mostrar en modal de edición */
    const {alumnos} = useAlumnos();

    /*
     * Obtener la clase actualizada desde el array de clases
     * Esto asegura que el modal refleja cambios en tiempo real (ej: toggle bloqueo)
     */
    const claseActualizada = useMemo(() => {
        if (!claseSeleccionada) return null;
        return clases.find(c => c.id === claseSeleccionada.id) || claseSeleccionada;
    }, [clases, claseSeleccionada]);

    const handleClaseClick = (clase: Clase) => {
        seleccionarClase(clase);
    };

    const handleConfirmarExclusiones = (exclusiones: ExclusionesConflicto) => {
        generarConExclusiones(exclusiones);
    };

    const handleGuardarClase = async (claseId: number, cambios: CambiosClase) => {
        await actualizarClase(claseId, cambios);
    };

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Calendario</h2>
                <p className="capTexto capTexto--secundario">Gestiona las clases del curso CAP</p>
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
            <ModalDetalleClase clase={claseActualizada} alumnos={alumnos} abierto={mostrarModalEdicion} onCerrar={cerrarModalEdicion} onGuardar={handleGuardarClase} onToggleBloqueo={toggleBloqueoClase} guardando={guardandoEdicion} />
        </div>
    );
}

export default SeccionCalendario;
