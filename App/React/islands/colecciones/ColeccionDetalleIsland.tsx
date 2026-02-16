/*
 * Isla: ColeccionDetalleIsland — Kamples (FASE 6.3)
 * Página de detalle de una colección: header + grid de samples.
 * Ruta: /coleccion/{slug}
 */

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Lock, Globe } from 'lucide-react';
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
    const samples = coleccion.samples ?? [];

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
                    </div>
                    <BotonBase
                        variante={guardada ? 'secundario' : 'primario'}
                        tamano="sm"
                        onClick={manejarGuardar}
                    >
                        {guardada ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                        {guardada ? 'Guardada' : 'Guardar colección'}
                    </BotonBase>
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
