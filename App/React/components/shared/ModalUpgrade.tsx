/**
 * ModalUpgrade
 *
 * Modal que muestra los beneficios de Premium y permite
 * activar el trial o proceder al checkout.
 *
 * @package App/React/components/shared
 */

import {Modal} from './Modal';
import type {InfoSuscripcion, LimitesPlan} from '../../types/dashboard';

interface ModalUpgradeProps {
    visible: boolean;
    onCerrar: () => void;
    suscripcion: InfoSuscripcion;
    onActivarTrial: () => Promise<boolean>;
    cargando?: boolean;
}

/*
 * Comparativa de planes
 */
const CARACTERISTICAS = [
    {
        nombre: 'Hábitos',
        free: '10 máximo',
        premium: 'Ilimitados'
    },
    {
        nombre: 'Tareas activas',
        free: '50 máximo',
        premium: 'Ilimitadas'
    },
    {
        nombre: 'Proyectos',
        free: '3 máximo',
        premium: 'Ilimitados'
    },
    {
        nombre: 'Adjuntos en tareas',
        free: 'No disponible',
        premium: 'Hasta 10 por tarea'
    },
    {
        nombre: 'Sincronización multi-dispositivo',
        free: 'No',
        premium: 'Sí'
    },
    {
        nombre: 'Estadísticas avanzadas',
        free: 'No',
        premium: 'Sí'
    },
    {
        nombre: 'Temas personalizados',
        free: 'No',
        premium: 'Sí'
    },
    {
        nombre: 'Cifrado end-to-end',
        free: 'No',
        premium: 'Sí'
    }
];

export function ModalUpgrade({visible, onCerrar, suscripcion, onActivarTrial, cargando = false}: ModalUpgradeProps) {
    const {trialDisponible, plan, estado, diasRestantes} = suscripcion;

    const handleActivarTrial = async () => {
        const exito = await onActivarTrial();
        if (exito) {
            onCerrar();
        }
    };

    const renderEncabezado = () => {
        if (plan === 'premium') {
            if (estado === 'trial') {
                return (
                    <div className="modalUpgrade__encabezado modalUpgrade__encabezado--trial">
                        <span className="modalUpgrade__icono">★</span>
                        <h2>Tu período de prueba</h2>
                        <p className="modalUpgrade__subtitulo">
                            Te quedan <strong>{diasRestantes} días</strong> de Premium gratis
                        </p>
                    </div>
                );
            }
            return (
                <div className="modalUpgrade__encabezado modalUpgrade__encabezado--premium">
                    <span className="modalUpgrade__icono">★</span>
                    <h2>Eres Premium</h2>
                    <p className="modalUpgrade__subtitulo">{diasRestantes ? `Tu suscripción vence en ${diasRestantes} días` : 'Disfruta de todas las funcionalidades'}</p>
                </div>
            );
        }

        return (
            <div className="modalUpgrade__encabezado">
                <span className="modalUpgrade__icono">⚡</span>
                <h2>Desbloquea todo tu potencial</h2>
                <p className="modalUpgrade__subtitulo">Actualiza a Premium y organiza tu vida sin límites</p>
            </div>
        );
    };

    const renderAcciones = () => {
        if (plan === 'premium') {
            if (estado === 'trial') {
                return (
                    <div className="modalUpgrade__acciones">
                        <button
                            className="modalUpgrade__boton modalUpgrade__boton--primario"
                            onClick={() => {
                                /* TODO: Integrar con Stripe */
                                alert('Próximamente: Pago con Stripe');
                            }}>
                            Continuar con Premium
                        </button>
                        <button className="modalUpgrade__boton modalUpgrade__boton--secundario" onClick={onCerrar}>
                            Seguir probando
                        </button>
                    </div>
                );
            }
            return (
                <div className="modalUpgrade__acciones">
                    <button className="modalUpgrade__boton modalUpgrade__boton--secundario" onClick={onCerrar}>
                        Cerrar
                    </button>
                </div>
            );
        }

        return (
            <div className="modalUpgrade__acciones">
                {trialDisponible && (
                    <button className="modalUpgrade__boton modalUpgrade__boton--trial" onClick={handleActivarTrial} disabled={cargando}>
                        {cargando ? 'Activando...' : 'Probar 14 días gratis'}
                    </button>
                )}
                <button
                    className="modalUpgrade__boton modalUpgrade__boton--primario"
                    onClick={() => {
                        /* TODO: Integrar con Stripe */
                        alert('Próximamente: Pago con Stripe');
                    }}>
                    Obtener Premium
                </button>
                <button className="modalUpgrade__boton modalUpgrade__boton--secundario" onClick={onCerrar}>
                    Quizás después
                </button>
            </div>
        );
    };

    return (
        <Modal estaAbierto={visible} onCerrar={onCerrar} titulo="">
            <div id="modal-upgrade-contenido" className="modalUpgrade">
                {renderEncabezado()}

                <div className="modalUpgrade__comparativa">
                    <div className="modalUpgrade__columnas">
                        <div className="modalUpgrade__columna modalUpgrade__columna--header"></div>
                        <div className="modalUpgrade__columna modalUpgrade__columna--free">FREE</div>
                        <div className="modalUpgrade__columna modalUpgrade__columna--premium">PREMIUM</div>
                    </div>

                    {CARACTERISTICAS.map((caract, index) => (
                        <div key={index} className="modalUpgrade__fila">
                            <div className="modalUpgrade__caracteristica">{caract.nombre}</div>
                            <div className="modalUpgrade__valor modalUpgrade__valor--free">{caract.free}</div>
                            <div className="modalUpgrade__valor modalUpgrade__valor--premium">{caract.premium}</div>
                        </div>
                    ))}
                </div>

                {renderAcciones()}
            </div>
        </Modal>
    );
}
