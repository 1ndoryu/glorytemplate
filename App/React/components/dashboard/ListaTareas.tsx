/*
 * ListaTareas
 * Componente para mostrar la lista de tareas pendientes
 * Responsabilidad única: renderizar tareas con checkbox, input de creación, edición inline y acciones
 */

import {useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent} from 'react';
import {Check, X, Plus, Pencil} from 'lucide-react';
import type {Tarea} from '../../types/dashboard';

interface DatosEditarTarea {
    texto: string;
}

interface ListaTareasProps {
    tareas: Tarea[];
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEditarTarea) => void;
    onEditarTarea?: (id: number, datos: DatosEditarTarea) => void;
    onEliminarTarea?: (id: number) => void;
}

interface TareaItemProps {
    tarea: Tarea;
    onToggle?: () => void;
    onEditar?: (datos: DatosEditarTarea) => void;
    onEliminar?: () => void;
}

function TareaItem({tarea, onToggle, onEditar, onEliminar}: TareaItemProps): JSX.Element {
    const [mostrarAcciones, setMostrarAcciones] = useState(false);
    const [editando, setEditando] = useState(false);
    const [textoEditado, setTextoEditado] = useState(tarea.texto);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editando && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
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
        <div className="tareaItem" onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)}>
            <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`} onClick={onToggle}>
                {tarea.completado && <Check size={8} color="white" />}
            </div>
            <div className="tareaContenido" onClick={iniciarEdicion}>
                <p className={`tareaTexto ${tarea.completado ? 'tareaTextoCompletado' : ''}`}>{tarea.texto}</p>
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

export function ListaTareas({tareas, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea}: ListaTareasProps): JSX.Element {
    /* Ordenar: pendientes primero, completadas al final */
    const tareasOrdenadas = [...tareas].sort((a, b) => {
        if (a.completado === b.completado) return 0;
        return a.completado ? 1 : -1;
    });

    return (
        <div id="lista-tareas" className="dashboardPanel">
            {onCrearTarea && <InputNuevaTarea onCrear={onCrearTarea} />}
            {tareasOrdenadas.map(tarea => (
                <TareaItem key={tarea.id} tarea={tarea} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} />
            ))}
        </div>
    );
}
