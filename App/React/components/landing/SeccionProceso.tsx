import React, {useEffect, useRef, useState} from 'react';

/*
 * SeccionProceso: Sección de 3 columnas que muestra el proceso de trabajo.
 * Diseño ultra minimalista con ejemplos visuales estáticos debajo de cada descripción.
 * Sin iconos, enfocado en claridad y simplicidad.
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
                        <div className="procesoEjemploVisual">
                            <div className="ejemploLista">
                                <div className="ejemploItem">
                                    <span className="ejemploTexto">Diseño Web Premium</span>
                                    <span className="ejemploCheck">✓</span>
                                </div>
                                <div className="ejemploItem ejemploItemInactivo">
                                    <span className="ejemploTexto">E-commerce Avanzado</span>
                                </div>
                                <div className="ejemploItem ejemploItemInactivo">
                                    <span className="ejemploTexto">Aplicación a Medida</span>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Tarjeta 2: Pago seguro */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[1] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.1s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Pago seguro</h3>
                        <p className="procesoDescripcion">Tu pago queda protegido con nuestro sistema de garantía. Atención inmediata desde el primer momento.</p>
                        <div className="procesoEjemploVisual">
                            <div className="ejemploProgreso">
                                <div className="progresoLinea">
                                    <div className="progresoPunto progresoActivo"></div>
                                    <div className="progresoTramo progresoTramoActivo"></div>
                                    <div className="progresoPunto progresoActivo"></div>
                                    <div className="progresoTramo"></div>
                                    <div className="progresoPunto"></div>
                                </div>
                                <div className="progresoEtiquetas">
                                    <span className="progresoEtiqueta">Pago</span>
                                    <span className="progresoEtiqueta">Verificado</span>
                                    <span className="progresoEtiqueta progresoEtiquetaInactiva">Entregado</span>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Tarjeta 3: Despliegue completo */}
                    <article className={`tarjetaProceso ${tarjetasVisibles[2] ? 'tarjetaProcesoVisible' : ''}`} style={{'--delay': '0.2s'} as React.CSSProperties}>
                        <h3 className="procesoTitulo">Despliegue completo</h3>
                        <p className="procesoDescripcion">Nos encargamos del hosting y dominio. Gestiona todo desde nuestra plataforma de forma sencilla.</p>
                        <div className="procesoEjemploVisual">
                            <div className="ejemploTerminal">
                                <div className="terminalLinea">
                                    <span className="terminalPrompt">→</span>
                                    <span className="terminalComando">deploy --production</span>
                                </div>
                                <div className="terminalLinea terminalExito">
                                    <span className="terminalTexto">✓ Desplegado en tudominio.com</span>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
};

export default SeccionProceso;
