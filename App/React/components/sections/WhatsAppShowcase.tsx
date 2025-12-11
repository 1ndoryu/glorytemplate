import {Check} from 'lucide-react';
import {motion} from 'framer-motion';
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
}

// --- COMPONENTE ---
// Seccion visual de WhatsApp Business con mockup de chat y lista de beneficios
// Usado para mostrar capacidades del servicio de manera visual
export function WhatsAppShowcase({badge = 'CANAL PRINCIPAL', title = 'WhatsApp Business API', features, ctaText = 'Solicitar demo WhatsApp', ctaHref = siteUrls.calendly}: WhatsAppShowcaseProps): JSX.Element {
    // Contenido Visual
    const visualContent = (
        <div className="w-full max-w-md rounded-lg border shadow-lg p-4 space-y-4 bg-surface border-primary">
            {/* Mensaje Bot */}
            <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2, duration: 0.4}} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs bg-[var(--color-accent-primary)]">AI</div>
                <div className="p-3 rounded-lg rounded-tl-none text-xs max-w-[80%] bg-tertiary text-secondary">Hola - En que puedo ayudarte hoy?</div>
            </motion.div>

            {/* Mensaje Usuario */}
            <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 1.5, duration: 0.4}} className="flex gap-3 flex-row-reverse">
                <div className="p-3 rounded-lg rounded-tr-none text-xs text-white max-w-[80%] bg-[var(--color-accent-primary)]">Quiero reservar una mesa para el viernes.</div>
            </motion.div>

            {/* Accion Sistema */}
            <motion.div initial={{opacity: 0, scale: 0.95}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 2.5, duration: 0.3}} className="flex justify-center py-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-[var(--color-success)]/10 border-[var(--color-success)]/20">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--color-success)]"></div>
                    <span className="text-[10px] font-mono text-[var(--color-success)]">INTENCION DETECTADA: RESERVA</span>
                </div>
            </motion.div>

            {/* Respuesta Bot */}
            <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 3.5, duration: 0.4}} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs bg-[var(--color-accent-primary)]">AI</div>
                <div className="p-3 rounded-lg rounded-tl-none text-xs max-w-[80%] bg-tertiary text-secondary">Perfecto. Tengo hueco a las 20:30 o 21:00. Cual prefieres?</div>
            </motion.div>
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

    return <SplitSection id="whatsapp-section" visual={visualContent} content={textContent} visualPosition="left" />;
}
