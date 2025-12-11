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
        <section className="mx-auto w-full max-w-7xl">
            <div className="mb-8">
                <h2 className="text-2xl font-medium tracking-tight text-[#292524]">Elige tu canal</h2>
                <p className="text-[#79716b] text-sm mt-2">La misma inteligencia, disponible donde estén tus clientes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {channels.map((channel, i) => (
                    <div key={i} className="group p-6 bg-white border border-[#e5e5e0] rounded-lg hover:shadow-sm transition-all hover:border-[#d6d3d1]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-8 h-8 bg-[#f0efeb] rounded-md flex items-center justify-center text-[#57534e] group-hover:bg-[#e7e5e4] transition-colors">
                                <channel.icon className="w-4 h-4" />
                            </div>
                            {channel.badge && <Badge className="bg-green-50 text-green-700 border-green-100">{channel.badge}</Badge>}
                        </div>
                        <h3 className="text-sm font-bold text-[#292524] mb-2">{channel.title}</h3>
                        <p className="text-xs text-[#79716b] leading-relaxed">{channel.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
