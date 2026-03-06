/*
 * SkeletonTarjetaSample — Placeholder para TarjetaSample.
 * Replica la estructura grid 40px | 1fr | auto.
 */

import { Skeleton } from './Skeleton';

export function SkeletonTarjetaSample(): JSX.Element {
    return (
        <div className="skeletonTarjetaSample" aria-hidden="true">
            <Skeleton className="skeletonTarjetaSamplePortada" ancho={40} alto={40} />
            <div className="skeletonTarjetaSampleContenido">
                <Skeleton className="skeletonTarjetaSampleTitulo" />
                <Skeleton className="skeletonTarjetaSampleMeta" />
            </div>
            <div className="skeletonTarjetaSampleAcciones">
                <Skeleton className="skeletonTarjetaSampleAccionItem" circulo />
                <Skeleton className="skeletonTarjetaSampleAccionItem" circulo />
                <Skeleton className="skeletonTarjetaSampleAccionItem" circulo />
            </div>
        </div>
    );
}
