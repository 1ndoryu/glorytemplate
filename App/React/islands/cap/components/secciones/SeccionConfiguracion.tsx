/**
 * SeccionConfiguracion
 *
 * Vista de configuración del centro, horarios, capacidad y suscripción.
 * Implementación completa de la Fase 3 del ROADMAP.
 */

import {useConfiguracion} from '../../hooks/useConfiguracion';
import {PanelCentro, PanelHorarios, PanelCapacidad, PanelSuscripcion, PanelDemo} from '../configuracion';
import {Alerta, Spinner} from '../ui';

interface SeccionConfiguracionProps {
    userName: string;
    userEmail: string;
}

export function SeccionConfiguracion({userName, userEmail}: SeccionConfiguracionProps) {
    const {centro, config, suscripcion, cargando, guardandoCentro, guardandoHorarios, error, exito, guardarCentro, guardarHorarios, limpiarMensajes} = useConfiguracion();

    /* Limpiar mensajes después de 4 segundos */
    if (exito || error) {
        setTimeout(limpiarMensajes, 4000);
    }

    if (cargando) {
        return (
            <div className="capSeccion capFlexCenter" style={{minHeight: '400px'}}>
                <Spinner tamano="lg" />
            </div>
        );
    }

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Configuración</h2>
                <p className="capTexto capTexto--secundario">Ajustes de tu centro, horarios y suscripción</p>
            </div>

            {/* Mensajes de feedback */}
            {error && (
                <Alerta variante="error" className="capMt--md capAnimSlideUp">
                    {error}
                </Alerta>
            )}
            {exito && (
                <Alerta variante="exito" className="capMt--md capAnimSlideUp">
                    {exito}
                </Alerta>
            )}

            {/* Grid de paneles - cada uno con su estado de carga independiente */}
            <div className="capConfigGrid capMt--lg">
                {/* Columna izquierda: Centro y Horarios */}
                <div className="capFlexCol capGap--lg">
                    <PanelCentro centro={centro} guardando={guardandoCentro} onGuardar={guardarCentro} />
                    <PanelHorarios config={config} guardando={guardandoHorarios} onGuardar={guardarHorarios} />
                </div>

                {/* Columna derecha: Capacidad, Suscripción y Demo */}
                <div className="capFlexCol capGap--lg">
                    <PanelCapacidad config={config} guardando={guardandoHorarios} onGuardar={guardarHorarios} />
                    <PanelSuscripcion suscripcion={suscripcion} userName={userName} userEmail={userEmail} />
                    {/* Panel Demo: solo visible si el modo está permitido (WP_DEBUG o CAP_ALLOW_DEMO_MODE) */}
                    <PanelDemo />
                </div>
            </div>
        </div>
    );
}

export default SeccionConfiguracion;
