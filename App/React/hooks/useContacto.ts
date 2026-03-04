/**
 * useContacto — Lógica del formulario de contacto + datos de empresa.
 * Maneja estado del formulario, envío, respuesta y datos de la empresa.
 */

import { useState, useCallback } from 'react';
import { useGloryContext, useGloryOptions } from '@/hooks';

interface FormContacto {
    nombre: string;
    email: string;
    telefono: string;
    mensaje: string;
}

interface DatosEmpresa {
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
}

interface UseContactoResult {
    form: FormContacto;
    actualizarCampo: (campo: keyof FormContacto, valor: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    loading: boolean;
    enviado: boolean;
    error: string | null;
    resetear: () => void;
    empresa: DatosEmpresa;
}

const FORM_INICIAL: FormContacto = { nombre: '', email: '', telefono: '', mensaje: '' };

export function useContacto(): UseContactoResult {
    const { restUrl, nonce } = useGloryContext();
    const { get } = useGloryOptions();

    /* Datos de empresa desde opciones del tema */
    const empresaData = get('empresa', {}) as Record<string, string>;
    const empresa: DatosEmpresa = {
        nombre: empresaData.nombre || 'Cresta Campers',
        email: empresaData.email || '',
        telefono: empresaData.telefono || '',
        direccion: empresaData.direccion || '',
    };

    const [form, setForm] = useState<FormContacto>(FORM_INICIAL);
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const baseUrl = restUrl?.replace(/\/$/, '') ?? '/wp-json';

    const actualizarCampo = useCallback((campo: keyof FormContacto, valor: string) => {
        setForm(f => ({ ...f, [campo]: valor }));
    }, []);

    const resetear = useCallback(() => {
        setEnviado(false);
        setError(null);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.nombre || !form.email || !form.mensaje) {
            setError('Por favor, rellena todos los campos obligatorios.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (nonce) headers['X-WP-Nonce'] = nonce;

            const res = await fetch(`${baseUrl}/glory/v1/form`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    formId: 'cresta-contacto',
                    nombre: form.nombre,
                    email: form.email,
                    telefono: form.telefono,
                    mensaje: form.mensaje,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setEnviado(true);
                setForm(FORM_INICIAL);
            } else {
                setError(data.message ?? data.error ?? 'Error al enviar el formulario.');
            }
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [form, baseUrl, nonce]);

    return { form, actualizarCampo, handleSubmit, loading, enviado, error, resetear, empresa };
}
