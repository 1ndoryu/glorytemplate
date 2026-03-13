/*
 * Hook: useModalSeguidores — Kamples (QQ32)
 * Carga paginada de seguidores con scroll infinito.
 * Soporta follow/unfollow inline desde el modal.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSeguidoresModalStore } from '@app/stores/seguidoresModalStore';
import { obtenerSeguidores, type SeguidorResumen } from '@app/services/apiSocial';
import { seguirUsuario, dejarDeSeguir } from '@app/services/apiSocial';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('ModalSeguidores');
const POR_PAGINA = 20;

export function useModalSeguidores() {
    const abierto = useSeguidoresModalStore(s => s.abierto);
    const username = useSeguidoresModalStore(s => s.username);
    const cerrar = useSeguidoresModalStore(s => s.cerrar);

    const [seguidores, setSeguidores] = useState<SeguidorResumen[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [pagina, setPagina] = useState(1);

    /* Cargar primera pagina al abrir */
    useEffect(() => {
        if (!abierto || !username) {
            setSeguidores([]);
            setPagina(1);
            setTotal(0);
            return;
        }

        let cancelado = false;
        setCargando(true);

        obtenerSeguidores(username, 1, POR_PAGINA).then((resp) => {
            if (cancelado) return;
            if (resp.ok && resp.data) {
                /* QQ77: resp.data es SeguidorResumen[], total en resp.total */
                setSeguidores(resp.data);
                setTotal(resp.total ?? 0);
            }
            setCargando(false);
            setPagina(1);
        }).catch(() => {
            if (!cancelado) setCargando(false);
        });

        return () => { cancelado = true; };
    }, [abierto, username]);

    /* Cargar mas (scroll infinito) */
    const cargarMas = useCallback(async () => {
        if (!username || cargando) return;
        const siguiente = pagina + 1;
        setCargando(true);

        try {
            const resp = await obtenerSeguidores(username, siguiente, POR_PAGINA);
            if (resp.ok && resp.data) {
                setSeguidores(prev => [...prev, ...resp.data!]);
                setPagina(siguiente);
            }
        } catch (err) {
            log.error('Error cargando mas seguidores', err);
        }

        setCargando(false);
    }, [username, pagina, cargando]);

    const hayMas = seguidores.length < total;

    /* Toggle follow/unfollow inline */
    const toggleFollow = useCallback(async (userId: number) => {
        const idx = seguidores.findIndex(s => s.id === userId);
        if (idx === -1) return;

        const actual = seguidores[idx];
        const nuevoEstado = !actual.siguiendo;

        /* Optimistic update */
        setSeguidores(prev => prev.map(s => s.id === userId ? { ...s, siguiendo: nuevoEstado } : s));

        try {
            const resp = nuevoEstado
                ? await seguirUsuario(userId)
                : await dejarDeSeguir(userId);

            if (!resp.ok) {
                /* Rollback */
                setSeguidores(prev => prev.map(s => s.id === userId ? { ...s, siguiendo: !nuevoEstado } : s));
            }
        } catch {
            /* Rollback */
            setSeguidores(prev => prev.map(s => s.id === userId ? { ...s, siguiendo: !nuevoEstado } : s));
        }
    }, [seguidores]);

    return {
        abierto,
        seguidores,
        total,
        cargando,
        hayMas,
        cargarMas,
        toggleFollow,
        cerrar,
    };
}
