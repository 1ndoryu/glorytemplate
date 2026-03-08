/*
 * Componente: TarjetaDuplicado — D5
 * Muestra una comparacion lado a lado de sample original vs duplicado.
 * 4 acciones: fusionar (conservar original), intercambiar (conservar duplicado),
 * aprobar (ambos coexisten) y rechazar (eliminar duplicado).
 */

import { Loader2, Merge, ArrowLeftRight, Check, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
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

const LadoSample = ({ etiqueta, titulo, creador, fecha, sampleId }: {
    etiqueta: string;
    titulo: string;
    creador: string;
    fecha: string;
    sampleId: number;
}): JSX.Element => (
    <div className="dupLado">
        <span className="dupLadoEtiqueta">{etiqueta}</span>
        <span className="dupLadoTitulo" title={titulo}>{titulo}</span>
        <span className="dupLadoMeta">
            por <strong>{creador}</strong> — {formatoFecha(fecha)}
        </span>
        <span className="dupLadoId">#{sampleId}</span>
    </div>
);

export const TarjetaDuplicado = ({ duplicado, procesando, onAccion }: TarjetaDuplicadoProps): JSX.Element => {
    const d = duplicado;

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
                    etiqueta="Original"
                    titulo={d.original_titulo}
                    creador={d.original_creador}
                    fecha={d.original_subido_at}
                    sampleId={d.original_id}
                />
                <div className="dupSeparador">
                    <span className="dupSeparadorLinea" />
                    <span className="dupSeparadorTexto">vs</span>
                    <span className="dupSeparadorLinea" />
                </div>
                <LadoSample
                    etiqueta="Duplicado"
                    titulo={d.duplicado_titulo}
                    creador={d.duplicado_creador}
                    fecha={d.duplicado_subido_at}
                    sampleId={d.duplicado_id}
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
                    Fusionar
                </BotonBase>

                <BotonBase
                    variante="secundario"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'intercambiar')}
                    title="Conservar duplicado como original, eliminar el actual original"
                >
                    <ArrowLeftRight size={14} />
                    Intercambiar
                </BotonBase>

                <BotonBase
                    variante="ghost"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'aprobar')}
                    title="No son duplicados reales, ambos coexisten"
                >
                    <Check size={14} />
                    No es duplicado
                </BotonBase>

                <BotonBase
                    variante="peligro"
                    tamano="sm"
                    disabled={procesando}
                    onClick={() => onAccion(d.id, 'rechazar')}
                    title="Eliminar sample duplicado directamente"
                >
                    <X size={14} />
                    Rechazar
                </BotonBase>
            </div>
        </div>
    );
};
