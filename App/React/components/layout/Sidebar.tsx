/*
 * Componente: Sidebar
 * Navegación lateral con iconos y tooltips.
 * Usa navegación SPA via Glory navigationStore.
 * El botón "Subir" abre un modal en vez de navegar.
 */

import {
    Home,
    Compass,
    User,
    FolderOpen,
    Upload,
    MessageCircle,
    AudioLines,
} from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import '../../styles/componentes/sidebar.css';

export interface SidebarItemDef {
    id: string;
    etiqueta: string;
    icono: React.ReactNode;
    ruta: string;
    /* Si true, abre modal en vez de navegar */
    accion?: 'modal-subir';
    badge?: boolean;
}

const itemsDefault: SidebarItemDef[] = [
    { id: 'inicio', etiqueta: 'Inicio', icono: <Home size={20} />, ruta: '/' },
    { id: 'explorar', etiqueta: 'Explorar', icono: <Compass size={20} />, ruta: '/explorar' },
    { id: 'perfil', etiqueta: 'Perfil', icono: <User size={20} />, ruta: '/perfil' },
    { id: 'libreria', etiqueta: 'Librería', icono: <FolderOpen size={20} />, ruta: '/libreria' },
    { id: 'subir', etiqueta: 'Subir', icono: <Upload size={20} />, ruta: '', accion: 'modal-subir' },
    { id: 'mensajes', etiqueta: 'Mensajes', icono: <MessageCircle size={20} />, ruta: '/mensajes' },
];

interface SidebarProps {
    activa?: string;
    items?: SidebarItemDef[];
    onNavegar?: (ruta: string) => void;
    tieneNotificaciones?: boolean;
    tieneMensajes?: boolean;
}

export const Sidebar = ({
    activa = 'inicio',
    items = itemsDefault,
    onNavegar,
    tieneNotificaciones = false,
    tieneMensajes = false,
}: SidebarProps): JSX.Element => {
    const { navegar } = useNavigationStore();
    const { abrir: abrirSubirModal } = useSubirModalStore();

    const manejarClick = (item: SidebarItemDef) => {
        /* Acciones especiales (ej: abrir modal de subida) */
        if (item.accion === 'modal-subir') {
            abrirSubirModal();
            return;
        }

        if (onNavegar) {
            onNavegar(item.ruta);
        } else {
            /* Navegación SPA — el store decide si es interna o recarga */
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
                        {item.id === 'mensajes' && tieneMensajes && (
                            <span className="sidebarBadge" />
                        )}
                        {item.id === 'notificaciones' && tieneNotificaciones && (
                            <span className="sidebarBadge" />
                        )}
                    </button>
                ))}
            </nav>

            <div className="sidebarFooter">
                {/* TO-DO: botón configuración, avatar del usuario */}
            </div>
        </div>
    );
};

export default Sidebar;
