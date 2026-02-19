/*
 * ModalConfigDaw — Configuración general del mezclador DAW (C253)
 * C287: Migrado a VentanaFlotante (ventana draggable, minimizable).
 * Contiene opciones de snap y ajustes globales del proyecto.
 */

import { useEffect } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { useVentanasStore } from '../stores/ventanasStore';
import { VentanaFlotante } from './VentanaFlotante';
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

const VENTANA_ID = 'config-daw';

export const ModalConfigDaw = ({ abierto, onCerrar }: ModalConfigDawProps): JSX.Element | null => {
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const setSnapResolucion = useMezcladorStore(s => s.setSnapResolucion);
    const abrirVentana = useVentanasStore(s => s.abrirVentana);
    const cerrarVentana = useVentanasStore(s => s.cerrarVentana);
    const ventana = useVentanasStore(s => s.ventanas.find(v => v.id === VENTANA_ID));

    /* Registrar/cerrar ventana según prop abierto */
    useEffect(() => {
        if (abierto) {
            abrirVentana({
                id: VENTANA_ID,
                tipo: 'configDaw',
                titulo: 'Configuración DAW',
                posicion: {
                    x: Math.max(20, Math.round(window.innerWidth / 2 - 175)),
                    y: Math.max(20, Math.round(window.innerHeight / 2 - 120)),
                },
            });
        } else {
            cerrarVentana(VENTANA_ID);
        }
    }, [abierto]);

    /* Si la ventana fue cerrada desde VentanaFlotante, propagar al padre */
    useEffect(() => {
        if (abierto && ventana === undefined) {
            onCerrar();
        }
    }, [ventana, abierto, onCerrar]);

    if (!abierto) return null;

    return (
        <VentanaFlotante id={VENTANA_ID} titulo="Configuración DAW" ancho={360}>
            <div className="configBloqueContenido">
                <div className="configBloqueSeccion">
                    <h4 className="configBloqueSeccionTitulo">Snap / Cuadrícula</h4>
                    <div className="configBloqueFila">
                        <label className="configBloqueLabel">Snap</label>
                        <div className="configBloqueModoTonal">
                            {OPCIONES_SNAP.map(op => (
                                <button
                                    key={op.valor}
                                    className={`configBloqueModoBtn ${snapResolucion === op.valor ? 'activo' : ''}`}
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
        </VentanaFlotante>
    );
};
