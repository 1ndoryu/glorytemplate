/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Compone todos los subcomponentes del dashboard
 * Refactorizado: Lógica extraída a hooks especializados
 */

import {useEffect, useCallback} from 'react';
import {Terminal, AlertCircle, FileText, Folder, Plus, Eraser, Bell, ArrowUpDown, Settings} from 'lucide-react';
import {DashboardEncabezado, SeccionEncabezado, TablaHabitos, ListaTareas, Scratchpad, DashboardFooter, AccionesDatos, FormularioHabito, ListaProyectos, FormularioProyecto, ModalLogin, PanelSeguridad, ModalConfiguracionLayout, PanelConfiguracionTarea, ModalConfiguracionProyectos, ModalPerfil} from '../components/dashboard';
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
import {SelectorBadge} from '../components/shared/SelectorBadge';

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
import {useAlertasContext} from '../context/AlertasContext';

/* Hooks refactorizados */
import {useModalesDashboard} from '../hooks/useModalesDashboard';
import {useCompartirDashboard} from '../hooks/useCompartirDashboard';
import {useOpcionesDashboard} from '../hooks/useOpcionesDashboard';

import type {PanelId} from '../hooks/useConfiguracionLayout';
import type {AccionExperimento} from '../components/experimentos/ModalExperimentos';
import type {TareaConfiguracion, NivelPrioridad} from '../types/dashboard';

import '../styles/dashboard/componentes/experimentos.css';

interface DashboardIslandProps {
    titulo?: string;
    version?: string;
    usuario?: string;
}

