/*
 * useDevAccionesRelacion — Hook para acciones de desarrollo en relaciones.
 * Gestiona generacion de recortes y publicacion de extracciones.
 * Extraido de RelacionDetalleIsland para cumplir SRP y max 3 useState.
 */

import { useState, useCallback } from 'react';
import { devGenerarRecorte, devPublicarExtracciones } from '@app/services/apiCanciones';

interface DevAccionesRelacion {
    recorteCargando: boolean;
    recorteMensaje: string | null;
    publicarCargando: boolean;
    publicarMensaje: string | null;
    manejarGenerarRecorte: () => Promise<void>;
    manejarPublicarExtracciones: () => Promise<void>;
}

export const useDevAccionesRelacion = (relacionId: number): DevAccionesRelacion => {
    const [recorteCargando, setRecorteCargando] = useState(false);
    const [recorteMensaje, setRecorteMensaje] = useState<string | null>(null);
    const [publicarCargando, setPublicarCargando] = useState(false);
    const [publicarMensaje, setPublicarMensaje] = useState<string | null>(null);

    const manejarGenerarRecorte = useCallback(async () => {
        if (!relacionId || recorteCargando) return;
        setRecorteCargando(true);
        setRecorteMensaje(null);
        const resp = await devGenerarRecorte(relacionId);
        setRecorteCargando(false);
        if (resp.ok && resp.data) {
            setRecorteMensaje(`${resp.data.mensaje} (${resp.data.encolados} lados)`);
        } else {
            setRecorteMensaje(resp.error ?? 'Error al generar recorte');
        }
    }, [relacionId, recorteCargando]);

    const manejarPublicarExtracciones = useCallback(async () => {
        if (publicarCargando) return;
        setPublicarCargando(true);
        setPublicarMensaje(null);
        const resp = await devPublicarExtracciones();
        setPublicarCargando(false);
        if (resp.ok && resp.data) {
            const d = resp.data;
            setPublicarMensaje(
                d.publicados > 0
                    ? `Publicados: ${d.publicados} samples` + (d.errores > 0 ? ` (${d.errores} errores)` : '')
                    : d.mensaje ?? 'Sin extracciones pendientes'
            );
        } else {
            setPublicarMensaje(resp.error ?? 'Error al publicar');
        }
    }, [publicarCargando]);

    return {
        recorteCargando,
        recorteMensaje,
        publicarCargando,
        publicarMensaje,
        manejarGenerarRecorte,
        manejarPublicarExtracciones,
    };
};
