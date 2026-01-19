/**
 * Hook para gestionar la configuración de Stripe
 * Solo disponible para administradores
 */

import {useState, useEffect, useCallback} from 'react';

export interface EstadoStripe {
    configurado: boolean;
    modoTest: boolean;
    priceId: string;
    testKeysConfiguradas: boolean;
    liveKeysConfiguradas: boolean;
    webhookConfigurado: boolean;
    publishableKey: string;
    webhookUrl: string;
}

interface FormularioStripe {
    testPublishableKey: string;
    testSecretKey: string;
    livePublishableKey: string;
    liveSecretKey: string;
    webhookSecret: string;
    priceId: string;
    modoTest: boolean;
}

interface UseStripeReturn {
    estado: EstadoStripe | null;
    formulario: FormularioStripe;
    cargando: boolean;
    guardando: boolean;
    error: string | null;
    exito: string | null;
    setFormulario: React.Dispatch<React.SetStateAction<FormularioStripe>>;
    guardarConfiguracion: () => Promise<void>;
    limpiarMensajes: () => void;
}

const estadoInicial: EstadoStripe = {
    configurado: false,
    modoTest: true,
    priceId: '',
    testKeysConfiguradas: false,
    liveKeysConfiguradas: false,
    webhookConfigurado: false,
    publishableKey: '',
    webhookUrl: ''
};

const formularioInicial: FormularioStripe = {
    testPublishableKey: '',
    testSecretKey: '',
    livePublishableKey: '',
    liveSecretKey: '',
    webhookSecret: '',
    priceId: '',
    modoTest: true
};

export function useStripe(): UseStripeReturn {
    const [estado, setEstado] = useState<EstadoStripe | null>(null);
    const [formulario, setFormulario] = useState<FormularioStripe>(formularioInicial);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);

    /* Cargar estado actual de Stripe */
    const cargarEstado = useCallback(async () => {
        try {
            setCargando(true);
            const response = await fetch('/wp-json/cap/v1/stripe/config', {
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setError('No tienes permisos para acceder a esta configuración');
                    return;
                }
                throw new Error('Error al cargar configuración');
            }

            const data = await response.json();
            setEstado(data);

            /* Actualizar formulario con datos actuales */
            setFormulario(prev => ({
                ...prev,
                priceId: data.priceId || '',
                modoTest: data.modoTest
            }));
        } catch (err) {
            setError('Error al cargar la configuración de Stripe');
            console.error('[useStripe] Error:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarEstado();
    }, [cargarEstado]);

    /* Guardar configuración */
    const guardarConfiguracion = useCallback(async () => {
        setGuardando(true);
        setError(null);
        setExito(null);

        try {
            /* Solo enviamos campos que tienen valor */
            const datosEnviar: Partial<FormularioStripe> = {
                modoTest: formulario.modoTest
            };

            if (formulario.testPublishableKey) {
                datosEnviar.testPublishableKey = formulario.testPublishableKey;
            }
            if (formulario.testSecretKey) {
                datosEnviar.testSecretKey = formulario.testSecretKey;
            }
            if (formulario.livePublishableKey) {
                datosEnviar.livePublishableKey = formulario.livePublishableKey;
            }
            if (formulario.liveSecretKey) {
                datosEnviar.liveSecretKey = formulario.liveSecretKey;
            }
            if (formulario.webhookSecret) {
                datosEnviar.webhookSecret = formulario.webhookSecret;
            }
            if (formulario.priceId) {
                datosEnviar.priceId = formulario.priceId;
            }

            const response = await fetch('/wp-json/cap/v1/stripe/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                },
                body: JSON.stringify(datosEnviar)
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errores && data.errores.length > 0) {
                    setError(data.errores.join('. '));
                } else {
                    setError('Error al guardar la configuración');
                }
                return;
            }

            setExito('Configuración guardada correctamente');

            /* Actualizar estado con los datos devueltos */
            if (data.estado) {
                setEstado(data.estado);
            }

            /* Limpiar campos sensibles del formulario */
            setFormulario(prev => ({
                ...prev,
                testPublishableKey: '',
                testSecretKey: '',
                livePublishableKey: '',
                liveSecretKey: '',
                webhookSecret: ''
            }));
        } catch (err) {
            setError('Error de conexión al guardar');
            console.error('[useStripe] Error guardando:', err);
        } finally {
            setGuardando(false);
        }
    }, [formulario]);

    const limpiarMensajes = useCallback(() => {
        setError(null);
        setExito(null);
    }, []);

    return {
        estado: estado || estadoInicial,
        formulario,
        cargando,
        guardando,
        error,
        exito,
        setFormulario,
        guardarConfiguracion,
        limpiarMensajes
    };
}
