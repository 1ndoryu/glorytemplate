import {useState, useEffect, useRef} from 'react';
import {Check} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {Badge} from '../ui';
import {SplitSection} from './SplitSection';

const ANALYTICS_EVENTS = [
    {time: '10:41:22', name: 'page_view', path: '/planes', type: 'info'},
    {time: '10:42:05', name: 'click_whatsapp', badge: 'CONVERSION', type: 'success'},
    {time: '10:45:12', name: 'schedule_calendly', status: 'active', type: 'bold'},
    {time: '10:48:30', name: 'scroll_depth', path: '50%', type: 'info'},
    {time: '10:49:15', name: 'view_item', path: '/servicios', type: 'info'},
    {time: '10:50:00', name: 'lead_form_submit', badge: 'LEAD', type: 'success'},
    {time: '10:51:22', name: 'user_engagement', path: '> 30s', type: 'info'},
    {time: '10:52:10', name: 'click_instagram', badge: 'SOCIAL', type: 'success'}
];

interface MetricItem {
    icon: any;
    text: string;
}

interface AnalyticsSectionProps {
    title: string;
    description: string;
    metrics: MetricItem[];
    footerText: string;
    backgroundImage?: string;
}

export function AnalyticsSection({title, description, metrics, footerText, backgroundImage}: AnalyticsSectionProps) {
    const [events, setEvents] = useState(ANALYTICS_EVENTS.slice(0, 4));
    const nextEventIndex = useRef(4);

    // Simular feed de eventos en vivo
    useEffect(() => {
        const interval = setInterval(() => {
            setEvents(prev => {
                // Obtener el siguiente evento usando el indice guardado
                const index = nextEventIndex.current;
                const nextEvent = ANALYTICS_EVENTS[index];

                // Actualizar timestamp
                const now = new Date();
                const timeString = now.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', second: '2-digit'});

                // Avanzar el indice para la proxima vez (circular)
                nextEventIndex.current = (index + 1) % ANALYTICS_EVENTS.length;

                return [...prev.slice(1), {...nextEvent, time: timeString}];
            });
        }, 2500); // Nuevo evento cada 2.5s

        return () => clearInterval(interval);
    }, []);
    // Visual Content (Dashboard)
    const visualContent = (
        <div className="w-full max-w-sm rounded-lg border shadow-lg bg-[var(--color-bg-surface)] overflow-hidden text-left border-primary">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-[var(--color-bg-secondary)] border-primary">
                <span className="text-[10px] uppercase font-bold text-subtle flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    Live Events
                </span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs h-[200px] overflow-hidden relative">
                <AnimatePresence mode="popLayout">
                    {events.map(evt => (
                        <motion.div
                            key={`${evt.name}-${evt.time}`}
                            layout
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: 20}} // Salida hacia la derecha o fade out
                            transition={{duration: 0.4}}
                            className={`flex items-center gap-3 ${evt.type === 'info' ? 'opacity-70' : ''}`}>
                            <span className="text-subtle w-16 flex-none">{evt.time}</span>
                            <span className={`${evt.type === 'success' ? 'font-bold text-[var(--color-success)]' : evt.type === 'bold' ? 'font-bold text-[var(--color-info)]' : 'text-[var(--color-info)]'}`}>{evt.name}</span>

                            {evt.path && <span className="ml-auto text-subtle truncate max-w-[80px]">{evt.path}</span>}
                            {evt.badge && <Badge className="ml-auto px-1.5 py-0 text-[9px] h-auto">{evt.badge}</Badge>}
                            {evt.status === 'active' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></div>}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-t text-[10px] text-subtle flex justify-between border-primary">
                <span>GA4 Connected</span>
                <span className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[var(--color-success)]"></div> Data Stream Active
                </span>
            </div>
        </div>
    );

    // Text Content
    const textContent = (
        <>
            <Badge className="w-fit mb-4 text-[var(--color-info)] border-[var(--color-info)]/20 bg-[var(--color-info)]/10">DATA PRIVACY</Badge>
            <h2 className="text-3xl font-medium tracking-tight mb-6 text-primary">{title}</h2>
            <p className="text-base mb-8 leading-relaxed text-muted">{description}</p>

            <div className="space-y-6">
                {metrics.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                        <div className="mt-1 p-1.5 rounded-md border flex-none aspect-square bg-[var(--color-bg-tertiary)] border-[var(--color-border-subtle)]">
                            <item.icon className="w-4 h-4 text-[var(--color-accent-primary)]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2 text-primary">{item.text}</h3>
                            {/* Simulation of technical name */}
                            <p className="text-xs font-mono mt-0.5 opacity-70 text-muted">event: {item.text.includes('WhatsApp') ? 'click_whatsapp' : item.text.includes('Cita') ? 'schedule_calendly' : 'lead_form_submit'}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 pt-6 border-t flex items-start gap-3 border-[var(--color-bg-tertiary)]">
                <Check className="w-4 h-4 text-[var(--color-success)] mt-0.5" />
                <p className="text-sm text-muted">{footerText}</p>
            </div>
        </>
    );

    return <SplitSection id="analytics" visual={visualContent} content={textContent} visualPosition="right" backgroundImage={backgroundImage} />;
}
