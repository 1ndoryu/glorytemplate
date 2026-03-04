/**
 * HomeIsland — Landing page principal de Cresta Campers.
 * Hero con buscador, flota destacada, cómo funciona, reseñas, CTA final.
 * Inspirado en roadsurfer.com — sin estilos inline, CSS en home.css
 */

import { useState, useCallback } from 'react';
import { useNavigation, useGloryOptions } from '@/hooks';
import { GloryLink } from '@/core/router/GloryLink';
import { useVehiculos } from '@app/hooks/useVehiculos';
import { SelectorFechas } from '@app/components/SelectorFechas';
import { TarjetaVehiculo } from '@app/components/TarjetaVehiculo';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

const RESENIAS = [
    {
        nombre: 'Laura M.',
        texto: 'Una experiencia increíble. La furgoneta estaba impecable y totalmente equipada. Recorrimos la costa mediterránea sin prisas. Repetiremos seguro.',
        estrellas: 5,
    },
    {
        nombre: 'Carlos P.',
        texto: 'El proceso de reserva fue muy sencillo y el trato del equipo excelente. La camper era perfecta para nuestra escapada en familia por el norte.',
        estrellas: 5,
    },
    {
        nombre: 'Ana & Sergio',
        texto: 'Viajamos 10 días por Portugal y fue el mejor viaje de nuestra vida. La furgoneta tenía todo lo necesario. Atención al cliente de 10.',
        estrellas: 5,
    },
];

const PASOS = [
    { paso: '1', icono: 'calendario', titulo: 'Elige tus fechas', desc: 'Selecciona las fechas de recogida y devolución. Consulta la disponibilidad en tiempo real.' },
    { paso: '2', icono: 'pago', titulo: 'Reserva online', desc: 'Completa tu reserva con pago seguro. Recibirás la confirmación al instante por email.' },
    { paso: '3', icono: 'furgoneta', titulo: 'Recoge y viaja', desc: 'Recoge tu furgoneta en el punto acordado, totalmente equipada y lista para la aventura.' },
];

function IconoPaso({ tipo }: { tipo: string }): JSX.Element {
    if (tipo === 'calendario') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        );
    }
    if (tipo === 'pago') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14v-5H5v5z" /><path d="M2 12l3-6h14l3 6" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
    );
}

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
        <div>
            <Header transparente />

            {/* Hero */}
            <section className="heroSeccion">
                <div className="heroOverlay" />

                <div className="heroContenido">
                    <h1 className="heroTitulo">
                        Tu aventura sobre{' '}
                        <span className="heroTituloResaltado">ruedas</span>{' '}
                        empieza aquí
                    </h1>
                    <p className="heroSubtitulo">
                        Alquila una furgoneta camper equipada y viaja a tu ritmo.
                        Sin prisas, sin rutas fijas, solo tú y el camino.
                    </p>

                    <div className="heroBuscador">
                        <SelectorFechas
                            fechaInicio={fechaInicio}
                            fechaFin={fechaFin}
                            onChange={handleFechasChange}
                        />
                        <button
                            onClick={handleBuscar}
                            disabled={!fechaInicio || !fechaFin}
                            className="heroBuscarBoton"
                        >
                            Buscar disponibilidad
                        </button>
                    </div>

                    <p className="heroHorarios">
                        Recogida a las {horarioRecogida} · Devolución a las {horarioDevolucion}
                    </p>

                    <div className="heroBadges">
                        <span className="heroBadge">
                            <svg className="heroBadgeIcono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Kilometraje ilimitado
                        </span>
                        <span className="heroBadge">
                            <svg className="heroBadgeIcono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                            2do conductor gratis
                        </span>
                        <span className="heroBadge">
                            <svg className="heroBadgeIcono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                            Asistencia 24/7
                        </span>
                        <span className="heroBadge">
                            <svg className="heroBadgeIcono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                            Cancelación flexible
                        </span>
                    </div>
                </div>

                <div className="heroScrollIndicador">
                    <svg className="heroScrollIcono" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* Nuestras furgonetas */}
            <section className="seccionFlota">
                <div className="contenedor">
                    <div className="seccionCabecera">
                        <span className="seccionEtiqueta">Nuestra flota</span>
                        <h2 className="seccionTitulo">Encuentra tu camper ideal</h2>
                        <p className="seccionDescripcion">
                            Furgonetas camper totalmente equipadas para que solo tengas que preocuparte de disfrutar.
                        </p>
                    </div>

                    {loading ? (
                        <div className="cargando">
                            <div className="cargandoSpinner" />
                        </div>
                    ) : vehiculos.length > 0 ? (
                        <div className="flotaGrid">
                            {vehiculos.map(v => (
                                <TarjetaVehiculo key={v.id} vehiculo={v} />
                            ))}
                        </div>
                    ) : (
                        <div className="flotaVacia">
                            <div className="flotaVaciaIcono">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 17h14v-5H5v5z" /><path d="M2 12l3-6h14l3 6" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
                            </div>
                            <h3 className="flotaVaciaTitulo">Pronto disponible</h3>
                            <p className="flotaVaciaTexto">
                                Estamos preparando nuestra flota. Vuelve pronto para descubrir nuestras furgonetas.
                            </p>
                        </div>
                    )}

                    {!loading && vehiculos.length > 0 && (
                        <div className="seccionBotonCentro">
                            <GloryLink href="/flota/" className="botonSecundario">
                                Ver toda la flota
                            </GloryLink>
                        </div>
                    )}
                </div>
            </section>

            {/* Cómo funciona */}
            <section className="seccionComoFunciona">
                <div className="contenedorEstrecho">
                    <div className="seccionCabecera">
                        <span className="seccionEtiqueta">Cómo funciona</span>
                        <h2 className="seccionTitulo">Reservar es fácil y rápido</h2>
                        <p className="seccionDescripcion">
                            En tres sencillos pasos estarás listo para la aventura.
                        </p>
                    </div>

                    <div className="pasosGrid">
                        {PASOS.map(step => (
                            <div key={step.paso} className="pasoTarjeta">
                                <div className="pasoIcono">
                                    <IconoPaso tipo={step.icono} />
                                </div>
                                <div className="pasoNumero">Paso {step.paso}</div>
                                <h3 className="pasoTitulo">{step.titulo}</h3>
                                <p className="pasoDescripcion">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reseñas de clientes */}
            <section className="seccionResenias">
                <div className="contenedor">
                    <div className="seccionCabecera">
                        <span className="seccionEtiqueta">Reseñas de clientes</span>
                        <h2 className="seccionTitulo">Lo que dicen nuestros viajeros</h2>
                    </div>

                    <div className="reseniasGrid">
                        {RESENIAS.map((r, i) => (
                            <div key={i} className="reseniaTarjeta">
                                <div className="reseniaEstrellas">
                                    {Array.from({ length: r.estrellas }, (_, j) => (
                                        <span key={j}>&#9733;</span>
                                    ))}
                                </div>
                                <p className="reseniaTexto">&ldquo;{r.texto}&rdquo;</p>
                                <p className="reseniaAutor">{r.nombre}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA final */}
            <section className="seccionCtaFinal">
                <div className="contenedorCentrado">
                    <h2 className="ctaFinalTitulo">
                        ¿Listo para tu próxima aventura?
                    </h2>
                    <p className="ctaFinalTexto">
                        Reserva tu furgoneta camper hoy y empieza a planificar el viaje de tu vida.
                    </p>
                    <GloryLink href="/reservar/" className="botonCtaFinal">
                        Reservar ahora
                    </GloryLink>
                </div>
            </section>

            <Footer />
        </div>
    );
}
