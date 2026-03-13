/*
 * Store: papeleraStore — Kamples (QQ57)
 * Estado global del modal de papelera.
 * Carga items eliminados (samples + publicaciones) y permite restaurar.
 */

import { create } from 'zustand';
import { apiGet, apiPost } from '@app/services/apiCliente';
import { toast } from '@app/stores/toastStore';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('papeleraStore');

export interface ItemPapelera {
    tipo: 'sample' | 'publicacion';
    id: number;
    titulo: string;
    slug: string | null;
    imagenUrl: string | null;
    eliminadoEn: string;
    diasRestantes: number;
}

interface EstadoPapelera {
    abierto: boolean;
    items: ItemPapelera[];
    cargando: boolean;
    restaurandoIds: Set<number>;

    abrir: () => void;
    cerrar: () => void;
    cargar: () => Promise<void>;
    restaurar: (tipo: 'sample' | 'publicacion', id: number) => Promise<boolean>;
}

export const usePapeleraStore = create<EstadoPapelera>((set, get) => ({
    abierto: false,
    items: [],
    cargando: false,
    restaurandoIds: new Set(),

    abrir: () => {
        set({ abierto: true });
        get().cargar();
    },

    cerrar: () => {
        set({ abierto: false });
    },

    cargar: async () => {
        set({ cargando: true });
        try {
            const resp = await apiGet<ItemPapelera[]>('/papelera');
            if (resp.ok && resp.data) {
                set({ items: resp.data, cargando: false });
            } else {
                log.warn('Error al cargar papelera', resp.error);
                set({ cargando: false });
            }
        } catch (e) {
            log.error('Error al cargar papelera', e);
            set({ cargando: false });
        }
    },

    restaurar: async (tipo, id) => {
        const prevIds = get().restaurandoIds;
        set({ restaurandoIds: new Set([...prevIds, id]) });

        const resp = await apiPost<{ restaurado: boolean }>('/papelera/restaurar', { tipo, id });

        if (resp.ok) {
            set((state) => ({
                items: state.items.filter((item) => !(item.tipo === tipo && item.id === id)),
                restaurandoIds: new Set([...state.restaurandoIds].filter((rid) => rid !== id)),
            }));
            toast.exito(tipo === 'sample' ? 'Sample restaurado' : 'Publicación restaurada');
            return true;
        }

        set((state) => ({
            restaurandoIds: new Set([...state.restaurandoIds].filter((rid) => rid !== id)),
        }));
        toast.error(resp.error ?? 'Error al restaurar');
        return false;
    },
}));
