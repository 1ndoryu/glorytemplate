/*
 * Componente: LayoutPrincipal
 * Wrapper del layout completo: sidebar + topbar + contenido + reproductor + modal subida.
 * Envuelve cada isla para proporcionar la estructura base de Kamples.
 * Detecta la página activa de forma reactiva vía el navigationStore de Glory.
 */

import { useMemo, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ReproductorGlobal } from '../ui/ReproductorGlobal';
import { SubirModal } from '../ui/SubirModal';
import { ModalPublicar } from '../social/ModalPublicar';
import { ModalSeleccionColeccion } from '../social/ModalSeleccionColeccion';
import { useNavigationStore } from '@/core/router';
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
    '/perfil': 'perfil',
    '/libreria': 'libreria',
    '/mensajes': 'mensajes',
    '/componentes': 'componentes',
    '/dev/componentes': 'componentes',
};

/* Detectar página activa desde la ruta (SPA o URL) */
function detectarPaginaActiva(ruta: string): string {
    const path = ruta.replace(/\/$/, '') || '/';

    if (MAPA_RUTAS[path]) return MAPA_RUTAS[path];

    for (const [rutaKey, id] of Object.entries(MAPA_RUTAS)) {
        if (rutaKey !== '/' && path.startsWith(rutaKey)) return id;
    }

    if (path.startsWith('/sample')) return 'explorar';

    return 'inicio';
}

export const LayoutPrincipal = ({
    children,
    paginaActiva,
}: LayoutPrincipalProps): JSX.Element => {
    /* Se suscribe al store SPA para reaccionar a cambios de ruta sin recarga */
    const rutaActual = useNavigationStore((s) => s.rutaActual);

    const activa = useMemo(
        () => paginaActiva ?? detectarPaginaActiva(rutaActual),
        [paginaActiva, rutaActual]
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

            {/* Modal de subida — se abre desde el sidebar */}
            <SubirModal />

            {/* Modal de publicación social */}
            <ModalPublicar />

            {/* Modal selector de colección (menú contextual → añadir a colección) */}
            <ModalSeleccionColeccion />
        </div>
    );
};

export default LayoutPrincipal;
