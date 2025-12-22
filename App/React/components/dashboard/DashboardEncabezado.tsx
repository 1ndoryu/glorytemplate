/*
 * DashboardEncabezado
 * Componente del header del dashboard
 * Responsabilidad única: mostrar logo, título y navegación
 */

import {Shield, Settings, LayoutGrid} from 'lucide-react';
import {IndicadorSincronizacion, IndicadorPlan} from '../shared';
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
    sincronizacion?: SincronizacionInfo;
    suscripcion?: InfoSuscripcion | null;
    esAdmin?: boolean;
    onClickPlan?: () => void;
    onClickSeguridad?: () => void;
    onClickAdmin?: () => void;
    onClickLayout?: () => void;
}

export function DashboardEncabezado({titulo = 'DASHBOARD_01', version = 'v1.0.0-beta', usuario = 'user@admin', sincronizacion, suscripcion, esAdmin = false, onClickPlan, onClickSeguridad, onClickAdmin, onClickLayout}: DashboardEncabezadoProps): JSX.Element {
    const estaConectado = sincronizacion?.estaLogueado ?? false;

    return (
        <header id="dashboard-encabezado" className="dashboardEncabezado">
            <div className="encabezadoLogo">
                <div className="encabezadoIndicador"></div>
                <span className="encabezadoTitulo">{titulo}</span>
                {esAdmin && onClickAdmin && (
                    <button type="button" className="badgeEncabezado badgeEncabezado--admin" onClick={onClickAdmin} title="Panel de Administración">
                        <Settings size={12} />
                        ADMIN
                    </button>
                )}
            </div>
            <nav className="encabezadoNav">
                {suscripcion && <IndicadorPlan suscripcion={suscripcion} onClick={onClickPlan} />}
                {onClickSeguridad && estaConectado && (
                    <button type="button" className="botonSeguridad" onClick={onClickSeguridad} title="Seguridad y Privacidad">
                        <Shield size={14} />
                    </button>
                )}
                {onClickLayout && (
                    <button type="button" className="botonLayout" onClick={onClickLayout} title="Configurar Layout">
                        <LayoutGrid size={14} />
                    </button>
                )}
                <span className="badgeEncabezado">{version}</span>
                <span className={`estadoConexion ${estaConectado ? 'estadoConexion--conectado' : 'estadoConexion--local'}`}>
                    <span className="estadoConexion__punto"></span>
                    {estaConectado ? 'Conectado' : 'Local'}
                </span>
                {sincronizacion && <IndicadorSincronizacion sincronizado={sincronizacion.sincronizado} pendiente={sincronizacion.pendiente} error={sincronizacion.error} estaLogueado={sincronizacion.estaLogueado} onSincronizar={sincronizacion.sincronizarAhora} onLogin={sincronizacion.onLogin} onLogout={sincronizacion.onLogout} />}
                {estaConectado && <span className="badgeEncabezado badgeEncabezado--usuario">{usuario}</span>}
            </nav>
        </header>
    );
}
