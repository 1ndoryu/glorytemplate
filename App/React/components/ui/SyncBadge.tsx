/*
 * Componente: SyncBadge — Indicador visual de estado de sincronización.
 *
 * Solo renderiza en desktop cuando el sample tiene estado de sync.
 * Estados: sincronizado (verde), no_sincronizar (amarillo).
 * Se usa en ExploradorIsland sobre las tarjetas de samples.
 */

import { Cloud, CloudOff } from 'lucide-react';
import { obtenerEstadoSyncSample } from '@app/hooks/useEstadoSync';

interface SyncBadgeProps {
    sampleId: number;
}

export function SyncBadge({ sampleId }: SyncBadgeProps): JSX.Element | null {
    const estado = obtenerEstadoSyncSample(sampleId);
    if (!estado || estado === 'no_descargado') return null;

    if (estado === 'sincronizado') {
        return (
            <span className="exploradorSyncBadge exploradorSyncSincronizado" title="Sincronizado">
                <Cloud size={10} />
            </span>
        );
    }

    if (estado === 'no_sincronizar') {
        return (
            <span className="exploradorSyncBadge exploradorSyncNoSincronizar" title="Sync desactivada">
                <CloudOff size={10} />
            </span>
        );
    }

    return null;
}
