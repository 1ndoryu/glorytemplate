/**
 * Island: PanelIsland
 * Panel de usuario (placeholder).
 * Navegación interna con tabs: Mis Proyectos, Servicios, Pagos.
 * TO-DO: Integrar con backend (auth, Stripe, dashboard real) cuando se configuren.
 */
import React, {useState} from 'react';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {Button} from '../components/ui/Button';
import './PanelIsland.css';

type SeccionPanel = 'proyectos' | 'servicios' | 'pagos';

interface TabConfig {
    id: SeccionPanel;
    label: string;
    descripcion: string;
}

const TABS_PANEL: TabConfig[] = [
    {
        id: 'proyectos',
        label: 'Mis Proyectos',
        descripcion: 'Aquí podrás ver el estado de tus proyectos en progreso y los finalizados. Seguimiento en tiempo real del avance de cada servicio contratado.'
    },
    {
        id: 'servicios',
        label: 'Servicios',
        descripcion: 'Gestiona tus servicios contratados: hosting, VPS, desarrollo web y más. Consulta detalles, renueva o amplía tus planes.'
    },
    {
        id: 'pagos',
        label: 'Pagos',
        descripcion: 'Historial completo de pagos realizados. Facturas, recibos y métodos de pago asociados a tu cuenta.'
    }
];

export const PanelIsland: React.FC = () => {
    const [seccionActiva, setSeccionActiva] = useState<SeccionPanel>('proyectos');
    const tabActual = TABS_PANEL.find(t => t.id === seccionActiva) || TABS_PANEL[0];

    return (
        <LayoutPagina>
            <section id="panelUsuario" className="panelContenedor">
                {/* Cabecera del panel */}
                <div className="panelCabecera">
                    <h1 className="panelTitulo">Mi Panel</h1>
                    <p className="panelSubtitulo">Gestiona tus proyectos, servicios y pagos desde un solo lugar.</p>
                </div>

                {/* Navegacion por tabs */}
                <nav className="panelNavegacion">
                    {TABS_PANEL.map(tab => (
                        <button
                            key={tab.id}
                            className={`panelTab ${seccionActiva === tab.id ? 'panelTabActivo' : ''}`}
                            onClick={() => setSeccionActiva(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Contenido placeholder */}
                <div className="panelContenido">
                    <div className="panelPlaceholder">
                        <div className="panelIconoConstruccion">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                        </div>
                        <h2 className="panelPlaceholderTitulo">{tabActual.label}</h2>
                        <p className="panelPlaceholderDescripcion">{tabActual.descripcion}</p>
                        <div className="panelPlaceholderBadge">En construcción</div>
                        <p className="panelPlaceholderNota">
                            Estamos trabajando para traerte la mejor experiencia. Esta sección estará disponible próximamente.
                        </p>
                        <Button variante="outline" onClick={() => window.location.href = '/'}>
                            Volver al inicio
                        </Button>
                    </div>
                </div>
            </section>
        </LayoutPagina>
    );
};
