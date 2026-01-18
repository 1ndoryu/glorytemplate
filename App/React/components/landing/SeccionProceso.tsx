import React, {useEffect, useRef, useState} from 'react';
import {EjemploListaServicios} from './proceso/EjemploListaServicios';
import {EjemploProgresoPago} from './proceso/EjemploProgresoPago';
import {EjemploTerminalDespliegue} from './proceso/EjemploTerminalDespliegue';
import {EjemploGestionPedidos} from './proceso/EjemploGestionPedidos';
import {EjemploPublicaServicio} from './proceso/EjemploPublicaServicio';
import {EjemploRecibeClientes} from './proceso/EjemploRecibeClientes';
import {EjemploCrecePlataforma} from './proceso/EjemploCrecePlataforma';

/*
 * SeccionProceso: Sección de 3 columnas que muestra el proceso de trabajo.
 * Diseño ultra minimalista con ejemplos visuales estáticos más detallados.
 * Altura uniforme en todos los ejemplos.
 */

export const SeccionProceso: React.FC = () => {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const gridInferiorRef = useRef<HTMLDivElement>(null);
    const [tarjetasVisibles, setTarjetasVisibles] = useState<boolean[]>([false, false, false]);
    const [tarjetasInferioresVisibles, setTarjetasInferioresVisibles] = useState<boolean[]>([false, false, false]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        [0, 1, 2].forEach(index => {
                            setTimeout(() => {
                                setTarjetasVisibles(prev => {
                                    const nuevo = [...prev];
                                    nuevo[index] = true;
                                    return nuevo;
                                });
                            }, index * 150);
                        });
                        observer.disconnect();
                    }
                });
            },
            {threshold: 0.2}
        );

        if (contenedorRef.current) {
            observer.observe(contenedorRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        [0, 1, 2].forEach(index => {
                            setTimeout(() => {
                                setTarjetasInferioresVisibles(prev => {
                                    const nuevo = [...prev];
                                    nuevo[index] = true;
                                    return nuevo;
                                });
                            }, index * 150);
                        });
                        observer.disconnect();
                    }
                });
            },
            {threshold: 0.2}
        );

        if (gridInferiorRef.current) {
            observer.observe(gridInferiorRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section id="seccionProceso" className="seccionProceso" ref={contenedorRef}>
            <div className="procesoContenedor">
                <div className="procesoGrid">
                    {/* Tarjeta 1: Elige tu servicio */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[0] ? 'tarjetaProcesoVisible' : ''}`}>
                        <h3 className="procesoTitulo">Elige tu servicio</h3>
                        <p className="procesoDescripcion">Selecciona el servicio que necesitas y define el tiempo de entrega según tus requerimientos.</p>
                        <div className="procesoEjemploVisual">
                            <EjemploListaServicios />
                        </div>
                    </article>

                    {/* Tarjeta 2: Pago seguro */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[1] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.1s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Pago seguro</h3>
                        <p className="procesoDescripcion">Tu pago queda protegido con nuestro sistema de garantía. Atención inmediata desde el primer momento.</p>
                        <div className="procesoEjemploVisual">
                            <EjemploProgresoPago />
                        </div>
                    </article>

                    {/* Tarjeta 3: Despliegue completo */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[2] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.2s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Despliegue completo</h3>
                        <p className="procesoDescripcion">Nos encargamos del hosting y dominio. Gestiona todo desde nuestra plataforma de forma sencilla.</p>
                        <div className="procesoEjemploVisual">
                            <EjemploTerminalDespliegue />
                        </div>
                    </article>
                </div>

                {/* Tarjeta Grande: Gestión de pedidos */}
                <article className="tarjetaProcesoGrande">
                    <div className="procesoGrandeTexto">
                        <h3 className="procesoTitulo">Gestiona tus pedidos</h3>
                        <p className="procesoDescripcion">Visualiza el estado de todos tus proyectos en tiempo real. Comunícate directamente con el equipo y recibe actualizaciones al instante.</p>
                    </div>
                    <div className="procesoGrandeEjemplo">
                        <div className="ventanaPedidos" style={{height: '100%'}}>
                            <EjemploGestionPedidos />
                        </div>
                    </div>
                </article>

                <div className="procesoGrid" ref={gridInferiorRef} style={{marginTop: 'var(--nakomi-espacioLg)', paddingTop: '100px'}}>
                    {/* Tarjeta 4: Publica tu servicio */}
                    <article className={`tarjetaProceso ${tarjetasInferioresVisibles[0] ? 'tarjetaProcesoVisible' : ''}`}>
                        <h3 className="procesoTitulo">Publica tu servicio</h3>
                        <p className="procesoDescripcion">Sube tu portafolio y define tus ofertas con un sistema simplificado y potente.</p>
                        <div className="procesoEjemploVisual">
                            <EjemploPublicaServicio />
                        </div>
                    </article>

                    {/* Tarjeta 5: Recibe clientes */}
                    <article className={`tarjetaProceso ${tarjetasInferioresVisibles[1] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.1s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Recibe clientes</h3>
                        <p className="procesoDescripcion">Sistema de notificaciones en tiempo real y bandeja de entrada centralizada.</p>
                        <div className="procesoEjemploVisual">
                            <EjemploRecibeClientes />
                        </div>
                    </article>

                    {/* Tarjeta 6: Crece en la plataforma */}
                    <article className={`tarjetaProceso ${tarjetasInferioresVisibles[2] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.2s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Crece y avanza</h3>
                        <p className="procesoDescripcion">Sube de nivel, desbloquea beneficios y aumenta tu visibilidad automáticamente.</p>
                        <div className="procesoEjemploVisual">
                            <EjemploCrecePlataforma />
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
};

export default SeccionProceso;
