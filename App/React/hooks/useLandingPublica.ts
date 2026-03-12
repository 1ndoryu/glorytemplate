/*
 * useLandingPublica — Hook de lógica para la landing page pública.
 * Expone navegación y apertura de auth modal.
 */

import { useAuthModalStore } from '@app/stores/authModalStore';

export const useLandingPublica = () => {
    const abrirAuth = useAuthModalStore(s => s.abrir);

    return { abrirAuth };
};
