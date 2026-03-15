/*
 * Hook: useRegistrarCapa — Kamples (QL17)
 * Registra/desregistra automaticamente una capa modal en registroCapas
 * segun el estado abierto/cerrado. Un solo liner en cada componente modal.
 *
 * Uso:
 *   useRegistrarCapa('miModal', abierto, cerrar);
 */

import { useEffect } from 'react';
import { registrarCapa } from '@app/services/registroCapas';

export function useRegistrarCapa(id: string, abierto: boolean, cerrar: () => void): void {
    useEffect(() => {
        if (!abierto) return;
        return registrarCapa(id, cerrar);
    }, [id, abierto, cerrar]);
}
