/*
 * Hook: useFeedRefresco — QK55
 * Polling cada 5 minutos + refresco al volver a la pestana.
 * Evita que el feed se congele horas sin contenido nuevo.
 */

import { useEffect, useRef } from 'react';

const INTERVALO_REFRESCO_MS = 5 * 60 * 1000;

interface OpcionesRefresco {
    paginaActual: number;
    cargando: boolean;
    cargandoMas: boolean;
    cargarPagina: (pagina: number, esNuevo: boolean) => void;
    habilitado?: boolean;
}

export function useFeedRefresco({
    paginaActual,
    cargando,
    cargandoMas,
    cargarPagina,
    habilitado = true,
}: OpcionesRefresco): void {
    const cargarRef = useRef(cargarPagina);
    cargarRef.current = cargarPagina;

    useEffect(() => {
        if (!habilitado) return;

        const refrescarSiPagina1 = () => {
            if (paginaActual === 1 && !cargando && !cargandoMas) {
                cargarRef.current(1, true);
            }
        };

        const intervalo = setInterval(refrescarSiPagina1, INTERVALO_REFRESCO_MS);

        const alCambiarVisibilidad = () => {
            if (document.visibilityState === 'visible') {
                refrescarSiPagina1();
            }
        };
        document.addEventListener('visibilitychange', alCambiarVisibilidad);

        return () => {
            clearInterval(intervalo);
            document.removeEventListener('visibilitychange', alCambiarVisibilidad);
        };
    }, [paginaActual, cargando, cargandoMas, habilitado]);
}
