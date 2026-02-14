/*
 * SubirIsland — Kamples
 * Formulario de subida de samples con DropZone, preview y metadata.
 * Pasos: 1) Seleccionar archivos → 2) Metadata → 3) Publicar.
 */

import { useState, useCallback, type ChangeEvent } from 'react';
import { Music, X, Upload, Check } from 'lucide-react';
import {
    DropZone,
    CampoTexto,
    BotonBase,
    BarraProgreso,
    Badge,
} from '@app/components/ui';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { TipoSample } from '@app/types';
import '../../styles/componentes/subir.css';

interface ArchivoSubida {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

interface MetadataSample {
    titulo: string;
    descripcion: string;
    bpm: string;
    key: string;
    escala: string;
    tipo: TipoSample;
    tags: string[];
    esPremium: boolean;
}

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TIPOS: TipoSample[] = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];
const TAGS_SUGERIDOS = [
    'trap', 'hiphop', 'drill', 'reggaeton', 'house', 'techno',
    'ambient', 'cinematic', 'lo-fi', 'boom bap', 'pop', 'r&b',
    'bass', 'guitar', 'piano', 'synth', 'drums', 'vocal',
    '808', 'clap', 'hihat', 'snare', 'kick', 'pad',
];

/* Formatear tamaño de archivo */
const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* Extraer formato del nombre */
const extraerFormato = (nombre: string): string => {
    const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
    return ext;
};

