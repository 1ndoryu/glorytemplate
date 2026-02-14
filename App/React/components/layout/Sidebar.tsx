/*
 * Componente: Sidebar
 * Navegación lateral con iconos y tooltips.
 */

import {
    Home,
    Music,
    Compass,
    User,
    FolderOpen,
    Upload,
    MessageCircle,
} from 'lucide-react';
import '../../styles/componentes/sidebar.css';

export interface SidebarItemDef {
    id: string;
    etiqueta: string;
    icono: React.ReactNode;
    ruta: string;
    badge?: boolean;
}

const itemsDefault: SidebarItemDef[] = [
    { id: 'inicio', etiqueta: 'Inicio', icono: <Home size={20} />, ruta: '/' },
    { id: 'samples', etiqueta: 'Samples', icono: <Music size={20} />, ruta: '/samples' },
    { id: 'descubrir', etiqueta: 'Descubrir', icono: <Compass size={20} />, ruta: '/descubrir' },
    { id: 'perfil', etiqueta: 'Perfil', icono: <User size={20} />, ruta: '/perfil' },
    { id: 'libreria', etiqueta: 'Librería', icono: <FolderOpen size={20} />, ruta: '/libreria' },
    { id: 'subir', etiqueta: 'Subir', icono: <Upload size={20} />, ruta: '/subir' },
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
    const manejarClick = (ruta: string) => {
        if (onNavegar) {
            onNavegar(ruta);
        } else {
            window.location.href = ruta;
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebarLogo">
                <Music size={24} />
            </div>

            <nav className="sidebarNav">
                {items.map((item) => (
                    <button
                        key={item.id}
                        className={`sidebarItem ${activa === item.id ? 'sidebarItemActivo' : ''}`}
                        data-tooltip={item.etiqueta}
                        onClick={() => manejarClick(item.ruta)}
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
