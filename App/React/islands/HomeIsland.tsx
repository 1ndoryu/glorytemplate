/**
 * HomeIsland — Landing page principal de Cresta Campers.
 * Hero con buscador de fechas prominente, sección de flota, cómo funciona, CTA.
 */

import { useState, useCallback } from 'react';
import { useNavigation, useGloryOptions } from '@/hooks';
import { GloryLink } from '@/core/router/GloryLink';
import { useVehiculos } from '@app/hooks/useVehiculos';
import { SelectorFechas } from '@app/components/SelectorFechas';
import { TarjetaVehiculo } from '@app/components/TarjetaVehiculo';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

export function HomeIsland(): JSX.Element {
    const { navegar } = useNavigation();
    const { vehiculos, loading } = useVehiculos();
    const { get } = useGloryOptions();

    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const handleBuscar = useCallback(() => {
        const params = new URLSearchParams();
        if (fechaInicio) params.set('inicio', fechaInicio);
        if (fechaFin) params.set('fin', fechaFin);
        navegar(`/reservar/?${params.toString()}`);
    }, [fechaInicio, fechaFin, navegar]);

    const handleFechasChange = useCallback((inicio: string, fin: string) => {
        setFechaInicio(inicio);
        setFechaFin(fin);
    }, []);

    const reservasData = get('reservas', {}) as Record<string, string>;
    const horarioRecogida = reservasData.horarioRecogida || '16:00';
    const horarioDevolucion = reservasData.horarioDevolucion || '10:00';

    return (
        <div className="min-h-screen">
            <Header transparente />

            {/* Hero */}
            <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
                {/* Overlay pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                }} />

                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                        Tu aventura sobre<br />
                        <span className="text-green-300">ruedas</span> empieza aquí
                    </h1>
                    <p className="text-lg md:text-xl text-green-100/80 mb-10 max-w-2xl mx-auto">
                        Alquila una furgoneta camper equipada y viaja a tu ritmo. Sin prisas, sin rutas fijas, solo tú y el camino.
                    </p>

                    {/* Buscador de fechas */}
                    <div className="max-w-2xl mx-auto">
                        <SelectorFechas
                            fechaInicio={fechaInicio}
                            fechaFin={fechaFin}
                            onChange={handleFechasChange}
                        />
                        <button
                            onClick={handleBuscar}
                            disabled={!fechaInicio || !fechaFin}
                            className="mt-4 w-full md:w-auto bg-green-500 hover:bg-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                            Buscar disponibilidad
                        </button>
                    </div>

                    <p className="mt-4 text-sm text-green-200/60">
                        Recogida a las {horarioRecogida} · Devolución a las {horarioDevolucion}
                    </p>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* Nuestras furgonetas */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Nuestras furgonetas
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">
                            Furgonetas camper totalmente equipadas para que solo tengas que preocuparte de disfrutar.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {vehiculos.map(v => (
                                <TarjetaVehiculo key={v.id} vehiculo={v} />
                            ))}
                        </div>
                    )}

                    {!loading && vehiculos.length > 0 && (
                        <div className="text-center mt-10">
                            <GloryLink
                                href="/flota/"
                                className="inline-block bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold px-8 py-3 rounded-xl transition"
                            >
                                Ver toda la flota
                            </GloryLink>
                        </div>
                    )}
                </div>
            </section>

            {/* Cómo funciona */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Cómo funciona
                        </h2>
                        <p className="text-gray-500 text-lg">
                            Reservar tu furgoneta camper es fácil y rápido.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { paso: '1', icon: '📅', titulo: 'Elige tus fechas', desc: 'Selecciona las fechas de recogida y devolución. Consulta la disponibilidad en tiempo real.' },
                            { paso: '2', icon: '💳', titulo: 'Reserva online', desc: 'Completa tu reserva con pago seguro. Recibirás la confirmación al instante por email.' },
                            { paso: '3', icon: '🚐', titulo: 'Recoge y viaja', desc: 'Recoge tu furgoneta en el punto acordado, totalmente equipada y lista para la aventura.' },
                        ].map(step => (
                            <div key={step.paso} className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                                <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
                                    Paso {step.paso}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.titulo}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA final */}
            <section className="py-20 bg-green-700">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        ¿Listo para tu próxima aventura?
                    </h2>
                    <p className="text-green-100/80 text-lg mb-8">
                        Reserva tu furgoneta camper hoy y empieza a planificar el viaje de tu vida.
                    </p>
                    <GloryLink
                        href="/reservar/"
                        className="inline-block bg-white text-green-700 hover:bg-green-50 font-bold text-lg px-10 py-4 rounded-xl transition shadow-lg"
                    >
                        Reservar ahora
                    </GloryLink>
                </div>
            </section>

            <Footer />
        </div>
    );
}
