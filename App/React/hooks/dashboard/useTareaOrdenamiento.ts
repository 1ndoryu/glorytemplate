import {useState, useRef, useCallback} from 'react';
import {Tarea, DatosEdicionTarea, esTareaHabito} from '../../types/dashboard';
import {obtenerSubtareas, puedeSerSubtareaDe} from '../../utils/jerarquiaTareas';

interface UseTareaOrdenamientoProps {
    tareas: Tarea[];
    pendientes: Tarea[];
    completadas: Tarea[];
    onReordenarTareas?: (tareas: Tarea[]) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    setTareasExpandidas: React.Dispatch<React.SetStateAction<Set<number>>>;
    /* [218A-2] Callback para actualizar orden de hábitos cuando se arrastran */
    onReordenarHabitos?: (ordenes: Map<number, number>) => void;
}

export function useTareaOrdenamiento({tareas, pendientes, completadas, onReordenarTareas, onEditarTarea, setTareasExpandidas, onReordenarHabitos}: UseTareaOrdenamientoProps) {
    const [tareaArrastrandoId, setTareaArrastrandoId] = useState<number | null>(null);
    const [esGestoSubtarea, setEsGestoSubtarea] = useState(false);
    const dragStartXRef = useRef<number>(0);
    const dragCurrentXRef = useRef<number>(0);
    /* [218A-2] Ref para prevenir click después de drag.
     * Cuando el usuario arrastra y suelta, el evento click se dispara
     * en el TareaItem. Este flag lo suprime durante ~100ms. */
    const seArrastroRef = useRef(false);
    const UMBRAL_INDENT = 40;

    const handleDragStart = useCallback((tareaId: number, evento: React.PointerEvent) => {
        setTareaArrastrandoId(tareaId);
        dragStartXRef.current = evento.clientX;
        dragCurrentXRef.current = evento.clientX;
    }, []);

    const handleDragEnd = useCallback(() => {
        /* Se activa siempre que Framer Motion dispare onDragEnd, evitando el
         * stale closure que dejaba tareaArrastrandoId como null y no suprimía
         * el click posterior al soltar (218A-2 fix). */
        seArrastroRef.current = true;
        setTimeout(() => { seArrastroRef.current = false; }, 300);

        setTareaArrastrandoId(null);
        setEsGestoSubtarea(false);
    }, []);

    const handleReorder = useCallback(
        (nuevoOrdenPrincipales: Tarea[]) => {
            if (!onReordenarTareas || !onEditarTarea) return;

            /* [218A-2] Extraer posición de hábitos virtuales ANTES de filtrarlos.
             * Esto permite que el drag de hábitos en el panel de ejecución
             * actualice el campo orden del hábito en el store. */
            if (onReordenarHabitos) {
                const ordenesHabitos = new Map<number, number>();
                for (let i = 0; i < nuevoOrdenPrincipales.length; i++) {
                    const item = nuevoOrdenPrincipales[i];
                    if (esTareaHabito(item)) {
                        ordenesHabitos.set(item.habitoId, i);
                    }
                }
                if (ordenesHabitos.size > 0) {
                    onReordenarHabitos(ordenesHabitos);
                }
            }

            /* [044A-25] Filtrar virtual tasks de hábitos (IDs negativos) al inicio.
             * Sin esto, el loop de reconstrucción incluye hábitos virtuales y sus
             * subhábitos virtuales, contaminando la lista antes de que reordenarTareas
             * pueda filtrarlos. El filtro en reordenarTareas (044A-12) no alcanza
             * porque la reconstrucción con obtenerSubtareas ya amplificó los datos. */
            const principalesSoloReales = nuevoOrdenPrincipales.filter(t => t.id > 0);

            /* Calcular offset X del gesto horizontal */
            const offsetX = dragCurrentXRef.current - dragStartXRef.current;

            /* Si hay una tarea siendo arrastrada y hay offset significativo hacia la derecha */
            if (tareaArrastrandoId !== null && offsetX > UMBRAL_INDENT) {
                /* Encontrar la nueva posición de la tarea arrastrada */
                const nuevaPosicion = principalesSoloReales.findIndex(t => t.id === tareaArrastrandoId);

                if (nuevaPosicion > 0) {
                    /* La tarea de arriba será el nuevo padre */
                    const posiblePadre = principalesSoloReales[nuevaPosicion - 1];

                    /* Validar que puede ser subtarea */
                    if (puedeSerSubtareaDe(tareas, tareaArrastrandoId, posiblePadre.id)) {
                        /* Convertir en subtarea */
                        onEditarTarea(tareaArrastrandoId, {parentId: posiblePadre.id});

                        /* Expandir el nuevo padre automáticamente */
                        setTareasExpandidas(prev => {
                            const nuevo = new Set(prev);
                            nuevo.add(posiblePadre.id);
                            return nuevo;
                        });

                        /* Reconstruir lista sin la tarea convertida (ahora es subtarea) */
                        const nuevaListaSinConvertida = principalesSoloReales.filter(t => t.id !== tareaArrastrandoId);

                        const nuevaListaPendientes: Tarea[] = [];
                        for (const padre of nuevaListaSinConvertida) {
                            nuevaListaPendientes.push(padre);
                            const subtareas = obtenerSubtareas(pendientes, padre.id);
                            nuevaListaPendientes.push(...subtareas);
                        }

                        onReordenarTareas([...nuevaListaPendientes, ...completadas]);
                        return;
                    }
                }
            }

            /* Comportamiento normal: reconstruir lista con jerarquía */
            const nuevaListaPendientes: Tarea[] = [];

            for (const padre of principalesSoloReales) {
                nuevaListaPendientes.push(padre);
                /* Añadir subtareas de este padre en su orden original */
                const subtareas = obtenerSubtareas(pendientes, padre.id);
                nuevaListaPendientes.push(...subtareas);
            }

            /* Combinar con completadas al final */
            onReordenarTareas([...nuevaListaPendientes, ...completadas]);
        },
        [pendientes, completadas, onReordenarTareas, onEditarTarea, tareaArrastrandoId, tareas, setTareasExpandidas]
    );

    return {
        tareaArrastrandoId,
        esGestoSubtarea,
        setEsGestoSubtarea,
        dragStartXRef,
        dragCurrentXRef,
        handleDragStart,
        handleDragEnd,
        handleReorder,
        UMBRAL_INDENT,
        seArrastroRef
    };
}
