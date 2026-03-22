/*
 * Componente: Sidebar
 * Navegación lateral mínima con iconos y tooltips.
 * Desktop: Comunidad, Musica, Inicio, Libreria, Coleccionados + config/reportar en footer.
 * Movil (QL16): Barra inferior con Inicio, Samples, Perfil(avatar), Mensajes, Notificaciones.
 * Musica/Libreria/Coleccionados se mueven al menu hamburguesa del TopBar en movil.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    Home,
    Users,
    Box,
    Download,
    Disc,
    Music,
    Settings,
    Bug,
    Bell,
    Mail,
    Dice5,
} from 'lucide-react';
import { useNavigationStore } from '@/core/router';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useReportarStore } from '@app/stores/reportarStore';
import { useAuthStore } from '@app/stores/authStore';
import { useNotificacionesStore } from '@app/stores/notificacionesStore';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { marcarTodasLeidas } from '@app/services/apiNotificaciones';
import { useEsMovil } from '@app/hooks/useEsMovil';
import { useRegistrarCapa } from '@app/hooks/useRegistrarCapa';
import { BotonBase } from '../ui/BotonBase';
import { LogoKamples } from '../ui/LogoKamples';
import { Avatar } from '../ui/Avatar';
import { DropdownNotificaciones } from '../ui/DropdownNotificaciones';
import { DropdownMensajes } from '../ui/DropdownMensajes';
import { useT } from '@app/utils/i18n';
import { useCancionAleatoria } from '@app/hooks/useCancionAleatoria';
import { ModalCancionAleatoria } from '@app/components/samples/ModalCancionAleatoria';
import '../../styles/componentes/sidebar.css';

export interface SidebarItemDef {
    id: string;
    etiqueta: string;
    icono: React.ReactNode;
    ruta: string;
    accion?: 'modal-crear';
}

/* QK104+QK105: Items desktop — Inicio centrado (posicion 3 de 5)
 * [183A-110-D] Blog removido del sidebar — ahora es tab en Inicio */
const itemsDesktop: SidebarItemDef[] = [
    { id: 'comunidad', etiqueta: 'nav.comunidad', icono: <Users size={20} />, ruta: '/comunidad' },
    { id: 'musica', etiqueta: 'topbar.musica', icono: <Music size={20} />, ruta: '/musica' },
    { id: 'inicio', etiqueta: 'nav.inicio', icono: <Home size={20} />, ruta: '/' },
    { id: 'libreria', etiqueta: 'topbar.libreria', icono: <Box size={20} />, ruta: '/libreria' },
    { id: 'descargas', etiqueta: 'topbar.coleccionados', icono: <Download size={20} />, ruta: '/descargas' },
];

/* QK104: Items movil — solo navegacion basica; perfil/mensajes/notificaciones se renderizan aparte (QL16) */
const itemsMovil: SidebarItemDef[] = [
    { id: 'inicio', etiqueta: 'nav.inicio', icono: <Home size={20} />, ruta: '/' },
    { id: 'samples', etiqueta: 'nav.samples', icono: <Disc size={20} />, ruta: '/samples' },
];

interface SidebarProps {
    activa?: string;
    items?: SidebarItemDef[];
    onNavegar?: (ruta: string) => void;
}

