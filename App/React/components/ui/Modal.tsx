/**
 * Modal — Componente genérico de diálogo modal.
 * Backdrop con click-outside para cerrar, tecla Escape, scroll del cuerpo bloqueado.
 */

import { useEffect, type ReactNode } from 'react';
import { Boton } from './Boton';

interface ModalProps {
    abierto: boolean;
    titulo: string;
    onCerrar: () => void;
    children: ReactNode;
    /** Ancho máximo del modal. Por defecto 560px. */
    ancho?: string;
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = '560px' }: ModalProps): JSX.Element | null {
    /* Bloquear scroll del body mientras el modal está abierto */
    useEffect(() => {
        if (!abierto) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [abierto]);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!abierto) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [abierto, onCerrar]);

    if (!abierto) return null;

    return (
        <div
            className="modalBackdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTituloId"
            onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
        >
            <div className="modalContenedor" style={{ maxWidth: ancho }}>
                <div className="modalCabecera">
                    <h3 id="modalTituloId" className="modalTitulo">{titulo}</h3>
                    <Boton
                        variante="icono"
                        className="modalCerrar"
                        onClick={onCerrar}
                        aria-label="Cerrar modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </Boton>
                </div>
                <div className="modalCuerpo">
                    {children}
                </div>
            </div>
        </div>
    );
}
