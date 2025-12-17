/**
 * useSettingsApi - Hook para interactuar con la API de configuración
 *
 * Proporciona métodos para:
 * - Cargar opciones actuales
 * - Guardar cambios
 * - Subir imagenes
 * - Validar campos
 */

import {useState, useCallback, useEffect} from 'react';
import type {SettingsState, SaveResult} from '../types';

const API_BASE = '/wp-json/glory/v1/settings';

interface UseSettingsApiReturn extends SettingsState {
    loadOptions: () => Promise<void>;
    updateOption: (key: string, value: string) => void;
    saveOptions: () => Promise<SaveResult>;
    uploadImage: (file: File) => Promise<string>;
    clearMessages: () => void;
    resetChanges: () => void;
    isUnauthorized: boolean;
}

export function useSettingsApi(): UseSettingsApiReturn {
    const [options, setOptions] = useState<Record<string, string>>({});
    const [originalOptions, setOriginalOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    // Cargar opciones al montar
    const loadOptions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const nonce = getWpNonce();

            const response = await fetch(API_BASE, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'X-WP-Nonce': nonce
                }
            });

            if (!response.ok) {
                // Detectar error de autenticación
                if (response.status === 401 || response.status === 403) {
                    setIsUnauthorized(true);
                    throw new Error('No tienes permiso para acceder');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: No tienes permiso para acceder`);
            }

            const data = await response.json();
            setOptions(data.options || {});
            setOriginalOptions(data.options || {});
            setIsDirty(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar al montar
    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    // Actualizar una opcion
    const updateOption = useCallback(
        (key: string, value: string) => {
            setOptions(prev => {
                const updated = {...prev, [key]: value};
                setIsDirty(JSON.stringify(updated) !== JSON.stringify(originalOptions));
                return updated;
            });
            // Limpiar mensajes al editar
            setSuccess(null);
            setError(null);
        },
        [originalOptions]
    );

    // Guardar opciones
    const saveOptions = useCallback(async (): Promise<SaveResult> => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': getWpNonce()
                },
                body: JSON.stringify({options})
            });

            const data = await response.json();

            if (!response.ok) {
                // Detectar error de autenticación
                if (response.status === 401 || response.status === 403) {
                    setIsUnauthorized(true);
                }
                throw new Error(data.message || 'Error al guardar');
            }

            setOriginalOptions(options);
            setIsDirty(false);
            setSuccess('Configuración guardada correctamente');

            return {success: true, message: 'Guardado correctamente'};
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            return {success: false, message};
        } finally {
            setSaving(false);
        }
    }, [options]);

    // Subir imagen
    const uploadImage = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/wp-json/wp/v2/media', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-WP-Nonce': getWpNonce()
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir la imagen');
        }

        const data = await response.json();
        return data.source_url;
    }, []);

    // Limpiar mensajes
    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    // Resetear cambios
    const resetChanges = useCallback(() => {
        setOptions(originalOptions);
        setIsDirty(false);
        setError(null);
        setSuccess(null);
    }, [originalOptions]);

    return {
        options,
        loading,
        saving,
        error,
        success,
        isDirty,
        isUnauthorized,
        loadOptions,
        updateOption,
        saveOptions,
        uploadImage,
        clearMessages,
        resetChanges
    };
}

// Helper para obtener el nonce de WordPress
function getWpNonce(): string {
    // Opción 1: wpApiSettings (estándar de WordPress, inyectado por ContentAI loader)
    const wpApiSettings = (window as unknown as {wpApiSettings?: {nonce?: string}}).wpApiSettings;
    if (wpApiSettings?.nonce) {
        return wpApiSettings.nonce;
    }

    // Opción 2: Meta tag
    const nonceElement = document.querySelector('meta[name="wp-api-nonce"]');
    if (nonceElement) {
        return nonceElement.getAttribute('content') || '';
    }

    // Opción 3: gloryReactContent
    const gloryContent = (window as unknown as {gloryReactContent?: {nonce?: string}}).gloryReactContent;
    if (gloryContent?.nonce) {
        return gloryContent.nonce;
    }

    console.warn('[Settings] No se encontró el nonce de WordPress');
    return '';
}
