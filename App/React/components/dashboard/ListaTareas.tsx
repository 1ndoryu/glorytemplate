/*
 * ListaTareas
 * Componente para mostrar la lista de tareas pendientes
 * Responsabilidad única: renderizar tareas con checkbox, input de creación, edición inline y acciones
 */

import {useState, useCallback, useMemo, useRef} from 'react';
import {Reorder} from 'framer-motion';
import {ChevronRight} from 'lucide-react';
import type {Tarea, DatosEdicionTarea, TareaConfiguracion, NivelPrioridad, NivelUrgencia, Proyecto, Participante} from '../../types/dashboard';
import {esTareaHabito} from '../../types/dashboard';
import {TareaItem} from './TareaItem';
import {InputNuevaTarea} from './InputNuevaTarea';
import {PanelConfiguracionTarea} from './PanelConfiguracionTarea';
import {ModalMoverTarea} from './ModalMoverTarea';
import {obtenerSubtareas, tieneSubtareas as utilTieneSubtareas, contarSubtareas as utilContarSubtareas, puedeSerSubtareaDe} from '../../utils/jerarquiaTareas';
import {DashboardPanel} from '../shared/DashboardPanel';

interface ListaTareasProps {
    tareas: Tarea[];
    proyectoId?: number;
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
    habilitarDrag?: boolean;
    proyectos?: Proyecto[];
    ocultarCompletadas?: boolean;
    ocultarBadgeProyecto?: boolean;
    onCompartirTarea?: (tarea: Tarea) => void;
    estaCompartida?: (tareaId: number) => boolean;
    /* Callback para obtener participantes de una tarea (para asignación) */
    obtenerParticipantes?: (tarea: Tarea) => Participante[];
}

