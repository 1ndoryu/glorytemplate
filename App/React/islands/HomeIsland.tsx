/**
 * HomeIsland - Landing Page Glory SaaS
 *
 * Esta pagina usa PageLayout de Glory que incluye:
 * - Navigation
 * - Footer
 * - Page Builder integrado
 *
 * HomeIsland solo define:
 * - Configuracion especifica (links, bloques default)
 * - Props que vienen de PHP
 *
 * NOTA: Esta es la forma recomendada de crear paginas.
 * El layout (nav, footer, pagebuilder) viene de Glory.
 * Solo defines lo especifico del proyecto en App.
 */

import {PageLayout, BlockData} from '@/pageBuilder';

interface HomeIslandProps {
    siteName?: string;
    stripeUrl?: string;
    pageId?: number;
    blocks?: BlockData[];
    isAdmin?: boolean;
    saveEndpoint?: string;
    restNonce?: string;
}

/*
 * Bloques por defecto de la landing (especifico del proyecto)
 */
const defaultBlocks: BlockData[] = [
    {
        id: 'hero-1',
        type: 'hero',
        props: {
            badge: 'v2.0 Disponible Ahora',
            title: 'Importa productos de Amazon.\nSin complicaciones.',
            subtitle: 'Olvidate de las API Keys de Amazon, los proxies y los bloqueos. Glory maneja la infraestructura compleja para que tu solo tengas que vender.',
            ctaText: 'Prueba 30 dias gratis',
            ctaUrl: 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c',
            secondaryCtaText: 'Como funciona',
            secondaryCtaUrl: '#features'
        }
    },
    {
        id: 'features-1',
        type: 'features',
        props: {
            title: 'Ingenieria compleja.',
            subtitle: 'Experiencia simple.',
            items: [
                {
                    icon: 'Zap',
                    title: 'Importacion Instantanea',
                    description: 'Busca por palabra clave o ASIN directamente desde tu panel. Importa titulos, precios, descripciones e imagenes en un clic.'
                },
                {
                    icon: 'ShieldCheck',
                    title: 'Infraestructura Gestionada',
                    description: 'Manejamos los servidores, los proxies rotativos y las licencias. Tu no necesitas configurar nada tecnico.'
                },
                {
                    icon: 'Image',
                    title: 'Imagenes Locales',
                    description: 'Las imagenes se descargan a tu biblioteca de medios automaticamente. Sin hotlinking, sin riesgos.'
                }
            ]
        }
    },
    {
        id: 'pricing-1',
        type: 'pricing',
        props: {
            title: 'Elige tu velocidad.',
            subtitle: 'Comienza gratis con herramientas manuales o automatiza todo con Pro.',
            plans: [
                {
                    name: 'Starter',
                    description: 'Para empezar a vender manualmente.',
                    price: '$0',
                    period: '/mes',
                    ctaText: 'Descargar Plugin',
                    ctaUrl: '#',
                    features: [{text: 'Importacion Manual', subtext: 'Copia y pega HTML de Amazon'}, {text: 'Renderizado de Productos', subtext: 'Diseno limpio y optimizado'}, {text: 'Agregar productos manualmente'}, {text: 'Soporte Tag de Afiliados'}],
                    isRecommended: false
                },
                {
                    name: 'Pro',
                    description: 'Automatizacion completa y soporte.',
                    price: '$20',
                    period: '/mes',
                    ctaText: 'Prueba 30 dias gratis',
                    ctaUrl: 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c',
                    features: [{text: 'Todo lo del plan Gratis', isHighlight: true}, {text: 'Importacion Automatica', subtext: 'Busca por API sin salir de WP'}, {text: '4GB Ancho de Banda', subtext: 'Infraestructura gestionada (~15k prods)'}, {text: 'Descarga automatica de imagenes'}, {text: 'Soporte Prioritario'}],
                    isRecommended: true
                }
            ]
        }
    }
];

export function HomeIsland({siteName = 'Glory', stripeUrl = 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c', blocks: initialBlocks, isAdmin = false, saveEndpoint, restNonce}: HomeIslandProps): JSX.Element {
    return (
        <PageLayout
            /* Configuracion del sitio */
            siteName={siteName}
            /* Links de navegacion */
            navLinks={[
                {text: 'Caracteristicas', href: '#features', hideOnMobile: true},
                {text: 'Precios', href: '#pricing', hideOnMobile: true}
            ]}
            navCtaText="Login"
            navCtaUrl={stripeUrl}
            /* Footer */
            socialLinks={[
                {type: 'twitter', href: '#'},
                {type: 'github', href: '#'},
                {type: 'mail', href: '#'}
            ]}
            /* Page Builder */
            blocks={initialBlocks || defaultBlocks}
            isAdmin={isAdmin}
            saveEndpoint={saveEndpoint}
            restNonce={restNonce}
            editButtonText="Editar Landing"
            toolbarTitle="Editando Landing Page"
        />
    );
}

export default HomeIsland;
