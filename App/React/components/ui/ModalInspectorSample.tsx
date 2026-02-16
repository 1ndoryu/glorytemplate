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

    if (!sample) return null;

    const completo = esSampleCompleto(sample);
    const metadata = completo ? sample.metadata : null;

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
                            <Campo etiqueta="Generos" valor={metadata.genero?.join(', ')} ancho />
                            <Campo etiqueta="Instrumentos" valor={metadata.instrumentos?.join(', ')} ancho />
                            <Campo etiqueta="Sentimiento" valor={metadata.sentimiento?.join(', ')} ancho />
                            <Campo etiqueta="Tipo IA" valor={metadata.tipo} />
                        </div>
                        {metadata.descripcionIA && <div className="inspectorMetadataIA">{metadata.descripcionIA}</div>}
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

                {/* Sección: JSON Crudo (toggle) */}
                <div className="inspectorSeccion">
                    <button className="inspectorSeccionTitulo" onClick={() => setJsonVisible(!jsonVisible)} type="button">
                        <Code size={14} /> JSON Crudo
                        {jsonVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {jsonVisible && <pre className="inspectorJsonCrudo">{JSON.stringify(sample, null, 2)}</pre>}
                </div>
            </div>
        </Modal>
    );
};

export default ModalInspectorSample;
