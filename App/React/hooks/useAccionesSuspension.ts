/*
 * Hook: useAccionesSuspension — QQ65
 * Lógica para las acciones de suspensión/eliminación desde el panel de admin.
 */

import { useState, useCallback } from 'react';
import {
    suspenderUsuarioAdmin,
    desuspenderUsuarioAdmin,
    marcarEliminacionUsuarioAdmin,
    cancelarEliminacionUsuarioAdmin,
} from '@app/services/apiAdmin';
import type { UsuarioAdmin } from '@app/services/apiAdmin';
import { toast } from '@app/stores/toastStore';

type AccionSuspension = 'suspender' | 'eliminar' | null;

interface EstadoModalSuspension {
    accion: AccionSuspension;
    usuario: UsuarioAdmin | null;
}

interface UseAccionesSuspensionResult {
    modal: EstadoModalSuspension;
    procesando: boolean;
    abrirSuspender: (usuario: UsuarioAdmin) => void;
    abrirEliminar: (usuario: UsuarioAdmin) => void;
    cerrarModal: () => void;
    confirmarSuspension: (horas: number, razon: string) => Promise<boolean>;
    confirmarEliminacion: (razon: string) => Promise<boolean>;
    desuspender: (usuario: UsuarioAdmin) => Promise<boolean>;
    cancelarEliminacion: (usuario: UsuarioAdmin) => Promise<boolean>;
}

export const useAccionesSuspension = (
    onExito?: () => void
): UseAccionesSuspensionResult => {
    const [modal, setModal] = useState<EstadoModalSuspension>({
        accion: null,
        usuario: null,
    });
    const [procesando, setProcesando] = useState(false);

    const abrirSuspender = useCallback((usuario: UsuarioAdmin) => {
        setModal({ accion: 'suspender', usuario });
    }, []);

    const abrirEliminar = useCallback((usuario: UsuarioAdmin) => {
        setModal({ accion: 'eliminar', usuario });
    }, []);

    const cerrarModal = useCallback(() => {
        if (!procesando) setModal({ accion: null, usuario: null });
    }, [procesando]);

    const confirmarSuspension = useCallback(async (horas: number, razon: string): Promise<boolean> => {
        if (!modal.usuario) return false;
        setProcesando(true);
        const resp = await suspenderUsuarioAdmin(modal.usuario.id, horas, razon);
        setProcesando(false);

        if (resp.ok) {
            toast.exito(`Usuario @${modal.usuario.username} suspendido por ${horas}h`);
            cerrarModal();
            onExito?.();
            return true;
        }
        toast.error(resp.error ?? 'Error al suspender usuario');
        return false;
    }, [modal.usuario, cerrarModal, onExito]);

    const confirmarEliminacion = useCallback(async (razon: string): Promise<boolean> => {
        if (!modal.usuario) return false;
        setProcesando(true);
        const resp = await marcarEliminacionUsuarioAdmin(modal.usuario.id, razon);
        setProcesando(false);

        if (resp.ok) {
            toast.exito(`Usuario @${modal.usuario.username} marcado para eliminación`);
            cerrarModal();
            onExito?.();
            return true;
        }
        toast.error(resp.error ?? 'Error al marcar para eliminación');
        return false;
    }, [modal.usuario, cerrarModal, onExito]);

    const desuspender = useCallback(async (usuario: UsuarioAdmin): Promise<boolean> => {
        setProcesando(true);
        const resp = await desuspenderUsuarioAdmin(usuario.id);
        setProcesando(false);

        if (resp.ok) {
            toast.exito(`Suspensión de @${usuario.username} levantada`);
            onExito?.();
            return true;
        }
        toast.error(resp.error ?? 'Error al desuspender');
        return false;
    }, [onExito]);

    const cancelarEliminacion = useCallback(async (usuario: UsuarioAdmin): Promise<boolean> => {
        setProcesando(true);
        const resp = await cancelarEliminacionUsuarioAdmin(usuario.id);
        setProcesando(false);

        if (resp.ok) {
            toast.exito(`Eliminación de @${usuario.username} cancelada`);
            onExito?.();
            return true;
        }
        toast.error(resp.error ?? 'Error al cancelar eliminación');
        return false;
    }, [onExito]);

    return {
        modal,
        procesando,
        abrirSuspender,
        abrirEliminar,
        cerrarModal,
        confirmarSuspension,
        confirmarEliminacion,
        desuspender,
        cancelarEliminacion,
    };
};
