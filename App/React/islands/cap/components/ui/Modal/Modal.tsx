/**
 * Modal Component
 *
 * Overlay con contenido centrado.
 * Maneja focus trap y cierre con Escape.
 */

import {type ReactNode, useEffect, useCallback} from 'react';
import {createPortal} from 'react-dom';
import './Modal.css';

type TamanoModal = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
    abierto: boolean;
    onCerrar: () => void;
    titulo?: string;
    tamano?: TamanoModal;
    cerrarConOverlay?: boolean;
    cerrarConEscape?: boolean;
    children: ReactNode;
}

export function Modal({abierto, onCerrar, titulo, tamano = 'md', cerrarConOverlay = true, cerrarConEscape = true, children}: ModalProps): JSX.Element | null {
    /* Cerrar con tecla Escape */
    const manejarTecla = useCallback(
        (e: KeyboardEvent) => {
            if (cerrarConEscape && e.key === 'Escape') {
                onCerrar();
            }
        },
        [cerrarConEscape, onCerrar]
    );

    useEffect(() => {
        if (abierto) {
            document.addEventListener('keydown', manejarTecla);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', manejarTecla);
            document.body.style.overflow = '';
        };
    }, [abierto, manejarTecla]);

    const manejarClickOverlay = (e: React.MouseEvent) => {
        if (cerrarConOverlay && e.target === e.currentTarget) {
            onCerrar();
        }
    };

    if (!abierto) return null;

    const contenido = (
        <div className="capModal__overlay" onClick={manejarClickOverlay} role="dialog" aria-modal="true" aria-labelledby={titulo ? 'modal-titulo' : undefined}>
            <div className={`capModal__contenido capModal__contenido--${tamano}`}>
                {titulo && (
                    <div className="capModal__header">
                        <h2 id="modal-titulo" className="capModal__titulo">
                            {titulo}
                        </h2>
                        <button type="button" className="capModal__cerrar" onClick={onCerrar} aria-label="Cerrar modal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="capModal__body">{children}</div>
            </div>
        </div>
    );

    return createPortal(contenido, document.body);
}

export default Modal;
