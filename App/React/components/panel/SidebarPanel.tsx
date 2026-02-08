/**
 * Componente: SidebarPanel
 * Barra lateral de navegacion del panel de usuario.
 * Muestra avatar, nombre, rol y links de navegacion.
 */
import React from 'react';
import {Button} from '../ui/Button';
import {TABS_PANEL, obtenerUsuarioActual, type SeccionPanel} from '../../data/panel';
import './SidebarPanel.css';

interface SidebarPanelProps {
    seccionActiva: SeccionPanel;
    onCambiarSeccion: (seccion: SeccionPanel) => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({seccionActiva, onCambiarSeccion}) => {
    const usuario = obtenerUsuarioActual();

    return (
        <aside className="panelSidebar" aria-label="Panel de navegación del usuario">
            {/* Info usuario */}
            <div className="sidebarUsuario">
                <div className="sidebarAvatar">
                    <img
                        src={usuario?.avatar || 'https://i.pravatar.cc/48?u=default'}
                        alt="Avatar"
                    />
                </div>
                <div className="sidebarInfo">
                    <span className="sidebarNombre">{usuario?.nombre || 'Usuario'}</span>
                    <span className="sidebarRol">{usuario?.rol || 'cliente'}</span>
                </div>
            </div>

            {/* Navegacion */}
            <nav className="sidebarNav" aria-label="Secciones del panel">
                {TABS_PANEL.map(tab => (
                    <button
                        key={tab.id}
                        className={`sidebarItem ${seccionActiva === tab.id ? 'sidebarItemActivo' : ''}`}
                        onClick={() => onCambiarSeccion(tab.id)}
                        aria-current={seccionActiva === tab.id ? 'page' : undefined}
                    >
                        <span className="sidebarItemTexto">{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebarFooter">
                <Button variante="outline" tamano="pequeno" onClick={() => window.location.href = '/'}>
                    Volver al inicio
                </Button>
            </div>
        </aside>
    );
};
