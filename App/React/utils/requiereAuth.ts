/*
 * Utilidad: requiereAuth — Kamples (QQ82)
 * Guard reutilizable para acciones que necesitan autenticación.
 * Si el usuario no está autenticado, abre el modal de login y retorna false.
 * Si está autenticado, retorna true para que el caller continúe con la acción.
 *
 * Uso:
 *   if (!requiereAuth()) return;
 *   // ... acción que necesita auth
 */

import { useAuthStore } from '@app/stores/authStore';
import { useAuthModalStore } from '@app/stores/authModalStore';

export function requiereAuth(): boolean {
    const autenticado = useAuthStore.getState().autenticado;
    if (autenticado) return true;

    useAuthModalStore.getState().abrir('login');
    return false;
}
