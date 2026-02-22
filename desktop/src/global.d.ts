/*
 * Declaraciones de tipos para globals del proyecto
 * Kamples Desktop + plugins sin tipos oficiales.
 */

/* Globals inyectados por main.tsx */
interface Window {
    __GLORY_ROUTES__?: Record<string, { island: string; props?: Record<string, unknown> }>;
    __KAMPLES_DESKTOP__?: boolean;
    __KAMPLES_VERSION__?: string;
    __TAURI_INTERNALS__?: unknown;
    GLORY_CONTEXT?: {
        apiUrl?: string;
        restUrl?: string;
        nonce?: string;
    };
}

/* Declaraciones para @crabnebula/tauri-plugin-drag */
declare module '@crabnebula/tauri-plugin-drag' {
    interface DragOptions {
        item: string[];
        icon?: string;
    }
    export function startDrag(options: DragOptions): Promise<void>;
}
