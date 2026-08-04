/*
 * ModalesTareas
 * Agrupa modales relacionados con tareas
 * Incluye: PanelConfiguracionTarea (crear/editar), BottomSheetTarea (móvil)
 */

import {PanelConfiguracionTarea} from '../PanelConfiguracionTarea';
import {BottomSheetTarea} from '../BottomSheetTarea';

import type {DashboardCompletoRetorno} from '../../../hooks/useDashboardCompleto';
import type {DatosTarea} from '../BottomSheetTarea';

interface ModalesTareasProps {
    dashboard: DashboardCompletoRetorno['dashboard'];
    modales: DashboardCompletoRetorno['modales'];
    acciones: DashboardCompletoRetorno['acciones'];
    esMovil: boolean;
    manejarGuardarTareaBottomSheet: (datos: DatosTarea) => Promise<void>;
}

/*
 * Obtiene la tarea con prioridad heredada del hábito si aplica
 */
function obtenerTareaConHerencia(tareaEditando: DashboardCompletoRetorno['modales']['tareaEditando'], tareas: DashboardCompletoRetorno['dashboard']['tareas'], habitos: DashboardCompletoRetorno['dashboard']['habitos']) {
    const tareaReal = tareas.find(t => t.id === tareaEditando?.id) || tareaEditando;
    if (!tareaReal) return undefined;

    /* Heredar prioridad si es tarea de habito y no tiene prioridad propia */
    if (!tareaReal.prioridad && tareaReal.habitoId) {
        const habito = habitos.find(h => h.id === tareaReal.habitoId);
        if (habito) {
            return {
                ...tareaReal,
                prioridad: habito.importancia.toLowerCase() as 'alta' | 'media' | 'baja'
            };
        }
    }
    return tareaReal;
}

export function ModalesTareas({dashboard, modales, acciones, esMovil, manejarGuardarTareaBottomSheet}: ModalesTareasProps): JSX.Element {
    return (
        <>
            {/* Modal Nueva Tarea */}
            {modales.modalNuevaTareaAbierto && <PanelConfiguracionTarea estaAbierto={modales.modalNuevaTareaAbierto} onCerrar={modales.cerrarModalNuevaTarea} onGuardar={(config, priority, text, assignment, urgency, tags, dependencias, grupoEjecucion) => acciones.manejarCrearNuevaTareaGlobal(config, priority, text, assignment, urgency, tags, undefined, dependencias, grupoEjecucion)} />}

            {/* Modal Editar Tarea */}
            {modales.tareaEditando && (
                <PanelConfiguracionTarea
                    key={modales.tareaEditando.id}
                    estaAbierto={true}
                    onCerrar={modales.cerrarModalEditarTarea}
                    onGuardar={(config, priority, text, assignment, urgency, tags, dependencias, grupoEjecucion) => acciones.manejarGuardarEdicionTareaGlobal(modales.tareaEditando!.id, config, priority, text, assignment, urgency, tags, dependencias, grupoEjecucion)}
                    tarea={obtenerTareaConHerencia(modales.tareaEditando, dashboard.tareas, dashboard.habitos)}
                    participantes={[]}
                    companeros={[]}
                    proyectos={dashboard.proyectos}
                    onCambiarProyecto={nuevoId => modales.tareaEditando && dashboard.editarTarea(modales.tareaEditando.id, {proyectoId: nuevoId})}
                    onToggleCompletado={completado => {
                        if (modales.tareaEditando && completado !== modales.tareaEditando.completado) dashboard.toggleTarea(modales.tareaEditando.id);
                    }}
                    /* Subtareas - Fase 14.9 */
                    subtareas={dashboard.tareas.filter(t => t.parentId === modales.tareaEditando?.id).sort((a, b) => (a.orden || 0) - (b.orden || 0))}
                    onCrearSubtarea={dashboard.crearTarea}
                    onToggleSubtarea={dashboard.toggleTarea}
                    onEliminarSubtarea={dashboard.eliminarTarea}
                    onConfigurarSubtarea={modales.abrirModalEditarTarea}
                    onEditarSubtarea={dashboard.editarTarea}
                />
            )}

            {/* BottomSheet móvil para crear tarea */}
            {esMovil && modales.modalCreacionRapida === 'tarea' && <BottomSheetTarea estaAbierto={true} onCerrar={modales.cerrarCreacionRapida} onGuardar={manejarGuardarTareaBottomSheet} proyectos={dashboard.proyectos} valoresIniciales={modales.valoresCreacionRapida} />}

            {/*
             * BottomSheet para edición de tareas existentes (móvil)
             * TAREA 5: Al tocar tarea en panel ejecución, abre BottomSheet compacto
             * (igual que al crear tarea), no el panel de configuración completo
             */}
            {esMovil && modales.tareaEditandoMovil && (
                <BottomSheetTarea
                    key={modales.tareaEditandoMovil.id}
                    estaAbierto={true}
                    onCerrar={modales.cerrarEdicionTareaMovil}
                    onGuardar={manejarGuardarTareaBottomSheet}
                    proyectos={dashboard.proyectos}
                    tareaExistente={modales.tareaEditandoMovil}
                    onAbrirConfiguracion={() => {
                        /* Abrir panel de configuración completa desde el BottomSheet */
                        modales.cerrarEdicionTareaMovil();
                        modales.abrirModalEditarTarea(modales.tareaEditandoMovil!);
                    }}
                />
            )}
        </>
    );
}
