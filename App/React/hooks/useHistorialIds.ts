/*
 * Hook: useHistorialIds — Kamples
 * Carga y cachea el conjunto de IDs de samples ya reproducidos.
 * Se usa para el filtro "Ya reproducidos" en el feed.
 */

import { useEffect, useState, useRef } from 'react';
import { obtenerHistorial } from '@app/services/apiReproduciones';

interface UseHistorialIdsResult {
    idsReproducidos: Set<number>;
    cargando: boolean;
}

/*
 * Carga todas las páginas del historial de reproducción
 * y devuelve un Set con los IDs de samples ya escuchados.
 * Solo carga una vez por montaje (se cachea en ref).
 */
export const useHistorialIds = (activo: boolean): UseHistorialIdsResult => {
    const [idsReproducidos, setIdsReproducidos] = useState<Set<number>>(new Set());
    const [cargando, setCargando] = useState(false);
    const cargadoRef = useRef(false);

    useEffect(() => {
        if (!activo || cargadoRef.current) return;

        const cargar = async () => {
            setCargando(true);
            const ids = new Set<number>();
            let pagina = 1;
            let continuar = true;

            /* Cargar todas las páginas del historial */
            while (continuar) {
                const resp = await obtenerHistorial(pagina, 100);
                if (resp.ok && resp.data?.data?.length) {
                    resp.data.data.forEach((s) => ids.add(s.id));
                    if (resp.data.data.length < 100) {
                        continuar = false;
                    } else {
                        pagina++;
                    }
                } else {
                    continuar = false;
                }
            }

            setIdsReproducidos(ids);
            setCargando(false);
            cargadoRef.current = true;
        };

        cargar();
    }, [activo]);

    return { idsReproducidos, cargando };
};
