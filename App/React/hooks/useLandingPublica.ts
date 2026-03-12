/*
 * useLandingPublica — Hook de lógica para la landing page pública.
 * Expone navegación y apertura de auth modal.
 */

import { useNavigationStore } from '@/core/router';
import { useAuthModalStore } from '@app/stores/authModalStore';

export const useLandingPublica = () => {
    const navegar = useNavigationStore(s => s.navegar);
    const abrirAuth = useAuthModalStore(s => s.abrir);

    return { navegar, abrirAuth };
};
