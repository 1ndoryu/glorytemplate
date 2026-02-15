/*
 * Componente: TopBar
 * Barra superior con tabs dinámicas, búsqueda global, notificaciones, mensajes y avatar.
 * Las tabs se establecen desde cada isla via useTabsTopBarStore.
 * El avatar abre un menú contextual (perfil, config, cerrar sesión).
 */

import { useState, useCallback } from 'react';
import { Bell, Mail, User, Settings, LogOut } from 'lucide-react';
import { InputBusqueda } from '../ui/InputBusqueda';
import { Avatar } from '../ui/Avatar';
import { MenuContextual, type MenuItemDef } from '../ui/MenuContextual';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/topbar.css';

export const TopBar = (): JSX.Element => {
    const { tabs, activa, setActiva } = useTabsTopBarStore();
    const { usuario, autenticado } = useAuthStore();
    const { setBusqueda } = useFiltrosStore();
    const { navegar } = useNavigationStore();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const manejarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
    }, [setBusqueda]);

    const manejarClickAvatar = useCallback((e?: React.MouseEvent) => {
        if (!e) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPos({ x: rect.right - 160, y: rect.bottom + 4 });
        setMenuAbierto(true);
    }, []);

    const menuItems: MenuItemDef[] = [
        {
            id: 'perfil',
            etiqueta: 'Ver perfil',
            icono: <User size={14} />,
            onClick: () => {
                navegar(`/perfil/${usuario?.username}/`);
                setMenuAbierto(false);
            },
        },
        {
            id: 'configuracion',
            etiqueta: 'Configuración',
            icono: <Settings size={14} />,
            separadorDespues: true,
            onClick: () => {
                /* TO-DO: abrir modal de configuración */
                setMenuAbierto(false);
            },
        },
        {
            id: 'cerrarSesion',
            etiqueta: 'Cerrar sesión',
            icono: <LogOut size={14} />,
            peligro: true,
            onClick: () => {
                window.location.href = '/wp-login.php?action=logout';
            },
        },
    ];

    return (
        <div className="topbar">
            {/* Tabs dinámicas (definidas por cada isla) */}
            <div className="topbarTabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`topbarTab ${activa === tab.id ? 'topbarTabActiva' : ''}`}
                        onClick={() => setActiva(tab.id)}
                        type="button"
                    >
                        {tab.etiqueta}
                    </button>
                ))}
            </div>

            <div className="topbarBusqueda">
                <InputBusqueda
                    placeholder="Buscar samples..."
                    onChange={manejarBusqueda}
                />
            </div>

            {autenticado && (
                <div className="topbarAcciones">
                    <button
                        className="topbarIconoBtn"
                        onClick={() => navegar('/notificaciones')}
                        aria-label="Notificaciones"
                        type="button"
                    >
                        <Bell size={18} />
                    </button>

                    <button
                        className="topbarIconoBtn"
                        onClick={() => navegar('/mensajes')}
                        aria-label="Mensajes"
                        type="button"
                    >
                        <Mail size={18} />
                    </button>

                    <div
                        className="topbarAvatarWrapper"
                        onClick={(e) => manejarClickAvatar(e)}
                        role="button"
                        tabIndex={0}
                    >
                        <Avatar
                            src={usuario?.avatarUrl ?? null}
                            nombre={usuario?.nombreVisible ?? ''}
                            tamano="sm"
                        />
                    </div>

                    <MenuContextual
                        abierto={menuAbierto}
                        onCerrar={() => setMenuAbierto(false)}
                        items={menuItems}
                        x={menuPos.x}
                        y={menuPos.y}
                    />
                </div>
            )}
        </div>
    );
};

export default TopBar;
