/*
 * Hook: useReportar — Kamples (QQ38)
 * Hook centralizado para el modal de reportes.
 * Adapta campos y API segun el tipo de reporte.
 */

import { useState, useCallback } from 'react';
import { useReportarStore, type TipoReporte } from '@app/stores/reportarStore';
import { apiPost } from '@app/services/apiCliente';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

interface RespuestaReporte {
    ok: boolean;
    message: string;
}

/* [193A-65] Configuración por tipo de reporte — usa getT() para i18n */
function configPorTipo(tipo: TipoReporte): { etiqueta: string; placeholder: string } {
    const t = getT();
    const configs: Record<TipoReporte, { etiqueta: string; placeholder: string }> = {
        usuario:          { etiqueta: t('reporte.motivoReporte'), placeholder: t('reporte.placeholderUsuario') },
        publicacion:      { etiqueta: t('reporte.motivoReporte'), placeholder: t('reporte.placeholderSample') },
        comentario:       { etiqueta: t('reporte.motivoReporte'), placeholder: t('reporte.placeholderSample') },
        sample:           { etiqueta: t('reporte.motivoReporte'), placeholder: t('reporte.placeholderSample') },
        error_plataforma: { etiqueta: t('reporte.asunto'),        placeholder: t('reporte.placeholderError') },
    };
    return configs[tipo];
}

export function useReportar() {
    const abierto       = useReportarStore(s => s.abierto);
    const tipo          = useReportarStore(s => s.tipo);
    const targetId      = useReportarStore(s => s.targetId);
    const targetNombre  = useReportarStore(s => s.targetNombre);
    const cerrarStore   = useReportarStore(s => s.cerrar);

    const [razon, setRazon]       = useState('');
    const [detalles, setDetalles] = useState('');
    const [enviando, setEnviando] = useState(false);

    const config = tipo ? configPorTipo(tipo) : configPorTipo('error_plataforma');
    const esError = tipo === 'error_plataforma';

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
            toast.error(esError ? 'Escribe un asunto para el reporte' : 'Indica el motivo del reporte');
            return;
        }
        const detallesTrim = detalles.trim();
        if (esError && !detallesTrim) {
            toast.error(getT()('error.descripcionReporte'));
            return;
        }
        if (!tipo) return;

        setEnviando(true);

        const resp = await apiPost<RespuestaReporte>('/reportar', {
            tipo,
            targetId: targetId ?? 0,
            razon: razonTrim,
            detalles: detallesTrim || undefined,
            ...(esError ? { url: window.location.pathname } : {}),
        });

        setEnviando(false);

        if (resp.ok) {
            toast.exito(esError ? 'Reporte enviado. Gracias por ayudarnos a mejorar.' : 'Reporte enviado. Lo revisaremos pronto.');
            cerrar();
        } else {
            toast.error(resp.error ?? 'No se pudo enviar el reporte');
        }
    }, [razon, detalles, tipo, targetId, esError, cerrar]);

    const puedeEnviar = razon.trim().length > 0
        && (!esError || detalles.trim().length > 0)
        && !enviando;

    return {
        abierto,
        tipo,
        targetId,
        targetNombre,
        config,
        esError,
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