export const SubirIsland = (): JSX.Element => {
    const [paso, setPaso] = useState<1 | 2 | 3>(1);
    const [archivos, setArchivos] = useState<ArchivoSubida[]>([]);
    const [archivoActual, setArchivoActual] = useState(0);
    const [progresoCarga, setProgresoCarga] = useState(0);
    const [subiendo, setSubiendo] = useState(false);
    const [metadata, setMetadata] = useState<MetadataSample>({
        titulo: '',
        descripcion: '',
        bpm: '',
        key: '',
        escala: 'mayor',
        tipo: 'loop',
        tags: [],
        esPremium: false,
    });

    /* Paso 1: Recibir archivos */
    const manejarArchivos = useCallback((files: File[]) => {
        const nuevos: ArchivoSubida[] = files.map((f) => ({
            archivo: f,
            nombre: f.name,
            tamano: formatearTamano(f.size),
            formato: extraerFormato(f.name),
        }));
        setArchivos((prev) => [...prev, ...nuevos]);

        /* Auto-rellenar título con nombre del primer archivo */
        if (archivos.length === 0 && nuevos.length > 0) {
            const nombreSinExt = nuevos[0].nombre.replace(/\.[^/.]+$/, '');
            setMetadata((prev) => ({
                ...prev,
                titulo: prev.titulo || nombreSinExt,
            }));
        }

        setPaso(2);
    }, [archivos.length]);

    const eliminarArchivo = useCallback((indice: number) => {
        setArchivos((prev) => prev.filter((_, i) => i !== indice));
        if (archivos.length <= 1) {
            setPaso(1);
        }
    }, [archivos.length]);

    /* Paso 2: Metadata */
    const actualizarMetadata = useCallback(
        (campo: keyof MetadataSample) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            setMetadata((prev) => ({ ...prev, [campo]: e.target.value }));
        },
        []
    );

    const toggleTag = useCallback((tag: string) => {
        setMetadata((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...prev.tags, tag],
        }));
    }, []);

    /* Paso 3: Subir */
    const manejarSubida = useCallback(async () => {
        setSubiendo(true);
        setPaso(3);

        /* Simular progreso — en producción esto se conecta a un endpoint real */
        for (let i = 0; i < archivos.length; i++) {
            setArchivoActual(i);
            for (let pct = 0; pct <= 100; pct += 10) {
                setProgresoCarga(pct);
                await new Promise((r) => setTimeout(r, 100));
            }
        }

        setSubiendo(false);
        /* TO-DO: llamar a subirSample con FormData real */
    }, [archivos.length]);

    /* Nombre del paso */
    const nombrePaso = (n: number): string => {
        if (n === 1) return 'Archivos';
        if (n === 2) return 'Metadata';
        return 'Publicar';
    };

    return (
        <div className="subirContenedor" id="seccionSubir">
            <h1 className="subirTitulo">Subir Samples</h1>
            <p className="subirSubtitulo">
                Sube tus samples para compartirlos con la comunidad.
            </p>

            {/* Indicador de pasos */}
            <div className="subirPasos">
                {[1, 2, 3].map((n) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacioSm)', flex: n < 3 ? 1 : 'none' }}>
                        <div
                            className={`subirPaso ${paso === n ? 'subirPasoActivo' : ''} ${paso > n ? 'subirPasoCompletado' : ''}`}
                        >
                            <span className="subirPasoNumero">
                                {paso > n ? <Check size={12} /> : n}
                            </span>
                            {nombrePaso(n)}
                        </div>
                        {n < 3 && <div className="subirPasoLinea" />}
                    </div>
                ))}
            </div>

            {/* Paso 1: DropZone */}
            {paso === 1 && (
                <DropZone
                    onArchivos={manejarArchivos}
                    formatosAceptados={['.wav', '.mp3', '.flac', '.aiff', '.aif']}
                    multiple
                    tamanoMaximoMB={100}
                />
            )}

            {/* Paso 2: Formulario de metadata */}
            {paso === 2 && (
                <div className="subirFormulario">
                    {/* Preview de archivos seleccionados */}
                    {archivos.map((a, i) => (
                        <div key={i} className="subirPreview">
                            <div className="subirPreviewIcono">
                                <Music size={20} />
                            </div>
                            <div className="subirPreviewInfo">
                                <div className="subirPreviewNombre">{a.nombre}</div>
                                <div className="subirPreviewMeta">
                                    {a.formato.toUpperCase()} — {a.tamano}
                                </div>
                            </div>
                            <button
                                className="subirPreviewEliminar"
                                onClick={() => eliminarArchivo(i)}
                                type="button"
                                aria-label="Eliminar archivo"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}

                    <CampoTexto
                        etiqueta="Título"
                        placeholder="Nombre del sample"
                        value={metadata.titulo}
                        onChange={actualizarMetadata('titulo')}
                    />

                    <CampoTexto
                        etiqueta="Descripción"
                        multilínea
                        placeholder="Describe tu sample (opcional)"
                        rows={3}
                        value={metadata.descripcion}
                        onChange={actualizarMetadata('descripcion')}
                    />

                    <div className="subirFilaTriple">
                        <div>
                            <span className="subirSelectLabel">Tipo</span>
                            <select
                                className="subirSelect"
                                value={metadata.tipo}
                                onChange={actualizarMetadata('tipo')}
                            >
                                {TIPOS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <CampoTexto
                            etiqueta="BPM"
                            type="number"
                            placeholder="120"
                            value={metadata.bpm}
                            onChange={actualizarMetadata('bpm')}
                        />
                        <div>
                            <span className="subirSelectLabel">Key</span>
                            <select
                                className="subirSelect"
                                value={metadata.key}
                                onChange={actualizarMetadata('key')}
                            >
                                <option value="">Detectar auto</option>
                                {NOTAS.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <span className="subirSelectLabel">Tags</span>
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
                        <BotonBase variante="ghost" onClick={() => setPaso(1)}>
                            Volver
                        </BotonBase>
                        <BotonBase
                            variante="primario"
                            disabled={!metadata.titulo.trim()}
                            onClick={manejarSubida}
                        >
                            <Upload size={14} /> Publicar
                        </BotonBase>
                    </div>
                </div>
            )}

            {/* Paso 3: Progreso de subida */}
            {paso === 3 && (
                <div className="subirFormulario">
                    {archivos.map((a, i) => (
                        <div key={i}>
                            <div className="subirPreview">
                                <div className="subirPreviewIcono">
                                    <Music size={20} />
                                </div>
                                <div className="subirPreviewInfo">
                                    <div className="subirPreviewNombre">{a.nombre}</div>
                                    <div className="subirPreviewMeta">
                                        {i < archivoActual
                                            ? 'Completado'
                                            : i === archivoActual
                                              ? 'Subiendo...'
                                              : 'En espera'}
                                    </div>
                                </div>
                            </div>
                            <BarraProgreso
                                porcentaje={
                                    i < archivoActual ? 100 : i === archivoActual ? progresoCarga : 0
                                }
                                estado={
                                    i < archivoActual ? 'exito' : i === archivoActual ? 'normal' : 'normal'
                                }
                                mostrarPorcentaje={i === archivoActual}
                            />
                        </div>
                    ))}
                    {!subiendo && (
                        <div className="subirAcciones">
                            <BotonBase variante="primario" onClick={() => { setArchivos([]); setPaso(1); setMetadata({ titulo: '', descripcion: '', bpm: '', key: '', escala: 'mayor', tipo: 'loop', tags: [], esPremium: false }); }}>
                                Subir más samples
                            </BotonBase>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default conAutenticacion(SubirIsland as React.ComponentType<Record<string, unknown>>);
