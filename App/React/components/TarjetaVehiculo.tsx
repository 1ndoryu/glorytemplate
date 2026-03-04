/**
 * TarjetaVehiculo — Card de vehículo para el grid de la flota.
 * Estilos en componentes.css — sin Tailwind ni estilos inline.
 */

import { GloryLink } from '@/core/router/GloryLink';
import type { Vehiculo } from '@app/types/cresta';

interface TarjetaVehiculoProps {
    vehiculo: Vehiculo;
    className?: string;
}

export function TarjetaVehiculo({ vehiculo, className = '' }: TarjetaVehiculoProps): JSX.Element {
    return (
        <div className={`tarjetaVehiculo ${className}`}>
            {/* Imagen */}
            <div className="tarjetaVehiculoImagenWrap">
                {vehiculo.imagen ? (
                    <img
                        src={vehiculo.imagen}
                        alt={vehiculo.nombre}
                        className="tarjetaVehiculoImagen"
                        loading="lazy"
                    />
                ) : (
                    <div className="tarjetaVehiculoPlaceholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Badge de precio */}
                <div className="tarjetaVehiculoPrecio">
                    Desde {vehiculo.precioBase}€/noche
                </div>
            </div>

            {/* Info */}
            <div className="tarjetaVehiculoInfo">
                <h3 className="tarjetaVehiculoNombre">{vehiculo.nombre}</h3>
                {vehiculo.descripcionCorta && (
                    <p className="tarjetaVehiculoDescripcion">{vehiculo.descripcionCorta}</p>
                )}

                {/* Specs */}
                <div className="tarjetaVehiculoSpecs">
                    <span className="tarjetaVehiculoSpec">
                        {vehiculo.capacidad} {vehiculo.capacidad === 1 ? 'plaza' : 'plazas'}
                    </span>
                    <span className="tarjetaVehiculoSpec">
                        {vehiculo.plazasViaje} viajeros
                    </span>
                    {vehiculo.ubicacion && (
                        <span className="tarjetaVehiculoSpec">
                            {vehiculo.ubicacion}
                        </span>
                    )}
                </div>

                {/* CTA */}
                <GloryLink href={`/flota/${vehiculo.slug}/`} className="tarjetaVehiculoCta">
                    Ver detalles
                </GloryLink>
            </div>
        </div>
    );
}
