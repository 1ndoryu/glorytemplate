/*
 * useDevAccionesRelacion — Hook para generar recorte + publicar en un solo paso.
 * Extraido de RelacionDetalleIsland para cumplir SRP y max 3 useState.
 */

import { useState, useCallback } from 'react';
import { devGenerarRecorte } from '@app/services/apiCanciones';

interface DevAccionesRelacion {
    recorteCargando: boolean;
    recorteMensaje: string | null;
    manejarGenerarRecorte: () => Promise<void>;
}

export const useDevAccionesRelacion = (relacionId: number): DevAccionesRelacion => {
    const [recorteCargando, setRecorteCargando] = useState(false);
    const [recorteMensaje, setRecorteMensaje] = useState<string | null>(null);

    const manejarGenerarRecorte = useCallback(async () => {
        if (!relacionId || recorteCargando) return;
        setRecorteCargando(true);
        setRecorteMensaje(null);
        const resp = await devGenerarRecorte(relacionId);
        setRecorteCargando(false);
        if (resp.ok && resp.data) {
            const d = resp.data;
            const partes: string[] = [];
            if (d.encolados > 0) partes.push(`${d.encolados} lados encolados`);
            if (d.publicados != null && d.publicados > 0) {
                partes.push(`${d.publicados} publicados${(d.errores ?? 0) > 0 ? ` (${d.errores} err)` : ''}`);
            }
            const base = partes.length > 0 ? partes.join(' · ') : (d.mensaje ?? 'Listo');
            setRecorteMensaje(base + (d.encolados > 0 && d.publicados == null ? ' · publicación en ~3min' : ''));
        } else {
            setRecorteMensaje(resp.error ?? 'Error al generar recorte');
        }
    }, [relacionId, recorteCargando]);

    return { recorteCargando, recorteMensaje, manejarGenerarRecorte };
};
