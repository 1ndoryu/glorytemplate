/*
 * Componente: Sidebar
 * Navegación lateral mínima con iconos y tooltips.
 * Incluye: Inicio, Explorar, Comunidad, Librería, Crear (modal).
 * Mensajes, notificaciones y perfil se manejan desde el TopBar.
 */

import {
    Home,
    Users,
    FolderOpen,
    Settings,
    AudioLines,
} from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import '../../styles/componentes/sidebar.css';

export interface SidebarItemDef {
    id: string;
    etiqueta: string;
    icono: React.ReactNode;
    ruta: string;
    accion?: 'modal-crear';
}

const itemsDefault: SidebarItemDef[] = [
    { id: 'inicio', etiqueta: 'Inicio', icono: <Home size={20} />, ruta: '/' },
    { id: 'comunidad', etiqueta: 'Comunidad', icono: <Users size={20} />, ruta: '/comunidad' },
    { id: 'libreria', etiqueta: 'Librería', icono: <FolderOpen size={20} />, ruta: '/libreria' },
];

interface SidebarProps {
    activa?: string;
    items?: SidebarItemDef[];
    onNavegar?: (ruta: string) => void;
}

export const Sidebar = ({
    activa = 'inicio',
    items = itemsDefault,
    onNavegar,
}: SidebarProps): JSX.Element => {
    const { navegar } = useNavigationStore();
    const { abrir: abrirConfiguracion } = useConfiguracionModalStore();

    const manejarClick = (item: SidebarItemDef) => {
        if (item.accion === 'modal-crear') {
            return;
        }

        if (onNavegar) {
            onNavegar(item.ruta);
        } else {
            navegar(item.ruta);
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebarLogo">
                <AudioLines size={24} />
            </div>

            <nav className="sidebarNav">
                {items.map((item) => {
                    /* Crear como modal: usar button */
                    if (item.accion === 'modal-crear') {
                        return (
                            <button
                                key={item.id}
                                className={`sidebarItem ${activa === item.id ? 'sidebarItemActivo' : ''}`}
                                data-tooltip={item.etiqueta}
                                onClick={() => manejarClick(item)}
                                type="button"
                                aria-label={item.etiqueta}
                            >
                                {item.icono}
                            </button>
                        );
                    }

                    /* Navegación SPA: usar <a> para soporte de middle-click */
                    return (
                        <a
                            key={item.id}
                            href={item.ruta || '/'}
                            className={`sidebarItem ${activa === item.id ? 'sidebarItemActivo' : ''}`}
                            data-tooltip={item.etiqueta}
                            onClick={(e) => {
                                if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                    e.preventDefault();
                                    manejarClick(item);
                                }
                            }}
                            aria-label={item.etiqueta}
                        >
                            {item.icono}
                        </a>
                    );
                })}
            </nav>

            <div className="sidebarFooter">
                <div className="sidebarSeparador" />
                <button
                    className="sidebarItem"
                    data-tooltip="Configuración"
                    onClick={() => abrirConfiguracion()}
                    type="button"
                    aria-label="Configuración"
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
