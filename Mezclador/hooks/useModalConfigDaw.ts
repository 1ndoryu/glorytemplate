/*
 * useModalConfigDaw — Lógica del modal de configuración DAW.
 * Gestiona ventana flotante, snap resolution y cierre externo.
 */

import { useEffect, useRef } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { useVentanasStore } from '../stores/ventanasStore';

const VENTANA_ID = 'config-daw';

interface UseModalConfigDawParams {
    abierto: boolean;
    onCerrar: () => void;
}

export const useModalConfigDaw = ({ abierto, onCerrar }: UseModalConfigDawParams) => {
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const setSnapResolucion = useMezcladorStore(s => s.setSnapResolucion);
    const abrirVentana = useVentanasStore(s => s.abrirVentana);
    const cerrarVentana = useVentanasStore(s => s.cerrarVentana);
    const ventana = useVentanasStore(s => s.ventanas.find(v => v.id === VENTANA_ID));

    /* Registrar/cerrar ventana segun prop abierto */
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

    /*
     * C324: Detectar cierre externo — solo cerrar si la ventana fue vista
     * al menos una vez y luego desaparece.
     */
    const ventanaVista = useRef(false);
    useEffect(() => {
        if (!abierto) { ventanaVista.current = false; return; }
        if (ventana !== undefined) {
            ventanaVista.current = true;
        } else if (ventanaVista.current) {
            onCerrar();
        }
    }, [ventana, abierto, onCerrar]);

    return {
        snapResolucion,
        setSnapResolucion,
        ventanaId: VENTANA_ID,
    };
};
