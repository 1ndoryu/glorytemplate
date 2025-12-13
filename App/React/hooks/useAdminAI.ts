/**
 * useAdminAI - Hook para interactuar con la API de IA
 *
 * Proporciona metodos para:
 * - Configuracion del sistema
 * - Generacion de articulos
 * - Gestion de borradores
 * - Estadisticas
 */

import {useState, useCallback, useEffect} from 'react';

// Tipos para la API
export interface AIConfig {
    gemini_api_key: string;
    openai_api_key: string;
    active_provider: 'gemini' | 'openai';
    model: string;
    tone: 'cercano' | 'profesional' | 'tecnico';
    word_count: number;
    topics: string[];
    excluded_topics: string[];
    auto_search_enabled: boolean;
    search_frequency: 'manual' | 'daily' | 'weekly' | 'biweekly';
    status: {
        configured: boolean;
        provider: string;
        hasApiKey: boolean;
        message: string;
    };
}

export interface AIDraft {
    id: number;
    title: string;
    content: string;
    excerpt: string;
    status: 'draft' | 'pending' | 'publish';
    date: string;
    editUrl: string;
    previewUrl: string;
    ai: {
        sources: Array<{url: string; title: string}>;
        model: string;
        status: 'pending_review' | 'approved' | 'published' | 'rejected';
        generatedAt: string;
        prompt: string;
    };
}

export interface AIStats {
    total: number;
    pending: number;
    approved: number;
    published: number;
    rejected: number;
}

export interface ArticleIdea {
    title: string;
    description: string;
    keywords: string[];
    outline: string[];
}

// Tipo para opciones de tono
export interface ToneOption {
    label: string;
    description: string;
}

// API base
const API_BASE = '/wp-json/glory/v1/ai';

/**
 * Hook principal para el sistema de IA
 */
export function useAdminAI() {
    const [config, setConfig] = useState<AIConfig | null>(null);
    const [drafts, setDrafts] = useState<AIDraft[]>([]);
    const [stats, setStats] = useState<AIStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toneOptions, setToneOptions] = useState<Record<string, ToneOption>>({});
    const [geminiModels, setGeminiModels] = useState<Record<string, string>>({});
    const [openaiModels, setOpenaiModels] = useState<Record<string, string>>({});

    // Fetch helper con autenticacion
    const fetchAPI = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const url = API_BASE + endpoint;

        // Obtener nonce de wpApiSettings (inyectado por WordPress)
        const wpSettings = (window as unknown as {wpApiSettings?: {nonce: string; root: string}}).wpApiSettings;
        const nonce = wpSettings?.nonce || '';

        // Si no hay nonce, el usuario probablemente no esta logueado como admin
        if (!nonce) {
            setError('No estas autenticado como administrador. Inicia sesion en WordPress.');
            throw new Error('No estas autenticado como administrador');
        }

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {...defaultHeaders, ...options.headers},
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Error en la peticion');
            }

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            throw err;
        }
    }, []);

    // === CONFIGURACION ===

    const loadConfig = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchAPI('/config');
            setConfig(data.config);
            setToneOptions(data.toneOptions || {});
            setGeminiModels(data.geminiModels || {});
            setOpenaiModels(data.openaiModels || {});
            return data.config;
        } finally {
            setLoading(false);
        }
    }, [fetchAPI]);

    const saveConfig = useCallback(
        async (newConfig: Partial<AIConfig>) => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchAPI('/config', {
                    method: 'POST',
                    body: JSON.stringify(newConfig)
                });
                setConfig(data.config);
                return data;
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    const testConnection = useCallback(
        async (apiKey?: string, model?: string) => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchAPI('/config/test', {
                    method: 'POST',
                    body: JSON.stringify({apiKey, model})
                });
                return data;
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    // === GENERACION ===

    const generateArticle = useCallback(
        async (params: {title: string; topic?: string; outline?: string; tone?: string; wordCount?: number; category?: number; tags?: string[]}) => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchAPI('/generate', {
                    method: 'POST',
                    body: JSON.stringify(params)
                });
                // Recargar borradores despues de generar
                if (data.success) {
                    await loadDrafts();
                }
                return data;
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    const generateIdeas = useCallback(
        async (count: number = 5) => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchAPI('/ideas', {
                    method: 'POST',
                    body: JSON.stringify({count})
                });
                return data as {success: boolean; ideas?: ArticleIdea[]; error?: string};
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    const searchTrends = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchAPI('/search', {method: 'POST'});
            return data;
        } finally {
            setLoading(false);
        }
    }, [fetchAPI]);

    // === BORRADORES ===

    const loadDrafts = useCallback(
        async (status: string = 'all') => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchAPI(`/drafts?status=${status}`);
                setDrafts(data.drafts);
                return data.drafts;
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI]
    );

    const getDraft = useCallback(
        async (id: number) => {
            const data = await fetchAPI(`/drafts/${id}`);
            return data.draft as AIDraft;
        },
        [fetchAPI]
    );

    const updateDraft = useCallback(
        async (id: number, title: string, content: string) => {
            setLoading(true);

            try {
                const data = await fetchAPI(`/drafts/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({title, content})
                });
                await loadDrafts();
                return data;
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI, loadDrafts]
    );

    const approveDraft = useCallback(
        async (id: number) => {
            const data = await fetchAPI(`/drafts/${id}/approve`, {method: 'POST'});
            await loadDrafts();
            return data;
        },
        [fetchAPI, loadDrafts]
    );

    const publishDraft = useCallback(
        async (id: number) => {
            const data = await fetchAPI(`/drafts/${id}/publish`, {method: 'POST'});
            await loadDrafts();
            return data;
        },
        [fetchAPI, loadDrafts]
    );

    const rejectDraft = useCallback(
        async (id: number) => {
            const data = await fetchAPI(`/drafts/${id}/reject`, {method: 'POST'});
            await loadDrafts();
            return data;
        },
        [fetchAPI, loadDrafts]
    );

    const regenerateDraft = useCallback(
        async (id: number, options?: {title?: string; tone?: string}) => {
            setLoading(true);

            try {
                const data = await fetchAPI(`/drafts/${id}/regenerate`, {
                    method: 'POST',
                    body: JSON.stringify(options || {})
                });
                await loadDrafts();
                return data;
            } finally {
                setLoading(false);
            }
        },
        [fetchAPI, loadDrafts]
    );

    // === ESTADISTICAS ===

    const loadStats = useCallback(async () => {
        const data = await fetchAPI('/stats');
        setStats(data.stats);
        return data;
    }, [fetchAPI]);

    // Cargar datos iniciales
    useEffect(() => {
        loadConfig();
        loadStats();
        loadDrafts();
    }, [loadConfig, loadStats, loadDrafts]);

    return {
        // Estado
        config,
        drafts,
        stats,
        loading,
        error,
        toneOptions,
        geminiModels,
        openaiModels,

        // Configuracion
        loadConfig,
        saveConfig,
        testConnection,

        // Generacion
        generateArticle,
        generateIdeas,
        searchTrends,

        // Borradores
        loadDrafts,
        getDraft,
        updateDraft,
        approveDraft,
        publishDraft,
        rejectDraft,
        regenerateDraft,

        // Estadisticas
        loadStats,

        // Utilidades
        clearError: () => setError(null)
    };
}
