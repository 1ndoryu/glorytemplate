/*
 * AccionesFormulario
 * Componente reutilizable para las acciones de formularios (Guardar, Cancelar, Eliminar)
 * Centraliza los estilos y la logica de confirmacion de eliminacion
 */

import {useState} from 'react';
import {Trash2} from 'lucide-react';

interface AccionesFormularioProps {
    onCancelar: () => void;
    /* Funcion opcional para override del submit por defecto (type="button") */
    onGuardar?: () => void;
    textoGuardar?: string;
    guardando?: boolean;
    /* Si se proporciona, muestra la zona de peligro */
    onEliminar?: () => void;
    textoEliminar?: string;
}

export function AccionesFormulario({onCancelar, onGuardar, textoGuardar = 'Guardar', guardando = false, onEliminar, textoEliminar = 'Eliminar'}: AccionesFormularioProps): JSX.Element {
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

    return (
        <>
            {/* Zona de peligro: eliminar (opcional) */}
            {onEliminar && (
                <div className="accionesFormularioZonaPeligro">
                    {!confirmandoEliminar ? (
                        <button type="button" className="accionesFormularioBotonEliminar" onClick={() => setConfirmandoEliminar(true)} disabled={guardando}>
                            <Trash2 size={12} />
                            <span>{textoEliminar}</span>
                        </button>
                    ) : (
                        <div className="accionesFormularioConfirmacion">
                            <span className="accionesFormularioConfirmacionTexto">Confirmar eliminacion?</span>
                            <div className="accionesFormularioConfirmacionBotones">
                                <button type="button" className="accionesFormularioBotonConfirmar" onClick={onEliminar} disabled={guardando}>
                                    Si, eliminar
                                </button>
                                <button type="button" className="accionesFormularioBotonCancelarEliminar" onClick={() => setConfirmandoEliminar(false)} disabled={guardando}>
                                    No
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Botones de accion principales */}
            <div className="accionesFormularioContenedor">
                <button type="button" className="accionesFormularioBotonCancelar" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                <button type={onGuardar ? 'button' : 'submit'} className="accionesFormularioBotonGuardar" disabled={guardando} onClick={onGuardar}>
                    {guardando ? 'Guardando...' : textoGuardar}
                </button>
            </div>
        </>
    );
}
