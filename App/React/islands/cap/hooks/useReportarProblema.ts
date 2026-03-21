/* [2003A-13] Hook para enviar reportes de problemas.
 * Usado por todos los usuarios desde el modal de reportar.
 * Admin: envía email directo. No-admin: guarda en BD. */

import {useState, useCallback, useRef} from 'react';
import {API_BASE} from '../constants/cap-constants';

interface UseReportarProblemaReturn {
    mensaje: string;
    setMensaje: (v: string) => void;
    enviando: boolean;
    error: string;
    exito: string;
    enviarReporte: () => Promise<boolean>;
    limpiar: () => void;
}

export function useReportarProblema(): UseReportarProblemaReturn {
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const limpiar = useCallback(() => {
        setMensaje('');
        setError('');
        setExito('');
    }, []);

    const enviarReporte = useCallback(async (): Promise<boolean> => {
        const textoLimpio = mensaje.trim();
        if (!textoLimpio) {
            setError('Escribe un mensaje describiendo el problema');
            return false;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setEnviando(true);
        setError('');
        setExito('');

        try {
            const nonce = (window as any).wpApiSettings?.nonce || '';
            const res = await fetch(`${API_BASE}/problemas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                },
                body: JSON.stringify({mensaje: textoLimpio}),
                signal: abortRef.current.signal,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error al enviar el reporte');
                return false;
            }

            setExito(data.mensaje || 'Reporte enviado');
            setMensaje('');
            return true;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError('Error de conexión. Intenta de nuevo.');
            }
            return false;
        } finally {
            setEnviando(false);
        }
    }, [mensaje]);

    return {mensaje, setMensaje, enviando, error, exito, enviarReporte, limpiar};
}
