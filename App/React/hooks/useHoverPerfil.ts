/*
 * Hook: useHoverPerfil — Kamples
 * Retorna handlers de mouse para disparar el tooltip de perfil.
 * Timers gestionados centralmente en tooltipPerfilStore.
 * Pre-carga el perfil al entrar el mouse para que aparezca instantaneo.
 */

import { useCallback } from 'react';
import { useTooltipPerfilStore } from '@app/stores/tooltipPerfilStore';
import { obtenerPerfil } from '@app/services/apiAuth';

export function useHoverPerfil(username: string) {
    const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const store = useTooltipPerfilStore.getState();

        /* Pre-cargar perfil en cache mientras se espera el delay */
        if (!store.obtenerDeCache(username)) {
            obtenerPerfil(username)
                .then(resp => {
                    if (resp.data) {
                        useTooltipPerfilStore.getState().guardarEnCache(username, resp.data);
                    }
                })
                .catch(() => { /* sin-op: perfil no disponible */ });
        }

        const rect = e.currentTarget.getBoundingClientRect();
        store.programarAbrir(username, {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        });
    }, [username]);

    const onMouseLeave = useCallback(() => {
        useTooltipPerfilStore.getState().programarCerrar();
    }, []);

    return { onMouseEnter, onMouseLeave };
}
