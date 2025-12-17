import React from 'react';
import type {ReactNode} from 'react';
import {Calendar, Linkedin, Mail, Cpu, MessageSquare, Zap, Database} from 'lucide-react';
import type {SiteUrls, SocialProfiles, SiteIdentity} from '../../../hooks/useSiteConfig';

export interface ActionItem {
    text: string;
    href: string;
    icon: React.ElementType;
    variant: 'primary' | 'outline' | 'ghost';
}

export interface AboutContent {
    hero: {
        image: string;
        location: string;
        badges: string[];
        title: ReactNode;
        description: string;
        actions: ActionItem[];
    };
    philosophy: {
        left: {
            title: string;
            paragraphs: ReactNode[];
        };
        right: {
            title: string;
            paragraphs: ReactNode[];
        };
    };
    caseStudy: {
        badge: string;
        title: string;
        description: string;
        benefits: string[];
        stat: {
            value: string;
            label: string;
            percentage: number;
            quote: string;
        };
    };
    stack: {
        title: string;
        tools: {
            name: string;
            icon: React.ElementType;
            role: string;
        }[];
        note: string;
    };
    process: {
        title: string;
        description: string;
        cta: {text: string; href: string};
        steps: {step: string; title: string; desc: string}[];
    };
    finalCta: {
        image: string;
        title: string;
        cta: string;
    };
}

/**
 * Parametros para crear contenido de About con URLs dinamicas.
 */
export interface CreateAboutContentParams {
    urls: SiteUrls;
    social: SocialProfiles;
    identity: SiteIdentity;
}

/**
 * Funcion para crear contenido de About con URLs dinamicas.
 * Las URLs se obtienen del hook useSiteConfig() en el componente que consume este contenido.
 */
export const createAboutContent = ({urls, social, identity}: CreateAboutContentParams): AboutContent => ({
    hero: {
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
        location: 'Madrid, ES (Remoto)',
        badges: ['CONSULTOR 1:1', '28 AÑOS'],
        title: (
            <>
                Hola, soy Guillermo. <br />
                <span className="text-subtle">Automatizo lo aburrido.</span>
            </>
        ),
        description: 'Vengo del mundo audiovisual, pero ChatGPT cambió mi carrera. Hoy ayudo a pymes a recuperar su tiempo implementando chatbots y automatizaciones que funcionan de verdad.',
        actions: [{text: 'Agendar café virtual', href: urls.calendly, icon: Calendar, variant: 'primary'}, ...(social.linkedin ? [{text: 'LinkedIn', href: social.linkedin, icon: Linkedin, variant: 'outline' as const}] : []), ...(identity.email ? [{text: 'Email', href: `mailto:${identity.email}`, icon: Mail, variant: 'ghost' as const}] : [])]
    },
    philosophy: {
        left: {
            title: 'El objetivo es claro',
            paragraphs: [
                <>
                    Me gusta trabajar <strong>1:1 y sin intermediarios</strong>. Me cuentas tu caso, lo traduzco a flujos simples y me ocupo de que funcione a diario.
                </>,
                'Mi meta no es venderte software, es que tú trabajes menos y tu negocio rinda más: mejor atención, menos interrupciones y reservas sin fricción.'
            ]
        },
        right: {
            title: 'Cómo llegué aquí',
            paragraphs: ['La primera vez que probé una IA generativa pensé: "esto cambia las reglas del juego". Me obsesioné con entender cómo conectar esa inteligencia a procesos reales de negocio.', 'Desde entonces, he pasado de editar vídeo a editar flujos de conversación que facturan mientras mis clientes duermen.']
        }
    },
    caseStudy: {
        badge: 'CASO REAL',
        title: 'MVP Barber',
        description: 'En MVP Barber tenían un problema clásico: no podían contestar WhatsApps mientras cortaban el pelo. Lo hacían en sus ratos libres o fuera de horario, perdiendo citas por no responder a tiempo.',
        benefits: ['Chatbot para dudas y precios', 'Gestión de citas automática', 'Resultado: Cortan en paz, el bot agenda'],
        stat: {
            value: '+35%',
            label: 'EN RESERVAS',
            percentage: 35,
            quote: '"Antes perdíamos clientes por no contestar. Ahora el bot cierra citas a las 3 de la mañana."'
        }
    },
    stack: {
        title: 'Mi caja de herramientas',
        tools: [
            {name: 'UChat', icon: MessageSquare, role: 'Chatbot Core'},
            {name: 'Make', icon: Zap, role: 'Automatización'},
            {name: 'n8n', icon: Cpu, role: 'Workflows'},
            {name: 'Google Sheets', icon: Database, role: 'Base de datos'},
            {name: 'Calendly', icon: Calendar, role: 'Agenda'}
        ],
        note: '* Si no tienes CRM, no te preocupes. Empezamos con una hoja de cálculo compartida y listo. Lo importante es empezar.'
    },
    process: {
        title: 'Proceso Simple',
        description: 'Sin burocracia. De la idea a la producción en días.',
        cta: {text: 'Empezar ahora', href: urls.calendly},
        steps: [
            {step: '01', title: 'Llamada', desc: 'Definimos objetivos y 2-3 casos de uso.'},
            {step: '02', title: 'Prototipo', desc: 'Te enseño un flujo real con tus reglas.'},
            {step: '03', title: 'Lanzamiento', desc: 'Conecto web, agenda y CRM.'},
            {step: '04', title: 'Mantenimiento', desc: 'Reviso chats y mejoro cada mes.'}
        ]
    },
    finalCta: {
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1600',
        title: '¿Hablamos de tu proyecto?',
        cta: 'Reserva una llamada de 15 min'
    }
});

