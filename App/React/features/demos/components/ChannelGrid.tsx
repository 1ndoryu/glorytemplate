import {MessageSquare, Smartphone, Globe, Mic} from 'lucide-react';
import {Badge} from '../../../components/ui/Badge';

export function ChannelGrid() {
    const channels = [
        {
            title: 'WhatsApp',
            icon: MessageSquare,
            badge: 'Más popular',
            desc: 'Ideal para servicios recurrentes y soporte directo.'
        },
        {title: 'Instagram DM', icon: Smartphone, desc: 'Perfecto para marcas visuales y e-commerce.'},
        {title: 'Web Widget', icon: Globe, desc: 'Captura leads mientras navegan por tu página.'},
        {title: 'Voicebot', icon: Mic, desc: 'Atención telefónica automática para citas.'}
    ];

    return (
        <section id="channel-grid" className="mx-auto w-full max-w-7xl">
            <div className="mb-8">
                <h2 className="text-2xl font-heading font-medium tracking-tight text-primary">Elige tu canal</h2>
                <p className="text-muted text-sm mt-2">La misma inteligencia, disponible donde estén tus clientes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {channels.map((channel, i) => (
                    <div key={i} className="group p-6 bg-surface border border-primary rounded-lg hover:shadow-sm transition-all hover:border-stone-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center text-secondary group-hover:bg-stone-200 transition-colors">
                                <channel.icon className="w-4 h-4" />
                            </div>
                            {channel.badge && <Badge className="bg-green-50 text-green-700 border-green-100">{channel.badge}</Badge>}
                        </div>
                        <h3 className="text-sm font-heading font-bold text-primary mb-2">{channel.title}</h3>
                        <p className="text-xs text-muted leading-relaxed">{channel.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
