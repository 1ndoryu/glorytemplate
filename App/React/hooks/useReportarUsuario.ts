/*
 * Hook: useReportarUsuario — Kamples (QQ23)
 * Logica extraida de ModalReportarUsuario (SRP).
 * Gestiona el estado del formulario y el envio del reporte de usuario.
 */

import { useState, useCallback } from 'react';
import { useReportarUsuarioStore } from '@app/stores/reportarUsuarioStore';
import { reportarUsuario } from '@app/services/apiSocial';
import { toast } from '@app/stores/toastStore';

export function useReportarUsuario() {
    const abierto = useReportarUsuarioStore(s => s.abierto);
    const usuarioId = useReportarUsuarioStore(s => s.usuarioId);
    const usuarioUsername = useReportarUsuarioStore(s => s.usuarioUsername);
    const cerrarStore = useReportarUsuarioStore(s => s.cerrar);

    const [razon, setRazon] = useState('');
    const [detalles, setDetalles] = useState('');
    const [enviando, setEnviando] = useState(false);

    const limpiar = useCallback(() => {
        setRazon('');
        setDetalles('');
    }, []);

    const cerrar = useCallback(() => {
        limpiar();
        cerrarStore();
    }, [limpiar, cerrarStore]);

    const enviar = useCallback(async () => {
        const razonTrim = razon.trim();
        if (!razonTrim) {
            toast.error('Indica el motivo del reporte');
            return;
        }
        if (!usuarioId) return;

        setEnviando(true);

        const resp = await reportarUsuario(
            usuarioId,
            razonTrim,
            detalles.trim() || undefined,
        );

        setEnviando(false);

        if (resp.ok) {
            toast.exito('Reporte enviado. Lo revisaremos pronto.');
            cerrar();
        } else {
            toast.error(resp.error ?? 'No se pudo enviar el reporte');
        }
    }, [razon, detalles, usuarioId, cerrar]);

    const puedeEnviar = razon.trim().length > 0 && !enviando;

    return {
        abierto,
        usuarioId,
        usuarioUsername,
        razon,
        setRazon,
        detalles,
        setDetalles,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    };
}
