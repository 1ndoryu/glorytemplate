/**
 * Hook: usePerfil
 * Encapsula el estado del formulario de perfil de usuario.
 * Extrae la logica de SeccionPerfil para cumplir SRP (max 3 useState).
 * TO-DO: Conectar con REST API backend para persistir cambios.
 */
import {useState} from 'react';
import {obtenerUsuarioActual} from '../data/panel';

interface EstadoPerfil {
    nombre: string;
    descripcion: string;
    linkedin: string;
    twitter: string;
    website: string;
}

interface RetornoUsePerfil {
    estado: EstadoPerfil;
    guardado: boolean;
    actualizarCampo: (campo: keyof EstadoPerfil, valor: string) => void;
    handleGuardar: (e: React.FormEvent) => void;
    usuario: ReturnType<typeof obtenerUsuarioActual>;
}

export const usePerfil = (): RetornoUsePerfil => {
    const usuario = obtenerUsuarioActual();

    const [estado, setEstado] = useState<EstadoPerfil>({
        nombre: usuario?.nombre || '',
        descripcion: '',
        linkedin: '',
        twitter: '',
        website: ''
    });

    const [guardado, setGuardado] = useState(false);

    const actualizarCampo = (campo: keyof EstadoPerfil, valor: string) => {
        setEstado(prev => ({...prev, [campo]: valor}));
    };

    const handleGuardar = (e: React.FormEvent) => {
        e.preventDefault();
        /* TO-DO: Enviar a backend via REST API (Glory API) */
        setGuardado(true);
        setTimeout(() => setGuardado(false), 3000);
    };

    return {estado, guardado, actualizarCampo, handleGuardar, usuario};
};
