/**
 * ModalGeneracionParcial
 *
 * Se muestra cuando el usuario pulsa "Generar" y hoy NO es lunes.
 * Ofrece dos opciones:
 * 1. Generar desde hoy (solo días restantes de la semana)
 * 2. Generar semana completa (con advertencia de asistencia retroactiva)
 */

import {useState} from 'react';
import {Modal, Boton, Alerta} from '../ui';

interface ModalGeneracionParcialProps {
    abierto: boolean;
    nombreDiaHoy: string;
    fechaHoy: string;
    onCerrar: () => void;
    onGenerarDesdeHoy: () => void;
    onGenerarSemanaCompleta: () => void;
    generando: boolean;
}

export function ModalGeneracionParcial({abierto, nombreDiaHoy, fechaHoy: _fechaHoy, onCerrar, onGenerarDesdeHoy, onGenerarSemanaCompleta, generando}: ModalGeneracionParcialProps) {
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    const handleSemanaCompleta = () => {
        if (!mostrarConfirmacion) {
            setMostrarConfirmacion(true);
            return;
        }
        /* Segunda confirmación: generar semana completa */
        setMostrarConfirmacion(false);
        onGenerarSemanaCompleta();
    };

    const handleCerrar = () => {
        setMostrarConfirmacion(false);
        onCerrar();
    };

    return (
        <Modal abierto={abierto} onCerrar={handleCerrar} titulo="Generar Calendario" tamano="md">
            <div className="capModalGeneracion">
                {!mostrarConfirmacion ? (
                    <>
                        <div className="capModalGeneracion__header capMb--lg">
                            <span className="capTexto capTexto--secundario">Hoy es</span>
                            <h3 className="capTexto capTexto--3xl capTexto--primario capTexto--bold capTt--cap">{nombreDiaHoy}</h3>
                            <p className="capTexto capTexto--secundario">¿Desde qué día deseas generar el calendario?</p>
                        </div>

                        <div className="capModalGeneracion__opciones">
                            <div className="capModalGeneracion__opcion">
                                <Boton variante="primario" anchoCompleto onClick={onGenerarDesdeHoy} cargando={generando} disabled={generando}>
                                    Generar desde {nombreDiaHoy}
                                </Boton>
                                <p className="capTexto capTexto--sm capTexto--secundario capMt--xs">Solo genera clases de {nombreDiaHoy} a viernes.</p>
                            </div>

                            <div className="capModalGeneracion__separador">
                                <span>o</span>
                            </div>

                            <div className="capModalGeneracion__opcion">
                                <Boton variante="secundario" anchoCompleto onClick={handleSemanaCompleta} disabled={generando}>
                                    Generar semana completa
                                </Boton>
                                <p className="capTexto capTexto--sm capTexto--secundario capMt--xs">Genera lunes a viernes (incluye días pasados).</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Alerta variante="advertencia" className="capMb--md">
                            Se asumirá que todos los alumnos asignados a clases de lunes a {nombreDiaHoy === 'martes' ? 'lunes' : `antes del ${nombreDiaHoy}`} asistieron. Su progreso se actualizará automáticamente.
                        </Alerta>

                        <p className="capTexto capMb--lg">¿Continuar con la generación de semana completa?</p>

                        <div className="capModalGeneracion__confirmar">
                            <Boton variante="secundario" onClick={() => setMostrarConfirmacion(false)} disabled={generando}>
                                Volver
                            </Boton>
                            <Boton variante="primario" onClick={handleSemanaCompleta} cargando={generando} disabled={generando}>
                                Sí, generar semana completa
                            </Boton>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default ModalGeneracionParcial;
