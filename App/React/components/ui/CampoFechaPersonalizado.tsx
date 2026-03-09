/**
 * CampoFechaPersonalizado — Input estilizado que muestra un CalendarioPopup propio.
 * Reemplaza el <input type="date"> nativo del browser.
 * Sin estilos inline, todo en componentes.css.
 */

import { useState, useRef, useCallback } from 'react';
import { CalendarioPopup } from './CalendarioPopup';
import { Boton } from './Boton';
import { useClickFuera } from '@app/hooks/useClickFuera';
import { useTeclaEscape } from '@app/hooks/useTeclaEscape';
import { ChevronDown } from 'lucide-react';

interface CampoFechaPersonalizadoProps {
    value: string;
    onChange: (valor: string) => void;
    min?: string;
    max?: string;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

function formatearFecha(fecha: string): string {
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CampoFechaPersonalizado({
    value,
    onChange,
    min,
    max,
    disabled = false,
    className = '',
    placeholder = 'Seleccionar fecha',
    onFocus,
    onBlur,
}: CampoFechaPersonalizadoProps): JSX.Element {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    const cerrar = useCallback(() => {
        setAbierto(false);
        onBlur?.();
    }, [onBlur]);

    useClickFuera(contenedorRef, cerrar, abierto);
    useTeclaEscape(cerrar, abierto);

    const toggleCalendario = () => {
        if (disabled) return;
        const nuevoEstado = !abierto;
        setAbierto(nuevoEstado);
        if (nuevoEstado) onFocus?.();
        else cerrar();
    };

    const manejarSeleccion = (fecha: string) => {
        onChange(fecha);
        cerrar();
    };

    const clases = [
        'campoFechaPersonalizado',
        className,
        abierto ? 'campoFechaPersonalizadoAbierto' : '',
        disabled ? 'campoFechaPersonalizadoDeshabilitado' : '',
        !value ? 'campoFechaPersonalizadoVacio' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className="campoFechaPersonalizadoContenedor" ref={contenedorRef}>
            <Boton
                variante="icono"
                claseExtra={clases}
                type="button"
                onClick={toggleCalendario}
                disabled={disabled}
                aria-haspopup="true"
                aria-expanded={abierto}
            >
                <span className="campoFechaPersonalizadoIcono">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </span>
                <span className="campoFechaPersonalizadoTexto">
                    {value ? formatearFecha(value) : placeholder}
                </span>
                <span className="campoFechaPersonalizadoChevron" aria-hidden="true">
                    <ChevronDown size={16} strokeWidth={2} />
                </span>
            </Boton>

            {abierto && (
                <div className="campoFechaPersonalizadoPopup">
                    <CalendarioPopup
                        fechaSeleccionada={value}
                        fechaMin={min}
                        fechaMax={max}
                        onChange={manejarSeleccion}
                    />
                </div>
            )}
        </div>
    );
}
