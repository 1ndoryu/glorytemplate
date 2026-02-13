/*
 * useGloryForm - Hook para enviar formularios al endpoint REST glory/v1/form
 * Maneja estado, validación básica y envío con feedback.
 */

import { useState, useCallback } from 'react';

interface DatosFormulario {
    formId: string;
    nombre: string;
    email: string;
    telefono?: string;
    mensaje?: string;
    extra?: Record<string, string>;
}

interface EstadoFormulario {
    enviando: boolean;
    exito: boolean | null;
    mensaje: string;
    errores: Record<string, string>;
}

interface ResultadoGloryForm {
    estado: EstadoFormulario;
    enviar: (datos: DatosFormulario) => Promise<boolean>;
    reiniciar: () => void;
}

const estadoInicial: EstadoFormulario = {
    enviando: false,
    exito: null,
    mensaje: '',
    errores: {},
};

/*
 * Valida los campos requeridos y el formato de email.
 * Retorna un objeto con los errores encontrados (vacío si todo OK).
 */
function validarDatos(datos: DatosFormulario): Record<string, string> {
    const errores: Record<string, string> = {};

    if (!datos.nombre.trim()) {
        errores.nombre = 'El nombre es obligatorio.';
    }

    if (!datos.email.trim()) {
        errores.email = 'El email es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
        errores.email = 'El formato del email no es válido.';
    }

    return errores;
}

export function useGloryForm(): ResultadoGloryForm {
    const [estado, setEstado] = useState<EstadoFormulario>(estadoInicial);

    const enviar = useCallback(async (datos: DatosFormulario): Promise<boolean> => {
        /* Validación previa */
        const errores = validarDatos(datos);
        if (Object.keys(errores).length > 0) {
            setEstado({ enviando: false, exito: false, mensaje: 'Corrige los errores del formulario.', errores });
            return false;
        }

        setEstado({ enviando: true, exito: null, mensaje: '', errores: {} });

        try {
            /* Construir URL del endpoint REST de Glory */
            const gloryCtx = (window as unknown as Record<string, unknown>).__GLORY_CONTEXT__ as
                Record<string, string> | undefined;
            const baseUrl = gloryCtx?.restUrl ?? '/wp-json/';

            const url = `${baseUrl}glory/v1/form`;

            const respuesta = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
            });

            const resultado = await respuesta.json() as { success: boolean; message: string };

            if (respuesta.ok && resultado.success) {
                setEstado({ enviando: false, exito: true, mensaje: resultado.message, errores: {} });
                return true;
            }

            setEstado({
                enviando: false,
                exito: false,
                mensaje: resultado.message || 'Error al enviar el formulario.',
                errores: {},
            });
            return false;

        } catch {
            setEstado({
                enviando: false,
                exito: false,
                mensaje: 'Error de conexión. Inténtalo más tarde.',
                errores: {},
            });
            return false;
        }
    }, []);

    const reiniciar = useCallback(() => {
        setEstado(estadoInicial);
    }, []);

    return { estado, enviar, reiniciar };
}
