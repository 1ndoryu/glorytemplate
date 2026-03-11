/*
 * Hook: useEdicionRelacion — Kamples (L6.2)
 * Gestiona el estado del modal de edicion/eliminacion de relaciones existentes.
 * Permite a cualquier usuario proponer cambios o reportar errores en relaciones de sampleo.
 */

import { useState, useCallback } from 'react';
import { proponerEdicion, proponerEliminacion } from '@app/services/apiContribuciones';
import { toast } from '@app/stores/toastStore';
import type { TipoRelacion, TipoElemento } from '@app/types/cancion';

export interface RelacionParaEditar {
    id: number;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento;
    cancionDestino?: string;
    cancionFuente?: string;
}

interface RetornoEdicionRelacion {
    relacionActiva: RelacionParaEditar | null;
    modoEliminacion: boolean;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento;
    razon: string;
    cargando: boolean;
    abrirEdicion: (relacion: RelacionParaEditar) => void;
    abrirEliminacion: (relacion: RelacionParaEditar) => void;
    setTipoRelacion: (v: TipoRelacion) => void;
    setTipoElemento: (v: TipoElemento) => void;
    setRazon: (v: string) => void;
    enviar: () => Promise<boolean>;
    cerrar: () => void;
}

export const useEdicionRelacion = (): RetornoEdicionRelacion => {
    const [relacionActiva, setRelacionActiva] = useState<RelacionParaEditar | null>(null);
    const [modoEliminacion, setModoEliminacion] = useState(false);
    const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('sample');
    const [tipoElemento, setTipoElemento] = useState<TipoElemento>('multiple_elements');
    const [razon, setRazon] = useState('');
    const [cargando, setCargando] = useState(false);

    const abrirEdicion = useCallback((relacion: RelacionParaEditar) => {
        setRelacionActiva(relacion);
        setModoEliminacion(false);
        setTipoRelacion(relacion.tipoRelacion);
        setTipoElemento(relacion.tipoElemento);
        setRazon('');
    }, []);

    const abrirEliminacion = useCallback((relacion: RelacionParaEditar) => {
        setRelacionActiva(relacion);
        setModoEliminacion(true);
        setRazon('');
    }, []);

    const cerrar = useCallback(() => {
        setRelacionActiva(null);
        setModoEliminacion(false);
        setRazon('');
        setCargando(false);
    }, []);

    const enviar = useCallback(async (): Promise<boolean> => {
        if (!relacionActiva) return false;

        setCargando(true);

        if (modoEliminacion) {
            if (razon.trim().length < 10) {
                toast.error('La razon debe tener al menos 10 caracteres.');
                setCargando(false);
                return false;
            }

            const resp = await proponerEliminacion(relacionActiva.id, razon.trim());
            setCargando(false);

            if (resp.ok && resp.data?.ok) {
                toast.exito('Propuesta de eliminacion enviada. Sera revisada por un moderador.');
                cerrar();
                return true;
            }

            toast.error(resp.data?.error ?? 'No se pudo enviar la propuesta.');
            return false;
        }

        /* Modo edicion: solo enviar campos que cambiaron */
        const cambios: Record<string, unknown> = {};

        if (tipoRelacion !== relacionActiva.tipoRelacion) {
            cambios['tipo_relacion'] = tipoRelacion;
        }
        if (tipoElemento !== relacionActiva.tipoElemento) {
            cambios['tipo_elemento'] = tipoElemento;
        }
        if (razon.trim()) {
            cambios['razon'] = razon.trim();
        }

        if (Object.keys(cambios).length === 0 || (!cambios['tipo_relacion'] && !cambios['tipo_elemento'])) {
            toast.error('No hay cambios para enviar.');
            setCargando(false);
            return false;
        }

        const resp = await proponerEdicion(relacionActiva.id, cambios);
        setCargando(false);

        if (resp.ok && resp.data?.ok) {
            toast.exito('Edicion propuesta enviada. Sera revisada por un moderador.');
            cerrar();
            return true;
        }

        toast.error(resp.data?.error ?? 'No se pudo enviar la edicion.');
        return false;
    }, [relacionActiva, modoEliminacion, tipoRelacion, tipoElemento, razon, cerrar]);

    return {
        relacionActiva,
        modoEliminacion,
        tipoRelacion,
        tipoElemento,
        razon,
        cargando,
        abrirEdicion,
        abrirEliminacion,
        setTipoRelacion,
        setTipoElemento,
        setRazon,
        enviar,
        cerrar,
    };
};
