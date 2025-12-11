import {Globe, MessageSquare, Instagram, Calendar, Database, Mail, FileSpreadsheet} from 'lucide-react';

interface IntegrationsSectionProps {
    title: string;
    items: string[];
}

// Custom Icon for Make/n8n (Node Automation)
function AutomationIcon(props: React.ComponentProps<'svg'>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <path d="M10 6h4" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <path d="M18 10v4" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
        </svg>
    );
}

// Helper to map text to icons
const getIconForIntegration = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('whatsapp')) return MessageSquare;
    if (lower.includes('instagram')) return Instagram;
    if (lower.includes('agenda') || lower.includes('calendar')) return Calendar;
    if (lower.includes('crm') || lower.includes('erp') || lower.includes('hubspot') || lower.includes('zoho')) return Database;
    if (lower.includes('email') || lower.includes('avisos')) return Mail;
    if (lower.includes('hoja') || lower.includes('sheet')) return FileSpreadsheet;
    if (lower.includes('make') || lower.includes('n8n') || lower.includes('automatiz')) return AutomationIcon;
    return Globe; // Default
};

export function IntegrationsSection({title, items}: IntegrationsSectionProps) {
    return (
        <section id="integraciones" className="mx-auto w-full max-w-7xl">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-8 md:mb-12 text-center md:text-left text-primary">{title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map((item, idx) => {
                    const Icon = getIconForIntegration(item);
                    return (
                        <div key={idx} className="group p-6 rounded-xl border transition-all duration-300 hover:shadow-md h-full flex flex-col items-start gap-4 border-[var(--color-border-subtle)] bg-surface">
                            <div className="p-3 rounded-lg w-fit transition-colors group-hover:bg-[var(--color-selection-bg)]/50 bg-[var(--color-bg-tertiary)]">
                                <Icon className="w-6 h-6 text-[var(--color-accent-primary)]" />
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-secondary">{item}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
