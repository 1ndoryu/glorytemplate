/*
 * Componente: ModalInspectorSample — Kamples
 * Modal de inspección técnica para debug y revisión de datos de un sample.
 * Muestra: info general, análisis de audio, metadata IA, estadísticas,
 * info del creador y JSON crudo.
 * Se usa para verificar que los datos reales fluyen correctamente.
 */

import {useState, useEffect} from 'react';
import {Music, BarChart3, Brain, User, Code, ChevronDown, ChevronUp, Clock, Layers, BadgeCheck} from 'lucide-react';
import {Modal} from './Modal';
import {Avatar} from './Avatar';
import type {Sample, SampleResumen} from '@app/types';
import {obtenerSample} from '@app/services/apiSamples';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/modalInspector.css';
import { BotonBase } from './BotonBase';
import { SeccionExtraccionInspector } from './SeccionExtraccionInspector';

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
    const { t } = useT();
    const [jsonVisible, setJsonVisible] = useState(false);
    const [jsonIaVisible, setJsonIaVisible] = useState(false);
    const [sampleCompleto, setSampleCompleto] = useState<Sample | null>(null);

    /* QK30: SIEMPRE re-fetchear el sample completo al abrir.
     * El sample del feed puede no incluir extraccion u otros campos
     * dependiendo de cache o tipo (SampleResumen vs Sample).
     * Patrón SWR: muestra datos stale inmediatamente, revalida en background. */
    useEffect(() => {
        if (!abierto || !sample) {
            setSampleCompleto(null);
            return;
        }
        /* Stale: mostrar datos inmediatos del sample recibido */
        if (esSampleCompleto(sample)) {
            setSampleCompleto(sample);
        }
        /* Revalidate: siempre fetchear datos frescos del servidor */
        let cancelado = false;
        obtenerSample(sample.slug).then((resp) => {
            if (!cancelado && resp.ok && resp.data) setSampleCompleto(resp.data);
        }).catch(() => { /* best-effort: el inspector sigue mostrando datos stale */ });
        return () => { cancelado = true; };
    }, [abierto, sample]);

    if (!sample) return null;

    /* Usar sampleCompleto si disponible, si no fallback al resumen */
    const datos: SampleInspectable = sampleCompleto ?? sample;
    const completo = esSampleCompleto(datos);
    const metadata = completo ? datos.metadata : (sample.metadata ?? null);

    /* Helper para acceder a campos IA (snake_case o camelCase) */
    const m = (metadata ?? {}) as Record<string, unknown>;

    /* Extraer nombre original del archivo desde rutaOriginal (basename) */
    const nombreOriginal = completo && (datos as Sample).rutaOriginal
        ? (datos as Sample).rutaOriginal!.split('/').pop() ?? null
        : null;

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="grande">
            <div className="inspectorContenido">
                {/* Sección: Info General */}
                <div className="inspectorSeccion">
                    <div className="inspectorSeccionTitulo">
                        <Music size={14} /> Info General
                    </div>
                    <div className="inspectorGrid">
                        <Campo etiqueta="ID" valor={datos.id} numerico />
                        <Campo etiqueta="Titulo" valor={datos.titulo} />
                        <Campo etiqueta="Slug" valor={datos.slug} />
                        {'idCorto' in datos && <Campo etiqueta="ID Corto" valor={(datos as Sample).idCorto} />}
                        <Campo etiqueta="Tipo" valor={datos.tipo} />
                        <Campo etiqueta="Premium" valor={datos.esPremium} />
                        <Campo etiqueta="Precio" valor={datos.precio} numerico />
                        <Campo etiqueta="Liked" valor={datos.liked} />
                        <Campo etiqueta="Reacción" valor={datos.reaccion} />
                        {completo && <Campo etiqueta="Estado" valor={(datos as Sample).estado} />}
                        {completo && <Campo etiqueta="Formato" valor={(datos as Sample).formato} />}
                        {completo && <Campo etiqueta="Tamano" valor={`${((datos as Sample).tamano / 1024 / 1024).toFixed(2)} MB`} />}
                        {completo && <Campo etiqueta="Permitir Descarga" valor={(datos as Sample).permitirDescarga} />}
                        {completo && <Campo etiqueta="Licencia Libre" valor={(datos as Sample).licenciaLibre} />}
                        <Campo etiqueta="Mostrar Comunidad" valor={datos.mostrarEnComunidad} />
                        <Campo etiqueta="Verificado" valor={datos.verificado} />
                        {nombreOriginal && <Campo etiqueta="Nombre Original" valor={nombreOriginal} ancho />}
                    </div>
                </div>

                {/* Seccion: Origen y Sampleo (solo sample completo con datos de origen) */}
                {completo && ((datos as Sample).cancionOrigenId || (datos as Sample).relacionSampleoId) && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">
                            <Layers size={14} /> Origen y Sampleo
                        </div>
                        <div className="inspectorGrid">
                            {/* QQ79: esRecorte se determina por cancionOrigenId o relacionSampleoId */}
                            <Campo etiqueta="Es Recorte" valor={
                                (datos as Sample).cancionOrigenId != null || (datos as Sample).relacionSampleoId != null
                            } />
                            <Campo etiqueta="Cancion Origen ID" valor={(datos as Sample).cancionOrigenId} numerico />
                            {(datos as Sample).cancionOrigen?.titulo && (
                                <Campo etiqueta="Cancion Origen" valor={(datos as Sample).cancionOrigen!.titulo} ancho />
                            )}
                            {(datos as Sample).cancionOrigen?.slug && (
                                <Campo etiqueta="Enlace Fuente" valor={`/cancion/${(datos as Sample).cancionOrigen!.slug}/`} ancho />
                            )}
                            <Campo etiqueta="Relación Sampleo ID" valor={(datos as Sample).relacionSampleoId} numerico />
                        </div>
                    </div>
                )}

                {/* QQ117+QK32: Seccion Extraccion — fuente, timing, links, album */}
                {completo && (datos as Sample).extraccion && (
                    <SeccionExtraccionInspector extraccion={(datos as Sample).extraccion!} sampleSlug={datos.slug} />
                )}

                {/* Sección: Análisis Audio */}
                <div className="inspectorSeccion">
                    <div className="inspectorSeccionTitulo">
                        <BarChart3 size={14} /> Analisis de Audio
                    </div>
                    <div className="inspectorGrid">
                        <Campo etiqueta="BPM" valor={datos.bpm} numerico />
                        <Campo etiqueta="Key" valor={datos.key} />
                        <Campo etiqueta="Escala" valor={datos.escala} />
                        <Campo etiqueta="Duración" valor={datos.duracion ? formatearDuracion(datos.duracion) : null} />
                        <Campo etiqueta="Audio Hash" valor={completo ? (datos as Sample).audioHash : (datos as SampleResumen).audioHash} ancho />
                        <Campo etiqueta="Ruta Preview" valor={datos.rutaPreview} ancho />
                        <Campo etiqueta="Ruta Waveform" valor={datos.rutaWaveform} ancho />
                        {completo && <Campo etiqueta="Archivo Original" valor={(datos as Sample).rutaOriginal} ancho />}
                        {completo && <Campo etiqueta="Audio Optimizado" valor={(datos as Sample).rutaOptimizada} ancho />}
                        {datos.imagenUrl && <Campo etiqueta="Imagen URL" valor={datos.imagenUrl} ancho />}
                    </div>
                </div>

                {/* Sección: Tags */}
                {datos.tags && datos.tags.length > 0 && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">Tags</div>
                        <div className="inspectorTags">
                            {datos.tags.map((tag) => (
                                <span key={tag} className="inspectorTag">
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
                            <Campo etiqueta={t('metadata.generos')} valor={
                                Array.isArray(m.genero) ? m.genero.join(', ') :
                                typeof m.genero === 'string' ? m.genero : null
                            } ancho />
                            <Campo etiqueta={t('metadata.instrumentos')} valor={
                                Array.isArray(m.instrumentos) ? m.instrumentos.join(', ') :
                                typeof m.instrumentos === 'string' ? m.instrumentos : null
                            } ancho />
                            <Campo etiqueta={t('metadata.emocion')} valor={String(m.emocion || m.emocion_es || (Array.isArray(m.sentimiento) ? m.sentimiento.join(', ') : '') || '—')} ancho />
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
                            <Campo etiqueta={t('metadata.carpetaPrimaria')} valor={String(m.carpetaPrimaria || m.carpeta_primaria || '—')} />
                            <Campo etiqueta={t('metadata.carpetaSecundaria')} valor={String(m.carpetaSecundaria || m.carpeta_secundaria || '—')} />
                        </div>
                        {Boolean(m.descripcion || m.descripcionEs || m.descripcion_es || m.descripcionIA) && (
                            <div className="inspectorMetadataIA">
                                <strong>{t('metadata.descripcionIa')}:</strong>{' '}
                                {String(m.descripcion_es || m.descripcionEs || m.descripcion || m.descripcionIA)}
                            </div>
                        )}
                        {Boolean(m.descripcionCorta || m.descripcion_corta || m.descripcionCortaEs || m.descripcion_corta_es) && (
                            <div className="inspectorMetadataIA">
                                <strong>{t('metadata.descripcionCorta')}:</strong>{' '}
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
                        <Campo etiqueta="Descargas" valor={datos.totalDescargas} numerico />
                        <Campo etiqueta="Likes" valor={datos.totalLikes} numerico />
                        {'totalReproducciones' in datos && <Campo etiqueta="Reproducciones" valor={(datos as Sample).totalReproducciones} numerico />}
                        {completo && <Campo etiqueta="Comentarios" valor={(datos as Sample).totalComentarios} numerico />}
                    </div>
                </div>

                {/* Seccion: Flags de Estado del Usuario */}
                <div className="inspectorSeccion">
                    <div className="inspectorSeccionTitulo">
                        <User size={14} /> Flags de Estado
                    </div>
                    <div className="inspectorGrid">
                        <Campo etiqueta="Es Mio" valor={'esMio' in datos ? (datos as Sample).esMio : null} />
                        <Campo etiqueta="Ya Coleccionado" valor={'yaColeccionado' in datos ? (datos as Sample).yaColeccionado : null} />
                        <Campo etiqueta="En Colección" valor={'yaGuardadoEnColeccion' in datos ? (datos as Sample).yaGuardadoEnColeccion : null} />
                        <Campo etiqueta="Ya Comentado" valor={'yaComentado' in datos ? (datos as Sample).yaComentado : null} />
                        <Campo etiqueta="Ya Comprado" valor={'yaComprado' in datos ? (datos as Sample).yaComprado : null} />
                    </div>
                </div>

                {/* Seccion: Fechas */}
                {completo && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">
                            <Clock size={14} /> Fechas
                        </div>
                        <div className="inspectorGrid">
                            <Campo etiqueta="Publicado" valor={(datos as Sample).publicadoAt} ancho />
                            <Campo etiqueta="Creado" valor={(datos as Sample).creadoAt} ancho />
                        </div>
                    </div>
                )}

                {/* Sección: Creador */}
                {datos.creador && (
                    <div className="inspectorSeccion">
                        <div className="inspectorSeccionTitulo">
                            <User size={14} /> Creador
                        </div>
                        <div className="inspectorCreador">
                            <Avatar nombre={datos.creador.nombreVisible} src={datos.creador.avatarUrl ?? undefined} tamano="sm" />
                            <div className="inspectorCreadorInfo">
                                <span className="inspectorCreadorNombre">
                                    {datos.creador.nombreVisible}
                                    {datos.creador.verificado && (
                                        <BadgeCheck size={14} className="inspectorVerificado" />
                                    )}
                                </span>
                                <span className="inspectorCreadorUsername">
                                    @{datos.creador.username} (ID: {datos.creador.id})
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sección: JSON Crudo del Sample (toggle) */}
                <div className="inspectorSeccion">
                    <BotonBase variante="ghost" className="inspectorSeccionTitulo" onClick={() => setJsonVisible(!jsonVisible)} type="button">
                        <Code size={14} /> JSON Crudo (Sample)
                        {jsonVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </BotonBase>
                    {jsonVisible && <pre className="inspectorJsonCrudo">{JSON.stringify(datos, null, 2)}</pre>}
                </div>

                {/* Sección: JSON Crudo de la IA (toggle separado) */}
                <div className="inspectorSeccion">
                    <BotonBase variante="ghost"
                        className="inspectorSeccionTitulo"
                        onClick={() => setJsonIaVisible(!jsonIaVisible)}
                        type="button"
                    >
                        <Code size={14} /> JSON Crudo (Metadata IA)
                        {jsonIaVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </BotonBase>
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
