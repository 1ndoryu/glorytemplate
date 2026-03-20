/*
 * Componente: PasoMetadata — Kamples
 * Formulario de metadata para samples en SubirModal (paso 2).
 * Extraído para cumplir SRP y mantener SubirModal bajo 300 líneas.
 */

import { useCallback, type ChangeEvent } from 'react';
import { Music, X, Upload } from 'lucide-react';
import { CampoTexto, BotonBase, Badge } from '@app/components/ui';
import type { TipoSample } from '@app/types';
import { SelectorBase } from '../SelectorBase';
import { useT } from '@app/utils/i18n/useT';

interface ArchivoSubida {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

export interface MetadataSample {
    titulo: string;
    descripcion: string;
    bpm: string;
    key: string;
    escala: string;
    tipo: TipoSample;
    tags: string[];
    esPremium: boolean;
}

// sentinel-disable-next-line objeto-mutable-exportado — valor inicial de formulario, los callers lo clonan con spread
export const metadataInicial: MetadataSample = {
    titulo: '',
    descripcion: '',
    bpm: '',
    key: '',
    escala: 'mayor',
    tipo: 'loop',
    tags: [],
    esPremium: false,
};

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TIPOS: TipoSample[] = ['loop', 'oneshot'];
const TAGS_SUGERIDOS = [
    'trap', 'hiphop', 'drill', 'reggaeton', 'house', 'techno',
    'ambient', 'cinematic', 'lo-fi', 'boom bap', 'pop', 'r&b',
    'bass', 'guitar', 'piano', 'synth', 'drums', 'vocal',
    '808', 'clap', 'hihat', 'snare', 'kick', 'pad',
];

interface Props {
    archivos: ArchivoSubida[];
    metadata: MetadataSample;
    onMetadataChange: (metadata: MetadataSample) => void;
    onEliminarArchivo: (indice: number) => void;
    onVolver: () => void;
    onSubir: () => void;
}

export const PasoMetadata = ({
    archivos,
    metadata,
    onMetadataChange,
    onEliminarArchivo,
    onVolver,
    onSubir,
}: Props): JSX.Element => {
    const { t } = useT();
    const actualizarCampo = useCallback(
        (campo: keyof MetadataSample) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            onMetadataChange({ ...metadata, [campo]: e.target.value });
        },
        [metadata, onMetadataChange]
    );

    const toggleTag = useCallback((tag: string) => {
        const nuevasTags = metadata.tags.includes(tag)
            ? metadata.tags.filter((t) => t !== tag)
            : [...metadata.tags, tag];
        onMetadataChange({ ...metadata, tags: nuevasTags });
    }, [metadata, onMetadataChange]);

    return (
        <div className="subirFormulario">
            {archivos.map((a, i) => (
                <div key={a.nombre} className="subirPreview">
                    <div className="subirPreviewIcono">
                        <Music size={20} />
                    </div>
                    <div className="subirPreviewInfo">
                        <div className="subirPreviewNombre">{a.nombre}</div>
                        <div className="subirPreviewMeta">
                            {a.formato.toUpperCase()} — {a.tamano}
                        </div>
                    </div>
                    <BotonBase variante="ghost"
                        className="subirPreviewEliminar"
                        onClick={() => onEliminarArchivo(i)}
                        type="button"
                        aria-label={t('metadata.eliminarArchivo')}
                    >
                        <X size={16} />
                    </BotonBase>
                </div>
            ))}

            <CampoTexto
                etiqueta={t('comun.titulo')}
                placeholder={t('metadata.nombreSample')}
                value={metadata.titulo}
                onChange={actualizarCampo('titulo')}
            />

            <CampoTexto
                etiqueta={t('comun.descripcion')}
                multilínea
                placeholder={t('metadata.descripcionOpcional')}
                rows={3}
                value={metadata.descripcion}
                onChange={actualizarCampo('descripcion')}
            />

            <div className="subirFilaTriple">
                <div>
                    <span className="subirSelectLabel">{t('comun.tipo')}</span>
                    <SelectorBase
                        className="subirSelect"
                        value={metadata.tipo}
                        onChange={actualizarCampo('tipo')}
                    >
                        {TIPOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </SelectorBase>
                </div>
                <CampoTexto
                    etiqueta="BPM"
                    type="number"
                    placeholder="120"
                    value={metadata.bpm}
                    onChange={actualizarCampo('bpm')}
                />
                <div>
                    <span className="subirSelectLabel">Key</span>
                    <SelectorBase
                        className="subirSelect"
                        value={metadata.key}
                        onChange={actualizarCampo('key')}
                    >
                        <option value="">{t('metadata.detectarAuto')}</option>
                        {NOTAS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </SelectorBase>
                </div>
            </div>

            <div>
                <span className="subirSelectLabel">{t('metadata.tags')}</span>
                <div className="subirTags">
                    {TAGS_SUGERIDOS.map((tag) => (
                        <Badge
                            key={tag}
                            variante={metadata.tags.includes(tag) ? 'acento' : 'neutro'}
                            estilo={metadata.tags.includes(tag) ? 'relleno' : 'borde'}
                            interactivo
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="subirAcciones">
                <BotonBase variante="ghost" onClick={onVolver}>
                    {t('comun.volver')}
                </BotonBase>
                <BotonBase
                    variante="primario"
                    disabled={!metadata.titulo.trim()}
                    onClick={onSubir}
                >
                    <Upload size={14} /> {t('subir.publicar')}
                </BotonBase>
            </div>
        </div>
    );
};
