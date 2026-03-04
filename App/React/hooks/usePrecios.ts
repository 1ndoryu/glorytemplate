/**
 * Hook para obtener precios por temporada de un vehículo.
 *
 * Uso:
 *   const { precios, precioBase, loading } = usePrecios(vehiculoId);
 */

import { useMemo } from 'react';
import { useWordPressApi } from '@/hooks';
import type { PreciosResponse, PrecioTemporada } from '@app/types/cresta';

interface UsePreciosReturn {
    precios: PrecioTemporada[];
    precioBase: number;
    loading: boolean;
    error: string | null;
}

export function usePrecios(vehiculoId: number): UsePreciosReturn {
    const options = useMemo(() => ({
        cache: true as const,
    }), []);

    const { data, isLoading, error } = useWordPressApi<PreciosResponse>(
        `/glory/v1/precios?vehiculo_id=${vehiculoId}`,
        options,
    );

    return {
        precios: data?.precios ?? [],
        precioBase: data?.precioBase ?? 0,
        loading: isLoading,
        error,
    };
}
