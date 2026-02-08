/**
 * Planes: Agentes de IA + Chatbots
 * Agrupados por afinidad (servicios de inteligencia artificial).
 */
import {type PlanesDeServicio, incluida, noIncluida} from './tipos';

export const PLANES_IA: PlanesDeServicio = {
    servicioSlug: 'agentes-ia',
    servicioTitulo: 'Agentes de IA',
    planes: [
        {
            id: 'ia-basico',
            nombre: 'Basico',
            precio: '$60',
            periodo: '/mes',
            descripcion: 'Agente simple para tareas de automatizacion basica.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('1 agente configurado'),
                incluida('Hasta 1,000 interacciones/mes'),
                incluida('Integracion con 1 plataforma'),
                incluida('Respuestas predefinidas'),
                noIncluida('Aprendizaje continuo'),
                noIncluida('Analisis de datos'),
                noIncluida('API personalizada'),
            ]
        },
        {
            id: 'ia-avanzado',
            nombre: 'Avanzado',
            precio: '$300',
            periodo: '/mes',
            descripcion: 'Agente inteligente con IA generativa y analisis.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Hasta 3 agentes'),
                incluida('Interacciones ilimitadas'),
                incluida('Multi-plataforma'),
                incluida('IA generativa (GPT/Gemini)'),
                incluida('Aprendizaje continuo'),
                incluida('Dashboard de analisis'),
                incluida('API personalizada'),
            ]
        },
        {
            id: 'ia-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Solucion de IA a la medida de tu negocio.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Agentes ilimitados'),
                incluida('Modelo fine-tuned'),
                incluida('Integracion total'),
                incluida('Datos propietarios'),
                incluida('SLA garantizado'),
                incluida('Soporte dedicado 24/7'),
                incluida('Consultoria IA estrategica'),
            ]
        }
    ]
};

export const PLANES_CHATBOTS: PlanesDeServicio = {
    servicioSlug: 'chatbots',
    servicioTitulo: 'Chatbots Personalizados',
    planes: [
        {
            id: 'chatbot-basico',
            nombre: 'Basico',
            precio: '$60',
            periodo: '/mes',
            descripcion: 'Chatbot basico para atencion al cliente.',
            ctaTexto: 'Comenzar',
            ctaLink: '/contacto/',
            caracteristicas: [
                incluida('1 chatbot configurado'),
                incluida('Hasta 500 conversaciones/mes'),
                incluida('Respuestas FAQ automaticas'),
                incluida('Widget web integrable'),
                noIncluida('IA conversacional'),
                noIncluida('Integracion CRM'),
                noIncluida('Analisis de conversaciones'),
            ]
        },
        {
            id: 'chatbot-avanzado',
            nombre: 'Avanzado',
            precio: '$300',
            periodo: '/mes',
            descripcion: 'Chatbot inteligente con IA y CRM.',
            ctaTexto: 'Elegir plan',
            ctaLink: '/contacto/',
            destacado: true,
            caracteristicas: [
                incluida('Chatbot con IA generativa'),
                incluida('Conversaciones ilimitadas'),
                incluida('Multi-canal (web, WhatsApp)'),
                incluida('Integracion CRM'),
                incluida('Analisis de conversaciones'),
                incluida('Entrenamiento personalizado'),
                incluida('Escalado a agente humano'),
            ]
        },
        {
            id: 'chatbot-personalizado',
            nombre: 'Personalizado',
            precio: 'A medida',
            descripcion: 'Solucion conversacional enterprise.',
            ctaTexto: 'Hablar con nosotros',
            ctaLink: '/contacto/',
            esPersonalizado: true,
            caracteristicas: [
                incluida('Multi-bot coordinado'),
                incluida('IA fine-tuned'),
                incluida('Omni-canal completo'),
                incluida('Integraciones enterprise'),
                incluida('Analytics avanzados'),
                incluida('SLA garantizado'),
                incluida('Soporte dedicado'),
            ]
        }
    ]
};
