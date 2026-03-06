/*
 * SkeletonTarjetaColeccion — Placeholder para TarjetaColeccion.
 * Portada aspect-ratio 16/10 + info debajo.
 */

import { Skeleton } from './Skeleton';

export function SkeletonTarjetaColeccion(): JSX.Element {
    return (
        <div className="skeletonTarjetaColeccion" aria-hidden="true">
            <Skeleton className="skeletonTarjetaColeccionPortada" />
            <div className="skeletonTarjetaColeccionInfo">
                <Skeleton className="skeletonTarjetaColeccionNombre" />
                <Skeleton className="skeletonTarjetaColeccionMeta" />
            </div>
        </div>
    );
}
