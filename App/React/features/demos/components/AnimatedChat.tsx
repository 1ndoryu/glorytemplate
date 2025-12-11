import {useEffect, useRef, useCallback} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import type {Scenario} from '../data/scenarios';

interface AnimatedChatProps {
    scenario: Scenario;
}

/**
 * AnimatedChat - Chat animado estilo WhatsAppShowcase
 * Muestra mensajes apareciendo secuencialmente con scroll interno suave
 */
export function AnimatedChat({scenario}: AnimatedChatProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Delays secuenciales para cada mensaje (en segundos)
    const getDelay = (index: number): number => {
        const delays = [0.5, 2.0, 3.5, 5.0, 6.5, 8.0];
        return delays[index] || index * 1.5;
    };

    // Scroll interno suave solo si es necesario
    const scrollToBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Solo hacer scroll si el contenido excede el contenedor
        const needsScroll = container.scrollHeight > container.clientHeight;
        if (!needsScroll) return;

        // Scroll suave usando animacion manual
        const targetScroll = container.scrollHeight - container.clientHeight;
        const currentScroll = container.scrollTop;
        const distance = targetScroll - currentScroll;

        if (distance <= 0) return;

        // Animacion de scroll gradual
        const duration = 300;
        const startTime = performance.now();

        const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing suave
            const easeOut = 1 - Math.pow(1 - progress, 3);
            container.scrollTop = currentScroll + distance * easeOut;

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }, []);

    // Programar scrolls suaves conforme aparecen mensajes
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Resetear scroll al cambiar de escenario
        container.scrollTop = 0;

        const timeouts: ReturnType<typeof setTimeout>[] = [];

        // Solo programar scroll despues del tercer mensaje (cuando empieza a necesitarse)
        scenario.messages.forEach((_, idx) => {
            if (idx >= 3) {
                const delay = getDelay(idx) * 1000 + 400;
                const timeout = setTimeout(scrollToBottom, delay);
                timeouts.push(timeout);
            }
        });

        return () => {
            timeouts.forEach(t => clearTimeout(t));
        };
    }, [scenario.id, scenario.messages, scrollToBottom]);

    return (
        <div className="w-full max-w-md h-[420px] rounded-lg border shadow-lg bg-surface border-primary overflow-hidden flex flex-col">
            {/* Header del chat */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-secondary bg-tertiary flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[var(--color-accent-primary)]">{scenario.initials}</div>
                <div>
                    <div className="text-sm font-semibold text-primary">{scenario.name}</div>
                    <div className="text-[10px] text-muted">Cuenta de empresa verificada</div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--color-success)]" />
                    <span className="text-[10px] text-muted">En linea</span>
                </div>
            </div>

            {/* Area de mensajes - scrollbar oculta pero funcional */}
            <div
                ref={scrollContainerRef}
                className="flex-1 p-4 overflow-y-auto"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                {/* Ocultar scrollbar en webkit */}
                <style>{`
                    .chat-scroll-area::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                <AnimatePresence mode="wait">
                    <motion.div key={scenario.id} className="space-y-3" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.3}}>
                        {scenario.messages.map((msg, idx) => {
                            const delay = getDelay(idx);
                            const isUser = msg.isUser;
                            const showIntent = !isUser && idx === 2;

                            return (
                                <motion.div key={idx} initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay, duration: 0.35, ease: 'easeOut'}} className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : ''}`}>
                                    {!isUser && <div className="w-6 h-6 rounded-full flex-none flex items-center justify-center text-white text-[10px] font-bold bg-[var(--color-accent-primary)]">AI</div>}

                                    <div className="flex flex-col gap-1 max-w-[75%]">
                                        {showIntent && (
                                            <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{delay: delay - 0.2, duration: 0.2}} className="flex items-center gap-1.5 px-2 py-1 rounded-full border self-start bg-[var(--color-success)]/10 border-[var(--color-success)]/20">
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--color-success)]" />
                                                <span className="text-[9px] font-mono text-[var(--color-success)]">INTENCION DETECTADA</span>
                                            </motion.div>
                                        )}

                                        <div className={`p-3 rounded-xl text-xs leading-relaxed ${isUser ? 'bg-[var(--color-accent-primary)] text-white rounded-br-sm' : 'bg-surface border border-secondary text-primary rounded-bl-sm'}`}>{msg.text}</div>

                                        <span className={`text-[9px] text-subtle ${isUser ? 'text-right' : 'text-left'}`}>10:{String(30 + idx).padStart(2, '0')}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
