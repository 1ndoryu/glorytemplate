/*
 * SeccionRelaciones — Kamples
 * Tarjeta de sección para listas de relaciones de sampleo.
 * Compartida entre CancionDetalle y RelacionDetalle para consistencia visual.
 */

import type { ReactNode } from 'react';

interface SeccionRelacionesProps {
    titulo: string;
    contador?: number;
    children: ReactNode;
}

export const SeccionRelaciones = ({ titulo, contador, children }: SeccionRelacionesProps): JSX.Element => (
    <div className="seccionRelaciones">
        <h2 className="seccionRelacionesTitulo">
            {titulo}
            {contador !== undefined && (
                <span className="seccionRelacionesContador">({contador})</span>
            )}
        </h2>
        {children}
    </div>
);
