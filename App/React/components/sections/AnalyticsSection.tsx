import {Check, BarChart3} from 'lucide-react';
import {motion} from 'framer-motion';
import {Badge} from '../ui';
import {SplitSection} from './SplitSection';

interface MetricItem {
    icon: any;
    text: string;
}

interface AnalyticsSectionProps {
    title: string;
    description: string;
    metrics: MetricItem[];
    footerText: string;
}

export function AnalyticsSection({title, description, metrics, footerText}: AnalyticsSectionProps) {
    // Visual Content (Dashboard)
    const visualContent = (
        <div className="w-full max-w-sm rounded-lg border shadow-lg bg-white overflow-hidden text-left" style={{borderColor: 'var(--color-border-primary)'}}>
            <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50" style={{borderColor: 'var(--color-border-primary)'}}>
                <span className="text-[10px] uppercase font-bold text-gray-400">Live Events</span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs">
                <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay: 0.2, duration: 0.3}} className="flex items-center gap-3 opacity-50">
                    <span className="text-gray-400">10:41:22</span>
                    <span className="text-blue-600">page_view</span>
                    <span className="ml-auto text-gray-400">/planes</span>
                </motion.div>

                <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay: 0.8, duration: 0.3}} className="flex items-center gap-3">
                    <span className="text-gray-500">10:42:05</span>
                    <span className="font-bold text-green-600">click_whatsapp</span>
                    <Badge className="ml-auto px-1.5 py-0 text-[9px] h-auto">CONVERSION</Badge>
                </motion.div>

                <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay: 1.4, duration: 0.3}} className="flex items-center gap-3">
                    <span className="text-gray-500">10:45:12</span>
                    <span className="text-purple-600 font-bold">schedule_calendly</span>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                </motion.div>

                <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay: 2.0, duration: 0.3}} className="flex items-center gap-3 opacity-50">
                    <span className="text-gray-400">10:48:30</span>
                    <span className="text-blue-600">scroll_depth</span>
                    <span className="ml-auto text-gray-400">50%</span>
                </motion.div>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t text-[10px] text-gray-400 flex justify-between" style={{borderColor: 'var(--color-border-primary)'}}>
                <span>GA4 Connected</span>
                <span className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-green-500"></div> Data Stream Active
                </span>
            </div>
        </div>
    );

    // Text Content
    const textContent = (
        <>
            <Badge className="w-fit mb-4 text-[#2563eb] border-blue-100 bg-blue-50">DATA PRIVACY</Badge>
            <h2 className="text-3xl font-medium tracking-tight mb-6" style={{color: 'var(--color-text-primary)'}}>
                {title}
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                {description}
            </p>

            <div className="space-y-6">
                {metrics.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                        <div className="mt-1 p-1.5 rounded-md border flex-none" style={{backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-subtle)'}}>
                            <item.icon className="w-4 h-4" style={{color: 'var(--color-accent-primary)'}} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold flex items-center gap-2" style={{color: 'var(--color-text-primary)'}}>
                                {item.text}
                            </h3>
                            {/* Simulation of technical name */}
                            <p className="text-xs font-mono mt-0.5 opacity-70" style={{color: 'var(--color-text-muted)'}}>
                                event: {item.text.includes('WhatsApp') ? 'click_whatsapp' : item.text.includes('Cita') ? 'schedule_calendly' : 'lead_form_submit'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 pt-6 border-t flex items-start gap-3" style={{borderColor: 'var(--color-bg-tertiary)'}}>
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>
                    {footerText}
                </p>
            </div>
        </>
    );

    return <SplitSection id="analytics" visual={visualContent} content={textContent} visualPosition="right" />;
}
