import React, {useEffect, useRef} from 'react';

/*
 * GridServicios: Carrusel automático de servicios estilo Fiverr.
 * Los servicios se desplazan suavemente de manera infinita.
 */

export interface Servicio {
    id: string;
    nombre: string;
    descripcionCorta: string;
    precioDesde: number;
    imagen: string;
}

interface GridServiciosProps {
    servicios: Servicio[];
    id?: string;
}

/* Tarjeta individual de servicio */
const TarjetaServicio: React.FC<{servicio: Servicio}> = ({servicio}) => {
    return (
        <article className="tarjetaServicio">
            <div className="servicioImagenContenedor">
                <img src={servicio.imagen} alt={servicio.nombre} className="servicioImagen" loading="lazy" />
            </div>
            <div className="servicioInfo">
                <h3 className="servicioNombre">{servicio.nombre}</h3>
                <p className="servicioDescripcion">{servicio.descripcionCorta}</p>
                <div className="servicioPrecio">
                    <span className="precioEtiqueta">Desde</span>
                    <span className="precioValor">${servicio.precioDesde.toLocaleString()}</span>
                </div>
            </div>
        </article>
    );
};

export const GridServicios: React.FC<GridServiciosProps> = ({servicios, id = 'seccionServicios'}) => {
    const carruselRef = useRef<HTMLDivElement>(null);
    const posicionRef = useRef(0);
    const pausadoRef = useRef(false);

    /* Duplicar servicios para efecto de loop infinito */
    const serviciosDuplicados = [...servicios, ...servicios];

    const manejarPausa = (pausar: boolean) => {
        pausadoRef.current = pausar;
    };

    useEffect(() => {
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
    }, []);

    return (
        <section id={id} className="seccionServicios">
            <div className="serviciosContenedor">
                <header className="serviciosHeader">
                    <h2 className="serviciosTituloGrande">SERVICIOS</h2>
                    <a href="/servicios" className="serviciosBotonVer">
                        Ver servicios
                    </a>
                </header>
                <div className="carruselContenedor" onMouseEnter={() => manejarPausa(true)} onMouseLeave={() => manejarPausa(false)}>
                    <div className="carruselServicios" ref={carruselRef}>
                        {serviciosDuplicados.map((servicio, indice) => (
                            <TarjetaServicio key={`${servicio.id}-${indice}`} servicio={servicio} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GridServicios;
