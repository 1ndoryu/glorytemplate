/*
 * Hook: useRegistroIsland
 * Lógica del formulario de registro: estado de campos, validación, submit.
 * Extraído de RegistroIsland.tsx para cumplir SRP.
 */

import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from './useAuth';

export const useRegistroIsland = () => {
    const [nombre, setNombre] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const { cargando, error, registrar, iniciarSesionGoogle, googleBotonRef } = useAuth();

    const manejarSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        /* Bug Android WebView IME: onChange de React no dispara en cada keystroke.
         * FormData lee los valores reales del DOM al hacer submit. */
        const fd = new FormData(e.currentTarget);
        const nombreFinal = ((fd.get('nombre') as string | null) ?? nombre).trim();
        const usernameFinal = ((fd.get('username') as string | null) ?? username).trim();
        const emailFinal = ((fd.get('email') as string | null) ?? email).trim();
        const pwFinal = (fd.get('password') as string | null) ?? password;
        const confirmarFinal = (fd.get('confirmar_password') as string | null) ?? confirmarPassword;
        if (pwFinal !== confirmarFinal) return;
        registrar({ nombreVisible: nombreFinal, username: usernameFinal, email: emailFinal, password: pwFinal });
    }, [nombre, username, email, password, confirmarPassword, registrar]);

    const errorPassword =
        confirmarPassword.length > 0 && password !== confirmarPassword
            ? 'Las contraseñas no coinciden'
            : undefined;

    return {
        nombre,
        setNombre,
        username,
        setUsername,
        email,
        setEmail,
        password,
        setPassword,
        confirmarPassword,
        setConfirmarPassword,
        cargando,
        error,
        iniciarSesionGoogle,
        googleBotonRef,
        manejarSubmit,
        errorPassword,
    };
};
