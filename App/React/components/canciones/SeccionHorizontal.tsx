/*
 * SeccionHorizontal — QK18/QK22 + QL8
 * Wrapper reutilizable para secciones con scroll horizontal.
 * Flechas de navegacion + arrastre mouse en escritorio.
 */

import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useScrollHorizontal } from '@app/hooks/useScrollHorizontal';
import '../../styles/componentes/seccionHorizontal.css';

interface Props {
    titulo: string;
    children: ReactNode;
}

export const SeccionHorizontal = ({ titulo, children }: Props): JSX.Element => {
    const {
        contenedorRef,
        puedeIzquierda,
        puedeDerecha,
        scrollearIzquierda,
        scrollearDerecha,
        iniciarArrastre,
        moverArrastre,
        finalizarArrastre,
    } = useScrollHorizontal();

    return (
        <section className="seccionHorizontal">
            <div className="seccionHorizontalCabecera">
                <h2 className="seccionHorizontalTitulo">{titulo}</h2>
                <div className="seccionHorizontalFlechas">
                    {puedeIzquierda && (
                        <BotonBase variante="ghost" soloIcono tamano="sm"
                            onClick={scrollearIzquierda} aria-label="Anterior"
                            className="seccionHorizontalFlecha"
                        >
                            <ChevronLeft size={18} />
                        </BotonBase>
                    )}
                    {puedeDerecha && (
                        <BotonBase variante="ghost" soloIcono tamano="sm"
                            onClick={scrollearDerecha} aria-label="Siguiente"
                            className="seccionHorizontalFlecha"
                        >
                            <ChevronRight size={18} />
                        </BotonBase>
                    )}
                </div>
            </div>
            <div
                ref={contenedorRef}
                className="seccionHorizontalScroll"
                onMouseDown={e => iniciarArrastre(e.clientX)}
                onMouseMove={e => moverArrastre(e.clientX)}
                onMouseUp={finalizarArrastre}
                onMouseLeave={finalizarArrastre}
            >
                {children}
            </div>
        </section>
    );
};
