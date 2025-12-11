import {Check} from 'lucide-react';
import {Badge, Button} from '../ui';
import {siteUrls} from '../../config';

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
    return (
        <section id="whatsapp-section" className="mx-auto w-full max-w-7xl">
            <div className="border rounded-xl overflow-hidden shadow-sm" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Visual Mockup (Izquierda) */}
                    <div id="whatsapp-visual" className="p-8 md:p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r relative overflow-hidden" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-primary)'}}>
                        {/* Abstract Grid Background */}
                        <div className="absolute inset-0 opacity-[0.4]" style={{backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`, backgroundSize: '40px 40px'}}></div>

                        <div className="relative w-full max-w-md rounded-lg border shadow-lg p-4 space-y-4 z-10" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                            {/* Mensaje Bot */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{backgroundColor: 'var(--color-accent-primary)'}}>
                                    AI
                                </div>
                                <div className="p-3 rounded-lg rounded-tl-none text-xs max-w-[80%]" style={{backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)'}}>
                                    Hola - En que puedo ayudarte hoy?
                                </div>
                            </div>
                            {/* Mensaje Usuario */}
                            <div className="flex gap-3 flex-row-reverse">
                                <div className="p-3 rounded-lg rounded-tr-none text-xs text-white max-w-[80%]" style={{backgroundColor: 'var(--color-accent-primary)'}}>
                                    Quiero reservar una mesa para el viernes.
                                </div>
                            </div>
                            {/* Accion Sistema */}
                            <div className="flex justify-center py-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-100 bg-[#f0fdf4]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-mono text-green-700">INTENCION DETECTADA: RESERVA</span>
                                </div>
                            </div>
                            {/* Respuesta Bot */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{backgroundColor: 'var(--color-accent-primary)'}}>
                                    AI
                                </div>
                                <div className="p-3 rounded-lg rounded-tl-none text-xs max-w-[80%]" style={{backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)'}}>
                                    Perfecto. Tengo hueco a las 20:30 o 21:00. Cual prefieres?
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Texto (Derecha) */}
                    <div id="whatsapp-content" className="p-8 md:p-12 flex flex-col justify-center">
                        <Badge className="w-fit mb-4 text-[#25D366] border-green-100 bg-green-50">{badge}</Badge>
                        <h2 className="text-3xl font-semibold tracking-tight mb-6" style={{color: 'var(--color-text-primary)'}}>
                            {title}
                        </h2>
                        <div className="space-y-8">
                            {features.map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-none mt-1">
                                        <Check className="w-5 h-5" style={{color: 'var(--color-text-primary)'}} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold" style={{color: 'var(--color-text-primary)'}}>
                                            {item.title}
                                        </h3>
                                        <p className="text-sm mt-1" style={{color: 'var(--color-text-muted)'}}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-6 border-t" style={{borderColor: 'var(--color-bg-tertiary)'}}>
                            <Button href={ctaHref} variant="outline" className="w-full sm:w-auto">
                                {ctaText}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
