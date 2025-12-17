/**
 * PrivacyIsland - Politica de Privacidad
 *
 * Estructura segun project-extends.md:
 * - H1: "Politica de privacidad"
 * - Responsable del sitio
 * - Para que uso tus datos + Base legal
 * - A quien encargo datos
 * - Cuanto tiempo los conservo
 * - Tus derechos
 * - Cookies (enlace)
 * - Ultima revision
 */

import {Shield, User, Database, Clock, Scale, Cookie, Mail, Calendar} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {InternalLinks} from '../components/sections';

// --- TIPOS ---
interface LegalSection {
    icon: React.ElementType;
    title: string;
    content: React.ReactNode;
}

// --- DATOS ---
const legalSections: LegalSection[] = [
    {
        icon: User,
        title: 'Responsable del sitio',
        content: (
            <>
                <p className="mb-4">
                    <strong>Nombre:</strong> Guillermo Garcia
                    <br />
                    <strong>Email de contacto:</strong> contacto@[dominio].com
                    <br />
                    <strong>Actividad:</strong> Consultoria de chatbots y automatizacion para empresas
                </p>
                <p className="text-sm text-muted">Este sitio web es propiedad de Guillermo Garcia. Al usar este sitio, aceptas esta política de privacidad.</p>
            </>
        )
    },
    {
        icon: Database,
        title: 'Para qué uso tus datos',
        content: (
            <>
                <p className="mb-4">Recopilo tus datos personales para:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted">
                    <li>
                        <strong>Responder a tus consultas:</strong> cuando me escribes por formulario, WhatsApp o email.
                    </li>
                    <li>
                        <strong>Gestionar citas:</strong> cuando reservas una llamada a través de Calendly.
                    </li>
                    <li>
                        <strong>Enviarte información relevante:</strong> solo si lo has solicitado expresamente.
                    </li>
                    <li>
                        <strong>Mejorar el servicio:</strong> mediante analisis anonimos del uso del sitio.
                    </li>
                </ul>
                <p className="text-sm">
                    <strong>Base legal:</strong> Tu consentimiento explícito (checkbox en formularios) y el interés legítimo para atender tu solicitud.
                </p>
            </>
        )
    },
    {
        icon: Shield,
        title: 'A quién encargo datos',
        content: (
            <>
                <p className="mb-4">Utilizo los siguientes servicios de terceros que pueden procesar tus datos:</p>
                <ul className="list-disc list-inside space-y-2 text-muted">
                    <li>
                        <strong>Calendly:</strong> Para gestionar reservas de llamadas (servidores en EEUU, Privacy Shield).
                    </li>
                    <li>
                        <strong>Google Analytics:</strong> Para estadísticas anónimas del sitio (solo si aceptas cookies).
                    </li>
                    <li>
                        <strong>WhatsApp/Meta:</strong> Si me contactas por WhatsApp (política de Meta).
                    </li>
                    <li>
                        <strong>Hosting:</strong> Local by Flywheel / WP Engine (servidores en EEUU/UE).
                    </li>
                </ul>
                <p className="mt-4 text-sm">No vendo ni comparto tus datos con terceros para fines comerciales.</p>
            </>
        )
    },
    {
        icon: Clock,
        title: 'Cuánto tiempo los conservo',
        content: (
            <>
                <p className="mb-4">Conservo tus datos durante el tiempo necesario para:</p>
                <ul className="list-disc list-inside space-y-2 text-muted">
                    <li>
                        <strong>Consultas por formulario/email:</strong> Hasta 12 meses tras la última comunicación.
                    </li>
                    <li>
                        <strong>Clientes activos:</strong> Durante la relación comercial y 5 años adicionales por obligaciones legales.
                    </li>
                    <li>
                        <strong>Cookies analíticas:</strong> Según la política de cada proveedor (normalmente 26 meses).
                    </li>
                </ul>
                <p className="mt-4 text-sm">Puedes solicitar la eliminación de tus datos en cualquier momento.</p>
            </>
        )
    },
    {
        icon: Scale,
        title: 'Tus derechos',
        content: (
            <>
                <p className="mb-4">Tienes derecho a:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted">
                    <li>
                        <strong>Acceso:</strong> Saber qué datos tengo sobre ti.
                    </li>
                    <li>
                        <strong>Rectificación:</strong> Corregir datos incorrectos.
                    </li>
                    <li>
                        <strong>Supresión:</strong> Eliminar tus datos (derecho al olvido).
                    </li>
                    <li>
                        <strong>Oposición:</strong> Oponerte a ciertos tratamientos.
                    </li>
                    <li>
                        <strong>Portabilidad:</strong> Recibir tus datos en formato electrónico.
                    </li>
                    <li>
                        <strong>Limitación:</strong> Restringir el tratamiento en ciertos casos.
                    </li>
                </ul>
                <p className="text-sm">
                    Para ejercer estos derechos, escribeme a{' '}
                    <a href="mailto:contacto@dominio.com" className="text-[var(--color-accent-primary)] hover:underline">
                        contacto@[dominio].com
                    </a>
                    . Si no estás satisfecho, puedes reclamar ante la{' '}
                    <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-primary)] hover:underline">
                        AEPD
                    </a>
                    .
                </p>
            </>
        )
    },
    {
        icon: Cookie,
        title: 'Cookies',
        content: (
            <>
                <p className="mb-4">Este sitio utiliza cookies para funcionar correctamente y analizar el tráfico (si lo aceptas).</p>
                <p>
                    Para más información, consulta nuestra{' '}
                    <a href="/cookies" className="text-[var(--color-accent-primary)] hover:underline font-medium">
                        Política de Cookies
                    </a>
                    .
                </p>
            </>
        )
    }
];

