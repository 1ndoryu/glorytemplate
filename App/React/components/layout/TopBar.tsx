/*
 * Componente: TopBar
 * Barra superior con tabs dinámicas, búsqueda global, notificaciones, mensajes y avatar.
 * Las tabs se establecen desde cada isla via useTabsTopBarStore.
 * El avatar abre un menú contextual (perfil, config, cerrar sesión).
 */

import { useState, useCallback, useEffect } from 'react';
import { Bell, Mail, User, Settings, LogOut, Plus, Crown, Sparkles, Search, Download } from 'lucide-react';
import { InputBusqueda } from '../ui/InputBusqueda';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { Avatar } from '../ui/Avatar';
import { MenuContextual, type MenuItemDef } from '../ui/MenuContextual';
import { DropdownNotificaciones } from '../ui/DropdownNotificaciones';
import { DropdownMensajes } from '../ui/DropdownMensajes';
import { BotonExperimentos } from '../ui/BotonExperimentos';
import { Modal } from '../ui/Modal';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { useNavigationStore } from '@/core/router';
import { obtenerLimites } from '@app/services/apiDescargas';
import '../../styles/componentes/topbar.css';

export const TopBar = (): JSX.Element => {
    const { tabs, activa, setActiva } = useTabsTopBarStore();
    const { usuario, autenticado } = useAuthStore();
    const { busqueda, setBusqueda } = useFiltrosStore();
    const { navegar } = useNavigationStore();
    const { abrir: abrirCrear } = useCrearModalStore();
    const { abrir: abrirConfiguracion } = useConfiguracionModalStore();
    const { abrir: abrirPlanes } = usePlanesModalStore();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
    const [mensajesAbiertos, setMensajesAbiertos] = useState(false);
    const [busquedaModalAbierta, setBusquedaModalAbierta] = useState(false);
    const [creditosInfo, setCreditosInfo] = useState<{ usadas: number; limite: number; ilimitado: boolean } | null>(null);

    /* Cargar créditos de descarga al montar y cada 60s */
    useEffect(() => {
        if (!autenticado) return;
        const cargar = async () => {
            const resp = await obtenerLimites();
            if (resp.ok && resp.data) {
                setCreditosInfo({
                    usadas: resp.data.usadas,
                    limite: resp.data.limite,
                    ilimitado: resp.data.ilimitado,
                });
            }
        };
        cargar();
        const intervalo = setInterval(cargar, 60000);
        return () => clearInterval(intervalo);
    }, [autenticado]);

    const manejarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
    }, [setBusqueda]);

    const manejarClickAvatar = useCallback((e?: React.MouseEvent) => {
        if (!e) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        /* Alinear borde derecho del menú con borde derecho del avatar */
        setMenuPos({ x: rect.right, y: rect.bottom + 4 });
        setMenuAbierto(true);
    }, []);

    const etiquetaCreditos = creditosInfo
        ? creditosInfo.ilimitado
            ? 'Créditos: ∞'
            : `Créditos: ${creditosInfo.limite - creditosInfo.usadas}/${creditosInfo.limite}`
        : 'Créditos: ...';

    const menuItems: MenuItemDef[] = [
        {
            id: 'creditos',
            etiqueta: etiquetaCreditos,
            icono: <Download size={14} />,
            separadorDespues: true,
            onClick: () => {
                /* Navegar a planes si quiere más créditos */
                abrirPlanes();
                setMenuAbierto(false);
            },
        },
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
                    valor={busqueda}
                    onChange={manejarBusqueda}
                />
            </div>

            {autenticado && (
                <div className="topbarAcciones">
                    {/* Badge de plan — primero a la izquierda */}
                    <Badge
                        variante={usuario?.plan === 'premium' ? 'premium' : usuario?.plan === 'pro' ? 'acento' : 'neutro'}
                        interactivo
                        onClick={abrirPlanes}
                    >
                        {usuario?.plan === 'premium' ? (
                            <><Crown size={12} /> Premium</>
                        ) : usuario?.plan === 'pro' ? (
                            <><Sparkles size={12} /> Pro</>
                        ) : (
                            <>Free</>
                        )}
                    </Badge>

                    <div className="topbarBusquedaMovil">
                        <BotonBase
                            variante="ghost"
                            tamano="md"
                            soloIcono
                            onClick={() => setBusquedaModalAbierta(true)}
                            aria-label="Buscar"
                        >
                            <Search size={18} />
                        </BotonBase>
                    </div>

                    <BotonBase
                        variante="ghost"
                        tamano="md"
                        soloIcono
                        onClick={abrirCrear}
                        aria-label="Crear"
                    >
                        <Plus size={20} />
                    </BotonBase>

                    {/* Botón experimentos — solo visible para admin */}
                    <BotonExperimentos />

                    <div className="topbarIconoWrapper">
                        <BotonBase
                            variante="ghost"
                            tamano="md"
                            soloIcono
                            onClick={() => {
                                setMensajesAbiertos(false);
                                setNotificacionesAbiertas((prev) => !prev);
                            }}
                            aria-label="Notificaciones"
                        >
                            <Bell size={18} />
                        </BotonBase>
                        {notificacionesAbiertas && (
                            <DropdownNotificaciones onCerrar={() => setNotificacionesAbiertas(false)} />
                        )}
                    </div>

                    <div className="topbarIconoWrapper">
                        <BotonBase
                            variante="ghost"
                            tamano="md"
                            soloIcono
                            onClick={() => {
                                setNotificacionesAbiertas(false);
                                setMensajesAbiertos((prev) => !prev);
                            }}
                            aria-label="Mensajes"
                        >
                            <Mail size={18} />
                        </BotonBase>
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
                        alinearDerecha
                    />

                    <Modal
                        abierto={busquedaModalAbierta}
                        onCerrar={() => setBusquedaModalAbierta(false)}
                        titulo="Buscar"
                        tamano="pequeno"
                    >
                        <div className="topbarBusquedaModalContenido">
                            <InputBusqueda
                                placeholder="Buscar samples..."
                                valor={busqueda}
                                onChange={manejarBusqueda}
                                autoFocus
                            />
                        </div>
                    </Modal>
                </div>
            )}
        </div>
    );
};

export default TopBar;
