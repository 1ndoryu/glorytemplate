/**
 * DraftStatusBadge - Componente que muestra el estado del borrador
 *
 * Muestra un badge con colores correspondientes al estado:
 * - pending_review: amarillo
 * - approved: azul
 * - published: verde
 * - rejected: rojo
 */

import {Badge} from '../../../components/ui';

interface DraftStatusBadgeProps {
    status: string;
}

const STATUS_CONFIG: Record<string, {variant: 'info' | 'success' | 'warning' | 'error'; label: string}> = {
    pending_review: {variant: 'warning', label: 'Pendiente'},
    approved: {variant: 'info', label: 'Aprobado'},
    published: {variant: 'success', label: 'Publicado'},
    rejected: {variant: 'error', label: 'Rechazado'}
};

export function DraftStatusBadge({status}: DraftStatusBadgeProps): JSX.Element {
    const config = STATUS_CONFIG[status] || {variant: 'info', label: status};

    return (
        <Badge variant={config.variant} size="sm">
            {config.label}
        </Badge>
    );
}
