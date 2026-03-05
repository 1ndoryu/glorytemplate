/**
 * AdminSidebar — Navegación lateral del panel de administración.
 * Secciones: Dashboard, Reservas, Flota, Clientes, Configuración.
 */

import type { SeccionPanel } from '@app/types/cresta';
import { Boton } from '@app/components/ui/Boton';
import { useGloryOptions } from '@/hooks';

interface AdminSidebarProps {
    seccion: SeccionPanel;
    onChange: (s: SeccionPanel) => void;
}

interface ItemMenu {
    clave: SeccionPanel;
    label: string;
    icono: JSX.Element;
}

function IconoDashboard(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function IconoReservas(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function IconoFlota(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11l2-5h12l2 5" /><rect x="2" y="11" width="20" height="6" rx="1.5" />
            <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
        </svg>
    );
}

function IconoClientes(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="7" r="3" /><path d="M2 21v-1a7 7 0 0114 0v1" />
            <circle cx="18" cy="7" r="2.5" /><path d="M22 21v-1a5 5 0 00-5-5" />
        </svg>
    );
}

function IconoConfiguracion(): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    );
}

const ITEMS_MENU: ItemMenu[] = [
    { clave: 'dashboard', label: 'Dashboard', icono: <IconoDashboard /> },
    { clave: 'reservas', label: 'Reservas', icono: <IconoReservas /> },
    { clave: 'flota', label: 'Flota', icono: <IconoFlota /> },
    { clave: 'clientes', label: 'Clientes', icono: <IconoClientes /> },
    { clave: 'configuracion', label: 'Configuración', icono: <IconoConfiguracion /> },
];

export function AdminSidebar({ seccion, onChange }: AdminSidebarProps): JSX.Element {
    const { get } = useGloryOptions();
    const usuario = get<{ nombre: string; email: string; avatar: string }>('usuario', { nombre: '', email: '', avatar: '' });

    /* Iniciales para el avatar de fallback */
    const iniciales = usuario.nombre
        ? usuario.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
        : '?';

    return (
        <aside className="adminSidebar">
            <nav className="adminSidebarNav">
                {ITEMS_MENU.map(item => (
                    <Boton
                        key={item.clave}
                        variante="icono"
                        className={`adminSidebarItem ${seccion === item.clave ? 'adminSidebarItemActivo' : ''}`}
                        onClick={() => onChange(item.clave)}
                    >
                        {item.icono}
                        <span>{item.label}</span>
                    </Boton>
                ))}
            </nav>

            <div className="adminSidebarUsuario">
                <div className="adminSidebarAvatarWrap">
                    {usuario.avatar
                        ? <img src={usuario.avatar} alt={usuario.nombre} className="adminSidebarAvatar" />
                        : <span className="adminSidebarAvatarInicial">{iniciales}</span>
                    }
                </div>
                <div className="adminSidebarUsuarioInfo">
                    <span className="adminSidebarUsuarioNombre">{usuario.nombre || 'Administrador'}</span>
                    <span className="adminSidebarUsuarioEmail">{usuario.email}</span>
                </div>
            </div>
        </aside>
    );
}
