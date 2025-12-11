import {ABOUT_CONTENT} from '../data/content';

export function TechStack() {
    const {stack} = ABOUT_CONTENT;
    return (
        <section id="tech-stack" className="mx-auto w-full max-w-4xl text-center">
            <h2 className="text-lg font-heading font-medium text-primary mb-8">{stack.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stack.tools.map((tool, i) => (
                    <div key={i} className="group p-4 bg-surface border border-primary rounded-lg hover:border-stone-300 transition-all">
                        <div className="w-8 h-8 mx-auto bg-secondary rounded-md flex items-center justify-center text-secondary mb-3 group-hover:bg-stone-200 transition-colors">
                            <tool.icon className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-semibold text-primary">{tool.name}</div>
                        <div className="text-[10px] text-muted uppercase tracking-wide mt-1">{tool.role}</div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted mt-6 max-w-lg mx-auto">{stack.note}</p>
        </section>
    );
}
