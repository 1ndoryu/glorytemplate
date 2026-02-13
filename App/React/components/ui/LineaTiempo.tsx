import React from 'react';

export interface PasoTimeline {
    titulo: string;
    descripcion: string;
}

interface LineaTiempoProps {
    pasos: PasoTimeline[];
    className?: string;
}

/*
 * Timeline vertical con linea central y puntos.
 * Los pasos se alternan izquierda/derecha en desktop.
 * En mobile colapsa a una sola columna.
 */
export function LineaTiempo({
    pasos,
    className = '',
}: LineaTiempoProps): React.JSX.Element {
    return (
        <div className={`gridTimeline ${className}`}>
            {pasos.map((paso, index) => {
                const esIzquierda = index % 2 === 0;
                return (
                    <div key={index} className="pasoTimeline">
                        {/* Columna izquierda: contenido en pasos pares, vacia en impares */}
                        <div className={esIzquierda ? 'columnaIzquierda' : 'columnaIzquierda celdasVacia'}>
                            {esIzquierda && (
                                <div className="pasoContenido">
                                    <h3>{paso.titulo}</h3>
                                    <p>{paso.descripcion}</p>
                                </div>
                            )}
                        </div>

                        {/* Linea central con punto */}
                        <div className="lineaCentral">
                            <div className="puntoTimeline" />
                        </div>

                        {/* Columna derecha: contenido en pasos impares, vacia en pares */}
                        <div className={!esIzquierda ? 'columnaDerecha' : 'columnaDerecha celdasVacia'}>
                            {!esIzquierda && (
                                <div className="pasoContenido">
                                    <h3>{paso.titulo}</h3>
                                    <p>{paso.descripcion}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
