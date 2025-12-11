import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {MessageSquare, Smartphone, Globe, Mic, User, CheckCircle, Phone} from 'lucide-react';
import {Badge, Button} from '../ui';
import {siteUrls} from '../../config';

// --- TIPOS ---
interface ChannelDemo {
    id: string;
    icon: React.ComponentType<{className?: string}>;
    title: string;
    badge: string;
    description: string;
}

interface ChannelShowcaseProps {
    badge?: string;
    title: React.ReactNode;
    description: string;
    channels: ChannelDemo[];
    cta?: {
        text: string;
        href: string;
    };
}

// --- ANIMACIONES POR CANAL ---

/** WhatsApp: Burbujas de chat animadas */
function WhatsAppVisual() {
    return (
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <motion.div className="flex gap-2 items-start" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}}>
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent-green)] flex items-center justify-center text-white text-[9px]">
                    <User className="w-3 h-3" />
                </div>
                <div className="p-2 rounded-lg rounded-tl-none text-[10px] bg-white/10 border border-white/20 text-white">Hola, quiero reservar</div>
            </motion.div>
            <motion.div className="flex gap-2 items-start flex-row-reverse" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: 0.8}}>
                <div className="w-6 h-6 rounded-full bg-[var(--color-info)] flex items-center justify-center text-white text-[9px]">AI</div>
                <div className="p-2 rounded-lg rounded-tr-none text-[10px] bg-[var(--color-accent-green)]/20 border border-[var(--color-accent-green)]/30 text-white">Perfecto! Tengo huecos...</div>
            </motion.div>
            <motion.div className="flex items-center gap-2 mt-2" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 1.4}}>
                <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                <span className="text-[9px] text-[var(--color-success)]">Reserva confirmada</span>
            </motion.div>
        </div>
    );
}

/** Instagram: Corazones y DMs */
function InstagramVisual() {
    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', delay: 0.2}}>
                <Smartphone className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div className="flex gap-1" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.6}}>
                {[1, 2, 3].map(i => (
                    <motion.div key={i} className="text-pink-400 text-sm" animate={{scale: [1, 1.2, 1]}} transition={{delay: 0.8 + i * 0.2, repeat: Infinity, repeatDelay: 2}}>
                        ♥
                    </motion.div>
                ))}
            </motion.div>
            <motion.div className="text-[10px] text-white/70 flex items-center gap-1" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 1.2}}>
                <MessageSquare className="w-3 h-3" />
                DM respondido
            </motion.div>
        </div>
    );
}

/** Web: Widget de chat */
function WebVisual() {
    return (
        <div className="relative w-full max-w-[180px]">
            {/* Browser mockup */}
            <motion.div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}>
                <div className="h-4 bg-white/10 flex items-center gap-1 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                </div>
                <div className="h-20 p-2 flex items-end justify-end">
                    {/* Chat widget */}
                    <motion.div className="w-8 h-8 rounded-full bg-[var(--color-info)] flex items-center justify-center shadow-lg" initial={{scale: 0}} animate={{scale: 1}} transition={{delay: 0.6, type: 'spring'}}>
                        <MessageSquare className="w-4 h-4 text-white" />
                    </motion.div>
                </div>
            </motion.div>
            {/* Popup */}
            <motion.div className="absolute -top-2 -right-2 bg-white/10 border border-white/20 rounded-lg p-2 text-[9px] text-white" initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: 1.0}}>
                Hola! En que puedo ayudarte?
            </motion.div>
        </div>
    );
}

/** Voicebot: Ondas de audio */
function VoicebotVisual() {
    return (
        <div className="flex flex-col items-center gap-4">
            <motion.div className="w-14 h-14 rounded-full bg-[var(--color-warning)] flex items-center justify-center relative" initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', delay: 0.2}}>
                <Phone className="w-6 h-6 text-white" />
                {/* Ripple effect */}
                <motion.div className="absolute inset-0 rounded-full border-2 border-[var(--color-warning)]" animate={{scale: [1, 1.5], opacity: [0.5, 0]}} transition={{duration: 1.5, repeat: Infinity}} />
            </motion.div>
            {/* Audio waves */}
            <div className="flex items-end gap-0.5 h-6">
                {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                    <motion.div key={i} className="w-1 bg-white/60 rounded-full" animate={{height: [`${h * 3}px`, `${h * 6}px`, `${h * 3}px`]}} transition={{duration: 0.6, repeat: Infinity, delay: i * 0.1}} />
                ))}
            </div>
            <motion.span className="text-[10px] text-white/70" initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.8}}>
                Atendiendo llamada...
            </motion.span>
        </div>
    );
}

// Mapa de visuales por canal
const CHANNEL_VISUALS: Record<string, React.ComponentType> = {
    whatsapp: WhatsAppVisual,
    instagram: InstagramVisual,
    web: WebVisual,
    voicebot: VoicebotVisual
};

// --- COMPONENTE PRINCIPAL ---
export function ChannelShowcase({badge = 'CANALES', title, description, channels, cta}: ChannelShowcaseProps): JSX.Element {
    const [activeChannel, setActiveChannel] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Autoplay
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setActiveChannel(prev => (prev + 1) % channels.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [isPaused, channels.length]);

    const currentChannel = channels[activeChannel];
    const VisualComponent = CHANNEL_VISUALS[currentChannel.id] || WhatsAppVisual;

    return (
        <section id="channel-showcase" className="mx-auto w-full max-w-7xl">
            <div className="rounded-xl p-8 md:p-12 text-[var(--color-bg-primary)] relative overflow-hidden bg-neutral-900">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-info)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-accent-green)]/10 rounded-full blur-3xl -ml-12 -mb-12"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                    {/* Contenido */}
                    <div id="channel-content">
                        <Badge className="mb-4 bg-[var(--color-text-primary)] text-[var(--color-text-subtle)] border-neutral-700">{badge}</Badge>
                        <h2 className="text-3xl font-medium tracking-tight mb-6 text-white">{title}</h2>
                        <p className="text-neutral-300 mb-8 leading-relaxed">{description}</p>

                        {/* Tabs de canales */}
                        <div className="grid grid-cols-2 gap-3">
                            {channels.map((channel, idx) => {
                                const Icon = channel.icon;
                                const isActive = idx === activeChannel;

                                return (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            setActiveChannel(idx);
                                            setIsPaused(true);
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isActive ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-80'}`}>
                                        <div className={`p-2 rounded ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-white">{channel.title}</div>
                                            <div className="text-[10px] text-white/50">{channel.badge}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {cta && (
                            <div className="mt-8">
                                <Button href={cta.href} variant="white">
                                    {cta.text}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Visual animado */}
                    <div id="channel-visual" className="relative h-64 md:h-80 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                        <AnimatePresence mode="wait">
                            <motion.div key={currentChannel.id} initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.9}} transition={{duration: 0.3}} className="flex flex-col items-center">
                                <VisualComponent />
                                <motion.p className="text-xs text-white/60 mt-4 text-center max-w-[200px]" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}}>
                                    {currentChannel.description}
                                </motion.p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {channels.map((_, idx) => (
                                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeChannel ? 'bg-white w-4' : 'bg-white/30'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
