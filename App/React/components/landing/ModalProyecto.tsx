import React, {useEffect, useCallback} from 'react';
import {Proyecto} from './TarjetaProyecto';

/*
 * ModalProyecto: Modal para mostrar detalle de un proyecto.
 * Usa estado local, no modifica el routing.
 * Cierra con ESC, click en overlay o boton X.
 */

interface ModalProyectoProps {
    proyecto: Proyecto | null;
    visible: boolean;
    onCerrar: () => void;
}

export const ModalProyecto: React.FC<ModalProyectoProps> = ({proyecto, visible, onCerrar}) => {
    /* Cerrar modal con tecla ESC */
    const manejarKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCerrar();
            }
        },
        [onCerrar]
    );

    useEffect(() => {
        if (visible) {
            document.addEventListener('keydown', manejarKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', manejarKeyDown);
            document.body.style.overflow = '';
        };
    }, [visible, manejarKeyDown]);

    /* Cerrar al hacer click en el overlay (no en el contenido) */
    const manejarClickOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onCerrar();
        }
    };

    if (!proyecto) return null;

    return (
        <div className={`modalOverlay ${visible ? 'modalOverlayVisible' : ''}`} onClick={manejarClickOverlay} role="dialog" aria-modal="true" aria-labelledby="modalTitulo">
            <div className="modalContenido">
                <button className="modalCerrar" onClick={onCerrar} aria-label="Cerrar modal">
                    ×
                </button>

                <img src={proyecto.imagen} alt={proyecto.nombre} className="modalImagen" />

                <div className="modalInfo">
                    <h2 id="modalTitulo" className="modalTitulo">
                        {proyecto.nombre}
                    </h2>
                    <span className="modalCategoria">{proyecto.categoria}</span>

                    {proyecto.descripcion && <p className="modalDescripcion">{proyecto.descripcion}</p>}
                </div>
            </div>
        </div>
    );
};

export default ModalProyecto;
