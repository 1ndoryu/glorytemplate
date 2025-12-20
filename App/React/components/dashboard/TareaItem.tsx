/*
 * TareaItem
 * Componente individual de tarea
 */

import {useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent} from 'react';
import {Check, X, Pencil, Flag, Trash2} from 'lucide-react';
import type {Tarea, NivelPrioridad, DatosEdicionTarea} from '../../types/dashboard';
import {MenuContextual, type OpcionMenu} from '../shared/MenuContextual';

export interface TareaItemProps {
    tarea: Tarea;
    onToggle?: () => void;
    onEditar?: (datos: DatosEdicionTarea) => void;
    onEliminar?: () => void;
    esSubtarea?: boolean;
    onIndent?: () => void;
    onOutdent?: () => void;
    /* Crear nueva tarea debajo (hereda parentId si es subtarea, tareaActualId para posición) */
    onCrearNueva?: (parentId: number | undefined, tareaActualId: number) => void;
}

export interface MenuContextualEstado {
    visible: boolean;
    x: number;
    y: number;
}

export function TareaItem({tarea, onToggle, onEditar, onEliminar, esSubtarea = false, onIndent, onOutdent, onCrearNueva}: TareaItemProps): JSX.Element {
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
                evento.preventDefault();
                guardarEdicion();
                /* Crear nueva tarea debajo, heredando parentId si es subtarea */
                onCrearNueva?.(tarea.parentId, tarea.id);
            } else if (evento.key === 'Escape') {
                cancelarEdicion();
            } else if (evento.key === 'Tab') {
                /*
                 * Soporte para identacion/desidentacion (subtareas)
                 */
                evento.preventDefault();

                if (evento.shiftKey) {
                    /* Shift+Tab: Convertir en tarea principal (outdent) */
                    onOutdent?.();
                } else {
                    /* Tab: Convertir en subtarea (indent) */
                    onIndent?.();
                }
            }
        },
        [guardarEdicion, cancelarEdicion, onIndent, onOutdent, onCrearNueva, tarea.parentId, tarea.id]
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
            } else if (opcionId === 'sin-prioridad') {
                /* Quitar prioridad enviando null */
                onEditar?.({prioridad: null});
            } else if (['alta', 'media', 'baja'].includes(opcionId)) {
                onEditar?.({
                    prioridad: opcionId as NivelPrioridad
                });
            }
        },
        [onEliminar, onEditar]
    );

    /* Opciones del menu, solo mostrar "Sin prioridad" si la tarea ya tiene una */
    const opcionesBase: OpcionMenu[] = [
        {
            id: 'alta',
            etiqueta: 'Prioridad Alta',
            icono: <Flag size={12} color="#ef4444" /> /* Rojo */
        },
        {
            id: 'media',
            etiqueta: 'Prioridad Media',
            icono: <Flag size={12} color="#f59e0b" /> /* Naranja/Amarillo */
        },
        {
            id: 'baja',
            etiqueta: 'Prioridad Baja',
            icono: <Flag size={12} color="#94a3b8" /> /* Gris */,
            separadorDespues: !tarea.prioridad /* Separador solo si no hay opcion de quitar */
        }
    ];

    /* Agregar opcion de quitar prioridad solo si tiene una */
    if (tarea.prioridad) {
        opcionesBase.push({
            id: 'sin-prioridad',
            etiqueta: 'Sin prioridad',
            icono: <X size={12} />,
            separadorDespues: true
        });
    }

    /* Agregar opcion de eliminar al final */
    const opcionesMenu: OpcionMenu[] = [
        ...opcionesBase,
        {
            id: 'eliminar',
            etiqueta: 'Eliminar tarea',
            icono: <Trash2 size={12} />,
            peligroso: true
        }
    ];

    /* Renderizado del indicador de prioridad como badge de texto (igual que habitos) */
    const renderIndicadorPrioridad = () => {
        if (!tarea.prioridad) return null;

        const obtenerClasePrioridad = (prioridad: NivelPrioridad): string => {
            const clases = 'etiquetaPrioridad ';
            switch (prioridad) {
                case 'alta':
                    return clases + 'etiquetaAlta';
                case 'media':
                    return clases + 'etiquetaMedia';
                case 'baja':
                    return clases + 'etiquetaBaja';
            }
        };

        return <span className={obtenerClasePrioridad(tarea.prioridad)}>{tarea.prioridad.toUpperCase()}</span>;
    };

    if (editando) {
        return (
            <div className={`tareaItem tareaItemEditando ${esSubtarea ? 'tareaItemSubtarea' : ''}`}>
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`}>{tarea.completado && <Check size={8} color="white" />}</div>
                <div className="tareaContenido">
                    <input ref={inputRef} type="text" className="tareaEdicionInput" value={textoEditado} onChange={(e: ChangeEvent<HTMLInputElement>) => setTextoEditado(e.target.value)} onKeyDown={manejarTecla} onBlur={guardarEdicion} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`tareaItem ${esSubtarea ? 'tareaItemSubtarea' : ''}`} onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)} onContextMenu={manejarClickDerecho}>
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
