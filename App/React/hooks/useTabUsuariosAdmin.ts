/*
 * Hook: useTabUsuariosAdmin — QQ65
 * Lógica extraída de TabUsuariosAdmin para cumplir SRP.
 * Gestiona estado de procesamiento, toggle ban y acciones de suspensión.
 */

import { useState, useCallback } from 'react';
import type { UsuarioAdmin } from '@app/services/apiAdmin';
import { useAccionesSuspension } from './useAccionesSuspension';

interface UseTabUsuariosAdminParams {
    onActualizarUsuario: (id: number, cambios: Record<string, unknown>) => Promise<boolean>;
    totalUsuarios: number;
    onRefrescar?: () => void;
}

export const useTabUsuariosAdmin = ({
    onActualizarUsuario,
    totalUsuarios,
    onRefrescar,
}: UseTabUsuariosAdminParams) => {
    const [procesando, setProcesando] = useState<number | null>(null);
    const totalPaginas = Math.ceil(totalUsuarios / 20);

    const suspension = useAccionesSuspension(onRefrescar);

    const manejarAccion = useCallback(async (id: number, cambios: Record<string, unknown>) => {
        setProcesando(id);
        await onActualizarUsuario(id, cambios);
        setProcesando(null);
    }, [onActualizarUsuario]);

    const toggleBan = useCallback((usuario: UsuarioAdmin) => {
        if (usuario.ban_hasta) {
            manejarAccion(usuario.id, { ban_hasta: null });
        } else {
            const enUnaSemana = new Date();
            enUnaSemana.setDate(enUnaSemana.getDate() + 7);
            manejarAccion(usuario.id, { ban_hasta: enUnaSemana.toISOString() });
        }
    }, [manejarAccion]);

    return {
        procesando,
        totalPaginas,
        suspension,
        manejarAccion,
        toggleBan,
    };
};
