/*
 * Isla: ColeccionDetalleIsland — Kamples (FASE 6.3)
 * Página de detalle de una colección: header + grid de samples.
 * Ruta: /coleccion/{slug}
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Lock, Globe, Download, Play } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { obtenerColeccion, obtenerSugerencias } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import type { Coleccion, SampleResumen } from '@app/types';
import '../../styles/componentes/coleccionDetalle.css';

interface ColeccionDetalleIslandProps {
    coleccionId?: string;
}

const ColeccionDetalleBase = ({ coleccionId: propId }: ColeccionDetalleIslandProps): JSX.Element => {
    const [coleccion, setColeccion] = useState<Coleccion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardada, setGuardada] = useState(false);
    const { navegar } = useNavigationStore();
    const { activa: tabActiva, setTabs } = useTabsTopBarStore();

    /* Registrar tabs "Samples" y "Más Ideas" en TopBar */
    useEffect(() => {
        setTabs(
            [
                { id: 'samples', etiqueta: 'Samples' },
                { id: 'ideas', etiqueta: 'Más Ideas' },
            ],
            'samples'
        );
        return () => { setTabs([]); };
    }, [setTabs]);

    /* Obtener ID de la URL si no viene por props */
    const id = propId ? parseInt(propId, 10) : (() => {
        const path = window.location.pathname;
        const partes = path.split('/').filter(Boolean);
        const idx = partes.indexOf('coleccion');
        return idx >= 0 && partes[idx + 1] ? parseInt(partes[idx + 1], 10) : null;
    })();

    useEffect(() => {
        if (!id) return;
        const cargar = async () => {
            setCargando(true);
            const resp = await obtenerColeccion(id);
            if (resp.ok && resp.data) setColeccion(resp.data);
            setCargando(false);
        };
        cargar();
    }, [id]);

    const manejarGuardar = useCallback(() => {
        setGuardada((prev) => !prev);
    }, []);

    /* Sync like desde FeedSamples al estado local de la colección */
    const manejarLikeSamples = useCallback((sampleId: number) => {
        setColeccion((prev) => {
            if (!prev?.samples) return prev;
            return {
                ...prev,
                samples: prev.samples.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: !s.liked, totalLikes: s.liked ? s.totalLikes - 1 : s.totalLikes + 1 }
                        : s
                ),
            };
        });
    }, []);

    /* Proveedor para tab "Más Ideas" — sugerencias paginadas */
    const proveedorSugerencias = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        if (!id) return [];
        const resp = await obtenerSugerencias(id, pagina);
        return resp.ok && resp.data ? resp.data : [];
    }, [id]);

    const samples = coleccion?.samples ?? [];

    /*
     * C108: Extraer las 5 metas más comunes de los samples
     * (género, emoción, instrumento, tipo, artista vibe)
     * IMPORTANTE: debe estar antes de cualquier early return para evitar
     * "Rendered more hooks than during the previous render"
     */
    const metasComunes = useMemo(() => {
        if (!samples.length) return [];
        const conteo = new Map<string, number>();
        for (const s of samples) {
            const m = s.metadata;
            if (!m) continue;
            const valores: string[] = [];
            const genero = m.genero;
            if (Array.isArray(genero)) valores.push(...genero.filter((g): g is string => typeof g === 'string'));
            else if (typeof genero === 'string' && genero) valores.push(genero);
            if (typeof m.emocion === 'string' && m.emocion) valores.push(m.emocion);
            if (typeof m.emocionEs === 'string' && m.emocionEs && m.emocionEs !== m.emocion) valores.push(m.emocionEs);
            const instrumentos = m.instrumentos;
            if (Array.isArray(instrumentos)) valores.push(...instrumentos.filter((i): i is string => typeof i === 'string'));
            else if (typeof instrumentos === 'string' && instrumentos) valores.push(instrumentos);
            if (typeof m.tipo === 'string' && m.tipo) valores.push(m.tipo);
            for (const v of valores) {
                if (typeof v !== 'string') continue;
                const limpio = v.trim().toLowerCase();
                if (limpio) conteo.set(limpio, (conteo.get(limpio) ?? 0) + 1);
            }
        }
        return [...conteo.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1));
    }, [samples]);

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="coleccionDetalle">
                <div className="coleccionCargando">Cargando colección...</div>
            </div>
        );
    }

    if (!coleccion) {
        return (
            <div className="coleccionDetalle" id="coleccionDetalle">
                <div className="coleccionError">
                    <p>Colección no encontrada</p>
                    <BotonBase variante="ghost" onClick={() => navegar('/libreria/')}>
                        Volver a librería
                    </BotonBase>
                </div>
            </div>
        );
    }

    const imagenHeader = coleccion.imagenUrl || obtenerImagenColor(coleccion.id);

    return (
        <div className="coleccionDetalle" id="coleccionDetalle">
            {/* Botón volver */}
            <button className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </button>

            {/* Header de la colección */}
            <div className="coleccionHeader">
                <img className="coleccionHeaderImg" src={imagenHeader} alt={coleccion.nombre} />
                <div className="coleccionHeaderInfo">
                    <div className="coleccionHeaderTipo">
                        {coleccion.esPublica ? (
                            <Badge variante="acento"><Globe size={12} /> Pública</Badge>
                        ) : (
                            <Badge variante="neutro"><Lock size={12} /> Privada</Badge>
                        )}
                    </div>
                    <h1 className="coleccionNombre">{coleccion.nombre}</h1>
                    {coleccion.descripcion && (
                        <p className="coleccionDescripcion">{coleccion.descripcion}</p>
                    )}
                    <div className="coleccionMeta">
                        {coleccion.usuario && (
                            <button
                                className="coleccionCreador"
                                onClick={() => navegar(`/perfil/${coleccion.usuario!.username}/`)}
                                type="button"
                            >
                                <Avatar
                                    nombre={coleccion.usuario.nombreVisible}
                                    src={coleccion.usuario.avatarUrl ?? undefined}
                                    tamano="xs"
                                />
                                <span>{coleccion.usuario.nombreVisible}</span>
                            </button>
                        )}
                        <span className="coleccionStats">
                            {coleccion.totalSamples} samples
                        </span>
                        {/* C108: 5 metas más comunes separadas por • */}
                        {metasComunes.length > 0 && (
                            <span className="coleccionMetasComunes">
                                {metasComunes.join(' \u2022 ')}
                            </span>
                        )}
                    </div>
                    {/* C109: Botones icono — guardar, descargar, preview */}
                    <div className="coleccionAcciones">
                        <button
                            className={`coleccionAccionBtn ${guardada ? 'coleccionAccionActivo' : ''}`}
                            onClick={manejarGuardar}
                            type="button"
                            title={guardada ? 'Guardada' : 'Guardar colección'}
                        >
                            {guardada ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                        </button>
                        <button
                            className="coleccionAccionBtn"
                            type="button"
                            title="Descargar colección"
                            onClick={() => { /* TO-DO C110: lógica de descarga con créditos */ }}
                        >
                            <Download size={16} />
                        </button>
                        <button
                            className="coleccionAccionBtn"
                            type="button"
                            title="Preview"
                            onClick={() => { /* TO-DO: reproducir preview de la colección */ }}
                        >
                            <Play size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje para evitar race conditions (C46) */}
            {tabActiva === 'samples' ? (
                <FeedSamples
                    key="coleccion-samples"
                    samplesIniciales={samples}
                    proveedor={async () => []}
                    claveCache={`coleccion_${coleccion.id}`}
                    infiniteScroll={false}
                    virtualizar={false}
                    mostrarTags={false}
                    mensajeVacio="Esta colección aún no tiene samples."
                    onLike={manejarLikeSamples}
                />
            ) : (
                <FeedSamples
                    key="coleccion-ideas"
                    proveedor={proveedorSugerencias}
                    claveCache={`sugerencias_${coleccion.id}`}
                    mostrarTags
                    infiniteScroll
                    virtualizar={false}
                    mensajeVacio="No hay sugerencias disponibles para esta colección."
                />
            )}
        </div>
    );
};

export const ColeccionDetalleIsland = conAutenticacion(ColeccionDetalleBase);
export default ColeccionDetalleIsland;
