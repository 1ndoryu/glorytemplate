/*
 * Componente: TarjetaDuplicado — D5
 * Muestra una comparacion lado a lado de sample original vs duplicado.
 * 4 acciones: fusionar (conservar original), intercambiar (conservar duplicado),
 * aprobar (ambos coexisten) y rechazar (eliminar duplicado).
 * QK25: Waveform visual para comparacion rapida sin escuchar.
 */

import { useEffect, useState } from 'react';
import { Loader2, Merge, ArrowLeftRight, Check, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { WaveformPlayer } from '../ui/WaveformPlayer';
import { useT } from '@app/utils/i18n/useT';
import type { DuplicadoAdmin } from '../../services/apiAdmin';

interface TarjetaDuplicadoProps {
    duplicado: DuplicadoAdmin;
    procesando: boolean;
    onAccion: (id: number, accion: 'fusionar' | 'aprobar' | 'rechazar' | 'intercambiar') => void;
}

/* Colores segun tipo de duplicado */
const COLORES_TIPO: Record<string, 'info' | 'advertencia' | 'neutro'> = {
    cross_usuario: 'advertencia',
    mismo_usuario: 'info',
    backfill: 'neutro',
};

const ETIQUETAS_TIPO: Record<string, string> = {
    cross_usuario: 'Cross-usuario',
    mismo_usuario: 'Mismo usuario',
    backfill: 'Backfill',
};

/* Formato de fecha compacto */
const formatoFecha = (iso: string): string => {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
};

/* Cargar picos de waveform desde URL JSON */
const usePicosWaveform = (rutaWaveform: string | null): number[] | null => {
    const [picos, setPicos] = useState<number[] | null>(null);

    useEffect(() => {
        if (!rutaWaveform) return;
        const ctrl = new AbortController();
        fetch(rutaWaveform, { signal: ctrl.signal })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (Array.isArray(data)) setPicos(data);
            })
            .catch(() => { /* abort o error de red — silenciar */ });
        return () => ctrl.abort();
    }, [rutaWaveform]);

    return picos;
};

const LadoSample = ({ etiqueta, titulo, creador, fecha, sampleId, rutaPreview, slug, rutaWaveform }: {
    etiqueta: string;
    titulo: string;
    creador: string;
    fecha: string;
    sampleId: number;
    rutaPreview: string | null;
    slug: string | null;
    rutaWaveform: string | null;
}): JSX.Element => {
    const picos = usePicosWaveform(rutaWaveform);

    return (
        <div className="dupLado">
            <span className="dupLadoEtiqueta">{etiqueta}</span>
            {slug ? (
                <a href={`/sample/${slug}/`} className="dupLadoTitulo dupLadoTituloEnlace" title={titulo} target="_blank" rel="noopener noreferrer">{titulo}</a>
            ) : (
                <span className="dupLadoTitulo" title={titulo}>{titulo}</span>
            )}
            <span className="dupLadoMeta">
                por <strong>{creador}</strong> — {formatoFecha(fecha)}
            </span>
            <span className="dupLadoId">#{sampleId}</span>
            {/* QK25: Waveform visual para comparacion sin escuchar */}
            <WaveformPlayer
                picos={picos}
                tamano="sm"
                interactivo={false}
                colorNoReproducido="rgba(255,255,255,0.25)"
                colorReproducido="var(--acento, #4a665b)"
                className="dupWaveform"
            />
            {rutaPreview && (
                /* sentinel-disable-next-line html-nativo-en-vez-de-componente — audio nativo para preview admin */
                <audio
                    className="dupAudioPreview"
                    src={rutaPreview}
                    controls
                    preload="none"
                />
            )}
        </div>
    );
};

export const TarjetaDuplicado = ({ duplicado, procesando, onAccion }: TarjetaDuplicadoProps): JSX.Element => {
    const d = duplicado;
    const { t } = useT();

    return (
        <div className="dupTarjeta">
            {/* Cabecera: tipo + fecha */}
            <div className="dupCabecera">
                <Badge variante={COLORES_TIPO[d.tipo] ?? 'neutro'} tamano="xs">
                    {ETIQUETAS_TIPO[d.tipo] ?? d.tipo}
                </Badge>
                <span className="dupFecha">{formatoFecha(d.created_at)}</span>
            </div>

            {/* Comparacion lado a lado */}
            <div className="dupComparacion">
                <LadoSample
                    etiqueta={t('admin.duplicados.original')}
                    titulo={d.original_titulo}
                    creador={d.original_creador}
                    fecha={d.original_subido_at}
                    sampleId={d.original_id}
                    rutaPreview={d.original_ruta_preview}
                    slug={d.original_slug}
                    rutaWaveform={d.original_ruta_waveform}
                />
                <div className="dupSeparador">
                    <span className="dupSeparadorLinea" />
                    <span className="dupSeparadorTexto">{t('admin.duplicados.vs')}</span>
                    <span className="dupSeparadorLinea" />
                </div>
                <LadoSample
                    etiqueta={t('admin.duplicados.duplicado')}
                    titulo={d.duplicado_titulo}
                    creador={d.duplicado_creador}
                    fecha={d.duplicado_subido_at}
                    sampleId={d.duplicado_id}
                    rutaPreview={d.duplicado_ruta_preview}
                    slug={d.duplicado_slug}
                    rutaWaveform={d.duplicado_ruta_waveform}
                />
            </div>

            {/* Acciones */}
            <div className="dupAcciones">
                <BotonBase
                    variante="primario"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'fusionar')}
                    title="Conservar original, eliminar duplicado y transferir relaciones"
                >
                    {procesando ? <Loader2 size={14} className="adminSpinner" /> : <Merge size={14} />}
                    {t('admin.duplicados.fusionar')}
                </BotonBase>

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'intercambiar')}
                    title="Conservar duplicado como original, eliminar el actual original"
                >
                    <ArrowLeftRight size={14} />
                    {t('admin.duplicados.intercambiar')}
                </BotonBase>

                <BotonBase
                    variante="ghost"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'aprobar')}
                    title="No son duplicados reales, ambos coexisten"
                >
                    <Check size={14} />
                    {t('admin.duplicados.noEsDuplicado')}
                </BotonBase>

                <BotonBase
                    variante="peligro"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'rechazar')}
                    title="Eliminar sample duplicado directamente"
                >
                    <X size={14} />
                    {t('admin.duplicados.rechazar')}
                </BotonBase>
            </div>
        </div>
    );
};