export function ListaTareas({tareas, proyectoId, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, habilitarDrag = true, proyectos = [], ocultarCompletadas = false, ocultarBadgeProyecto = false, onCompartirTarea, estaCompartida, obtenerParticipantes}: ListaTareasProps): JSX.Element {
    /*
     * Estado para tareas padre colapsadas
     * Set de IDs de tareas padre cuyas subtareas estan ocultas
     */
    const [tareasColapsadas, setTareasColapsadas] = useState<Set<number>>(new Set());

    /*
     * Estado para el panel de configuración
     * Guarda la tarea que se está configurando (null si el panel está cerrado)
     */
    const [tareaConfigurando, setTareaConfigurando] = useState<Tarea | null>(null);

    /*
     * Estado para mover tarea de proyecto
     */
    const [tareaMoviendo, setTareaMoviendo] = useState<Tarea | null>(null);

    /*
     * Estado para tracking de drag & drop con gestos horizontales
     * Fase D: Detectamos el offset X para convertir tareas en subtareas
     */
    const [tareaArrastrandoId, setTareaArrastrandoId] = useState<number | null>(null);
    const [esGestoSubtarea, setEsGestoSubtarea] = useState(false);
    const dragStartXRef = useRef<number>(0);
    const dragCurrentXRef = useRef<number>(0);

    /* Filtramos pendientes y completadas */
    const pendientes = tareas.filter(t => !t.completado);
    const completadas = tareas.filter(t => t.completado);

    /*
     * Obtener solo tareas principales para el reorder
     * Las subtareas se moverán automáticamente con su padre
     * Las tareas-hábito se excluyen del reorder (no son arrastrables)
     */
    const tareasPrincipalesPendientes = useMemo(() => pendientes.filter(t => !t.parentId && !esTareaHabito(t)), [pendientes]);

    /*
     * Tareas-hábito pendientes (se renderizan sin drag)
     */
    const tareasHabitoPendientes = useMemo(() => pendientes.filter(t => esTareaHabito(t)), [pendientes]);

    /*
     * Umbral de pixels para detectar gesto horizontal
     * Si el usuario arrastra más de este valor a la derecha, la tarea se convierte en subtarea
     */
    const UMBRAL_INDENT = 40;

    /*
     * Handlers de eventos de drag para capturar posición X
     * Framer Motion Reorder no expone el offset X, así que lo capturamos manualmente
     */
    const handleDragStart = useCallback((tareaId: number, evento: React.PointerEvent) => {
        setTareaArrastrandoId(tareaId);
        dragStartXRef.current = evento.clientX;
        dragCurrentXRef.current = evento.clientX;
    }, []);

    const handleDragEnd = useCallback(() => {
        setTareaArrastrandoId(null);
        setEsGestoSubtarea(false);
    }, []);

    /*
     * Reconstruir la lista completa manteniendo subtareas con sus padres
     * Cuando se reordena, solo movemos las tareas principales,
     * las subtareas siguen a su padre automáticamente
     *
     * Fase C: Detectar contexto de drop para conversión de jerarquía
     * Fase D: Usar offset X para determinar si convertir en subtarea
     */
    const handleReorder = useCallback(
        (nuevoOrdenPrincipales: Tarea[]) => {
            if (!onReordenarTareas || !onEditarTarea) return;

            /* Calcular offset X del gesto horizontal */
            const offsetX = dragCurrentXRef.current - dragStartXRef.current;

            /* Si hay una tarea siendo arrastrada y hay offset significativo hacia la derecha */
            if (tareaArrastrandoId !== null && offsetX > UMBRAL_INDENT) {
                /* Encontrar la nueva posición de la tarea arrastrada */
                const nuevaPosicion = nuevoOrdenPrincipales.findIndex(t => t.id === tareaArrastrandoId);

                if (nuevaPosicion > 0) {
                    /* La tarea de arriba será el nuevo padre */
                    const posiblePadre = nuevoOrdenPrincipales[nuevaPosicion - 1];

                    /* Validar que puede ser subtarea */
                    if (puedeSerSubtareaDe(tareas, tareaArrastrandoId, posiblePadre.id)) {
                        /* Convertir en subtarea */
                        onEditarTarea(tareaArrastrandoId, {parentId: posiblePadre.id});

                        /* Reconstruir lista sin la tarea convertida (ahora es subtarea) */
                        const nuevaListaSinConvertida = nuevoOrdenPrincipales.filter(t => t.id !== tareaArrastrandoId);

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

            for (const padre of nuevoOrdenPrincipales) {
                nuevaListaPendientes.push(padre);
                /* Añadir subtareas de este padre en su orden original */
                const subtareas = obtenerSubtareas(pendientes, padre.id);
                nuevaListaPendientes.push(...subtareas);
            }

            /* Combinar con completadas al final */
            onReordenarTareas([...nuevaListaPendientes, ...completadas]);
        },
        [pendientes, completadas, onReordenarTareas, onEditarTarea, tareaArrastrandoId, tareas]
    );

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
     * Crear nueva tarea debajo de la actual (hereda parentId y proyectoId si aplica)
     * tareaActualId indica despues de cual tarea insertar
     */
    const handleCrearNueva = (parentId: number | undefined, tareaActualId: number) => {
        onCrearTarea?.({
            texto: '',
            parentId: parentId,
            insertarDespuesDe: tareaActualId,
            proyectoId: proyectoId
        });
    };

    /*
     * Wrapper para crear tareas desde el input, incluyendo proyectoId
     */
    const crearTareaConProyecto = (datos: DatosEdicionTarea) => {
        onCrearTarea?.({
            ...datos,
            proyectoId: proyectoId
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
     * Abrir panel de configuración para una tarea
     */
    const abrirConfiguracion = useCallback(
        (tareaId: number) => {
            const tarea = tareas.find(t => t.id === tareaId);
            if (tarea) {
                setTareaConfigurando(tarea);
            }
        },
        [tareas]
    );

    /*
     * Guardar configuración de tarea (incluye prioridad y urgencia)
     */
    const guardarConfiguracion = useCallback(
        (configuracion: TareaConfiguracion, prioridad?: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null) => {
            if (tareaConfigurando && onEditarTarea) {
                /* Actualizamos la tarea con la nueva configuración, prioridad, urgencia, texto y asignación */
                onEditarTarea(tareaConfigurando.id, {
                    configuracion,
                    prioridad: prioridad === undefined ? tareaConfigurando.prioridad : prioridad,
                    urgencia: urgencia === undefined ? tareaConfigurando.urgencia : urgencia,
                    ...(texto !== undefined && {texto}),
                    ...(asignacion && {
                        asignadoA: asignacion.asignadoA,
                        asignadoANombre: asignacion.asignadoANombre,
                        asignadoAAvatar: asignacion.asignadoAAvatar
                    })
                });
            }
            setTareaConfigurando(null);
        },
        [tareaConfigurando, onEditarTarea]
    );

    /*
     * Manejar movimiento de tarea a proyecto
     */
    const handleMoverProyecto = useCallback(
        (nuevoProyectoId: number | undefined) => {
            if (tareaMoviendo && onEditarTarea) {
                /*
                 * Al mover de proyecto, convertimos en tarea principal (sin padre)
                 * para evitar inconsistencias de jerarquia
                 */
                onEditarTarea(tareaMoviendo.id, {
                    proyectoId: nuevoProyectoId,
                    parentId: undefined
                } as any); /* Casting necesario para enviar null/undefined si la interfaz lo requiere */
            }
            setTareaMoviendo(null);
        },
        [tareaMoviendo, onEditarTarea]
    );

    /*
     * Usar funciones de utilidades para verificar subtareas
     */
    const tieneSubtareasLocal = (tareaId: number): boolean => utilTieneSubtareas(tareas, tareaId);
    const contarSubtareasLocal = (tareaId: number) => utilContarSubtareas(tareas, tareaId);

    /*
     * Obtener subtareas de una tarea padre (para renderizar debajo de ella)
     */
    const obtenerSubtareasVisibles = useCallback(
        (padreId: number): Tarea[] => {
            if (tareasColapsadas.has(padreId)) return [];
            return pendientes.filter(t => t.parentId === padreId);
        },
        [pendientes, tareasColapsadas]
    );

    /*
     * Renderizar una tarea con su estructura visual
     */
    const renderTareaConColapsador = (tarea: Tarea, esSubtarea: boolean) => {
        const esColapsable = !esSubtarea && tieneSubtareasLocal(tarea.id);
        const estaColapsada = tareasColapsadas.has(tarea.id);
        const numSubtareas = contarSubtareasLocal(tarea.id);

        const proyecto = tarea.proyectoId ? proyectos.find(p => p.id === tarea.proyectoId) : undefined;
        let nombreProyecto: string | undefined = undefined;
        const soloIcono = ocultarBadgeProyecto;

        if (proyecto?.nombre) {
            nombreProyecto = proyecto.nombre;
            if (!soloIcono && nombreProyecto.length > 20) {
                nombreProyecto = nombreProyecto.substring(0, 20) + '...';
            }
        }

        return (
            <div className="tareaConColapsador" key={`wrapper-${tarea.id}`}>
                <TareaItem tarea={tarea} esSubtarea={esSubtarea} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} onIndent={() => handleIndent(tarea.id)} onOutdent={() => handleOutdent(tarea.id)} onCrearNueva={handleCrearNueva} onConfigurar={() => abrirConfiguracion(tarea.id)} nombreProyecto={nombreProyecto} soloIconoProyecto={soloIcono} onMoverProyecto={() => setTareaMoviendo(tarea)} onCompartir={() => onCompartirTarea?.(tarea)} estaCompartida={estaCompartida?.(tarea.id) ?? false} />
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
        );
    };

    return (
        <DashboardPanel id="lista-tareas">
            {onCrearTarea && <InputNuevaTarea onCrear={crearTareaConProyecto} />}

            {/* Modo manual: Reorder para tareas reales, hábitos aparte */}
            {habilitarDrag ? (
                <>
                    <Reorder.Group axis="y" values={tareasPrincipalesPendientes} onReorder={handleReorder} className="listaTareasPendientes">
                        {tareasPrincipalesPendientes.map(tareaPadre => {
                            const subtareasVisibles = obtenerSubtareasVisibles(tareaPadre.id);

                            return (
                                <Reorder.Item
                                    key={tareaPadre.id}
                                    value={tareaPadre}
                                    as="div"
                                    style={{position: 'relative'}}
                                    className={`tareaPadreReorder ${tareaArrastrandoId === tareaPadre.id ? 'tareaPadreReorderArrastrando' : ''} ${tareaArrastrandoId === tareaPadre.id && esGestoSubtarea ? 'tareaPadreReorderGestoSubtarea' : ''}`}
                                    dragListener={true}
                                    onPointerDown={e => handleDragStart(tareaPadre.id, e)}
                                    onDragEnd={handleDragEnd}
                                    onDrag={(_, info) => {
                                        dragCurrentXRef.current = dragStartXRef.current + info.offset.x;
                                        const nuevoEsGesto = info.offset.x > UMBRAL_INDENT;
                                        if (nuevoEsGesto !== esGestoSubtarea) {
                                            setEsGestoSubtarea(nuevoEsGesto);
                                        }
                                    }}>
                                    {/* Indicador visual de gesto horizontal hacia subtarea */}
                                    {tareaArrastrandoId === tareaPadre.id && esGestoSubtarea && <div className="tareaDropIndicador tareaDropIndicadorSubtarea tareaDropIndicadorActivo" style={{top: 0}} />}

                                    {/* Tarea padre */}
                                    {renderTareaConColapsador(tareaPadre, false)}

                                    {/* Subtareas (no son draggables individualmente) */}
                                    {subtareasVisibles.map(subtarea => (
                                        <div key={subtarea.id} className="subtareaContenedor">
                                            {renderTareaConColapsador(subtarea, true)}
                                        </div>
                                    ))}
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>

                    {/* Tareas-hábito en modo manual (sin drag, al final) */}
                    {tareasHabitoPendientes.map(tareaHabito => (
                        <div key={tareaHabito.id} className="tareaHabitoContenedor">
                            {renderTareaConColapsador(tareaHabito, false)}
                        </div>
                    ))}
                </>
            ) : (
                /* Modo no-manual: renderizar en orden (tareas + hábitos mezclados por algoritmo inteligente) */
                <div className="listaTareasPendientes">
                    {pendientes
                        .filter(t => !t.parentId)
                        .map(tareaPadre => {
                            const subtareasVisibles = obtenerSubtareasVisibles(tareaPadre.id);

                            return (
                                <div key={tareaPadre.id} className="tareaPadreContenedor">
                                    {renderTareaConColapsador(tareaPadre, false)}

                                    {/* Subtareas (solo para tareas reales, no hábitos) */}
                                    {!esTareaHabito(tareaPadre) &&
                                        subtareasVisibles.map(subtarea => (
                                            <div key={subtarea.id} className="subtareaContenedor">
                                                {renderTareaConColapsador(subtarea, true)}
                                            </div>
                                        ))}
                                </div>
                            );
                        })}
                </div>
            )}

            {pendientes.length > 0 && completadas.length > 0 && !ocultarCompletadas && <div className="listaTareasSeparador" />}

            {!ocultarCompletadas &&
                completadas.map(tarea => {
                    const proyecto = tarea.proyectoId ? proyectos.find(p => p.id === tarea.proyectoId) : undefined;
                    let nombreProyecto: string | undefined = undefined;
                    const soloIcono = ocultarBadgeProyecto;

                    if (proyecto?.nombre) {
                        nombreProyecto = proyecto.nombre;
                        if (!soloIcono && nombreProyecto.length > 20) {
                            nombreProyecto = nombreProyecto.substring(0, 20) + '...';
                        }
                    }

                    return <TareaItem key={tarea.id} tarea={tarea} esSubtarea={!!tarea.parentId} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} onConfigurar={() => abrirConfiguracion(tarea.id)} nombreProyecto={nombreProyecto} soloIconoProyecto={soloIcono} onMoverProyecto={() => setTareaMoviendo(tarea)} onCompartir={() => onCompartirTarea?.(tarea)} estaCompartida={estaCompartida?.(tarea.id) ?? false} />;
                })}

            {/* Panel de configuración */}
            {tareaConfigurando && <PanelConfiguracionTarea tarea={tareaConfigurando} estaAbierto={true} onCerrar={() => setTareaConfigurando(null)} onGuardar={guardarConfiguracion} participantes={obtenerParticipantes ? obtenerParticipantes(tareaConfigurando) : []} />}

            {/* Modal Mover Proyecto */}
            <ModalMoverTarea estaAbierto={!!tareaMoviendo} onCerrar={() => setTareaMoviendo(null)} onMover={handleMoverProyecto} proyectos={proyectos} proyectoActualId={tareaMoviendo?.proyectoId} />
        </DashboardPanel>
    );
}
