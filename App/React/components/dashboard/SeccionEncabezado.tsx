/*
 * SeccionEncabezado
 * Componente reutilizable para encabezados de sección
 * Responsabilidad única: mostrar título y acciones de una sección
 */

import type {ReactNode} from 'react';

interface SeccionEncabezadoProps {
    icono: ReactNode;
    titulo: string;
    subtitulo?: string;
    acciones?: ReactNode;
}

export function SeccionEncabezado({icono, titulo, subtitulo, acciones}: SeccionEncabezadoProps): JSX.Element {
    return (
        <div className="seccionEncabezado">
            <h2 className="seccionTitulo">
                {icono} {titulo}
            </h2>
            {subtitulo && <span className="seccionSubtitulo">{subtitulo}</span>}
            {acciones && <div className="seccionAcciones">{acciones}</div>}
        </div>
    );
}
