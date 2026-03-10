/* sentinel-disable-file limite-lineas — barra de navegacion cohesiva: tabs + busqueda + notificaciones + avatar, apenas sobre limite */
/*
 * Componente: TopBar
 * Barra superior con tabs dinámicas, búsqueda global, notificaciones, mensajes y avatar.
 * Las tabs se establecen desde cada isla via useTabsTopBarStore.
 * El avatar abre un menú contextual (perfil, config, cerrar sesión).
 */

import { useState } from 'react';
import { Bell, Mail, User, Settings, LogOut, Plus, Crown, Sparkles, Search, Download, Music2, Trash2, Trash, Menu } from 'lucide-react';
import { InputBusqueda } from '../ui/InputBusqueda';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { Avatar } from '../ui/Avatar';
import { MenuContextual, type MenuItemDef } from '../ui/MenuContextual';
import { DropdownNotificaciones } from '../ui/DropdownNotificaciones';
import { DropdownMensajes } from '../ui/DropdownMensajes';
import { Modal } from '../ui/Modal';
import { useTopBar } from '@app/hooks/useTopBar';
import { useEliminarSamples } from '@app/hooks/useEliminarSamples';
import '../../styles/componentes/topbar.css';

export const TopBar = (): JSX.Element => {
    /* Leer devMode inyectado por PHP en GLORY_CONTEXT (Partial<GloryContext> del framework Glory) */
    const gloryCtx = (window as unknown as Record<string, Partial<GloryContext> | undefined>).GLORY_CONTEXT;
    const devModeActivo = gloryCtx?.devMode === true;

    const {
        tabs,
        activa,
        setActiva,
        usuario,
        autenticado,
        busqueda,
        manejarBusqueda,
        navegar,
        abrirCrear,
        abrirConfiguracion,
        abrirPlanes,
        modoPanelLateral,
        alternarMezclador,
        menuAbierto,
        setMenuAbierto,
        menuPos,
        notificacionesAbiertas,
        alternarNotificaciones,
        cerrarNotificaciones,
        mensajesAbiertos,
        alternarMensajes,
        cerrarMensajes,
        busquedaModalAbierta,
        setBusquedaModalAbierta,
        totalNotificacionesNoLeidas,
        etiquetaCreditos,
        placeholderBusqueda,
        manejarClickAvatar,
        islaActual,
    } = useTopBar();

    const {
        eliminarSampleActual,
        pedirConfirmacionBorrarTodos,
        cargando: cargandoEliminar,
    } = useEliminarSamples();

    const [hamburguesaAbierta, setHamburguesaAbierta] = useState(false);
    const [hamburguesaPos, setHamburguesaPos] = useState({ x: 0, y: 0 });

    const hamburguesaItems: MenuItemDef[] = [
        {
            id: 'hb-crear',
            etiqueta: 'Crear',
            icono: <Plus size={14} />,
            onClick: () => {
                abrirCrear();
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-mezclador',
            etiqueta: 'Mezclador',
            icono: <Music2 size={14} />,
            onClick: () => {
                alternarMezclador();
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-mensajes',
            etiqueta: 'Mensajes',
            icono: <Mail size={14} />,
            separadorDespues: false,
            onClick: () => {
                alternarMensajes();
                setHamburguesaAbierta(false);
            },
        },
    ];

    const esAdmin = usuario?.rol === 'admin';
    const mostrarHerramientasDev = esAdmin && devModeActivo;

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
            separadorDespues: !mostrarHerramientasDev,
            onClick: () => {
                abrirConfiguracion();
                setMenuAbierto(false);
            },
        },
        /* Herramientas de desarrollo — solo admin con devMode activo */
        ...(mostrarHerramientasDev ? [
            {
                id: 'devEliminarSample',
                etiqueta: cargandoEliminar ? 'Eliminando...' : '[DEV] Eliminar sample actual',
                icono: <Trash2 size={14} />,
                peligro: true,
                onClick: () => {
                    setMenuAbierto(false);
                    void eliminarSampleActual();
                },
            } as MenuItemDef,
            {
                id: 'devEliminarTodos',
                etiqueta: '[DEV] Borrar todos los samples',
                icono: <Trash size={14} />,
                peligro: true,
                separadorDespues: true,
                onClick: () => {
                    setMenuAbierto(false);
                    pedirConfirmacionBorrarTodos();
                },
            } as MenuItemDef,
        ] : []),
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
                    <BotonBase variante="ghost"
                        key={tab.id}
                        className={`topbarTab ${activa === tab.id ? 'topbarTabActiva' : ''}`}
                        tamano="ninguno"
                        onClick={() => setActiva(tab.id)}
                        type="button"
                    >
                        {tab.etiqueta}
                    </BotonBase>
                ))}
            </div>

            <div className="topbarBusqueda">
                <InputBusqueda
                    placeholder={placeholderBusqueda}
                    valor={busqueda}
                    onChange={manejarBusqueda}
                />
            </div>

            {autenticado && (
                <div className="topbarAcciones">
                    {/* Badge de plan — primero a la izquierda; oculto en móvil (hamburguesa) */}
                    <Badge
                        className="topbarAccionesBadge"
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
                        className="topbarBtnCrear"
                        onClick={() => abrirCrear()}
                        aria-label="Crear"
                    >
                        <Plus size={20} />
                    </BotonBase>

                    {/* C184: Botón mezclador */}
                    <BotonBase
                        variante="ghost"
                        tamano="md"
                        soloIcono
                        onClick={alternarMezclador}
                        aria-label="Mezclador"
                        className={`topbarBtnMezclador${modoPanelLateral === 'mezclador' ? ' topbarBotonActivo' : ''}`}
                    >
                        <Music2 size={18} />
                    </BotonBase>

                    <div className="topbarIconoWrapper">
                        <BotonBase
                            variante="ghost"
                            tamano="md"
                            soloIcono
                            onClick={alternarNotificaciones}
                            aria-label="Notificaciones"
                            className={totalNotificacionesNoLeidas > 0 ? 'topbarBotonNotificacionesPendientes' : ''}
                        >
                            <Bell size={18} />
                        </BotonBase>
                        {notificacionesAbiertas && (
                            <DropdownNotificaciones onCerrar={cerrarNotificaciones} />
                        )}
                    </div>

                    <div className="topbarIconoWrapper topbarIconoMensajes">
                        <BotonBase
                            variante="ghost"
                            tamano="md"
                            soloIcono
                            onClick={alternarMensajes}
                            aria-label="Mensajes"
                        >
                            <Mail size={18} />
                        </BotonBase>
                        {mensajesAbiertos && (
                            <DropdownMensajes onCerrar={cerrarMensajes} />
                        )}
                    </div>

                    {/* Hamburguesa — visible solo en móvil, agrupa crear/mezclador/mensajes */}
                    <BotonBase
                        variante="ghost"
                        tamano="md"
                        soloIcono
                        className="topbarHamburguesa"
                        onClick={(e) => {
                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                            setHamburguesaPos({ x: rect.right, y: rect.bottom });
                            setHamburguesaAbierta((prev) => !prev);
                        }}
                        aria-label="Más opciones"
                    >
                        <Menu size={20} />
                    </BotonBase>

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

                    {/* Menu hamburguesa móvil */}
                    <MenuContextual
                        abierto={hamburguesaAbierta}
                        onCerrar={() => setHamburguesaAbierta(false)}
                        items={hamburguesaItems}
                        x={hamburguesaPos.x}
                        y={hamburguesaPos.y}
                        alinearDerecha
                    />

                    <Modal
                        abierto={busquedaModalAbierta}
                        onCerrar={() => setBusquedaModalAbierta(false)}
                        tamano="pequeno"
                    >
                        <div className="topbarBusquedaModalContenido">
                            <InputBusqueda
                                placeholder={placeholderBusqueda}
                                valor={busqueda}
                                onChange={manejarBusqueda}
                                autoFocus
                            />
                            {/* S4.6: Enlace rápido a búsqueda de canciones si no estás en isla de canciones */}
                            {busqueda.trim().length >= 2
                                && islaActual !== 'ExplorarCancionesIsland'
                                && islaActual !== 'CancionDetalleIsland' && (
                            <BotonBase
                                    variante="ghost"
                                    tamano="ninguno"
                                    type="button"
                                    className="topbarEnlaceBusquedaCanciones"
                                    onClick={() => {
                                        setBusquedaModalAbierta(false);
                                        navegar(`/explorar/canciones?q=${encodeURIComponent(busqueda.trim())}`);
                                    }}
                                >
                                    <Music2 size={14} />
                                    Buscar canciones: &quot;{busqueda.trim()}&quot;
                                </BotonBase>
                            )}
                        </div>
                    </Modal>
                </div>
            )}
        </div>
    );
};

export default TopBar;
