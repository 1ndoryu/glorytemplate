/*
 * Hook: useValorCongelado — Kamples
 * Devuelve el último valor "descongelado". Cuando congelar es true,
 * el hook ignora actualizaciones del valor entrante y retorna el
 * valor que tenía la última vez que congelar era false.
 *
 * Caso de uso principal: en PageRenderer keep-alive, las islas
 * ocultas (display:none) siguen montadas y sus hooks reactivos
 * ven cambios de stores globales (rutaActual, tabActiva). Este hook
 * "congela" esos valores cuando la isla no está activa, evitando
 * re-fetches innecesarios en islas ocultas.
 */

import { useRef } from 'react';

export function useValorCongelado<T>(valor: T, congelar: boolean): T {
    const ultimoRef = useRef(valor);

    if (!congelar) {
        ultimoRef.current = valor;
    }

    return ultimoRef.current;
}
