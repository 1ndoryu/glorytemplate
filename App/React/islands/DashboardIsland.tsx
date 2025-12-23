/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Compone todos los subcomponentes del dashboard
 */

import {useState, useEffect} from 'react';
import {Terminal, AlertCircle, FileText, Folder, Plus, LayoutGrid, Eraser} from 'lucide-react';
import {DashboardEncabezado, SeccionEncabezado, TablaHabitos, ListaTareas, Scratchpad, DashboardFooter, AccionesDatos, FormularioHabito, ListaProyectos, FormularioProyecto, ModalLogin, PanelSeguridad, ModalConfiguracionLayout, PanelConfiguracionTarea, ModalConfiguracionProyectos, ModalPerfil} from '../components/dashboard';
import {ToastDeshacer, ModalUpgrade, TooltipSystem, LayoutManager, BarraPanelesOcultos, PanelArrastrable, HandleArrastre, IndicadorArrastre, ModalVersiones} from '../components/shared';
import {Modal} from '../components/shared/Modal';
import {PanelAdministracion} from '../components/admin';
import {ModalEquipos} from '../components/equipos';
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
import {useConfiguracionHabitos} from '../hooks/useConfiguracionHabitos';
import {useConfiguracionProyectos} from '../hooks/useConfiguracionProyectos';
import {useConfiguracionScratchpad} from '../hooks/useConfiguracionScratchpad';
import {useArrastrePaneles} from '../hooks/useArrastrePaneles';
import {useEquipos} from '../hooks/useEquipos';
import {useNotificaciones} from '../hooks/useNotificaciones';
import {useCompartidos} from '../hooks/useCompartidos';
import {ModalNotificaciones} from '../components/notificaciones';
import {ModalCompartir} from '../components/compartidos';
import {ModalExperimentos} from '../components/experimentos/ModalExperimentos';
import type {AccionExperimento} from '../components/experimentos/ModalExperimentos';
import {useAlertasContext} from '../context/AlertasContext';
import {ModalConfiguracionTareas} from '../components/dashboard/ModalConfiguracionTareas';
import {ModalConfiguracionHabitos} from '../components/dashboard/ModalConfiguracionHabitos';
import {ModalConfiguracionScratchpad} from '../components/dashboard/ModalConfiguracionScratchpad';
import type {Proyecto, Tarea, TareaConfiguracion, NivelPrioridad, RolCompartido, Participante} from '../types/dashboard';
import {Bell} from 'lucide-react';
import '../styles/dashboard/componentes/experimentos.css';

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

