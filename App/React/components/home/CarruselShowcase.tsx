/// <reference types="vite/client" />
/*
 * Componente: CarruselShowcase
 * Muestra un carrusel infinito de imagenes con desplazamiento automatico.
 * Disenado para la seccion hero con imagenes de alta resolucion.
 */
import React from 'react';
import {Badge} from '../ui/Badge';
import './CarruselShowcase.css';

// Importacion dinamica de imagenes usando Vite
// Esto carga todas las imagenes del directorio especificado sin necesidad de hardcodear nombres
const modulosImagenes = import.meta.glob('../../../../Glory/assets/images/showcase/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

// Convertir el objeto de modulos a un array de strings (URLs)
const IMAGENES_SHOWCASE = Object.values(modulosImagenes) as string[];

// Seleccionamos las primeras 6 imagenes o todas si hay menos, asumiendo que el orden del sistema de archivos es suficiente
// o simplemente mostramos todas para un efecto mas rico.
const imagenesFinales = IMAGENES_SHOWCASE.length > 0 ? IMAGENES_SHOWCASE : [];

export const CarruselShowcase: React.FC = () => {
    // Si no hay imagenes, no renderizar nada o mostrar un fallback
    if (imagenesFinales.length === 0) return null;

    // Estado para el indice actual y la transicion
    const [indiceActual, setIndiceActual] = React.useState(0);
    const [conTransicion, setConTransicion] = React.useState(true);

    // Configuracion de tiempos
    const TIEMPO_ESPERA = 8000; // 4 segundos detenido
    const TIEMPO_TRANSICION = 800; // 0.8s movimiento suave

    // Referencias para duplicar items y logica infinita
    const itemsTotales = [...imagenesFinales, ...imagenesFinales];
    const longitudOriginal = imagenesFinales.length;

    // Efecto para el avance automatico
    React.useEffect(() => {
        const intervalo = setInterval(() => {
            setIndiceActual(prev => prev + 1);
            setConTransicion(true);
        }, TIEMPO_ESPERA);

        return () => clearInterval(intervalo);
    }, []);

    // Efecto para verificar si hemos llegado al punto de reset (loop infinito)
    React.useEffect(() => {
        if (indiceActual === longitudOriginal) {
            // Esperamos a que termine la transicion visual para resetear
            const timeout = setTimeout(() => {
                setConTransicion(false); // Desactivar transicion para el salto instantaneo
                setIndiceActual(0); // Volver al inicio
            }, TIEMPO_TRANSICION);
            return () => clearTimeout(timeout);
        }
    }, [indiceActual, longitudOriginal]);

    return (
        <div className="carruselContenedorPrincipal">
            <div
                className="carruselPista"
                style={{
                    // Calculo del desplazamiento usando variables CSS definidas en el archivo CSS
                    transform: `translateX(calc(-1 * (var(--carrusel-item-width) + var(--carrusel-item-gap)) * ${indiceActual}))`,
                    transition: conTransicion ? `transform ${TIEMPO_TRANSICION}ms cubic-bezier(0.25, 1, 0.5, 1)` : 'none'
                }}>
                {itemsTotales.map((src, index) => (
                    <div key={`img-${index}`} className="carruselItem">
                        <div className="carruselImagenWrapper">
                            <img src={src} alt={`Imagen showcase ${index + 1}`} className="carruselImagen" />
                        </div>
                        <div className="carruselContenido">
                            <h3 className="carruselTitulo">Proyecto {index + 1}</h3>
                            <div className="carruselTags">
                                <Badge label="Diseño" />
                                <Badge label="UX/UI" />
                                <Badge label="Branding" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Overlay opcional para integrar con el fondo si es necesario */}
            <div className="carruselOverlay" />
        </div>
    );
};
