/*
 * Hook: useModalCompra — Kamples (QQ60)
 * Logica del modal de confirmacion de compra.
 * Llama a crearCheckoutSample y redirige a Stripe Checkout.
 */

import { useCallback, useState } from 'react';
import { useCompraModalStore } from '@app/stores/compraModalStore';
import { crearCheckoutSample } from '@app/services/apiPagos';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { esEscritorio, abrirEnlaceExterno } from '@app/utils/plataforma';

export const useModalCompra = () => {
    const abierto = useCompraModalStore(s => s.abierto);
    const sample = useCompraModalStore(s => s.sample);
    const cerrar = useCompraModalStore(s => s.cerrar);

    const [procesando, setProcesando] = useState(false);

    const confirmarCompra = useCallback(async () => {
        if (!sample || procesando) return;

        setProcesando(true);
        try {
            const resp = await crearCheckoutSample(sample.id);
            if (resp.ok && resp.url) {
                /* [183A-87] Desktop: abrir Stripe en navegador externo */
                if (esEscritorio()) {
                    await abrirEnlaceExterno(resp.url);
                    cerrar();
                } else {
                    window.location.href = resp.url;
                }
            } else {
                toast.error(resp.error ?? 'Error al iniciar la compra');
                setProcesando(false);
            }
        } catch {
            toast.error(getT()('error.compra'));
            setProcesando(false);
        }
    }, [sample, procesando]);

    const manejarCerrar = useCallback(() => {
        if (procesando) return;
        cerrar();
    }, [cerrar, procesando]);

    return {
        abierto,
        sample,
        procesando,
        confirmarCompra,
        cerrar: manejarCerrar,
    };
};
