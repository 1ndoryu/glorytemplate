/*
 * Hook: useBotonExperimentos
 * Lógica de ejecución de experimentos admin (generar contenido test, embeddings).
 * Maneja estado del botón, resultados, y validación de rol admin.
 * Extraído de BotonExperimentos para cumplir SRP.
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { generarExperimento, generarEmbeddings, regenerarEmbeddings } from '@app/services/apiExperimentos';

type EstadoBoton = 'idle' | 'cargando' | 'exito' | 'error';

export const useBotonExperimentos = () => {
    const usuario = useAuthStore(s => s.usuario);
    const [estado, setEstado] = useState<EstadoBoton>('idle');
    const [panelVisible, setPanelVisible] = useState(false);
    const [ultimoResultado, setUltimoResultado] = useState<string | null>(null);

    const ejecutar = useCallback(async (acciones?: ('usuario' | 'notificacion' | 'mensaje')[]) => {
        setEstado('cargando');
        setUltimoResultado(null);

        try {
            const resp = await generarExperimento(acciones);
            console.log('[Experimentos] Respuesta completa:', resp);

            if (resp.ok && resp.data) {
                setEstado('exito');
                const raw = resp.data as Record<string, unknown>;
                const d = (raw.data ?? raw) as Record<string, Record<string, unknown>>;
                const partes: string[] = [];

                if (d.usuario) partes.push(`Usuario: ${d.usuario.username ?? d.usuario.pgId}`);
                if (d.notificacion) partes.push(`Notif: ${d.notificacion.tipo}`);
                if (d.mensaje) partes.push(`Msg: "${String(d.mensaje.contenido ?? d.mensaje.mensaje ?? '').slice(0, 40)}"`);

                setUltimoResultado(partes.length > 0 ? partes.join(' | ') : 'Ejecutado correctamente');
            } else {
                setEstado('error');
                setUltimoResultado(resp.error ?? 'Error desconocido');
                console.error('[Experimentos] Error:', resp.error, resp);
            }
        } catch {
            setEstado('error');
            setUltimoResultado('Error de red');
        }

        setTimeout(() => setEstado('idle'), 3000);
    }, []);

    const ejecutarEmbeddings = useCallback(async (regenerar = false) => {
        setEstado('cargando');
        setUltimoResultado(null);
        try {
            const resp = regenerar ? await regenerarEmbeddings() : await generarEmbeddings();
            if (resp.ok && resp.data) {
                setEstado('exito');
                const d = resp.data;
                setUltimoResultado(`Embeddings: ${d.actualizados ?? 0} en ${d.tiempoMs ?? 0}ms`);
            } else {
                setEstado('error');
                setUltimoResultado(resp.error ?? 'Error embeddings');
            }
        } catch {
            setEstado('error');
            setUltimoResultado('Error de red');
        }
        setTimeout(() => setEstado('idle'), 3000);
    }, []);

    const esAdmin = usuario?.rol === 'admin';
    const togglePanel = () => setPanelVisible((v) => !v);

    return {
        estado,
        panelVisible,
        ultimoResultado,
        esAdmin,
        ejecutar,
        ejecutarEmbeddings,
        togglePanel,
    };
};
