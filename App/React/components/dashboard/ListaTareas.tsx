/*
 * ListaTareas
 * Componente para mostrar la lista de tareas pendientes
 * Responsabilidad única: renderizar tareas con checkbox, input de creación, edición inline y acciones
 */

import {useState, useCallback} from 'react';
import {Reorder} from 'framer-motion';
import {ChevronRight} from 'lucide-react';
import type {Tarea, DatosEdicionTarea} from '../../types/dashboard';
import {TareaItem} from './TareaItem';
import {InputNuevaTarea} from './InputNuevaTarea';

interface ListaTareasProps {
    tareas: Tarea[];
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
}

export function ListaTareas({tareas, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas}: ListaTareasProps): JSX.Element {
    /*
     * Estado para tareas padre colapsadas
     * Set de IDs de tareas padre cuyas subtareas estan ocultas
     */
    const [tareasColapsadas, setTareasColapsadas] = useState<Set<number>>(new Set());

    // Filtramos pendientes y completadas
    const pendientes = tareas.filter(t => !t.completado);
    const completadas = tareas.filter(t => t.completado);

    const handleReorder = (nuevosPendientes: Tarea[]) => {
        if (!onReordenarTareas) return;
        onReordenarTareas([...nuevosPendientes, ...completadas]);
    };

    /*
     * Manejadores de indentacion
     */
    const handleIndent = (tareaId: number) => {
        const index = pendientes.findIndex(t => t.id === tareaId);
        if (index <= 0) return;

        const tarea = pendientes[index];
        const tareaAnterior = pendientes[index - 1];

        // Validacion: No anidar mas de 1 nivel
        if (tareaAnterior.parentId) {
            return;
        }

        onEditarTarea?.(tarea.id, {parentId: tareaAnterior.id});
    };

    const handleOutdent = (tareaId: number) => {
        const tarea = pendientes.find(t => t.id === tareaId);
        if (!tarea || !tarea.parentId) return;

        onEditarTarea?.(tareaId, {parentId: undefined} as any);
    };

    /*
     * Crear nueva tarea debajo de la actual (hereda parentId si aplica)
     * tareaActualId indica despues de cual tarea insertar
     */
    const handleCrearNueva = (parentId: number | undefined, tareaActualId: number) => {
        onCrearTarea?.({
            texto: '',
            parentId: parentId,
            insertarDespuesDe: tareaActualId
        });
    };

    /*
     * Colapsar/expandir subtareas de una tarea padre
     */
    const toggleColapsar = useCallback((tareaId: number) => {
        setTareasColapsadas(prev => {
            const nuevo = new Set(prev);
            if (nuevo.has(tareaId)) {
                nuevo.delete(tareaId);
            } else {
                nuevo.add(tareaId);
            }
            return nuevo;
        });
    }, []);

    /*
     * Determinar si una tarea tiene subtareas
     * Busca en TODAS las tareas para incluir subtareas completadas
     */
    const tieneSubtareas = (tareaId: number): boolean => {
        return tareas.some(t => t.parentId === tareaId);
    };

    /*
     * Contar subtareas de una tarea (total y completadas)
     * Busca en TODAS las tareas, no solo pendientes
     */
    const contarSubtareas = (tareaId: number): {total: number; completadas: number} => {
        const subtareas = tareas.filter(t => t.parentId === tareaId);
        return {
            total: subtareas.length,
            completadas: subtareas.filter(t => t.completado).length
        };
    };

    /*
     * Filtrar tareas visibles (excluyendo subtareas de padres colapsados)
     */
    const tareasVisibles = pendientes.filter(tarea => {
        if (!tarea.parentId) return true; // Tareas principales siempre visibles
        return !tareasColapsadas.has(tarea.parentId); // Subtareas visibles si padre no colapsado
    });

    return (
        <div id="lista-tareas" className="dashboardPanel">
            {onCrearTarea && <InputNuevaTarea onCrear={onCrearTarea} />}

            <Reorder.Group axis="y" values={tareasVisibles} onReorder={handleReorder} className="listaTareasPendientes">
                {tareasVisibles.map(tarea => {
                    const isSubtarea = !!tarea.parentId;
                    const esColapsable = tieneSubtareas(tarea.id);
                    const estaColapsada = tareasColapsadas.has(tarea.id);
                    const numSubtareas = contarSubtareas(tarea.id);

                    return (
                        <Reorder.Item key={tarea.id} value={tarea} as="div" style={{position: 'relative'}}>
                            <div className="tareaConColapsador">
                                <TareaItem tarea={tarea} esSubtarea={isSubtarea} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} onIndent={() => handleIndent(tarea.id)} onOutdent={() => handleOutdent(tarea.id)} onCrearNueva={handleCrearNueva} />
                                {/* Boton de colapsar a la derecha, solo si tiene subtareas */}
                                {esColapsable && (
                                    <button className="tareaColapsadorBoton" onClick={() => toggleColapsar(tarea.id)} title={estaColapsada ? `Expandir ${numSubtareas.total} subtareas` : `Colapsar ${numSubtareas.total} subtareas`}>
                                        {estaColapsada ? (
                                            <>
                                                <ChevronRight size={12} />
                                                <span className="tareaColapsadorContador">
                                                    {numSubtareas.completadas}/{numSubtareas.total}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="tareaColapsadorContador tareaColapsadorContadorExpandido">
                                                {numSubtareas.completadas}/{numSubtareas.total}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            {pendientes.length > 0 && completadas.length > 0 && <div className="listaTareasSeparador" />}

            {completadas.map(tarea => (
                <TareaItem key={tarea.id} tarea={tarea} esSubtarea={!!tarea.parentId} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} />
            ))}
        </div>
    );
}
