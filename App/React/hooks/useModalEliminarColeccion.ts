/*
 * useModalEliminarColeccion — Lógica del modal de eliminación de colección.
 * QL119: Opciones configurables para samples e hijas.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from '@app/stores/toastStore';
import { eliminarColeccionConOpciones } from '@app/services/apiColecciones';
import type { Coleccion, ColeccionResumen } from '@app/types';
import type { OpcionSelector } from '@app/components/ui/SelectorMenu';

interface UseModalEliminarParams {
    abierto: boolean;
    onCerrar: () => void;
    onEliminado?: () => void;
    coleccion: Coleccion | null;
}

export function useModalEliminarColeccion({
    abierto: _abierto,
    onCerrar,
    onEliminado,
    coleccion,
}: UseModalEliminarParams) {
    const [borrarSamples, setBorrarSamples] = useState<'mantener' | 'eliminar'>('mantener');
    const [manejoHijas, setManejoHijas] = useState<'huerfanas' | 'eliminar'>('huerfanas');
    const [borrarSamplesHijas, setBorrarSamplesHijas] = useState<'mantener' | 'eliminar'>('mantener');
    const [eliminando, setEliminando] = useState(false);

    const tieneHijas = useMemo(() => {
        const subs = coleccion?.subcolecciones ?? [];
        return subs.length > 0;
    }, [coleccion]);

    const totalSamplesHijas = useMemo(() => {
        if (!coleccion?.subcolecciones) return 0;
        return coleccion.subcolecciones.reduce(
            (acc: number, sub: ColeccionResumen) => acc + (sub.totalSamples ?? 0), 0
        );
    }, [coleccion]);

    const opcionesSamples = useMemo((): OpcionSelector[] => [
        { valor: 'mantener', etiqueta: 'Conservar samples (solo quitar de la colección)' },
        { valor: 'eliminar', etiqueta: 'Eliminar samples permanentemente' },
    ], []);

    const opcionesManejoHijas = useMemo((): OpcionSelector[] => [
        { valor: 'huerfanas', etiqueta: 'Convertir subcolecciones en colecciones raíz' },
        { valor: 'eliminar', etiqueta: 'Eliminar también las subcolecciones' },
    ], []);

    const opcionesSamplesHijas = useMemo((): OpcionSelector[] => [
        { valor: 'mantener', etiqueta: 'Conservar samples de las subcolecciones' },
        { valor: 'eliminar', etiqueta: 'Eliminar samples de las subcolecciones' },
    ], []);

    const manejarEliminar = useCallback(async () => {
        if (!coleccion?.id || eliminando) return;
        setEliminando(true);

        const resp = await eliminarColeccionConOpciones(coleccion.id, {
            borrarSamples: borrarSamples === 'eliminar',
            manejoHijas: manejoHijas,
            borrarSamplesHijas: borrarSamplesHijas === 'eliminar',
        });

        if (resp.ok) {
            const partes: string[] = ['Colección eliminada'];
            if (resp.data?.samplesEliminados) {
                partes.push(`${resp.data.samplesEliminados} samples eliminados`);
            }
            if (resp.data?.hijasEliminadas) {
                partes.push(`${resp.data.hijasEliminadas} subcolecciones eliminadas`);
            }
            if (resp.data?.hijasHuerfanas) {
                partes.push(`${resp.data.hijasHuerfanas} subcolecciones convertidas a raíz`);
            }
            toast.exito(partes.join(' — '));
            onCerrar();
            onEliminado?.();
        } else {
            toast.error(resp.error ?? 'Error al eliminar la colección');
        }
        setEliminando(false);
    }, [coleccion?.id, borrarSamples, manejoHijas, borrarSamplesHijas, eliminando, onCerrar, onEliminado]);

    return {
        borrarSamples,
        setBorrarSamples: (val: string) => setBorrarSamples(val as 'mantener' | 'eliminar'),
        manejoHijas,
        setManejoHijas: (val: string) => setManejoHijas(val as 'huerfanas' | 'eliminar'),
        borrarSamplesHijas,
        setBorrarSamplesHijas: (val: string) => setBorrarSamplesHijas(val as 'mantener' | 'eliminar'),
        eliminando,
        tieneHijas,
        totalSamplesHijas,
        opcionesSamples,
        opcionesManejoHijas,
        opcionesSamplesHijas,
        manejarEliminar,
    };
}
