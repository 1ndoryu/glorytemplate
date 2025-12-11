import {ArrowRight} from 'lucide-react';
import {siteUrls} from '../../../config';
import {ABOUT_CONTENT} from '../data/content';

export function ActionCta() {
    const {finalCta} = ABOUT_CONTENT;
    return (
        <section className="mx-auto w-full max-w-3xl py-12">
            <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 group cursor-pointer" onClick={() => (window.location.href = siteUrls.calendly)}>
                <img src={finalCta.image} alt="Trabajando en equipo" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                    <h3 className="text-white text-2xl font-semibold mb-2">{finalCta.title}</h3>
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                        {finalCta.cta} <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </section>
    );
}
