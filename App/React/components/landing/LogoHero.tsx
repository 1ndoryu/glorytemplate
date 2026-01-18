import React, {useEffect, useRef, useState} from 'react';

/*
 * LogoHero: Texto "NAKOMI" que escala dinamicamente al ancho del contenedor.
 * Usa la fuente Gothic60 definida en init.css.
 */

/* =========================================== */

export const LogoHero: React.FC = () => {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const textoRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState<number>(100);

    useEffect(() => {
        const calcularTamaño = () => {
            if (!contenedorRef.current || !textoRef.current) return;

            /* El ancho objetivo es el ancho del contenido (sin padding) */
            const computedStyle = window.getComputedStyle(contenedorRef.current);
            const paddingLeft = parseFloat(computedStyle.paddingLeft);
            const paddingRight = parseFloat(computedStyle.paddingRight);

            // clientWidth incluye padding, asi que lo restamos para obtener el area de contenido real
            const anchoReal = contenedorRef.current.clientWidth - paddingLeft - paddingRight;

            // Usamos un factor proporcional (3.2%) en lugar de pixeles fijos.
            // Esto equivale a ~40px en desktop (1250px) pero es mucho menor en movil, evitando que se corte.
            const SCALE_FACTOR = 1.032;
            const anchoObjetivo = anchoReal * SCALE_FACTOR;

            const baseSize = 100;
            textoRef.current.style.fontSize = `${baseSize}px`;

            // Forzar reflow si es necesario, aunque al cambiar estilo suele ocurrir.
            const widthAtBase = textoRef.current.getBoundingClientRect().width;

            if (widthAtBase > 0) {
                // Calculamos el tamaño exacto con decimales
                const calculado = (anchoObjetivo / widthAtBase) * baseSize;
                // Aplicamos directamente
                textoRef.current.style.fontSize = `${calculado}px`;
                setFontSize(calculado);
            }
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
                    NAKOMI
                </span>
            </div>
        </section>
    );
};

export default LogoHero;
