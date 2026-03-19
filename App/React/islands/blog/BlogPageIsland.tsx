/*
 * BlogPageIsland.tsx — Kamples (183A-109 + 193A-36)
 * Dispatcher: /blog → BlogIsland (listado), /blog/{slug} → ArticuloDetalleIsland.
 * Recibe slug como prop desde pages.php (vacío = listado, con valor = detalle).
 * [193A-36] Si el usuario está autenticado y no hay slug, redirige a /?tab=blog
 * para que el blog se muestre como tab del inicio con sidebar/topbar/tabs visibles.
 */

import { useEffect } from 'react';
import { BlogIsland } from './BlogIsland';
import { ArticuloDetalleIsland } from './ArticuloDetalleIsland';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';

interface BlogPageIslandProps {
    slug?: string;
}

export const BlogPageIsland: React.FC<BlogPageIslandProps> = ({ slug }) => {
    const autenticado = useAuthStore(s => s.autenticado);
    const cargandoAuth = useAuthStore(s => s.cargando);
    const navegar = useNavigationStore(s => s.navegar);
    const setActiva = useTabsTopBarStore(s => s.setActiva);
    const guardarTabIsla = useTabsTopBarStore(s => s.guardarTabIsla);

    /* [193A-36] Redirigir a home con tab blog cuando el usuario autenticado
     * accede a /blog sin slug (listado). El blog es tab del inicio, no página separada. */
    useEffect(() => {
        if (cargandoAuth || slug) return;
        if (autenticado) {
            guardarTabIsla('InicioIsland', 'blog');
            setActiva('blog');
            navegar('/?tab=blog');
        }
    }, [autenticado, cargandoAuth, slug, navegar, setActiva, guardarTabIsla]);

    if (slug) {
        return <ArticuloDetalleIsland slug={slug} />;
    }

    /* Para no autenticados, mostrar BlogIsland directamente (ruta pública /blog) */
    if (!autenticado && !cargandoAuth) {
        return <BlogIsland />;
    }

    /* Mientras carga auth o se redirige, no renderizar nada */
    return null;
};
