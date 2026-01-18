import React, {useEffect, useRef, useState} from 'react';

/*
 * LogoHero: Texto "nakomi" que escala dinamicamente al ancho del viewport.
 * Utiliza ResizeObserver para recalcular el tamaño de fuente
 * manteniendo el texto ocupando el 90% del ancho disponible.
 */

interface LogoHeroProps {
    subtitulo?: string;
}

export const LogoHero: React.FC<LogoHeroProps> = ({subtitulo = 'Desarrollo web & apps'}) => {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const textoRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState<number>(100);

    useEffect(() => {
        const calcularTamaño = () => {
            if (!contenedorRef.current || !textoRef.current) return;

            const anchoContenedor = contenedorRef.current.offsetWidth;
            const anchoObjetivo = anchoContenedor * 0.92;

            /*
             * Algoritmo de ajuste: comenzamos con un tamaño grande
             * y lo reducimos hasta que el texto quepa en el ancho objetivo.
             * Esto garantiza que el logo siempre ocupe el maximo espacio.
             */
            let nuevoTamaño = 300;
            textoRef.current.style.fontSize = `${nuevoTamaño}px`;

            while (textoRef.current.offsetWidth > anchoObjetivo && nuevoTamaño > 20) {
                nuevoTamaño -= 5;
                textoRef.current.style.fontSize = `${nuevoTamaño}px`;
            }

            setFontSize(nuevoTamaño);
        };

        calcularTamaño();

        const resizeObserver = new ResizeObserver(calcularTamaño);
        if (contenedorRef.current) {
            resizeObserver.observe(contenedorRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <section id="seccionHero" className="seccionHero">
            <div ref={contenedorRef} className="logoHero">
                <span ref={textoRef} className="logoTexto" style={{fontSize: `${fontSize}px`}}>
                    nakomi
                </span>
            </div>
            {subtitulo && <p className="subtituloHero">{subtitulo}</p>}
        </section>
    );
};

export default LogoHero;
