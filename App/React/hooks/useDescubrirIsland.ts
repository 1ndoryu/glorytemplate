/*
 * Hook: useDescubrirIsland
 * Lógica extraída de DescubrirIsland (SRP).
 * Gestiona carga de secciones feed y likes optimistic sobre todas las secciones.
 * Preserva patrón cancelado/cleanup de sesión anterior.
 */

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Flame, Clock } from 'lucide-react';
import { obtenerFeed } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion, SampleResumen } from '@app/types';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import React from 'react';

interface SeccionDescubrir {
    id: string;
    titulo: string;
    icono: React.ReactNode;
    samples: SampleResumen[];
}

export const useDescubrirIsland = () => {
    const [secciones, setSecciones] = useState<SeccionDescubrir[]>([]);
    const [cargando, setCargando] = useState(true);

    const navegar = useNavigationStore(s => s.navegar);
    const menu = useMenuContextualSample();

    /* Like con optimistic UI sobre todas las secciones */
    const manejarLike = useCallback(
        async (sampleId: number, reaccion?: TipoReaccion) => {
            const todas = secciones.flatMap((s) => s.samples);
            const sample = todas.find((s) => s.id === sampleId);

            const actualizarSecciones = (transformar: (s: SampleResumen) => SampleResumen) =>
                setSecciones((prev) =>
                    prev.map((sec) => ({
                        ...sec,
                        samples: sec.samples.map((s) => (s.id === sampleId ? transformar(s) : s)),
                    }))
                );

            /* Snapshot para rollback */
            const snapshot = secciones;

            try {
                if (reaccion) {
                    const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                    const esPositivo = reaccion !== 'dislike';
                    const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                    actualizarSecciones((s) => ({ ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }));
                    await darLike('sample', sampleId, reaccion);
                } else if (sample?.liked || sample?.reaccion) {
                    const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                    actualizarSecciones((s) => ({ ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }));
                    await quitarLike('sample', sampleId);
                } else {
                    actualizarSecciones((s) => ({ ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }));
                    await darLike('sample', sampleId, 'like');
                }
            } catch {
                setSecciones(snapshot);
            }
        },
        [secciones]
    );

    /* Cargar secciones */
    useEffect(() => {
        let cancelado = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const [resTrending, resRecientes, resDescubrir] = await Promise.all([
                    obtenerFeed('trending'),
                    obtenerFeed('recientes'),
                    obtenerFeed('descubrir'),
                ]);

                if (cancelado) return;
                const nuevasSecciones: SeccionDescubrir[] = [];

                if (resDescubrir.ok && resDescubrir.data?.length) {
                    nuevasSecciones.push({
                        id: 'para-ti',
                        titulo: 'Para ti',
                        icono: React.createElement(Sparkles, { size: 18 }),
                        samples: resDescubrir.data,
                    });
                }

                if (resTrending.ok && resTrending.data?.length) {
                    nuevasSecciones.push({
                        id: 'trending',
                        titulo: 'Trending',
                        icono: React.createElement(Flame, { size: 18 }),
                        samples: resTrending.data,
                    });
                }

                if (resRecientes.ok && resRecientes.data?.length) {
                    nuevasSecciones.push({
                        id: 'nuevos',
                        titulo: 'Nuevos',
                        icono: React.createElement(Clock, { size: 18 }),
                        samples: resRecientes.data,
                    });
                }

                if (!cancelado) setSecciones(nuevasSecciones);
            } catch {
                /* Fallo de carga — secciones quedan vacías */
            } finally {
                if (!cancelado) setCargando(false);
            }
        };
        cargar();
        return () => { cancelado = true; };
    }, []);

    return {
        secciones,
        cargando,
        navegar,
        menu,
        manejarLike,
    };
};
