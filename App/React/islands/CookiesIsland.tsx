/**
 * CookiesIsland - Politica de Cookies
 *
 * Estructura segun project-extends.md:
 * - H1: "Politica de cookies"
 * - Que son
 * - Que cookies uso (necesarias, analiticas)
 * - Configurar o revocar
 * - Proveedores y transferencias
 * - Ultima revision
 */

import {Cookie, Info, BarChart3, Settings, Globe, Calendar, Shield} from 'lucide-react';
import {PageLayout} from '../components/layout';
import {InternalLinks} from '../components/sections';
import {Button} from '../components/ui';

// --- TIPOS ---
interface CookieInfo {
    name: string;
    provider: string;
    purpose: string;
    duration: string;
    type: 'necessary' | 'analytics';
}

interface CookieSection {
    icon: React.ElementType;
    title: string;
    content: React.ReactNode;
}

// --- DATOS DE COOKIES ---
const cookies: CookieInfo[] = [
    {
        name: 'cookie_consent',
        provider: 'Este sitio',
        purpose: 'Recuerda tu preferencia de cookies',
        duration: '12 meses',
        type: 'necessary'
    },
    {
        name: 'PHPSESSID',
        provider: 'WordPress',
        purpose: 'Sesion del servidor para funcionamiento basico',
        duration: 'Sesion',
        type: 'necessary'
    },
    {
        name: '_ga',
        provider: 'Google Analytics',
        purpose: 'Distingue usuarios unicos para estadisticas',
        duration: '26 meses',
        type: 'analytics'
    },
    {
        name: '_gid',
        provider: 'Google Analytics',
        purpose: 'Distingue usuarios unicos (24h)',
        duration: '24 horas',
        type: 'analytics'
    },
    {
        name: '_gat',
        provider: 'Google Analytics',
        purpose: 'Limita la tasa de peticiones',
        duration: '1 minuto',
        type: 'analytics'
    }
];

const cookieSections: CookieSection[] = [
    {
        icon: Info,
        title: '¿Qué son las cookies?',
        content: (
            <>
                <p className="mb-4">Las cookies son pequeños archivos de texto que los sitios web guardan en tu navegador. Sirven para recordar preferencias, mantener sesiones activas y analizar cómo se usa el sitio.</p>
                <p className="text-sm text-muted">No son virus ni programas ejecutables. Son simplemente datos que el sitio puede leer cuando vuelves a visitarlo.</p>
            </>
        )
    },
    {
        icon: Settings,
        title: '¿Cómo configurar o revocar cookies?',
        content: (
            <>
                <p className="mb-4">Puedes gestionar las cookies de varias formas:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted">
                    <li>
                        <strong>Banner de cookies:</strong> Cuando visitas el sitio por primera vez, puedes aceptar o rechazar las cookies analiticas.
                    </li>
                    <li>
                        <strong>Configuracion del navegador:</strong> Puedes bloquear o eliminar cookies desde la configuracion de tu navegador.
                    </li>
                    <li>
                        <strong>Revocar consentimiento:</strong> Si quieres cambiar tu decisión, elimina las cookies del navegador y recarga la página.
                    </li>
                </ul>
                <p className="text-sm">
                    <strong>Nota:</strong> Si desactivas las cookies necesarias, algunas funciones del sitio podrian no funcionar correctamente.
                </p>
            </>
        )
    },
    {
        icon: Globe,
        title: 'Proveedores y transferencias',
        content: (
            <>
                <p className="mb-4">Las cookies analíticas son proporcionadas por Google Analytics (Google LLC, EEUU).</p>
                <p className="mb-4">Google está adherido al Marco de Privacidad UE-EEUU (EU-US Data Privacy Framework), lo que proporciona garantías adecuadas para la transferencia de datos.</p>
                <p className="text-sm text-muted">
                    Más información:{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-primary)] hover:underline">
                        Política de privacidad de Google
                    </a>
                </p>
            </>
        )
    }
];

// Enlaces internos para paginas legales
const legalInternalLinks = [
    {text: 'Volver a contacto', href: '/contacto'},
    {text: 'Ver politica de privacidad', href: '/privacidad'},
    {text: 'Volver al inicio', href: '/'}
];

