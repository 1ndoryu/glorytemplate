/* sentinel-disable-file limite-lineas — TopBar es componente central de layout con menús
 * contextuales (avatar, hamburguesa, crear), dropdowns (notificaciones, mensajes, búsqueda),
 * tabs dinámicas y lógica condicional admin/dev. Los arrays de MenuItemDef ocupan espacio
 * pero deben vivir cerca de su punto de uso para legibilidad. */

/*
 * Componente: TopBar
 * Barra superior con tabs dinámicas, búsqueda global, notificaciones, mensajes y avatar.
 * Las tabs se establecen desde cada isla via useTabsTopBarStore.
 * El avatar abre un menú contextual (perfil, config, cerrar sesión).
 */

import { useState } from 'react';
import { Bell, Mail, User, Settings, LogOut, Plus, Crown, Sparkles, Search, Download, Music, Music2, Trash2, Trash, Menu, MessageCircle, Heart, ShieldCheck, Box, BookOpen, Activity, Monitor, Smartphone } from 'lucide-react';
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
import { limpiarStoresUsuario } from '@app/hooks/useAuth';
import { useNavigationStore } from '@/core/router/navigationStore';
import { Modal } from '../ui/Modal';
import { useTopBar } from '@app/hooks/useTopBar';
import { useBusquedaRapida } from '@app/hooks/useBusquedaRapida';
import { useEliminarSamples } from '@app/hooks/useEliminarSamples';
import { useSolicitudWhatsappStore } from '@app/stores/solicitudWhatsappStore';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { useAlgoTimingStore } from '@app/stores/algoTimingStore';
import { useVersionStore } from '@app/stores/versionStore';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/topbar.css';
/* [183A-111] TopBar migrado a i18n: hamburguesaItems, menuItems, aria-labels via t() */

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

    /* [183A-109] Menu contextual del botón "+" — elegir entre publicación y artículo.
     * Estado combinado en un solo useState para cumplir max 3 useState por componente. */
    const [crearMenu, setCrearMenu] = useState({ abierto: false, x: 0, y: 0 });

    const esAdmin = usuario?.rol === 'admin';
    const mostrarHerramientasDev = esAdmin && devModeActivo;
    const { t } = useT();

    /* [Tarea Final] Versiones disponibles para los botones de descarga */
    const versionesWindows = useVersionStore(s => s.versions.windows);
    const versionesApk = useVersionStore(s => s.versions.apk);
    const etiquetaTab = (etiqueta: string) => (etiqueta.includes('.') ? t(etiqueta) : etiqueta);

    const hamburguesaItems: MenuItemDef[] = [
        {
            id: 'hb-crear',
            etiqueta: t('topbar.crearPublicacion'),
            icono: <Plus size={14} />,
            onClick: () => {
                abrirCrear();
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-crear-articulo',
            etiqueta: t('topbar.escribirArticulo'),
            icono: <BookOpen size={14} />,
            onClick: () => {
                useArticuloEditorStore.getState().abrir();
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-mezclador',
            etiqueta: t('topbar.mezclador'),
            icono: <Music2 size={14} />,
            onClick: () => {
                alternarMezclador();
                setHamburguesaAbierta(false);
            },
        },
        /* QL16: Musica, Libreria, Coleccionados movidos aqui desde la barra inferior */
        {
            id: 'hb-musica',
            etiqueta: t('topbar.musica'),
            icono: <Music size={14} />,
            onClick: () => {
                navegar('/musica');
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-libreria',
            etiqueta: t('topbar.libreria'),
            icono: <Box size={14} />,
            onClick: () => {
                navegar('/libreria');
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-coleccionados',
            etiqueta: t('topbar.coleccionados'),
            icono: <Download size={14} />,
            onClick: () => {
                navegar('/descargas');
                setHamburguesaAbierta(false);
            },
        },
        /* QK101: Favoritos movido de sidebar al menu hamburguesa */
        {
            id: 'hb-favoritos',
            etiqueta: t('topbar.favoritos'),
            icono: <Heart size={14} />,
            onClick: () => {
                navegar('/favoritos');
                setHamburguesaAbierta(false);
            },
        },
        /* QK101: Admin panel movido de sidebar al menu hamburguesa */
        ...(esAdmin ? [{
            id: 'hb-admin',
            etiqueta: t('topbar.adminPanel'),
            icono: <ShieldCheck size={14} />,
            onClick: () => {
                navegar('/admin/panel');
                setHamburguesaAbierta(false);
            },
        } as MenuItemDef] : []),
        /* QL46: Items de sesión — en móvil el avatar navega a perfil, no abre dropdown.
         * Configuración, WhatsApp y cerrar sesión deben estar accesibles aquí. */
        {
            id: 'hb-configuracion',
            etiqueta: t('topbar.configuracion'),
            icono: <Settings size={14} />,
            separadorDespues: true,
            onClick: () => {
                abrirConfiguracion();
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-whatsapp',
            etiqueta: t('topbar.grupoWhatsApp'),
            icono: <MessageCircle size={14} />,
            onClick: () => {
                useSolicitudWhatsappStore.getState().abrir();
                setHamburguesaAbierta(false);
            },
        },
        {
            id: 'hb-cerrarSesion',
            etiqueta: t('topbar.cerrarSesion'),
            icono: <LogOut size={14} />,
            peligro: true,
            onClick: async () => {
                setHamburguesaAbierta(false);
                await apiCerrarSesion();
                const esDesktop = !!(window as unknown as Record<string, unknown>).__KAMPLES_DESKTOP__;
                if (esDesktop) {
                    try {
                        const modPath = '@desktop' + '/services/authDesktopService';
                        const m = await import(/* @vite-ignore */ modPath);
                        await m.cerrarSesionDesktop();
                    } catch { /* En web no existe el modulo */ }
                }
                useAuthStore.getState().cerrarSesion();
                limpiarStoresUsuario();
                if (esDesktop) {
                    useNavigationStore.getState().navegar('/');
                } else {
                    window.location.href = '/';
                }
            },
        },
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
            etiqueta: t('topbar.verPerfil'),
            icono: <User size={14} />,
            href: `/perfil/${usuario?.username}/`,
            onClick: () => {
                navegar(`/perfil/${usuario?.username}/`);
                setMenuAbierto(false);
            },
        },
        {
            id: 'configuracion',
            etiqueta: t('topbar.configuracion'),
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
                etiqueta: cargandoEliminar ? t('topbar.eliminando') : '[DEV] Eliminar sample actual',
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
        /* [2003A-3] Botón de métricas del algoritmo — solo admin con toggle "Logs de rendimiento" activo */
        ...(esAdmin && typeof window !== 'undefined' && localStorage.getItem('kamples_debug_timing') === '1' ? [
            {
                id: 'algoTiming',
                etiqueta: 'Rendimiento algoritmo',
                icono: <Activity size={14} />,
                separadorDespues: true,
                onClick: () => {
                    setMenuAbierto(false);
                    useAlgoTimingStore.getState().abrir();
                },
            } as MenuItemDef,
        ] : []),
        {
            id: 'whatsapp',
            etiqueta: t('topbar.grupoWhatsApp'),
            icono: <MessageCircle size={14} />,
            separadorDespues: true,
            onClick: () => {
                useSolicitudWhatsappStore.getState().abrir();
                setMenuAbierto(false);
            },
        },
        /* [Tarea Final] Botones de descarga de apps nativas — URLs desde kamples-sync/versions.json */
        {
            id: 'descargarWindows',
            etiqueta: versionesWindows?.version
                ? `${t('topbar.descargarWindows')} v${versionesWindows.version}`
                : t('topbar.descargarWindows'),
            icono: <Monitor size={14} />,
            onClick: () => {
                if (versionesWindows?.url) window.open(versionesWindows.url, '_blank', 'noopener');
                setMenuAbierto(false);
            },
        },
        {
            id: 'descargarApk',
            etiqueta: versionesApk?.version
                ? `${t('topbar.descargarApk')} v${versionesApk.version}`
                : t('topbar.descargarApk'),
            icono: <Smartphone size={14} />,
            onClick: () => {
                if (versionesApk?.url) window.open(versionesApk.url, '_blank', 'noopener');
                setMenuAbierto(false);
            },
        },
        {
            id: 'cerrarSesion',
            etiqueta: t('topbar.cerrarSesion'),
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
                limpiarStoresUsuario();

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
                    aria-label={t('topbar.masOpciones')}
                >
                    <Menu size={20} />
                </BotonBase>
            </div>

            {/* QL10: Mobile — logo Kamples centrado. QL85: clickeable para ir al inicio */}
            <div className="topbarLogoMovil" onClick={() => useNavigationStore.getState().navegar('/')} role="button" tabIndex={0}>
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
                        title={etiquetaTab(tab.etiqueta)}
                    >
                        {tab.icono && <span className="topbarTabIcono">{tab.icono}</span>}
                        {!tab.icono && etiquetaTab(tab.etiqueta)}
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
                        onClick={(e) => {
                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                            setCrearMenu(prev => ({
                                abierto: !prev.abierto,
                                x: rect.right,
                                y: rect.bottom,
                            }));
                        }}
                        aria-label="Crear"
                    >
                        <Plus size={20} />
                    </BotonBase>

                    {/* [183A-109] Menu contextual "Crear": publicación o artículo */}
                    <MenuContextual
                        abierto={crearMenu.abierto}
                        onCerrar={() => setCrearMenu(prev => ({ ...prev, abierto: false }))}
                        items={[
                            {
                                id: 'crear-publicacion',
                                etiqueta: t('topbar.publicacion'),
                                icono: <Plus size={14} />,
                                onClick: () => {
                                    abrirCrear();
                                    setCrearMenu(prev => ({ ...prev, abierto: false }));
                                },
                            },
                            {
                                id: 'crear-articulo',
                                etiqueta: t('topbar.escribirArticulo'),
                                icono: <BookOpen size={14} />,
                                onClick: () => {
                                    useArticuloEditorStore.getState().abrir();
                                    setCrearMenu(prev => ({ ...prev, abierto: false }));
                                },
                            },
                        ]}
                        x={crearMenu.x}
                        y={crearMenu.y}
                        alinearDerecha
                    />

                    {/* C184: Botón mezclador */}
                    <BotonBase
                        variante="ghost"
                        tamano="md"
                        soloIcono
                        onClick={alternarMezclador}
                        aria-label={t('topbar.mezclador')}
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
                            aria-label={t('topbar.adminPanel')}
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
                                    {t('topbar.buscarCanciones', { q: busqueda.trim() })}
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
