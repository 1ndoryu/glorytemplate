/*
 * DashboardIsland
 * sentinel-disable-file limite-lineas — Componente orquestador principal de composición.
 * Refactorizado: Lógica dividida en subcomponentes y hook de composición
 * Fase 10.8.3: Integración de opciones móvil en el header
 * TAREA 1: Integración de useBackButtonCapacitor para manejo de botón back en APK
 */

import {useEffect, useMemo, useState, useCallback} from 'react';

/* Importar store de configuración temprano para inicializar horaFinDia antes que otros módulos */
import '../stores/configuracionUsuarioStore';

import {DashboardEncabezado, DashboardFooter, DashboardGrid, DashboardModales, SidebarMenu, DashboardSidebarGrid} from '../components/dashboard';
import {useDashboardCompleto} from '../hooks/useDashboardCompleto';
import {VERSION_ACTUAL} from '../data/changelog';
import {Landing} from '../components/landing/Landing';
import {NavegacionInferior} from '../components/shared';
import {DockTracking} from '../components/shared/DockTracking';

import {useEsMovil} from '../hooks/useEsMovil';
import {usePaginaMovil} from '../hooks/usePaginaMovil';
import {useOpcionesPanelMovil} from '../hooks/useOpcionesPanelMovil';
import {useNotasStore, PANEL_SCRATCHPAD} from '../stores/notasStore';
import {useSeleccionMultipleStore} from '../stores/seleccionMultipleStore';
import {habitosActions} from '../stores/habitosStore';
import {ModalNotasExpandido} from '../components/dashboard/notas/ModalNotasExpandido';
import {useBackButtonCapacitor} from '../hooks/useBackButtonCapacitor';
import {useDeteccionCambioDia} from '../hooks/useDeteccionCambioDia';
import {obtenerTodosPanelesNavegables} from '../config/registroPaneles';
import {useSidebarPaneles} from '../hooks/dashboard/useSidebarPanels';

import '../styles/dashboard/componentes/experimentos.css';
import '../styles/dashboard/componentes/buscador.css';

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

