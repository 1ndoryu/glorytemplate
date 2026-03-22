/*
 * Hook: useCancionAleatoria — Kamples
 * [223A-4] Gestiona el modal de descubrimiento de canciones aleatorias.
 * Carga canción aleatoria del top 2000, permite pasar a siguiente,
 * generar recorte y (admin) descargar audio completo.
 */

import { useState, useCallback } from 'react';
import { obtenerCancionAleatoria } from '@app/services/apiCanciones';
import { devGenerarRecorte } from '@app/services/apiCanciones';
import { useAuthStore, type EstadoAuth } from '@app/stores/authStore';
import type { CancionDetalle } from '@app/types/cancion';

export function useCancionAleatoria() {
    const [abierto, setAbierto] = useState(false);
    const [detalle, setDetalle] = useState<CancionDetalle | null>(null);
    const [cargando, setCargando] = useState(false);
    const [generandoRecorte, setGenerandoRecorte] = useState(false);
    const [mensajeRecorte, setMensajeRecorte] = useState('');
    const esAdmin = useAuthStore((s: EstadoAuth) => s.usuario?.rol === 'admin');

    const cargarAleatoria = useCallback(async () => {
        setCargando(true);
        setMensajeRecorte('');
        try {
            const resp = await obtenerCancionAleatoria();
            if (resp.ok && resp.data) {
                setDetalle(resp.data);
            }
        } finally {
            setCargando(false);
        }
    }, []);

    const abrir = useCallback(async () => {
        setAbierto(true);
        await cargarAleatoria();
    }, [cargarAleatoria]);

    const cerrar = useCallback(() => {
        setAbierto(false);
        setDetalle(null);
        setMensajeRecorte('');
    }, []);

    const siguiente = useCallback(async () => {
        await cargarAleatoria();
    }, [cargarAleatoria]);

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

    return {
        abierto,
        detalle,
        cargando,
        generandoRecorte,
        mensajeRecorte,
        esAdmin,
        abrir,
        cerrar,
        siguiente,
        generarRecorte,
    };
}
