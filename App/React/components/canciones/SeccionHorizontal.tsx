/*
 * SeccionHorizontal — QK18/QK22
 * Wrapper reutilizable para secciones con scroll horizontal.
 * Titulo arriba, contenido scrollable abajo (compositional pattern).
 */

import type { ReactNode } from 'react';
import '../../styles/componentes/seccionHorizontal.css';

interface Props {
    titulo: string;
    children: ReactNode;
}

export const SeccionHorizontal = ({ titulo, children }: Props): JSX.Element => (
    <section className="seccionHorizontal">
        <div className="seccionHorizontalCabecera">
            <h2 className="seccionHorizontalTitulo">{titulo}</h2>
        </div>
        <div className="seccionHorizontalScroll">
            {children}
        </div>
    </section>
);
