import {Button, FaqItem} from '../ui';
import {siteUrls} from '../../config';

// --- TIPOS ---
interface FaqItemData {
    question: string;
    answer: string;
}

interface FaqWithCtaProps {
    title?: string;
    items: FaqItemData[];
    ctaTitle?: string;
    ctaDescription?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
}

// --- COMPONENTE ---
// Seccion de FAQs con Call To Action final
// Reutilizable en cualquier pagina que necesite FAQs con acciones
export function FaqWithCta({title = 'Preguntas Frecuentes', items, ctaTitle = 'Hablamos?', ctaDescription = 'Elige como prefieres empezar. Respuesta en menos de 30 minutos (09-21h).', primaryCtaText = 'Agenda en 30s', primaryCtaHref = siteUrls.calendly, secondaryCtaText = 'Escribeme por WhatsApp', secondaryCtaHref = siteUrls.whatsapp}: FaqWithCtaProps): JSX.Element {
    return (
        <section id="faq-section" className="w-full py-12 md:py-16">
            <div className="mx-auto w-full max-w-[800px] px-4 md:px-0">
                <h2 className="text-xl font-medium tracking-tight mb-6 text-primary">{title}</h2>
                <div id="faq-list" className="space-y-1 mb-12">
                    {items.map((item, i) => (
                        <FaqItem key={i} question={item.question} answer={item.answer} />
                    ))}
                </div>

                <div id="cta-card" className="rounded-lg p-8 text-center border bg-[var(--color-bg-secondary)] border-primary">
                    <h3 className="text-xl font-semibold mb-2 text-primary">{ctaTitle}</h3>
                    <p className="text-sm mb-6 max-w-md mx-auto text-muted">{ctaDescription}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button href={primaryCtaHref} className="border-0">
                            {primaryCtaText}
                        </Button>
                        <Button href={secondaryCtaHref} variant="ghost">
                            {secondaryCtaText}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
