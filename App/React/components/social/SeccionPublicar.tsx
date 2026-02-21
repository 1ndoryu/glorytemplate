/*
 * Componente: SeccionPublicar — Kamples (C124)
 * Sección inline para crear publicaciones y subir samples.
 * Mismo formulario que ModalCrear pero sin wrapper modal.
 * Comparte ContenidoCrear para consistencia total.
 */

import { ContenidoCrear } from '@app/components/social/ContenidoCrear';
import { useAuthStore } from '@app/stores/authStore';
import '@app/styles/componentes/seccionPublicar.css';

interface SeccionPublicarProps {
    alPublicar?: () => void;
    placeholder?: string;
}

export const SeccionPublicar = ({ alPublicar, placeholder }: SeccionPublicarProps): JSX.Element | null => {
    const autenticado = useAuthStore(s => s.autenticado);

    if (!autenticado) return null;

    return (
        <div className="seccionPublicar">
            <ContenidoCrear placeholder={placeholder} alCompletarPublicacion={alPublicar} />
        </div>
    );
};

export default SeccionPublicar;
