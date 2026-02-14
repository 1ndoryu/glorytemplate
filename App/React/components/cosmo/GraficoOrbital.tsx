import React, { useRef, useCallback } from 'react';

interface PlanetaOrbita {
    letra: string;
    nombre: string;
    descripcion: string;
}

interface GraficoOrbitalProps {
    planetas: PlanetaOrbita[];
    className?: string;
}

/*
 * Gráfico orbital animado de la metodologia COSMO.
 * Replica la estructura exacta de landing_methodology() en landing.php.
 * Clases: methodology-graphic, orbit-container, orbit-ring, ring-outer,
 * ring-inner, ring-inner-2, orbit-planet, planet-s, planet-m, planet-o,
 * planet-c, planet-bottom-o, planet-tooltip, orbit-center
 */
export function GraficoOrbital({
    planetas,
    className = '',
}: GraficoOrbitalProps): React.JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);

    /* Pausar/reanudar orbitas al hover, igual que el script original */
    const pausarOrbitas = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const rings = container.querySelectorAll('.orbit-ring');
        const planets = container.querySelectorAll('.orbit-planet');
        rings.forEach((r) => (r as HTMLElement).style.animationPlayState = 'paused');
        planets.forEach((p) => (p as HTMLElement).style.animationPlayState = 'paused');
    }, []);

    const reanudarOrbitas = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const rings = container.querySelectorAll('.orbit-ring');
        const planets = container.querySelectorAll('.orbit-planet');
        rings.forEach((r) => (r as HTMLElement).style.animationPlayState = 'running');
        planets.forEach((p) => (p as HTMLElement).style.animationPlayState = 'running');

        /* Restaurar z-index originales */
        const outer = container.querySelector('.ring-outer') as HTMLElement;
        const inner = container.querySelector('.ring-inner') as HTMLElement;
        const inner2 = container.querySelector('.ring-inner-2') as HTMLElement;
        if (outer) outer.style.zIndex = '1';
        if (inner) inner.style.zIndex = '2';
        if (inner2) inner2.style.zIndex = '3';
    }, []);

    const handlePlanetEnter = useCallback((e: React.MouseEvent) => {
        pausarOrbitas();
        const parentRing = (e.currentTarget as HTMLElement).closest('.orbit-ring') as HTMLElement;
        if (parentRing) parentRing.style.zIndex = '100';
    }, [pausarOrbitas]);

    return (
        <div className={`methodology-graphic ${className}`} ref={containerRef}>
            <div className="orbit-container">
                {/* Anillo exterior: S, M, O(bottom) */}
                <div className="orbit-ring ring-outer">
                    <div
                        className="orbit-planet planet-s"
                        onMouseEnter={handlePlanetEnter}
                        onMouseLeave={reanudarOrbitas}
                    >
                        <p>S</p>
                        <div className="planet-tooltip">
                            <strong>Signal</strong>
                            <span>Lectura del Mercado - Monitorizamos señales de demanda, eventos y elasticidad de precios en tiempo real.</span>
                        </div>
                    </div>
                    <div
                        className="orbit-planet planet-m"
                        onMouseEnter={handlePlanetEnter}
                        onMouseLeave={reanudarOrbitas}
                    >
                        <p>M</p>
                        <div className="planet-tooltip">
                            <strong>Monetize</strong>
                            <span>Ejecución de Ventas - Aplicamos reglas de precios, optimizamos canales y lanzamos campañas con ROI medible.</span>
                        </div>
                    </div>
                    <div
                        className="orbit-planet planet-bottom-o"
                        onMouseEnter={handlePlanetEnter}
                        onMouseLeave={reanudarOrbitas}
                    >
                        <p>O</p>
                        <div className="planet-tooltip">
                            <strong>Optimize</strong>
                            <span>Mejora continua - Analizamos el post-mortem de cada acción para iterar con rapidez.</span>
                        </div>
                    </div>
                </div>

                {/* Anillo interior: O (Orchestrate) */}
                <div className="orbit-ring ring-inner">
                    <div
                        className="orbit-planet planet-o"
                        onMouseEnter={handlePlanetEnter}
                        onMouseLeave={reanudarOrbitas}
                    >
                        <p>O</p>
                        <div className="planet-tooltip">
                            <strong>Orchestrate</strong>
                            <span>Orquestación de Procesos - Definimos KPIs críticos, cadencias de revisión y asignamos responsables.</span>
                        </div>
                    </div>
                </div>

                {/* Anillo mas interior: C (Collect) */}
                <div className="orbit-ring ring-inner-2">
                    <div
                        className="orbit-planet planet-c"
                        onMouseEnter={handlePlanetEnter}
                        onMouseLeave={reanudarOrbitas}
                    >
                        <p>C</p>
                        <div className="planet-tooltip">
                            <strong>Collect</strong>
                            <span>Recopilación y Saneamiento - Unificamos tus fuentes de datos y normalizamos la información.</span>
                        </div>
                    </div>
                </div>

                {/* Centro con logo */}
                <div className="orbit-center">
                    <img src="/wp-content/themes/glorytemplate/App/Assets/images/logocuadradoblanco.png" style={{ height: 'auto', width: 'auto', maxHeight: '80px' }} alt="Cosmo Logo" />
                </div>
            </div>
        </div>
    );
}
