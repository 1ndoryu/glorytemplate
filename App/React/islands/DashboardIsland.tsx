/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Compone todos los subcomponentes del dashboard
 */

import {useState, useEffect} from 'react';
import {Terminal, AlertCircle, FileText, Folder, Plus} from 'lucide-react';
import {DashboardEncabezado, SeccionEncabezado, TablaHabitos, ListaTareas, Scratchpad, DashboardFooter, AccionesDatos, FormularioHabito, SelectorOrden, ListaProyectos, FormularioProyecto, ModalLogin, PanelSeguridad} from '../components/dashboard';
import {ToastDeshacer, ModalUpgrade} from '../components/shared';
import {Modal} from '../components/shared/Modal';
import {PanelAdministracion} from '../components/admin';
import {useDashboard} from '../hooks/useDashboard';
import {useOrdenarHabitos} from '../hooks/useOrdenarHabitos';
import {useAuth} from '../hooks/useAuth';
import {useSuscripcion} from '../hooks/useSuscripcion';
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

    /* Estado de proyectos */
    const [proyectoSeleccionadoId, setProyectoSeleccionadoId] = useState<number | null>(null);
    const [modalCrearProyectoAbierto, setModalCrearProyectoAbierto] = useState(false);
    const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null);

    /* Tareas sueltas (sin proyecto) para mostrar en Ejecucion */
    const tareasSinProyecto = tareas.filter(t => !t.proyectoId);

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
            />

            {cargandoDatos ? (
                <IndicadorCarga />
            ) : (
                <div className="dashboardGrid">
                    {/* Columna 1: Habitos y Proyectos */}
                    <div className="columnaHabitos">
                        <SeccionEncabezado icono={<AlertCircle size={12} />} titulo="Foco Prioritario" subtitulo={modoInfo?.descripcion || ''} acciones={<SelectorOrden modoActual={modoActual} onCambiarModo={cambiarModo} />} />
                        <TablaHabitos habitos={habitosOrdenados} onAñadirHabito={abrirModalCrearHabito} onToggleHabito={toggleHabito} onEditarHabito={abrirModalEditarHabito} onEliminarHabito={eliminarHabito} />

                        <SeccionEncabezado
                            titulo="Proyectos"
                            icono={<Folder size={12} />}
                            acciones={
                                <button className="botonIcono" onClick={manejarCrearProyecto} title="Nuevo Proyecto">
                                    <Plus size={14} />
                                </button>
                            }
                        />
                        <ListaProyectos proyectos={proyectos || []} tareas={tareas} onCrearProyecto={manejarCrearProyecto} onSeleccionarProyecto={setProyectoSeleccionadoId} proyectoSeleccionadoId={proyectoSeleccionadoId} onEditarProyecto={manejarEditarProyecto} onEliminarProyecto={manejarEliminarProyecto} onCambiarEstadoProyecto={cambiarEstadoProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} />
                    </div>

                    {/* Columna 2: Tareas sueltas y Notas */}
                    <div className="columnaTareas">
                        {/* Seccion: Tareas sueltas (sin proyecto) */}
                        <div className="internaColumna">
                            <SeccionEncabezado icono={<Terminal size={12} />} titulo="Ejecucion" subtitulo={`${tareasSinProyecto.filter(t => !t.completado).length} pendientes`} />
                            <ListaTareas tareas={tareasSinProyecto} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} />
                        </div>

                        {/* Seccion: Notas Rapidas */}
                        <div className="internaColumna">
                            <SeccionEncabezado icono={<FileText size={12} />} titulo="Scratchpad" subtitulo="markdown supported" />
                            <Scratchpad valorInicial={notas} onChange={actualizarNotas} />
                        </div>

                        {/* Seccion: Acciones de Datos */}
                        <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />
                    </div>
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

            {/* Panel de Administración */}
            {esAdmin && <PanelAdministracion estaAbierto={panelAdminAbierto} onCerrar={() => setPanelAdminAbierto(false)} />}
        </div>
    );
}

export default DashboardIsland;
