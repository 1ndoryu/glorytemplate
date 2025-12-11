import {useState} from 'react';
import {Play} from 'lucide-react';

import {PageLayout} from '../components/layout';
import {Button} from '../components/ui/Button';
import {FaqItem} from '../components/ui/FaqItem';
import {siteUrls} from '../config';

import {DemoShowcase} from '../features/demos/components/DemoShowcase';
import {ChannelGrid} from '../features/demos/components/ChannelGrid';
import {StepProcess} from '../features/demos/components/StepProcess';
import {SCENARIOS} from '../features/demos/data/scenarios';

export function DemosIsland(): JSX.Element {
    const [activeScenarioId, setActiveScenarioId] = useState<string>('restaurant');

    const currentScenario = SCENARIOS[activeScenarioId];

    return (
        <PageLayout headerCtaText="Agendar 1:1" mainClassName="flex-1 flex flex-col gap-16 md:gap-24 px-6 py-12 md:py-20">
            {/* 1. HERO SECTION */}
            <section className="mx-auto w-full max-w-7xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f0efeb] px-3 py-1 text-[11px] font-medium text-[#57534e] mb-6 border border-[#e5e5e0]">
                    <Play className="w-3 h-3 text-[#2563EB]" />
                    Prueba la tecnología en tiempo real
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-[#292524] text-balance mb-6 max-w-4xl mx-auto">
                    No imagines cómo funciona. <br />
                    <span className="text-[#a8a29e]">Pruébalo con tu caso de uso.</span>
                </h1>
                <p className="text-lg text-[#79716b] leading-relaxed max-w-2xl mx-auto font-light mb-8">Selecciona tu sector abajo y mira cómo un bot bien diseñado gestiona una conversación real de principio a fin.</p>
            </section>

            {/* 2. INTERACTIVE DEMO SHOWCASE (Split View) */}
            <DemoShowcase activeScenarioId={activeScenarioId} onSelect={setActiveScenarioId} currentScenario={currentScenario} />

            {/* 3. CANALES DISPONIBLES */}
            <ChannelGrid />

            {/* 4. PROCESO DE CREACIÓN DE DEMO */}
            <StepProcess />

            {/* 5. FAQS & CTA */}
            <section className="mx-auto w-full max-w-2xl pb-12">
                <h2 className="text-xl font-medium tracking-tight mb-6 text-[#292524]">Preguntas Frecuentes</h2>
                <div className="space-y-1 mb-12">
                    <FaqItem question="¿La demo tiene algún coste?" answer="No. La demo estándar es gratuita. Si necesitas una prueba de concepto muy compleja con integraciones avanzadas, lo valoramos en la primera llamada." />
                    <FaqItem question="¿Puedo probar el bot de voz?" answer="Sí, puedo configurar un número temporal para que llames y experimentes la interacción por voz." />
                    <FaqItem question="¿Qué necesito para empezar?" answer="Solo agendar una llamada de 15 minutos para que yo entienda qué quieres que haga el bot." />
                </div>

                <div className="bg-[#1c1917] rounded-xl p-8 text-center border border-[#292524] text-[#f8f8f6]">
                    <h3 className="text-xl font-semibold text-white mb-2">¿Quieres ver tu negocio automatizado?</h3>
                    <p className="text-[#d6d3d1] text-sm mb-6 max-w-md mx-auto">Déjame prepararte una demo personalizada. Sin compromiso de compra.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Button href={siteUrls.calendly} variant="white" className="border-0">
                            Solicitar Demo
                        </Button>
                        <Button href="https://wa.me/34XXXXXXXXX" className="bg-transparent border border-[#44403c] text-[#d6d3d1] hover:bg-[#292524] hover:text-white">
                            Hablar por WhatsApp
                        </Button>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
