/* [2003A-13] Hook para gestión de problemas reportados (solo admin).
 * Lista reportes, marcar como resuelto, eliminar. */

import {useState, useCallback, useRef, useEffect} from 'react';
import {API_BASE} from '../constants/cap-constants';

export interface ProblemaReportado {
    id: number;
    user_id: number;
    centro_id: number | null;
    mensaje: string;
    estado: 'pendiente' | 'resuelto';
    created_at: string;
    resuelto_at: string | null;
    nombre_usuario: string;
    email_usuario: string;
}

interface UseProblemasReturn {
    problemas: ProblemaReportado[];
    cargando: boolean;
    error: string;
    cargarProblemas: () => Promise<void>;
    resolverProblema: (id: number) => Promise<boolean>;
    eliminarProblema: (id: number) => Promise<boolean>;
}

export function useProblemas(): UseProblemasReturn {
    const [problemas, setProblemas] = useState<ProblemaReportado[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const cargarProblemas = useCallback(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setCargando(true);
        setError('');

        try {
            const nonce = (window as any).wpApiSettings?.nonce || '';
            const res = await fetch(`${API_BASE}/problemas`, {
                headers: {'X-WP-Nonce': nonce},
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                setError('Error al cargar los reportes');
                return;
            }

            const data = await res.json();
            setProblemas(data);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError('Error de conexión');
            }
        } finally {
            setCargando(false);
        }
    }, []);

    const resolverProblema = useCallback(async (id: number): Promise<boolean> => {
        const nonce = (window as any).wpApiSettings?.nonce || '';
        try {
            const res = await fetch(`${API_BASE}/problemas/${id}/resolver`, {
                method: 'PUT',
                headers: {'X-WP-Nonce': nonce},
            });

            if (!res.ok) return false;

            setProblemas(prev => prev.map(p =>
                p.id === id ? {...p, estado: 'resuelto' as const, resuelto_at: new Date().toISOString()} : p
            ));
            return true;
        } catch {
            return false;
        }
    }, []);

    const eliminarProblema = useCallback(async (id: number): Promise<boolean> => {
        const nonce = (window as any).wpApiSettings?.nonce || '';
        try {
            const res = await fetch(`${API_BASE}/problemas/${id}`, {
                method: 'DELETE',
                headers: {'X-WP-Nonce': nonce},
            });

            if (!res.ok) return false;

            setProblemas(prev => prev.filter(p => p.id !== id));
            return true;
        } catch {
            return false;
        }
    }, []);

    useEffect(() => {
        cargarProblemas();
        return () => abortRef.current?.abort();
    }, [cargarProblemas]);

    return {problemas, cargando, error, cargarProblemas, resolverProblema, eliminarProblema};
}
