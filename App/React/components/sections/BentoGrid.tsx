import type {ReactNode} from 'react';
import {Database, Layers} from 'lucide-react';

import {Button} from '../ui';
import {siteUrls} from '../../config';

// Tipos para el contenido de cada tab
interface TabContentItem {
    icon: ReactNode;
    label: string;
    title: ReactNode;
    description: string;
}

interface BentoGridProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

// Configuracion de integraciones mostradas en la barra superior
const integrations = ['WhatsApp', 'Calendly', 'Sheets', 'HubSpot'];

// Configuracion de tabs disponibles
const tabs = [
    {id: 'whatsapp', label: 'WhatsApp'},
    {id: 'auto', label: 'Automatizacion'},
    {id: 'integraciones', label: 'Integraciones'}
];

// Contenido para cada tab
// Se define como funcion para evitar renderizado prematuro de JSX
const getTabContent = (): Record<string, TabContentItem> => ({
    whatsapp: {
        icon: <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4 opacity-60" alt="" />,
        label: 'WhatsApp Business',
        title: (
            <>
                Detecto, clasifico y <span style={{color: 'var(--color-text-subtle)'}}>doy seguimiento.</span>
            </>
        ),
        description: 'El bot pide lo necesario (nombre, interes, urgencia), etiqueta la oportunidad y te avisa para que entres cuando quieras. Derivacion humana sin perder contexto.'
    },
    auto: {
        icon: <Database className="w-4 h-4" style={{color: 'var(--color-text-subtle)'}} />,
        label: 'Automatizacion',
        title: (
            <>
                Formularios al CRM, <span style={{color: 'var(--color-text-subtle)'}}>sin copiar y pegar.</span>
            </>
        ),
        description: 'Todo lo que el bot recoge va directo a tu Software/CRM. Flujos con tu web y agenda, confirmaciones y recordatorios automaticos.'
    },
    integraciones: {
        icon: <Layers className="w-4 h-4" style={{color: 'var(--color-text-subtle)'}} />,
        label: 'Integraciones',
        title: (
            <>
                Conecto con <span style={{color: 'var(--color-text-subtle)'}}>lo que ya usas.</span>
            </>
        ),
        description: 'Tu web actual, WhatsApp Business, Instagram, Google Calendar, Outlook, HubSpot, Zoho, ERP. Si no tienes CRM, empezamos con hoja compartida.'
    }
});

/**
 * BentoGrid: Grid con tabs para mostrar diferentes servicios.
 *
 * Componente visual tipo "bento box" con:
 * - Barra de integraciones en la parte superior
 * - Contenido dinamico basado en tab activo
 * - Sidebar con CTA
 *
 * Extraido de HomeIsland para mejorar mantenibilidad.
 */
export function BentoGrid({activeTab, onTabChange}: BentoGridProps): JSX.Element {
    const tabContent = getTabContent();
    const currentContent = tabContent[activeTab] || tabContent.whatsapp;

    return (
        <section id="bento-grid" className="mx-auto w-full max-w-7xl">
            <div id="bento-grid-container" className="grid grid-cols-4 lg:grid-cols-8 border rounded-md overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                {/* Integrations Bar */}
                <div id="bento-integrations-bar" className="col-span-4 lg:col-span-8 border-b" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                    <div id="bento-integrations-grid" className="grid grid-cols-2 md:grid-cols-4" style={{borderColor: 'var(--color-border-subtle)'}}>
                        {integrations.map((logo, idx) => (
                            <div key={idx} id={`bento-integration-${logo.toLowerCase()}`} className="h-24 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all cursor-default">
                                <span className="font-semibold tracking-tight text-lg font-mono" style={{color: 'var(--color-text-primary)'}}>
                                    {logo}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Content */}
                <div id="bento-bottom-content" className="col-span-4 lg:col-span-8" style={{backgroundColor: 'var(--color-bg-surface)'}}>
                    <div id="bento-bottom-grid" className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]">
                        {/* Dynamic Content */}
                        <div id="bento-dynamic-content" className="col-span-1 lg:col-span-9 p-8 md:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                            <div id="bento-content-wrapper" className="h-full flex flex-col justify-center gap-4">
                                <div id="bento-icon-label" className="flex items-center gap-2">
                                    {currentContent.icon}
                                    <span className="text-xs font-mono uppercase" style={{color: 'var(--color-text-subtle)'}}>
                                        {currentContent.label}
                                    </span>
                                </div>
                                <h3 id="bento-content-title" className="text-2xl md:text-3xl font-medium tracking-tighter" style={{color: 'var(--color-text-primary)'}}>
                                    {currentContent.title}
                                </h3>
                                <p id="bento-content-description" className="leading-relaxed text-[15px] max-w-2xl" style={{color: 'var(--color-text-muted)'}}>
                                    {currentContent.description}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div id="bento-tabs-container" className="flex items-center gap-4 mt-8 pt-8 border-t" style={{borderColor: 'var(--color-border-subtle)'}}>
                                <span id="bento-tabs-label" className="text-sm font-medium" style={{color: 'var(--color-text-muted)'}}>
                                    How Guillermo helps
                                </span>
                                <div id="bento-tabs-wrapper" className="flex p-1 rounded-md border" style={{backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-primary)'}}>
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            id={`bento-tab-${tab.id}`}
                                            onClick={() => onTabChange(tab.id)}
                                            className="px-4 py-1.5 rounded text-[13px] font-medium transition-all"
                                            style={{
                                                backgroundColor: activeTab === tab.id ? 'var(--color-bg-surface)' : 'transparent',
                                                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                border: activeTab === tab.id ? '1px solid var(--color-border-primary)' : 'none',
                                                boxShadow: activeTab === tab.id ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
                                            }}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar CTA */}
                        <div id="bento-sidebar-cta" className="col-span-1 lg:col-span-3 p-8 flex flex-col justify-center" style={{backgroundColor: 'var(--color-bg-primary)'}}>
                            <h4 id="bento-cta-title" className="font-semibold mb-3 text-sm" style={{color: 'var(--color-text-primary)'}}>
                                Empezamos en minutos
                            </h4>
                            <p id="bento-cta-description" className="text-[13px] mb-8 leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                                Hablamos 15-20 min, te enseno un prototipo en 72h y decidimos juntos. Primer mes gratis.
                            </p>
                            <Button href={siteUrls.calendly} variant="primary" className="w-full">
                                Hablame ahora
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
