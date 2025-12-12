/**
 * StatsTab - Pestana de estadisticas del panel de administracion de IA
 *
 * Muestra estadisticas de articulos generados:
 * - Total generados
 * - Pendientes de revision
 * - Aprobados
 * - Publicados
 * - Rechazados
 */

import {RefreshCw, BarChart3} from 'lucide-react';
import {Button} from '../../../components/ui';

interface AIStats {
    total: number;
    pending: number;
    approved: number;
    published: number;
    rejected: number;
}

interface StatsTabProps {
    stats: AIStats | null;
    loading: boolean;
    onRefresh: () => void;
}

const STAT_CARDS_CONFIG = [
    {key: 'total', label: 'Total generados', color: 'text-primary'},
    {key: 'pending', label: 'Pendientes', color: 'text-amber-500'},
    {key: 'approved', label: 'Aprobados', color: 'text-blue-500'},
    {key: 'published', label: 'Publicados', color: 'text-green-500'},
    {key: 'rejected', label: 'Rechazados', color: 'text-red-500'}
] as const;

export function StatsTab({stats, loading, onRefresh}: StatsTabProps): JSX.Element {
    if (!stats) {
        return (
            <div id="stats-loading" className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted" />
            </div>
        );
    }

    return (
        <div id="stats-tab-content" className="space-y-6">
            <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estadisticas de Generacion
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {STAT_CARDS_CONFIG.map(statConfig => (
                    <StatCard key={statConfig.key} label={statConfig.label} value={stats[statConfig.key]} colorClass={statConfig.color} />
                ))}
            </div>

            <Button onClick={onRefresh} variant="ghost" size="sm">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar estadisticas
            </Button>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: number;
    colorClass: string;
}

function StatCard({label, value, colorClass}: StatCardProps): JSX.Element {
    return (
        <div className="p-4 rounded-xl border border-primary bg-surface text-center">
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
            <p className="text-sm text-muted">{label}</p>
        </div>
    );
}
