/*
 * Componente: Sidebar
 * Navegación lateral mínima con iconos y tooltips.
 * Incluye: Inicio, Explorar, Comunidad, Librería, Crear (modal).
 * Mensajes, notificaciones y perfil se manejan desde el TopBar.
 */

import {
    Home,
    Compass,
    Users,
    FolderOpen,
    PenSquare,
    AudioLines,
} from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import { useCrearModalStore } from '@app/stores/crearModalStore';
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
    { id: 'explorar', etiqueta: 'Explorar', icono: <Compass size={20} />, ruta: '/explorar' },
    { id: 'comunidad', etiqueta: 'Comunidad', icono: <Users size={20} />, ruta: '/comunidad' },
    { id: 'libreria', etiqueta: 'Librería', icono: <FolderOpen size={20} />, ruta: '/libreria' },
    { id: 'crear', etiqueta: 'Crear', icono: <PenSquare size={20} />, ruta: '', accion: 'modal-crear' },
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
    const { abrir: abrirCrearModal } = useCrearModalStore();

    const manejarClick = (item: SidebarItemDef) => {
        if (item.accion === 'modal-crear') {
            abrirCrearModal();
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
                {items.map((item) => (
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
                ))}
            </nav>

            <div className="sidebarFooter" />
        </div>
    );
};

export default Sidebar;