export function DashboardIsland({titulo = 'DASHBOARD_01', version = VERSION_ACTUAL, usuario = 'user@admin'}: DashboardIslandProps): JSX.Element {
    const ctx = useDashboardCompleto();
    const {dashboard, auth, suscripcion, esAdmin, modales, equipos, notificaciones, acciones, filtroTareas, ordenTareas, ordenHabitos, opciones, configProyectos, layout, temas} = ctx;
    const {tipoLayout} = layout;
    const {esMovil} = useEsMovil();
    const paginaMovil = usePaginaMovil();
    const modoSeleccionActivo = useSeleccionMultipleStore(s => s.modoSeleccionActivo);
    const toggleModoSeleccionManual = useSeleccionMultipleStore(s => s.toggleModoSeleccionManual);

    /* [300A-2] Estado del panel activo en modo sidebar */
    /* [multi-panel-sidebar] Reemplazado por useSidebarPaneles que soporta multi-panel */
    const [panelSidebarActivo, setPanelSidebarActivo] = useState<string>(() => {
        const visibles = obtenerTodosPanelesNavegables();
        const primerVisible = visibles.find(p => layout.visibilidad[p.id] !== false);
        return primerVisible?.id || 'ejecucion';
    });

    /* [multi-panel-sidebar] Hook de paneles sidebar multi-panel.
     * Se inicializa con el panel activo actual para migración automática. */
    const {
        sidebarState,
        agregarPanel,
        quitarPanel,
        tienePanel,
        moverPanel,
        setPaneles,
        ajustarAnchos,
        ajustarAlturasFilas,
        cantidad: cantidadPanelesSidebar
    } = useSidebarPaneles(panelSidebarActivo);

    /* [300A-2] Si el panel activo se oculta desde config, cambiar al primero visible */
    /* [multi-panel-sidebar] También quita de la grilla los paneles ocultos */
    useEffect(() => {
        if (tipoLayout !== 'sidebar') return;
        if (layout.visibilidad[panelSidebarActivo] === false) {
            const visibles = obtenerTodosPanelesNavegables();
            const primerVisible = visibles.find(p => layout.visibilidad[p.id] !== false);
            if (primerVisible) setPanelSidebarActivo(primerVisible.id);
        }
        /* Quitar de la grilla los paneles que se ocultaron desde config */
        const panelesOcultos = sidebarState.paneles.filter(id => layout.visibilidad[id] === false);
        panelesOcultos.forEach(id => {
            if (sidebarState.paneles.length > 1) {
                quitarPanel(id);
            }
        });
    }, [layout.visibilidad, tipoLayout, panelSidebarActivo, sidebarState.paneles, quitarPanel]);

    /* [06JA-1] Al activar sidebar, forzar tema oscuro si estaba en 'original' (Terminal) */
    useEffect(() => {
        if (tipoLayout === 'sidebar' && !esMovil && temas.tema === 'original') {
            temas.cambiarTema('oscuro');
        }
    }, [tipoLayout, esMovil, temas.tema, temas.cambiarTema]);

    /*
     * Detección de cambio de día y retorno tras inactividad.
     * Al cambiar de día o volver tras 5+ minutos, forzar sincronización HTTP
     * para recalcular hábitos/tareas del nuevo día.
     */
    useDeteccionCambioDia({
        onCambioDia: () => {
            console.log('[Dashboard] Cambio de día detectado, forzando sincronización');
            dashboard.sincronizacion.sincronizarAhora();
        },
        onRetornoInactividad: () => {
            console.log('[Dashboard] Retorno tras inactividad, verificando datos');
            dashboard.sincronizacion.sincronizarAhora();
        },
        minutosInactividad: 5,
        habilitado: !!auth.user
    });

    /* Estado y acciones para notas en móvil */
    const crearNuevaNota = useNotasStore(s => s.crearNuevaNota);
    const [modalNotasAbierto, setModalNotasAbierto] = useState(false);

    const manejarNuevaNota = useCallback(() => {
        crearNuevaNota(PANEL_SCRATCHPAD);
    }, [crearNuevaNota]);

    const manejarAbrirNotasGuardadas = useCallback(() => {
        setModalNotasAbierto(true);
    }, []);

    /* Construir opciones del menú móvil basadas en el panel activo */
    const opcionesMovil = useOpcionesPanelMovil({
        paginaActiva: paginaMovil.paginaActiva,
        /* Tareas */
        opcionesFiltroTareas: opciones.opcionesFiltro,
        valorFiltroTareas: filtroTareas.filtroActual.tipo === 'proyecto' ? `proyecto-${filtroTareas.filtroActual.proyectoId}` : filtroTareas.filtroActual.tipo,
        onCambiarFiltroTareas: acciones.manejarCambioFiltro,
        opcionesOrdenTareas: opciones.opcionesOrdenTareas,
        modoOrdenTareas: ordenTareas.modoActual,
        onCambiarOrdenTareas: ordenTareas.cambiarModo,
        onAbrirConfigTareas: () => modales.abrirModalConfigGlobal('tareas'),
        /* Hábitos */
        opcionesOrdenHabitos: opciones.opcionesOrdenHabitos,
        modoOrdenHabitos: ordenHabitos.modoActual,
        onCambiarOrdenHabitos: ordenHabitos.cambiarModo,
        onAbrirConfigHabitos: () => modales.abrirModalConfigGlobal('habitos'),
        /* Proyectos */
        opcionesOrdenProyectos: opciones.opcionesOrdenProyectos,
        modoOrdenProyectos: configProyectos.configuracion.ordenDefecto,
        onCambiarOrdenProyectos: configProyectos.cambiarOrdenDefecto,
        onAbrirConfigProyectos: () => modales.abrirModalConfigGlobal('proyectos'),
        /* Actividad */
        onAbrirConfigActividad: () => modales.abrirModalConfigGlobal('actividad'),
        /* Notas */
        onNuevaNota: manejarNuevaNota,
        onAbrirNotasGuardadas: manejarAbrirNotasGuardadas,
        onAbrirConfigNotas: () => modales.abrirModalConfigGlobal('notas')
    });

    /* TAREA 1: Interceptar botón back en APK para cerrar modales/menus antes de salir */
    useBackButtonCapacitor({
        elementos: {
            modalLoginAbierto: modales.modalLoginAbierto,
            modalUpgradeAbierto: modales.modalUpgradeAbierto,
            modalPerfilAbierto: modales.modalPerfilAbierto,
            modalEquiposAbierto: modales.modalEquiposAbierto,
            modalNotificacionesAbierto: modales.modalNotificacionesAbierto,
            modalExperimentosAbierto: modales.modalExperimentosAbierto,
            modalCrearProyectoAbierto: modales.modalCrearProyectoAbierto,
            proyectoEditando: modales.proyectoEditando,
            modalConfigTareasAbierto: modales.modalConfigTareasAbierto,
            modalConfigHabitosAbierto: modales.modalConfigHabitosAbierto,
            modalConfigProyectosAbierto: modales.modalConfigProyectosAbierto,
            modalConfigScratchpadAbierto: modales.modalConfigScratchpadAbierto,
            modalConfigActividadAbierto: modales.modalConfigActividadAbierto,
            modalConfigLayoutAbierto: modales.modalConfigLayoutAbierto,
            modalVersionesAbierto: modales.modalVersionesAbierto,
            modalNuevaTareaAbierto: modales.modalNuevaTareaAbierto,
            tareaEditando: modales.tareaEditando,
            tareaEditandoMovil: modales.tareaEditandoMovil,
            habitoEditandoMovil: modales.habitoEditandoMovil,
            modalCreacionRapida: modales.modalCreacionRapida,
            modalTemasAbierto: modales.modalTemasAbierto,
            modalConfigMCPAbierto: modales.modalConfigMCPAbierto,
            modalConfigUsuarioAbierto: modales.modalConfigUsuarioAbierto,
            modalBackupsAbierto: modales.modalBackupsAbierto,
            modalFeedbackAbierto: modales.modalFeedbackAbierto,
            panelSeguridadAbierto: modales.panelSeguridadAbierto,
            panelAdminAbierto: modales.panelAdminAbierto
        },
        acciones: {
            cerrarModalLogin: modales.cerrarModalLogin,
            cerrarModalUpgrade: modales.cerrarModalUpgrade,
            cerrarModalPerfil: modales.cerrarModalPerfil,
            cerrarModalEquipos: modales.cerrarModalEquipos,
            cerrarModalNotificaciones: modales.cerrarModalNotificaciones,
            cerrarModalExperimentos: modales.cerrarModalExperimentos,
            cerrarModalCrearProyecto: modales.cerrarModalCrearProyecto,
            cerrarModalEditarProyecto: modales.cerrarModalEditarProyecto,
            cerrarModalConfigTareas: modales.cerrarModalConfigTareas,
            cerrarModalConfigHabitos: modales.cerrarModalConfigHabitos,
            cerrarModalConfigProyectos: modales.cerrarModalConfigProyectos,
            cerrarModalConfigScratchpad: modales.cerrarModalConfigScratchpad,
            cerrarModalConfigActividad: modales.cerrarModalConfigActividad,
            cerrarModalConfigLayout: modales.cerrarModalConfigLayout,
            cerrarModalVersiones: modales.cerrarModalVersiones,
            cerrarModalNuevaTarea: modales.cerrarModalNuevaTarea,
            cerrarModalEditarTarea: modales.cerrarModalEditarTarea,
            cerrarEdicionTareaMovil: modales.cerrarEdicionTareaMovil,
            cerrarEdicionHabitoMovil: modales.cerrarEdicionHabitoMovil,
            cerrarCreacionRapida: modales.cerrarCreacionRapida,
            cerrarModalTemas: modales.cerrarModalTemas,
            cerrarModalConfigMCP: modales.cerrarModalConfigMCP,
            cerrarModalConfigUsuario: modales.cerrarModalConfigUsuario,
            cerrarModalBackups: modales.cerrarModalBackups,
            cerrarModalFeedback: modales.cerrarModalFeedback,
            cerrarPanelSeguridad: modales.cerrarPanelSeguridad,
            cerrarPanelAdmin: modales.cerrarPanelAdmin
        }
    });

    /* Memoizar objeto de sincronización para evitar re-renders innecesarios */
    const sincronizacionConAuth = useMemo(
        () => ({
            ...dashboard.sincronizacion,
            onLogin: modales.abrirModalLogin,
            onLogout: auth.logout,
            estaLogueado: !!auth.user
        }),
        [dashboard.sincronizacion, modales.abrirModalLogin, auth.logout, auth.user]
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) auth.handleCallback(code);
    }, [auth.handleCallback]);

    if (auth.loading && !modales.modalLoginAbierto) {
        return <IndicadorCarga texto="Autenticando..." />;
    }

    /* Usuario no logueado: mostrar landing page */
    if (!auth.user) {
        return (
            <>
                <Landing onLogin={modales.abrirModalLogin} />
                <DashboardModales ctx={ctx} />
            </>
        );
    }

    /* Clase del contenedor con padding extra para navegación móvil */
    const clasesContenedor = `dashboardContenedor ${esMovil && auth.user ? 'dashboardContenedor--conNavegacionInferior' : ''} ${tipoLayout === 'sidebar' && !esMovil ? 'dashboardContenedor--sidebar' : ''}`;

    return (
        <div id="dashboard-contenedor" className={clasesContenedor}>
            {esMovil || tipoLayout !== 'sidebar' ? (
                /* ── MODO GRID (clásico) o móvil ── */
                <>
                    <DashboardEncabezado
                        titulo={titulo}
                        version={version}
                        usuario={auth.user ? auth.user.name : usuario}
                        avatarUrl={auth.user?.avatarUrl}
                        sincronizacion={sincronizacionConAuth}
                        suscripcion={suscripcion}
                        esAdmin={esAdmin}
                        equiposPendientes={equipos.pendientes}
                        notificacionesPendientes={notificaciones.noLeidas}
                        onClickPlan={modales.abrirModalUpgrade}
                        onClickSeguridad={() => modales.abrirModalConfigGlobal('seguridad')}
                        onClickAdmin={modales.abrirPanelAdmin}
                        onClickLayout={() => modales.abrirModalConfigGlobal('layout')}
                        onClickVersion={modales.abrirModalVersiones}
                        onClickUsuario={() => modales.abrirModalConfigGlobal('perfil')}
                        onClickEquipos={modales.abrirModalEquipos}
                        onClickNotificaciones={(evento?: React.MouseEvent) => { if (evento) acciones.manejarClickNotificaciones(evento); }}
                        onClickExperimentos={esAdmin ? modales.abrirModalExperimentos : undefined}
                        onClickTemas={() => modales.abrirModalConfigGlobal('temas')}
                        onClickConfigUsuario={() => modales.abrirModalConfigGlobal(null)}
                        onClickBackups={() => modales.abrirModalConfigGlobal('backups')}
                        onClickConfigMCP={() => modales.abrirModalConfigGlobal('ia')}
                        onClickPlugins={modales.abrirModalPlugins}
                        onClickFeedback={modales.abrirModalFeedback}
                        onExportarDatos={dashboard.exportarTodosDatos}
                        onImportarDatos={dashboard.importarTodosDatos}
                        tareas={dashboard.tareas}
                        habitos={dashboard.habitos}
                        proyectos={dashboard.proyectos}
                        onSeleccionarTarea={modales.abrirModalEditarTarea}
                        onSeleccionarHabito={dashboard.abrirModalEditarHabito}
                        onSeleccionarProyecto={modales.abrirModalEditarProyecto}
                        onCrearRapido={modales.abrirCreacionRapida}
                        opcionesMovil={esMovil ? opcionesMovil : undefined}
                        paginaMovilActiva={esMovil ? paginaMovil.paginaActiva : undefined}
                        onCambiarPagina={esMovil ? paginaMovil.cambiarPagina : undefined}
                        modoSeleccionActivo={modoSeleccionActivo}
                        onToggleSeleccion={toggleModoSeleccionManual}
                    />

                    {dashboard.cargandoDatos ? (
                        <IndicadorCarga />
                    ) : (
                        <DashboardGrid ctx={ctx} esMovil={esMovil} paginaMovilActiva={paginaMovil.paginaActiva} />
                    )}
                </>
            ) : (
                /* ── MODO SIDEBAR: menú lateral + contenido multi-panel ── */
                <div className="dashboardSidebarLayout">
                    <SidebarMenu
                        paneles={obtenerTodosPanelesNavegables().filter(p => layout.visibilidad[p.id] !== false)}
                        panelActivo={panelSidebarActivo}
                        onSeleccionarPanel={(panelId) => {
                            /* Click en sidebar: cambia a un solo panel (no agrega a grilla) */
                            setPaneles([panelId]);
                            setPanelSidebarActivo(panelId);
                        }}
                        onAbrirConfig={() => modales.abrirModalConfigGlobal(null)}
                        panelesActivos={sidebarState.paneles}
                        onAgregarPanel={agregarPanel}
                    />
                    <div className="dashboardSidebarMain">
                        {dashboard.cargandoDatos ? (
                            <IndicadorCarga />
                        ) : (
                            <div className="dashboardSidebarContenido">
                                <DashboardSidebarGrid
                                    paneles={sidebarState.paneles}
                                    ctx={ctx}
                                    anchos={sidebarState.anchos}
                                    alturaFilas={sidebarState.alturaFilas}
                                    onQuitarPanel={quitarPanel}
                                    onAjustarAnchos={ajustarAnchos}
                                    onAjustarAlturasFilas={ajustarAlturasFilas}
                                    onMoverPanel={moverPanel}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {esMovil || tipoLayout !== 'sidebar' ? <DashboardFooter /> : null}
            <DashboardModales ctx={ctx} />


            {/* Modal de notas guardadas para móvil (desde menú de 3 puntos) */}
            <ModalNotasExpandido abierto={modalNotasAbierto} onCerrar={() => setModalNotasAbierto(false)} tamanoFuente="normal" delayGuardado={2000} panelId={PANEL_SCRATCHPAD} />

            {/* Dock de tracking de tiempo */}
            {auth.user && (
                <DockTracking
                    esMovil={esMovil}
                    onCompletarEntidad={(entidadId, tipoEntidad, detallesActividad) => {
                        if (tipoEntidad === 'tarea') {
                            /* [207A-5] Interceptar tareas-hábito/subhábito (IDs negativos)
                             * antes de llamar toggleTarea que solo opera sobre tareas reales.
                             * Sin esto, completar tracking de un hábito no lo marcaba como
                             * completado → la tarea virtual reaparecía en el siguiente render. */
                            const fueHabito = ctx.habitosComoTareas.manejarToggleTareaHabito(entidadId);
                            if (!fueHabito) {
                                dashboard.toggleTarea(entidadId, {detallesActividad});
                            }
                            return;
                        }
                        habitosActions.completarHabitoHoy(entidadId, detallesActividad);
                    }}
                />
            )}

            {/* Navegación inferior móvil */}
            {auth.user && <NavegacionInferior paginaActiva={paginaMovil.paginaActiva} onCambiarPagina={paginaMovil.cambiarPagina} onCrearRapido={modales.abrirCreacionRapida} visible={esMovil} />}
        </div>
    );
}

export default DashboardIsland;
