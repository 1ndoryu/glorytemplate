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
}

const ITEMS_MENU: ItemMenu[] = [
    { clave: 'dashboard', label: 'Dashboard' },
    { clave: 'reservas', label: 'Reservas' },
    { clave: 'flota', label: 'Flota' },
    { clave: 'clientes', label: 'Clientes' },
    { clave: 'configuracion', label: 'Configuración' },
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
