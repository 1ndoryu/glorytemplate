import {useState, useCallback, useEffect, useRef} from 'react';
import {Tarea, DatosEdicionTarea, TareaConfiguracion, NivelPrioridad, NivelUrgencia} from '../../types/dashboard';
import {esTareaHabito} from '../../types/dashboard';
import {tieneSubtareas} from '../../utils/jerarquiaTareas';

interface UseListaTareasLogicaProps {
    tareas: Tarea[];
    proyectoId?: number;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onConfigurarTarea?: (tarea: Tarea) => void;
    pendientes: Tarea[];
    /* Si true, las subtareas estarán colapsadas por defecto */
    ocultarSubtareasAutomaticamente?: boolean;
}

export function useListaTareasLogica({tareas, proyectoId, onEditarTarea, onCrearTarea, onConfigurarTarea, pendientes, ocultarSubtareasAutomaticamente = false}: UseListaTareasLogicaProps) {
    /*
     * Estado de tareas expandidas
     * Si ocultarSubtareasAutomaticamente es false: expandir todas las tareas padre por defecto
     * Si ocultarSubtareasAutomaticamente es true: mantener todas colapsadas (Set vacío)
     */
    const [tareasExpandidas, setTareasExpandidas] = useState<Set<number>>(() => {
        if (ocultarSubtareasAutomaticamente) return new Set();
        /* Expandir todas las tareas que tienen subtareas, excepto los hábitos virtuales
         * (esTareaHabito), para que su Reorder.Item sea de una sola fila y el drag funcione mejor. */
        const padresIds = tareas.filter(t => !t.parentId && tieneSubtareas(tareas, t.id) && !esTareaHabito(t)).map(t => t.id);
        return new Set(padresIds);
    });
    const [tareaConfigurando, setTareaConfigurando] = useState<Tarea | null>(null);
    const [tareaMoviendo, setTareaMoviendo] = useState<Tarea | null>(null);

    /* Referencia para evitar recalcular en cada render */
    const prevOcultarRef = useRef(ocultarSubtareasAutomaticamente);
    const prevTareasPadreRef = useRef<Set<number>>(new Set());

    /* Efecto para actualizar cuando cambia la configuración */
    useEffect(() => {
        if (prevOcultarRef.current !== ocultarSubtareasAutomaticamente) {
            prevOcultarRef.current = ocultarSubtareasAutomaticamente;
            if (ocultarSubtareasAutomaticamente) {
                /* Colapsar todas */
                setTareasExpandidas(new Set());
            } else {
                /* Expandir todas las tareas padre, excepto los hábitos virtuales */
                const padresIds = tareas.filter(t => !t.parentId && tieneSubtareas(tareas, t.id) && !esTareaHabito(t)).map(t => t.id);
                setTareasExpandidas(new Set(padresIds));
            }
        }
    }, [ocultarSubtareasAutomaticamente, tareas]);

    /*
     * Efecto para auto-expandir tareas padre cuando se agregan nuevas subtareas
     * Solo funciona si ocultarSubtareasAutomaticamente está desactivado
     * Detecta nuevas tareas padre y las expande automáticamente
     */
    useEffect(() => {
        if (ocultarSubtareasAutomaticamente) return;

        /* Obtener todas las tareas padre actuales (excepto hábitos virtuales) */
        const padresActuales = new Set(tareas.filter(t => !t.parentId && tieneSubtareas(tareas, t.id) && !esTareaHabito(t)).map(t => t.id));

        /* Encontrar nuevas tareas padre (que no estaban antes) */
        const nuevasTareasPadre = Array.from(padresActuales).filter(id => !prevTareasPadreRef.current.has(id));

        if (nuevasTareasPadre.length > 0) {
            /* Expandir automáticamente las nuevas tareas padre */
            setTareasExpandidas(prev => {
                const nuevo = new Set(prev);
                nuevasTareasPadre.forEach(id => nuevo.add(id));
                return nuevo;
            });
        }

        /* Actualizar referencia */
        prevTareasPadreRef.current = padresActuales;
    }, [tareas, ocultarSubtareasAutomaticamente]);

    const toggleColapsar = useCallback((tareaId: number) => {
        setTareasExpandidas(prev => {
            const nuevo = new Set(prev);
            if (nuevo.has(tareaId)) nuevo.delete(tareaId);
            else nuevo.add(tareaId);
            return nuevo;
        });
    }, []);

    const abrirConfiguracion = useCallback(
        (tareaId: number) => {
            const tarea = tareas.find(t => t.id === tareaId);
            if (tarea) {
                if (onConfigurarTarea) {
                    onConfigurarTarea(tarea);
                } else {
                    setTareaConfigurando(tarea);
                }
            }
        },
        [tareas, onConfigurarTarea]
    );

    const guardarConfiguracion = useCallback(
        (configuracion: TareaConfiguracion, prioridad?: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], dependencias?: import('../../types/dashboard').ReferenciaDependencia[]) => {
            if (tareaConfigurando && onEditarTarea) {
                onEditarTarea(tareaConfigurando.id, {
                    configuracion,
                    prioridad: prioridad === undefined ? tareaConfigurando.prioridad : prioridad,
                    urgencia: urgencia === undefined ? tareaConfigurando.urgencia : urgencia,
                    ...(texto !== undefined && {texto}),
                    ...(asignacion && {
                        asignadoA: asignacion.asignadoA,
                        asignadoANombre: asignacion.asignadoANombre,
                        asignadoAAvatar: asignacion.asignadoAAvatar
                    }),
                    ...(tags && {tags}),
                    ...(dependencias !== undefined && {dependencias})
                });
            }
        },
        [tareaConfigurando, onEditarTarea]
    );

    const handleIndent = (tareaId: number) => {
        const index = pendientes.findIndex(t => t.id === tareaId);
        if (index <= 0) return;

        const tarea = pendientes[index];
        const tareaAnterior = pendientes[index - 1];

        if (tareaAnterior.parentId) return;

        setTareasExpandidas(prev => {
            const nuevo = new Set(prev);
            nuevo.add(tareaAnterior.id);
            return nuevo;
        });

        onEditarTarea?.(tarea.id, {parentId: tareaAnterior.id});
    };

    const handleOutdent = (tareaId: number) => {
        const tarea = pendientes.find(t => t.id === tareaId);
        if (!tarea || !tarea.parentId) return;
        onEditarTarea?.(tareaId, {parentId: undefined});
    };

    const handleCrearNueva = (parentId: number | undefined, tareaActualId: number) => {
        let idProyectoHeredado = proyectoId;
        let idHabitoHeredado: number | undefined = undefined;
        let prioridadHeredada: NivelPrioridad | undefined = undefined;

        if (parentId) {
            const tareaPadre = tareas.find(t => t.id === parentId);
            if (tareaPadre) {
                if (tareaPadre.proyectoId) idProyectoHeredado = tareaPadre.proyectoId;

                if (esTareaHabito(tareaPadre)) {
                    idHabitoHeredado = tareaPadre.habitoId;
                    const mapImportancia: Record<string, NivelPrioridad> = {'Muy Alta': 'muy_alta', Alta: 'alta', Media: 'media', Baja: 'baja', 'Muy Baja': 'muy_baja'};
                    prioridadHeredada = mapImportancia[tareaPadre.habitoImportancia] || 'media';
                } else if (tareaPadre.habitoId) {
                    idHabitoHeredado = tareaPadre.habitoId;
                    if (tareaPadre.prioridad) prioridadHeredada = tareaPadre.prioridad;
                }
            }

            setTareasExpandidas(prev => {
                const nuevo = new Set(prev);
                nuevo.add(parentId);
                return nuevo;
            });
        }

        onCrearTarea?.({
            texto: '',
            parentId: parentId,
            insertarDespuesDe: tareaActualId,
            proyectoId: idProyectoHeredado,
            habitoId: idHabitoHeredado,
            prioridad: prioridadHeredada
        });
    };

    const handleMoverProyecto = useCallback(
        (nuevoProyectoId: number | undefined) => {
            if (tareaMoviendo && onEditarTarea) {
                onEditarTarea(tareaMoviendo.id, {
                    proyectoId: nuevoProyectoId,
                    parentId: undefined
                });
            }
            setTareaMoviendo(null);
        },
        [tareaMoviendo, onEditarTarea]
    );

    const obtenerSubtareasVisibles = useCallback(
        (padreId: number): Tarea[] => {
            if (!tareasExpandidas.has(padreId)) return [];
            return pendientes.filter(t => t.parentId === padreId);
        },
        [pendientes, tareasExpandidas]
    );

    return {
        tareasExpandidas,
        setTareasExpandidas,
        tareaConfigurando,
        setTareaConfigurando,
        tareaMoviendo,
        setTareaMoviendo,
        toggleColapsar,
        abrirConfiguracion,
        guardarConfiguracion,
        handleIndent,
        handleOutdent,
        handleCrearNueva,
        handleMoverProyecto,
        obtenerSubtareasVisibles
    };
}
