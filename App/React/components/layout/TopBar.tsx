/*
 * Componente: TopBar
 * Barra superior con tabs dinámicas, búsqueda global, notificaciones, mensajes y avatar.
 * Las tabs se establecen desde cada isla via useTabsTopBarStore.
 * El avatar abre un menú contextual (perfil, config, cerrar sesión).
 */

import { useState, useCallback } from 'react';
import { Bell, Mail, User, Settings, LogOut, Plus, Crown, Sparkles } from 'lucide-react';
import { InputBusqueda } from '../ui/InputBusqueda';
import { Avatar } from '../ui/Avatar';
import { MenuContextual, type MenuItemDef } from '../ui/MenuContextual';
import { DropdownNotificaciones } from '../ui/DropdownNotificaciones';
import { DropdownMensajes } from '../ui/DropdownMensajes';
import { BotonExperimentos } from '../ui/BotonExperimentos';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/topbar.css';

export const TopBar = (): JSX.Element => {
    const { tabs, activa, setActiva } = useTabsTopBarStore();
    const { usuario, autenticado } = useAuthStore();
    const { setBusqueda } = useFiltrosStore();
    const { navegar } = useNavigationStore();
    const { abrir: abrirCrear } = useCrearModalStore();
    const { abrir: abrirConfiguracion } = useConfiguracionModalStore();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [mensajesAbiertos, setMensajesAbiertos] = useState(false);

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
            href: `/perfil/${usuario?.username}/`,
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
                abrirConfiguracion();
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
                        className="topbarIconoBtn topbarCrearBtn"
                        onClick={abrirCrear}
                        aria-label="Crear"
                        type="button"
                    >
                        <Plus size={20} />
                    </button>

                    {/* Badge de plan — click abre /planes */}
                    <button
                        className={`topbarPlanBadge topbarPlan${(usuario?.plan ?? 'free').charAt(0).toUpperCase() + (usuario?.plan ?? 'free').slice(1)}`}
                        onClick={() => navegar('/planes/')}
                        type="button"
                        aria-label="Ver planes"
                    >
                        {usuario?.plan === 'premium' ? (
                            <><Crown size={12} /> Premium</>
                        ) : usuario?.plan === 'pro' ? (
                            <><Sparkles size={12} /> Pro</>
                        ) : (
                            <>Free</>
                        )}
                    </button>

                    {/* Botón experimentos — solo visible para admin */}
                    <BotonExperimentos />

                    <div className="topbarIconoWrapper">
                        <button
                            className="topbarIconoBtn"
                            onClick={() => {
                                setMensajesAbiertos(false);
                                setNotificacionesAbiertas((prev) => !prev);
                            }}
                            aria-label="Notificaciones"
                            type="button"
                        >
                            <Bell size={18} />
                        </button>
                        {notificacionesAbiertas && (
                            <DropdownNotificaciones onCerrar={() => setNotificacionesAbiertas(false)} />
                        )}
                    </div>

                    <div className="topbarIconoWrapper">
                        <button
                            className="topbarIconoBtn"
                            onClick={() => {
                                setNotificacionesAbiertas(false);
                                setMensajesAbiertos((prev) => !prev);
                            }}
                            aria-label="Mensajes"
                            type="button"
                        >
                            <Mail size={18} />
                        </button>
                        {mensajesAbiertos && (
                            <DropdownMensajes onCerrar={() => setMensajesAbiertos(false)} />
                        )}
                    </div>

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
