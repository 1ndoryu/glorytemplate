// Componente QuoteSection
// Seccion de cita o testimonio centrado

interface QuoteSectionProps {
    children: React.ReactNode;
}

export function QuoteSection({children}: QuoteSectionProps) {
    return (
        <section className="mx-auto w-full max-w-4xl py-24 text-center">
            <p className="text-2xl md:text-3xl font-normal tracking-tight leading-relaxed text-balance text-muted">{children}</p>
        </section>
    );
}
