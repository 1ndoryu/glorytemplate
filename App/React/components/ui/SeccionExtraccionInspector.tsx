/*
 * QQ117: Seccion de extraccion para el inspector de samples.
 * Muestra metadata de la cola de extraccion: fuente, timing, metodo descarga.
 */

import {Download} from 'lucide-react';
import type {ExtraccionSample} from '@app/types';

interface CampoProps {
    etiqueta: string;
    valor: string | number | boolean | null | undefined;
    numerico?: boolean;
    ancho?: boolean;
}

/* Campo reutilizado del inspector — replica la estructura de ModalInspectorSample */
const Campo = ({etiqueta, valor, numerico, ancho}: CampoProps) => {
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

interface SeccionExtraccionInspectorProps {
    extraccion: ExtraccionSample;
}

export const SeccionExtraccionInspector = ({extraccion}: SeccionExtraccionInspectorProps): JSX.Element => (
    <div className="inspectorSeccion">
        <div className="inspectorSeccionTitulo">
            <Download size={14} /> Extraccion
        </div>
        <div className="inspectorGrid">
            <Campo etiqueta="Origen" valor={extraccion.origen} />
            <Campo etiqueta="Metodo Descarga" valor={extraccion.descargaMetodo} />
            <Campo etiqueta="YouTube ID" valor={extraccion.youtubeId} />
            <Campo etiqueta="Spotify ID" valor={extraccion.spotifyId} />
            {extraccion.fuenteUrl && (
                <Campo etiqueta="Fuente URL" valor={extraccion.fuenteUrl} ancho />
            )}
            <Campo etiqueta="Titulo Fuente" valor={extraccion.fuenteTitulo} ancho />
            <Campo etiqueta="Artista Fuente" valor={extraccion.fuenteArtista} />
            <Campo etiqueta="Lado" valor={extraccion.lado} />
            <Campo etiqueta="Lado Extraccion" valor={extraccion.ladoExtraccion} />
            <Campo etiqueta="Estado Cola" valor={extraccion.estado} />
            <Campo etiqueta="Timing Inicio" valor={
                extraccion.timingInicioSeg != null ? `${extraccion.timingInicioSeg}s` : null
            } numerico />
            <Campo etiqueta="BPM Detectado" valor={extraccion.bpmDetectado} numerico />
            <Campo etiqueta="Duracion Compas" valor={
                extraccion.duracionCompasSeg != null ? `${extraccion.duracionCompasSeg}s` : null
            } numerico />
            <Campo etiqueta="Compas Inicio" valor={
                extraccion.compasInicioSeg != null ? `${extraccion.compasInicioSeg}s` : null
            } numerico />
            <Campo etiqueta="Compas Fin" valor={
                extraccion.compasFinSeg != null ? `${extraccion.compasFinSeg}s` : null
            } numerico />
            {extraccion.rutaAudioExtraido && (
                <Campo etiqueta="Ruta Audio Extraido" valor={extraccion.rutaAudioExtraido} ancho />
            )}
        </div>
    </div>
);
