/*
 * ModalHabito
 * Componente modal para crear/editar hábitos
 * Responsabilidad única: contenedor modal con overlay y animaciones
 */

import {useEffect, useCallback} from 'react';
import {X} from 'lucide-react';

interface ModalHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    titulo: string;
    children: React.ReactNode;
}

export function ModalHabito({estaAbierto, onCerrar, titulo, children}: ModalHabitoProps): JSX.Element | null {
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

    if (!estaAbierto) return null;

    const manejarClickOverlay = (evento: React.MouseEvent<HTMLDivElement>) => {
        if (evento.target === evento.currentTarget) {
            onCerrar();
        }
    };

    return (
        <div id="modal-habito-overlay" className="modalOverlay" onClick={manejarClickOverlay}>
            <div className="modalContenedor" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
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
