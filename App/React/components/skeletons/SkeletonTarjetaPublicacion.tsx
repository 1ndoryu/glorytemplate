/*
 * SkeletonTarjetaPublicacion — Placeholder para TarjetaPublicacion.
 * Cabecera (avatar + nombre + fecha) + lineas de texto + acciones.
 */

import { Skeleton } from './Skeleton';

export function SkeletonTarjetaPublicacion(): JSX.Element {
    return (
        <div className="skeletonTarjetaPublicacion" aria-hidden="true">
            <div className="skeletonTarjetaPubCabecera">
                <Skeleton className="skeletonTarjetaPubAvatar" circulo />
                <div className="skeletonTarjetaPubAutor">
                    <Skeleton className="skeletonTarjetaPubNombre" />
                    <Skeleton className="skeletonTarjetaPubFecha" />
                </div>
            </div>
            <div className="skeletonTarjetaPubContenido">
                <Skeleton className="skeletonTarjetaPubLineaTexto" />
                <Skeleton className="skeletonTarjetaPubLineaTexto skeletonTextoMedio" />
            </div>
            <div className="skeletonTarjetaPubAcciones">
                <Skeleton className="skeletonTarjetaPubAccionItem" />
                <Skeleton className="skeletonTarjetaPubAccionItem" />
                <Skeleton className="skeletonTarjetaPubAccionItem" />
            </div>
        </div>
    );
}
