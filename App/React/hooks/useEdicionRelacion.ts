/*
 * Hook: useEdicionRelacion — Kamples (L6.2)
 * Gestiona el estado del modal de edicion/eliminacion de relaciones existentes.
 * Permite a cualquier usuario proponer cambios o reportar errores en relaciones de sampleo.
 */

import { useState, useCallback } from 'react';
import { proponerEdicion, proponerEliminacion } from '@app/services/apiContribuciones';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import type { TipoRelacion, TipoElemento } from '@app/types/cancion';

export interface RelacionParaEditar {
    id: number;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento;
    cancionDestino?: string;
    cancionFuente?: string;
    youtubeUrl?: string;
    timingsFuente?: number[];
    timingsDestino?: number[];
    verificada?: boolean;
}

interface RetornoEdicionRelacion {
    relacionActiva: RelacionParaEditar | null;
    modoEliminacion: boolean;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento;
    youtubeUrl: string;
    timingsFuente: string;
    timingsDestino: string;
    verificada: boolean;
    razon: string;
    cargando: boolean;
    abrirEdicion: (relacion: RelacionParaEditar) => void;
    abrirEliminacion: (relacion: RelacionParaEditar) => void;
    setTipoRelacion: (v: TipoRelacion) => void;
    setTipoElemento: (v: TipoElemento) => void;
    setYoutubeUrl: (v: string) => void;
    setTimingsFuente: (v: string) => void;
    setTimingsDestino: (v: string) => void;
    setVerificada: (v: boolean) => void;
    setRazon: (v: string) => void;
    enviar: () => Promise<boolean>;
    cerrar: () => void;
}

export const useEdicionRelacion = (): RetornoEdicionRelacion => {
    const [relacionActiva, setRelacionActiva] = useState<RelacionParaEditar | null>(null);
    const [modoEliminacion, setModoEliminacion] = useState(false);
    const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('sample');
    const [tipoElemento, setTipoElemento] = useState<TipoElemento>('multiple_elements');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [timingsFuente, setTimingsFuente] = useState('');
    const [timingsDestino, setTimingsDestino] = useState('');
    const [verificada, setVerificada] = useState(false);
    const [razon, setRazon] = useState('');
    const [cargando, setCargando] = useState(false);

    const abrirEdicion = useCallback((relacion: RelacionParaEditar) => {
        setRelacionActiva(relacion);
        setModoEliminacion(false);
        setTipoRelacion(relacion.tipoRelacion);
        setTipoElemento(relacion.tipoElemento);
        setYoutubeUrl(relacion.youtubeUrl ?? '');
        setTimingsFuente(relacion.timingsFuente?.join(', ') ?? '');
        setTimingsDestino(relacion.timingsDestino?.join(', ') ?? '');
        setVerificada(relacion.verificada ?? false);
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
        setYoutubeUrl('');
        setTimingsFuente('');
        setTimingsDestino('');
        setVerificada(false);
        setRazon('');
        setCargando(false);
    }, []);

    const enviar = useCallback(async (): Promise<boolean> => {
        if (!relacionActiva) return false;

        setCargando(true);

        if (modoEliminacion) {
            if (razon.trim().length < 10) {
                toast.error(getT()('error.razonCorta'));
                setCargando(false);
                return false;
            }

            const resp = await proponerEliminacion(relacionActiva.id, razon.trim());
            setCargando(false);

            if (resp.ok && resp.data?.ok) {
                toast.exito('Propuesta de eliminación enviada. Será revisada por un moderador.');
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
        /* L7.7: Campos adicionales de edicion */
        const urlLimpia = youtubeUrl.trim();
        if (urlLimpia !== (relacionActiva.youtubeUrl ?? '')) {
            cambios['youtube_url'] = urlLimpia || null;
        }
        const parsearTimings = (raw: string): number[] => raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 0);
        const tfNuevos = parsearTimings(timingsFuente);
        const tdNuevos = parsearTimings(timingsDestino);
        const tfOrig = relacionActiva.timingsFuente ?? [];
        const tdOrig = relacionActiva.timingsDestino ?? [];
        if (JSON.stringify(tfNuevos) !== JSON.stringify(tfOrig)) {
            cambios['timings_fuente'] = tfNuevos;
        }
        if (JSON.stringify(tdNuevos) !== JSON.stringify(tdOrig)) {
            cambios['timings_destino'] = tdNuevos;
        }
        if (verificada !== (relacionActiva.verificada ?? false)) {
            cambios['verificada'] = verificada;
        }
        if (razon.trim()) {
            cambios['razon'] = razon.trim();
        }

        if (Object.keys(cambios).length === 0 || (Object.keys(cambios).length === 1 && cambios['razon'])) {
            toast.error(getT()('error.sinCambios'));
            setCargando(false);
            return false;
        }

        const resp = await proponerEdicion(relacionActiva.id, cambios);
        setCargando(false);

        if (resp.ok && resp.data?.ok) {
            toast.exito('Edición propuesta enviada. Será revisada por un moderador.');
            cerrar();
            return true;
        }

        toast.error(resp.data?.error ?? 'No se pudo enviar la edicion.');
        return false;
    }, [relacionActiva, modoEliminacion, tipoRelacion, tipoElemento, youtubeUrl, timingsFuente, timingsDestino, verificada, razon, cerrar]);

    return {
        relacionActiva,
        modoEliminacion,
        tipoRelacion,
        tipoElemento,
        youtubeUrl,
        timingsFuente,
        timingsDestino,
        verificada,
        razon,
        cargando,
        abrirEdicion,
        abrirEliminacion,
        setTipoRelacion,
        setTipoElemento,
        setYoutubeUrl,
        setTimingsFuente,
        setTimingsDestino,
        setVerificada,
        setRazon,
        enviar,
        cerrar,
    };
};
