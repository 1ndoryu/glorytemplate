/*
 * useLocalStorage
 * Hook genérico para persistir estado en localStorage
 * Responsabilidad única: sincronizar un valor de estado con localStorage
 */

import {useState, useCallback, useEffect} from 'react';

interface UseLocalStorageConfig<T> {
    validarValor?: (valor: unknown) => boolean;
    valorPorDefecto: T;
}

interface UseLocalStorageReturn<T> {
    valor: T;
    setValor: (nuevoValor: T | ((prev: T) => T)) => void;
    eliminar: () => void;
    cargando: boolean;
}

/*
 * Hook para sincronizar estado con localStorage
 * Incluye validación, hidratación y manejo de errores
 */
export function useLocalStorage<T>(clave: string, config: UseLocalStorageConfig<T>): UseLocalStorageReturn<T> {
    const {valorPorDefecto, validarValor} = config;
    const [cargando, setCargando] = useState(true);
    const [valor, setValorInterno] = useState<T>(valorPorDefecto);

    /*
     * Hidratación: carga el valor de localStorage al montar
     * Se ejecuta solo una vez para evitar problemas de SSG/SSR
     */
    useEffect(() => {
        try {
            const valorAlmacenado = localStorage.getItem(clave);

            if (valorAlmacenado === null) {
                setCargando(false);
                return;
            }

            const valorParseado = JSON.parse(valorAlmacenado) as T;

            if (validarValor && !validarValor(valorParseado)) {
                console.warn(`[useLocalStorage] Valor inválido para clave "${clave}", usando valor por defecto`);
                setCargando(false);
                return;
            }

            setValorInterno(valorParseado);
        } catch (error) {
            console.error(`[useLocalStorage] Error al leer clave "${clave}":`, error);
        } finally {
            setCargando(false);
        }
    }, [clave, validarValor]);

    /*
     * Actualiza el valor en estado y localStorage
     * Soporta tanto valores directos como funciones de actualización
     */
    const setValor = useCallback(
        (nuevoValor: T | ((prev: T) => T)) => {
            setValorInterno(prevValor => {
                const valorFinal = typeof nuevoValor === 'function' ? (nuevoValor as (prev: T) => T)(prevValor) : nuevoValor;

                try {
                    localStorage.setItem(clave, JSON.stringify(valorFinal));
                } catch (error) {
                    console.error(`[useLocalStorage] Error al guardar clave "${clave}":`, error);
                }

                return valorFinal;
            });
        },
        [clave]
    );

    /*
     * Elimina el valor de localStorage y restaura el valor por defecto
     */
    const eliminar = useCallback(() => {
        try {
            localStorage.removeItem(clave);
            setValorInterno(valorPorDefecto);
        } catch (error) {
            console.error(`[useLocalStorage] Error al eliminar clave "${clave}":`, error);
        }
    }, [clave, valorPorDefecto]);

    return {valor, setValor, eliminar, cargando};
}

/*
 * Claves estandarizadas para el dashboard
 * Centralizadas para evitar errores de escritura
 */
export const CLAVES_LOCALSTORAGE = {
    habitos: 'dashboard_habitos',
    tareas: 'dashboard_tareas',
    notas: 'dashboard_notas',
    configuracion: 'dashboard_config',
    proyectos: 'dashboard_proyectos'
} as const;
