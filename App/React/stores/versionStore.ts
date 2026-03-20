/*
 * [Tarea Final / 2003A-16] versionStore — Sistema de versiones multiplataforma.
 * Detecta si el usuario tiene una versión desactualizada y abre el modal de actualización.
 * Fuente: GET /app/versions, que lee las versiones almacenadas en WP options del VPS.
 * Las versiones se configuran desde el panel Admin → Configuración → Admin → Versiones de app.
 *
 * Plataformas detectadas:
 *   - 'windows': window.__KAMPLES_DESKTOP__ && !body.plataformaAndroid
 *   - 'apk':     window.__KAMPLES_DESKTOP__ && body.plataformaAndroid
 *   - 'web':     resto (version web siempre actualizada por definicion)
 *
 * El modal reaparece en cada recarga si hay actualización pendiente.
 * Dismiss en memoria (no localStorage): solo dura el ciclo de vida de la página.
 */

import { create } from 'zustand';

export interface InfoVersion {
    version: string;
    url?: string;
    notes?: string;
}

export interface VersionesDisponibles {
    windows?: InfoVersion | null;
    apk?: InfoVersion | null;
    web?: InfoVersion | null;
}

export type PlataformaApp = 'windows' | 'apk' | 'web';

interface VersionStore {
    versions: VersionesDisponibles;
    plataformaActual: PlataformaApp;
    cargando: boolean;
    /* modalAbierto: en-memoria — reaparece en cada reload si sigue desactualizado */
    modalAbierto: boolean;
    cargarVersiones: () => Promise<void>;
    cerrarModal: () => void;
}

function detectarPlataforma(): PlataformaApp {
    const w = window as unknown as Record<string, unknown>;
    if (w.__KAMPLES_DESKTOP__) {
        return document.body.classList.contains('plataformaAndroid') ? 'apk' : 'windows';
    }
    return 'web';
}

function esDesactualizada(actual: string, latest: string): boolean {
    const parse = (v: string): number[] => v.split('.').map(Number);
    const [ma, mi, pa] = parse(actual);
    const [ml, mli, pl] = parse(latest);
    if (ml > ma) return true;
    if (ml === ma && mli > mi) return true;
    if (ml === ma && mli === mi && pl > pa) return true;
    return false;
}

function obtenerBaseUrl(): string {
    const glory = (window as unknown as Record<string, unknown>).GLORY_CONTEXT as
        | { apiUrl?: string; restUrl?: string }
        | undefined;
    const raw = glory?.apiUrl ?? glory?.restUrl ?? '/wp-json';
    return raw.replace(/\/+$/, '');
}

export const useVersionStore = create<VersionStore>((set) => ({
    versions: {},
    plataformaActual: 'web',
    cargando: false,
    modalAbierto: false,

    cargarVersiones: async () => {
        set({ cargando: true });
        try {
            const base = obtenerBaseUrl();
            const res = await fetch(`${base}/kamples/v1/app/versions`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data: VersionesDisponibles = await res.json() as VersionesDisponibles;
            const plataforma = detectarPlataforma();
            const infoLatest = data[plataforma];
            let modalAbierto = false;

            /* Solo verificar en apps nativas: web siempre está al día (code is the version) */
            if (infoLatest?.version && plataforma !== 'web') {
                const actual = (window as unknown as Record<string, string>).__KAMPLES_VERSION__ ?? '0.0.0';
                if (esDesactualizada(actual, infoLatest.version)) {
                    modalAbierto = true;
                }
            }

            set({ versions: data, plataformaActual: plataforma, modalAbierto, cargando: false });
        } catch {
            /* Silencioso: el sistema de versiones no debe romper la app */
            set({ cargando: false });
        }
    },

    cerrarModal: () => {
        /* Sin persistencia: el modal reaparece en próxima recarga si sigue desactualizado */
        set({ modalAbierto: false });
    },
}));
