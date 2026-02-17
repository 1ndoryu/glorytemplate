/*
 * ModalConfigDaw — Modal de configuración general del mezclador DAW (C253)
 * Contiene opciones de snap y ajustes globales del proyecto.
 * Reutiliza clases CSS de modalConfig* del mezclador.
 */

import { X } from 'lucide-react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import type { SnapResolucion } from '../types/mezclador';

interface ModalConfigDawProps {
    abierto: boolean;
    onCerrar: () => void;
}

/* C216: Opciones de snap disponibles */
const OPCIONES_SNAP: { valor: SnapResolucion; label: string; desc: string }[] = [
    { valor: 'bar', label: 'Bar', desc: 'Snap por compás completo' },
    { valor: 'beat', label: 'Beat', desc: 'Snap por pulso (tiempo)' },
    { valor: '1/2', label: '1/2', desc: 'Subdivisión a mitad de beat' },
    { valor: '1/4', label: '1/4', desc: 'Subdivisión a cuarto de beat' },
    { valor: '1/6', label: '1/6', desc: 'Subdivisión a tresillo' },
    { valor: 'off', label: 'Off', desc: 'Sin snap (movimiento libre)' },
];

export const ModalConfigDaw = ({ abierto, onCerrar }: ModalConfigDawProps): JSX.Element | null => {
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const setSnapResolucion = useMezcladorStore(s => s.setSnapResolucion);

    if (!abierto) return null;

    return (
        <div className="modalConfigOverlay" onMouseDown={onCerrar}>
            <div
                className="modalConfigBloque"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modalConfigCabecera">
                    <span className="modalConfigTitulo">Configuración DAW</span>
                    <button className="modalConfigCerrar" onClick={onCerrar}>
                        <X size={14} />
                    </button>
                </div>

                <div className="modalConfigControles">
                    {/* Snap / Cuadrícula */}
                    <div className="modalConfigFila">
                        <label className="modalConfigLabel">Snap</label>
                        <div className="modalConfigSnapOpciones">
                            {OPCIONES_SNAP.map(op => (
                                <button
                                    key={op.valor}
                                    className={`modalConfigSnapBtn ${snapResolucion === op.valor ? 'modalConfigSnapBtnActivo' : ''}`}
                                    onClick={() => setSnapResolucion(op.valor)}
                                    title={op.desc}
                                >
                                    {op.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
