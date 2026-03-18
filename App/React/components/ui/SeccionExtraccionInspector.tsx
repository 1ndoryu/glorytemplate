/*
 * QQ117 + QK32: Seccion de extraccion para el inspector de samples.
 * Muestra metadata de la cola de extraccion: fuente, timing, metodo descarga.
 * QK32: YouTube clickable, tiempo formateado, artista-titulo unificado,
 * links a canciones en kamples, album.
 */

import { Download, ExternalLink } from 'lucide-react';
import type { ExtraccionSample } from '@app/types';

interface CampoProps {
    etiqueta: string;
    valor: string | number | boolean | null | undefined;
    numerico?: boolean;
    ancho?: boolean;
}

/* Campo reutilizado del inspector — replica la estructura de ModalInspectorSample */
const Campo = ({ etiqueta, valor, numerico, ancho }: CampoProps) => {
    const valorTexto = valor === null || valor === undefined ? '—'
        : typeof valor === 'boolean' ? (valor ? 'Si' : 'No')
        : String(valor);

    return (
        <div className={`inspectorCampo ${ancho ? 'inspectorCampoAncho' : ''}`}>
            <span className="inspectorCampoEtiqueta">{etiqueta}</span>
            <span className={`inspectorCampoValor ${numerico ? 'inspectorNumerico' : ''}`}>{valorTexto}</span>
        </div>
    );
};

/* Campo con link externo clickable */
const CampoLink = ({ etiqueta, url, texto, ancho }: {
    etiqueta: string;
    url: string;
    texto?: string;
    ancho?: boolean;
}) => (
    <div className={`inspectorCampo ${ancho ? 'inspectorCampoAncho' : ''}`}>
        <span className="inspectorCampoEtiqueta">{etiqueta}</span>
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inspectorCampoValor inspectorLink"
        >
            {texto || url} <ExternalLink size={10} />
        </a>
    </div>
);

/* Convierte segundos a formato M:SS, ej: 103.5 → "1:43" */
const formatearTiempo = (seg: number): string => {
    const minutos = Math.floor(seg / 60);
    const segundos = Math.round(seg % 60);
    return `${minutos}:${String(segundos).padStart(2, '0')}`;
};

interface SeccionExtraccionInspectorProps {
    extraccion: ExtraccionSample;
    sampleSlug?: string;
}

export const SeccionExtraccionInspector = ({ extraccion, sampleSlug }: SeccionExtraccionInspectorProps): JSX.Element => {
    /* Unificar "Artista — Titulo" para cada cancion del sampleo */
    const cancionFuente = [extraccion.sampleoFuenteArtista, extraccion.sampleoFuenteTitulo]
        .filter(Boolean).join(' — ') || null;
    const cancionDestino = [extraccion.sampleoDestinoArtista, extraccion.sampleoDestinoTitulo]
        .filter(Boolean).join(' — ') || null;

    /* Rango de extraccion formateado como tiempo */
    const rangoExtraccion = (extraccion.compasInicioSeg != null && extraccion.compasFinSeg != null)
        ? `${formatearTiempo(extraccion.compasInicioSeg)} a ${formatearTiempo(extraccion.compasFinSeg)}`
        : null;

    return (
        <div className="inspectorSeccion">
            <div className="inspectorSeccionTitulo">
                <Download size={14} /> Extraccion
            </div>
            <div className="inspectorGrid">
                {/* Canciones del sampleo con links */}
                {cancionFuente && (
                    extraccion.fuenteSlug
                        ? <CampoLink etiqueta="Cancion Fuente" url={`/cancion/${extraccion.fuenteSlug}`} texto={cancionFuente} ancho />
                        : <Campo etiqueta="Cancion Fuente" valor={cancionFuente} ancho />
                )}
                {extraccion.fuenteAlbum && (
                    <Campo etiqueta="Album Fuente" valor={extraccion.fuenteAlbum} />
                )}
                {cancionDestino && (
                    extraccion.destinoSlug
                        ? <CampoLink etiqueta="Cancion Destino" url={`/cancion/${extraccion.destinoSlug}`} texto={cancionDestino} ancho />
                        : <Campo etiqueta="Cancion Destino" valor={cancionDestino} ancho />
                )}
                {extraccion.destinoAlbum && (
                    <Campo etiqueta="Album Destino" valor={extraccion.destinoAlbum} />
                )}
                <Campo etiqueta="Tipo Elemento" valor={extraccion.tipoElemento} />
                <Campo etiqueta="Votos Total" valor={extraccion.votosTotal} numerico />

                {/* Sample en kamples */}
                {sampleSlug && (
                    <CampoLink etiqueta="Sample en Kamples" url={`/sample/${sampleSlug}/`} texto={`/sample/${sampleSlug}/`} ancho />
                )}

                {/* Fuente de descarga */}
                <Campo etiqueta="Origen" valor={extraccion.origen} />
                <Campo etiqueta="Metodo Descarga" valor={extraccion.descargaMetodo} />
                {extraccion.youtubeId && (
                    <CampoLink etiqueta="YouTube" url={`https://www.youtube.com/watch?v=${extraccion.youtubeId}`} texto={extraccion.youtubeId} />
                )}
                {extraccion.spotifyId && (
                    <CampoLink etiqueta="Spotify" url={`https://open.spotify.com/track/${extraccion.spotifyId}`} texto={extraccion.spotifyId} />
                )}
                {extraccion.fuenteUrl && (
                    <CampoLink etiqueta="URL Descarga" url={extraccion.fuenteUrl} ancho />
                )}
                {extraccion.fuenteTitulo && (
                    <Campo etiqueta="Titulo en Fuente" valor={
                        [extraccion.fuenteArtista, extraccion.fuenteTitulo].filter(Boolean).join(' — ')
                    } ancho />
                )}

                {/* Timing y audio */}
                <Campo etiqueta="Lado" valor={extraccion.lado} />
                <Campo etiqueta="Estado Cola" valor={extraccion.estado} />
                {rangoExtraccion && (
                    <Campo etiqueta="Rango Extraido" valor={rangoExtraccion} />
                )}
                {extraccion.timingInicioSeg != null && (
                    <Campo etiqueta="Timing Inicio" valor={formatearTiempo(extraccion.timingInicioSeg)} />
                )}
                <Campo etiqueta="BPM Detectado" valor={extraccion.bpmDetectado} numerico />
                {extraccion.duracionCompasSeg != null && (
                    <Campo etiqueta="Duración Compás" valor={`${extraccion.duracionCompasSeg}s`} numerico />
                )}
                <Campo etiqueta="Recorte por Compas" valor={extraccion.recortePorCompas} />
                {extraccion.duracionExtraida != null && (
                    <Campo etiqueta="Duración Extraída" valor={`${extraccion.duracionExtraida}s`} numerico />
                )}
                <Campo etiqueta="Formato" valor={extraccion.formatoExtraido} />
                {extraccion.tamanoBytes != null && (
                    <Campo etiqueta="Tamano" valor={`${(extraccion.tamanoBytes / 1024).toFixed(1)} KB`} numerico />
                )}
            </div>
        </div>
    );
};