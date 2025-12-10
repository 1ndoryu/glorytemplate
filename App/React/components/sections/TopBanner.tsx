// Componente TopBanner
// Banner superior promocional con enlace a accion

import {ArrowRight} from 'lucide-react';

interface TopBannerProps {
    text: string;
    linkText: string;
    linkHref: string;
}

export function TopBanner({text, linkText, linkHref}: TopBannerProps) {
    return (
        <div className="w-full bg-[#f0efeb] text-[#57534e] py-2 px-6 relative text-[11px] md:text-xs font-mono border-b border-[#e7e5e4]">
            <div className="mx-auto w-full max-w-7xl flex items-center justify-center gap-3">
                <span className="opacity-100 font-medium">{text}</span>
                <span className="opacity-30">|</span>
                <a href={linkHref} className="font-semibold underline underline-offset-2 hover:text-[#292524] transition-colors flex items-center">
                    {linkText} <ArrowRight className="w-3 h-3 ml-1" />
                </a>
            </div>
        </div>
    );
}
