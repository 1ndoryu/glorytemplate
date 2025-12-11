import {ABOUT_CONTENT} from '../data/content';

export function TechStack() {
    const {stack} = ABOUT_CONTENT;
    return (
        <section className="mx-auto w-full max-w-4xl text-center">
            <h2 className="text-lg font-medium text-[#292524] mb-8">{stack.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stack.tools.map((tool, i) => (
                    <div key={i} className="group p-4 bg-white border border-[#e5e5e0] rounded-lg hover:border-[#d6d3d1] transition-all">
                        <div className="w-8 h-8 mx-auto bg-[#f0efeb] rounded-md flex items-center justify-center text-[#57534e] mb-3 group-hover:bg-[#e7e5e4] transition-colors">
                            <tool.icon className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-semibold text-[#292524]">{tool.name}</div>
                        <div className="text-[10px] text-[#79716b] uppercase tracking-wide mt-1">{tool.role}</div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-[#79716b] mt-6 max-w-lg mx-auto">{stack.note}</p>
        </section>
    );
}
