/*
 * Componente: LayoutPrincipal
 * Wrapper del layout completo: sidebar + topbar + contenido + reproductor.
 * Envuelve cada isla para proporcionar la estructura base de Kamples.
 */

import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import '../../styles/variables.css';
import '../../styles/reset.css';
import '../../styles/layout.css';

interface LayoutPrincipalProps {
    children: ReactNode;
    paginaActiva?: string;
}

export const LayoutPrincipal = ({
    children,
    paginaActiva = 'inicio',
}: LayoutPrincipalProps): JSX.Element => {
    return (
        <div className="layoutPrincipal">
            <aside className="areaSidebar">
                <Sidebar activa={paginaActiva} />
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
                {/* TO-DO: ReproductorGlobal se inyectará aquí */}
            </footer>
        </div>
    );
};

export default LayoutPrincipal;
