/**
 * SeccionCalendario
 *
 * Vista del calendario de clases CAP.
 * Integra el calendario semanal con navegación y generación.
 */

import {CalendarioSemanal} from '../calendario';
import {useCalendario} from '../../hooks/useCalendario';
import {Alerta} from '../ui';

export function SeccionCalendario() {
    const {clases, semanaActual, fechasSemana, cargando, error, generando, irSemanaAnterior, irSemanaSiguiente, irASemanaActual, toggleBloqueoClase, generarCalendario} = useCalendario();

    const handleClaseClick = (clase: any) => {
        /* TO-DO: Abrir modal de detalle/edición de clase */
        console.log('Clase seleccionada:', clase);
    };

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Calendario</h2>
                <p className="capTexto capTexto--secundario">Gestiona las clases del curso CAP</p>
            </div>

            {error && (
                <Alerta variante="error" className="capMt--md" cerrable>
                    {error}
                </Alerta>
            )}

            <div className="capMt--lg">
                <CalendarioSemanal clases={clases} semanaActual={semanaActual} fechasSemana={fechasSemana} cargando={cargando} generando={generando} onSemanaAnterior={irSemanaAnterior} onSemanaSiguiente={irSemanaSiguiente} onIrHoy={irASemanaActual} onToggleBloqueo={toggleBloqueoClase} onGenerar={generarCalendario} onClaseClick={handleClaseClick} />
            </div>
        </div>
    );
}

export default SeccionCalendario;
