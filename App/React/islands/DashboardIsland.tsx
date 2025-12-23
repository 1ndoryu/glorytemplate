/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Refactorizado: Lógica dividida en subcomponentes y hook de composición
 */

import {useEffect} from 'react';
import {DashboardEncabezado, DashboardFooter, DashboardGrid, DashboardModales} from '../components/dashboard';
import {useDashboardCompleto} from '../hooks/useDashboardCompleto';

import '../styles/dashboard/componentes/experimentos.css';

interface DashboardIslandProps {
    titulo?: string;
    version?: string;
    usuario?: string;
}

function IndicadorCarga({texto = 'Cargando datos...'}: {texto?: string}): JSX.Element {
    return (
        <div id="dashboard-cargando" className="dashboardCargando">
            <div className="cargandoIndicador">
                <div className="cargandoSpinner" />
                <span className="cargandoTexto">{texto}</span>
            </div>
            <div className="cargandoBarraProgreso">
                <div className="cargandoBarraRelleno" />
            </div>
        </div>
    );
}

export function DashboardIsland({titulo = 'DASHBOARD_01', version = 'v1.0.2-beta', usuario = 'user@admin'}: DashboardIslandProps): JSX.Element {
    const ctx = useDashboardCompleto();
    const {dashboard, auth, suscripcion, esAdmin, modales, equipos, notificaciones, acciones} = ctx;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) auth.handleCallback(code);
    }, [auth.handleCallback]);

    if (auth.loading && !modales.modalLoginAbierto) {
        return <IndicadorCarga texto="Autenticando..." />;
    }

    return (
        <div id="dashboard-contenedor" className="dashboardContenedor">
            <DashboardEncabezado
                titulo={titulo}
                version={version}
                usuario={auth.user ? auth.user.name : usuario}
                avatarUrl={auth.user?.avatarUrl}
                sincronizacion={{
                    ...dashboard.sincronizacion,
                    onLogin: modales.abrirModalLogin,
                    onLogout: auth.logout,
                    estaLogueado: !!auth.user
                }}
                suscripcion={suscripcion}
                esAdmin={esAdmin}
                equiposPendientes={equipos.pendientes}
                notificacionesPendientes={notificaciones.noLeidas}
                onClickPlan={modales.abrirModalUpgrade}
                onClickSeguridad={modales.abrirPanelSeguridad}
                onClickAdmin={modales.abrirPanelAdmin}
                onClickLayout={modales.abrirModalConfigLayout}
                onClickVersion={modales.abrirModalVersiones}
                onClickUsuario={modales.abrirModalPerfil}
                onClickEquipos={modales.abrirModalEquipos}
                onClickNotificaciones={acciones.manejarClickNotificaciones}
                onClickExperimentos={esAdmin ? modales.abrirModalExperimentos : undefined}
                onExportarDatos={dashboard.exportarTodosDatos}
                onImportarDatos={dashboard.importarTodosDatos}
            />

            {dashboard.cargandoDatos ? <IndicadorCarga /> : <DashboardGrid ctx={ctx} />}

            <DashboardFooter />
            <DashboardModales ctx={ctx} />
        </div>
    );
}

export default DashboardIsland;
