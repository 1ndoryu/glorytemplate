/*
 * ModalConfigDaw — Configuración general del mezclador DAW (C253)
 * C287: Migrado a VentanaFlotante (ventana draggable, minimizable).
 * Contiene opciones de snap y ajustes globales del proyecto.
 */

import { VentanaFlotante } from './VentanaFlotante';
import type { SnapResolucion } from '../types/mezclador';
import { useModalConfigDaw } from '../hooks/useModalConfigDaw';
import { BotonBase } from '@app/components/ui/BotonBase';

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
    const { snapResolucion, setSnapResolucion, ventanaId } = useModalConfigDaw({ abierto, onCerrar });

    if (!abierto) return null;

    return (
        <VentanaFlotante id={ventanaId} titulo="Configuración DAW" ancho={360}>
            <div className="configBloqueContenido">
                <div className="configBloqueSeccion">
                    <h4 className="configBloqueSeccionTitulo">Snap / Cuadrícula</h4>
                    <div className="configBloqueFila">
                        <label className="configBloqueLabel">Snap</label>
                        <div className="configBloqueModoTonal">
                            {OPCIONES_SNAP.map(op => (
                                <BotonBase variante="ghost"
                                    key={op.valor}
                                    className={`configBloqueModoBtn ${snapResolucion === op.valor ? 'activo' : ''}`}
                                    onClick={() => setSnapResolucion(op.valor)}
                                    title={op.desc}
                                >
                                    {op.label}
                                </BotonBase>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </VentanaFlotante>
    );
};
