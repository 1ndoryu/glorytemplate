/**
 * SeccionCalendario
 *
 * Vista del calendario de clases CAP.
 * Integra el calendario semanal con navegación, generación y resolución de conflictos.
 */

import {CalendarioSemanal, ModalConflictoAforo} from '../calendario';
import {useCalendario} from '../../hooks/useCalendario';
import {Alerta} from '../ui';
import type {ExclusionesConflicto} from '../../types';

export function SeccionCalendario() {
    const {clases, semanaActual, fechasSemana, cargando, error, generando, conflictos, mostrarModalConflictos, irSemanaAnterior, irSemanaSiguiente, irASemanaActual, toggleBloqueoClase, generarCalendario, generarConExclusiones, cerrarModalConflictos, limpiarError} = useCalendario();

    const handleClaseClick = (clase: any) => {
        /* TO-DO: Abrir modal de detalle/edición de clase */
        console.log('Clase seleccionada:', clase);
    };

    const handleConfirmarExclusiones = (exclusiones: ExclusionesConflicto) => {
        generarConExclusiones(exclusiones);
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
                <CalendarioSemanal clases={clases} semanaActual={semanaActual} fechasSemana={fechasSemana} cargando={cargando} generando={generando} onSemanaAnterior={irSemanaAnterior} onSemanaSiguiente={irSemanaSiguiente} onIrHoy={irASemanaActual} onToggleBloqueo={toggleBloqueoClase} onGenerar={generarCalendario} onClaseClick={handleClaseClick} />
            </div>

            {/* Modal para resolver conflictos de aforo */}
            <ModalConflictoAforo abierto={mostrarModalConflictos} conflictos={conflictos} onCerrar={cerrarModalConflictos} onConfirmar={handleConfirmarExclusiones} cargando={generando} />
        </div>
    );
}

export default SeccionCalendario;
