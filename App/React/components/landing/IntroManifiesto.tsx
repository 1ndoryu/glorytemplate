import React, {useEffect, useRef, useState} from 'react';
import {Boton} from '../ui';

/*
 * IntroManifiesto: Sección de texto que aparece progresivamente al hacer scroll.
 * Presenta la esencia de Nakomi con un efecto de revelación elegante.
 * Refactorizado para usar Boton del sistema UI.
 */

interface IntroManifiestoProps {
    id?: string;
}

export const IntroManifiesto: React.FC<IntroManifiestoProps> = ({id = 'seccionManifiesto'}) => {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [progreso, setProgreso] = useState(0);

    useEffect(() => {
        const manejarScroll = () => {
            if (!contenedorRef.current) return;

            const rect = contenedorRef.current.getBoundingClientRect();
            const alturaVentana = window.innerHeight;

            /*
             * Calcula el progreso basado en la posición del elemento.
             * Inicia cuando el elemento entra en vista y termina cuando sale.
             */
            const inicioAnimacion = alturaVentana * 0.8;
            const finAnimacion = alturaVentana * 0.3;

            if (rect.top > inicioAnimacion) {
                setProgreso(0);
            } else if (rect.top < finAnimacion) {
                setProgreso(1);
            } else {
                const nuevoProgreso = 1 - (rect.top - finAnimacion) / (inicioAnimacion - finAnimacion);
                setProgreso(Math.max(0, Math.min(1, nuevoProgreso)));
            }
        };

        window.addEventListener('scroll', manejarScroll, {passive: true});
        manejarScroll();

        return () => window.removeEventListener('scroll', manejarScroll);
    }, []);

    /* Palabras del manifiesto divididas para animar individualmente */
    const palabras = ['Nakomi', 'es', 'un', 'estudio', 'de', 'diseño', 'y', 'desarrollo', 'especializado', 'en', 'crear', 'experiencias', 'digitales', 'de', 'lujo.', 'Cada', 'proyecto', 'que', 'construimos', 'refleja', 'un', 'nivel', 'de', 'detalle', 'y', 'refinamiento', 'que', 'pocos', 'logran', 'alcanzar.'];

    return (
        <section id={id} className="seccionManifiesto" ref={contenedorRef}>
            <div className="manifiestoContenedor">
                <p className="manifiestoTexto">
                    {palabras.map((palabra, indice) => {
                        /*
                         * Cada palabra aparece progresivamente según el scroll.
                         * El rango de cada palabra es proporcional a su posición.
                         * Cuando progreso = 1, todas las palabras deben estar en opacidad 1.
                         */
                        const inicioAnimacion = indice / palabras.length;
                        const finAnimacion = (indice + 1) / palabras.length;

                        let opacidadPalabra = 0;
                        if (progreso >= finAnimacion) {
                            opacidadPalabra = 1;
                        } else if (progreso > inicioAnimacion) {
                            opacidadPalabra = (progreso - inicioAnimacion) / (finAnimacion - inicioAnimacion);
                        }

                        return (
                            <span
                                key={indice}
                                className="manifestoPalabra"
                                style={{
                                    opacity: opacidadPalabra,
                                    transform: `translateY(${(1 - opacidadPalabra) * 10}px)`
                                }}>
                                {palabra}{' '}
                            </span>
                        );
                    })}
                </p>
                <Boton href="/nosotros" variante="outline" tamano="sm">
                    Conócenos
                </Boton>
            </div>
        </section>
    );
};

export default IntroManifiesto;
