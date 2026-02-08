/**
 * Componente: SidebarPanel
 * Barra lateral de navegacion del panel de usuario.
 * Muestra avatar, nombre, rol y links de navegacion con iconos.
 */
import React from 'react';
import {FolderOpen, Briefcase, Receipt, User, CreditCard} from 'lucide-react';
import {TABS_PANEL, obtenerUsuarioActual, type SeccionPanel} from '../../data/panel';
import './SidebarPanel.css';

interface SidebarPanelProps {
    seccionActiva: SeccionPanel;
    onCambiarSeccion: (seccion: SeccionPanel) => void;
}

/* Mapa de iconos por seccion */
const ICONOS_SECCION: Record<SeccionPanel, React.ElementType> = {
    'proyectos': FolderOpen,
    'servicios': Briefcase,
    'pagos': Receipt,
    'perfil': User,
    'metodos-pago': CreditCard,
};

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

            {/* Navegacion con iconos */}
            <nav className="sidebarNav" aria-label="Secciones del panel">
                {TABS_PANEL.map(tab => {
                    const Icono = ICONOS_SECCION[tab.id];
                    return (
                        <button
                            key={tab.id}
                            className={`sidebarItem ${seccionActiva === tab.id ? 'sidebarItemActivo' : ''}`}
                            onClick={() => onCambiarSeccion(tab.id)}
                            aria-current={seccionActiva === tab.id ? 'page' : undefined}
                        >
                            <Icono size={18} className="sidebarItemIcono" aria-hidden="true" />
                            <span className="sidebarItemTexto">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};
