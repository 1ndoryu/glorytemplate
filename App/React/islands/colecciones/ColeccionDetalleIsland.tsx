/*
 * Isla: ColeccionDetalleIsland — Kamples (FASE 6.3)
 * Página de detalle de una colección: header + grid de samples.
 * Ruta: /coleccion/{slug}
 */

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Lock, Globe } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { obtenerColeccion } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import type { Coleccion } from '@app/types';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/coleccionDetalle.css';

interface ColeccionDetalleIslandProps {
    coleccionId?: string;
}

const ColeccionDetalleBase = ({ coleccionId: propId }: ColeccionDetalleIslandProps): JSX.Element => {
    const [coleccion, setColeccion] = useState<Coleccion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardada, setGuardada] = useState(false);
    const { navegar } = useNavigationStore();
    const { setSample, sampleActual, reproduciendo, progreso } = useReproductorStore();

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

    const manejarLike = useCallback((sampleId: number) => {
        if (!coleccion?.samples) return;
        setColeccion((prev) => {
            if (!prev || !prev.samples) return prev;
            return {
                ...prev,
                samples: prev.samples.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: !s.liked, totalLikes: s.liked ? s.totalLikes - 1 : s.totalLikes + 1 }
                        : s
                ),
            };
        });
    }, [coleccion]);

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

            {/* Grid de samples */}
            <div className="coleccionSamples">
                {samples.length === 0 ? (
                    <div className="coleccionVacia">
                        <p>Esta colección aún no tiene samples</p>
                    </div>
                ) : (
                    samples.map((sample: SampleResumen) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            onPlay={(s) => setSample(s)}
                            activa={sampleActual?.id === sample.id}
                            reproduciendo={sampleActual?.id === sample.id && reproduciendo}
                            progreso={sampleActual?.id === sample.id ? progreso : 0}
                            onLike={manejarLike}
                            onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export const ColeccionDetalleIsland = conAutenticacion(ColeccionDetalleBase);
export default ColeccionDetalleIsland;
