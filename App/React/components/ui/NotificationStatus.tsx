import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {CheckCircle} from 'lucide-react';

/**
 * NotificationStatus: Animacion de estado de notificacion para mockups.
 *
 * Muestra una secuencia animada:
 * 1. Estado idle (vacio)
 * 2. Processing: "Bot: Buscando horarios..."
 * 3. Confirmed: "Cita Agendada: Manana 16:00"
 *
 * La animacion se activa cuando el componente entra en viewport.
 */
export function NotificationStatus(): JSX.Element {
    const [step, setStep] = useState<'idle' | 'processing' | 'confirmed'>('idle');

    return (
        <motion.div
            onViewportEnter={() => {
                if (step === 'idle') {
                    setTimeout(() => setStep('processing'), 1500);
                    setTimeout(() => setStep('confirmed'), 4500);
                }
            }}
            viewport={{once: true}}>
            <AnimatePresence mode="wait">
                {step === 'processing' && (
                    <motion.div key="processing" initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -5}} className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-2" style={{backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)'}}>
                            <span>Bot: Buscando horarios...</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                        </div>
                    </motion.div>
                )}

                {step === 'confirmed' && (
                    <motion.div key="confirmed" initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-2" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-success)', color: 'var(--color-success)'}}>
                            <CheckCircle className="w-3 h-3" />
                            <span>Cita Agendada: Manana 16:00</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
