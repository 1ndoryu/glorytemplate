export function StepProcess() {
    return (
        <section id="demo-step-process" className="mx-auto w-full max-w-4xl py-12">
            <h2 className="text-2xl font-heading font-medium tracking-tight text-center mb-12 text-primary">¿Cómo probamos tu caso real?</h2>

            <div className="grid md:grid-cols-4 gap-4 relative">
                {/* Línea conectora (Desktop) */}
                <div className="hidden md:block absolute top-6 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-stone-200 to-transparent -z-10"></div>

                {[
                    {step: '1', title: 'Llamada breve', desc: '15 min para entender tus reglas de negocio.'},
                    {step: '2', title: 'Preparo tu demo', desc: 'Configuro el bot con tus horarios y FAQs.'},
                    {step: '3', title: 'La pruebas tú', desc: 'Te mando un link para que hables con él.'},
                    {step: '4', title: 'Decidimos', desc: 'Si te gusta, lo lanzamos en producción.'}
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center bg-surface p-4 rounded-lg md:bg-transparent">
                        <div className="w-12 h-12 rounded-full bg-surface border border-primary flex items-center justify-center text-sm font-bold text-primary shadow-sm mb-3 relative z-10">{item.step}</div>
                        <h3 className="text-sm font-heading font-semibold text-primary mb-1">{item.title}</h3>
                        <p className="text-xs text-muted max-w-[150px]">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