/* Componente de carga */
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
    /* Core Dashboard */
    const {habitos, tareas, notas, proyectos, toggleTarea, crearTarea, editarTarea, eliminarTarea, crearProyecto, editarProyecto, eliminarProyecto, cambiarEstadoProyecto, actualizarNotas, toggleHabito, crearHabito, editarHabito, eliminarHabito, modalCrearHabitoAbierto, abrirModalCrearHabito, cerrarModalCrearHabito, habitoEditando, abrirModalEditarHabito, cerrarModalEditarHabito, exportarTodosDatos, importarTodosDatos, importando, mensajeEstado, tipoMensaje, cargandoDatos, accionDeshacer, ejecutarDeshacer, descartarDeshacer, reordenarTareas, sincronizacion} = useDashboard();

    /* Auth */
    const {loginWithGoogle, loginWithCredentials, register, handleCallback, logout, loading: authLoading, error: authError, user} = useAuth();

    /* Suscripcion */
    const {suscripcion} = useSuscripcion();

    /* Admin check */
    const esAdmin = Boolean((window as unknown as {gloryDashboard?: {esAdmin?: boolean}}).gloryDashboard?.esAdmin);

    /* Hook centralizado de modales */
    const modales = useModalesDashboard();

    /* Equipos */
    const equipos = useEquipos();

    /* Notificaciones */
    const notificaciones = useNotificaciones(Boolean(user));

    /* Compartidos */
    const compartir = useCompartirDashboard({proyectos});

    /* Sistema de ordenamiento de habitos */
    const {habitosOrdenados, modoActual: modoOrdenHabitos, cambiarModo: cambiarModoHabitos, modosDisponibles: modosHabitos} = useOrdenarHabitos(habitos);

    /* Filtro de tareas */
    const {filtroActual, cambiarFiltro, tareasFiltradas, contarAsignadas} = useFiltroTareas(tareas, proyectos || []);

    /* Ordenamiento de tareas */
    const {tareasOrdenadas: tareasFinales, modoActual: modoOrden, cambiarModo: cambiarModoOrden, esOrdenManual} = useOrdenarTareas(tareasFiltradas);

    /* Configuraciones */
    const {configuracion: configTareas, toggleOcultarCompletadas, toggleOcultarBadgeProyecto, toggleEliminarCompletadasDespuesDeUnDia} = useConfiguracionTareas();
    const {configuracion: configHabitos, toggleOcultarCompletadosHoy, toggleModoCompacto, toggleColumnaVisible} = useConfiguracionHabitos();
    const {configuracion: configProyectos, toggleOcultarCompletados: toggleOcultarProyectosCompletados, cambiarOrdenDefecto: cambiarOrdenProyectos, toggleMostrarProgreso: toggleProgresoProyectos} = useConfiguracionProyectos();
    const {configuracion: configScratchpad, cambiarTamanoFuente: cambiarFuenteScratchpad, cambiarAltura: cambiarAlturaScratchpad, cambiarAutoGuardado: cambiarAutoGuardadoScratchpad} = useConfiguracionScratchpad();

    /* Layout */
    const {modoColumnas, visibilidad, ordenPaneles, panelesOcultos, cambiarModoColumnas, toggleVisibilidadPanel, mostrarPanel, resetearLayout, obtenerPanelesColumna, moverPanelArriba, moverPanelAbajo, moverPanelAColumna, resetearOrdenPaneles, reordenarPanel} = useConfiguracionLayout();

    /* Arrastre de paneles */
    const {panelArrastrando, posicionMouse, zonaDropActiva, iniciarArrastre, registrarPanel} = useArrastrePaneles(ordenPaneles, reordenarPanel);

    /* Opciones para selectores */
    const opciones = useOpcionesDashboard({
        proyectos: proyectos || [],
        modosOrdenHabitos: modosHabitos,
        contarAsignadas
    });

    /* Alertas */
    const {confirmar} = useAlertasContext();

    /* Callback para OAuth */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) handleCallback(code);
    }, [handleCallback]);

    /* Valor actual del filtro */
    const valorFiltroActual = filtroActual.tipo === 'proyecto' ? `proyecto-${filtroActual.proyectoId}` : filtroActual.tipo;

    /* Manejador de cambio de filtro */
    const manejarCambioFiltro = useCallback(
        (valor: string) => {
            if (valor === 'sueltas') cambiarFiltro({tipo: 'sueltas'});
            else if (valor === 'todas') cambiarFiltro({tipo: 'todas'});
            else if (valor === 'asignadas') cambiarFiltro({tipo: 'asignadas'});
            else if (valor.startsWith('proyecto-')) {
                const id = parseInt(valor.replace('proyecto-', ''), 10);
                cambiarFiltro({tipo: 'proyecto', proyectoId: id});
            }
        },
        [cambiarFiltro]
    );

    /* Manejador para limpiar scratchpad */
    const manejarLimpiarScratchpad = useCallback(async () => {
        if (!notas || notas.trim() === '') return;
        const confirmado = await confirmar({
            titulo: 'Limpiar Scratchpad',
            mensaje: '¿Estás seguro de que quieres borrar todo el contenido del Scratchpad? Esta acción no se puede deshacer.',
            textoAceptar: 'Limpiar',
            textoCancelar: 'Cancelar',
            tipo: 'advertencia'
        });
        if (confirmado) actualizarNotas('');
    }, [notas, confirmar, actualizarNotas]);

    /* Crear nueva tarea global */
    const manejarCrearNuevaTareaGlobal = useCallback(
        (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => {
            if (!texto) return;
            const proyectoId = filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined;
            crearTarea({texto, prioridad, configuracion, proyectoId, completado: false});
            modales.cerrarModalNuevaTarea();
        },
        [filtroActual, crearTarea, modales]
    );

    /* Manejadores de proyectos */
    const manejarGuardarNuevoProyecto = useCallback(
        (datos: Parameters<typeof crearProyecto>[0]) => {
            crearProyecto(datos);
            modales.cerrarModalCrearProyecto();
        },
        [crearProyecto, modales]
    );

    const manejarGuardarEdicionProyecto = useCallback(
        (datos: Parameters<typeof crearProyecto>[0]) => {
            if (modales.proyectoEditando) {
                editarProyecto(modales.proyectoEditando.id, datos);
                modales.cerrarModalEditarProyecto();
            }
        },
        [modales.proyectoEditando, editarProyecto, modales]
    );

    /* Click en notificaciones */
    const manejarClickNotificaciones = useCallback(
        (evento: React.MouseEvent) => {
            modales.abrirModalNotificaciones(evento);
            if (!modales.modalNotificacionesAbierto) {
                notificaciones.cargarNotificaciones();
            }
        },
        [modales, notificaciones]
    );

    const manejarClickNotificacionIndividual = useCallback(
        (notificacion: any) => {
            if (notificacion.tipo === 'solicitud_equipo') {
                modales.abrirModalEquipos();
                modales.cerrarModalNotificaciones();
            }
        },
        [modales]
    );

    /* Acciones de experimentos */
    const crearNotificacionPrueba = useCallback(async (): Promise<boolean> => {
        try {
            const nonce = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
            const response = await fetch('/wp-json/glory/v1/notificaciones/test', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-WP-Nonce': nonce},
                body: JSON.stringify({tipo: 'solicitud_equipo', titulo: 'Notificación de prueba', contenido: 'Esta es una notificación de prueba.'})
            });
            const data = await response.json();
            if (data.success) {
                notificaciones.refrescar();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [notificaciones]);

    const accionesExperimentos: AccionExperimento[] = [{id: 'notificacion-prueba', nombre: 'Crear Notificación de Prueba', descripcion: 'Crea una notificación de tipo solicitud_equipo para probar el sistema.', icono: <Bell size={20} />, ejecutar: crearNotificacionPrueba}];

    /* Renderizar contenido de panel */
    const renderizarContenidoPanel = (panelId: PanelId): JSX.Element | null => {
        const handleArrastre = <HandleArrastre panelId={panelId} onMouseDown={iniciarArrastre} estaArrastrando={panelArrastrando === panelId} />;

        switch (panelId) {
            case 'focoPrioritario':
                return (
                    <div className="panelDashboard">
                        <SeccionEncabezado
                            icono={<AlertCircle size={12} />}
                            titulo="Foco Prioritario"
                            acciones={
                                <>
                                    {handleArrastre}
                                    <SelectorBadge opciones={opciones.opcionesOrdenHabitos} valorActual={modoOrdenHabitos} onChange={valor => cambiarModoHabitos(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar hábitos" />
                                    <button className="selectorBadgeBoton" onClick={abrirModalCrearHabito} title="Nuevo Hábito">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={modales.abrirModalConfigHabitos} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </>
                            }
                        />
                        <TablaHabitos habitos={habitosOrdenados} onAñadirHabito={abrirModalCrearHabito} onToggleHabito={toggleHabito} onEditarHabito={abrirModalEditarHabito} onEliminarHabito={eliminarHabito} configuracion={configHabitos} />
                    </div>
                );
            case 'proyectos':
                return (
                    <div className="panelDashboard">
                        <SeccionEncabezado
                            titulo="Proyectos"
                            icono={<Folder size={12} />}
                            acciones={
                                <>
                                    {handleArrastre}
                                    <SelectorBadge opciones={opciones.opcionesOrdenProyectos} valorActual={configProyectos.ordenDefecto} onChange={valor => cambiarOrdenProyectos(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar proyectos" />
                                    <button className="selectorBadgeBoton" onClick={modales.abrirModalCrearProyecto} title="Nuevo Proyecto">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={modales.abrirModalConfigProyectos} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </>
                            }
                        />
                        <ListaProyectos proyectos={proyectos || []} tareas={tareas} onCrearProyecto={modales.abrirModalCrearProyecto} onSeleccionarProyecto={() => {}} onEditarProyecto={modales.abrirModalEditarProyecto} onEliminarProyecto={eliminarProyecto} onCambiarEstadoProyecto={cambiarEstadoProyecto} onCompartirProyecto={compartir.manejarCompartirProyecto} estaCompartido={compartir.estaCompartidoProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} ocultarCompletados={configProyectos.ocultarCompletados} ordenDefecto={configProyectos.ordenDefecto} mostrarProgreso={configProyectos.mostrarProgreso} />
                    </div>
                );
            case 'ejecucion':
                return (
                    <div className="panelDashboard internaColumna">
                        <SeccionEncabezado
                            icono={<Terminal size={12} />}
                            titulo="Ejecucion"
                            acciones={
                                <div style={{display: 'flex', gap: '8px'}}>
                                    {handleArrastre}
                                    <SelectorBadge opciones={opciones.opcionesFiltro} valorActual={valorFiltroActual} onChange={manejarCambioFiltro} titulo="Filtrar tareas" />
                                    <SelectorBadge opciones={opciones.opcionesOrdenTareas} valorActual={modoOrden} onChange={valor => cambiarModoOrden(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar tareas" />
                                    <button className="selectorBadgeBoton" onClick={modales.abrirModalNuevaTarea} title="Nueva Tarea">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={modales.abrirModalConfigTareas} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </div>
                            }
                        />
                        <ListaTareas tareas={tareasFinales} proyectoId={filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined} proyectos={proyectos || []} ocultarCompletadas={configTareas.ocultarCompletadas} ocultarBadgeProyecto={configTareas.ocultarBadgeProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={esOrdenManual ? reordenarTareas : undefined} habilitarDrag={esOrdenManual} onCompartirTarea={compartir.manejarCompartirTarea} estaCompartida={compartir.estaCompartidaTarea} obtenerParticipantes={compartir.obtenerParticipantesTarea} />
                    </div>
                );
            case 'scratchpad':
                return (
                    <div className="panelDashboard internaColumna">
                        <SeccionEncabezado
                            icono={<FileText size={12} />}
                            titulo="Scratchpad"
                            subtitulo="markdown supported"
                            acciones={
                                <>
                                    {handleArrastre}
                                    <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={manejarLimpiarScratchpad} title="Limpiar notas">
                                        <span className="selectorBadgeIcono">
                                            <Eraser size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={modales.abrirModalConfigScratchpad} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </>
                            }
                        />
                        <Scratchpad valorInicial={notas} onChange={actualizarNotas} tamanoFuente={configScratchpad.tamanoFuente} altura={configScratchpad.altura} delayGuardado={configScratchpad.autoGuardadoIntervalo} />
                    </div>
                );
            default:
                return null;
        }
    };

    /* Renderizar panel con wrapper */
    const renderizarPanel = (panelId: PanelId): JSX.Element => (
        <PanelArrastrable key={panelId} panelId={panelId} innerRef={el => registrarPanel(panelId, el)} esArrastrando={panelArrastrando === panelId} esDestino={zonaDropActiva?.panelId === panelId} posicionDestino={zonaDropActiva?.panelId === panelId ? zonaDropActiva.posicion : null}>
            {renderizarContenidoPanel(panelId)}
        </PanelArrastrable>
    );

    /* Renderizar columna */
    const renderizarColumna = (columna: 1 | 2 | 3): JSX.Element[] => obtenerPanelesColumna(columna).map(panelId => renderizarPanel(panelId));

    if (authLoading && !modales.modalLoginAbierto) return <IndicadorCarga texto="Autenticando..." />;

    return (
        <div id="dashboard-contenedor" className="dashboardContenedor">
            <DashboardEncabezado titulo={titulo} version={version} usuario={user ? user.name : usuario} avatarUrl={user?.avatarUrl} sincronizacion={{...sincronizacion, onLogin: modales.abrirModalLogin, onLogout: logout, estaLogueado: !!user}} suscripcion={suscripcion} esAdmin={esAdmin} equiposPendientes={equipos.pendientes} notificacionesPendientes={notificaciones.noLeidas} onClickPlan={modales.abrirModalUpgrade} onClickSeguridad={modales.abrirPanelSeguridad} onClickAdmin={modales.abrirPanelAdmin} onClickLayout={modales.abrirModalConfigLayout} onClickVersion={modales.abrirModalVersiones} onClickUsuario={modales.abrirModalPerfil} onClickEquipos={modales.abrirModalEquipos} onClickNotificaciones={manejarClickNotificaciones} onClickExperimentos={esAdmin ? modales.abrirModalExperimentos : undefined} />

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

            {/* Modales de Auth y Upgrade */}
            <ModalLogin estaAbierto={modales.modalLoginAbierto} onCerrar={modales.cerrarModalLogin} onLoginGoogle={loginWithGoogle} onLoginCredentials={loginWithCredentials} onRegister={register} loading={authLoading} error={authError} />
            <ModalUpgrade visible={modales.modalUpgradeAbierto} onCerrar={modales.cerrarModalUpgrade} suscripcion={suscripcion} />
            <PanelSeguridad visible={modales.panelSeguridadAbierto} onCerrar={modales.cerrarPanelSeguridad} />

            {/* Modales de Notificaciones y Social */}
            {modales.modalNotificacionesAbierto && <ModalNotificaciones notificaciones={notificaciones.notificaciones} noLeidas={notificaciones.noLeidas} total={notificaciones.total} cargando={notificaciones.cargando} posicionX={modales.posicionModalNotificaciones.x} posicionY={modales.posicionModalNotificaciones.y} onMarcarLeida={notificaciones.marcarLeida} onMarcarTodasLeidas={notificaciones.marcarTodasLeidas} onEliminar={notificaciones.eliminar} onClickNotificacion={manejarClickNotificacionIndividual} onCerrar={modales.cerrarModalNotificaciones} />}
            <ModalEquipos estaAbierto={modales.modalEquiposAbierto} onCerrar={modales.cerrarModalEquipos} />

            {/* Modales de Hábitos */}
            <Modal estaAbierto={modalCrearHabitoAbierto} onCerrar={cerrarModalCrearHabito} titulo="Nuevo Habito">
                <FormularioHabito onGuardar={crearHabito} onCancelar={cerrarModalCrearHabito} />
            </Modal>
            <Modal estaAbierto={habitoEditando !== null} onCerrar={cerrarModalEditarHabito} titulo="Editar Habito">
                {habitoEditando && <FormularioHabito onGuardar={datos => editarHabito(habitoEditando.id, datos)} onCancelar={cerrarModalEditarHabito} onEliminar={() => eliminarHabito(habitoEditando.id)} datosIniciales={{nombre: habitoEditando.nombre, importancia: habitoEditando.importancia, tags: habitoEditando.tags, frecuencia: habitoEditando.frecuencia}} modoEdicion />}
            </Modal>

            {/* Modales de Proyectos */}
            <Modal estaAbierto={modales.modalCrearProyectoAbierto} onCerrar={modales.cerrarModalCrearProyecto} titulo="Nuevo Proyecto">
                <FormularioProyecto onGuardar={manejarGuardarNuevoProyecto} onCancelar={modales.cerrarModalCrearProyecto} />
            </Modal>
            <Modal estaAbierto={modales.proyectoEditando !== null} onCerrar={modales.cerrarModalEditarProyecto} titulo="Editar Proyecto">
                {modales.proyectoEditando && (
                    <FormularioProyecto
                        onGuardar={manejarGuardarEdicionProyecto}
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

            {/* Modales de Configuración */}
            <ModalConfiguracionTareas estaAbierto={modales.modalConfigTareasAbierto} onCerrar={modales.cerrarModalConfigTareas} configuracion={configTareas} onToggleCompletadas={toggleOcultarCompletadas} onToggleBadgeProyecto={toggleOcultarBadgeProyecto} onToggleEliminarCompletadas={toggleEliminarCompletadasDespuesDeUnDia} />

            <ModalConfiguracionHabitos estaAbierto={modales.modalConfigHabitosAbierto} onCerrar={modales.cerrarModalConfigHabitos} configuracion={configHabitos} onToggleCompletadosHoy={toggleOcultarCompletadosHoy} onToggleModoCompacto={toggleModoCompacto} onToggleColumna={toggleColumnaVisible} />

            <ModalConfiguracionProyectos estaAbierto={modales.modalConfigProyectosAbierto} onCerrar={modales.cerrarModalConfigProyectos} configuracion={configProyectos} onToggleCompletados={toggleOcultarProyectosCompletados} onToggleProgreso={toggleProgresoProyectos} />
            
            <ModalConfiguracionScratchpad estaAbierto={modales.modalConfigScratchpadAbierto} onCerrar={modales.cerrarModalConfigScratchpad} configuracion={configScratchpad} onCambiarFuente={cambiarFuenteScratchpad} onCambiarAltura={cambiarAlturaScratchpad} onCambiarIntervalo={cambiarAutoGuardadoScratchpad} />
            
            <ModalConfiguracionLayout estaAbierto={modales.modalConfigLayoutAbierto} onCerrar={modales.cerrarModalConfigLayout} modoColumnas={modoColumnas} visibilidad={visibilidad} ordenPaneles={ordenPaneles} onCambiarModo={cambiarModoColumnas} onTogglePanel={toggleVisibilidadPanel} onMoverPanelArriba={moverPanelArriba} onMoverPanelAbajo={moverPanelAbajo} onMoverPanelAColumna={moverPanelAColumna} onResetearOrden={resetearOrdenPaneles} onResetear={resetearLayout} />

            {/* Otros Modales */}
            <ModalVersiones estaAbierto={modales.modalVersionesAbierto} onCerrar={modales.cerrarModalVersiones} />
            <ModalPerfil estaAbierto={modales.modalPerfilAbierto} onCerrar={modales.cerrarModalPerfil} />
            {esAdmin && <PanelAdministracion estaAbierto={modales.panelAdminAbierto} onCerrar={modales.cerrarPanelAdmin} />}
            <ModalExperimentos abierto={modales.modalExperimentosAbierto} onCerrar={modales.cerrarModalExperimentos} acciones={accionesExperimentos} />

            {/* Modales de Compartir */}
            <ModalCompartir visible={compartir.proyectoCompartiendo !== null} onCerrar={compartir.cerrarModalCompartirProyecto} tipo="proyecto" elementoId={compartir.proyectoCompartiendo?.id ?? 0} elementoNombre={compartir.proyectoCompartiendo?.nombre ?? ''} companeros={equipos.companeros} participantes={compartir.participantesProyecto} cifradoActivo={false} onCompartir={compartir.manejarCompartirElemento} onCambiarRol={compartir.manejarCambiarRolCompartido} onDejarDeCompartir={compartir.manejarDejarDeCompartir} cargandoParticipantes={compartir.cargando} />
            <ModalCompartir visible={compartir.tareaCompartiendo !== null} onCerrar={compartir.cerrarModalCompartirTarea} tipo="tarea" elementoId={compartir.tareaCompartiendo?.id ?? 0} elementoNombre={compartir.tareaCompartiendo?.texto ?? ''} companeros={equipos.companeros} participantes={compartir.participantesTarea} cifradoActivo={false} onCompartir={compartir.manejarCompartirTareaElemento} onCambiarRol={compartir.manejarCambiarRolTareaCompartida} onDejarDeCompartir={compartir.manejarDejarDeCompartir} cargandoParticipantes={compartir.cargando} />

            {/* Nueva Tarea Global */}
            {modales.modalNuevaTareaAbierto && <PanelConfiguracionTarea estaAbierto={modales.modalNuevaTareaAbierto} onCerrar={modales.cerrarModalNuevaTarea} onGuardar={manejarCrearNuevaTareaGlobal} />}

            {/* Toast y Utilidades */}
            {accionDeshacer && <ToastDeshacer mensaje={accionDeshacer.mensaje} tiempoRestante={accionDeshacer.tiempoRestante} tiempoTotal={5000} onDeshacer={ejecutarDeshacer} onDescartar={descartarDeshacer} />}
            <BarraPanelesOcultos panelesOcultos={panelesOcultos} onMostrarPanel={mostrarPanel} />
            <TooltipSystem />
            <IndicadorArrastre panelArrastrando={panelArrastrando} posicionMouse={posicionMouse} />
        </div>
    );
}

export default DashboardIsland;
