/**
 * Hook para consultar la lista de vehículos.
 *
 * Uso:
 *   const { vehiculos, loading, error, refetch } = useVehiculos();
 */

import { useMemo } from 'react';
import { useWordPressApi } from '@/hooks';
import type { VehiculosListResponse, Vehiculo } from '@app/types/cresta';

interface UseVehiculosReturn {
    vehiculos: Vehiculo[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useVehiculos(): UseVehiculosReturn {
    const { data, isLoading, error, refetch } = useWordPressApi<VehiculosListResponse>(
        '/glory/v1/vehiculos',
    );

    const vehiculos = useMemo(() => data?.vehiculos ?? [], [data]);

    return { vehiculos, loading: isLoading, error, refetch };
}
