/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Compone todos los subcomponentes del dashboard
 * Refactorizado: Lógica extraída a hooks y componentes especializados
 */

import {useEffect} from 'react';
import {Bell} from 'lucide-react';
import {DashboardEncabezado, DashboardFooter, AccionesDatos, FormularioHabito, FormularioProyecto, ModalLogin, PanelSeguridad, ModalConfiguracionLayout, PanelConfiguracionTarea, ModalConfiguracionProyectos, ModalPerfil} from '../components/dashboard';
import {ToastDeshacer, ModalUpgrade, TooltipSystem, BarraPanelesOcultos, PanelArrastrable, HandleArrastre, IndicadorArrastre, ModalVersiones} from '../components/shared';
import {Modal} from '../components/shared/Modal';
import {PanelAdministracion} from '../components/admin';
import {ModalEquipos} from '../components/equipos';
import {ModalNotificaciones} from '../components/notificaciones';
import {ModalCompartir} from '../components/compartidos';
import {ModalExperimentos} from '../components/experimentos/ModalExperimentos';
import {ModalConfiguracionTareas} from '../components/dashboard/ModalConfiguracionTareas';
import {ModalConfiguracionHabitos} from '../components/dashboard/ModalConfiguracionHabitos';
import {ModalConfiguracionScratchpad} from '../components/dashboard/ModalConfiguracionScratchpad';
import {PanelFocoPrioritario, PanelProyectos, PanelEjecucion, PanelScratchpad} from '../components/paneles';

import {useDashboard} from '../hooks/useDashboard';
import {useOrdenarHabitos} from '../hooks/useOrdenarHabitos';
import {useAuth} from '../hooks/useAuth';
import {useSuscripcion} from '../hooks/useSuscripcion';
import {useFiltroTareas} from '../hooks/useFiltroTareas';
import {useOrdenarTareas} from '../hooks/useOrdenarTareas';
import {useConfiguracionLayout} from '../hooks/useConfiguracionLayout';
import {useConfiguracionTareas} from '../hooks/useConfiguracionTareas';
import {useConfiguracionHabitos} from '../hooks/useConfiguracionHabitos';
import {useConfiguracionProyectos} from '../hooks/useConfiguracionProyectos';
import {useConfiguracionScratchpad} from '../hooks/useConfiguracionScratchpad';
import {useArrastrePaneles} from '../hooks/useArrastrePaneles';
import {useEquipos} from '../hooks/useEquipos';
import {useNotificaciones} from '../hooks/useNotificaciones';

import {useModalesDashboard} from '../hooks/useModalesDashboard';
import {useCompartirDashboard} from '../hooks/useCompartirDashboard';
import {useOpcionesDashboard} from '../hooks/useOpcionesDashboard';
import {useAccionesDashboard} from '../hooks/useAccionesDashboard';

import type {PanelId} from '../hooks/useConfiguracionLayout';
import type {AccionExperimento} from '../components/experimentos/ModalExperimentos';

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

