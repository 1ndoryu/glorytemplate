/*
 * Hook: useVincularSample — L7.4
 * Lógica para buscar samples propios y vincular uno a una relacion de sampleo.
 * Usado por ModalVincularSampleExistente.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { listarSamples } from '@app/services/apiSamples';
import { vincularSample, type LadoRelacion } from '@app/services/apiRelaciones';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import type { SampleResumen } from '@app/types';

const log = crearLogger('useVincularSample');

interface UseVincularSampleOpciones {
    relacionId: number;
    lado: LadoRelacion;
    onExito?: () => void;
}

export const useVincularSample = ({ relacionId, lado, onExito }: UseVincularSampleOpciones) => {
    const usuario = useAuthStore(s => s.usuario);
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(false);
    const [vinculando, setVinculando] = useState(false);
    const [seleccionado, setSeleccionado] = useState<SampleResumen | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* Carga inicial: samples recientes del usuario */
    useEffect(() => {
        if (!usuario?.username) return;
        setCargando(true);
        listarSamples({ creador: usuario.username, perPage: 12 })
            .then(resp => {
                if (resp.ok && resp.data) setResultados(resp.data.data);
            })
            .finally(() => setCargando(false));
    }, [usuario?.username]);

    /* Búsqueda con debounce */
    const buscar = useCallback((texto: string) => {
        setQuery(texto);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!usuario?.username) return;

        timeoutRef.current = setTimeout(async () => {
            setCargando(true);
            try {
                const resp = await listarSamples({
                    creador: usuario.username,
                    busqueda: texto || undefined,
                    perPage: 12,
                });
                if (resp.ok && resp.data) setResultados(resp.data.data);
            } finally {
                setCargando(false);
            }
        }, 350);
    }, [usuario?.username]);

    /* Cleanup timeout */
    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    /* Vincular el sample seleccionado */
    const confirmar = useCallback(async () => {
        if (!seleccionado || vinculando) return;
        setVinculando(true);
        try {
            const resp = await vincularSample(relacionId, seleccionado.id, lado);
            if (!resp.ok) {
                toast.error(resp.error ?? 'Error al vincular sample');
                setVinculando(false);
                return;
            }
            toast.exito('Sample vinculado correctamente');
            log.info('Sample vinculado', { sampleId: seleccionado.id, relacionId, lado });
            onExito?.();
        } catch (error) {
            log.error('Error inesperado al vincular sample', error);
            toast.error('Error de conexión');
            setVinculando(false);
        }
    }, [seleccionado, vinculando, relacionId, lado, onExito]);

    return {
        query, buscar, resultados, cargando, vinculando,
        seleccionado, setSeleccionado, confirmar,
    };
};
