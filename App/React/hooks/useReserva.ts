/**
 * Hook para crear una reserva y manejar el flujo de pago.
 *
 * Uso:
 *   const { crear, loading, error, checkoutUrl } = useReserva();
 *   await crear({ vehiculo_id, fecha_inicio, fecha_fin, nombre, email, telefono });
 */

import { useState, useCallback } from 'react';
import { useGloryContext } from '@/hooks';
import type { CrearReservaPayload, CrearReservaResponse, CalculoPrecio } from '@app/types/cresta';

interface UseReservaReturn {
    crear: (datos: CrearReservaPayload) => Promise<CrearReservaResponse | null>;
    loading: boolean;
    error: string | null;
    checkoutUrl: string | null;
    reservaId: number | null;
    precio: CalculoPrecio | null;
}

export function useReserva(): UseReservaReturn {
    const { restUrl, nonce } = useGloryContext();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [reservaId, setReservaId] = useState<number | null>(null);
    const [precio, setPrecio] = useState<CalculoPrecio | null>(null);

    const baseUrl = restUrl?.replace(/\/$/, '') ?? '/wp-json';

    const crear = useCallback(async (datos: CrearReservaPayload): Promise<CrearReservaResponse | null> => {
        setLoading(true);
        setError(null);
        setCheckoutUrl(null);
        setReservaId(null);
        setPrecio(null);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (nonce) headers['X-WP-Nonce'] = nonce;

            const res = await fetch(`${baseUrl}/glory/v1/reservas`, {
                method: 'POST',
                headers,
                body: JSON.stringify(datos),
            });

            const data: CrearReservaResponse = await res.json();

            if (data.success && data.checkoutUrl) {
                setCheckoutUrl(data.checkoutUrl);
                setReservaId(data.reservaId ?? null);
                setPrecio(data.precio ?? null);
            } else {
                setError(data.error ?? data.motivo ?? 'Error al crear la reserva.');
            }

            return data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error de red';
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [baseUrl, nonce]);

    return { crear, loading, error, checkoutUrl, reservaId, precio };
}
