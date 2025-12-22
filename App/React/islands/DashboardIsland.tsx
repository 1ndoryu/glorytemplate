/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Compone todos los subcomponentes del dashboard
 */

import {useState, useEffect} from 'react';
import {Terminal, AlertCircle, FileText, Folder, Plus, LayoutGrid} from 'lucide-react';
import {DashboardEncabezado, SeccionEncabezado, TablaHabitos, ListaTareas, Scratchpad, DashboardFooter, AccionesDatos, FormularioHabito, ListaProyectos, FormularioProyecto, ModalLogin, PanelSeguridad, ModalConfiguracionLayout} from '../components/dashboard';
import {ToastDeshacer, ModalUpgrade, TooltipSystem, LayoutManager, BarraPanelesOcultos, PanelArrastrable, HandleArrastre, IndicadorArrastre} from '../components/shared';
import {Modal} from '../components/shared/Modal';
import {PanelAdministracion} from '../components/admin';
import {useDashboard} from '../hooks/useDashboard';
import {useOrdenarHabitos} from '../hooks/useOrdenarHabitos';
import {useAuth} from '../hooks/useAuth';
import {useSuscripcion} from '../hooks/useSuscripcion';
import {useFiltroTareas} from '../hooks/useFiltroTareas';
import {useOrdenarTareas, MODOS_ORDEN_TAREAS} from '../hooks/useOrdenarTareas';
import {useConfiguracionLayout} from '../hooks/useConfiguracionLayout';
import type {PanelId} from '../hooks/useConfiguracionLayout';
import {SelectorBadge} from '../components/shared/SelectorBadge';
import {Filter, LayoutList, CheckSquare, ArrowUpDown, Settings} from 'lucide-react';
import {useConfiguracionTareas} from '../hooks/useConfiguracionTareas';
import {useArrastrePaneles} from '../hooks/useArrastrePaneles';
import {ModalConfiguracionTareas} from '../components/dashboard/ModalConfiguracionTareas';
import type {Proyecto} from '../types/dashboard';

interface DashboardIslandProps {
    titulo?: string;
    version?: string;
    usuario?: string;
}

/*
 * Componente de carga
 * Muestra un indicador mientras se cargan los datos de localStorage
 */
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

