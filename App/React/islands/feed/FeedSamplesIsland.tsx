/*
 * FeedSamplesIsland — Kamples (QK104)
 * Pagina dedicada al feed de samples, accesible en /samples.
 * En mobile, esta es la forma de acceder al feed (/ muestra comunidad).
 * En desktop, esta ruta tambien funciona pero el feed principal sigue en /.
 * Reutiliza FeedUnificado de InicioIsland para evitar duplicacion.
 */

import { useAuthStore } from '@app/stores/authStore';
import { SkeletonFeed } from '@app/components/skeletons';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { FeedUnificado } from './InicioIsland';

export const FeedSamplesIsland = (): JSX.Element => {
    const autenticado = useAuthStore(s => s.autenticado);
    const cargando = useAuthStore(s => s.cargando);

    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionSamples">
                <SkeletonFeed cantidad={8} />
            </div>
        );
    }

    if (!autenticado) {
        return <LandingPublica />;
    }

    return <FeedUnificado />;
};

export default FeedSamplesIsland;
