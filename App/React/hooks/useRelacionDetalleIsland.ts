/*
 * Hook: useRelacionDetalleIsland — Kamples
 * Logica extraida de RelacionDetalleIsland para cumplir max 300 lineas.
 * Agrupa: comentarios, proveedor de samples, titulo SEO, tabs, embed URLs.
 */

import { useState, useCallback, useEffect } from 'react';
import { useRelacionDetalle } from '@app/hooks/useRelacionDetalle';
import { useComentarios } from '@app/hooks/useComentarios';
import { useMenuRelacionDetalle } from '@app/hooks/useMenuRelacionDetalle';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useDevAccionesRelacion } from '@app/hooks/useDevAccionesRelacion';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { obtenerSamplesDeRelacion } from '@app/services/apiSamples';
import type { SampleResumen } from '@app/types';

const TABS_RELACION = [{ id: 'relacion', etiqueta: 'Sampleo' }];

/* Valida formato YouTube ID y construye URL de embed segura */
const construirEmbedUrl = (youtubeId: string): string | null => {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) return null;
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
};

/* Valida formato Spotify Track ID y construye URL de embed segura */
const construirSpotifyEmbedUrl = (spotifyId: string): string | null => {
    if (!/^[A-Za-z0-9]{10,30}$/.test(spotifyId)) return null;
    return `https://open.spotify.com/embed/track/${spotifyId}`;
};

type EmbedTipo = 'youtube' | 'spotify' | null;
interface EmbedInfo { url: string | null; tipo: EmbedTipo; }

export const useRelacionDetalleIsland = (idEfectivo?: string) => {
    const { relacion, cargando, error, irACancion, irAArtista } = useRelacionDetalle({ id: idEfectivo });
    const navegar = useNavigationStore((s) => s.navegar);

    const relacionId = relacion?.id ?? 0;
    const [comentariosVisibles, setComentariosVisibles] = useState(false);
    const seccionComentarios = useComentarios({ tipo: 'relacion', targetId: relacionId });

    const proveedorSamplesRelacion = useCallback(
        (_pagina: number) =>
            obtenerSamplesDeRelacion(relacionId)
                .then((r) => ({ ok: r.ok, data: r.ok && r.data ? r.data : [] as SampleResumen[] }))
                .catch(() => ({ ok: false, data: [] as SampleResumen[] })),
        [relacionId]
    );

    const esAdmin = useAuthStore((s) => s.usuario?.rol === 'admin');
    const autenticado = useAuthStore((s) => s.autenticado);
    const devAcciones = useDevAccionesRelacion(relacionId);
    const menuCtx = useMenuRelacionDetalle(relacion, autenticado, {
        esAdmin: !!esAdmin,
        onGenerarRecorte: devAcciones.manejarGenerarRecorte,
        recorteCargando: devAcciones.recorteCargando,
    });

    const manejarToggleComentarios = useCallback(() => {
        setComentariosVisibles(prev => {
            const siguiente = !prev;
            if (siguiente && seccionComentarios.comentarios.length === 0) {
                seccionComentarios.cargar(1);
            }
            return siguiente;
        });
    }, [seccionComentarios]);

    useTabsIsla('RelacionDetalleIsland', TABS_RELACION, 'relacion');

    /* Titulo SEO descriptivo */
    const tituloSeo = relacion
        ? `${relacion.destino_artista ?? ''} - ${relacion.destino_titulo ?? ''} samplea a ${relacion.fuente_artista ?? ''} - ${relacion.fuente_titulo ?? ''}`
            .replace(/\s{2,}/g, ' ').trim()
        : '';

    useEffect(() => {
        if (tituloSeo) document.title = `${tituloSeo} | Kamples`;
    }, [tituloSeo]);

    /* Embed URLs */
    const construirEmbed = (youtubeId?: string | null, spotifyId?: string | null): EmbedInfo => {
        if (youtubeId) return { url: construirEmbedUrl(youtubeId), tipo: 'youtube' };
        if (spotifyId) return { url: construirSpotifyEmbedUrl(spotifyId), tipo: 'spotify' };
        return { url: null, tipo: null };
    };

    const embedDestino = relacion ? construirEmbed(relacion.destino_youtubeId, relacion.destino_spotifyId) : { url: null, tipo: null as EmbedTipo };
    const embedFuente = relacion ? construirEmbed(relacion.fuente_youtubeId, relacion.fuente_spotifyId) : { url: null, tipo: null as EmbedTipo };

    return {
        relacion, cargando, error, irACancion, irAArtista,
        navegar, relacionId,
        comentariosVisibles, manejarToggleComentarios,
        seccionComentarios,
        proveedorSamplesRelacion,
        esAdmin, autenticado, devAcciones, menuCtx,
        embedDestino, embedFuente,
    };
};
