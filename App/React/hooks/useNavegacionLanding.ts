import {useState, useCallback} from 'react';

/*
 * useNavegacionLanding: Hook para manejar la navegación del landing.
 * Encapsula la lógica de scroll suave y cambio de vistas.
 * Soporta navegación a secciones por ID y cambio entre vistas (landing/servicios).
 */

type VistaLanding = 'landing' | 'servicios';

interface UseNavegacionLandingReturn {
    vistaActual: VistaLanding;
    setVistaActual: (vista: VistaLanding) => void;
    handleNavegar: (id: string) => void;
}

export function useNavegacionLanding(vistaInicial: VistaLanding = 'landing'): UseNavegacionLandingReturn {
    const [vistaActual, setVistaActual] = useState<VistaLanding>(vistaInicial);

    const handleNavegar = useCallback(
        (id: string) => {
            if (id === 'servicios') {
                setVistaActual('servicios');
                window.scrollTo({top: 0, behavior: 'smooth'});
            } else {
                /* Si estamos en otra vista, volver a landing primero */
                if (vistaActual !== 'landing') {
                    setVistaActual('landing');
                    /* Pequeño delay para permitir que el DOM se actualice antes de hacer scroll */
                    setTimeout(() => {
                        scrollASeccion(id);
                    }, 100);
                } else {
                    /* Comportamiento normal si ya estamos en landing */
                    scrollASeccion(id);
                }
            }
        },
        [vistaActual]
    );

    return {vistaActual, setVistaActual, handleNavegar};
}

/*
 * Función auxiliar para scroll a una sección específica.
 * Formatea el ID de sección con capitalización correcta.
 */
function scrollASeccion(id: string): void {
    if (id === 'inicio') {
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        const idSeccion = `seccion${id.charAt(0).toUpperCase() + id.slice(1)}`;
        const elemento = document.getElementById(idSeccion);
        if (elemento) {
            elemento.scrollIntoView({behavior: 'smooth'});
        }
    }
}

export default useNavegacionLanding;
