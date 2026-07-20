/*
 * InputNuevaTarea
 * Componente para crear nuevas tareas con input siempre visible
 * Estilo unificado con "+ Añadir" de hábitos para coherencia visual
 *
 * Comportamiento:
 * - Click en "+ Añadir" sin texto: abre modal de creación (si onAbrirModalCrear existe)
 * - Click con texto o Enter: crea tarea directamente
 */

import {useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent} from 'react';
import {Check, ListTodo, Repeat} from 'lucide-react';
import type {DatosEdicionTarea} from '../../types/dashboard';
import {Input, Boton} from '../ui';

interface InputNuevaTareaProps {
    onCrear: (datos: DatosEdicionTarea) => void;
    /* Callback opcional para abrir modal de creación completo */
    onAbrirModalCrear?: () => void;
    /* [207A-4] Callback para abrir modal de creación de hábito */
    onAbrirModalCrearHabito?: () => void;
}

export function InputNuevaTarea({onCrear, onAbrirModalCrear, onAbrirModalCrearHabito}: InputNuevaTareaProps): JSX.Element {
    const [texto, setTexto] = useState('');
    const [enfocado, setEnfocado] = useState(false);
    const [submenuAbierto, setSubmenuAbierto] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const submenuRef = useRef<HTMLDivElement>(null);

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

    /* [207A-4] Cerrar submenu al hacer click fuera */
    useEffect(() => {
        if (!submenuAbierto) return;
        const manejarClickFuera = (e: MouseEvent) => {
            if (submenuRef.current && !submenuRef.current.contains(e.target as Node)) {
                setSubmenuAbierto(false);
            }
        };
        document.addEventListener('mousedown', manejarClickFuera);
        return () => document.removeEventListener('mousedown', manejarClickFuera);
    }, [submenuAbierto]);

    /* [207A-4] Manejar click en "+ Añadir": si hay callbacks de modal, mostrar submenu */
    const manejarClickAñadir = useCallback(() => {
        if (onAbrirModalCrear && onAbrirModalCrearHabito) {
            /* Ambos callbacks disponibles → mostrar submenu */
            setSubmenuAbierto(prev => !prev);
        } else if (onAbrirModalCrear) {
            onAbrirModalCrear();
        } else {
            inputRef.current?.focus();
        }
    }, [onAbrirModalCrear, onAbrirModalCrearHabito]);

    const manejarSeleccionSubmenu = useCallback((tipo: 'tarea' | 'habito') => {
        setSubmenuAbierto(false);
        if (tipo === 'tarea') {
            onAbrirModalCrear?.();
        } else {
            onAbrirModalCrearHabito?.();
        }
    }, [onAbrirModalCrear, onAbrirModalCrearHabito]);

    return (
        <div className={`areaNuevoInline ${enfocado || tieneTexto ? 'areaNuevoInlineActivo' : ''}`} onClick={manejarClickAñadir}>
            {!enfocado && !tieneTexto && (
                <span className="tareaNuevoInlineTexto" onClick={manejarClickAñadir}>
                    + Añadir
                </span>
            )}
            <Input
                id="input-nueva-tarea-global"
                ref={inputRef}
                tipo="text"
                claseAdicional={`areaNuevoInlineInput ${enfocado || tieneTexto ? '' : 'areaNuevoInlineInputOculto'}`}
                claseContenedor={enfocado || tieneTexto ? '' : 'inputContenedorInvisible'}
                placeholder="Escribe una tarea..."
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
                <Boton claseAdicional="tareaNuevoInlineConfirmar" onClick={manejarEnvio} title="Crear tarea (Enter)">
                    <Check size={12} />
                </Boton>
            )}
            {/* [207A-4] Submenu para elegir entre Tarea y Hábito */}
            {submenuAbierto && (
                <div className="submenuNuevoInline" ref={submenuRef}>
                    <button className="submenuNuevoInline__opcion" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); manejarSeleccionSubmenu('tarea'); }}>
                        <ListTodo size={14} />
                        <span>Tarea</span>
                    </button>
                    <button className="submenuNuevoInline__opcion" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); manejarSeleccionSubmenu('habito'); }}>
                        <Repeat size={14} />
                        <span>Hábito</span>
                    </button>
                </div>
            )}
        </div>
    );
}
