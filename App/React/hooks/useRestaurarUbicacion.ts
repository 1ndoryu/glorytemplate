/*
 * useRestaurarUbicacion — Kamples (C353)
 * Hook dedicado para restaurar samples a su ubicación original asignada por IA.
 * Extraído de useExploradorPagina para cumplir límite de líneas.
 */

import { useCallback } from 'react';
import type { SampleResumen } from '@app/types';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import { obtenerCarpetaPrimaria, obtenerCarpetaSecundaria } from './utils/exploradorPaginaUtils';

/*
 * Lee ia_carpeta_primaria del metadata de un sample (soporta snake_case y camelCase).
 * Retorna string vacío si el campo no existe (sample procesado antes de este cambio).
 */
function obtenerIaCarpetaPrimaria(s: SampleResumen): string {
    const meta = s.metadata as Record<string, unknown> | undefined;
    return (meta?.ia_carpeta_primaria ?? meta?.iaCarpetaPrimaria ?? '') as string;
}

function obtenerIaCarpetaSecundaria(s: SampleResumen): string {
    const meta = s.metadata as Record<string, unknown> | undefined;
    return (meta?.ia_carpeta_secundaria ?? meta?.iaCarpetaSecundaria ?? '') as string;
}

interface UseRestaurarUbicacionArgs {
    todosSamples: SampleResumen[];
    moverSample: (sampleId: number, carpetaPrimaria: string, carpetaSecundaria?: string) => Promise<boolean>;
}

export function useRestaurarUbicacion({ todosSamples, moverSample }: UseRestaurarUbicacionArgs) {
    /*
     * Restaurar un sample a la carpeta que la IA le asignó originalmente.
     * Lee ia_carpeta_primaria / ia_carpeta_secundaria del metadata.
     * Retorna false si no hay datos IA o la operación falla.
     */
    const restaurarUbicacionOriginal = useCallback(async (sampleId: number): Promise<boolean> => {
        const sample = todosSamples.find(s => s.id === sampleId);
        if (!sample) return false;

        const iaPrimaria = obtenerIaCarpetaPrimaria(sample);
        const iaSecundaria = obtenerIaCarpetaSecundaria(sample);

        if (!iaPrimaria) {
            toast.error(getT()('error.sampleSinUbicacion'));
            return false;
        }

        const carpetaActual = obtenerCarpetaPrimaria(sample);
        const subActual = obtenerCarpetaSecundaria(sample);

        if (carpetaActual === iaPrimaria && subActual === iaSecundaria) {
            toast.exito('El sample ya está en su ubicación original.');
            return true;
        }

        return moverSample(sampleId, iaPrimaria, iaSecundaria);
    }, [todosSamples, moverSample]);

    /*
     * Restaurar TODOS los samples a su carpeta IA original.
     * Procesa en lote solo los que tienen ia_carpeta_primaria diferente a la actual.
     */
    const restaurarTodosAOriginal = useCallback(async (): Promise<void> => {
        const samplesParaRestaurar = todosSamples.filter(s => {
            const iaPrimaria = obtenerIaCarpetaPrimaria(s);
            if (!iaPrimaria) return false;
            const actual = obtenerCarpetaPrimaria(s);
            const subActual = obtenerCarpetaSecundaria(s);
            const iaSec = obtenerIaCarpetaSecundaria(s);
            return actual !== iaPrimaria || subActual !== iaSec;
        });

        if (samplesParaRestaurar.length === 0) {
            toast.exito('Todos los samples ya están en su ubicación original.');
            return;
        }

        let exitosos = 0;
        for (const s of samplesParaRestaurar) {
            const iaPrimaria = obtenerIaCarpetaPrimaria(s);
            const iaSec = obtenerIaCarpetaSecundaria(s);
            const ok = await moverSample(s.id, iaPrimaria, iaSec);
            if (ok) exitosos++;
        }
        toast.exito(`${exitosos}/${samplesParaRestaurar.length} samples restaurados a ubicación IA.`);
    }, [todosSamples, moverSample]);

    return { restaurarUbicacionOriginal, restaurarTodosAOriginal };
}
