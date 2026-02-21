/*
 * Componente: ModalCrear — Kamples (C124)
 * Modal unificado para crear publicaciones y subir samples.
 * Delega toda la UI a ContenidoCrear (componente compartido con SeccionPublicar).
 */

import { Modal } from '@app/components/ui/Modal';
import { ContenidoCrear } from '@app/components/social/ContenidoCrear';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';

export const ModalCrear = (): JSX.Element | null => {
    const abierto = useCrearModalStore(s => s.abierto);
    const cerrar = useCrearModalStore(s => s.cerrar);
    const autenticado = useAuthStore(s => s.autenticado);

    if (!abierto || !autenticado) return null;

    return (
        <Modal abierto={abierto} onCerrar={cerrar}>
            <ContenidoCrear autoFocus alCompletarPublicacion={cerrar} />
        </Modal>
    );
};

export default ModalCrear;
