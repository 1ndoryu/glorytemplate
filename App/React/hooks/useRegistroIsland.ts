/*
 * Hook: useRegistroIsland
 * Lógica del formulario de registro: validación de contraseñas, submit.
 * Inputs NO controlados — sin value/onChange — para evitar el bug de Android WebView
 * donde React resetea el .value del DOM después de cada re-render, vaciando lo que
 * el usuario escribió con el teclado virtual (IME).
 */

import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from './useAuth';

export const useRegistroIsland = () => {
    /* Solo necesitamos estado para el error de contraseñas (feedback en tiempo real).
     * Los valores del formulario se leen de FormData en submit. */
    const [errorPassword, setErrorPassword] = useState<string | undefined>(undefined);
    const { cargando, error, registrar, iniciarSesionGoogle, googleBotonRef, esGoogleNativo, loginGoogleNativo } = useAuth();

    const manejarCambioPassword = useCallback((e: React.FormEvent<HTMLInputElement>) => {
        const form = e.currentTarget.form;
        if (!form) return;
        const fd = new FormData(form);
        const pw = (fd.get('password') as string | null) ?? '';
        const confirm = (fd.get('confirmar_password') as string | null) ?? '';
        setErrorPassword(confirm.length > 0 && pw !== confirm ? 'Las contraseñas no coinciden' : undefined);
    }, []);

    const manejarSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const nombreFinal = ((fd.get('nombre') as string | null) ?? '').trim();
        const usernameFinal = ((fd.get('username') as string | null) ?? '').trim();
        const emailFinal = ((fd.get('email') as string | null) ?? '').trim();
        const pwFinal = (fd.get('password') as string | null) ?? '';
        const confirmarFinal = (fd.get('confirmar_password') as string | null) ?? '';
        if (pwFinal !== confirmarFinal) {
            setErrorPassword('Las contraseñas no coinciden');
            return;
        }
        registrar({ nombreVisible: nombreFinal, username: usernameFinal, email: emailFinal, password: pwFinal });
    }, [registrar]);

    return {
        cargando,
        error,
        iniciarSesionGoogle,
        esGoogleNativo,
        loginGoogleNativo,
        googleBotonRef,
        manejarSubmit,
        manejarCambioPassword,
        errorPassword,
    };
};
