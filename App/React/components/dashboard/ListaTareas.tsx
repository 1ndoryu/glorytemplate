/*
 * ListaTareas
 * Componente para mostrar la lista de tareas pendientes
 * Responsabilidad única: renderizar tareas con checkbox, input de creación, edición inline y acciones
 */

import {useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent, type ReactNode} from 'react';
import {Check, X, Plus, Pencil, Flag, Trash2} from 'lucide-react';
import {Reorder, useDragControls} from 'framer-motion';
import type {Tarea, NivelPrioridad} from '../../types/dashboard';
import {MenuContextual, type OpcionMenu} from '../shared/MenuContextual';

interface DatosEditarTarea {
    texto: string;
    prioridad?: NivelPrioridad;
}

interface ListaTareasProps {
    tareas: Tarea[];
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEditarTarea) => void;
    onEditarTarea?: (id: number, datos: DatosEditarTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
}

interface TareaItemProps {
    tarea: Tarea;
    onToggle?: () => void;
    onEditar?: (datos: DatosEditarTarea) => void;
    onEliminar?: () => void;
}

interface MenuContextualEstado {
    visible: boolean;
    x: number;
    y: number;
}

function TareaItem({tarea, onToggle, onEditar, onEliminar}: TareaItemProps): JSX.Element {
    const [mostrarAcciones, setMostrarAcciones] = useState(false);
    const [editando, setEditando] = useState(false);
    const [textoEditado, setTextoEditado] = useState(tarea.texto);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Estado menu contextual */
    const [menuContextual, setMenuContextual] = useState<MenuContextualEstado>({
        visible: false,
        x: 0,
        y: 0
    });

    useEffect(() => {
        if (editando && inputRef.current) {
            inputRef.current.focus();
            /* Bug fix: No seleccionar todo el texto automaticamente */
            /* Ponemos el cursor al final */
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
        }
    }, [editando]);

    const iniciarEdicion = useCallback(() => {
        setTextoEditado(tarea.texto);
        setEditando(true);
    }, [tarea.texto]);

    const guardarEdicion = useCallback(() => {
        const textoLimpio = textoEditado.trim();
        if (textoLimpio.length === 0) {
            cancelarEdicion();
            return;
        }

        if (textoLimpio !== tarea.texto) {
            onEditar?.({texto: textoLimpio});
        }
        setEditando(false);
    }, [textoEditado, tarea.texto, onEditar]);

    const cancelarEdicion = useCallback(() => {
        setTextoEditado(tarea.texto);
        setEditando(false);
    }, [tarea.texto]);

    const manejarTecla = useCallback(
        (evento: KeyboardEvent<HTMLInputElement>) => {
            if (evento.key === 'Enter') {
                guardarEdicion();
            } else if (evento.key === 'Escape') {
                cancelarEdicion();
            }
        },
        [guardarEdicion, cancelarEdicion]
    );

    /* Manejo del menu contextual */
    const manejarClickDerecho = useCallback((evento: React.MouseEvent) => {
        evento.preventDefault();
        evento.stopPropagation();
        setMenuContextual({
            visible: true,
            x: evento.clientX,
            y: evento.clientY
        });
    }, []);

    const cerrarMenuContextual = useCallback(() => {
        setMenuContextual(prev => ({...prev, visible: false}));
    }, []);

    const manejarOpcionMenu = useCallback(
        (opcionId: string) => {
            if (opcionId === 'eliminar') {
                onEliminar?.();
            } else if (['alta', 'media', 'baja'].includes(opcionId)) {
                onEditar?.({
                    texto: tarea.texto,
                    prioridad: opcionId as NivelPrioridad
                });
            }
        },
        [onEliminar, onEditar, tarea.texto]
    );

    const opcionesMenu: OpcionMenu[] = [
        {
            id: 'alta',
            etiqueta: 'Prioridad Alta',
            icono: <Flag size={12} color="#ef4444" /> /* Rojo */
        },
        {
            id: 'media',
            etiqueta: 'Prioridad Media',
            icono: <Flag size={12} color="#f59e0b" /> /* Arange/Amarillo */
        },
        {
            id: 'baja',
            etiqueta: 'Prioridad Baja',
            icono: <Flag size={12} color="#94a3b8" /> /* Gris */,
            separadorDespues: true
        },
        {
            id: 'eliminar',
            etiqueta: 'Eliminar tarea',
            icono: <Trash2 size={12} />,
            peligroso: true
        }
    ];

    /* Renderizado del indicador de prioridad */
    const renderIndicadorPrioridad = () => {
        if (!tarea.prioridad) return null;

        const colores = {
            alta: '#ef4444',
            media: '#f59e0b',
            baja: '#94a3b8'
        };

        return (
            <div className="tareaPrioridadIndicador" title={`Prioridad ${tarea.prioridad}`}>
                <Flag size={10} color={colores[tarea.prioridad]} fill={colores[tarea.prioridad]} />
            </div>
        );
    };

    if (editando) {
        return (
            <div className="tareaItem tareaItemEditando">
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`}>{tarea.completado && <Check size={8} color="white" />}</div>
                <div className="tareaContenido">
                    <input ref={inputRef} type="text" className="tareaEdicionInput" value={textoEditado} onChange={(e: ChangeEvent<HTMLInputElement>) => setTextoEditado(e.target.value)} onKeyDown={manejarTecla} onBlur={guardarEdicion} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="tareaItem" onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)} onContextMenu={manejarClickDerecho}>
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`} onClick={onToggle}>
                    {tarea.completado && <Check size={8} color="white" />}
                </div>
                <div className="tareaContenido" onClick={iniciarEdicion}>
                    <div className="tareaTextoWrapper">
                        <p className={`tareaTexto ${tarea.completado ? 'tareaTextoCompletado' : ''}`}>{tarea.texto}</p>
                        {renderIndicadorPrioridad()}
                    </div>
                </div>
                {mostrarAcciones && (
                    <div className="tareaAcciones">
                        <button className="tareaBotonEditar" onClick={iniciarEdicion} title="Editar tarea">
                            <Pencil size={12} />
                        </button>
                        <button className="tareaBotonEliminar" onClick={onEliminar} title="Eliminar tarea">
                            <X size={12} />
                        </button>
                    </div>
                )}
            </div>

            {menuContextual.visible && <MenuContextual opciones={opcionesMenu} posicionX={menuContextual.x} posicionY={menuContextual.y} onSeleccionar={manejarOpcionMenu} onCerrar={cerrarMenuContextual} />}
        </>
    );
}

