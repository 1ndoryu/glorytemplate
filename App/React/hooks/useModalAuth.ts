/*
 * Hook: useModalAuth
 * Lógica del modal de autenticación: acceso a store y navegación entre vistas.
 * Extraído de ModalAuth.tsx para cumplir SRP.
 */

import { useCallback } from 'react';
import { useAuthModalStore } from '@app/stores/authModalStore';

export const useModalAuth = () => {
    const abierto = useAuthModalStore(s => s.abierto);
    const vista = useAuthModalStore(s => s.vista);
    const cerrar = useAuthModalStore(s => s.cerrar);
    const cambiarVista = useAuthModalStore(s => s.cambiarVista);

    const cambiarALogin = useCallback(() => cambiarVista('login'), [cambiarVista]);
    const cambiarARegistro = useCallback(() => cambiarVista('registro'), [cambiarVista]);

    return { abierto, vista, cerrar, cambiarALogin, cambiarARegistro };
};
