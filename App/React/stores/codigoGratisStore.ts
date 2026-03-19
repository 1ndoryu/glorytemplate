/*
 * Store: codigoGratisStore — Kamples (183A-106)
 * Almacena codigos de descarga gratis que el usuario ha reclamado en esta sesion.
 * Codigos reclamados: { [codigo]: { tipo, targetId } }
 * Persiste en localStorage bajo 'kamples_codigos_gratis' para sobrevivir recargas.
 * Gotcha: el localStorage solo guarda el codigo y el targetId, la validez la confirma el backend.
 * [183A-110] Agrega infoExpirado para mostrar modal de compensacion cuando un codigo venció.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CodigoReclamado {
    tipo: 'sample' | 'coleccion';
    targetId: number;
}

/* [183A-110] Info de un codigo expirado, usada por ModalCodigoExpirado */
export interface InfoCodigoExpirado {
    nombreItem: string;
}

interface CodigosGratisStore {
    /* mapa codigo → info del item */
    codigosReclamados: Record<string, CodigoReclamado>;
    /* codigos pendientes de reclamar (guardados antes de autenticarse) */
    codigosPendientes: string[];
    /* [183A-110] info del ultimo codigo expirado para mostrar el modal */
    infoExpirado: InfoCodigoExpirado | null;
    reclamarCodigo: (codigo: string, tipo: 'sample' | 'coleccion', targetId: number) => void;
    agregarPendiente: (codigo: string) => void;
    limpiarPendientes: () => void;
    /* [183A-110] Acciones para el modal de expirado */
    setExpirado: (info: InfoCodigoExpirado) => void;
    limpiarExpirado: () => void;
    obtenerCodigoParaSample: (sampleId: number) => string | null;
    obtenerCodigoParaColeccion: (coleccionId: number) => string | null;
}

export const useCodigoGratisStore = create<CodigosGratisStore>()(
    persist(
        (set, get) => ({
            codigosReclamados: {},
            codigosPendientes: [],
            infoExpirado: null,

            reclamarCodigo: (codigo, tipo, targetId) =>
                set((s) => ({
                    codigosReclamados: { ...s.codigosReclamados, [codigo]: { tipo, targetId } },
                    /* Limpiar de pendientes si estaba */
                    codigosPendientes: s.codigosPendientes.filter((c) => c !== codigo),
                })),

            agregarPendiente: (codigo) =>
                set((s) => ({
                    codigosPendientes: s.codigosPendientes.includes(codigo)
                        ? s.codigosPendientes
                        : [...s.codigosPendientes, codigo],
                })),

            limpiarPendientes: () => set({ codigosPendientes: [] }),

            /* [183A-110] Activar modal de compensacion por codigo expirado */
            setExpirado: (info) => set({ infoExpirado: info }),
            limpiarExpirado: () => set({ infoExpirado: null }),

            /* Retorna el codigo reclamado para un sample, o null si no hay */
            obtenerCodigoParaSample: (sampleId) => {
                const reclamados = get().codigosReclamados;
                const entrada = Object.entries(reclamados).find(
                    ([, info]) => info.tipo === 'sample' && info.targetId === sampleId
                );
                return entrada ? entrada[0] : null;
            },

            /* Retorna el codigo reclamado para una coleccion, o null si no hay */
            obtenerCodigoParaColeccion: (coleccionId) => {
                const reclamados = get().codigosReclamados;
                const entrada = Object.entries(reclamados).find(
                    ([, info]) => info.tipo === 'coleccion' && info.targetId === coleccionId
                );
                return entrada ? entrada[0] : null;
            },
        }),
        {
            name: 'kamples_codigos_gratis',
            /* [183A-110] infoExpirado no debe persistirse — es estado temporal de sesion */
            partialize: (s) => ({
                codigosReclamados: s.codigosReclamados,
                codigosPendientes: s.codigosPendientes,
            }),
        }
    )
);