// --- COMPONENTE TABLA DE COOKIES ---
function CookieTable({cookies, type}: {cookies: CookieInfo[]; type: 'necessary' | 'analytics'}): JSX.Element {
    const filteredCookies = cookies.filter(c => c.type === type);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-primary">
                        <th className="text-left py-3 px-2 font-semibold text-primary">Cookie</th>
                        <th className="text-left py-3 px-2 font-semibold text-primary">Proveedor</th>
                        <th className="text-left py-3 px-2 font-semibold text-primary">Propósito</th>
                        <th className="text-left py-3 px-2 font-semibold text-primary">Duración</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCookies.map((cookie, index) => (
                        <tr key={index} className="border-b border-primary/50">
                            <td className="py-3 px-2 font-mono text-xs text-[var(--color-accent-primary)]">{cookie.name}</td>
                            <td className="py-3 px-2 text-muted">{cookie.provider}</td>
                            <td className="py-3 px-2 text-muted">{cookie.purpose}</td>
                            <td className="py-3 px-2 text-muted">{cookie.duration}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export function CookiesIsland(): JSX.Element {
    return (
        <PageLayout headerCtaText="Contactar" mainClassName="flex-1 flex flex-col justify-start gap-12 px-6 py-12 md:py-20">
            {/* HEADER */}
            <header id="cookies-header" className="mx-auto w-full max-w-4xl">
                <div className="flex items-center gap-3 mb-4">
                    <Cookie className="w-10 h-10 text-[var(--color-accent-primary)]" />
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-primary">Política de cookies</h1>
                </div>
                <p className="text-lg text-muted max-w-2xl">Te explico qué cookies usa este sitio, para qué sirven y cómo puedes gestionarlas. Sin complicaciones.</p>
                <div className="flex items-center gap-2 mt-6 text-sm text-muted">
                    <Calendar className="w-4 h-4" />
                    <span>Última actualización: Diciembre 2025</span>
                </div>
            </header>

            {/* SECCION: Que son las cookies */}
            <div id="cookies-intro" className="mx-auto w-full max-w-4xl space-y-8">
                {cookieSections.slice(0, 1).map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <section key={index} className="p-6 md:p-8 rounded-xl border border-primary bg-surface">
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

            {/* SECCION: Cookies que uso */}
            <section id="cookies-list" className="mx-auto w-full max-w-4xl">
                <h2 className="text-2xl font-semibold text-primary mb-6">¿Qué cookies uso?</h2>

                {/* Cookies necesarias */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-5 h-5 text-[var(--color-accent-primary)]" />
                        <h3 className="text-lg font-semibold text-primary">Cookies necesarias</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Siempre activas</span>
                    </div>
                    <p className="text-muted mb-4">Estas cookies son esenciales para que el sitio funcione. No se pueden desactivar.</p>
                    <div className="rounded-xl border border-primary bg-surface p-4">
                        <CookieTable cookies={cookies} type="necessary" />
                    </div>
                </div>

                {/* Cookies analiticas */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="w-5 h-5 text-[var(--color-accent-primary)]" />
                        <h3 className="text-lg font-semibold text-primary">Cookies analiticas</h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Solo si aceptas</span>
                    </div>
                    <p className="text-muted mb-4">Estas cookies me ayudan a entender cómo usas el sitio para mejorarlo. Solo se activan si das tu consentimiento.</p>
                    <div className="rounded-xl border border-primary bg-surface p-4">
                        <CookieTable cookies={cookies} type="analytics" />
                    </div>
                </div>
            </section>

            {/* SECCIONES ADICIONALES */}
            <div id="cookies-settings" className="mx-auto w-full max-w-4xl space-y-8">
                {cookieSections.slice(1).map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <section key={index} className="p-6 md:p-8 rounded-xl border border-primary bg-surface">
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

            {/* BOTON PARA GESTIONAR COOKIES */}
            <section id="cookies-manage" className="mx-auto w-full max-w-4xl">
                <div className="p-6 rounded-xl bg-secondary border border-primary text-center">
                    <Cookie className="w-8 h-8 mx-auto mb-4 text-[var(--color-accent-primary)]" />
                    <h2 className="text-lg font-semibold text-primary mb-2">¿Quieres cambiar tus preferencias?</h2>
                    <p className="text-muted mb-4">Puedes modificar tu configuración de cookies en cualquier momento.</p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Implementar apertura del banner de cookies
                            alert('Aquí se abriría el panel de configuración de cookies');
                        }}>
                        Gestionar cookies
                    </Button>
                </div>
            </section>

            {/* INTERNAL LINKS */}
            <InternalLinks title="Enlaces relacionados" links={legalInternalLinks} />
        </PageLayout>
    );
}
