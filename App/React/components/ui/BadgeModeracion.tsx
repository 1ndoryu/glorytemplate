/*
 * Componente: BadgeModeracion — Kamples
 * Icono indicador del estado de moderación/procesamiento.
 * Solo visible para el autor del contenido o admin.
 */

import { Clock, CheckCircle, AlertTriangle, XCircle, Loader } from 'lucide-react';
import '../../styles/componentes/badgeModeracion.css';

type EstadoModeracion = 'pendiente' | 'aprobado' | 'revision' | 'rechazado';
type EstadoSample = 'procesando' | 'activo' | 'inactivo' | 'eliminado';

interface BadgeModeracionProps {
    /* Para publicaciones */
    moderacionEstado?: EstadoModeracion | null;
    /* Para samples (usan campo estado) */
    estadoSample?: EstadoSample;
    className?: string;
}

/* Mapa de estados a icon + tooltip + clase CSS */
const configModeracion: Record<EstadoModeracion, { icono: typeof Clock; titulo: string; clase: string }> = {
    pendiente: { icono: Clock, titulo: 'Pendiente de moderación', clase: 'moderacionPendiente' },
    aprobado: { icono: CheckCircle, titulo: 'Aprobado', clase: 'moderacionAprobado' },
    revision: { icono: AlertTriangle, titulo: 'En revisión', clase: 'moderacionRevision' },
    rechazado: { icono: XCircle, titulo: 'Rechazado', clase: 'moderacionRechazado' },
};

const configSample: Record<string, { icono: typeof Clock; titulo: string; clase: string }> = {
    procesando: { icono: Loader, titulo: 'Procesando audio', clase: 'moderacionProcesando' },
    inactivo: { icono: AlertTriangle, titulo: 'Sample inactivo', clase: 'moderacionRevision' },
};

export const BadgeModeracion = ({
    moderacionEstado,
    estadoSample,
    className = '',
}: BadgeModeracionProps): JSX.Element | null => {
    /* Determinar config según tipo */
    let config: { icono: typeof Clock; titulo: string; clase: string } | null = null;

    if (moderacionEstado && moderacionEstado !== 'aprobado') {
        config = configModeracion[moderacionEstado] ?? null;
    } else if (estadoSample && estadoSample !== 'activo' && estadoSample !== 'eliminado') {
        config = configSample[estadoSample] ?? null;
    }

    if (!config) return null;

    const Icono = config.icono;

    return (
        <span
            className={`badgeModeracion ${config.clase} ${className}`.trim()}
            title={config.titulo}
            aria-label={config.titulo}
        >
            <Icono size={14} />
        </span>
    );
};

export default BadgeModeracion;
