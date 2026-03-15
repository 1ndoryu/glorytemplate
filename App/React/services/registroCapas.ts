/*
 * Servicio: registroCapas — Kamples (QL17)
 * Registro centralizado de capas modales/overlays cerrables.
 * Cada capa se registra con un id unico y una funcion cerrar.
 * Se utiliza una pila (LIFO) para cerrar siempre la capa superior.
 * Componentes se registran via useRegistrarCapa; el back handler
 * consulta este registro para decidir que cerrar al presionar atras.
 */

interface CapaRegistrada {
    id: string;
    cerrar: () => void;
    orden: number;
}

let pila: CapaRegistrada[] = [];
let contadorOrden = 0;

/*
 * Registra una capa cerrable en la pila.
 * Retorna funcion de desregistro (para cleanup en useEffect).
 * Si ya existe una capa con el mismo id, se reemplaza.
 */
export function registrarCapa(id: string, cerrar: () => void): () => void {
    const existente = pila.findIndex(c => c.id === id);
    if (existente !== -1) {
        pila.splice(existente, 1);
    }

    pila.push({ id, cerrar, orden: ++contadorOrden });

    return () => {
        pila = pila.filter(c => c.id !== id);
    };
}

/*
 * Cierra la capa superior (la mas recientemente registrada).
 * Retorna true si se cerro algo, false si la pila estaba vacia.
 */
export function cerrarCapaSuperior(): boolean {
    if (pila.length === 0) return false;
    const capa = pila.pop();
    if (capa) {
        capa.cerrar();
        return true;
    }
    return false;
}

/* Indica si hay capas abiertas en el registro */
export function hayCapasAbiertas(): boolean {
    return pila.length > 0;
}

/* Cantidad de capas actualmente registradas */
export function cantidadCapas(): number {
    return pila.length;
}
