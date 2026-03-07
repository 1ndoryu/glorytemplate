/*
 * SkeletonColeccionDetalle — Placeholder para páginas tipo colección/descargas.
 * Simula: botón volver + header (imagen + nombre + meta) + lista de samples.
 */

import { Skeleton } from './Skeleton';
import { SkeletonTarjetaSample } from './SkeletonTarjetaSample';

interface SkeletonColeccionDetalleProps {
    cantidadSamples?: number;
}

export function SkeletonColeccionDetalle({ cantidadSamples = 4 }: SkeletonColeccionDetalleProps): JSX.Element {
    return (
        <div className="skeletonColeccionDetalle" aria-hidden="true">
            <Skeleton ancho={80} alto={28} className="skeletonColeccionVolver" />

            <div className="skeletonColeccionHeader">
                <Skeleton ancho={120} alto={120} className="skeletonColeccionImg" />
                <div className="skeletonColeccionHeaderInfo">
                    <Skeleton ancho="60%" alto={24} />
                    <Skeleton ancho="30%" alto={16} />
                </div>
            </div>

            {Array.from({ length: cantidadSamples }, (_, i) => (
                <SkeletonTarjetaSample key={i} />
            ))}
        </div>
    );
}
