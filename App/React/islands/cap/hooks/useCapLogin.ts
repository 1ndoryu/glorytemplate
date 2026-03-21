/**
 * useCapLogin
 *
 * [2003A-7+2003A-9] Hook de autenticación via REST API.
 * Usa fetch a /cap/v1/auth/login en vez de form POST a wp-login.php.
 * Errores de credenciales se muestran inline sin salir de la página.
 */

import {useState, type FormEvent} from 'react';
import {API_BASE} from '../constants/cap-constants';

interface UseCapLoginParams {
    siteUrl: string;
    redirectTo: string;
    errorInicial: string;
}

export function useCapLogin({redirectTo, errorInicial}: UseCapLoginParams) {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [recordar, setRecordar] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(errorInicial);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!usuario.trim()) {
            setError('Ingresa tu usuario o correo electrónico');
            return;
        }

        if (!password) {
            setError('Ingresa tu contraseña');
            return;
        }

        setCargando(true);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const respuesta = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({usuario, password, recordar}),
                signal: controller.signal,
            });

            clearTimeout(timeout);
            const datos = await respuesta.json();

            if (!datos.ok) {
                setError(datos.error || 'Error al iniciar sesión.');
                setCargando(false);
                return;
            }

            /* Login exitoso: redirigir al dashboard */
            window.location.href = redirectTo;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                setError('La conexión tardó demasiado. Intenta de nuevo.');
            } else {
                setError('Error al conectar con el servidor. Intenta de nuevo.');
            }
            setCargando(false);
        }
    };

    return {
        usuario, setUsuario,
        password, setPassword,
        recordar, setRecordar,
        cargando,
        error,
        handleSubmit,
    };
}
