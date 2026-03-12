/*
 * Hook: useModalGeneros — Kamples (QQ45)
 * Logica de seleccion de generos favoritos para onboarding.
 * Gestiona estado de seleccion, guardado via API y sync con authStore.
 */

import { useState, useCallback } from 'react';
import { useGenerosModalStore } from '@app/stores/generosModalStore';
import { useAuthStore } from '@app/stores';
import { actualizarPerfil } from '@app/services/apiAuth';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('ModalGeneros');

/* Whitelist de generos disponibles — debe coincidir con backend GENEROS_PERMITIDOS */
export const GENEROS_DISPONIBLES = [
    'Hip-Hop', 'Trap', 'R&B', 'Pop', 'House', 'Techno', 'Drum and Bass',
    'Dubstep', 'Lo-Fi', 'Ambient', 'Jazz', 'Soul', 'Funk', 'Reggaeton',
    'Rock', 'Metal', 'Indie', 'Electronic', 'EDM', 'Future Bass',
    'Garage', 'Grime', 'Afrobeat', 'Latin', 'Classical', 'Country',
    'Disco', 'Phonk', 'Drill', 'Dancehall',
] as const;

const MAX_GENEROS = 10;
const MIN_GENEROS = 1;

export function useModalGeneros() {
    const abierto = useGenerosModalStore((s) => s.abierto);
    const cerrar = useGenerosModalStore((s) => s.cerrar);
    const usuario = useAuthStore((s) => s.usuario);
    const setUsuario = useAuthStore((s) => s.setUsuario);

    const generosIniciales = usuario?.generosPreferidos ?? [];
    const [seleccionados, setSeleccionados] = useState<string[]>(generosIniciales);
    const [guardando, setGuardando] = useState(false);
    const [tagPersonalizado, setTagPersonalizado] = useState('');

    /* Sincronizar seleccion al abrir */
    const sincronizar = useCallback(() => {
        setSeleccionados(usuario?.generosPreferidos ?? []);
        setTagPersonalizado('');
    }, [usuario?.generosPreferidos]);

    const toggleGenero = useCallback((genero: string) => {
        const generoLower = genero.toLowerCase();
        setSeleccionados((prev) => {
            if (prev.includes(generoLower)) {
                return prev.filter((g) => g !== generoLower);
            }
            if (prev.length >= MAX_GENEROS) return prev;
            return [...prev, generoLower];
        });
    }, []);

    /* Agrega un tag personalizado escrito por el usuario */
    const agregarPersonalizado = useCallback(() => {
        const limpio = tagPersonalizado.trim().toLowerCase().slice(0, 30);
        if (!limpio) return;
        setSeleccionados((prev) => {
            if (prev.includes(limpio) || prev.length >= MAX_GENEROS) return prev;
            return [...prev, limpio];
        });
        setTagPersonalizado('');
    }, [tagPersonalizado]);

    const guardar = useCallback(async () => {
        if (seleccionados.length < MIN_GENEROS) return;
        setGuardando(true);

        const resp = await actualizarPerfil({ generosPreferidos: seleccionados });

        if (resp.ok && resp.data && usuario) {
            setUsuario({ ...usuario, generosPreferidos: seleccionados });
            cerrar();
        } else {
            log.error('Error guardando generos', resp.error);
        }

        setGuardando(false);
    }, [seleccionados, usuario, setUsuario, cerrar]);

    const puedeGuardar = seleccionados.length >= MIN_GENEROS && !guardando;

    return {
        abierto,
        seleccionados,
        guardando,
        puedeGuardar,
        toggleGenero,
        agregarPersonalizado,
        tagPersonalizado,
        setTagPersonalizado,
        guardar,
        cerrar,
        sincronizar,
        limiteAlcanzado: seleccionados.length >= MAX_GENEROS,
    };
}