export const Sidebar = ({
    activa = 'inicio',
    items,
    onNavegar,
}: SidebarProps): JSX.Element => {
    const { t } = useT();
    const navegar = useNavigationStore(s => s.navegar);
    const abrirConfiguracion = useConfiguracionModalStore(s => s.abrir);
    const abrirReporte = useReportarStore(s => s.abrir);
    const esMovil = useEsMovil();
    const cancionAleatoria = useCancionAleatoria();

    /* QL16: Estado movil — dropdowns de mensajes y notificaciones en barra inferior */
    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const [notisAbiertas, setNotisAbiertas] = useState(false);
    const [msgsAbiertos, setMsgsAbiertos] = useState(false);

    /* QL17: Registrar dropdowns en el sistema de capas para que el boton atras los cierre */
    const cerrarNotis = useCallback(() => setNotisAbiertas(false), []);
    const cerrarMsgs = useCallback(() => setMsgsAbiertos(false), []);
    useRegistrarCapa('dropdownNotificaciones', notisAbiertas, cerrarNotis);
    useRegistrarCapa('dropdownMensajes', msgsAbiertos, cerrarMsgs);

    const totalNotisNoLeidas = useNotificacionesStore(s => s.totalNoLeidas());
    const totalMsgsNoLeidos = useMensajesStore(
        s => s.conversaciones.reduce((acc, c) => acc + c.noLeidos, 0)
    );
    const marcarTodasLeidasLocal = useNotificacionesStore(s => s.marcarTodasLeidasLocal);

    const alternarNotisMovil = useCallback(() => {
        setMsgsAbiertos(false);
        setNotisAbiertas(prev => !prev);
    }, []);

    /* Marcar leídas fuera del updater para evitar setState-during-render */
    useEffect(() => {
        if (notisAbiertas && totalNotisNoLeidas > 0) {
            marcarTodasLeidasLocal();
            void marcarTodasLeidas();
        }
    }, [notisAbiertas, totalNotisNoLeidas, marcarTodasLeidasLocal]);

    const alternarMsgsMovil = useCallback(() => {
        setNotisAbiertas(false);
        setMsgsAbiertos(prev => !prev);
    }, []);

    const traducirEtiqueta = useCallback((etiqueta: string) => (
        etiqueta.includes('.') ? t(etiqueta) : etiqueta
    ), [t]);

    const irA = (ruta: string) => (e: React.MouseEvent) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            onNavegar ? onNavegar(ruta) : navegar(ruta);
        }
    };

    /* QK104: Seleccionar items segun plataforma. Props custom tienen prioridad. */
    const itemsBase = items ?? (esMovil ? itemsMovil : itemsDesktop);

    /* QK101: Admin panel y favoritos removidos de la sidebar; se mueven al menu hamburguesa */
    const itemsFinales = itemsBase;

    /* QL16: Barra inferior movil — Inicio, Samples, Mensajes, Notificaciones, Perfil (QL17: perfil al final) */
    if (esMovil) {
        return (
            <div className="sidebar">
                <nav className="sidebarNav">
                    {itemsMovil.map(item => (
                        <a
                            key={item.id}
                            href={item.ruta || '/'}
                            className={`sidebarItem ${activa === item.id ? 'sidebarItemActivo' : ''}`}
                            data-tooltip={traducirEtiqueta(item.etiqueta)}
                            onClick={irA(item.ruta)}
                            aria-label={traducirEtiqueta(item.etiqueta)}
                        >
                            {item.icono}
                        </a>
                    ))}

                    {autenticado && (
                        <>
                            <div className="sidebarItemWrapper">
                                <BotonBase
                                    variante="ghost"
                                    className={`sidebarItem${totalMsgsNoLeidos > 0 ? ' sidebarItemConBadge' : ''}`}
                                    onClick={alternarMsgsMovil}
                                    type="button"
                                    aria-label={t('config.notif.mensajes')}
                                >
                                    <Mail size={20} />
                                    {totalMsgsNoLeidos > 0 && <span className="sidebarBadge" />}
                                </BotonBase>
                                {msgsAbiertos && <DropdownMensajes onCerrar={() => setMsgsAbiertos(false)} />}
                            </div>

                            <div className="sidebarItemWrapper">
                                <BotonBase
                                    variante="ghost"
                                    className={`sidebarItem${totalNotisNoLeidas > 0 ? ' sidebarItemConBadge' : ''}`}
                                    onClick={alternarNotisMovil}
                                    type="button"
                                    aria-label={t('config.notificaciones')}
                                >
                                    <Bell size={20} />
                                    {totalNotisNoLeidas > 0 && <span className="sidebarBadge" />}
                                </BotonBase>
                                {notisAbiertas && <DropdownNotificaciones onCerrar={() => setNotisAbiertas(false)} />}
                            </div>

                            <a
                                href={`/perfil/${usuario?.username}/`}
                                className={`sidebarItem ${activa === 'perfil' ? 'sidebarItemActivo' : ''}`}
                                onClick={irA(`/perfil/${usuario?.username}/`)}
                                aria-label={t('config.perfil')}
                            >
                                <Avatar
                                    src={usuario?.avatarUrl ?? null}
                                    nombre={usuario?.nombreVisible ?? ''}
                                    tamano="xs"
                                />
                            </a>
                        </>
                    )}
                </nav>
            </div>
        );
    }

    return (
        <>
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
                                data-tooltip={traducirEtiqueta(item.etiqueta)}
                                onClick={() => {
                                    onNavegar ? onNavegar(item.ruta) : navegar(item.ruta);
                                }}
                                type="button"
                                aria-label={traducirEtiqueta(item.etiqueta)}
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
                            data-tooltip={traducirEtiqueta(item.etiqueta)}
                            onClick={irA(item.ruta)}
                            aria-label={traducirEtiqueta(item.etiqueta)}
                        >
                            {item.icono}
                        </a>
                    );
                })}
            </nav>

            <div className="sidebarFooter">
                <div className="sidebarSeparador" />
                {/* [223A-4] Botón descubrimiento canción aleatoria */}
                <BotonBase variante="ghost"
                    className="sidebarItem"
                    data-tooltip="Descubrir canción"
                    onClick={() => cancionAleatoria.abrir()}
                    type="button"
                    aria-label="Descubrir canción aleatoria"
                >
                    <Dice5 size={20} />
                </BotonBase>
                <BotonBase variante="ghost"
                    className="sidebarItem"
                    data-tooltip="Reportar error"
                    onClick={() => abrirReporte('error_plataforma')}
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
        <ModalCancionAleatoria ctrl={cancionAleatoria} />
        </>
    );
};

export default Sidebar;
