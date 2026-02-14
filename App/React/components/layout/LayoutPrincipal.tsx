/*
 * Componente: LayoutPrincipal
 * Wrapper del layout completo: sidebar + topbar + contenido + reproductor.
 * Envuelve cada isla para proporcionar la estructura base de Kamples.
 */

import { useMemo, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ReproductorGlobal } from '../ui/ReproductorGlobal';
import '../../styles/variables.css';
import '../../styles/reset.css';
import '../../styles/layout.css';

interface LayoutPrincipalProps {
    children: ReactNode;
    paginaActiva?: string;
}

/* Mapeo de rutas a IDs de sidebar */
const MAPA_RUTAS: Record<string, string> = {
    '/': 'inicio',
    '/explorar': 'explorar',
    '/subir': 'subir',
    '/perfil': 'perfil',
    '/libreria': 'libreria',
    '/mensajes': 'mensajes',
    '/componentes': 'componentes',
    '/dev/componentes': 'componentes',
};

/* Detectar página activa desde la URL actual */
function detectarPaginaActiva(): string {
    const path = window.location.pathname.replace(/\/$/, '') || '/';

    /* Busca match exacto primero */
    if (MAPA_RUTAS[path]) return MAPA_RUTAS[path];

    /* Busca match parcial (ej: /perfil/username → perfil) */
    for (const [ruta, id] of Object.entries(MAPA_RUTAS)) {
        if (ruta !== '/' && path.startsWith(ruta)) return id;
    }

    /* /sample/{slug} → explorar */
    if (path.startsWith('/sample')) return 'explorar';

    return 'inicio';
}

export const LayoutPrincipal = ({
    children,
    paginaActiva,
}: LayoutPrincipalProps): JSX.Element => {
    const activa = useMemo(
        () => paginaActiva ?? detectarPaginaActiva(),
        [paginaActiva]
    );

    return (
        <div className="layoutPrincipal">
            <aside className="areaSidebar">
                <Sidebar activa={activa} />
            </aside>

            <header className="areaTopbar">
                <TopBar />
            </header>

            <main className="areaContenido">
                <div className="contenedorContenido">
                    {children}
                </div>
            </main>

            <footer className="areaReproductor">
                <ReproductorGlobal />
            </footer>
        </div>
    );
};

export default LayoutPrincipal;
