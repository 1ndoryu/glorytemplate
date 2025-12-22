/*
 * AlertaConfirmacion
 * Modal de confirmacion que reemplaza confirm() nativo
 * Soporta tipos: normal, advertencia y peligro
 */

import {useEffect, useCallback} from 'react';
import {AlertTriangle, HelpCircle} from 'lucide-react';
import type {AlertaConfirmacion as TipoAlertaConfirmacion} from '../../hooks/useAlertas';

interface AlertaConfirmacionProps {
    alerta: TipoAlertaConfirmacion;
    onResponder: (aceptar: boolean) => void;
}

export function AlertaConfirmacion({alerta, onResponder}: AlertaConfirmacionProps): JSX.Element {
    const {titulo, mensaje, textoAceptar, textoCancelar, tipo} = alerta;

    /*
     * Maneja teclas: Enter para aceptar, Escape para cancelar
     */
    const manejarTecla = useCallback(
        (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                onResponder(false);
            } else if (evento.key === 'Enter') {
                onResponder(true);
            }
        },
        [onResponder]
    );

    useEffect(() => {
        document.addEventListener('keydown', manejarTecla);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', manejarTecla);
            document.body.style.overflow = '';
        };
    }, [manejarTecla]);

    const manejarClickOverlay = (evento: React.MouseEvent<HTMLDivElement>) => {
        if (evento.target === evento.currentTarget) {
            onResponder(false);
        }
    };

    const obtenerClaseTipo = (): string => {
        switch (tipo) {
            case 'peligro':
                return 'alertaConfirmacion--peligro';
            case 'advertencia':
                return 'alertaConfirmacion--advertencia';
            default:
                return '';
        }
    };

    const Icono = tipo === 'peligro' || tipo === 'advertencia' ? AlertTriangle : HelpCircle;

    return (
        <div id="alerta-confirmacion-overlay" className="alertaConfirmacionOverlay" onClick={manejarClickOverlay}>
            <div id="alerta-confirmacion-modal" className={`alertaConfirmacionModal ${obtenerClaseTipo()}`} role="alertdialog" aria-modal="true" aria-labelledby="alerta-confirmacion-titulo" aria-describedby="alerta-confirmacion-mensaje">
                <div className="alertaConfirmacionEncabezado">
                    <div className={`alertaConfirmacionIcono alertaConfirmacionIcono--${tipo ?? 'normal'}`}>
                        <Icono size={20} />
                    </div>
                    <h3 id="alerta-confirmacion-titulo" className="alertaConfirmacionTitulo">
                        {titulo}
                    </h3>
                </div>

                <p id="alerta-confirmacion-mensaje" className="alertaConfirmacionMensaje">
                    {mensaje}
                </p>

                <div className="alertaConfirmacionAcciones">
                    <button className="alertaConfirmacionBoton alertaConfirmacionBoton--cancelar" onClick={() => onResponder(false)} type="button">
                        {textoCancelar}
                    </button>
                    <button className={`alertaConfirmacionBoton alertaConfirmacionBoton--aceptar alertaConfirmacionBoton--${tipo ?? 'normal'}`} onClick={() => onResponder(true)} type="button" autoFocus>
                        {textoAceptar}
                    </button>
                </div>
            </div>
        </div>
    );
}
