import {useLocalStorage} from './useLocalStorage';

export interface ConfiguracionTareas {
    ocultarCompletadas: boolean;
    ocultarBadgeProyecto: boolean;
    eliminarCompletadasDespuesDeUnDia: boolean;
    /* Mostrar hábitos que "tocan hoy" como tareas en Ejecución */
    mostrarHabitosEnEjecucion: boolean;
    modoCompacto: boolean;
    /* Ocultar subtareas automáticamente (colapsadas por defecto) */
    ocultarSubtareasAutomaticamente: boolean;
    /* Ignorar urgencia en el ordenamiento por prioridad para permitir drag reorder */
    ignorarUrgenciaEnPrioridad: boolean;
}

/* 
 * Configuración por defecto de tareas
 * mostrarHabitosEnEjecucion: true para usuarios nuevos (Beta: mejor experiencia inicial)
 * ocultarSubtareasAutomaticamente: false para mantener subtareas expandidas
 */
export const CONFIG_POR_DEFECTO: ConfiguracionTareas = {
    ocultarCompletadas: true,
    ocultarBadgeProyecto: true,
    eliminarCompletadasDespuesDeUnDia: false,
    mostrarHabitosEnEjecucion: true,
    modoCompacto: false,
    ocultarSubtareasAutomaticamente: false,
    ignorarUrgenciaEnPrioridad: false
};

export function useConfiguracionTareas() {
    const {valor, setValor} = useLocalStorage<ConfiguracionTareas>('glory_config_tareas', {
        valorPorDefecto: CONFIG_POR_DEFECTO
    });

    const toggleOcultarCompletadas = () => {
        setValor(prev => ({...prev, ocultarCompletadas: !prev.ocultarCompletadas}));
    };

    const toggleOcultarBadgeProyecto = () => {
        setValor(prev => ({...prev, ocultarBadgeProyecto: !prev.ocultarBadgeProyecto}));
    };

    const toggleEliminarCompletadasDespuesDeUnDia = () => {
        setValor(prev => ({...prev, eliminarCompletadasDespuesDeUnDia: !prev.eliminarCompletadasDespuesDeUnDia}));
    };

    const toggleMostrarHabitosEnEjecucion = () => {
        setValor(prev => ({...prev, mostrarHabitosEnEjecucion: !prev.mostrarHabitosEnEjecucion}));
    };

    const toggleModoCompacto = () => {
        setValor(prev => ({...prev, modoCompacto: !prev.modoCompacto}));
    };

    const toggleOcultarSubtareasAutomaticamente = () => {
        setValor(prev => ({...prev, ocultarSubtareasAutomaticamente: !prev.ocultarSubtareasAutomaticamente}));
    };

    const toggleIgnorarUrgenciaEnPrioridad = () => {
        setValor(prev => ({...prev, ignorarUrgenciaEnPrioridad: !prev.ignorarUrgenciaEnPrioridad}));
    };

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        toggleOcultarCompletadas,
        toggleOcultarBadgeProyecto,
        toggleEliminarCompletadasDespuesDeUnDia,
        toggleMostrarHabitosEnEjecucion,
        toggleModoCompacto,
        toggleOcultarSubtareasAutomaticamente,
        toggleIgnorarUrgenciaEnPrioridad
    };
}
