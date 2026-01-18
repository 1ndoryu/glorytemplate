import React, {useEffect, useRef} from 'react';

/*
 * GridServicios: Visualización de servicios con dos modos:
 * - carrusel: Desplazamiento infinito horizontal (estilo Fiverr)
 * - grid: Grid estático de 3 columnas
 */

export interface Servicio {
    id: string;
    nombre: string;
    descripcionCorta: string;
    precioDesde: number;
    imagen: string;
}

/* Tipo para los modos de visualización disponibles */
export type ModoVisualizacion = 'carrusel' | 'grid';

import {TarjetaServicio} from './TarjetaServicio';

interface GridServiciosProps {
    servicios: Servicio[];
    id?: string;
    /* Modo de visualización: 'carrusel' (infinito) o 'grid' (3 columnas) */
    modo?: ModoVisualizacion;
}

export const GridServicios: React.FC<GridServiciosProps> = ({servicios, id = 'seccionServicios', modo = 'carrusel'}) => {
    const carruselRef = useRef<HTMLDivElement>(null);
    const posicionRef = useRef(0);
    const pausadoRef = useRef(false);

    /* Duplicar servicios solo para modo carrusel (loop infinito) */
    const serviciosMostrar = modo === 'carrusel' ? [...servicios, ...servicios] : servicios;

    const manejarPausa = (pausar: boolean) => {
        pausadoRef.current = pausar;
    };

    /* Animación solo activa en modo carrusel */
    useEffect(() => {
        if (modo !== 'carrusel') return;

        const carrusel = carruselRef.current;
        if (!carrusel) return;

        let animacionId: number;
        const velocidad = 0.5;

        const animar = () => {
            if (!pausadoRef.current) {
                posicionRef.current += velocidad;
                /* Reiniciar al llegar a la mitad (servicios originales) */
                const anchoMitad = carrusel.scrollWidth / 2;
                if (posicionRef.current >= anchoMitad) {
                    posicionRef.current = 0;
                }
                carrusel.style.transform = `translateX(-${posicionRef.current}px)`;
            }
            animacionId = requestAnimationFrame(animar);
        };

        animacionId = requestAnimationFrame(animar);

        return () => cancelAnimationFrame(animacionId);
    }, [modo]);

    /* Renderizado condicional según el modo */
    const renderContenido = () => {
        if (modo === 'grid') {
            return (
                <div className="serviciosGridContenedor">
                    <div className="serviciosGrid">
                        {serviciosMostrar.map(servicio => (
                            <TarjetaServicio key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                </div>
            );
        }

        /* Modo carrusel (por defecto) */
        return (
            <div className="carruselContenedor" onMouseEnter={() => manejarPausa(true)} onMouseLeave={() => manejarPausa(false)}>
                <div className="carruselServicios" ref={carruselRef}>
                    {serviciosMostrar.map((servicio, indice) => (
                        <TarjetaServicio key={`${servicio.id}-${indice}`} servicio={servicio} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <section id={id} className="seccionServicios">
            <div className="serviciosContenedor">
                <header className="serviciosHeader">
                    <h2 className="serviciosTituloGrande">SERVICIOS</h2>
                    <a href="/servicios" className="serviciosBotonVer">
                        Ver servicios
                    </a>
                </header>
                {renderContenido()}
            </div>
        </section>
    );
};

export default GridServicios;
