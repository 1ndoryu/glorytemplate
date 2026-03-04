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
            <div className={`bg-gray-100 rounded-2xl aspect-[16/9] flex items-center justify-center text-gray-400 ${className}`}>
                Sin imágenes disponibles
            </div>
        );
    }

    return (
        <>
            <div className={`relative ${className}`}>
                {/* Imagen principal */}
                <div
                    className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => setLightboxAbierto(true)}
                >
                    <img
                        src={imagenes[activa].url}
                        alt={imagenes[activa].alt || 'Imagen del vehículo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                    {/* Contador */}
                    {imagenes.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                            {activa + 1} / {imagenes.length}
                        </div>
                    )}
                </div>

                {/* Flechas */}
                {imagenes.length > 1 && (
                    <>
                        <button
                            onClick={anterior}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition"
                            aria-label="Anterior"
                        >
                            ◀
                        </button>
                        <button
                            onClick={siguiente}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition"
                            aria-label="Siguiente"
                        >
                            ▶
                        </button>
                    </>
                )}

                {/* Thumbnails */}
                {imagenes.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {imagenes.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setActiva(i)}
                                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition
                                    ${i === activa ? 'border-green-600 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}
                                `}
                            >
                                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxAbierto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxAbierto(false)}
                >
                    <button
                        onClick={() => setLightboxAbierto(false)}
                        className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>

                    <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img
                            src={imagenes[activa].url}
                            alt={imagenes[activa].alt}
                            className="max-w-full max-h-[90vh] object-contain"
                        />

                        {imagenes.length > 1 && (
                            <>
                                <button
                                    onClick={anterior}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white text-4xl hover:text-green-400 transition"
                                    aria-label="Anterior"
                                >
                                    ◀
                                </button>
                                <button
                                    onClick={siguiente}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white text-4xl hover:text-green-400 transition"
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
