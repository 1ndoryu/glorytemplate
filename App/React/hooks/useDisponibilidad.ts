/**
 * Hook para consultar disponibilidad y calendario de un vehículo.
 *
 * Uso:
 *   const { disponible, precio, verificar, calendario, cargarCalendario, loading } = useDisponibilidad(vehiculoId);
 */

import { useState, useCallback } from 'react';
import { useGloryContext } from '@/hooks';
import type {
    DisponibilidadResponse,
    CalendarioResponse,
    CalendarioDia,
    CalculoPrecio,
} from '@app/types/cresta';

interface UseDisponibilidadReturn {
    disponible: boolean | null;
    precio: CalculoPrecio | null;
    motivo: string | null;
    loading: boolean;
    error: string | null;
    verificar: (fechaInicio: string, fechaFin: string) => Promise<DisponibilidadResponse | null>;
    calendario: CalendarioDia[];
    calendarioLoading: boolean;
    cargarCalendario: (mes: number, anio: number) => Promise<void>;
}

export function useDisponibilidad(vehiculoId: number): UseDisponibilidadReturn {
    const { restUrl, nonce } = useGloryContext();

    const [disponible, setDisponible] = useState<boolean | null>(null);
    const [precio, setPrecio] = useState<CalculoPrecio | null>(null);
    const [motivo, setMotivo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [calendario, setCalendario] = useState<CalendarioDia[]>([]);
    const [calendarioLoading, setCalendarioLoading] = useState(false);

    const baseUrl = restUrl?.replace(/\/$/, '') ?? '/wp-json';

    const verificar = useCallback(async (fechaInicio: string, fechaFin: string): Promise<DisponibilidadResponse | null> => {
        setLoading(true);
        setError(null);
        setDisponible(null);
        setPrecio(null);
        setMotivo(null);

        try {
            const params = new URLSearchParams({
                vehiculo_id: String(vehiculoId),
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
            });

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (nonce) headers['X-WP-Nonce'] = nonce;

            const res = await fetch(`${baseUrl}/glory/v1/disponibilidad?${params}`, { headers });
            const data: DisponibilidadResponse = await res.json();

            setDisponible(data.disponible);
            if (data.disponible && data.precio) {
                setPrecio(data.precio);
            }
            if (!data.disponible && data.motivo) {
                setMotivo(data.motivo);
            }

            return data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error de red';
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [vehiculoId, baseUrl, nonce]);

    const cargarCalendario = useCallback(async (mes: number, anio: number): Promise<void> => {
        setCalendarioLoading(true);
        try {
            const params = new URLSearchParams({
                vehiculo_id: String(vehiculoId),
                mes: String(mes),
                anio: String(anio),
            });

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (nonce) headers['X-WP-Nonce'] = nonce;

            const res = await fetch(`${baseUrl}/glory/v1/disponibilidad/calendario?${params}`, { headers });
            const data: CalendarioResponse = await res.json();

            if (data.success) {
                setCalendario(data.dias);
            }
        } catch {
            setCalendario([]);
        } finally {
            setCalendarioLoading(false);
        }
    }, [vehiculoId, baseUrl, nonce]);

    return {
        disponible,
        precio,
        motivo,
        loading,
        error,
        verificar,
        calendario,
        calendarioLoading,
        cargarCalendario,
    };
}