// Enlaces internos para paginas legales
const legalInternalLinks = [
    {text: 'Volver a contacto', href: '/contacto'},
    {text: 'Ver politica de cookies', href: '/cookies'},
    {text: 'Volver al inicio', href: '/'}
];

// --- COMPONENTE PRINCIPAL ---
export function PrivacyIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Contactar" mainClassName="flex-1 flex flex-col justify-start gap-12 px-6 py-12 md:py-20">
            {/* HEADER */}
            <header id="privacy-header" className="mx-auto w-full max-w-4xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-primary mb-4">Política de privacidad</h1>
                <p className="text-lg text-muted max-w-2xl">En esta página te explico cómo trato tus datos personales, para qué los uso y cuáles son tus derechos. Sin jerga legal innecesaria.</p>
                <div className="flex items-center gap-2 mt-6 text-sm text-muted">
                    <Calendar className="w-4 h-4" />
                    <span>Última actualización: Diciembre 2025</span>
                </div>
            </header>

            {/* SECCIONES LEGALES */}
            <div id="privacy-content" className="mx-auto w-full max-w-4xl space-y-8">
                {legalSections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <section key={index} id={`privacy-section-${index}`} className="p-6 md:p-8 rounded-xl border border-primary bg-surface">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-primary mb-4">{section.title}</h2>
                                    <div className="text-secondary leading-relaxed">{section.content}</div>
                                </div>
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* CONTACTO PARA DUDAS */}
            <section id="privacy-contact" className="mx-auto w-full max-w-4xl">
                <div className="p-6 rounded-xl bg-secondary border border-primary text-center">
                    <Mail className="w-8 h-8 mx-auto mb-4 text-[var(--color-accent-primary)]" />
                    <h2 className="text-lg font-semibold text-primary mb-2">¿Dudas sobre privacidad?</h2>
                    <p className="text-muted mb-4">Si tienes cualquier pregunta sobre cómo trato tus datos, escríbeme sin compromiso.</p>
                    <a href="/contacto" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent-primary)] text-white font-medium hover:opacity-90 transition-opacity">
                        Contactar
                    </a>
                </div>
            </section>

            {/* INTERNAL LINKS */}
            <InternalLinks title="Enlaces relacionados" links={legalInternalLinks} />
        </PageLayout>
    );
}