export function DashboardIsland({titulo = 'DASHBOARD_01', version = 'v1.0.1-beta', usuario = 'user@admin'}: DashboardIslandProps): JSX.Element {
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

    /* Perfil de Usuario */
    const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false);

    /* Equipos (Social) */
    const equipos = useEquipos();
    const [modalEquiposAbierto, setModalEquiposAbierto] = useState(false);

    /* Compartidos */
    const compartidos = useCompartidos();
    const [proyectoCompartiendo, setProyectoCompartiendo] = useState<Proyecto | null>(null);
    const [participantesProyecto, setParticipantesProyecto] = useState<Participante[]>([]);
    const [tareaCompartiendo, setTareaCompartiendo] = useState<Tarea | null>(null);
    const [participantesTarea, setParticipantesTarea] = useState<Participante[]>([]);

    /* Notificaciones */
    const notificaciones = useNotificaciones(Boolean(user));
    const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
    const [posicionModalNotificaciones, setPosicionModalNotificaciones] = useState({x: 0, y: 0});

    const manejarClickNotificaciones = (evento: React.MouseEvent) => {
        const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
        setPosicionModalNotificaciones({
            x: rect.right - 360,
            y: rect.bottom + 10
        });
        setModalNotificacionesAbierto(!modalNotificacionesAbierto);

        // Cargar notificaciones al abrir
        if (!modalNotificacionesAbierto) {
            notificaciones.cargarNotificaciones();
        }
    };

    const manejarClickNotificacionIndividual = (notificacion: any) => {
        // Lógica específica por tipo de notificación
        if (notificacion.tipo === 'solicitud_equipo') {
            setModalEquiposAbierto(true);
            setModalNotificacionesAbierto(false);
        }
        // Futuro: manejar otros tipos (ir a tarea, proyecto, etc)
    };

    /* Modal de Experimentos (solo admins) */
    const [modalExperimentosAbierto, setModalExperimentosAbierto] = useState(false);

    /* Acción: Crear notificación de prueba */
    const crearNotificacionPrueba = async (): Promise<boolean> => {
        try {
            const nonce = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
            const response = await fetch('/wp-json/glory/v1/notificaciones/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify({
                    tipo: 'solicitud_equipo',
                    titulo: 'Notificación de prueba',
                    contenido: 'Esta es una notificación de prueba para verificar el sistema.'
                })
            });
            const data = await response.json();
            if (data.success) {
                notificaciones.refrescar();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error al crear notificación de prueba:', err);
            return false;
        }
    };

    /* Lista de acciones de experimentos */
    const accionesExperimentos: AccionExperimento[] = [
        {
            id: 'notificacion-prueba',
            nombre: 'Crear Notificación de Prueba',
            descripcion: 'Crea una notificación de tipo solicitud_equipo para probar el sistema.',
            icono: <Bell size={20} />,
            ejecutar: crearNotificacionPrueba
        }
    ];

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

    /* Configuracion de proyectos */
    const {configuracion: configProyectos, toggleOcultarCompletados: toggleOcultarProyectosCompletados, cambiarOrdenDefecto: cambiarOrdenProyectos, toggleMostrarProgreso: toggleProgresoProyectos} = useConfiguracionProyectos();
    const [modalConfigProyectosAbierto, setModalConfigProyectosAbierto] = useState(false);

    /* Opciones para SelectorBadge de proyectos */
    const opcionesOrdenProyectos = [
        {id: 'nombre', etiqueta: 'Nombre', descripcion: 'Alfabético'},
        {id: 'fecha', etiqueta: 'Fecha Límite', descripcion: 'Vencimiento'},
        {id: 'prioridad', etiqueta: 'Prioridad', descripcion: 'Importancia'}
    ];

    /* Configuracion de scratchpad */
    const {configuracion: configScratchpad, cambiarTamanoFuente: cambiarFuenteScratchpad, cambiarAltura: cambiarAlturaScratchpad, cambiarAutoGuardado: cambiarAutoGuardadoScratchpad} = useConfiguracionScratchpad();
    const [modalConfigScratchpadAbierto, setModalConfigScratchpadAbierto] = useState(false);

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
    const {configuracion: configTareas, toggleOcultarCompletadas, toggleOcultarBadgeProyecto, toggleEliminarCompletadasDespuesDeUnDia} = useConfiguracionTareas();
    const [modalConfigTareasAbierto, setModalConfigTareasAbierto] = useState(false);

    /* Configuracion de habitos */
    const {configuracion: configHabitos, toggleOcultarCompletadosHoy, toggleModoCompacto, toggleColumnaVisible} = useConfiguracionHabitos();
    const [modalConfigHabitosAbierto, setModalConfigHabitosAbierto] = useState(false);

    /* Configuracion de layout */
    const {modoColumnas, anchos, visibilidad, ordenPaneles, panelesOcultos, cambiarModoColumnas, ajustarAnchos, toggleVisibilidadPanel, mostrarPanel, resetearLayout, obtenerPanelesColumna, moverPanelArriba, moverPanelAbajo, moverPanelAColumna, resetearOrdenPaneles, reordenarPanel} = useConfiguracionLayout();
    const [modalConfigLayoutAbierto, setModalConfigLayoutAbierto] = useState(false);

    /* Modal historial de versiones */
    const [modalVersionesAbierto, setModalVersionesAbierto] = useState(false);

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

    /* Manejador para compartir proyecto */
    const manejarCompartirProyecto = async (proyecto: Proyecto) => {
        setProyectoCompartiendo(proyecto);
        /* Cargar participantes del proyecto */
        const parts = await compartidos.obtenerParticipantes('proyecto', proyecto.id);
        setParticipantesProyecto(parts);
    };

    /* Handlers para el modal de compartir */
    const manejarCompartirElemento = async (usuarioId: number, rol: RolCompartido): Promise<boolean> => {
        if (!proyectoCompartiendo) return false;
        const exito = await compartidos.compartir('proyecto', proyectoCompartiendo.id, usuarioId, rol);
        if (exito) {
            /* Recargar participantes */
            const parts = await compartidos.obtenerParticipantes('proyecto', proyectoCompartiendo.id);
            setParticipantesProyecto(parts);
        }
        return exito;
    };

    const manejarCambiarRolCompartido = async (compartidoId: number, nuevoRol: RolCompartido): Promise<boolean> => {
        const exito = await compartidos.actualizarRol(compartidoId, nuevoRol);
        if (exito && proyectoCompartiendo) {
            const parts = await compartidos.obtenerParticipantes('proyecto', proyectoCompartiendo.id);
            setParticipantesProyecto(parts);
        }
        return exito;
    };

    const manejarDejarDeCompartir = async (compartidoId: number): Promise<boolean> => {
        const exito = await compartidos.dejarDeCompartir(compartidoId);
        if (exito && proyectoCompartiendo) {
            const parts = await compartidos.obtenerParticipantes('proyecto', proyectoCompartiendo.id);
            setParticipantesProyecto(parts);
        }
        if (exito && tareaCompartiendo) {
            const parts = await compartidos.obtenerParticipantes('tarea', tareaCompartiendo.id);
            setParticipantesTarea(parts);
        }
        return exito;
    };

    /* Manejador para compartir tarea */
    const manejarCompartirTarea = async (tarea: Tarea) => {
        setTareaCompartiendo(tarea);
        /* Cargar participantes de la tarea */
        const parts = await compartidos.obtenerParticipantes('tarea', tarea.id);
        setParticipantesTarea(parts);
    };

    /* Handlers para el modal de compartir tarea */
    const manejarCompartirTareaElemento = async (usuarioId: number, rol: RolCompartido): Promise<boolean> => {
        if (!tareaCompartiendo) return false;
        const exito = await compartidos.compartir('tarea', tareaCompartiendo.id, usuarioId, rol);
        if (exito) {
            /* Recargar participantes */
            const parts = await compartidos.obtenerParticipantes('tarea', tareaCompartiendo.id);
            setParticipantesTarea(parts);
        }
        return exito;
    };

    const manejarCambiarRolTareaCompartida = async (compartidoId: number, nuevoRol: RolCompartido): Promise<boolean> => {
        const exito = await compartidos.actualizarRol(compartidoId, nuevoRol);
        if (exito && tareaCompartiendo) {
            const parts = await compartidos.obtenerParticipantes('tarea', tareaCompartiendo.id);
            setParticipantesTarea(parts);
        }
        return exito;
    };

    /* Estado para modal de nueva tarea global */
    const [modalNuevaTareaAbierto, setModalNuevaTareaAbierto] = useState(false);

    /* Manejadores de acciones globales */
    const manejarNuevaTarea = () => {
        setModalNuevaTareaAbierto(true);
    };

    const manejarCrearNuevaTareaGlobal = (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => {
        if (!texto) return;

        // Asignar al proyecto filtrado actualmente si existe
        const proyectoId = filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined;

        crearTarea({
            texto,
            prioridad,
            configuracion,
            proyectoId,
            completado: false
        });

        setModalNuevaTareaAbierto(false);
    };

    const {confirmar} = useAlertasContext();

    const manejarLimpiarScratchpad = async () => {
        if (!notas || notas.trim() === '') return;

        const confirmado = await confirmar({
            titulo: 'Limpiar Scratchpad',
            mensaje: '¿Estás seguro de que quieres borrar todo el contenido del Scratchpad? Esta acción no se puede deshacer.',
            textoAceptar: 'Limpiar',
            textoCancelar: 'Cancelar',
            tipo: 'advertencia'
        });

        if (confirmado) {
            actualizarNotas('');
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
                                    <button className="selectorBadgeBoton" onClick={abrirModalCrearHabito} title="Nuevo Hábito">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={() => setModalConfigHabitosAbierto(true)} title="Configuración">
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
                                    <SelectorBadge opciones={opcionesOrdenProyectos} valorActual={configProyectos.ordenDefecto} onChange={valor => cambiarOrdenProyectos(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar proyectos" />
                                    <button className="selectorBadgeBoton" onClick={manejarCrearProyecto} title="Nuevo Proyecto">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={() => setModalConfigProyectosAbierto(true)} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </>
                            }
                        />
                        <ListaProyectos proyectos={proyectos || []} tareas={tareas} onCrearProyecto={manejarCrearProyecto} onSeleccionarProyecto={setProyectoSeleccionadoId} proyectoSeleccionadoId={proyectoSeleccionadoId} onEditarProyecto={manejarEditarProyecto} onEliminarProyecto={manejarEliminarProyecto} onCambiarEstadoProyecto={cambiarEstadoProyecto} onCompartirProyecto={manejarCompartirProyecto} estaCompartido={id => compartidos.estaCompartido('proyecto', id)} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} ocultarCompletados={configProyectos.ocultarCompletados} ordenDefecto={configProyectos.ordenDefecto} mostrarProgreso={configProyectos.mostrarProgreso} />
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
                                    <button className="selectorBadgeBoton" onClick={manejarNuevaTarea} title="Nueva Tarea">
                                        <span className="selectorBadgeIcono">
                                            <Plus size={10} />
                                        </span>
                                    </button>
                                    <button className="selectorBadgeBoton" onClick={() => setModalConfigTareasAbierto(true)} title="Configuración">
                                        <span className="selectorBadgeIcono">
                                            <Settings size={10} />
                                        </span>
                                    </button>
                                </div>
                            }
                        />
                        <ListaTareas tareas={tareasFinales} proyectoId={filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined} proyectos={proyectos || []} ocultarCompletadas={configTareas.ocultarCompletadas} ocultarBadgeProyecto={configTareas.ocultarBadgeProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={esOrdenManual ? reordenarTareas : undefined} habilitarDrag={esOrdenManual} onCompartirTarea={manejarCompartirTarea} estaCompartida={id => compartidos.estaCompartido('tarea', id)} />
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
                                    <button className="selectorBadgeBoton" onClick={() => setModalConfigScratchpadAbierto(true)} title="Configuración">
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
                avatarUrl={user?.avatarUrl}
                sincronizacion={{
                    ...sincronizacion,
                    onLogin: () => setModalLoginAbierto(true),
                    onLogout: logout,
                    estaLogueado: !!user
                }}
                suscripcion={suscripcion}
                esAdmin={esAdmin}
                equiposPendientes={equipos.pendientes}
                notificacionesPendientes={notificaciones.noLeidas}
                onClickPlan={() => setModalUpgradeAbierto(true)}
                onClickSeguridad={() => setPanelSeguridadAbierto(true)}
                onClickAdmin={() => setPanelAdminAbierto(true)}
                onClickLayout={() => setModalConfigLayoutAbierto(true)}
                onClickVersion={() => setModalVersionesAbierto(true)}
                onClickUsuario={() => setModalPerfilAbierto(true)}
                onClickEquipos={() => setModalEquiposAbierto(true)}
                onClickNotificaciones={manejarClickNotificaciones}
                onClickExperimentos={esAdmin ? () => setModalExperimentosAbierto(true) : undefined}
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

            {/* Modal de Notificaciones (Dropdown) */}
            {modalNotificacionesAbierto && <ModalNotificaciones notificaciones={notificaciones.notificaciones} noLeidas={notificaciones.noLeidas} total={notificaciones.total} cargando={notificaciones.cargando} posicionX={posicionModalNotificaciones.x} posicionY={posicionModalNotificaciones.y} onMarcarLeida={notificaciones.marcarLeida} onMarcarTodasLeidas={notificaciones.marcarTodasLeidas} onEliminar={notificaciones.eliminar} onClickNotificacion={manejarClickNotificacionIndividual} onCerrar={() => setModalNotificacionesAbierto(false)} />}

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
            <ModalConfiguracionTareas estaAbierto={modalConfigTareasAbierto} onCerrar={() => setModalConfigTareasAbierto(false)} configuracion={configTareas} onToggleCompletadas={toggleOcultarCompletadas} onToggleBadgeProyecto={toggleOcultarBadgeProyecto} onToggleEliminarCompletadas={toggleEliminarCompletadasDespuesDeUnDia} />

            {/* Modal configuracion habitos */}
            <ModalConfiguracionHabitos estaAbierto={modalConfigHabitosAbierto} onCerrar={() => setModalConfigHabitosAbierto(false)} configuracion={configHabitos} onToggleCompletadosHoy={toggleOcultarCompletadosHoy} onToggleModoCompacto={toggleModoCompacto} onToggleColumna={toggleColumnaVisible} />

            {/* Modal configuracion proyectos */}
            <ModalConfiguracionProyectos estaAbierto={modalConfigProyectosAbierto} onCerrar={() => setModalConfigProyectosAbierto(false)} configuracion={configProyectos} onToggleCompletados={toggleOcultarProyectosCompletados} onToggleProgreso={toggleProgresoProyectos} />

            {/* Modal configuracion scratchpad */}
            <ModalConfiguracionScratchpad estaAbierto={modalConfigScratchpadAbierto} onCerrar={() => setModalConfigScratchpadAbierto(false)} configuracion={configScratchpad} onCambiarFuente={cambiarFuenteScratchpad} onCambiarAltura={cambiarAlturaScratchpad} onCambiarIntervalo={cambiarAutoGuardadoScratchpad} />

            {/* Panel de Administración */}
            {esAdmin && <PanelAdministracion estaAbierto={panelAdminAbierto} onCerrar={() => setPanelAdminAbierto(false)} />}

            {/* Modal configuracion de layout */}
            <ModalConfiguracionLayout estaAbierto={modalConfigLayoutAbierto} onCerrar={() => setModalConfigLayoutAbierto(false)} modoColumnas={modoColumnas} visibilidad={visibilidad} ordenPaneles={ordenPaneles} onCambiarModo={cambiarModoColumnas} onTogglePanel={toggleVisibilidadPanel} onMoverPanelArriba={moverPanelArriba} onMoverPanelAbajo={moverPanelAbajo} onMoverPanelAColumna={moverPanelAColumna} onResetearOrden={resetearOrdenPaneles} onResetear={resetearLayout} />

            {/* Modal de Historial de Versiones */}
            <ModalVersiones estaAbierto={modalVersionesAbierto} onCerrar={() => setModalVersionesAbierto(false)} />

            {/* Modal de Perfil de Usuario */}
            <ModalPerfil estaAbierto={modalPerfilAbierto} onCerrar={() => setModalPerfilAbierto(false)} />

            {/* Modal de Equipos */}
            <ModalEquipos estaAbierto={modalEquiposAbierto} onCerrar={() => setModalEquiposAbierto(false)} />

            {/* Modal de Compartir Proyecto */}
            <ModalCompartir visible={proyectoCompartiendo !== null} onCerrar={() => setProyectoCompartiendo(null)} tipo="proyecto" elementoId={proyectoCompartiendo?.id ?? 0} elementoNombre={proyectoCompartiendo?.nombre ?? ''} companeros={equipos.companeros} participantes={participantesProyecto} cifradoActivo={false} onCompartir={manejarCompartirElemento} onCambiarRol={manejarCambiarRolCompartido} onDejarDeCompartir={manejarDejarDeCompartir} cargandoParticipantes={compartidos.cargando} />

            {/* Modal de Compartir Tarea */}
            <ModalCompartir visible={tareaCompartiendo !== null} onCerrar={() => setTareaCompartiendo(null)} tipo="tarea" elementoId={tareaCompartiendo?.id ?? 0} elementoNombre={tareaCompartiendo?.texto ?? ''} companeros={equipos.companeros} participantes={participantesTarea} cifradoActivo={false} onCompartir={manejarCompartirTareaElemento} onCambiarRol={manejarCambiarRolTareaCompartida} onDejarDeCompartir={manejarDejarDeCompartir} cargandoParticipantes={compartidos.cargando} />

            {/* Barra de paneles ocultos */}
            <BarraPanelesOcultos panelesOcultos={panelesOcultos} onMostrarPanel={mostrarPanel} />

            {/* Sistema Global de Tooltips */}
            <TooltipSystem />

            {/* Indicador de arrastre flotante */}
            <IndicadorArrastre panelArrastrando={panelArrastrando} posicionMouse={posicionMouse} />

            {/* Modal para crear nueva tarea global */}
            {modalNuevaTareaAbierto && <PanelConfiguracionTarea estaAbierto={modalNuevaTareaAbierto} onCerrar={() => setModalNuevaTareaAbierto(false)} onGuardar={manejarCrearNuevaTareaGlobal} />}

            {/* Modal de Experimentos (solo admins) */}
            <ModalExperimentos abierto={modalExperimentosAbierto} onCerrar={() => setModalExperimentosAbierto(false)} acciones={accionesExperimentos} />
        </div>
    );
}

export default DashboardIsland;
