/**
 * BarraAcciones
 *
 * Barra de botones de acción para el calendario:
 * - Deshacer (pendiente historial)
 * - Borrar semana
 * - Generar calendario
 *
 * Nota: Los reportes se acceden desde su sección dedicada en el menú lateral.
 */

import {useState} from 'react';
import {Boton} from '../ui';
import {IconoCalendario} from '../icons';

interface BarraAccionesProps {
    onGenerar: () => void;
    onDeshacer?: () => void;
    onBorrarSemana?: () => Promise<void>;
    generando: boolean;
    puedeDeshacer?: boolean;
}

export function BarraAcciones({onGenerar, onDeshacer, onBorrarSemana, generando, puedeDeshacer = false}: BarraAccionesProps) {
    const [borrando, setBorrando] = useState(false);

    const handleBorrarSemana = async () => {
        const confirmacion = window.confirm(
            '¿Estás seguro de que deseas borrar TODAS las clases de esta semana? Esta acción se puede deshacer.'
        );

        if (confirmacion && onBorrarSemana) {
            setBorrando(true);
            try {
                await onBorrarSemana();
            } finally {
                setBorrando(false);
            }
        }
    };

    return (
        <div className="capBarraAcciones">
            <Boton variante="ghost" tamanio="sm" onClick={onDeshacer} disabled={!puedeDeshacer} title="Deshacer último cambio">
                <IconoDeshacer size={16} />
                <span className="capOcultoMovil">Deshacer</span>
            </Boton>

            <div className="capBarraAcciones__separador" />

            <Boton variante="destructivo" tamanio="sm" onClick={handleBorrarSemana} cargando={borrando} disabled={borrando || generando} title="Borrar todas las clases de esta semana">
                <IconoBorrar size={16} />
                <span className="capOcultoMovil">Borrar Semana</span>
            </Boton>

            <div className="capBarraAcciones__separador" />

            <Boton variante="primario" tamanio="sm" onClick={onGenerar} cargando={generando} disabled={generando || borrando}>
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

/* Icono de borrar (basura) */
function IconoBorrar({size = 20}: {size?: number}) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