interface InputNuevaTareaProps {
    onCrear: (datos: DatosEditarTarea) => void;
}

function InputNuevaTarea({onCrear}: InputNuevaTareaProps): JSX.Element {
    const [texto, setTexto] = useState('');
    const [enfocado, setEnfocado] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const manejarEnvio = useCallback(() => {
        const textoLimpio = texto.trim();
        if (textoLimpio.length === 0) return;

        onCrear({texto: textoLimpio});
        setTexto('');
        /* Mantener el foco para permitir crear varias tareas seguidas */
        inputRef.current?.focus();
    }, [texto, onCrear]);

    const manejarTecla = useCallback(
        (evento: KeyboardEvent<HTMLInputElement>) => {
            if (evento.key === 'Enter') {
                manejarEnvio();
            } else if (evento.key === 'Escape') {
                setTexto('');
                inputRef.current?.blur();
            }
        },
        [manejarEnvio]
    );

    const manejarCambioTexto = useCallback((evento: ChangeEvent<HTMLInputElement>) => {
        setTexto(evento.target.value);
    }, []);

    const tieneTexto = texto.trim().length > 0;

    return (
        <div className={`tareaNuevoInline ${enfocado || tieneTexto ? 'tareaNuevoInlineActivo' : ''}`}>
            <div className="tareaNuevoInlineIcono">
                <Plus size={12} />
            </div>
            <input
                ref={inputRef}
                type="text"
                className="tareaNuevoInlineInput"
                placeholder="Nueva tarea..."
                value={texto}
                onChange={manejarCambioTexto}
                onKeyDown={manejarTecla}
                onFocus={() => setEnfocado(true)}
                onBlur={() => {
                    setEnfocado(false);
                    /* Guardar si hay texto al perder foco */
                    if (texto.trim().length > 0) {
                        manejarEnvio();
                    }
                }}
            />
            {tieneTexto && (
                <button className="tareaNuevoInlineConfirmar" onClick={manejarEnvio} title="Crear tarea (Enter)">
                    <Check size={12} />
                </button>
            )}
        </div>
    );
}

interface DraggableItemProps extends TareaItemProps {
    tarea: Tarea;
}

function DraggableTareaItem({tarea, ...props}: DraggableItemProps) {
    /*
     * useDragControls permite iniciar el drag programaticamente
     * dragListener={true} (default) permite arrastrar desde cualquier parte del componente
     */
    return (
        <Reorder.Item value={tarea} as="div" style={{position: 'relative'}}>
            <TareaItem {...props} tarea={tarea} />
        </Reorder.Item>
    );
}

export function ListaTareas({tareas, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas}: ListaTareasProps): JSX.Element {
    /* Separar pendientes y completadas */
    const pendientes = tareas.filter(t => !t.completado);
    /* Las completadas se ordenan por defecto (id/creacion) o como vengan */
    const completadas = tareas.filter(t => t.completado);

    const handleReorder = (nuevosPendientes: Tarea[]) => {
        if (!onReordenarTareas) return;
        /* Reconstruimos la lista completa: pendientes reordenados + completadas */
        onReordenarTareas([...nuevosPendientes, ...completadas]);
    };

    return (
        <div id="lista-tareas" className="dashboardPanel">
            {onCrearTarea && <InputNuevaTarea onCrear={onCrearTarea} />}

            {/* Grupo de reordenamiento para tareas pendientes */}
            <Reorder.Group axis="y" values={pendientes} onReorder={handleReorder} className="listaTareasPendientes">
                {pendientes.map(tarea => (
                    <DraggableTareaItem key={tarea.id} tarea={tarea} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} />
                ))}
            </Reorder.Group>

            {/* Separador visual si hay ambos tipos */}
            {pendientes.length > 0 && completadas.length > 0 && <div className="listaTareasSeparador" />}

            {/* Tareas completadas (estaticas) */}
            {completadas.map(tarea => (
                <TareaItem key={tarea.id} tarea={tarea} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} />
            ))}
        </div>
    );
}
