/*
 * Modal
 * Componente modal reutilizable con overlay y animaciones
 * Responsabilidad unica: contenedor modal generico
 */

import {useEffect, useCallback} from 'react';
import {X} from 'lucide-react';

export interface ModalProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    titulo: string;
    children: React.ReactNode;
    claseExtra?: string;
}

export function Modal({estaAbierto, onCerrar, titulo, children, claseExtra = ''}: ModalProps): JSX.Element | null {
    /*
     * Cierra el modal al presionar Escape
     */
    const manejarTecla = useCallback(
        (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                onCerrar();
            }
        },
        [onCerrar]
    );

    useEffect(() => {
        if (estaAbierto) {
            document.addEventListener('keydown', manejarTecla);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', manejarTecla);
            document.body.style.overflow = '';
        };
    }, [estaAbierto, manejarTecla]);

    const manejarClickOverlay = (evento: React.MouseEvent<HTMLDivElement>) => {
        if (evento.target === evento.currentTarget) {
            onCerrar();
        }
    };

    if (!estaAbierto) return null;

    return (
        <div className="modalOverlay" onClick={manejarClickOverlay}>
            <div className={`modalContenedor ${claseExtra}`} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
                <div className="modalEncabezado">
                    <h2 id="modal-titulo" className="modalTitulo">
                        {titulo}
                    </h2>
                    <button className="modalBotonCerrar" onClick={onCerrar} aria-label="Cerrar modal" type="button">
                        <X size={16} />
                    </button>
                </div>
                <div className="modalContenido">{children}</div>
            </div>
        </div>
    );
}
