/*
 * Hook: useCancionAleatoria — Kamples
 * [223A-4][223A-3-E] Gestiona el modal de descubrimiento de canciones aleatorias.
 * Carga canción aleatoria con filtros opcionales de género y década.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { obtenerCancionAleatoria, obtenerGenerosCanciones } from '@app/services/apiCanciones';
import { devGenerarRecorte } from '@app/services/apiCanciones';
import { useAuthStore, type EstadoAuth } from '@app/stores/authStore';
import type { CancionDetalle } from '@app/types/cancion';

/* Décadas disponibles para filtrar */
const DECADAS_DISPONIBLES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export function useCancionAleatoria() {
    const [abierto, setAbierto] = useState(false);
    const [detalle, setDetalle] = useState<CancionDetalle | null>(null);
    const [cargando, setCargando] = useState(false);
    const [generandoRecorte, setGenerandoRecorte] = useState(false);
    const [mensajeRecorte, setMensajeRecorte] = useState('');
    const esAdmin = useAuthStore((s: EstadoAuth) => s.usuario?.rol === 'admin');

    /* [223A-3-E] Filtros género y década */
    const [generosDisponibles, setGenerosDisponibles] = useState<string[]>([]);
    const [generosIncluidos, setGenerosIncluidos] = useState<string[]>([]);
    const [generosExcluidos, setGenerosExcluidos] = useState<string[]>([]);
    const [decadasIncluidas, setDecadasIncluidas] = useState<string[]>([]);
    const [decadasExcluidas, setDecadasExcluidas] = useState<string[]>([]);
    const generosCargados = useRef(false);

    /* Cargar géneros una sola vez al abrir */
    useEffect(() => {
        if (!abierto || generosCargados.current) return;
        generosCargados.current = true;
        obtenerGenerosCanciones().then(resp => {
            if (resp.ok && resp.data) setGenerosDisponibles(resp.data);
        });
    }, [abierto]);

    const cargarAleatoria = useCallback(async (generos: string[], decadas: string[]) => {
        setCargando(true);
        setMensajeRecorte('');
        try {
            const resp = await obtenerCancionAleatoria(
                generos.length > 0 ? generos : undefined,
                decadas.length > 0 ? decadas.map(Number) : undefined
            );
            if (resp.ok && resp.data) {
                setDetalle(resp.data);
            }
        } finally {
            setCargando(false);
        }
    }, []);

    const abrir = useCallback(async () => {
        setAbierto(true);
        await cargarAleatoria(generosIncluidos, decadasIncluidas);
    }, [cargarAleatoria, generosIncluidos, decadasIncluidas]);

    const cerrar = useCallback(() => {
        setAbierto(false);
        setDetalle(null);
        setMensajeRecorte('');
    }, []);

    const siguiente = useCallback(async () => {
        await cargarAleatoria(generosIncluidos, decadasIncluidas);
    }, [cargarAleatoria, generosIncluidos, decadasIncluidas]);

    /* Generar recorte: busca la primera relación que tenga sample posible */
    const generarRecorte = useCallback(async () => {
        if (!detalle || generandoRecorte) return;
        const relacion = detalle.samplesDe[0] ?? detalle.sampleadaEn[0];
        if (!relacion) {
            setMensajeRecorte('No hay relaciones de sampleo para generar recorte');
            return;
        }
        setGenerandoRecorte(true);
        setMensajeRecorte('Generando recorte...');
        try {
            const resp = await devGenerarRecorte(relacion.id);
            if (resp.ok) {
                setMensajeRecorte(`Recorte generado: ${resp.data?.mensaje ?? 'en cola'}`);
            } else {
                setMensajeRecorte(resp.error ?? 'Error al generar recorte');
            }
        } catch {
            setMensajeRecorte('Error de red al generar recorte');
        } finally {
            setGenerandoRecorte(false);
        }
    }, [detalle, generandoRecorte]);

    /* [223A-3-E] Callbacks para SelectFiltro */
    const incluirGenero = useCallback((g: string) => setGenerosIncluidos(prev => [...prev, g]), []);
    const excluirGenero = useCallback((g: string) => {
        setGenerosExcluidos(prev => [...prev, g]);
        setGenerosIncluidos(prev => prev.filter(x => x !== g));
    }, []);
    const quitarGenero = useCallback((g: string) => {
        setGenerosIncluidos(prev => prev.filter(x => x !== g));
        setGenerosExcluidos(prev => prev.filter(x => x !== g));
    }, []);

    const incluirDecada = useCallback((d: string) => setDecadasIncluidas(prev => [...prev, d]), []);
    const excluirDecada = useCallback((d: string) => {
        setDecadasExcluidas(prev => [...prev, d]);
        setDecadasIncluidas(prev => prev.filter(x => x !== d));
    }, []);
    const quitarDecada = useCallback((d: string) => {
        setDecadasIncluidas(prev => prev.filter(x => x !== d));
        setDecadasExcluidas(prev => prev.filter(x => x !== d));
    }, []);

    return {
        abierto, detalle, cargando, generandoRecorte, mensajeRecorte, esAdmin,
        abrir, cerrar, siguiente, generarRecorte,
        /* [223A-3-E] Filtros */
        generosDisponibles, generosIncluidos, generosExcluidos,
        incluirGenero, excluirGenero, quitarGenero,
        decadasDisponibles: DECADAS_DISPONIBLES.map(String),
        decadasIncluidas, decadasExcluidas,
        incluirDecada, excluirDecada, quitarDecada,
    };
}
