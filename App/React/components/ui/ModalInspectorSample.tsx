/*
 * Componente: ModalInspectorSample — Kamples
 * Modal de inspección técnica para debug y revisión de datos de un sample.
 * Muestra: info general, análisis de audio, metadata IA, estadísticas,
 * info del creador y JSON crudo.
 * Se usa para verificar que los datos reales fluyen correctamente.
 */

import {useState} from 'react';
import {Music, BarChart3, Brain, User, Code, ChevronDown, ChevronUp} from 'lucide-react';
import {Modal} from './Modal';
import {Avatar} from './Avatar';
import {Badge} from './Badge';
import type {Sample, SampleResumen} from '@app/types';
import '../../styles/componentes/modalInspector.css';

/* Acepta tanto Sample completo como SampleResumen */
type SampleInspectable = Sample | SampleResumen;

interface ModalInspectorSampleProps {
    abierto: boolean;
    onCerrar: () => void;
    sample: SampleInspectable | null;
}

/* Verifica si es Sample completo (tiene campos exclusivos como estado, formato, etc.) */
const esSampleCompleto = (s: SampleInspectable): s is Sample => {
    return 'estado' in s && 'formato' in s;
};

/* Formatea duración en formato m:ss */
const formatearDuracion = (seg: number): string => {
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

/* Campo individual del inspector */
const Campo = ({etiqueta, valor, numerico, ancho}: {etiqueta: string; valor: string | number | boolean | null | undefined; numerico?: boolean; ancho?: boolean}) => {
    const valorTexto = valor === null || valor === undefined ? '—' : typeof valor === 'boolean' ? (valor ? 'Si' : 'No') : String(valor);

    return (
        <div className={`inspectorCampo ${ancho ? 'inspectorCampoAncho' : ''}`}>
            <span className="inspectorCampoEtiqueta">{etiqueta}</span>
            <span className={`inspectorCampoValor ${numerico ? 'inspectorNumerico' : ''}`}>{valorTexto}</span>
        </div>
    );
};

export const ModalInspectorSample = ({abierto, onCerrar, sample}: ModalInspectorSampleProps): JSX.Element | null => {
    const [jsonVisible, setJsonVisible] = useState(false);
    const [jsonIaVisible, setJsonIaVisible] = useState(false);

    if (!sample) return null;

    const completo = esSampleCompleto(sample);
    const metadata = completo ? sample.metadata : null;

    /* Helper para acceder a campos IA (snake_case o camelCase) */
    const m = (metadata ?? {}) as Record<string, unknown>;

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Inspector de Sample" tamano="grande">
            <div className="inspectorContenido">
                {/* Sección: Info General */}
                <div className="inspectorSeccion">
                    <div className="inspectorSeccionTitulo">
                        <Music size={14} /> Info General
                    </div>
                    <div className="inspectorGrid">
                        <Campo etiqueta="ID" valor={sample.id} numerico />
                        <Campo etiqueta="Titulo" valor={sample.titulo} />
                        <Campo etiqueta="Slug" valor={sample.slug} />
                        <Campo etiqueta="Tipo" valor={sample.tipo} />
                        <Campo etiqueta="Premium" valor={sample.esPremium} />
                        <Campo etiqueta="Liked" valor={sample.liked} />
                        {completo && <Campo etiqueta="Estado" valor={sample.estado} />}
                        {completo && <Campo etiqueta="Formato" valor={sample.formato} />}
                        {completo && <Campo etiqueta="Tamano" valor={completo ? `${(sample.tamano / 1024 / 1024).toFixed(2)} MB` : null} />}
                    </div>
                </div>

                {/* Sección: Análisis Audio */}
                <div className="inspectorSeccion">
                    <div className="inspectorSeccionTitulo">
                        <BarChart3 size={14} /> Analisis de Audio
                    </div>
                    <div className="inspectorGrid">
                        <Campo etiqueta="BPM" valor={sample.bpm} numerico />
                        <Campo etiqueta="Key" valor={sample.key} />
                        <Campo etiqueta="Escala" valor={sample.escala} />
                        <Campo etiqueta="Duracion" valor={sample.duracion ? formatearDuracion(sample.duracion) : null} />
                        <Campo etiqueta="Ruta Preview" valor={sample.rutaPreview} ancho />
                        <Campo etiqueta="Ruta Waveform" valor={sample.rutaWaveform} ancho />
                        {sample.imagenUrl && <Campo etiqueta="Imagen URL" valor={sample.imagenUrl} ancho />}
                    </div>
                </div>

                {/* Sección: Tags */}
                {sample.tags && sample.tags.length > 0 && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">Tags</div>
                        <div className="inspectorTags">
                            {sample.tags.map((tag, i) => (
                                <span key={i} className="inspectorTag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sección: Metadata IA */}
                {metadata && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">
                            <Brain size={14} /> Metadata IA
                        </div>
                        <div className="inspectorGrid">
                            <Campo etiqueta="Nombre Base" valor={String(m.nombreArchivoBase || m.nombre_archivo_base || '—')} ancho />
                            <Campo etiqueta="Generos" valor={
                                Array.isArray(m.genero) ? m.genero.join(', ') :
                                typeof m.genero === 'string' ? m.genero : null
                            } ancho />
                            <Campo etiqueta="Instrumentos" valor={
                                Array.isArray(m.instrumentos) ? m.instrumentos.join(', ') :
                                typeof m.instrumentos === 'string' ? m.instrumentos : null
                            } ancho />
                            <Campo etiqueta="Emocion" valor={String(m.emocion || m.emocion_es || (Array.isArray(m.sentimiento) ? m.sentimiento.join(', ') : '') || '—')} ancho />
                            <Campo etiqueta="Artista Vibes" valor={
                                Array.isArray(m.artista_vibes || m.artistaVibes)
                                    ? (m.artista_vibes as string[] || m.artistaVibes as string[]).join(', ')
                                    : String(m.artista_vibes || m.artistaVibes || '—')
                            } ancho />
                            <Campo etiqueta="Tags IA" valor={
                                Array.isArray(m.tags) ? m.tags.join(', ') : null
                            } ancho />
                            <Campo etiqueta="Tags IA (ES)" valor={
                                Array.isArray(m.tags_es || m.tagsEs)
                                    ? (m.tags_es as string[] || m.tagsEs as string[]).join(', ')
                                    : null
                            } ancho />
                            <Campo etiqueta="BPM Confianza" valor={m.bpmConfianza as number ?? m.bpm_confianza as number ?? null} numerico />
                            <Campo etiqueta="Key Confianza" valor={m.keyConfianza as number ?? m.key_confianza as number ?? null} numerico />
                        </div>
                        {Boolean(m.descripcion || m.descripcionEs || m.descripcion_es || m.descripcionIA) && (
                            <div className="inspectorMetadataIA">
                                <strong>Descripcion IA:</strong>{' '}
                                {String(m.descripcion_es || m.descripcionEs || m.descripcion || m.descripcionIA)}
                            </div>
                        )}
                        {Boolean(m.descripcionCorta || m.descripcion_corta || m.descripcionCortaEs || m.descripcion_corta_es) && (
                            <div className="inspectorMetadataIA">
                                <strong>Descripcion Corta:</strong>{' '}
                                {String(m.descripcion_corta_es || m.descripcionCortaEs || m.descripcion_corta || m.descripcionCorta)}
                            </div>
                        )}
                    </div>
                )}

                {/* Sección: Estadísticas */}
                <div className="inspectorSeccion">
                    <div className="inspectorSeccionTitulo">
                        <BarChart3 size={14} /> Estadisticas
                    </div>
                    <div className="inspectorGrid">
                        <Campo etiqueta="Descargas" valor={sample.totalDescargas} numerico />
                        <Campo etiqueta="Likes" valor={sample.totalLikes} numerico />
                        {'totalReproducciones' in sample && <Campo etiqueta="Reproducciones" valor={(sample as Sample).totalReproducciones} numerico />}
                    </div>
                </div>

                {/* Sección: Creador */}
                {sample.creador && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">
                            <User size={14} /> Creador
                        </div>
                        <div className="inspectorCreador">
                            <Avatar nombre={sample.creador.nombreVisible} src={sample.creador.avatarUrl ?? undefined} tamano="sm" />
                            <div className="inspectorCreadorInfo">
                                <span className="inspectorCreadorNombre">
                                    {sample.creador.nombreVisible}
                                    {sample.creador.verificado && (
                                        <Badge variante="acento" tamano="xs">
                                            V
                                        </Badge>
                                    )}
                                </span>
                                <span className="inspectorCreadorUsername">
                                    @{sample.creador.username} (ID: {sample.creador.id})
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sección: JSON Crudo del Sample (toggle) */}
                <div className="inspectorSeccion">
                    <button className="inspectorSeccionTitulo" onClick={() => setJsonVisible(!jsonVisible)} type="button">
                        <Code size={14} /> JSON Crudo (Sample)
                        {jsonVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {jsonVisible && <pre className="inspectorJsonCrudo">{JSON.stringify(sample, null, 2)}</pre>}
                </div>

                {/* Sección: JSON Crudo de la IA (toggle separado) */}
                <div className="inspectorSeccion">
                    <button
                        className="inspectorSeccionTitulo"
                        onClick={() => setJsonIaVisible(!jsonIaVisible)}
                        type="button"
                    >
                        <Code size={14} /> JSON Crudo (Metadata IA)
                        {jsonIaVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {jsonIaVisible && (
                        <pre className="inspectorJsonCrudo">
                            {metadata
                                ? JSON.stringify(metadata, null, 2)
                                : '// La metadata IA no está disponible para este sample.\n// Los samples subidos después de este fix ya la incluirán.'
                            }
                        </pre>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ModalInspectorSample;
