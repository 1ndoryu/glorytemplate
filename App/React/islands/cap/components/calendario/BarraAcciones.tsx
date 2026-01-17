/**
 * BarraAcciones
 *
 * Barra de botones de acción para el calendario:
 * - Deshacer (pendiente historial)
 * - Reportes
 * - Generar calendario
 */

import {Boton} from '../ui';
import {IconoCalendario} from '../icons';

interface BarraAccionesProps {
    onGenerar: () => void;
    onReportes?: () => void;
    onDeshacer?: () => void;
    generando: boolean;
    puedeDeshacer?: boolean;
}

export function BarraAcciones({onGenerar, onReportes, onDeshacer, generando, puedeDeshacer = false}: BarraAccionesProps) {
    return (
        <div className="capBarraAcciones">
            <Boton variante="ghost" tamanio="sm" onClick={onDeshacer} disabled={!puedeDeshacer} title="Deshacer último cambio">
                <IconoDeshacer size={16} />
                <span className="capOcultoMovil">Deshacer</span>
            </Boton>

            <div className="capBarraAcciones__separador" />

            <Boton variante="secundario" tamanio="sm" onClick={onReportes} disabled={!onReportes} title="Ver reportes">
                <IconoReporte size={16} />
                <span className="capOcultoMovil">Reportes</span>
            </Boton>

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

/* Icono de reporte (documento con gráfico) */
function IconoReporte({size = 20}: {size?: number}) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="16" y1="13" y2="17" />
            <line x1="8" x2="8" y1="13" y2="17" />
            <line x1="12" x2="12" y1="11" y2="17" />
        </svg>
    );
}

export default BarraAcciones;
