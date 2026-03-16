/*
 * Hook: useVerificadorVersion
 * Verifica al iniciar la app (solo Android/Tauri) si hay una versión más reciente
 * disponible. Muestra un toast persistente con link de descarga si está desactualizada.
 *
 * Desktop usa tauri-plugin-updater (automático). Este hook cubre Android donde
 * el plugin no está disponible.
 */

import { useEffect, useRef } from 'react';
import { apiPeticion } from '@app/services/apiCliente';
import { toast } from '@app/stores/toastStore';
import { esAndroid, abrirEnlaceExterno } from '@app/utils/plataforma';

interface RespuestaVersion {
    version: string;
    url: string;
    notes: string;
    pub_date: string;
    obligatoria: boolean;
}

export const useVerificadorVersion = (): void => {
    const verificadoRef = useRef(false);

    useEffect(() => {
        if (verificadoRef.current || !esAndroid()) return;
        verificadoRef.current = true;

        const verificar = async (): Promise<void> => {
            try {
                const { getVersion } = await import('@tauri-apps/api/app');
                const versionLocal = await getVersion();

                const resp = await apiPeticion<RespuestaVersion>(
                    `/app/version/android/${versionLocal}`
                );

                if (!resp.ok || !resp.data) return;

                const { version, url, obligatoria } = resp.data;

                if (obligatoria) {
                    toast.confirmar(
                        `Nueva versión ${version} disponible (obligatoria). Actualiza para continuar.`,
                        () => abrirEnlaceExterno(url),
                    );
                } else {
                    toast.info(
                        `Nueva versión ${version} disponible. Descárgala para obtener las últimas mejoras.`,
                        15000,
                    );
                }
            } catch {
                /* Silencioso: no interrumpir la app si la verificación falla */
            }
        };

        /* Delay de 5s para no bloquear el arranque de la app */
        const timer = setTimeout(verificar, 5000);
        return () => clearTimeout(timer);
    }, []);
};
