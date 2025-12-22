/*
 * InputNuevaTarea
 * Componente para crear nuevas tareas con input siempre visible
 */

import {useState, useCallback, useRef, type KeyboardEvent, type ChangeEvent} from 'react';
import {Plus, Check} from 'lucide-react';
import type {DatosEdicionTarea} from '../../types/dashboard';

interface InputNuevaTareaProps {
    onCrear: (datos: DatosEdicionTarea) => void;
}

export function InputNuevaTarea({onCrear}: InputNuevaTareaProps): JSX.Element {
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
                id="input-nueva-tarea-global"
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
