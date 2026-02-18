/*
 * Componente: BadgeModeracion — Kamples
 * Icono indicador del estado de moderación/procesamiento.
 * Solo visible para el autor del contenido o admin.
 */

import { Clock, CheckCircle, AlertTriangle, XCircle, Loader, ShieldAlert } from 'lucide-react';
import type { EstadoSample } from '../../types';
import '../../styles/componentes/badgeModeracion.css';

type EstadoModeracion = 'pendiente' | 'aprobado' | 'revision' | 'rechazado';

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
    en_supervision: { icono: ShieldAlert, titulo: 'En supervisi\u00f3n', clase: 'moderacionRevision' },
};

export const BadgeModeracion = ({
    moderacionEstado,
    estadoSample,
    className = '',
}: BadgeModeracionProps): JSX.Element | null => {
    /* Determinar config según tipo */
    let config: { icono: typeof Clock; titulo: string; clase: string } | null = null;

    if (moderacionEstado) {
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
