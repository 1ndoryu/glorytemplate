/*
 * DashboardIsland
 * Componente principal del Dashboard
 * Compone todos los subcomponentes del dashboard
 */

import {Terminal, AlertCircle, FileText} from 'lucide-react';
import {DashboardEncabezado, SeccionEncabezado, TablaHabitos, ListaTareas, Scratchpad, DashboardFooter, AccionesDatos, FormularioHabito, SelectorOrden, ListaProyectos} from '../components/dashboard';
import {ToastDeshacer} from '../components/shared/ToastDeshacer';
import {Modal} from '../components/shared/Modal';
import {useDashboard} from '../hooks/useDashboard';
import {useOrdenarHabitos} from '../hooks/useOrdenarHabitos';

interface DashboardIslandProps {
    titulo?: string;
    version?: string;
    usuario?: string;
}

/*
 * Componente de carga
 * Muestra un indicador mientras se cargan los datos de localStorage
 */
function IndicadorCarga(): JSX.Element {
    return (
        <div id="dashboard-cargando" className="dashboardCargando">
            <div className="cargandoIndicador">
                <div className="cargandoSpinner" />
                <span className="cargandoTexto">Cargando datos...</span>
            </div>
            <div className="cargandoBarraProgreso">
                <div className="cargandoBarraRelleno" />
            </div>
        </div>
    );
}

export function DashboardIsland({titulo = 'DASHBOARD_01', version = 'v1.0.0-beta', usuario = 'user@admin'}: DashboardIslandProps): JSX.Element {
    const {habitos, tareas, notas, proyectos, toggleTarea, crearTarea, editarTarea, eliminarTarea, crearProyecto, actualizarNotas, toggleHabito, crearHabito, editarHabito, eliminarHabito, modalCrearHabitoAbierto, abrirModalCrearHabito, cerrarModalCrearHabito, habitoEditando, abrirModalEditarHabito, cerrarModalEditarHabito, exportarTodosDatos, importarTodosDatos, importando, mensajeEstado, tipoMensaje, cargandoDatos, accionDeshacer, ejecutarDeshacer, descartarDeshacer, reordenarTareas} = useDashboard();

    /* Sistema de ordenamiento de habitos */
    const {habitosOrdenados, modoActual, cambiarModo, modosDisponibles} = useOrdenarHabitos(habitos);
    const modoInfo = modosDisponibles.find(m => m.id === modoActual);

    return (
        <div id="dashboard-contenedor" className="dashboardContenedor">
            <DashboardEncabezado titulo={titulo} version={version} usuario={usuario} />

            {cargandoDatos ? (
                <IndicadorCarga />
            ) : (
                <div className="dashboardGrid">
                    {/* Columna 1: Habitos Criticos */}
                    <div className="columnaHabitos">
                        <SeccionEncabezado icono={<AlertCircle size={12} />} titulo="Foco Prioritario" subtitulo={modoInfo?.descripcion || ''} acciones={<SelectorOrden modoActual={modoActual} onCambiarModo={cambiarModo} />} />
                        <TablaHabitos habitos={habitosOrdenados} onAñadirHabito={abrirModalCrearHabito} onToggleHabito={toggleHabito} onEditarHabito={abrirModalEditarHabito} onEliminarHabito={eliminarHabito} />

                        <div style={{marginTop: 'var(--dashboard-espacioLg)'}}>
                            <ListaProyectos proyectos={proyectos || []} onCrearProyecto={() => crearProyecto({nombre: 'Nuevo Proyecto', prioridad: 'media'})} />
                        </div>
                    </div>

                    {/* Columna 2: Tareas y Notas */}
                    <div className="columnaTareas">
                        {/* Seccion: Tareas */}
                        <div className="internaColumna">
                            <SeccionEncabezado icono={<Terminal size={12} />} titulo="Ejecucion" subtitulo={`${tareas.filter(t => !t.completado).length} pendientes`} />
                            <ListaTareas tareas={tareas} onToggleTarea={toggleTarea} onCrearTarea={crearTarea} onEditarTarea={editarTarea} onEliminarTarea={eliminarTarea} onReordenarTareas={reordenarTareas} />
                        </div>

                        {/* Seccion: Notas Rapidas */}
                        <div className="scratchpadContenedor">
                            <SeccionEncabezado icono={<FileText size={12} />} titulo="Scratchpad" subtitulo="markdown supported" />
                            <Scratchpad valorInicial={notas} onChange={actualizarNotas} />
                        </div>

                        {/* Seccion: Acciones de Datos */}
                        <AccionesDatos onExportar={exportarTodosDatos} onImportar={importarTodosDatos} importando={importando} mensajeEstado={mensajeEstado} tipoMensaje={tipoMensaje} />
                    </div>
                </div>
            )}

            <DashboardFooter />

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

            {/* Toast de deshacer */}
            {accionDeshacer && <ToastDeshacer mensaje={accionDeshacer.mensaje} tiempoRestante={accionDeshacer.tiempoRestante} tiempoTotal={5000} onDeshacer={ejecutarDeshacer} onDescartar={descartarDeshacer} />}
        </div>
    );
}

export default DashboardIsland;
