/**
 * useCapLogin
 *
 * Hook que encapsula la logica de autenticacion del formulario de login CAP.
 * Maneja estado del formulario, validacion y envio via POST a wp-login.php.
 */

import {useState, type FormEvent} from 'react';

interface UseCapLoginParams {
    siteUrl: string;
    redirectTo: string;
    errorInicial: string;
}

export function useCapLogin({siteUrl, redirectTo, errorInicial}: UseCapLoginParams) {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [recordar, setRecordar] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(errorInicial);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        if (!usuario.trim()) {
            setError('Ingresa tu usuario o correo electrónico');
            setCargando(false);
            return;
        }

        if (!password) {
            setError('Ingresa tu contraseña');
            setCargando(false);
            return;
        }

        try {
            /* Enviamos el formulario de forma tradicional para que WP maneje las cookies */
            const loginUrl = `${siteUrl}/wp-login.php`;
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = loginUrl;
            form.style.display = 'none';

            const inputs = [
                {name: 'log', value: usuario},
                {name: 'pwd', value: password},
                {name: 'rememberme', value: recordar ? 'forever' : ''},
                {name: 'redirect_to', value: redirectTo},
                {name: 'testcookie', value: '1'}
            ];

            inputs.forEach(({name, value}) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch {
            setError('Error al conectar con el servidor. Intenta de nuevo.');
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
