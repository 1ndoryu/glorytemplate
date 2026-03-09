/*
 * Componente: ModalPublicar — Kamples
 * Wrapper legacy que reutiliza el flujo unificado de ContenidoCrear.
 * Así SeccionPublicar y los modales comparten exactamente el mismo manejo de audio, imágenes y pegado.
 */

import { Modal } from '@app/components/ui/Modal';
import { ContenidoCrear } from '@app/components/social/ContenidoCrear';
import { usePublicarModalStore } from '@app/stores/publicarModalStore';
import { useAuthStore } from '@app/stores/authStore';

export const ModalPublicar = (): JSX.Element | null => {
    const abierto = usePublicarModalStore(s => s.abierto);
    const modo = usePublicarModalStore(s => s.modo);
    const cerrar = usePublicarModalStore(s => s.cerrar);
    const autenticado = useAuthStore(s => s.autenticado);

    if (!abierto || !autenticado) return null;

    const placeholder = modo === 'sample'
        ? 'Comparte tu sample con la comunidad...'
        : '¿Qué estás creando?';

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="normal">
            <ContenidoCrear autoFocus placeholder={placeholder} alCompletarPublicacion={cerrar} />
        </Modal>
    );
};

export default ModalPublicar;
