/*
 * Componente: ListaAdjuntos — Kamples (183A-110-C)
 * Renderiza los adjuntos (samples y colecciones) del editor de artículos.
 * Samples se muestran como tarjeta compacta tipo feed.
 * Colecciones se muestran como header de colección (imagen + info).
 * Cada adjunto tiene su propio toggle de descarga pública.
 */

import { Disc3, FolderOpen, Check, Download, X } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import type { AdjuntoArticulo } from '@app/types';
import '@app/styles/componentes/modalArticulo.css';

interface ListaAdjuntosProps {
    adjuntos: AdjuntoArticulo[];
    onQuitar: (index: number) => void;
    onToggleDescarga: (index: number) => void;
}

export const ListaAdjuntos = ({ adjuntos, onQuitar, onToggleDescarga }: ListaAdjuntosProps): JSX.Element | null => {
    if (adjuntos.length === 0) return null;

    return (
        <div className="editorArticuloAdjuntos">
            <span className="editorArticuloAdjuntosLabel">
                Contenido adjunto ({adjuntos.length})
            </span>
            {adjuntos.map((adjunto, idx) => (
                adjunto.tipo === 'sample'
                    ? <AdjuntoSampleCard key={`s-${adjunto.id}`} adjunto={adjunto} idx={idx} onQuitar={onQuitar} onToggleDescarga={onToggleDescarga} />
                    : <AdjuntoColeccionCard key={`c-${adjunto.id}`} adjunto={adjunto} idx={idx} onQuitar={onQuitar} onToggleDescarga={onToggleDescarga} />
            ))}
        </div>
    );
};

/* Tarjeta de sample adjunto — imita TarjetaSample del feed */
const AdjuntoSampleCard = ({ adjunto, idx, onQuitar, onToggleDescarga }: {
    adjunto: AdjuntoArticulo; idx: number;
    onQuitar: (i: number) => void; onToggleDescarga: (i: number) => void;
}): JSX.Element => (
    <div className="adjuntoSample">
        {adjunto.imagenUrl ? (
            <img className="adjuntoSampleImg" src={adjunto.imagenUrl} alt={adjunto.titulo} />
        ) : (
            <div className="adjuntoSampleImgVacia"><Disc3 size={20} /></div>
        )}
        <div className="adjuntoInfo">
            <span className="adjuntoTitulo">{adjunto.titulo}</span>
            <span className="adjuntoCreador">por {adjunto.creadorNombre}</span>
        </div>
        <div className="adjuntoAcciones">
            <ToggleDescarga activo={adjunto.descargaPublica} onToggle={() => onToggleDescarga(idx)} />
            <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => onQuitar(idx)} aria-label="Quitar adjunto">
                <X size={14} />
            </BotonBase>
        </div>
    </div>
);

/* Tarjeta de colección adjunta — imita coleccionHeader */
const AdjuntoColeccionCard = ({ adjunto, idx, onQuitar, onToggleDescarga }: {
    adjunto: AdjuntoArticulo; idx: number;
    onQuitar: (i: number) => void; onToggleDescarga: (i: number) => void;
}): JSX.Element => (
    <div className="adjuntoColeccion">
        {adjunto.imagenUrl ? (
            <img className="adjuntoColeccionImg" src={adjunto.imagenUrl} alt={adjunto.titulo} />
        ) : (
            <div className="adjuntoColeccionImgVacia"><FolderOpen size={24} /></div>
        )}
        <div className="adjuntoColeccionInfo">
            <span className="adjuntoTitulo">{adjunto.titulo}</span>
            <span className="adjuntoCreador">por {adjunto.creadorNombre}</span>
            {adjunto.totalSamples != null && (
                <span className="adjuntoColeccionStats">{adjunto.totalSamples} samples</span>
            )}
        </div>
        <div className="adjuntoAcciones">
            <ToggleDescarga activo={adjunto.descargaPublica} onToggle={() => onToggleDescarga(idx)} />
            <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => onQuitar(idx)} aria-label="Quitar adjunto">
                <X size={14} />
            </BotonBase>
        </div>
    </div>
);

/* Toggle de descarga individual reutilizable */
const ToggleDescarga = ({ activo, onToggle }: { activo: boolean; onToggle: () => void }): JSX.Element => (
    <div
        className="adjuntoDescarga"
        onClick={onToggle}
        role="checkbox"
        aria-checked={activo}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
    >
        <div className={`adjuntoDescargaCheck ${activo ? 'adjuntoDescargaCheckActivo' : ''}`}>
            {activo && <Check size={10} />}
        </div>
        <Download size={12} />
    </div>
);

export default ListaAdjuntos;
