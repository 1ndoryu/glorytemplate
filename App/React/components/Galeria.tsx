/**
 * Galeria — Lightbox de imágenes para la ficha de vehículo.
 */

import { useState, useCallback } from 'react';
import type { GaleriaItem } from '@app/types/cresta';

interface GaleriaProps {
    imagenes: GaleriaItem[];
    className?: string;
}

export function Galeria({ imagenes, className = '' }: GaleriaProps): JSX.Element {
    const [activa, setActiva] = useState(0);
    const [lightboxAbierto, setLightboxAbierto] = useState(false);

    const siguiente = useCallback(() => {
        setActiva(i => (i + 1) % imagenes.length);
    }, [imagenes.length]);

    const anterior = useCallback(() => {
        setActiva(i => (i - 1 + imagenes.length) % imagenes.length);
    }, [imagenes.length]);

    if (!imagenes.length) {
        return (
            <div className={`galeriaVacia ${className}`}>
                Sin imágenes disponibles
            </div>
        );
    }

    return (
        <>
            <div className={`galeria ${className}`}>
                {/* Imagen principal */}
                <div
                    className="galeriaPrincipalWrap"
                    onClick={() => setLightboxAbierto(true)}
                >
                    <img
                        src={imagenes[activa].url}
                        alt={imagenes[activa].alt || 'Imagen del vehículo'}
                        className="galeriaPrincipalImg"
                    />
                    <div className="galeriaOverlay" />

                    {/* Contador */}
                    {imagenes.length > 1 && (
                        <div className="galeriaContador">
                            {activa + 1} / {imagenes.length}
                        </div>
                    )}
                </div>

                {/* Flechas */}
                {imagenes.length > 1 && (
                    <>
                        <button
                            onClick={anterior}
                            className="galeriaFlechaIzq"
                            aria-label="Anterior"
                        >
                            ◀
                        </button>
                        <button
                            onClick={siguiente}
                            className="galeriaFlechaDer"
                            aria-label="Siguiente"
                        >
                            ▶
                        </button>
                    </>
                )}

                {/* Thumbnails */}
                {imagenes.length > 1 && (
                    <div className="galeriaThumbnails">
                        {imagenes.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setActiva(i)}
                                className={`galeriaThumbnail${i === activa ? ' galeriaThumbnailActiva' : ''}`}
                            >
                                <img src={img.url} alt={img.alt} className="galeriaThumbnailImg" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxAbierto && (
                <div
                    className="galeriaLightbox"
                    onClick={() => setLightboxAbierto(false)}
                >
                    <button
                        onClick={() => setLightboxAbierto(false)}
                        className="galeriaLightboxCerrar"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>

                    <div className="galeriaLightboxContenido" onClick={e => e.stopPropagation()}>
                        <img
                            src={imagenes[activa].url}
                            alt={imagenes[activa].alt}
                            className="galeriaLightboxImg"
                        />

                        {imagenes.length > 1 && (
                            <>
                                <button
                                    onClick={anterior}
                                    className="galeriaLightboxFlechaIzq"
                                    aria-label="Anterior"
                                >
                                    ◀
                                </button>
                                <button
                                    onClick={siguiente}
                                    className="galeriaLightboxFlechaDer"
                                    aria-label="Siguiente"
                                >
                                    ▶
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
