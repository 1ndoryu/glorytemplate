import React from 'react';
import {useIntersectionReveal} from '../../hooks';
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
 * Refactorizado para usar hook useIntersectionReveal.
 */

/* Datos de las tarjetas del proceso para centralizar contenido */
const tarjetasSuperior = [
    {
        titulo: 'Elige tu servicio',
        descripcion: 'Selecciona el servicio que necesitas y define el tiempo de entrega según tus requerimientos.',
        Ejemplo: EjemploListaServicios
    },
    {
        titulo: 'Pago seguro',
        descripcion: 'Tu pago queda protegido con nuestro sistema de garantía. Atención inmediata desde el primer momento.',
        Ejemplo: EjemploProgresoPago
    },
    {
        titulo: 'Despliegue completo',
        descripcion: 'Nos encargamos del hosting y dominio. Gestiona todo desde nuestra plataforma de forma sencilla.',
        Ejemplo: EjemploTerminalDespliegue
    }
];

const tarjetasInferior = [
    {
        titulo: 'Publica tu servicio',
        descripcion: 'Sube tu portafolio y define tus ofertas con un sistema simplificado y potente.',
        Ejemplo: EjemploPublicaServicio
    },
    {
        titulo: 'Recibe clientes',
        descripcion: 'Sistema de notificaciones en tiempo real y bandeja de entrada centralizada.',
        Ejemplo: EjemploRecibeClientes
    },
    {
        titulo: 'Crece y avanza',
        descripcion: 'Sube de nivel, desbloquea beneficios y aumenta tu visibilidad automáticamente.',
        Ejemplo: EjemploCrecePlataforma
    }
];

export const SeccionProceso: React.FC = () => {
    const {ref: refSuperior, visibles: tarjetasVisibles} = useIntersectionReveal<HTMLDivElement>({
        cantidadElementos: 3,
        delayEntreCada: 150,
        threshold: 0.2
    });

    const {ref: refInferior, visibles: tarjetasInferioresVisibles} = useIntersectionReveal<HTMLDivElement>({
        cantidadElementos: 3,
        delayEntreCada: 150,
        threshold: 0.2
    });

    return (
        <section id="seccionProceso" className="seccionProceso" ref={refSuperior}>
            <div className="procesoContenedor">
                <div className="procesoGrid">
                    {tarjetasSuperior.map((tarjeta, index) => (
                        <article key={tarjeta.titulo} className={`tarjetaProceso ${tarjetasVisibles[index] ? 'tarjetaProcesoVisible' : ''}`} style={index > 0 ? ({'--delay': `${index * 0.1}s`} as React.CSSProperties) : undefined}>
                            <h3 className="procesoTitulo">{tarjeta.titulo}</h3>
                            <p className="procesoDescripcion">{tarjeta.descripcion}</p>
                            <div className="procesoEjemploVisual">
                                <tarjeta.Ejemplo />
                            </div>
                        </article>
                    ))}
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

                <div className="procesoGrid" ref={refInferior} style={{marginTop: 'var(--nakomi-espacioLg)', paddingTop: '100px'}}>
                    {tarjetasInferior.map((tarjeta, index) => (
                        <article key={tarjeta.titulo} className={`tarjetaProceso ${tarjetasInferioresVisibles[index] ? 'tarjetaProcesoVisible' : ''}`} style={index > 0 ? ({'--delay': `${index * 0.1}s`} as React.CSSProperties) : undefined}>
                            <h3 className="procesoTitulo">{tarjeta.titulo}</h3>
                            <p className="procesoDescripcion">{tarjeta.descripcion}</p>
                            <div className="procesoEjemploVisual">
                                <tarjeta.Ejemplo />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SeccionProceso;
