/*
 * CampoFechaLimite
 * Campo de fecha con indicador de urgencia visual
 * Extraido de PanelConfiguracionTarea para reutilizacion
 */

import {X, AlertCircle} from 'lucide-react';
import {SeccionPanel} from './SeccionPanel';

type EstadoFecha = 'vencida' | 'urgente' | 'proxima' | 'normal' | null;

interface CampoFechaLimiteProps {
    titulo?: string;
    valor: string;
    onChange: (valor: string) => void;
    mostrarBotonLimpiar?: boolean;
    disabled?: boolean;
}

function calcularEstadoFecha(fecha: string): EstadoFecha {
    if (!fecha) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaLimite = new Date(fecha);
    const diferenciaDias = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) return 'vencida';
    if (diferenciaDias === 0) return 'urgente';
    if (diferenciaDias <= 3) return 'proxima';
    return 'normal';
}

export function CampoFechaLimite({titulo = 'Fecha Limite', valor, onChange, mostrarBotonLimpiar = true, disabled = false}: CampoFechaLimiteProps): JSX.Element {
    const estadoFecha = calcularEstadoFecha(valor);

    const claseEstado = estadoFecha ? `campoFechaLimite${estadoFecha.charAt(0).toUpperCase() + estadoFecha.slice(1)}` : '';

    return (
        <SeccionPanel titulo={titulo}>
            <div className={`campoFechaLimiteContenedor ${claseEstado}`}>
                <input type="date" className="campoFechaLimiteInput" value={valor} onChange={e => onChange(e.target.value)} disabled={disabled} />

                {estadoFecha === 'vencida' && (
                    <span className="campoFechaLimiteAlerta campoFechaLimiteAlertaVencida">
                        <AlertCircle size={12} />
                        Vencida
                    </span>
                )}

                {estadoFecha === 'urgente' && (
                    <span className="campoFechaLimiteAlerta campoFechaLimiteAlertaUrgente">
                        <AlertCircle size={12} />
                        Hoy
                    </span>
                )}

                {estadoFecha === 'proxima' && <span className="campoFechaLimiteAlerta campoFechaLimiteAlertaProxima">Pronto</span>}

                {mostrarBotonLimpiar && valor && (
                    <button type="button" className="campoFechaLimiteBotonLimpiar" onClick={() => onChange('')} title="Quitar fecha" disabled={disabled}>
                        <X size={12} />
                    </button>
                )}
            </div>
        </SeccionPanel>
    );
}

export {calcularEstadoFecha};
export type {EstadoFecha};
