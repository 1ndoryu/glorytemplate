/**
 * TarjetaVehiculo — Card de vehículo para el grid de la flota.
 * Diseño minimalista con iconos SVG para specs (asientos + camas).
 * Estilos en componentes.css — sin Tailwind ni estilos inline.
 */

import { GloryLink } from '@/core/router/GloryLink';
import type { Vehiculo } from '@app/types/cresta';

interface TarjetaVehiculoProps {
    vehiculo: Vehiculo;
    className?: string;
}

function IconoAsientos(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function IconoCamas(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 4v16" />
            <path d="M2 8h18a2 2 0 0 1 2 2v10" />
            <path d="M2 17h20" />
            <path d="M6 8v9" />
        </svg>
    );
}

function IconoUbicacion(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
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
            </div>

            {/* Separador con specs */}
            <div className="tarjetaVehiculoSeparador">
                <span className="tarjetaVehiculoSpecIcono">
                    <IconoAsientos />
                    {vehiculo.plazasViaje} {vehiculo.plazasViaje === 1 ? 'Asiento' : 'Asientos'}
                </span>
                <span className="tarjetaVehiculoSeparadorLinea" />
                <span className="tarjetaVehiculoSpecIcono">
                    <IconoCamas />
                    {vehiculo.capacidad} {vehiculo.capacidad === 1 ? 'Cama' : 'Camas'}
                </span>
            </div>

            {/* Info */}
            <div className="tarjetaVehiculoInfo">
                <div className="tarjetaVehiculoCabecera">
                    <h3 className="tarjetaVehiculoNombre">{vehiculo.nombre}</h3>
                    {vehiculo.ubicacion && (
                        <span className="tarjetaVehiculoUbicacion">
                            <IconoUbicacion />
                            {vehiculo.ubicacion}
                        </span>
                    )}
                </div>

                {vehiculo.descripcionCorta && (
                    <p className="tarjetaVehiculoDescripcion">{vehiculo.descripcionCorta}</p>
                )}

                {/* Precio + CTA */}
                <div className="tarjetaVehiculoPie">
                    <div className="tarjetaVehiculoPrecioBloque">
                        <span className="tarjetaVehiculoPrecioDesde">desde</span>
                        <span className="tarjetaVehiculoPrecioValor">{vehiculo.precioBase}€</span>
                        <span className="tarjetaVehiculoPrecioNoche">/ noche</span>
                    </div>
                    <GloryLink href={`/flota/${vehiculo.slug}/`} className="tarjetaVehiculoCta">
                        Seleccionar
                    </GloryLink>
                </div>
            </div>
        </div>
    );
}
