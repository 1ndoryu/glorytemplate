/*
 * InputTempo — Control de BPM estilo FL Studio.
 * C298: Drag vertical para cambiar valor (arriba sube, abajo baja),
 * doble click para editar texto directo. Sin botones arriba/abajo.
 * Altura consistente con botones del nav DAW (28px).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface InputTempoProps {
    valor: number;
    onChange: (nuevoValor: number) => void;
    min?: number;
    max?: number;
    etiqueta?: string;
    paso?: number;
    pasoFino?: number;
}

export const InputTempo = ({
    valor,
    onChange,
    min = 40,
    max = 300,
    etiqueta = 'BPM',
    paso = 1,
    pasoFino = 0.1,
}: InputTempoProps): JSX.Element => {
    const [editando, setEditando] = useState(false);
    const [valorTexto, setValorTexto] = useState(String(valor));
    const inputRef = useRef<HTMLInputElement>(null);
    const dragRef = useRef({
        activo: false,
        yInicial: 0,
        valorInicial: 0,
        shift: false,
    });

    /* Sincronizar texto con valor externo cuando no se edita */
    useEffect(() => {
        if (!editando) setValorTexto(String(valor));
    }, [valor, editando]);

    /* Enfocar input al entrar en modo edición */
    useEffect(() => {
        if (editando && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editando]);

    const clampear = useCallback((v: number) => {
        return Math.round(Math.max(min, Math.min(max, v)));
    }, [min, max]);

    /* Iniciar drag vertical */
    const iniciarDrag = useCallback((e: React.MouseEvent) => {
        if (editando) return;
        e.preventDefault();
        dragRef.current = {
            activo: true,
            yInicial: e.clientY,
            valorInicial: valor,
            shift: e.shiftKey,
        };
        document.body.style.cursor = 'ns-resize';
    }, [editando, valor]);

    /* Listeners globales para drag */
    useEffect(() => {
        const mover = (e: MouseEvent) => {
            if (!dragRef.current.activo) return;
            const deltaY = dragRef.current.yInicial - e.clientY;
            const pasoActual = e.shiftKey ? pasoFino : paso;
            const incremento = deltaY * pasoActual;
            const nuevoValor = clampear(dragRef.current.valorInicial + incremento);
            if (nuevoValor !== valor) onChange(nuevoValor);
        };

        const soltar = () => {
            if (dragRef.current.activo) {
                dragRef.current.activo = false;
                document.body.style.cursor = '';
            }
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
        };
    }, [valor, onChange, paso, pasoFino, clampear]);

    /* Doble click para editar */
    const alDobleClick = useCallback(() => {
        setEditando(true);
        setValorTexto(String(valor));
    }, [valor]);

    /* Confirmar edición */
    const confirmarEdicion = useCallback(() => {
        setEditando(false);
        const parsed = parseInt(valorTexto, 10);
        if (!isNaN(parsed)) {
            onChange(clampear(parsed));
        }
    }, [valorTexto, onChange, clampear]);

    /* Teclas en modo edición */
    const alPresionarTecla = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            confirmarEdicion();
        } else if (e.key === 'Escape') {
            setEditando(false);
            setValorTexto(String(valor));
        }
    }, [confirmarEdicion, valor]);

    /* Scroll wheel para ajustar */
    const alScroll = useCallback((e: React.WheelEvent) => {
        if (editando) return;
        e.preventDefault();
        const pasoActual = e.shiftKey ? pasoFino : paso;
        const delta = e.deltaY < 0 ? pasoActual : -pasoActual;
        onChange(clampear(valor + delta));
    }, [editando, valor, onChange, paso, pasoFino, clampear]);

    return (
        <div className="inputTempo" onWheel={alScroll}>
            {editando ? (
                <input
                    ref={inputRef}
                    type="text"
                    className="inputTempoEdicion"
                    value={valorTexto}
                    onChange={(e) => setValorTexto(e.target.value)}
                    onBlur={confirmarEdicion}
                    onKeyDown={alPresionarTecla}
                />
            ) : (
                <div
                    className="inputTempoValor"
                    onMouseDown={iniciarDrag}
                    onDoubleClick={alDobleClick}
                    title="Arrastrar para cambiar, doble click para editar"
                >
                    {valor}
                </div>
            )}
            <span className="inputTempoEtiqueta">{etiqueta}</span>
        </div>
    );
};