/**
 * @deprecated Usar createAboutContent(urls) en su lugar para obtener URLs dinamicas.
 * Este export se mantiene para compatibilidad temporal.
 */
export const ABOUT_CONTENT: AboutContent = {
    hero: {
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
        location: 'Madrid, ES (Remoto)',
        badges: ['CONSULTOR 1:1', '28 AÑOS'],
        title: (
            <>
                Hola, soy Guillermo. <br />
                <span className="text-subtle">Automatizo lo aburrido.</span>
            </>
        ),
        description: 'Vengo del mundo audiovisual, pero ChatGPT cambió mi carrera. Hoy ayudo a pymes a recuperar su tiempo implementando chatbots y automatizaciones que funcionan de verdad.',
        actions: [
            {text: 'Agendar café virtual', href: 'https://calendly.com/andoryyu', icon: Calendar, variant: 'primary'},
            {text: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin, variant: 'outline'},
            {text: 'Email', href: 'mailto:guillermo.autoia@gmail.com', icon: Mail, variant: 'ghost'}
        ]
    },
    philosophy: {
        left: {
            title: 'El objetivo es claro',
            paragraphs: [
                <>
                    Me gusta trabajar <strong>1:1 y sin intermediarios</strong>. Me cuentas tu caso, lo traduzco a flujos simples y me ocupo de que funcione a diario.
                </>,
                'Mi meta no es venderte software, es que tú trabajes menos y tu negocio rinda más: mejor atención, menos interrupciones y reservas sin fricción.'
            ]
        },
        right: {
            title: 'Cómo llegué aquí',
            paragraphs: ['La primera vez que probé una IA generativa pensé: "esto cambia las reglas del juego". Me obsesioné con entender cómo conectar esa inteligencia a procesos reales de negocio.', 'Desde entonces, he pasado de editar vídeo a editar flujos de conversación que facturan mientras mis clientes duermen.']
        }
    },
    caseStudy: {
        badge: 'CASO REAL',
        title: 'MVP Barber',
        description: 'En MVP Barber tenían un problema clásico: no podían contestar WhatsApps mientras cortaban el pelo. Lo hacían en sus ratos libres o fuera de horario, perdiendo citas por no responder a tiempo.',
        benefits: ['Chatbot para dudas y precios', 'Gestión de citas automática', 'Resultado: Cortan en paz, el bot agenda'],
        stat: {
            value: '+35%',
            label: 'EN RESERVAS',
            percentage: 35,
            quote: '"Antes perdíamos clientes por no contestar. Ahora el bot cierra citas a las 3 de la mañana."'
        }
    },
    stack: {
        title: 'Mi caja de herramientas',
        tools: [
            {name: 'UChat', icon: MessageSquare, role: 'Chatbot Core'},
            {name: 'Make', icon: Zap, role: 'Automatización'},
            {name: 'n8n', icon: Cpu, role: 'Workflows'},
            {name: 'Google Sheets', icon: Database, role: 'Base de datos'},
            {name: 'Calendly', icon: Calendar, role: 'Agenda'}
        ],
        note: '* Si no tienes CRM, no te preocupes. Empezamos con una hoja de cálculo compartida y listo. Lo importante es empezar.'
    },
    process: {
        title: 'Proceso Simple',
        description: 'Sin burocracia. De la idea a la producción en días.',
        cta: {text: 'Empezar ahora', href: 'https://calendly.com/andoryyu'},
        steps: [
            {step: '01', title: 'Llamada', desc: 'Definimos objetivos y 2-3 casos de uso.'},
            {step: '02', title: 'Prototipo', desc: 'Te enseño un flujo real con tus reglas.'},
            {step: '03', title: 'Lanzamiento', desc: 'Conecto web, agenda y CRM.'},
            {step: '04', title: 'Mantenimiento', desc: 'Reviso chats y mejoro cada mes.'}
        ]
    },
    finalCta: {
        image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1600',
        title: '¿Hablamos de tu proyecto?',
        cta: 'Reserva una llamada de 15 min'
    }
};
