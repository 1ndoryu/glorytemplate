/* sentinel-disable-file limite-lineas — barra de navegacion cohesiva: tabs + busqueda + notificaciones + avatar, apenas sobre limite */
/*
 * Componente: TopBar
 * Barra superior con tabs dinámicas, búsqueda global, notificaciones, mensajes y avatar.
 * Las tabs se establecen desde cada isla via useTabsTopBarStore.
 * El avatar abre un menú contextual (perfil, config, cerrar sesión).
 */

import { useState } from 'react';
import { Bell, Mail, User, Settings, LogOut, Plus, Crown, Sparkles, Search, Download, Music, Music2, Trash2, Trash, Menu, MessageCircle, Heart, ShieldCheck, Box } from 'lucide-react';
import { InputBusqueda } from '../ui/InputBusqueda';
import { ResultadosBusquedaRapidaDropdown } from '../ui/ResultadosBusquedaRapida';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { Avatar } from '../ui/Avatar';
import { MenuContextual, type MenuItemDef } from '../ui/MenuContextual';
import { DropdownNotificaciones } from '../ui/DropdownNotificaciones';
import { DropdownMensajes } from '../ui/DropdownMensajes';
import { LogoKamples } from '../ui/LogoKamples';
import { cerrarSesion as apiCerrarSesion } from '@app/services/apiAuth';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router/navigationStore';
import { Modal } from '../ui/Modal';
import { useTopBar } from '@app/hooks/useTopBar';
import { useBusquedaRapida } from '@app/hooks/useBusquedaRapida';
import { useEliminarSamples } from '@app/hooks/useEliminarSamples';
import { useSolicitudWhatsappStore } from '@app/stores/solicitudWhatsappStore';
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
        totalMensajesNoLeidos,
        etiquetaCreditos,
        placeholderBusqueda,
        manejarClickAvatar,
        islaActual,
    } = useTopBar();

    const {
        resultados: resultadosBusqueda,
        cargando: cargandoBusqueda,
        visible: busquedaRapidaVisible,
        cerrar: cerrarBusquedaRapida,
    } = useBusquedaRapida(busqueda);

    const {
        eliminarSampleActual,
        pedirConfirmacionBorrarTodos,
        cargando: cargandoEliminar,
    } = useEliminarSamples();

    const [hamburguesaAbierta, setHamburguesaAbierta] = useState(false);
    const [hamburguesaPos, setHamburguesaPos] = useState({ x: 0, y: 0 });

    const esAdmin = usuario?.rol === 'admin';
    const mostrarHerramientasDev = esAdmin && devModeActivo;

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
        /* QL16: Musica, Libreria, Coleccionados movidos aqui desde la barra inferior */
        {
            id: 'hb-musica',
            etiqueta: 'Música',
            icono: <Music size={14} />,
            onClick: () => {
                navegar('/musica');
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-libreria',
            etiqueta: 'Librería',
            icono: <Box size={14} />,
            onClick: () => {
                navegar('/libreria');
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-coleccionados',
            etiqueta: 'Coleccionados',
            icono: <Download size={14} />,
            onClick: () => {
                navegar('/descargas');
                setHamburguesaAbierta(false);
            },
        },
        /* QK101: Favoritos movido de sidebar al menu hamburguesa */
        {
            id: 'hb-favoritos',
            etiqueta: 'Favoritos',
            icono: <Heart size={14} />,
            onClick: () => {
                navegar('/favoritos');
                setHamburguesaAbierta(false);
            },
        },
        /* QK101: Admin panel movido de sidebar al menu hamburguesa */
        ...(esAdmin ? [{
            id: 'hb-admin',
            etiqueta: 'Admin Panel',
            icono: <ShieldCheck size={14} />,
            onClick: () => {
                navegar('/admin/panel');
                setHamburguesaAbierta(false);
            },
        } as MenuItemDef] : []),
    ];

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
            id: 'whatsapp',
            etiqueta: 'Grupo de WhatsApp',
            icono: <MessageCircle size={14} />,
            separadorDespues: true,
            onClick: () => {
                useSolicitudWhatsappStore.getState().abrir();
                setMenuAbierto(false);
            },
        },
        {
            id: 'cerrarSesion',
            etiqueta: 'Cerrar sesión',
            icono: <LogOut size={14} />,
            peligro: true,
            onClick: async () => {
                /*
                 * QQ141: Orden critico — cerrar sesion WP ANTES de limpiar JWT.
                 * Sin esto, apiCerrarSesion() va sin Authorization header y el server
                 * no puede destruir la sesion WP, dejando cookies activas en el webview.
                 */
                await apiCerrarSesion();

                const esDesktop = !!(window as unknown as Record<string, unknown>).__KAMPLES_DESKTOP__;
                if (esDesktop) {
                    try {
                        const modPath = '@desktop' + '/services/authDesktopService';
                        const m = await import(/* @vite-ignore */ modPath);
                        await m.cerrarSesionDesktop();
                    } catch {
                        /* En web no existe el modulo — ignorar */
                    }
                }

                useAuthStore.getState().cerrarSesion();

                if (esDesktop) {
                    /* SPA navigation: evita reload que re-lee cookies WP del webview */
                    useNavigationStore.getState().navegar('/');
                } else {
                    /* Web: recarga completa para invalidar nonces WP y estado React */
                    window.location.href = '/';
                }
            },
        },
    ];

    return (
        <div className="topbar">
            {/* QL10: Mobile — hamburguesa a la izquierda */}
            <div className="topbarMovilIzquierda">
                <BotonBase
                    variante="ghost"
                    tamano="md"
                    soloIcono
                    onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setHamburguesaPos({ x: rect.left, y: rect.bottom });
                        setHamburguesaAbierta((prev) => !prev);
                    }}
                    aria-label="Más opciones"
                >
                    <Menu size={20} />
                </BotonBase>
            </div>

            {/* QL10: Mobile — logo Kamples centrado */}
            <div className="topbarLogoMovil">
                <LogoKamples tamano={22} />
            </div>

            {/* Tabs dinámicas (definidas por cada isla) — ocultas en movil via CSS */}
            <div className="topbarTabs">
                {tabs.map((tab) => (
                    <BotonBase variante="ghost"
                        key={tab.id}
                        className={`topbarTab ${activa === tab.id ? 'topbarTabActiva' : ''}`}
                        tamano="ninguno"
                        onClick={() => setActiva(tab.id)}
                        type="button"
                        title={tab.etiqueta}
                    >
                        {tab.icono && <span className="topbarTabIcono">{tab.icono}</span>}
                        {!tab.icono && tab.etiqueta}
                    </BotonBase>
                ))}
            </div>

            {/* Ocultar buscador en AdminPanelIsland */}
            {islaActual !== 'AdminPanelIsland' ? (
                <div className="topbarBusqueda topbarBusquedaConDropdown">
                    <InputBusqueda
                        placeholder={placeholderBusqueda}
                        valor={busqueda}
                        onChange={manejarBusqueda}
                    />
                    <ResultadosBusquedaRapidaDropdown
                        resultados={resultadosBusqueda}
                        cargando={cargandoBusqueda}
                        visible={busquedaRapidaVisible}
                        onCerrar={cerrarBusquedaRapida}
                    />
                </div>
            ) : (
                <div className="topbarBusquedaOcculta"></div>
            )}

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

                    {islaActual !== 'AdminPanelIsland' && (
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
                    )}

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

                    {/* QK105: Admin panel visible en desktop, al lado del mezclador */}
                    {esAdmin && (
                        <BotonBase
                            variante="ghost"
                            tamano="md"
                            soloIcono
                            onClick={() => navegar('/admin/panel')}
                            aria-label="Admin Panel"
                            className="topbarBtnAdmin"
                        >
                            <ShieldCheck size={18} />
                        </BotonBase>
                    )}

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
                            className={totalMensajesNoLeidos > 0 ? 'topbarBotonNotificacionesPendientes' : ''}
                        >
                            <Mail size={18} />
                        </BotonBase>
                        {mensajesAbiertos && (
                            <DropdownMensajes onCerrar={cerrarMensajes} />
                        )}
                    </div>

                    {/* QL10: Hamburguesa movida a topbarMovilIzquierda */}

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

                    {/* Menu hamburguesa móvil — QL10: posicionado desde la izquierda */}
                    <MenuContextual
                        abierto={hamburguesaAbierta}
                        onCerrar={() => setHamburguesaAbierta(false)}
                        items={hamburguesaItems}
                        x={hamburguesaPos.x}
                        y={hamburguesaPos.y}
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
                            {/* Resultados rápidos dentro del modal móvil */}
                            <ResultadosBusquedaRapidaDropdown
                                resultados={resultadosBusqueda}
                                cargando={cargandoBusqueda}
                                visible={busquedaRapidaVisible}
                                onCerrar={() => {
                                    cerrarBusquedaRapida();
                                    setBusquedaModalAbierta(false);
                                }}
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
