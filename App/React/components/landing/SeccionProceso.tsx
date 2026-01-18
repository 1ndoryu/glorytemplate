import React, {useEffect, useRef, useState} from 'react';
import { EjemploListaServicios } from './proceso/EjemploListaServicios';
import { EjemploProgresoPago } from './proceso/EjemploProgresoPago';
import { EjemploTerminalDespliegue } from './proceso/EjemploTerminalDespliegue';
import { EjemploGestionPedidos } from './proceso/EjemploGestionPedidos';

/*
 * SeccionProceso: Sección de 3 columnas que muestra el proceso de trabajo.
 * Diseño ultra minimalista con ejemplos visuales estáticos más detallados.
 * Altura uniforme en todos los ejemplos.
 */

export const SeccionProceso: React.FC = () => {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [tarjetasVisibles, setTarjetasVisibles] = useState<boolean[]>([false, false, false]);

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

    return (
        <section id="seccionProceso" className="seccionProceso" ref={contenedorRef}>
            <div className="procesoContenedor">
                <div className="procesoGrid">
                    {/* Tarjeta 1: Elige tu servicio */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[0] ? 'tarjetaProcesoVisible' : ''}`}>
                        <h3 className="procesoTitulo">Elige tu servicio</h3>
                        <p className="procesoDescripcion">Selecciona el servicio que necesitas y define el tiempo de entrega según tus requerimientos.</p>
                        <div className="procesoEjemploVisual" style={{backgroundImage: "url('/wp-content/themes/glory/Glory/assets/images/colors/47252f8c0c7f5dae7657ca6eed05eeca.jpg')"}}>
                            <EjemploListaServicios />
                        </div>
                    </article>

                    {/* Tarjeta 2: Pago seguro */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[1] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.1s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Pago seguro</h3>
                        <p className="procesoDescripcion">Tu pago queda protegido con nuestro sistema de garantía. Atención inmediata desde el primer momento.</p>
                        <div className="procesoEjemploVisual" style={{backgroundImage: "url('/wp-content/themes/glory/Glory/assets/images/colors/c5f3015667280079a5a6299c0ac16e83.jpg')"}}>
                            <EjemploProgresoPago />
                        </div>
                    </article>

                    {/* Tarjeta 3: Despliegue completo */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[2] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.2s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Despliegue completo</h3>
                        <p className="procesoDescripcion">Nos encargamos del hosting y dominio. Gestiona todo desde nuestra plataforma de forma sencilla.</p>
                        <div className="procesoEjemploVisual" style={{backgroundImage: "url('/wp-content/themes/glory/Glory/assets/images/colors/3450083cb428563c30f4544d5e5a7e82.jpg')"}}>
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
            </div>
        </section>
    );
};

export default SeccionProceso;
