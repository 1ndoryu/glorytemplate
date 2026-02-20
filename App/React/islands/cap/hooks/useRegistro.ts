/**
 * useRegistro
 *
 * Hook que centraliza toda la lógica del formulario de registro CAP.
 * Extraído de CapRegistroIsland para cumplir SRP: el componente solo
 * gestiona JSX, este hook gestiona estado y side-effects.
 */

import {useState, type FormEvent} from 'react';

export interface ErroresFormulario {
    nombreCentro?: string;
    nombreUsuario?: string;
    email?: string;
    password?: string;
    confirmarPassword?: string;
}

interface UseRegistroParams {
    restUrl: string;
    restNonce: string;
    loginUrl: string;
}

export function useRegistro({restUrl, restNonce, loginUrl}: UseRegistroParams) {
    /* Estado del formulario */
    const [nombreCentro, setNombreCentro] = useState('');
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [aceptaTerminos, setAceptaTerminos] = useState(false);

    /* Estado UI */
    const [cargando, setCargando] = useState(false);
    const [errores, setErrores] = useState<ErroresFormulario>({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [registroExitoso, setRegistroExitoso] = useState(false);

    /* Estado Stripe post-registro */
    const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
    const [diasTrial, setDiasTrial] = useState(14);
    const [redireccionando, setRedireccionando] = useState(false);

    /* Validación del formulario antes de enviar */
    const validarFormulario = (): boolean => {
        const nuevosErrores: ErroresFormulario = {};
        let esValido = true;

        if (!nombreCentro.trim()) {
            nuevosErrores.nombreCentro = 'El nombre del centro es obligatorio';
            esValido = false;
        }

        if (!nombreUsuario.trim()) {
            nuevosErrores.nombreUsuario = 'El nombre de usuario es obligatorio';
            esValido = false;
        } else if (nombreUsuario.length < 4) {
            nuevosErrores.nombreUsuario = 'Mínimo 4 caracteres';
            esValido = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            nuevosErrores.email = 'El correo es obligatorio';
            esValido = false;
        } else if (!emailRegex.test(email)) {
            nuevosErrores.email = 'Correo electrónico inválido';
            esValido = false;
        }

        if (!password) {
            nuevosErrores.password = 'La contraseña es obligatoria';
            esValido = false;
        } else if (password.length < 8) {
            nuevosErrores.password = 'Mínimo 8 caracteres';
            esValido = false;
        }

        if (password !== confirmarPassword) {
            nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
            esValido = false;
        }

        setErrores(nuevosErrores);
        return esValido;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorGeneral('');

        if (!validarFormulario()) return;

        if (!aceptaTerminos) {
            setErrorGeneral('Debes aceptar los términos y condiciones');
            return;
        }

        setCargando(true);
        try {
            const response = await fetch(`${restUrl}/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': restNonce
                },
                body: JSON.stringify({nombreCentro, nombreUsuario, email, password})
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar');
            }

            if (data.stripeCheckoutUrl) setStripeCheckoutUrl(data.stripeCheckoutUrl);
            if (data.diasTrial) setDiasTrial(data.diasTrial);

            setRegistroExitoso(true);
        } catch (err) {
            setErrorGeneral(err instanceof Error ? err.message : 'Error al crear la cuenta');
        } finally {
            setCargando(false);
        }
    };

    const irACheckout = () => {
        if (stripeCheckoutUrl) {
            setRedireccionando(true);
            window.location.href = stripeCheckoutUrl;
        }
    };

    return {
        /* Campos del formulario */
        nombreCentro, setNombreCentro,
        nombreUsuario, setNombreUsuario,
        email, setEmail,
        password, setPassword,
        confirmarPassword, setConfirmarPassword,
        aceptaTerminos, setAceptaTerminos,
        /* Estado UI */
        cargando, errores, errorGeneral, registroExitoso,
        /* Estado Stripe */
        stripeCheckoutUrl, diasTrial, redireccionando,
        /* Handlers */
        handleSubmit, irACheckout
    };
}
