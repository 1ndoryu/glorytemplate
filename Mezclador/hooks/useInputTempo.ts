/*
 * useInputTempo — Lógica del control de BPM estilo FL Studio.
 * Drag vertical para cambiar valor, doble click para editar texto,
 * scroll wheel para ajustar. Extrae toda la lógica de InputTempo.tsx.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInputTempoParams {
    valor: number;
    onChange: (nuevoValor: number) => void;
    min: number;
    max: number;
    paso: number;
    pasoFino: number;
}

export const useInputTempo = ({
    valor, onChange, min, max, paso, pasoFino,
}: UseInputTempoParams) => {
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

    return {
        editando,
        valorTexto,
        setValorTexto,
        inputRef,
        iniciarDrag,
        alDobleClick,
        confirmarEdicion,
        alPresionarTecla,
        alScroll,
    };
};
