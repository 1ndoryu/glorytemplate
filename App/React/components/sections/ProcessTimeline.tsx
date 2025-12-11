// --- TIPOS ---
interface ProcessStep {
    title: string;
    desc: string;
}

interface ProcessTimelineProps {
    title?: string;
    steps: ProcessStep[];
}

// --- COMPONENTE ---
// Timeline visual del proceso de trabajo
// Muestra pasos numerados con linea conectora
export function ProcessTimeline({title = 'Como trabajo contigo', steps}: ProcessTimelineProps): JSX.Element {
    return (
        <section id="process-section" className="mx-auto w-full max-w-4xl py-12">
            <h2 className="text-2xl font-medium tracking-tight text-center mb-12 text-primary">{title}</h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border-primary)] before:to-transparent">
                {steps.map((step, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xs font-bold border-primary bg-surface text-secondary">{i + 1}</div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-lg border shadow-sm transition-colors hover:border-[var(--color-border-secondary)] bg-surface border-primary">
                            <div className="font-bold mb-1 text-sm text-primary">{step.title}</div>
                            <div className="text-sm text-muted">{step.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