export function DashboardIsland({titulo = 'DASHBOARD_01', version = 'v1.0.1-beta', usuario = 'user@admin'}: DashboardIslandProps): JSX.Element {
    const {habitos, tareas, notas, proyectos, toggleTarea, crearTarea, editarTarea, eliminarTarea, crearProyecto, editarProyecto, eliminarProyecto, cambiarEstadoProyecto, actualizarNotas, toggleHabito, crearHabito, editarHabito, eliminarHabito, modalCrearHabitoAbierto, abrirModalCrearHabito, cerrarModalCrearHabito, habitoEditando, abrirModalEditarHabito, cerrarModalEditarHabito, exportarTodosDatos, importarTodosDatos, importando, mensajeEstado, tipoMensaje, cargandoDatos, accionDeshacer, ejecutarDeshacer, descartarDeshacer, reordenarTareas, sincronizacion} = useDashboard();

    const {loginWithGoogle, loginWithCredentials, register, handleCallback, logout, loading: authLoading, error: authError, user} = useAuth();
    const {suscripcion} = useSuscripcion();
    const esAdmin = Boolean((window as unknown as {gloryDashboard?: {esAdmin?: boolean}}).gloryDashboard?.esAdmin);

    const modales = useModalesDashboard();
    const equipos = useEquipos();
    const notificaciones = useNotificaciones(Boolean(user));
    const compartir = useCompartirDashboard({proyectos});

    const {habitosOrdenados, modoActual: modoOrdenHabitos, cambiarModo: cambiarModoHabitos, modosDisponibles: modosHabitos} = useOrdenarHabitos(habitos);
    const {filtroActual, cambiarFiltro, tareasFiltradas, contarAsignadas} = useFiltroTareas(tareas, proyectos || []);
    const {tareasOrdenadas: tareasFinales, modoActual: modoOrden, cambiarModo: cambiarModoOrden, esOrdenManual} = useOrdenarTareas(tareasFiltradas);

    const {configuracion: configTareas, toggleOcultarCompletadas, toggleOcultarBadgeProyecto, toggleEliminarCompletadasDespuesDeUnDia} = useConfiguracionTareas();
    const {configuracion: configHabitos, toggleOcultarCompletadosHoy, toggleModoCompacto, toggleColumnaVisible} = useConfiguracionHabitos();
    const {configuracion: configProyectos, toggleOcultarCompletados: toggleOcultarProyectosCompletados, cambiarOrdenDefecto: cambiarOrdenProyectos, toggleMostrarProgreso: toggleProgresoProyectos} = useConfiguracionProyectos();
    const {configuracion: configScratchpad, cambiarTamanoFuente: cambiarFuenteScratchpad, cambiarAltura: cambiarAlturaScratchpad, cambiarAutoGuardado: cambiarAutoGuardadoScratchpad} = useConfiguracionScratchpad();

    const {modoColumnas, visibilidad, ordenPaneles, panelesOcultos, cambiarModoColumnas, toggleVisibilidadPanel, mostrarPanel, resetearLayout, obtenerPanelesColumna, moverPanelArriba, moverPanelAbajo, moverPanelAColumna, resetearOrdenPaneles, reordenarPanel} = useConfiguracionLayout();
    const {panelArrastrando, posicionMouse, zonaDropActiva, iniciarArrastre, registrarPanel} = useArrastrePaneles(ordenPaneles, reordenarPanel);

    const opciones = useOpcionesDashboard({proyectos: proyectos || [], modosOrdenHabitos: modosHabitos, contarAsignadas});

    const acciones = useAccionesDashboard({
        filtroActual,
        notas,
        crearTarea,
        actualizarNotas,
        crearProyecto,
        editarProyecto,
        proyectoEditando: modales.proyectoEditando,
        cambiarFiltro,
        cerrarModalNuevaTarea: modales.cerrarModalNuevaTarea,
        cerrarModalCrearProyecto: modales.cerrarModalCrearProyecto,
        cerrarModalEditarProyecto: modales.cerrarModalEditarProyecto,
        abrirModalEquipos: modales.abrirModalEquipos,
        abrirModalNotificaciones: modales.abrirModalNotificaciones,
        cerrarModalNotificaciones: modales.cerrarModalNotificaciones,
        modalNotificacionesAbierto: modales.modalNotificacionesAbierto,
        cargarNotificaciones: notificaciones.cargarNotificaciones,
        refrescarNotificaciones: notificaciones.refrescar
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) handleCallback(code);
    }, [handleCallback]);

    const valorFiltroActual = filtroActual.tipo === 'proyecto' ? `proyecto-${filtroActual.proyectoId}` : filtroActual.tipo;
    const accionesExperimentos: AccionExperimento[] = [{id: 'notificacion-prueba', nombre: 'Crear Notificación de Prueba', descripcion: 'Crea una notificación de tipo solicitud_equipo para probar el sistema.', icono: <Bell size={20} />, ejecutar: acciones.crearNotificacionPrueba}];

    const renderizarContenidoPanel = (panelId: PanelId): JSX.Element | null => {
        const handleArrastre = <HandleArrastre panelId={panelId} onMouseDown={iniciarArrastre} estaArrastrando={panelArrastrando === panelId} />;

        switch (panelId) {
            case 'focoPrioritario':
                return <PanelFocoPrioritario habitos={habitosOrdenados} modoOrdenHabitos={modoOrdenHabitos} opcionesOrdenHabitos={opciones.opcionesOrdenHabitos} configuracion={configHabitos} onAbrirModalCrearHabito={abrirModalCrearHabito} onAbrirModalConfigHabitos={modales.abrirModalConfigHabitos} onToggleHabito={toggleHabito} onEditarHabito={abrirModalEditarHabito} onEliminarHabito={eliminarHabito} onCambiarModoHabitos={cambiarModoHabitos} handleArrastre={handleArrastre} />;
            case 'proyectos':
                return <PanelProyectos proyectos={proyectos || []} tareas={tareas} configuracion={configProyectos} opcionesOrdenProyectos={opciones.opcionesOrdenProyectos} onAbrirModalCrearProyecto={modales.abrirModalCrearProyecto} onAbrirModalEditarProyecto={modales.abrirModalEditarProyecto} onAbrirModalConfigProyectos={modales.abrirModalConfigProyectos} onEliminarProyecto={eliminarProyecto} onCambiarEstadoProyecto={cambiarEstadoProyecto} onCambiarOrdenProyectos={cambiarOrdenProyectos} onCompartirProyecto={compartir.manejarCompartirProyecto} estaCompartido={compartir.estaCompartidoProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} handleArrastre={handleArrastre} />;
            case 'ejecucion':
                return (
                    <PanelEjecucion
                        tareas={tareasFinales}
                        proyectos={proyectos || []}
                        proyectoIdActual={filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined}
                        ocultarCompletadas={configTareas.ocultarCompletadas}
                        ocultarBadgeProyecto={configTareas.ocultarBadgeProyecto}
                        modoOrden={modoOrden}
                        valorFiltroActual={valorFiltroActual}
                        opcionesFiltro={opciones.opcionesFiltro}
                        opcionesOrdenTareas={opciones.opcionesOrdenTareas}
                        esOrdenManual={esOrdenManual}
                        onAbrirModalNuevaTarea={modales.abrirModalNuevaTarea}
                        onAbrirModalConfigTareas={modales.abrirModalConfigTareas}
                        onToggleTarea={toggleTarea}
                        onCrearTarea={crearTarea}
                        onEditarTarea={editarTarea}
                        onEliminarTarea={eliminarTarea}
                        onReordenarTareas={reordenarTareas}
                        onCambiarFiltro={acciones.manejarCambioFiltro}
                        onCambiarModoOrden={cambiarModoOrden}
                        onCompartirTarea={compartir.manejarCompartirTarea}
                        estaCompartida={compartir.estaCompartidaTarea}
                        obtenerParticipantes={compartir.obtenerParticipantesTarea}
                        handleArrastre={handleArrastre}
                    />
                );
            case 'scratchpad':
                return <PanelScratchpad notas={notas} configuracion={configScratchpad} onActualizarNotas={actualizarNotas} onLimpiarScratchpad={acciones.manejarLimpiarScratchpad} onAbrirModalConfigScratchpad={modales.abrirModalConfigScratchpad} handleArrastre={handleArrastre} />;
            default:
                return null;
        }
    };

    const renderizarPanel = (panelId: PanelId): JSX.Element => (
        <PanelArrastrable key={panelId} panelId={panelId} innerRef={el => registrarPanel(panelId, el)} esArrastrando={panelArrastrando === panelId} esDestino={zonaDropActiva?.panelId === panelId} posicionDestino={zonaDropActiva?.panelId === panelId ? zonaDropActiva.posicion : null}>
            {renderizarContenidoPanel(panelId)}
        </PanelArrastrable>
    );

    const renderizarColumna = (columna: 1 | 2 | 3): JSX.Element[] => obtenerPanelesColumna(columna).map(panelId => renderizarPanel(panelId));

    if (authLoading && !modales.modalLoginAbierto) return <IndicadorCarga texto="Autenticando..." />;

    return (
        <div id="dashboard-contenedor" className="dashboardContenedor">
            <DashboardEncabezado titulo={titulo} version={version} usuario={user ? user.name : usuario} avatarUrl={user?.avatarUrl} sincronizacion={{...sincronizacion, onLogin: modales.abrirModalLogin, onLogout: logout, estaLogueado: !!user}} suscripcion={suscripcion} esAdmin={esAdmin} equiposPendientes={equipos.pendientes} notificacionesPendientes={notificaciones.noLeidas} onClickPlan={modales.abrirModalUpgrade} onClickSeguridad={modales.abrirPanelSeguridad} onClickAdmin={modales.abrirPanelAdmin} onClickLayout={modales.abrirModalConfigLayout} onClickVersion={modales.abrirModalVersiones} onClickUsuario={modales.abrirModalPerfil} onClickEquipos={modales.abrirModalEquipos} onClickNotificaciones={acciones.manejarClickNotificaciones} onClickExperimentos={esAdmin ? modales.abrirModalExperimentos : undefined} />

            {cargandoDatos ? (
                <IndicadorCarga />
            ) : (
                <div className={`dashboardGrid dashboardGrid--${modoColumnas}col ${panelArrastrando ? 'arrastrandoPanel' : ''}`}>
                    <div className="columnaDashboard">{renderizarColumna(1)}</div>
                    {modoColumnas >= 2 && (
                        <div className="columnaDashboard">
                            {renderizarColumna(2)}
                            {modoColumnas === 2 && <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />}
                        </div>
                    )}
                    {modoColumnas === 3 && (
                        <div className="columnaDashboard">
                            {renderizarColumna(3)}
                            <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />
                        </div>
                    )}
                    {modoColumnas === 1 && <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />}
                </div>
            )}

            <DashboardFooter />

            <ModalLogin estaAbierto={modales.modalLoginAbierto} onCerrar={modales.cerrarModalLogin} onLoginGoogle={loginWithGoogle} onLoginCredentials={loginWithCredentials} onRegister={register} loading={authLoading} error={authError} />
            <ModalUpgrade visible={modales.modalUpgradeAbierto} onCerrar={modales.cerrarModalUpgrade} suscripcion={suscripcion} />
            <PanelSeguridad visible={modales.panelSeguridadAbierto} onCerrar={modales.cerrarPanelSeguridad} />

            {modales.modalNotificacionesAbierto && <ModalNotificaciones notificaciones={notificaciones.notificaciones} noLeidas={notificaciones.noLeidas} total={notificaciones.total} cargando={notificaciones.cargando} posicionX={modales.posicionModalNotificaciones.x} posicionY={modales.posicionModalNotificaciones.y} onMarcarLeida={notificaciones.marcarLeida} onMarcarTodasLeidas={notificaciones.marcarTodasLeidas} onEliminar={notificaciones.eliminar} onClickNotificacion={acciones.manejarClickNotificacionIndividual} onCerrar={modales.cerrarModalNotificaciones} />}
            <ModalEquipos estaAbierto={modales.modalEquiposAbierto} onCerrar={modales.cerrarModalEquipos} />

            <Modal estaAbierto={modalCrearHabitoAbierto} onCerrar={cerrarModalCrearHabito} titulo="Nuevo Habito">
                <FormularioHabito onGuardar={crearHabito} onCancelar={cerrarModalCrearHabito} />
            </Modal>
            <Modal estaAbierto={habitoEditando !== null} onCerrar={cerrarModalEditarHabito} titulo="Editar Habito">
                {habitoEditando && <FormularioHabito onGuardar={datos => editarHabito(habitoEditando.id, datos)} onCancelar={cerrarModalEditarHabito} onEliminar={() => eliminarHabito(habitoEditando.id)} datosIniciales={{nombre: habitoEditando.nombre, importancia: habitoEditando.importancia, tags: habitoEditando.tags, frecuencia: habitoEditando.frecuencia}} modoEdicion />}
            </Modal>

            <Modal estaAbierto={modales.modalCrearProyectoAbierto} onCerrar={modales.cerrarModalCrearProyecto} titulo="Nuevo Proyecto">
                <FormularioProyecto onGuardar={acciones.manejarGuardarNuevoProyecto} onCancelar={modales.cerrarModalCrearProyecto} />
            </Modal>
            <Modal estaAbierto={modales.proyectoEditando !== null} onCerrar={modales.cerrarModalEditarProyecto} titulo="Editar Proyecto">
                {modales.proyectoEditando && (
                    <FormularioProyecto
                        onGuardar={acciones.manejarGuardarEdicionProyecto}
                        onCancelar={modales.cerrarModalEditarProyecto}
                        onEliminar={() => {
                            eliminarProyecto(modales.proyectoEditando!.id);
                            modales.cerrarModalEditarProyecto();
                        }}
                        datosIniciales={{nombre: modales.proyectoEditando.nombre, descripcion: modales.proyectoEditando.descripcion, prioridad: modales.proyectoEditando.prioridad, fechaLimite: modales.proyectoEditando.fechaLimite}}
                        modoEdicion
                    />
                )}
            </Modal>

            <ModalConfiguracionTareas estaAbierto={modales.modalConfigTareasAbierto} onCerrar={modales.cerrarModalConfigTareas} configuracion={configTareas} onToggleCompletadas={toggleOcultarCompletadas} onToggleBadgeProyecto={toggleOcultarBadgeProyecto} onToggleEliminarCompletadas={toggleEliminarCompletadasDespuesDeUnDia} />
            <ModalConfiguracionHabitos estaAbierto={modales.modalConfigHabitosAbierto} onCerrar={modales.cerrarModalConfigHabitos} configuracion={configHabitos} onToggleCompletadosHoy={toggleOcultarCompletadosHoy} onToggleModoCompacto={toggleModoCompacto} onToggleColumna={toggleColumnaVisible} />
            <ModalConfiguracionProyectos estaAbierto={modales.modalConfigProyectosAbierto} onCerrar={modales.cerrarModalConfigProyectos} configuracion={configProyectos} onToggleCompletados={toggleOcultarProyectosCompletados} onToggleProgreso={toggleProgresoProyectos} />
            <ModalConfiguracionScratchpad estaAbierto={modales.modalConfigScratchpadAbierto} onCerrar={modales.cerrarModalConfigScratchpad} configuracion={configScratchpad} onCambiarFuente={cambiarFuenteScratchpad} onCambiarAltura={cambiarAlturaScratchpad} onCambiarIntervalo={cambiarAutoGuardadoScratchpad} />
            <ModalConfiguracionLayout estaAbierto={modales.modalConfigLayoutAbierto} onCerrar={modales.cerrarModalConfigLayout} modoColumnas={modoColumnas} visibilidad={visibilidad} ordenPaneles={ordenPaneles} onCambiarModo={cambiarModoColumnas} onTogglePanel={toggleVisibilidadPanel} onMoverPanelArriba={moverPanelArriba} onMoverPanelAbajo={moverPanelAbajo} onMoverPanelAColumna={moverPanelAColumna} onResetearOrden={resetearOrdenPaneles} onResetear={resetearLayout} />

            <ModalVersiones estaAbierto={modales.modalVersionesAbierto} onCerrar={modales.cerrarModalVersiones} />
            <ModalPerfil estaAbierto={modales.modalPerfilAbierto} onCerrar={modales.cerrarModalPerfil} />
            {esAdmin && <PanelAdministracion estaAbierto={modales.panelAdminAbierto} onCerrar={modales.cerrarPanelAdmin} />}
            <ModalExperimentos abierto={modales.modalExperimentosAbierto} onCerrar={modales.cerrarModalExperimentos} acciones={accionesExperimentos} />

            <ModalCompartir visible={compartir.proyectoCompartiendo !== null} onCerrar={compartir.cerrarModalCompartirProyecto} tipo="proyecto" elementoId={compartir.proyectoCompartiendo?.id ?? 0} elementoNombre={compartir.proyectoCompartiendo?.nombre ?? ''} companeros={equipos.companeros} participantes={compartir.participantesProyecto} cifradoActivo={false} onCompartir={compartir.manejarCompartirElemento} onCambiarRol={compartir.manejarCambiarRolCompartido} onDejarDeCompartir={compartir.manejarDejarDeCompartir} cargandoParticipantes={compartir.cargando} />
            <ModalCompartir visible={compartir.tareaCompartiendo !== null} onCerrar={compartir.cerrarModalCompartirTarea} tipo="tarea" elementoId={compartir.tareaCompartiendo?.id ?? 0} elementoNombre={compartir.tareaCompartiendo?.texto ?? ''} companeros={equipos.companeros} participantes={compartir.participantesTarea} cifradoActivo={false} onCompartir={compartir.manejarCompartirTareaElemento} onCambiarRol={compartir.manejarCambiarRolTareaCompartida} onDejarDeCompartir={compartir.manejarDejarDeCompartir} cargandoParticipantes={compartir.cargando} />

            {modales.modalNuevaTareaAbierto && <PanelConfiguracionTarea estaAbierto={modales.modalNuevaTareaAbierto} onCerrar={modales.cerrarModalNuevaTarea} onGuardar={acciones.manejarCrearNuevaTareaGlobal} />}

            {accionDeshacer && <ToastDeshacer mensaje={accionDeshacer.mensaje} tiempoRestante={accionDeshacer.tiempoRestante} tiempoTotal={5000} onDeshacer={ejecutarDeshacer} onDescartar={descartarDeshacer} />}
            <BarraPanelesOcultos panelesOcultos={panelesOcultos} onMostrarPanel={mostrarPanel} />
            <TooltipSystem />
            <IndicadorArrastre panelArrastrando={panelArrastrando} posicionMouse={posicionMouse} />
        </div>
    );
}

export default DashboardIsland;
