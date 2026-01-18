import {useState, useCallback} from 'react';

/*
 * useModal: Hook genérico para manejo de modales.
 * Encapsula el estado de visibilidad y el item seleccionado.
 * Incluye delay configurable para animaciones de salida.
 */

interface UseModalOptions {
    /* Delay en ms antes de limpiar el item seleccionado (para animaciones de salida) */
    delayLimpiar?: number;
}

interface UseModalReturn<T> {
    visible: boolean;
    itemSeleccionado: T | null;
    abrir: (item: T) => void;
    cerrar: () => void;
}

export function useModal<T>(opciones: UseModalOptions = {}): UseModalReturn<T> {
    const {delayLimpiar = 250} = opciones;

    const [visible, setVisible] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState<T | null>(null);

    const abrir = useCallback((item: T) => {
        setItemSeleccionado(item);
        setVisible(true);
    }, []);

    const cerrar = useCallback(() => {
        setVisible(false);
        /*
         * Delay para limpiar el item después de la animación de salida.
         * Esto evita que el contenido desaparezca antes de terminar la transición.
         */
        setTimeout(() => {
            setItemSeleccionado(null);
        }, delayLimpiar);
    }, [delayLimpiar]);

    return {visible, itemSeleccionado, abrir, cerrar};
}

export default useModal;
