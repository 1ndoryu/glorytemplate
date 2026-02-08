/**
 * Island: PanelIsland
 * Panel de usuario con header custom (sin header/footer global) y sidebar lateral.
 * Secciones: Proyectos, Servicios, Pagos, Perfil, Metodos de Pago.
 * TO-DO: Integrar con backend real (auth, Stripe, dashboards).
 */
import React, {useState} from 'react';
import {HeaderPanel} from '../components/panel/HeaderPanel';
import {SeccionPerfil} from '../components/panel/SeccionPerfil';
import {SeccionMetodosPago} from '../components/panel/SeccionMetodosPago';
import {SidebarPanel} from '../components/panel/SidebarPanel';
import {PlaceholderSeccion} from '../components/panel/PlaceholderSeccion';
import {TABS_PANEL, type SeccionPanel} from '../data/panel';
import '../styles/variables.css';
import './PanelIsland.css';

export const PanelIsland: React.FC = () => {
    const [seccionActiva, setSeccionActiva] = useState<SeccionPanel>('proyectos');
    const tabActual = TABS_PANEL.find(t => t.id === seccionActiva) || TABS_PANEL[0];

    /* Renderizar contenido segun seccion activa */
    const renderContenido = () => {
        switch (seccionActiva) {
            case 'perfil':
                return <SeccionPerfil />;
            case 'metodos-pago':
                return <SeccionMetodosPago />;
            default:
                return <PlaceholderSeccion tab={tabActual} />;
        }
    };

    return (
        <>
            <HeaderPanel />
            <section id="panelUsuario" className="panelContenedor">
                <div className="panelLayout">
                    <SidebarPanel
                        seccionActiva={seccionActiva}
                        onCambiarSeccion={setSeccionActiva}
                    />

                    <main className="panelContenidoPrincipal">
                        <div className="panelContenidoCabecera">
                            <h1 className="panelTitulo">{tabActual.label}</h1>
                        </div>
                        <div className="panelContenido">
                            {renderContenido()}
                        </div>
                    </main>
                </div>
            </section>
        </>
    );
};
