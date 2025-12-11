import {Cpu, CheckCircle2} from 'lucide-react';
import {Badge} from '../../../components/ui/Badge';
import {ABOUT_CONTENT} from '../data/content';

export function CaseStudy() {
    const {caseStudy} = ABOUT_CONTENT;
    return (
        <section className="mx-auto w-full max-w-5xl">
            <div className="bg-[#1c1917] rounded-xl p-8 md:p-12 text-[#f8f8f6] overflow-hidden relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Cpu className="w-32 h-32 text-white" />
                </div>

                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Badge className="bg-white/10 text-white border-white/20 mb-4">{caseStudy.badge}</Badge>
                        <h3 className="text-2xl md:text-3xl font-semibold mb-4">{caseStudy.title}</h3>
                        <p className="text-[#d6d3d1] text-sm leading-relaxed mb-6 font-light">{caseStudy.description}</p>
                        <div className="space-y-3">
                            {caseStudy.benefits.map((benefit, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                    <span className="text-[#e7e5e4]">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visual Statistic */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-4xl font-bold text-white">{caseStudy.stat.value}</span>
                            <span className="text-xs text-[#a8a29e] mb-1 font-mono">{caseStudy.stat.label}</span>
                        </div>
                        <div className="w-full bg-white/10 h-1 rounded-full mb-4">
                            <div className="bg-green-500 h-1 rounded-full" style={{width: `${caseStudy.stat.percentage}%`}}></div>
                        </div>
                        <p className="text-xs text-[#a8a29e] italic">{caseStudy.stat.quote}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