export function DashboardIsland({titulo = 'DASHBOARD_01', version = 'v1.0.0-beta', usuario = 'user@admin'}: DashboardIslandProps): JSX.Element {
    const {habitos, tareas, notas, proyectos, toggleTarea, crearTarea, editarTarea, eliminarTarea, crearProyecto, editarProyecto, eliminarProyecto, cambiarEstadoProyecto, actualizarNotas, toggleHabito, crearHabito, editarHabito, eliminarHabito, modalCrearHabitoAbierto, abrirModalCrearHabito, cerrarModalCrearHabito, habitoEditando, abrirModalEditarHabito, cerrarModalEditarHabito, exportarTodosDatos, importarTodosDatos, importando, mensajeEstado, tipoMensaje, cargandoDatos, accionDeshacer, ejecutarDeshacer, descartarDeshacer, reordenarTareas, sincronizacion} = useDashboard();

    /* Auth */
    const {loginWithGoogle, loginWithCredentials, register, handleCallback, logout, loading: authLoading, error: authError, user} = useAuth();
    const [modalLoginAbierto, setModalLoginAbierto] = useState(false);

    /* Suscripcion */
    const {suscripcion} = useSuscripcion();
    const [modalUpgradeAbierto, setModalUpgradeAbierto] = useState(false);

    /* Seguridad */
    const [panelSeguridadAbierto, setPanelSeguridadAbierto] = useState(false);

    /* Administración (solo si es admin) */
    const esAdmin = Boolean((window as unknown as {gloryDashboard?: {esAdmin?: boolean}}).gloryDashboard?.esAdmin);
    const [panelAdminAbierto, setPanelAdminAbierto] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            handleCallback(code);
        }
    }, [handleCallback]);

    /* Sistema de ordenamiento de habitos */

    const {habitosOrdenados, modoActual, cambiarModo, modosDisponibles} = useOrdenarHabitos(habitos);
    const modoInfo = modosDisponibles.find(m => m.id === modoActual);

    /* Opciones para SelectorBadge de hábitos */
    const opcionesOrdenHabitos = modosDisponibles.map(m => ({
        id: m.id,
        etiqueta: m.etiqueta,
        descripcion: m.descripcion
    }));

    /* Estado de proyectos */
    const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number | null>(null);
    const [modalCrearProyectoAbierto, setModalCrearProyectoAbierto] = useState(false);
    const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null);

    /* Tareas sueltas (sin proyecto) para mostrar en Ejecucion */
    const {filtroActual, cambiarFiltro, tareasFiltradas, infoFiltro} = useFiltroTareas(tareas, proyectos || []);

    /* Generar opciones para el selector */
    const opcionesFiltro = [
        {id: 'sueltas', etiqueta: 'Tareas sueltas', icono: <CheckSquare size={12} />, descripcion: 'Sin proyecto'},
        {id: 'todas', etiqueta: 'Todas las tareas', icono: <LayoutList size={12} />, descripcion: 'Todas'},
        ...(proyectos || []).map(p => ({
            id: `proyecto-${p.id}`,
            etiqueta: p.nombre,
            icono: <Folder size={12} />,
            descripcion: (p.descripcion || '').length > 25 ? (p.descripcion || '').substring(0, 25) + '...' : p.descripcion || ''
        }))
    ];

    const manejarCambioFiltro = (valor: string) => {
        if (valor === 'sueltas') cambiarFiltro({tipo: 'sueltas'});
        else if (valor === 'todas') cambiarFiltro({tipo: 'todas'});
        else if (valor.startsWith('proyecto-')) {
            const id = parseInt(valor.replace('proyecto-', ''), 10);
            cambiarFiltro({tipo: 'proyecto', proyectoId: id});
        }
    };

    /* Configuracion de tareas */
    const {configuracion: configTareas, toggleOcultarCompletadas, toggleOcultarBadgeProyecto} = useConfiguracionTareas();
    const [modalConfigTareasAbierto, setModalConfigTareasAbierto] = useState(false);

    /* Configuracion de layout */
    const {modoColumnas, anchos, visibilidad, ordenPaneles, panelesOcultos, cambiarModoColumnas, ajustarAnchos, toggleVisibilidadPanel, mostrarPanel, resetearLayout, obtenerPanelesColumna, moverPanelArriba, moverPanelAbajo, moverPanelAColumna, resetearOrdenPaneles, reordenarPanel} = useConfiguracionLayout();
    const [modalConfigLayoutAbierto, setModalConfigLayoutAbierto] = useState(false);

    /* Sistema de arrastre de paneles */
    const {panelArrastrando, posicionMouse, zonaDropActiva, iniciarArrastre, registrarPanel} = useArrastrePaneles(ordenPaneles, reordenarPanel);

    /* Calcular valor actual para el selector */
    const valorFiltroActual = filtroActual.tipo === 'proyecto' ? `proyecto-${filtroActual.proyectoId}` : filtroActual.tipo;

    /* Ordenamiento de tareas */
    const {tareasOrdenadas: tareasFinales, modoActual: modoOrden, cambiarModo: cambiarModoOrden, esOrdenManual} = useOrdenarTareas(tareasFiltradas);

    /* Adaptar opciones de orden para SelectorBadge */
    const opcionesOrden = MODOS_ORDEN_TAREAS.map(m => ({
        id: m.id,
        etiqueta: m.etiqueta,
        descripcion: m.descripcion
    }));

    /* Manejadores de proyectos */
    const manejarCrearProyecto = () => {
        setModalCrearProyectoAbierto(true);
    };

    const manejarGuardarNuevoProyecto = (datos: Parameters<typeof crearProyecto>[0]) => {
        crearProyecto(datos);
        setModalCrearProyectoAbierto(false);
    };

    const manejarEditarProyecto = (proyecto: Proyecto) => {
        setProyectoEditando(proyecto);
    };

    const manejarGuardarEdicionProyecto = (datos: Parameters<typeof crearProyecto>[0]) => {
        if (proyectoEditando) {
            editarProyecto(proyectoEditando.id, datos);
            setProyectoEditando(null);
        }
    };

    const manejarEliminarProyecto = (id: number) => {
        eliminarProyecto(id);
        if (proyectoSeleccionadoId === id) {
            setProyectoSeleccionadoId(null);
        }
    };

    /*
     * Renderiza el contenido interno de un panel según su ID
     * Incluye el HandleArrastre en cada SeccionEncabezado
     */
    const renderizarContenidoPanel = (panelId: PanelId): JSX.Element | null => {
        /* Handle de arrastre común para todos los paneles */
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
                                    <SelectorBadge opciones={opcionesOrdenHabitos} valorActual={modoActual} onChange={valor => cambiarModo(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar hábitos" />
                                </>
                            }
                        />
                        <TablaHabitos habitos={habitosOrdenados} onAñadirHabito={abrirModalCrearHabito} onToggleHabito={toggleHabito} onEditarHabito={abrirModalEditarHabito} onEliminarHabito={eliminarHabito} />
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
                                    <button className="selectorBadgeBoton" onClick={manejarCrearProyecto} title="Nuevo Proyecto">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                        <span className="selectorBadgeTexto">Nuevo</span>
                                    </button>
                                </>
                            }
                        />
                        <ListaProyectos proyectos={proyectos || []} tareas={tareas} onCrearProyecto={manejarCrearProyecto} onSeleccionarProyecto={setProyectoSeleccionadoId} proyectoSeleccionadoId={proyectoSeleccionadoId} onEditarProyecto={manejarEditarProyecto} onEliminarProyecto={manejarEliminarProyecto} onCambiarEstadoProyecto={cambiarEstadoProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} />
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
                                    <SelectorBadge opciones={opcionesFiltro} valorActual={valorFiltroActual} onChange={manejarCambioFiltro} titulo="Filtrar tareas" />
                                    <SelectorBadge opciones={opcionesOrden} valorActual={modoOrden} onChange={valor => cambiarModoOrden(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar tareas" />
                                    <button className="selectorBadgeBoton" onClick={() => setModalConfigTareasAbierto(true)} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </div>
                            }
                        />
                        <ListaTareas tareas={tareasFinales} proyectoId={filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined} proyectos={proyectos || []} ocultarCompletadas={configTareas.ocultarCompletadas} ocultarBadgeProyecto={configTareas.ocultarBadgeProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={esOrdenManual ? reordenarTareas : undefined} habilitarDrag={esOrdenManual} />
                    </div>
                );

            case 'scratchpad':
                return (
                    <div className="panelDashboard internaColumna">
                        <SeccionEncabezado icono={<FileText size={12} />} titulo="Scratchpad" subtitulo="markdown supported" acciones={handleArrastre} />
                        <Scratchpad valorInicial={notas} onChange={actualizarNotas} />
                    </div>
                );

            default:
                return null;
        }
    };

    /*
     * Renderiza un panel envuelto en PanelArrastrable
     */
    const renderizarPanel = (panelId: PanelId): JSX.Element => {
        return (
            <PanelArrastrable key={panelId} panelId={panelId} innerRef={el => registrarPanel(panelId, el)} esArrastrando={panelArrastrando === panelId} esDestino={zonaDropActiva?.panelId === panelId} posicionDestino={zonaDropActiva?.panelId === panelId ? zonaDropActiva.posicion : null}>
                {renderizarContenidoPanel(panelId)}
            </PanelArrastrable>
        );
    };

    /*
     * Renderiza los paneles de una columna
     */
    const renderizarColumna = (columna: 1 | 2 | 3): JSX.Element[] => {
        const panelesColumna = obtenerPanelesColumna(columna);
        return panelesColumna.map(panelId => renderizarPanel(panelId));
    };

    if (authLoading && !modalLoginAbierto) {
        // Solo mostrar carga pantalla completa si no es modal
        return <IndicadorCarga texto="Autenticando..." />;
    }

    return (
        <div id="dashboard-contenedor" className="dashboardContenedor">
            <DashboardEncabezado
                titulo={titulo}
                version={version}
                usuario={user ? user.name : usuario}
                sincronizacion={{
                    ...sincronizacion,
                    onLogin: () => setModalLoginAbierto(true),
                    onLogout: logout,
                    estaLogueado: !!user
                }}
                suscripcion={suscripcion}
                esAdmin={esAdmin}
                onClickPlan={() => setModalUpgradeAbierto(true)}
                onClickSeguridad={() => setPanelSeguridadAbierto(true)}
                onClickAdmin={() => setPanelAdminAbierto(true)}
                onClickLayout={() => setModalConfigLayoutAbierto(true)}
            />

            {cargandoDatos ? (
                <IndicadorCarga />
            ) : (
                <div className={`dashboardGrid dashboardGrid--${modoColumnas}col ${panelArrastrando ? 'arrastrandoPanel' : ''}`}>
                    {/* Columna 1 */}
                    <div className="columnaDashboard">{renderizarColumna(1)}</div>

                    {/* Columna 2 (si modoColumnas >= 2) */}
                    {modoColumnas >= 2 && (
                        <div className="columnaDashboard">
                            {renderizarColumna(2)}

                            {/* Acciones de Datos siempre al final de la última columna */}
                            {modoColumnas === 2 && <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />}
                        </div>
                    )}

                    {/* Columna 3 (si modoColumnas === 3) */}
                    {modoColumnas === 3 && (
                        <div className="columnaDashboard">
                            {renderizarColumna(3)}

                            {/* Acciones de Datos siempre al final de la última columna */}
                            <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />
                        </div>
                    )}

                    {/* Acciones de Datos para modo 1 columna */}
                    {modoColumnas === 1 && <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />}
                </div>
            )}

            <DashboardFooter />

            <ModalLogin estaAbierto={modalLoginAbierto} onCerrar={() => setModalLoginAbierto(false)} onLoginGoogle={loginWithGoogle} onLoginCredentials={loginWithCredentials} onRegister={register} loading={authLoading} error={authError} />

            {/* Modal para crear nuevo habito */}
            <Modal estaAbierto={modalCrearHabitoAbierto} onCerrar={cerrarModalCrearHabito} titulo="Nuevo Habito">
                <FormularioHabito onGuardar={crearHabito} onCancelar={cerrarModalCrearHabito} />
            </Modal>

            {/* Modal para editar habito */}
            <Modal estaAbierto={habitoEditando !== null} onCerrar={cerrarModalEditarHabito} titulo="Editar Habito">
                {habitoEditando && (
                    <FormularioHabito
                        onGuardar={datos => editarHabito(habitoEditando.id, datos)}
                        onCancelar={cerrarModalEditarHabito}
                        onEliminar={() => eliminarHabito(habitoEditando.id)}
                        datosIniciales={{
                            nombre: habitoEditando.nombre,
                            importancia: habitoEditando.importancia,
                            tags: habitoEditando.tags,
                            frecuencia: habitoEditando.frecuencia
                        }}
                        modoEdicion
                    />
                )}
            </Modal>

            {/* Modal para crear nuevo proyecto */}
            <Modal estaAbierto={modalCrearProyectoAbierto} onCerrar={() => setModalCrearProyectoAbierto(false)} titulo="Nuevo Proyecto">
                <FormularioProyecto onGuardar={manejarGuardarNuevoProyecto} onCancelar={() => setModalCrearProyectoAbierto(false)} />
            </Modal>

            {/* Modal para editar proyecto */}
            <Modal estaAbierto={proyectoEditando !== null} onCerrar={() => setProyectoEditando(null)} titulo="Editar Proyecto">
                {proyectoEditando && (
                    <FormularioProyecto
                        onGuardar={manejarGuardarEdicionProyecto}
                        onCancelar={() => setProyectoEditando(null)}
                        onEliminar={() => {
                            eliminarProyecto(proyectoEditando.id);
                            setProyectoEditando(null);
                            setProyectoSeleccionadoId(null);
                        }}
                        datosIniciales={{
                            nombre: proyectoEditando.nombre,
                            descripcion: proyectoEditando.descripcion,
                            prioridad: proyectoEditando.prioridad,
                            fechaLimite: proyectoEditando.fechaLimite
                        }}
                        modoEdicion
                    />
                )}
            </Modal>

            {/* Toast de deshacer */}
            {accionDeshacer && <ToastDeshacer mensaje={accionDeshacer.mensaje} tiempoRestante={accionDeshacer.tiempoRestante} tiempoTotal={5000} onDeshacer={ejecutarDeshacer} onDescartar={descartarDeshacer} />}

            {/* Modal de upgrade */}
            <ModalUpgrade visible={modalUpgradeAbierto} onCerrar={() => setModalUpgradeAbierto(false)} suscripcion={suscripcion} />

            {/* Panel de Seguridad */}
            <PanelSeguridad visible={panelSeguridadAbierto} onCerrar={() => setPanelSeguridadAbierto(false)} />

            {/* Modal configuracion tareas */}
            <ModalConfiguracionTareas estaAbierto={modalConfigTareasAbierto} onCerrar={() => setModalConfigTareasAbierto(false)} configuracion={configTareas} onToggleCompletadas={toggleOcultarCompletadas} onToggleBadgeProyecto={toggleOcultarBadgeProyecto} />

            {/* Panel de Administración */}
            {esAdmin && <PanelAdministracion estaAbierto={panelAdminAbierto} onCerrar={() => setPanelAdminAbierto(false)} />}

            {/* Modal configuracion de layout */}
            <ModalConfiguracionLayout estaAbierto={modalConfigLayoutAbierto} onCerrar={() => setModalConfigLayoutAbierto(false)} modoColumnas={modoColumnas} visibilidad={visibilidad} ordenPaneles={ordenPaneles} onCambiarModo={cambiarModoColumnas} onTogglePanel={toggleVisibilidadPanel} onMoverPanelArriba={moverPanelArriba} onMoverPanelAbajo={moverPanelAbajo} onMoverPanelAColumna={moverPanelAColumna} onResetearOrden={resetearOrdenPaneles} onResetear={resetearLayout} />

            {/* Barra de paneles ocultos */}
            <BarraPanelesOcultos panelesOcultos={panelesOcultos} onMostrarPanel={mostrarPanel} />

            {/* Sistema Global de Tooltips */}
            <TooltipSystem />

            {/* Indicador de arrastre flotante */}
            <IndicadorArrastre panelArrastrando={panelArrastrando} posicionMouse={posicionMouse} />
        </div>
    );
}

export default DashboardIsland;
