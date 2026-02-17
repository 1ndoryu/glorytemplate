/*
 * Componente: PanelDetalleSample — Kamples (C95)
 * Vista condensada de un sample para el panel lateral.
 * Muestra: creador, título, waveform mini, tags, acciones, descripción.
 * Reutiliza datos de SampleResumen + carga detalle completo via API.
 */

import { useEffect, useState, useCallback } from 'react';
import { Heart, Download, Lock, X } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useComentarios } from '@app/hooks/useComentarios';
import { obtenerSample } from '@app/services/apiSamples';
import { obtenerSimilares } from '@app/services/apiReproduciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import type { Sample, SampleResumen } from '@app/types';

interface PanelDetalleSampleProps {
    sample: SampleResumen;
}

export const PanelDetalleSample = ({ sample }: PanelDetalleSampleProps): JSX.Element => {
    const [detalle, setDetalle] = useState<Sample | null>(null);
    const [liked, setLiked] = useState(sample.liked ?? false);
    const [totalLikes, setTotalLikes] = useState(sample.totalLikes);
    const [similares, setSimilares] = useState<SampleResumen[]>([]);
    const { navegar } = useNavigationStore();
    const { cerrar } = usePanelLateralStore();

    const { comentarios, cargando: cargandoComentarios, enviar: enviarComentario } = useComentarios({
        tipo: 'sample',
        targetId: sample.id,
        cargarAlAbrir: true,
    });

    /* Cargar detalle completo y similares */
    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            const [respDetalle, respSimilares] = await Promise.all([
                obtenerSample(sample.slug),
                obtenerSimilares(sample.id, 4),
            ]);
            if (!activo) return;
            if (respDetalle.ok && respDetalle.data) {
                setDetalle(respDetalle.data);
            }
            if (respSimilares.ok && respSimilares.data?.data) {
                setSimilares(respSimilares.data.data);
            }
        };

        cargar();
        return () => { activo = false; };
    }, [sample.id, sample.slug]);

    const manejarLike = useCallback(async () => {
        const nuevoLiked = !liked;
        setLiked(nuevoLiked);
        setTotalLikes(prev => prev + (nuevoLiked ? 1 : -1));

        if (nuevoLiked) {
            await darLike('sample', sample.id);
        } else {
            await quitarLike('sample', sample.id);
        }
    }, [liked, sample.id]);

    const meta = sample.metadata;
    const badges: string[] = [];
    if (meta?.instrumentos) {
        const inst = Array.isArray(meta.instrumentos) ? meta.instrumentos[0] : meta.instrumentos;
        if (inst) badges.push(inst);
    }
    if (meta?.genero) {
        const gen = Array.isArray(meta.genero) ? meta.genero[0] : meta.genero;
        if (gen) badges.push(gen);
    }
    if (meta?.emocion) badges.push(meta.emocion);
    if (sample.bpm) badges.push(`${sample.bpm} BPM`);
    if (sample.key) badges.push(sample.key);

    return (
        <div className="panelDetalle">
            {/* Cabecera con botón cerrar */}
            <div className="panelDetalleCabecera">
                <button
                    className="panelDetalleAutor"
                    onClick={() => navegar(`/perfil/${sample.creador.username}/`)}
                    type="button"
                >
                    <Avatar
                        src={sample.creador.avatarUrl}
                        nombre={sample.creador.nombreVisible}
                        tamano="sm"
                    />
                    <span>{sample.creador.nombreVisible}</span>
                </button>
                <button className="panelDetalleCerrar" onClick={cerrar} type="button" aria-label="Cerrar">
                    <X size={16} />
                </button>
            </div>

            {/* Título */}
            <h3 className="panelDetalleTitulo">
                {sample.titulo}
                {sample.esPremium && <Badge variante="premium" tamano="xs">PRO</Badge>}
            </h3>

            {/* Descripción */}
            {detalle?.descripcion && (
                <p className="panelDetalleDescripcion">{detalle.descripcion}</p>
            )}

            {/* Waveform */}
            <div className="panelDetalleWaveform">
                <WaveformPlayer
                    picos={null}
                    tamano="md"
                />
            </div>

            {/* Tags/Badges de metadata */}
            {badges.length > 0 && (
                <div className="panelDetalleTags">
                    {badges.map(b => (
                        <Badge key={b} variante="neutro" tamano="xs">{b}</Badge>
                    ))}
                </div>
            )}

            {/* Acciones */}
            <div className="panelDetalleAcciones">
                <BotonBase
                    variante={liked ? 'primario' : 'ghost'}
                    tamano="sm"
                    onClick={manejarLike}
                >
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    {totalLikes}
                </BotonBase>

                {sample.esPremium ? (
                    <BotonBase variante="ghost" tamano="sm" disabled>
                        <Lock size={14} />
                        PRO
                    </BotonBase>
                ) : (
                    <BotonBase variante="ghost" tamano="sm">
                        <Download size={14} />
                    </BotonBase>
                )}

                <BotonBase
                    variante="ghost"
                    tamano="sm"
                    onClick={() => navegar(`/sample/${sample.slug}/`)}
                >
                    Ver completo
                </BotonBase>
            </div>

            {/* Comentarios */}
            <div className="panelDetalleComentarios">
                <h4 className="panelDetalleSubtitulo">Comentarios</h4>
                <ListaComentarios
                    comentarios={comentarios}
                    cargando={cargandoComentarios}
                    onEnviar={enviarComentario}
                    onClickAutor={(username) => navegar(`/perfil/${username}/`)}
                    maxVisibles={5}
                />
            </div>

            {/* Similares */}
            {similares.length > 0 && (
                <div className="panelDetalleSimilares">
                    <h4 className="panelDetalleSubtitulo">También te podría gustar</h4>
                    <div className="panelDetalleSimilaresLista">
                        {similares.map(s => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                onClickCreador={(u) => navegar(`/perfil/${u}/`)}
                                className="panelDetalleTarjetaMini"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelDetalleSample;
