/*
 * Componente: Sidebar
 * Navegación lateral mínima con iconos y tooltips.
 * Incluye: Inicio, Explorar, Comunidad, Librería, Crear (modal).
 * Mensajes, notificaciones y perfil se manejan desde el TopBar.
 */

import {
    Home,
    Users,
    Box,
    Download,
    Heart,
    Music,
    Settings,
    ShieldCheck,
    Bug,
} from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useReportarErrorStore } from '@app/stores/reportarErrorStore';
import { useAuthStore } from '@app/stores/authStore';
import '../../styles/componentes/sidebar.css';
import { BotonBase } from '../ui/BotonBase';
import { LogoKamples } from '../ui/LogoKamples';

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
    { id: 'musica', etiqueta: 'Música', icono: <Music size={20} />, ruta: '/musica' },
    { id: 'libreria', etiqueta: 'Librería', icono: <Box size={20} />, ruta: '/libreria' },
    { id: 'descargas', etiqueta: 'Coleccionados', icono: <Download size={20} />, ruta: '/descargas' },
    { id: 'favoritos', etiqueta: 'Favoritos', icono: <Heart size={20} />, ruta: '/favoritos' },
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
    const navegar = useNavigationStore(s => s.navegar);
    const abrirConfiguracion = useConfiguracionModalStore(s => s.abrir);
    const abrirReportarError = useReportarErrorStore(s => s.abrir);
    const usuario = useAuthStore(s => s.usuario);
    const esAdmin = usuario?.rol === 'admin';

    /* Agregar enlace admin condicionalmente */
    const itemsFinales: SidebarItemDef[] = esAdmin
        ? [...items, { id: 'admin', etiqueta: 'Admin', icono: <ShieldCheck size={20} />, ruta: '/admin/panel' }]
        : items;

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
            <a
                href="/"
                className="sidebarLogo"
                onClick={(e) => {
                    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        navegar('/');
                    }
                }}
            >
                <LogoKamples tamano={22} />
            </a>

            <nav className="sidebarNav">
                {itemsFinales.map((item) => {
                    /* Crear como modal o panel: usar button */
                    if (item.accion) {
                        return (
                            <BotonBase variante="ghost"
                                key={item.id}
                                className={`sidebarItem ${activa === item.id ? 'sidebarItemActivo' : ''}`}
                                data-tooltip={item.etiqueta}
                                onClick={() => manejarClick(item)}
                                type="button"
                                aria-label={item.etiqueta}
                            >
                                {item.icono}
                            </BotonBase>
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
                <BotonBase variante="ghost"
                    className="sidebarItem"
                    data-tooltip="Reportar error"
                    onClick={() => abrirReportarError()}
                    type="button"
                    aria-label="Reportar error"
                >
                    <Bug size={20} />
                </BotonBase>
                <BotonBase variante="ghost"
                    className="sidebarItem"
                    data-tooltip="Configuración"
                    onClick={() => abrirConfiguracion()}
                    type="button"
                    aria-label="Configuración"
                >
                    <Settings size={20} />
                </BotonBase>
            </div>
        </div>
    );
};

export default Sidebar;
