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

    const manejarSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (password !== confirmarPassword) return;
        registrar({ nombreVisible: nombre, username, email, password });
    }, [password, confirmarPassword, nombre, username, email, registrar]);

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
