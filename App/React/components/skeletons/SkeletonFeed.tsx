/*
 * SkeletonFeed — Lista repetida de SkeletonTarjetaSample.
 * Ideal para InicioIsland, feeds, exploradores en estado de carga.
 */

import { SkeletonTarjetaSample } from './SkeletonTarjetaSample';

interface SkeletonFeedProps {
    cantidad?: number;
}

export function SkeletonFeed({ cantidad = 6 }: SkeletonFeedProps): JSX.Element {
    return (
        <div aria-hidden="true">
            {Array.from({ length: cantidad }, (_, i) => (
                <SkeletonTarjetaSample key={i} />
            ))}
        </div>
    );
}
