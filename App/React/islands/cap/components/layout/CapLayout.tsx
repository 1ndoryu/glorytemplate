/**
 * CapLayout
 *
 * Layout principal del dashboard CAP.
 * Contiene sidebar con navegación y área de contenido.
 * Responsable únicamente de la estructura visual (SRP).
 */

import type {ReactNode} from 'react';
import {Badge} from '../ui';
import {IconoCalendario, IconoUsuarios, IconoConfiguracion, IconoCerrarSesion, IconoMenu, IconoLogoCap, IconoReportes, IconoFlechaIzquierda, IconoFlechaDerecha} from '../icons';
import {useDashboardStore, type SeccionActiva} from '../../stores/useDashboardStore';
import '../dashboard/dashboard.css';

interface ItemNavegacion {
    id: SeccionActiva;
    label: string;
    icono: ReactNode;
}

const itemsNavegacion: ItemNavegacion[] = [
    {id: 'calendario', label: 'Calendario', icono: <IconoCalendario />},
    {id: 'alumnos', label: 'Alumnos', icono: <IconoUsuarios />},
    {id: 'reportes', label: 'Reportes', icono: <IconoReportes />},
    {id: 'configuracion', label: 'Configuración', icono: <IconoConfiguracion />}
];

interface CapLayoutProps {
    children: ReactNode;
    userName: string;
    siteUrl: string;
}

export function CapLayout({children, userName, siteUrl}: CapLayoutProps) {
    /* Selectores individuales para evitar re-renders innecesarios (8.13) */
    const seccionActiva = useDashboardStore(s => s.seccionActiva);
    const sidebarAbierto = useDashboardStore(s => s.sidebarAbierto);
    const sidebarColapsado = useDashboardStore(s => s.sidebarColapsado);
    const setSeccionActiva = useDashboardStore(s => s.setSeccionActiva);
    const abrirSidebar = useDashboardStore(s => s.abrirSidebar);
    const cerrarSidebar = useDashboardStore(s => s.cerrarSidebar);
    const toggleSidebarColapsado = useDashboardStore(s => s.toggleSidebarColapsado);

    const handleCerrarSesion = () => {
        const logoutUrl = `${siteUrl}/wp-login.php?action=logout`;
        window.location.href = logoutUrl;
    };

    const tituloSeccion = itemsNavegacion.find(i => i.id === seccionActiva)?.label || '';

    return (
        <div className="capApp capDashboard" id="dashboardCAP">
            {/* Overlay para móvil */}
            {sidebarAbierto && <div className="capDashboard__overlay" onClick={cerrarSidebar} />}

            {/* Sidebar */}
            <aside className={`capDashboard__sidebar ${sidebarAbierto ? 'capDashboard__sidebar--abierto' : ''} ${sidebarColapsado ? 'capDashboard__sidebar--colapsado' : ''}`}>
                <div className="capSidebar__header">
                    <div className="capSidebar__logo">
                        <IconoLogoCap />
                    </div>
                    <span className="capSidebar__titulo">Gestor CAP</span>
                    <button
                        type="button"
                        className="capSidebar__toggle capOcultoMovil"
                        onClick={toggleSidebarColapsado}
                        title={sidebarColapsado ? 'Expandir panel lateral' : 'Contraer panel lateral'}
                        aria-label={sidebarColapsado ? 'Expandir panel lateral' : 'Contraer panel lateral'}
                    >
                        {sidebarColapsado ? <IconoFlechaDerecha size={16} /> : <IconoFlechaIzquierda size={16} />}
                    </button>
                </div>

                <nav className="capSidebar__nav">
                    {itemsNavegacion.map(item => (
                        <button key={item.id} className={`capSidebar__item ${seccionActiva === item.id ? 'capSidebar__item--activo' : ''}`} onClick={() => setSeccionActiva(item.id)}>
                            <span className="capSidebar__itemIcono">{item.icono}</span>
                            <span className="capSidebar__itemLabel">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="capSidebar__footer">
                    <div className="capSidebar__usuario">
                        <div className="capSidebar__avatar">{userName.charAt(0).toUpperCase()}</div>
                        <div className="capSidebar__usuarioInfo">
                            <span className="capSidebar__usuarioNombre">{userName}</span>
                            <Badge variante="exito" tamano="sm">
                                Activa
                            </Badge>
                        </div>
                    </div>
                    <button className="capSidebar__cerrarSesion" onClick={handleCerrarSesion} title="Cerrar sesión">
                        <IconoCerrarSesion />
                    </button>
                </div>
            </aside>

            {/* Contenido principal */}
            <main className={`capDashboard__main ${sidebarColapsado ? 'capDashboard__main--colapsado' : ''}`}>
                {/* Header móvil */}
                <header className="capDashboard__header">
                    <button className="capDashboard__menuBtn" onClick={abrirSidebar}>
                        <IconoMenu />
                    </button>
                    <h1 className="capDashboard__headerTitulo">{tituloSeccion}</h1>
                    <div className="capDashboard__headerAcciones">{/* Acciones contextuales aquí */}</div>
                </header>

                {/* Área de contenido con transición */}
                <div className="capDashboard__contenido">{children}</div>
            </main>
        </div>
    );
}

export default CapLayout;
