/*
 * Hook: useModalAuth
 * Lógica del modal de autenticación: acceso a store y navegación entre vistas.
 * QL100a: En Android (APK), el modal es persistente — no se puede cerrar sin autenticarse.
 */

import { useCallback, useEffect } from 'react';
import { useAuthModalStore } from '@app/stores/authModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { esAndroid } from '@app/utils/plataforma';

export const useModalAuth = () => {
    const abierto = useAuthModalStore(s => s.abierto);
    const vista = useAuthModalStore(s => s.vista);
    const cerrarStore = useAuthModalStore(s => s.cerrar);
    const abrirStore = useAuthModalStore(s => s.abrir);
    const cambiarVista = useAuthModalStore(s => s.cambiarVista);
    const autenticado = useAuthStore(s => s.autenticado);
    const cargando = useAuthStore(s => s.cargando);

    const esApk = esAndroid();

    /* [183A-63] En APK: esperar a que termine la restauración de sesión (cargando=false)
     * antes de decidir si abrir el modal. Si el usuario ya está autenticado, cerrar
     * cualquier modal que se haya abierto prematuramente. */
    useEffect(() => {
        if (!esApk || cargando) return;
        if (!autenticado) {
            abrirStore('login');
        } else {
            cerrarStore();
        }
    }, [esApk, autenticado, cargando, abrirStore, cerrarStore]);

    /* En APK sin autenticar, cerrar es no-op */
    const cerrar = useCallback(() => {
        if (esApk && !autenticado) return;
        cerrarStore();
    }, [esApk, autenticado, cerrarStore]);

    const cambiarALogin = useCallback(() => cambiarVista('login'), [cambiarVista]);
    const cambiarARegistro = useCallback(() => cambiarVista('registro'), [cambiarVista]);

    return { abierto, vista, cerrar, cambiarALogin, cambiarARegistro, puedesCerrar: !(esApk && !autenticado) };
};
