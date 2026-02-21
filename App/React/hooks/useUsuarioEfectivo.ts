/*
 * Hook: useUsuarioEfectivo — Kamples
 * Devuelve el usuario con overrides de dev tools aplicados (si existen).
 * Los componentes usan este hook para leer plan/rol/auth con soporte de simulación.
 * Nota: las APIs siempre usan el usuario real, esto solo afecta la UI.
 */

import { useAuthStore } from '../stores/authStore';
import { useDevToolsStore } from '../stores/devToolsStore';
import type { UsuarioAutenticado } from '../types';

interface UsuarioEfectivoResult {
    usuario: UsuarioAutenticado | null;
    autenticado: boolean;
    cargando: boolean;
    esSimulacion: boolean;
}

export const useUsuarioEfectivo = (): UsuarioEfectivoResult => {
    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const cargando = useAuthStore(s => s.cargando);
    const override = useDevToolsStore((s) => s.override);

    /* Sin override activo: devolver datos reales */
    if (!override) {
        return { usuario, autenticado, cargando, esSimulacion: false };
    }

    /* Simular deslogueado */
    if (override.simulaDeslogueado) {
        return { usuario: null, autenticado: false, cargando: false, esSimulacion: true };
    }

    /* Aplicar overrides de plan/rol sobre el usuario real */
    if (usuario) {
        const usuarioModificado: UsuarioAutenticado = {
            ...usuario,
            ...(override.plan !== undefined ? { plan: override.plan } : {}),
            ...(override.rol !== undefined ? { rol: override.rol } : {}),
        };
        return { usuario: usuarioModificado, autenticado: true, cargando: false, esSimulacion: true };
    }

    return { usuario, autenticado, cargando, esSimulacion: Boolean(override) };
};
