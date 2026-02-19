/*
 * Hook: useFiltroIds — Kamples
 * Carga IDs de samples likeados, descargados y usuarios seguidos.
 * Se usa junto con useHistorialIds para los filtros del feed.
 * Cada set se carga solo cuando su filtro correspondiente está activo.
 */

import { useEffect, useState, useRef } from 'react';
import { obtenerMisFavoritos, obtenerMisDescargas } from '@app/services/apiSamples';
import { obtenerMisSeguidos } from '@app/services/apiSocial';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useFiltroIds');

interface UseFiltroIdsResult {
    idsLikeados: Set<number>;
    idsDescargados: Set<number>;
    idsSeguidos: Set<number>;
    cargando: boolean;
}

/*
 * Carga sets de IDs según los filtros activos.
 * Cada set se cachea para no recargar en cada toggle.
 */
export const useFiltroIds = (
    filtroLikeados: boolean,
    filtroDescargados: boolean,
    filtroDeSeguidos: boolean
): UseFiltroIdsResult => {
    const [idsLikeados, setIdsLikeados] = useState<Set<number>>(new Set());
    const [idsDescargados, setIdsDescargados] = useState<Set<number>>(new Set());
    const [idsSeguidos, setIdsSeguidos] = useState<Set<number>>(new Set());
    const [cargando, setCargando] = useState(false);

    const likeadosCargados = useRef(false);
    const descargadosCargados = useRef(false);
    const seguidosCargados = useRef(false);

    /* Cargar IDs de samples likeados */
    useEffect(() => {
        if (!filtroLikeados || likeadosCargados.current) return;
        const cargar = async () => {
            setCargando(true);
            try {
                const ids = new Set<number>();
                let pagina = 1;
                let continuar = true;
                while (continuar) {
                    const resp = await obtenerMisFavoritos(pagina, 100);
                    if (resp.ok && resp.data?.data?.length) {
                        resp.data.data.forEach((s: { id: number }) => ids.add(s.id));
                        if (resp.data.data.length < 100) continuar = false;
                        else pagina++;
                    } else {
                        continuar = false;
                    }
                }
                setIdsLikeados(ids);
                likeadosCargados.current = true;
            } catch (err) {
                log.error('Error cargando IDs likeados', err);
            }
            setCargando(false);
        };
        cargar();
    }, [filtroLikeados]);

    /* Cargar IDs de samples descargados */
    useEffect(() => {
        if (!filtroDescargados || descargadosCargados.current) return;
        const cargar = async () => {
            setCargando(true);
            try {
                const ids = new Set<number>();
                let pagina = 1;
                let continuar = true;
                while (continuar) {
                    const resp = await obtenerMisDescargas(pagina, 100);
                    if (resp.ok && resp.data?.data?.length) {
                        resp.data.data.forEach((s: { id: number }) => ids.add(s.id));
                        if (resp.data.data.length < 100) continuar = false;
                        else pagina++;
                    } else {
                        continuar = false;
                    }
                }
                setIdsDescargados(ids);
                descargadosCargados.current = true;
            } catch (err) {
                log.error('Error cargando IDs descargados', err);
            }
            setCargando(false);
        };
        cargar();
    }, [filtroDescargados]);

    /* Cargar IDs de usuarios seguidos */
    useEffect(() => {
        if (!filtroDeSeguidos || seguidosCargados.current) return;
        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await obtenerMisSeguidos();
                if (resp.ok && resp.data) {
                    const ids = new Set<number>();
                    (resp.data as { id: number }[]).forEach((u) => ids.add(u.id));
                    setIdsSeguidos(ids);
                }
                seguidosCargados.current = true;
            } catch (err) {
                log.error('Error cargando IDs seguidos', err);
            }
            setCargando(false);
        };
        cargar();
    }, [filtroDeSeguidos]);

    return { idsLikeados, idsDescargados, idsSeguidos, cargando };
};
