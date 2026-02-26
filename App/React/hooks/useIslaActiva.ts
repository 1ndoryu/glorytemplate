/*
 * Hook: useIslaActiva — Kamples
 * Retorna true cuando la isla identificada por islaId es la isla activa
 * en el PageRenderer. Útil para evitar que hooks de islas ocultas
 * (keep-alive con display:none) reaccionen a cambios globales.
 */

import { useNavigationStore } from '@/core/router';

export function useIslaActiva(islaId: string): boolean {
    return useNavigationStore(s => s.islaActual === islaId);
}
