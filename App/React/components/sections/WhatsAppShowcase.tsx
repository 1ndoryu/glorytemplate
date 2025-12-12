import {useState, useEffect} from 'react';
import {Check} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge, Button} from '../ui';
import {siteUrls} from '../../config';
import {SplitSection} from './SplitSection';

// --- TIPOS ---
interface WhatsAppFeature {
    title: string;
    desc: string;
}

interface WhatsAppShowcaseProps {
    badge?: string;
    title?: string;
    features: WhatsAppFeature[];
    ctaText?: string;
    ctaHref?: string;
    backgroundImage?: string;
}

// Datos de las conversaciones demo
const DEMO_CONVERSATIONS = [
    {
        id: 'restaurante',
        messages: [
            {type: 'bot', text: 'Hola 👋 ¿En qué puedo ayudarte hoy?'},
            {type: 'user', text: 'Quiero reservar mesa para el viernes.'},
            {type: 'system', text: 'INTENCIÓN: RESERVA'},
            {type: 'bot', text: 'Perfecto. Tengo hueco a las 21:00. ¿Te encaja?'}
        ]
    },
    {
        id: 'clinica',
        messages: [
            {type: 'bot', text: 'Bienvenido a Clínica Dental 🦷'},
            {type: 'user', text: 'Necesito una limpieza, por favor.'},
            {type: 'system', text: 'INTENCIÓN: CITA'},
            {type: 'bot', text: 'Claro ¿Es tu primera visita con nosotros?'}
        ]
    },
    {
        id: 'ecommerce',
        messages: [
            {type: 'bot', text: 'Hola, soy el asistente de envíos 📦'},
            {type: 'user', text: '¿Dónde está mi pedido #1234?'},
            {type: 'system', text: 'API: CONSULTA ESTADO'},
            {type: 'bot', text: 'Está en reparto 🚚 Llega hoy antes de las 19h.'}
        ]
    },
    {
        id: 'coaching',
        messages: [
            {type: 'bot', text: 'Hola, aquí Guillermo. ¿Dudas sobre el programa?'},
            {type: 'user', text: 'Sí, ¿qué precio tiene el servicio?'},
            {type: 'system', text: 'INTENCIÓN: INFO_PRECIO'},
            {type: 'bot', text: 'Depende de tus necesidades. ¿Agendamos 15 min y lo vemos?'}
        ]
    }
] as const;

// --- COMPONENTE ---
// Seccion visual de WhatsApp Business con mockup de chat y lista de beneficios
// Usado para mostrar capacidades del servicio de manera visual
export function WhatsAppShowcase({badge = 'CANAL PRINCIPAL', title = 'WhatsApp Business API', features, ctaText = 'Solicitar demo WhatsApp', ctaHref = siteUrls.calendly, backgroundImage}: WhatsAppShowcaseProps): JSX.Element {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Rotacion de conversaciones
    // Rotacion de conversaciones
    useEffect(() => {
        // Duracion del ciclo: Animacion (~6s) + Pausa (~3s) = 9s
        const cycleDuration = 9000;

        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % DEMO_CONVERSATIONS.length);
        }, cycleDuration);

        return () => clearInterval(timer);
    }, []);

    const currentScenario = DEMO_CONVERSATIONS[currentIndex];

    // Contenido Visual
    const visualContent = (
        <div className="w-full max-w-md h-[270px] rounded-lg border shadow-lg p-6 bg-surface border-primary overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.div key={currentScenario.id} className="space-y-4 absolute inset-0 p-4 w-full" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} transition={{duration: 0.3}}>
                    {currentScenario.messages.map((msg, idx) => {
                        // Calcular delays secuenciales mas lentos
                        // 0 -> 0.5s (Bot saludo)
                        // 1 -> 2.5s (User reply)
                        // 2 -> 4.5s (System check)
                        // 3 -> 6.0s (Bot respuesta)
                        let delay = 0.5;
                        if (idx === 1) delay = 2.5;
                        if (idx === 2) delay = 4.0;
                        if (idx === 3) delay = 5;

                        if (msg.type === 'system') {
                            return (
                                <motion.div key={idx} initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} transition={{delay, duration: 0.3}} className="flex justify-center py-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-[var(--color-success)]/10 border-[var(--color-success)]/20">
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--color-success)]"></div>
                                        <span className="text-[10px] font-mono text-[var(--color-success)]">{msg.text}</span>
                                    </div>
                                </motion.div>
                            );
                        }

                        const isUser = msg.type === 'user';

                        return (
                            <motion.div key={idx} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay, duration: 0.4}} className={`flex gap-3 items-center ${isUser ? 'flex-row-reverse' : ''}`}>
                                {!isUser && <div className="w-8 h-8 rounded-full flex-none flex items-center justify-center text-white text-xs bg-[var(--color-accent-primary)]">AI</div>}

                                <div className={`p-3 rounded-lg text-xs max-w-[80%] ${isUser ? 'bg-[var(--color-accent-primary)] text-white rounded-tr-none' : 'bg-tertiary text-secondary rounded-tl-none'}`}>{msg.text}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );

    // Contenido de Texto
    const textContent = (
        <>
            <Badge className="w-fit mb-4 text-[#25D366] border-[var(--color-accent-green)]/30 bg-[var(--color-accent-green)]/10">{badge}</Badge>
            <h2 className="text-3xl font-medium tracking-tight mb-6 text-primary">{title}</h2>
            <div className="space-y-8">
                {features.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                        <div className="flex-none mt-1">
                            <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-primary">{item.title}</h3>
                            <p className="text-sm mt-1 text-muted">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-10 pt-6 border-t border-[var(--color-border-subtle)]">
                <Button href={ctaHref} variant="outline" className="w-full sm:w-auto">
                    {ctaText}
                </Button>
            </div>
        </>
    );

    return <SplitSection id="whatsapp-section" visual={visualContent} content={textContent} visualPosition="right" backgroundImage={backgroundImage} />;
}
