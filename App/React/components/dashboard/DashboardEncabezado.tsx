/*
 * DashboardEncabezado
 * Componente del header del dashboard
 * Responsabilidad única: mostrar logo, título y navegación
 */

import {useState} from 'react';
import {Settings, LayoutGrid, Wifi, WifiOff, RefreshCw, User, LogOut, AlertTriangle, Shield, ClipboardList, Crown, Users} from 'lucide-react';
import {IndicadorPlan, MenuContextual} from '../shared';
import type {InfoSuscripcion} from '../../types/dashboard';

interface SincronizacionInfo {
    sincronizado: boolean;
    pendiente: boolean;
    error: string | null;
    estaLogueado: boolean;
    sincronizarAhora: () => Promise<void>;
    onLogin?: () => void;
    onLogout?: () => void;
}

interface DashboardEncabezadoProps {
    titulo?: string;
    version?: string;
    usuario?: string;
    avatarUrl?: string;
    sincronizacion?: SincronizacionInfo;
    suscripcion?: InfoSuscripcion | null;
    esAdmin?: boolean;
    equiposPendientes?: number;
    onClickPlan?: () => void;
    onClickSeguridad?: () => void;
    onClickAdmin?: () => void;
    onClickLayout?: () => void;
    onClickVersion?: () => void;
    onClickUsuario?: () => void;
    onClickEquipos?: () => void;
}

interface MenuUsuarioState {
    visible: boolean;
    x: number;
    y: number;
}

export function DashboardEncabezado({titulo = 'DASHBOARD_01', version = 'v1.0.1-beta', usuario = 'user@admin', avatarUrl, sincronizacion, suscripcion, esAdmin = false, equiposPendientes = 0, onClickPlan, onClickSeguridad, onClickAdmin, onClickLayout, onClickVersion, onClickUsuario, onClickEquipos}: DashboardEncabezadoProps): JSX.Element {
    const estaConectado = sincronizacion?.estaLogueado ?? false;
    const [menuUsuario, setMenuUsuario] = useState<MenuUsuarioState>({visible: false, x: 0, y: 0});

    /* Determinar si mostrar badge de plan en header (solo FREE y TRIAL) */
    const esPremiumActivo = suscripcion?.plan === 'premium' && suscripcion?.estado === 'activa';
    const mostrarBadgePlanEnHeader = suscripcion && !esPremiumActivo;

    /* Opciones del menu contextual del usuario */
    const opcionesMenuUsuario = [{id: 'perfil', etiqueta: 'Mi Perfil', icono: <User size={12} />}, {id: 'seguridad', etiqueta: 'Seguridad', icono: <Shield size={12} />}, ...(esPremiumActivo ? [{id: 'plan', etiqueta: 'Plan Premium', icono: <Crown size={12} />}] : []), {id: 'version', etiqueta: `Versión ${version}`, icono: <ClipboardList size={12} />, separadorDespues: true}, {id: 'logout', etiqueta: 'Cerrar Sesión', icono: <LogOut size={12} />, peligroso: true}];

    const manejarClickUsuario = (evento: React.MouseEvent) => {
        evento.preventDefault();
        const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuUsuario({
            visible: true,
            x: rect.right - 160,
            y: rect.bottom + 4
        });
    };

    const manejarOpcionMenu = (opcionId: string) => {
        switch (opcionId) {
            case 'perfil':
                onClickUsuario?.();
                break;
            case 'seguridad':
                onClickSeguridad?.();
                break;
            case 'version':
                onClickVersion?.();
                break;
            case 'plan':
                onClickPlan?.();
                break;
            case 'logout':
                sincronizacion?.onLogout?.();
                break;
        }
    };

    /* Determinar icono y estado del indicador de conexion/sync */
    const obtenerEstadoConexion = () => {
        if (!estaConectado) {
            return {
                icono: <WifiOff size={14} />,
                clase: 'estadoConexionIcono--desconectado',
                titulo: 'Modo local - Click para iniciar sesión',
                onClick: sincronizacion?.onLogin
            };
        }

        if (sincronizacion?.error) {
            return {
                icono: <AlertTriangle size={14} />,
                clase: 'estadoConexionIcono--error',
                titulo: `Error: ${sincronizacion.error}. Click para reintentar.`,
                onClick: sincronizacion.sincronizarAhora
            };
        }

        if (sincronizacion?.pendiente || !sincronizacion?.sincronizado) {
            return {
                icono: <RefreshCw size={14} className="iconoGirando" />,
                clase: 'estadoConexionIcono--sincronizando',
                titulo: 'Sincronizando...',
                onClick: undefined
            };
        }

        return {
            icono: <Wifi size={14} />,
            clase: 'estadoConexionIcono--conectado',
            titulo: 'Conectado y sincronizado',
            onClick: undefined
        };
    };

    const estadoConexion = obtenerEstadoConexion();

    return (
        <header id="dashboard-encabezado" className="dashboardEncabezado">
            <div className="encabezadoLogo">
                <div className="encabezadoIndicador"></div>
                <span className="encabezadoTitulo">{titulo}</span>
                {esAdmin && onClickAdmin && (
                    <button type="button" className="botonIconoEncabezado botonIconoEncabezado--admin" onClick={onClickAdmin} title="Panel de Administración">
                        <Settings size={14} />
                    </button>
                )}
            </div>
            <nav className="encabezadoNav">
                {/* Indicador de Plan - Solo para FREE y TRIAL */}
                {mostrarBadgePlanEnHeader && <IndicadorPlan suscripcion={suscripcion} onClick={onClickPlan} />}

                {/* Configurar Layout */}
                {onClickLayout && (
                    <button type="button" className="botonIconoEncabezado" onClick={onClickLayout} title="Configurar Layout">
                        <LayoutGrid size={14} />
                    </button>
                )}

                {/* Mi Equipo (Social) */}
                {onClickEquipos && estaConectado && (
                    <button type="button" className="botonIconoEncabezado botonIconoEncabezado--equipo" onClick={onClickEquipos} title="Mi Equipo">
                        <Users size={14} />
                        {equiposPendientes > 0 && <span className="botonIconoEncabezado__contador">{equiposPendientes}</span>}
                    </button>
                )}

                {/* Estado de conexion/sincronizacion unificado */}
                {estadoConexion.onClick ? (
                    <button type="button" className={`estadoConexionIcono ${estadoConexion.clase}`} title={estadoConexion.titulo} onClick={estadoConexion.onClick}>
                        {estadoConexion.icono}
                    </button>
                ) : (
                    <span className={`estadoConexionIcono ${estadoConexion.clase}`} title={estadoConexion.titulo}>
                        {estadoConexion.icono}
                    </span>
                )}

                {/* Usuario con menu contextual */}
                {estaConectado && (
                    <button type="button" className="badgeEncabezado badgeEncabezado--usuario" onClick={manejarClickUsuario} title="Opciones de usuario">
                        {avatarUrl ? <img src={avatarUrl} alt="" className="avatarEncabezado" /> : <span className="avatarEncabezadoInicial">{usuario.charAt(0).toUpperCase()}</span>}
                        <span className="nombreUsuarioEncabezado">{usuario}</span>
                    </button>
                )}

                {/* Menu contextual del usuario */}
                {menuUsuario.visible && <MenuContextual opciones={opcionesMenuUsuario} posicionX={menuUsuario.x} posicionY={menuUsuario.y} onSeleccionar={manejarOpcionMenu} onCerrar={() => setMenuUsuario({...menuUsuario, visible: false})} />}
            </nav>
        </header>
    );
}
