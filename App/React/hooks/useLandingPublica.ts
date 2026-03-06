/*
 * useLandingPublica — Hook de lógica para la landing page pública.
 * Maneja fetch de trending, acceso a stores de auth/navegación/reproductor.
 */

import { useEffect, useState } from 'react';
import { obtenerFeed } from '@app/services/apiSamples';
import { useNavigationStore } from '@/core/router';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useAuthModalStore } from '@app/stores/authModalStore';
import type { SampleResumen } from '@app/types';

const TRENDING_LIMITE = 6;

export const useLandingPublica = () => {
    const [trending, setTrending] = useState<SampleResumen[]>([]);
    const navegar = useNavigationStore(s => s.navegar);
    const setSample = useReproductorStore(s => s.setSample);
    const sampleActual = useReproductorStore(s => s.sampleActual);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const progreso = useReproductorStore(s => s.progreso);
    const abrirAuth = useAuthModalStore(s => s.abrir);

    useEffect(() => {
        let activo = true;
        const cargar = async () => {
            try {
                const resp = await obtenerFeed('trending');
                if (activo && resp.ok && resp.data) {
                    setTrending(resp.data.slice(0, TRENDING_LIMITE));
                }
            } catch {
                /* Trending no disponible — landing se muestra sin esa sección */
            }
        };
        cargar();
        return () => { activo = false; };
    }, []);

    return {
        trending,
        navegar,
        setSample,
        sampleActual,
        reproduciendo,
        progreso,
        abrirAuth,
    };
};
