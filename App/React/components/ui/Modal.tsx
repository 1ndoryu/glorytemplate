/*
 * Componente: Modal
 * Base reutilizable con portal, cierre por Escape y click fuera.
 * Trap focus para accesibilidad.
 */

import { type ReactNode, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/componentes/modal.css';
import { BotonBase } from './BotonBase';

type TamanoModal = 'pequeno' | 'normal' | 'grande';

interface ModalProps {
    abierto: boolean;
    onCerrar: () => void;
    titulo?: string;
    tamano?: TamanoModal;
    className?: string;
    pie?: ReactNode;
    children: ReactNode;
}

const mapaTamano: Record<TamanoModal, string> = {
    pequeno: 'modalPequeno',
    normal: '',
    grande: 'modalGrande',
};

export const Modal = ({
    abierto,
    onCerrar,
    titulo,
    tamano = 'normal',
    className = '',
    pie,
    children,
}: ModalProps): JSX.Element | null => {
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cerrar con Escape */
    const manejarKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCerrar();
            }
        },
        [onCerrar]
    );

    useEffect(() => {
        if (!abierto) return;

        document.addEventListener('keydown', manejarKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', manejarKeyDown);
            document.body.style.overflow = '';
        };
    }, [abierto, manejarKeyDown]);

    /* Focus trap basico: al abrir, enfocar el contenedor */
    useEffect(() => {
        if (abierto && contenedorRef.current) {
            contenedorRef.current.focus();
        }
    }, [abierto]);

    if (!abierto) return null;

    /* Click en overlay cierra el modal */
    const manejarClickOverlay = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCerrar();
        }
    };

    const clasesContenedor = ['modalContenedor', mapaTamano[tamano], className]
        .filter(Boolean)
        .join(' ');

    return createPortal(
        <div className="modalOverlay" onClick={manejarClickOverlay} role="dialog" aria-modal="true">
            <div
                className={clasesContenedor}
                ref={contenedorRef}
                tabIndex={-1}
                role="document"
            >
                {titulo && (
                    <div className="modalCabecera">
                        <h2 className="modalTitulo">{titulo}</h2>
                        <BotonBase variante="ghost"
                            className="modalCerrar"
                            onClick={onCerrar}
                            aria-label="Cerrar modal"
                            type="button"
                        >
                            ×
                        </BotonBase>
                    </div>
                )}
                <div className="modalCuerpo">{children}</div>
                {pie && <div className="modalPie">{pie}</div>}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
