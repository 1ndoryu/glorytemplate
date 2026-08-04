import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export const GRUPO_SIN_GRUPO = '__sin_grupo__';

interface GruposEjecucionState {
    grupoPorPanel: Record<string, string | null>;
    gruposConocidos: string[];
}

interface GruposEjecucionActions {
    setGrupoPanel: (panelId: string, grupo: string | null) => void;
    getGrupoPanel: (panelId: string) => string | null;
    registrarGrupo: (grupo: string) => void;
    eliminarGrupo: (grupo: string) => void;
}

export const useGruposEjecucionStore = create<GruposEjecucionState & GruposEjecucionActions>()(
    persist(
        (set, get) => ({
            grupoPorPanel: {},
            gruposConocidos: [],

            setGrupoPanel: (panelId, grupo) => {
                set(state => ({
                    grupoPorPanel: {
                        ...state.grupoPorPanel,
                        [panelId]: grupo
                    }
                }));
            },

            getGrupoPanel: (panelId) => {
                return get().grupoPorPanel[panelId] ?? null;
            },

            registrarGrupo: (grupo) => {
                const normalizado = grupo.trim();
                if (!normalizado) return;
                set(state => {
                    if (state.gruposConocidos.includes(normalizado)) return state;
                    return {gruposConocidos: [...state.gruposConocidos, normalizado]};
                });
            },

            eliminarGrupo: (grupo) => {
                const normalizado = grupo.trim();
                set(state => ({
                    gruposConocidos: state.gruposConocidos.filter(g => g !== normalizado)
                }));
            }
        }),
        {
            name: 'glory_grupos_ejecucion'
        }
    )
);
