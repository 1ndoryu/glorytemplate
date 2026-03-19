/*
 * BlogPageIsland.tsx — Kamples (183A-109)
 * Dispatcher: /blog → BlogIsland (listado), /blog/{slug} → ArticuloDetalleIsland.
 * Recibe slug como prop desde pages.php (vacío = listado, con valor = detalle).
 */

import { BlogIsland } from './BlogIsland';
import { ArticuloDetalleIsland } from './ArticuloDetalleIsland';

interface BlogPageIslandProps {
    slug?: string;
}

export const BlogPageIsland: React.FC<BlogPageIslandProps> = ({ slug }) => {
    if (slug) {
        return <ArticuloDetalleIsland slug={slug} />;
    }
    return <BlogIsland />;
};
