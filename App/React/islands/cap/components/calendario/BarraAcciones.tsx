/**
 * BarraAcciones
 *
 * Barra de botones de acción para el calendario:
 * - Deshacer (pendiente historial)
 * - Generar calendario
 *
 * Nota: Los reportes se acceden desde su sección dedicada en el menú lateral.
 */

import {Boton} from '../ui';
import {IconoCalendario} from '../icons';

interface BarraAccionesProps {
    onGenerar: () => void;
    onDeshacer?: () => void;
    generando: boolean;
    puedeDeshacer?: boolean;
}

export function BarraAcciones({onGenerar, onDeshacer, generando, puedeDeshacer = false}: BarraAccionesProps) {
    return (
        <div className="capBarraAcciones">
            <Boton variante="ghost" tamanio="sm" onClick={onDeshacer} disabled={!puedeDeshacer} title="Deshacer último cambio">
                <IconoDeshacer size={16} />
                <span className="capOcultoMovil">Deshacer</span>
            </Boton>

            <div className="capBarraAcciones__separador" />

            <Boton variante="primario" tamanio="sm" onClick={onGenerar} cargando={generando} disabled={generando}>
                <IconoCalendario size={16} />
                Generar
            </Boton>
        </div>
    );
}

/* Icono de deshacer (flecha circular) */
function IconoDeshacer({size = 20}: {size?: number}) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}

export default BarraAcciones;
