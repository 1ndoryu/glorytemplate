import {useState, useCallback} from 'react';

interface User {
    name: string;
    email: string;
    login: string;
}

interface UseAuthReturn {
    loginWithGoogle: () => Promise<void>;
    loginWithCredentials: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    handleCallback: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    error: string | null;
    user: User | null;
}

export function useAuth(): UseAuthReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Inicializar usuario desde datos inyectados por WP */
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window === 'undefined') return null;
        const wpData = (window as any).gloryDashboard;
        return wpData?.currentUser || null;
    });

    const loginWithGoogle = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/wp-json/glory/v1/auth/google/url', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                window.location.href = data.url;
            } else {
                throw new Error(data.message || 'Error obteniendo URL de login');
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error de conexión';
            setError(msg);
            setLoading(false);
            console.error('Login error:', e);
        }
    }, []);

    const loginWithCredentials = useCallback(async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/wp-json/glory/v1/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            const data = await response.json();

            if (data.success) {
                window.location.reload();
            } else {
                throw new Error(data.message || 'Error en login');
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            setLoading(false);
            throw e;
        }
    }, []);

    const register = useCallback(async (username: string, email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/wp-json/glory/v1/auth/register', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, email, password})
            });
            const data = await response.json();

            if (data.success) {
                window.location.reload();
            } else {
                throw new Error(data.message || 'Error en el registro');
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            setLoading(false);
            throw e;
        }
    }, []);

    const handleCallback = useCallback(async (code: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/wp-json/glory/v1/auth/google/login', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({code})
            });
            const data = await response.json();

            if (data.success) {
                window.location.href = window.location.pathname;
            } else {
                throw new Error(data.message || 'Error en login con Google');
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/wp-json/glory/v1/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }, []);

    return {loginWithGoogle, loginWithCredentials, register, handleCallback, logout, loading, error, user};
}
