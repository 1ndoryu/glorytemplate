/*
 * Hook: useCodigosGratis — Kamples (183A-106)
 * Detecta el param ?codigoGratis= en la URL actual y lo gestiona:
 * - Si el usuario esta autenticado: llama a reclamar en backend + guarda en store.
 * - Si no esta autenticado: guarda en store.codigosPendientes + muestra toast.
 * Llamar en SampleDetalleIsland y ColeccionDetalleIsland.
 * Gotcha: useEffect solo corre en mount para no re-procesar en re-renders.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { useCodigoGratisStore } from '@app/stores/codigoGratisStore';
import { verificarCodigo, reclamarCodigo } from '@app/services/apiCodigosGratis';
import { toast } from '@app/stores/toastStore';

export const useCodigosGratis = (): void => {
    const usuario = useAuthStore((s) => s.usuario);
    const reclamar = useCodigoGratisStore((s) => s.reclamarCodigo);
    const agregarPendiente = useCodigoGratisStore((s) => s.agregarPendiente);
    const pendientes = useCodigoGratisStore((s) => s.codigosPendientes);
    const limpiarPendientes = useCodigoGratisStore((s) => s.limpiarPendientes);

    /* Al montar: detectar ?codigoGratis= en URL y procesar */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const codigo = params.get('codigoGratis');
        if (!codigo) return;

        const procesarCodigo = async () => {
            /* Verificar que el codigo existe */
            const infoResp = await verificarCodigo(codigo);
            if (!infoResp.ok || !infoResp.data) {
                toast.error('El enlace de descarga gratis no es válido o ha expirado.');
                return;
            }

            const { tipo, targetId } = infoResp.data;

            if (usuario) {
                /* Usuario autenticado: reclamar directamente */
                const resp = await reclamarCodigo(codigo);
                if (resp.ok) {
                    reclamar(codigo, tipo, targetId);
                    toast.exito('¡Descarga gratuita desbloqueada! Usa el botón de descarga.');
                }
            } else {
                /* No autenticado: guardar para reclamar al iniciar sesion */
                agregarPendiente(codigo);
                toast.info('Tienes una descarga gratis esperando. ¡Inicia sesión para reclamarla!');
            }
        };

        procesarCodigo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* Cuando el usuario se autentica: reclamar codigos pendientes */
    useEffect(() => {
        if (!usuario || pendientes.length === 0) return;

        const reclamarPendientes = async () => {
            for (const codigo of pendientes) {
                const infoResp = await verificarCodigo(codigo);
                if (!infoResp.ok || !infoResp.data) continue;

                const resp = await reclamarCodigo(codigo);
                if (resp.ok && resp.data) {
                    reclamar(codigo, resp.data.tipo, resp.data.targetId);
                }
            }
            limpiarPendientes();
            if (pendientes.length > 0) {
                toast.exito('¡Descarga gratuita desbloqueada! Usa el botón de descarga.');
            }
        };

        reclamarPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario]);
};
