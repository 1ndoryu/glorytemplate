/*
 * SeccionCaracteristicas — Grid de 9 bloques de features Kamples.
 * Layout: grid responsivo 3x4 — réplica exacta de temp/inicio.php (.ADEEDE/.OSFED).
 *
 * Los SVGs se importan como strings ?raw (Vite built-in) y se inyectan inline
 * con dangerouslySetInnerHTML, replicando exactamente el comportamiento del
 * .lazy-svg original que hacía innerHTML del SVG descargado.
 * - Archivos locales en build time → sin riesgo XSS.
 * - SVG inline → el elemento <svg> es DOM real, se escala por viewBox sin object-fit.
 */

import '../../../styles/componentes/landingCaracteristicas.css';

/* Imports ?raw — Vite incluye el texto SVG directamente en el bundle */
import div1Raw from '../../../../Assets/images/svgs/div-1.svg?raw';
import div3Raw from '../../../../Assets/images/svgs/div-3.svg?raw';
import div4Raw from '../../../../Assets/images/svgs/div-4.svg?raw';
import div5Raw from '../../../../Assets/images/svgs/div-5.svg?raw';
import div6Raw from '../../../../Assets/images/svgs/div-6.svg?raw';
import div7Raw from '../../../../Assets/images/svgs/div-7.svg?raw';
import div8Raw from '../../../../Assets/images/svgs/div-8.svg?raw';
import div9Raw from '../../../../Assets/images/svgs/div-9.svg?raw';

interface Bloque {
    /* clase: clase CSS del bloque (landingBloqueN) */
    clase: string;
    /* divClase: clase ancestro que los estilos internos del SVG requieren (.divN .cls-X) */
    divClase: string;
    svgHTML: string | null;
    descripcion: string;
}

const BLOQUES: Bloque[] = [
    {
        clase: 'landingBloque1',
        divClase: 'div1',
        svgHTML: div1Raw,
        descripcion: 'Kamples centraliza herramientas de producción musical dispersas en una sola plataforma optimizada para cada etapa del proceso creativo.',
    },
    {
        clase: 'landingBloque2',
        divClase: 'div2',
        svgHTML: null,
        descripcion: 'Usamos inteligencia artificial para reconocimiento de patrones, mejora de algoritmos y supervisión. Kamples aprende de los usuarios para mejorar continuamente.',
    },
    {
        clase: 'landingBloque3',
        divClase: 'div3',
        svgHTML: div3Raw,
        descripcion: 'Plataforma optimizada para la comunicación entre productores, artistas y fans, facilitando colaboraciones y procesos creativos.',
    },
    {
        clase: 'landingBloque4',
        divClase: 'div4',
        svgHTML: div4Raw,
        descripcion: 'Herramienta de escritorio que sincroniza y organiza tus samples automáticamente. Accede a ellos cuando los necesites desde cualquier dispositivo.',
    },
    {
        clase: 'landingBloque5',
        divClase: 'div5',
        svgHTML: div5Raw,
        descripcion: 'Organiza tus recursos musicales en colecciones personalizables. Compártelas con la comunidad o de forma privada.',
    },
    {
        clase: 'landingBloque6',
        divClase: 'div6',
        svgHTML: div6Raw,
        descripcion: 'Algoritmos inteligentes de recomendación: Kamples entiende tus gustos y recomienda recursos apropiados para ti y tus proyectos.',
    },
    {
        clase: 'landingBloque7',
        divClase: 'div7',
        svgHTML: div7Raw,
        descripcion: 'Comparte tus creaciones, colabora con otros artistas, descubre oportunidades y sigue la trayectoria de tus productores favoritos.',
    },
    {
        clase: 'landingBloque8',
        divClase: 'div8',
        svgHTML: div8Raw,
        descripcion: 'Múltiples fuentes de ingresos con algoritmos inteligentes que compensan tu esfuerzo. Revenue share, suscripciones y servicios en un solo lugar.',
    },
    {
        clase: 'landingBloque9',
        divClase: 'div9',
        svgHTML: div9Raw,
        descripcion: 'Exprésate a través de música, samples, kits, posts y colaboraciones. Kamples comprende que el arte tiene múltiples formas de expresión.',
    },
];

export const SeccionCaracteristicas = (): JSX.Element => (
    <section className="landingCaracteristicas" id="landingCaracteristicas">
        <div className="landingCaracteristicasGrid">
            {BLOQUES.map((b) => (
                <div key={b.clase} className={`landingBloque ${b.clase}`}>
                    {b.svgHTML !== null
                        ? (
                            /* divClase (div1, div3…div9) es el ancestro que los selectores
                               .divN .cls-X dentro del <style> del SVG necesitan para aplicarse */
                            <div
                                className={`landingBloqueSvg ${b.divClase}`}
                                dangerouslySetInnerHTML={{ __html: b.svgHTML }}
                            />
                        )
                        : <div className="landingBloqueIaPlaceholder" />
                    }
                    <div className="landingBloqueOverlay">
                        <p>{b.descripcion}</p>
                    </div>
                </div>
            ))}
        </div>
    </section>
);
