/*
 * Store: bloqueosStore — Kamples (QQ25)
 * Estado global de bloqueos user-to-user.
 * Carga la lista de bloqueos al autenticarse y permite consultas rapidas.
 */

import { create } from 'zustand';
import {
    obtenerMisBloqueados,
    bloquearUsuario as apiBloquear,
    desbloquearUsuario as apiDesbloquear,
} from '@app/services/apiBloqueos';
import type { UsuarioBloqueado } from '@app/services/apiBloqueos';
import { toast } from '@app/stores/toastStore';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('bloqueosStore');

interface EstadoBloqueos {
    bloqueados: UsuarioBloqueado[];
    idsBloqueados: Set<number>;
    cargado: boolean;

    cargar: () => Promise<void>;
    bloquear: (usuarioId: number) => Promise<boolean>;
    desbloquear: (usuarioId: number) => Promise<boolean>;
    estaBloqueado: (usuarioId: number) => boolean;
}

export const useBloqueosStore = create<EstadoBloqueos>((set, get) => ({
    bloqueados: [],
    idsBloqueados: new Set(),
    cargado: false,

    cargar: async () => {
        try {
            const resp = await obtenerMisBloqueados();
            if (resp.ok && resp.data) {
                const ids = new Set(resp.data.map((u) => u.id));
                set({ bloqueados: resp.data, idsBloqueados: ids, cargado: true });
            }
        } catch (e) {
            log.warn('Error al cargar bloqueados', e);
        }
    },

    bloquear: async (usuarioId) => {
        const resp = await apiBloquear(usuarioId);
        if (resp.ok) {
            /* Recargar lista para obtener datos completos del usuario */
            await get().cargar();
            toast.exito('Usuario bloqueado');
            return true;
        }
        toast.error(resp.error ?? 'Error al bloquear usuario');
        return false;
    },

    desbloquear: async (usuarioId) => {
        const resp = await apiDesbloquear(usuarioId);
        if (resp.ok) {
            set((state) => ({
                bloqueados: state.bloqueados.filter((u) => u.id !== usuarioId),
                idsBloqueados: new Set([...state.idsBloqueados].filter((id) => id !== usuarioId)),
            }));
            toast.exito('Usuario desbloqueado');
            return true;
        }
        toast.error(resp.error ?? 'Error al desbloquear usuario');
        return false;
    },

    estaBloqueado: (usuarioId) => {
        return get().idsBloqueados.has(usuarioId);
    },
}));
