import {ArrowRight} from 'lucide-react';
import {Button} from '../../../components/ui/Button';
import {ABOUT_CONTENT} from '../data/content';

export function SimpleProcess() {
    const {process} = ABOUT_CONTENT;
    return (
        <section className="mx-auto w-full max-w-5xl border-t border-[#e5e5e0] pt-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="md:w-1/3">
                    <h2 className="text-2xl font-semibold text-[#292524] mb-2">{process.title}</h2>
                    <p className="text-[#79716b] text-sm">{process.description}</p>
                    <div className="mt-6">
                        <Button href={process.cta.href} icon={ArrowRight}>
                            {process.cta.text}
                        </Button>
                    </div>
                </div>

                <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {process.steps.map((item: {step: string; title: string; desc: string}, i: number) => (
                        <div key={i} className="flex gap-4">
                            <div className="text-2xl font-bold text-[#e5e5e0] font-mono">{item.step}</div>
                            <div>
                                <h4 className="text-sm font-bold text-[#292524]">{item.title}</h4>
                                <p className="text-xs text-[#79716b] mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
