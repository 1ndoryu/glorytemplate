/*
 * SeccionCaracteristicas — Grid de 9 bloques de features Kamples.
 * Layout: grid responsivo 3x4 basado en el diseño original (temp/inicio.php).
 * Los SVGs (div-1 al div-9, excepto div-2) llenan cada bloque.
 * Overlay con descripción visible al hover.
 */

import '../../../styles/componentes/landingCaracteristicas.css';

const BASE_SVG = '/wp-content/themes/glorytemplate/App/Assets/images/svgs';

interface Bloque {
    clase: string;
    svg: string | null;
    descripcion: string;
}

const BLOQUES: Bloque[] = [
    {
        clase: 'landingBloque1',
        svg: `${BASE_SVG}/div-1.svg`,
        descripcion: 'Kamples centraliza herramientas de producción musical dispersas en una sola plataforma optimizada para cada etapa del proceso creativo.',
    },
    {
        clase: 'landingBloque2',
        svg: null,
        descripcion: 'Usamos inteligencia artificial para reconocimiento de patrones, mejora de algoritmos y supervisión. Kamples aprende de los usuarios para mejorar continuamente.',
    },
    {
        clase: 'landingBloque3',
        svg: `${BASE_SVG}/div-3.svg`,
        descripcion: 'Plataforma optimizada para la comunicación entre productores, artistas y fans, facilitando colaboraciones y procesos creativos.',
    },
    {
        clase: 'landingBloque4',
        svg: `${BASE_SVG}/div-4.svg`,
        descripcion: 'Herramienta de escritorio que sincroniza y organiza tus samples automáticamente. Accede a ellos cuando los necesites desde cualquier dispositivo.',
    },
    {
        clase: 'landingBloque5',
        svg: `${BASE_SVG}/div-5.svg`,
        descripcion: 'Organiza tus recursos musicales en colecciones personalizables. Compártelas con la comunidad o de forma privada.',
    },
    {
        clase: 'landingBloque6',
        svg: `${BASE_SVG}/div-6.svg`,
        descripcion: 'Algoritmos inteligentes de recomendación: Kamples entiende tus gustos y recomienda recursos apropiados para ti y tus proyectos.',
    },
    {
        clase: 'landingBloque7',
        svg: `${BASE_SVG}/div-7.svg`,
        descripcion: 'Comparte tus creaciones, colabora con otros artistas, descubre oportunidades y sigue la trayectoria de tus productores favoritos.',
    },
    {
        clase: 'landingBloque8',
        svg: `${BASE_SVG}/div-8.svg`,
        descripcion: 'Múltiples fuentes de ingresos con algoritmos inteligentes que compensan tu esfuerzo. Revenue share, suscripciones y servicios en un solo lugar.',
    },
    {
        clase: 'landingBloque9',
        svg: `${BASE_SVG}/div-9.svg`,
        descripcion: 'Exprésate a través de música, samples, kits, posts y colaboraciones. Kamples comprende que el arte tiene múltiples formas de expresión.',
    },
];

export const SeccionCaracteristicas = (): JSX.Element => (
    <section className="landingCaracteristicas" id="landingCaracteristicas">
        <div className="landingCaracteristicasGrid">
            {BLOQUES.map((b) => (
                <div key={b.clase} className={`landingBloque ${b.clase}`}>
                    {b.svg
                        ? <img src={b.svg} alt="" className="landingBloqueImg" loading="lazy" />
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
