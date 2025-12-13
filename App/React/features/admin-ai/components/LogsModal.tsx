/**
 * LogsModal - Modal para visualizar logs de ejecucion de IA
 *
 * Muestra el historial de ejecuciones sin guardar en archivos.
 * Los logs se obtienen de la base de datos de WordPress.
 */

import {useState, useEffect} from 'react';
import {X, RefreshCw, Clock, CheckCircle, AlertCircle, Trash2} from 'lucide-react';
import {Button} from '../../../components/ui';

interface LogEntry {
    id: string;
    timestamp: string;
    action: string;
    status: 'success' | 'error';
    message: string;
    duration?: number;
    model?: string;
}

interface LogsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LogsModal({isOpen, onClose}: LogsModalProps): JSX.Element | null {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const wpSettings = (window as unknown as {wpApiSettings?: {nonce: string}}).wpApiSettings;
            const response = await fetch('/wp-json/glory/v1/ai/logs?limit=50', {
                headers: {
                    'X-WP-Nonce': wpSettings?.nonce || ''
                },
                credentials: 'same-origin'
            });
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        setClearing(true);
        try {
            const wpSettings = (window as unknown as {wpApiSettings?: {nonce: string}}).wpApiSettings;
            await fetch('/wp-json/glory/v1/ai/logs', {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': wpSettings?.nonce || ''
                },
                credentials: 'same-origin'
            });
            setLogs([]);
        } catch (error) {
            console.error('Error clearing logs:', error);
        } finally {
            setClearing(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div id="logs-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div id="logs-modal-content" className="w-full max-w-2xl max-h-[80vh] bg-surface rounded-2xl shadow-xl border border-primary overflow-hidden flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-primary">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[var(--color-accent-primary)]" />
                        <h2 className="text-lg font-semibold text-primary">Historial de Ejecuciones</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={fetchLogs} variant="ghost" size="sm" disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button onClick={clearLogs} variant="ghost" size="sm" disabled={clearing || logs.length === 0}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                            <X className="w-5 h-5 text-muted" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-muted" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay registros de ejecuciones</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log, index) => (
                                <LogEntryCard key={log.id || index} log={log} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-4 border-t border-primary bg-secondary/30">
                    <p className="text-xs text-muted text-center">Mostrando las ultimas {logs.length} ejecuciones</p>
                </footer>
            </div>
        </div>
    );
}

function LogEntryCard({log}: {log: LogEntry}): JSX.Element {
    const isSuccess = log.status === 'success';
    const formattedDate = new Date(log.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className={`p-3 rounded-xl border ${isSuccess ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <div className="flex items-start gap-3">
                {isSuccess ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary">{log.action}</span>
                        {log.model && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted">{log.model}</span>}
                    </div>
                    <p className="text-sm text-muted mt-1 break-words">{log.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                        <span>{formattedDate}</span>
                        {log.duration && <span>{log.duration}ms</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
