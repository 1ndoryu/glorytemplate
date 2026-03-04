/**
 * TarjetaVehiculo — Card de vehículo para el grid de la flota.
 */

import { GloryLink } from '@/core/router/GloryLink';
import type { Vehiculo } from '@app/types/cresta';

interface TarjetaVehiculoProps {
    vehiculo: Vehiculo;
    className?: string;
}

export function TarjetaVehiculo({ vehiculo, className = '' }: TarjetaVehiculoProps): JSX.Element {
    return (
        <div className={`group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}>
            {/* Imagen */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {vehiculo.imagen ? (
                    <img
                        src={vehiculo.imagen}
                        alt={vehiculo.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Badge de precio */}
                <div className="absolute bottom-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    Desde {vehiculo.precioBase}€/noche
                </div>
            </div>

            {/* Info */}
            <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{vehiculo.nombre}</h3>
                {vehiculo.descripcionCorta && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{vehiculo.descripcionCorta}</p>
                )}

                {/* Specs */}
                <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        🛏️ {vehiculo.capacidad} {vehiculo.capacidad === 1 ? 'plaza' : 'plazas'}
                    </span>
                    <span className="flex items-center gap-1">
                        🚐 {vehiculo.plazasViaje} viajeros
                    </span>
                    {vehiculo.ubicacion && (
                        <span className="flex items-center gap-1">
                            📍 {vehiculo.ubicacion}
                        </span>
                    )}
                </div>

                {/* CTA */}
                <GloryLink
                    href={`/flota/${vehiculo.slug}/`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                    Ver detalles
                </GloryLink>
            </div>
        </div>
    );
}
