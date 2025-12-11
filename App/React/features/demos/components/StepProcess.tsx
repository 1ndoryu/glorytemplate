export function StepProcess() {
    return (
        <section className="mx-auto w-full max-w-4xl py-12">
            <h2 className="text-2xl font-medium tracking-tight text-center mb-12 text-[#292524]">¿Cómo probamos tu caso real?</h2>

            <div className="grid md:grid-cols-4 gap-4 relative">
                {/* Línea conectora (Desktop) */}
                <div className="hidden md:block absolute top-6 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#e5e5e0] to-transparent -z-10"></div>

                {[
                    {step: '1', title: 'Llamada breve', desc: '15 min para entender tus reglas de negocio.'},
                    {step: '2', title: 'Preparo tu demo', desc: 'Configuro el bot con tus horarios y FAQs.'},
                    {step: '3', title: 'La pruebas tú', desc: 'Te mando un link para que hables con él.'},
                    {step: '4', title: 'Decidimos', desc: 'Si te gusta, lo lanzamos en producción.'}
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center bg-white p-4 rounded-lg md:bg-transparent">
                        <div className="w-12 h-12 rounded-full bg-white border border-[#e5e5e0] flex items-center justify-center text-sm font-bold text-[#292524] shadow-sm mb-3 relative z-10">{item.step}</div>
                        <h3 className="text-sm font-semibold text-[#292524] mb-1">{item.title}</h3>
                        <p className="text-xs text-[#79716b] max-w-[150px]">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
