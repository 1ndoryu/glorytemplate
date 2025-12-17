/**
 * SettingsIsland - Panel de Configuracion del Tema
 *
 * Panel para administradores que permite gestionar:
 * - Identidad del sitio (nombre, tagline, telefono, email)
 * - URLs de contacto (Calendly, WhatsApp)
 * - Perfiles sociales (LinkedIn, Twitter, YouTube, Instagram)
 * - Imagenes del sitio (hero, secundaria)
 * - Integraciones (GTM, GA4, GSC)
 *
 * SOLO visible para administradores autenticados.
 * Acceso: /configuracion
 *
 * ARQUITECTURA:
 * Este archivo actua como orquestador principal.
 * La logica de cada tab esta extraida en:
 * - features/settings/components/*Tab.tsx
 * - features/settings/hooks/useSettingsApi.ts
 */

import {useState, useEffect} from 'react';
import {Settings, Building2, Calendar, Share2, Image, LineChart, Save, RotateCcw, Check, X, AlertCircle} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {IdentityTab, ContactTab, SocialTab, ImagesTab, IntegrationsTab, LogoTab, useSettingsApi} from '../features/settings';
import type {SettingsTab} from '../features/settings';

interface TabConfig {
    id: SettingsTab;
    label: string;
    icon: typeof Settings;
}

const TABS: TabConfig[] = [
    {id: 'identity', label: 'Identidad', icon: Building2},
    {id: 'contact', label: 'Contacto', icon: Calendar},
    {id: 'social', label: 'Redes Sociales', icon: Share2},
    {id: 'images', label: 'Imágenes', icon: Image},
    {id: 'logo', label: 'Logo', icon: Image},
    {id: 'integrations', label: 'Integraciones', icon: LineChart}
];

export function SettingsIsland(): JSX.Element {
    const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
    const settings = useSettingsApi();

    // Redirigir a login si no esta autenticado
    useEffect(() => {
        if (settings.isUnauthorized) {
            // Redirigir al login de WordPress con redirect_to a esta pagina
            const currentUrl = window.location.href;
            const loginUrl = `/wp-login.php?redirect_to=${encodeURIComponent(currentUrl)}`;
            window.location.href = loginUrl;
        }
    }, [settings.isUnauthorized]);

    return (
        <PageLayout headerCtaText="Volver al sitio" mainClassName="settings-page">
            <div id="settings-panel" className="settings-panel">
                <SettingsHeader />

                {settings.loading ? (
                    <LoadingState />
                ) : (
                    <>
                        <div className="settings-layout">
                            <TabsNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

                            <div className="settings-content">
                                <MessageBanners error={settings.error} success={settings.success} onClear={settings.clearMessages} />

                                <TabContent activeTab={activeTab} settings={settings} />
                            </div>
                        </div>

                        <SettingsFooter isDirty={settings.isDirty} saving={settings.saving} onSave={settings.saveOptions} onReset={settings.resetChanges} />
                    </>
                )}
            </div>
        </PageLayout>
    );
}

function SettingsHeader(): JSX.Element {
    return (
        <header id="settings-header" className="settings-header">
            <div className="settings-header-icon">
                <Settings className="settings-icon-large" />
            </div>
            <div>
                <h1 className="settings-title">Configuración del Tema</h1>
                <p className="settings-subtitle">Gestiona las opciones de tu sitio web desde un solo lugar.</p>
            </div>
        </header>
    );
}

function LoadingState(): JSX.Element {
    return (
        <div className="settings-loading">
            <div className="settings-loading-spinner" />
            <p>Cargando configuración...</p>
        </div>
    );
}

interface TabsNavigationProps {
    tabs: TabConfig[];
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

function TabsNavigation({tabs, activeTab, onTabChange}: TabsNavigationProps): JSX.Element {
    return (
        <nav id="settings-nav" className="settings-nav">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`settings-nav-item ${activeTab === tab.id ? 'settings-nav-item--active' : ''}`}>
                    <tab.icon className="settings-nav-icon" />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}

interface MessageBannersProps {
    error: string | null;
    success: string | null;
    onClear: () => void;
}

function MessageBanners({error, success, onClear}: MessageBannersProps): JSX.Element | null {
    if (!error && !success) return null;

    return (
        <div className="settings-messages">
            {success && (
                <div className="settings-message settings-message--success">
                    <Check className="settings-message-icon" />
                    <span>{success}</span>
                    <button onClick={onClear} className="settings-message-close">
                        <X className="settings-message-close-icon" />
                    </button>
                </div>
            )}
            {error && (
                <div className="settings-message settings-message--error">
                    <AlertCircle className="settings-message-icon" />
                    <span>{error}</span>
                    <button onClick={onClear} className="settings-message-close">
                        <X className="settings-message-close-icon" />
                    </button>
                </div>
            )}
        </div>
    );
}

interface TabContentProps {
    activeTab: SettingsTab;
    settings: ReturnType<typeof useSettingsApi>;
}

function TabContent({activeTab, settings}: TabContentProps): JSX.Element | null {
    switch (activeTab) {
        case 'identity':
            return <IdentityTab options={settings.options} onUpdate={settings.updateOption} />;
        case 'contact':
            return <ContactTab options={settings.options} onUpdate={settings.updateOption} />;
        case 'social':
            return <SocialTab options={settings.options} onUpdate={settings.updateOption} />;
        case 'images':
            return <ImagesTab options={settings.options} onUpdate={settings.updateOption} onUpload={settings.uploadImage} />;
        case 'logo':
            return <LogoTab options={settings.options} onUpdate={settings.updateOption} onUpload={settings.uploadImage} />;
        case 'integrations':
            return <IntegrationsTab options={settings.options} onUpdate={settings.updateOption} />;
        default:
            return null;
    }
}

interface SettingsFooterProps {
    isDirty: boolean;
    saving: boolean;
    onSave: () => void;
    onReset: () => void;
}

function SettingsFooter({isDirty, saving, onSave, onReset}: SettingsFooterProps): JSX.Element {
    return (
        <footer id="settings-footer" className="settings-footer">
            <div className="settings-footer-status">{isDirty && <span className="settings-unsaved-indicator">Tienes cambios sin guardar</span>}</div>
            <div className="settings-footer-actions">
                <button type="button" onClick={onReset} disabled={!isDirty || saving} className="settings-btn settings-btn--secondary">
                    <RotateCcw className="settings-btn-icon" />
                    Descartar cambios
                </button>
                <button type="button" onClick={onSave} disabled={!isDirty || saving} className="settings-btn settings-btn--primary">
                    {saving ? (
                        <>
                            <span className="settings-btn-spinner" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="settings-btn-icon" />
                            Guardar cambios
                        </>
                    )}
                </button>
            </div>
        </footer>
    );
}
