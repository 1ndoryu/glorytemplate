/**
 * Alerta Component
 *
 * Mensaje contextual con variantes semánticas.
 */

import {type ReactNode} from 'react';
import './Alerta.css';

type VarianteAlerta = 'info' | 'exito' | 'advertencia' | 'error';

interface AlertaProps {
    variante?: VarianteAlerta;
    titulo?: string;
    icono?: ReactNode;
    cerrable?: boolean;
    onCerrar?: () => void;
    className?: string;
    children: ReactNode;
}

/* Iconos por defecto para cada variante */
const iconosPorVariante: Record<VarianteAlerta, JSX.Element> = {
    info: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
        </svg>
    ),
    exito: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
    ),
    advertencia: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    )
};

export function Alerta({variante = 'info', titulo, icono, cerrable = false, onCerrar, className = '', children}: AlertaProps): JSX.Element {
    const clases = ['capAlerta', `capAlerta--${variante}`, className].filter(Boolean).join(' ');

    return (
        <div className={clases} role="alert">
            <span className="capAlerta__icono">{icono || iconosPorVariante[variante]}</span>

            <div className="capAlerta__contenido">
                {titulo && <p className="capAlerta__titulo">{titulo}</p>}
                <p className="capAlerta__mensaje">{children}</p>
            </div>

            {cerrable && (
                <button type="button" className="capAlerta__cerrar" onClick={onCerrar} aria-label="Cerrar alerta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default Alerta;
