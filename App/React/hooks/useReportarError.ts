/*
 * Hook: useReportarError — Kamples
 * Lógica extraída de ModalReportarError (SRP).
 * Gestiona el estado del formulario y el envío del reporte de error.
 */

import { useState, useCallback } from 'react';
import { useReportarErrorStore } from '@app/stores/reportarErrorStore';
import { apiPost } from '@app/services/apiCliente';
import { toast } from '@app/stores/toastStore';

export function useReportarError() {
    const abierto = useReportarErrorStore(s => s.abierto);
    const cerrarStore = useReportarErrorStore(s => s.cerrar);

    const [asunto, setAsunto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);

    const limpiar = useCallback(() => {
        setAsunto('');
        setDescripcion('');
    }, []);

    const cerrar = useCallback(() => {
        limpiar();
        cerrarStore();
    }, [limpiar, cerrarStore]);

    const enviar = useCallback(async () => {
        const asuntoTrim = asunto.trim();
        const descripcionTrim = descripcion.trim();

        if (!asuntoTrim) {
            toast.error('Escribe un asunto para el reporte');
            return;
        }
        if (!descripcionTrim) {
            toast.error('Describe el error que encontraste');
            return;
        }

        setEnviando(true);

        const resp = await apiPost<{ id: number }>('/reportar-error', {
            razon: asuntoTrim,
            detalles: descripcionTrim,
            url: window.location.pathname,
        });

        setEnviando(false);

        if (resp.ok) {
            toast.exito('Reporte enviado. Gracias por ayudarnos a mejorar.');
            cerrar();
        } else {
            toast.error(resp.error ?? 'No se pudo enviar el reporte');
        }
    }, [asunto, descripcion, cerrar]);

    const puedeEnviar = asunto.trim().length > 0 && descripcion.trim().length > 0 && !enviando;

    return {
        abierto,
        asunto,
        setAsunto,
        descripcion,
        setDescripcion,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    };
}
