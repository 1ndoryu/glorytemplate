import {Check} from 'lucide-react';

// --- TIPOS ---
interface ComparisonSectionProps {
    title?: string;
    description?: string;
    highlight?: string;
    includedItems: string[];
    includedTitle?: string;
}

// --- COMPONENTE ---
// Seccion de comparacion 1:1 vs SaaS con lista de beneficios
// Reutilizable para cualquier comparacion de servicios
export function ComparisonSection({title = 'Por que no contratar una herramienta SaaS?', description = 'Las herramientas de "hazlo tu mismo" (SaaS) te cobran una mensualidad pero te dejan solo con la configuracion. Si algo falla, eres tu quien debe arreglarlo.', highlight = 'Conmigo contratas una solucion llave en mano. Yo diseno, conecto y mantengo. Tu solo atiendes a los clientes que llegan.', includedItems, includedTitle = 'Incluido en el servicio'}: ComparisonSectionProps): JSX.Element {
    return (
        <section id="comparison-section" className="mx-auto w-full max-w-4xl rounded-xl p-8 md:p-12 border" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)'}}>
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-4" style={{color: 'var(--color-text-primary)'}}>
                        {title}
                    </h2>
                    <p className="text-sm leading-relaxed mb-4" style={{color: 'var(--color-text-muted)'}}>
                        {description}
                    </p>
                    <p className="text-sm leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                        <strong>{highlight}</strong>
                    </p>
                </div>
                <div className="flex-none w-full md:w-auto">
                    <div className="p-6 rounded-lg shadow-sm border w-full md:w-72" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                        <h4 className="text-xs font-mono uppercase mb-4 tracking-wide" style={{color: 'var(--color-text-subtle)'}}>
                            {includedTitle}
                        </h4>
                        <ul className="space-y-3">
                            {includedItems.map((item, i) => (
                                <li key={i} className="flex gap-3 text-sm" style={{color: 'var(--color-text-secondary)'}}>
                                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
