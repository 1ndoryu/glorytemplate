/**
 * Settings Feature - Tipos
 *
 * Define los tipos para el sistema de configuracion del tema.
 */

export interface ThemeOption {
    key: string;
    value: string;
    type: 'text' | 'textarea' | 'imagen';
    label: string;
    description: string;
    section: string;
    subSection?: string;
}

export interface SettingsSection {
    id: string;
    label: string;
    icon: string;
    options: ThemeOption[];
}

export interface SettingsState {
    options: Record<string, string>;
    loading: boolean;
    saving: boolean;
    error: string | null;
    success: string | null;
    isDirty: boolean;
}

export interface SaveResult {
    success: boolean;
    message: string;
}

export interface ValidationError {
    field: string;
    message: string;
}

export type SettingsTab = 'identity' | 'contact' | 'social' | 'images' | 'logo' | 'integrations';
