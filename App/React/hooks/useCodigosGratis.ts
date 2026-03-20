/*
 * Hook: useCodigosGratis â€” Kamples (183A-106)
 * Detecta el param ?codigoGratis= en la URL actual y lo gestiona:
 * - Si el usuario esta autenticado: llama a reclamar en backend + guarda en store.
 * - Si no esta autenticado: guarda en store.codigosPendientes + muestra toast.
 * Llamar en SampleDetalleIsland y ColeccionDetalleIsland.
 * Gotcha: useEffect solo corre en mount para no re-procesar en re-renders.
 * [183A-110] Manejo de codigos expirados:
 *   - Si verificar retorna expired=true: guardar en pendientes (sin toast de error).
 *     Toast informativo suave para que el usuario se anime a registrarse.
 *   - Si reclamar retorna expired=true: llamar setExpirado en store â†’ dispara ModalCodigoExpirado.
 *   - Los pendientes expirados se limpian despues de procesarlos para no volver a intentar.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { useCodigoGratisStore } from '@app/stores/codigoGratisStore';
import { verificarCodigo, reclamarCodigo } from '@app/services/apiCodigosGratis';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

export const useCodigosGratis = (): void => {
    const usuario = useAuthStore((s) => s.usuario);
    const reclamar = useCodigoGratisStore((s) => s.reclamarCodigo);
    const agregarPendiente = useCodigoGratisStore((s) => s.agregarPendiente);
    const pendientes = useCodigoGratisStore((s) => s.codigosPendientes);
    const limpiarPendientes = useCodigoGratisStore((s) => s.limpiarPendientes);
    const setExpirado = useCodigoGratisStore((s) => s.setExpirado);

    /* Al montar: detectar ?codigoGratis= en URL y procesar */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const codigo = params.get('codigoGratis');
        if (!codigo) return;

        const procesarCodigo = async () => {
            const infoResp = await verificarCodigo(codigo);

            /* [183A-110] Codigo expirado: guardar pendiente para dar compensacion al registrarse */
            if (!infoResp.ok && infoResp.data?.expired) {
                agregarPendiente(codigo);
                toast.info(getT()('toast.codigoExpirado'));
                return;
            }

            if (!infoResp.ok || !infoResp.data) {
                toast.error(getT()('toast.codigoInvalido'));
                return;
            }

            const { tipo, targetId } = infoResp.data;

            if (usuario) {
                /* Usuario autenticado: reclamar directamente */
                const resp = await reclamarCodigo(codigo);
                if (resp.ok && resp.data?.tipo && resp.data?.targetId !== undefined) {
                    reclamar(codigo, resp.data.tipo, resp.data.targetId);
                    toast.exito(getT()('toast.descargaDesbloqueada'));
                }
            } else {
                /* No autenticado: guardar para reclamar al iniciar sesion */
                agregarPendiente(codigo);
                toast.info(getT()('toast.descargaGratisEspera'));
            }
            void tipo; void targetId; /* solo para type-check, se procesa en reclamar */
        };

        procesarCodigo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* Cuando el usuario se autentica: reclamar codigos pendientes */
    useEffect(() => {
        if (!usuario || pendientes.length === 0) return;

        const reclamarPendientes = async () => {
            let descargasDesbloqueadas = 0;

            for (const codigo of pendientes) {
                const resp = await reclamarCodigo(codigo);

                if (resp.ok && resp.data?.tipo && resp.data?.targetId !== undefined) {
                    reclamar(codigo, resp.data.tipo, resp.data.targetId);
                    descargasDesbloqueadas++;
                    continue;
                }

                /* [183A-110] Codigo expirado: mostrar modal de compensacion */
                if (!resp.ok && resp.data?.expired) {
                    setExpirado({ nombreItem: resp.data.nombreItem ?? '' });
                    /* No limpiar aun: limpiar al final del loop */
                }
            }

            limpiarPendientes();

            if (descargasDesbloqueadas > 0) {
                toast.exito(getT()('toast.descargaDesbloqueada'));
            }
        };

        reclamarPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario]);
};
