import React from 'react';

interface PlanOrbitaProps {
    letra: string;
    nombre: string;
    descripcion: string;
}

interface GraficoOrbitalProps {
    planetas: PlanOrbitaProps[];
    className?: string;
}

/*
 * Gráfico orbital animado de la metodología COSMO.
 * Tres anillos concéntricos girando con planetas posicionados.
 * Centro: Logo "C" de Cosmo.
 */
export function GraficoOrbital({
    planetas,
    className = '',
}: GraficoOrbitalProps): React.JSX.Element {
    return (
        <div className={`graficoMetodologia ${className}`}>
            <div className="contenedorOrbital">
                {/* Anillo exterior */}
                <div className="anilloOrbital anilloExterior">
                    {planetas[0] && (
                        <div className="planetaOrbital planetaS">
                            <p>{planetas[0].letra}</p>
                            <div className="tooltipPlaneta">
                                <strong>{planetas[0].nombre}</strong>
                                <span>{planetas[0].descripcion}</span>
                            </div>
                        </div>
                    )}
                    {planetas[1] && (
                        <div className="planetaOrbital planetaM">
                            <p>{planetas[1].letra}</p>
                            <div className="tooltipPlaneta">
                                <strong>{planetas[1].nombre}</strong>
                                <span>{planetas[1].descripcion}</span>
                            </div>
                        </div>
                    )}
                    {planetas[4] && (
                        <div className="planetaOInferior">
                            <p>{planetas[4].letra}</p>
                        </div>
                    )}
                </div>

                {/* Anillo interior */}
                <div className="anilloOrbital anilloInterior">
                    {planetas[3] && (
                        <div className="planetaOrbital planetaO">
                            <p>{planetas[3].letra}</p>
                            <div className="tooltipPlaneta">
                                <strong>{planetas[3].nombre}</strong>
                                <span>{planetas[3].descripcion}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Anillo mas interior */}
                <div className="anilloOrbital anilloInterior2">
                    {planetas[2] && (
                        <div className="planetaOrbital planetaC">
                            <p>{planetas[2].letra}</p>
                            <div className="tooltipPlaneta">
                                <strong>{planetas[2].nombre}</strong>
                                <span>{planetas[2].descripcion}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Centro */}
                <div className="centroOrbital">C</div>
            </div>
        </div>
    );
}
