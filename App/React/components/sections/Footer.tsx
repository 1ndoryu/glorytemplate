// Componente Footer
// Pie de pagina con columnas de enlaces y creditos

interface FooterColumn {
    title: string;
    links: {
        label: string;
        href: string;
    }[];
}

interface FooterProps {
    columns: FooterColumn[];
    copyrightText: string;
}

// Logo SVG como componente interno
function FooterLogo() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
            <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function Footer({columns, copyrightText}: FooterProps) {
    return (
        <footer
            className="w-full border-t"
            style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-primary)'
            }}>
            <div className="mx-auto w-full max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[13px]">
                    {columns.map((column, index) => (
                        <div key={index} className="flex flex-col gap-3">
                            <h3 className="font-semibold uppercase tracking-wide text-xs" style={{color: 'var(--color-text-primary)'}}>
                                {column.title}
                            </h3>
                            {column.links.map((link, linkIndex) => (
                                <a key={linkIndex} href={link.href} className="hover:opacity-80" style={{color: 'var(--color-text-muted)'}}>
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
                <div
                    className="pt-8 mt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs"
                    style={{
                        borderColor: 'var(--color-border-subtle)',
                        color: 'var(--color-text-subtle)'
                    }}>
                    <a href="/" className="font-bold text-lg tracking-tighter flex items-center gap-2 opacity-80" style={{color: 'var(--color-text-primary)'}}>
                        <FooterLogo />
                    </a>
                    <p>{copyrightText}</p>
                </div>
            </div>
        </footer>
    );
}
