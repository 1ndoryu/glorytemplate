/*
 * Hook: useBackHandler — Kamples (QL17)
 * Intercepta el boton atras (popstate) en fase de captura para cerrar
 * modales, dropdowns y chats antes de que el router SPA procese la navegacion.
 *
 * Estrategia:
 * 1. Captura popstate ANTES del navigationStore (capture phase).
 * 2. Consulta registroCapas (prioridad) y luego Zustand stores conocidos (fallback).
 * 3. Si cierra algo: re-push la ruta actual para anular la navegacion y stopImmediatePropagation.
 * 4. Si no hay nada que cerrar: deja pasar el evento al router SPA.
 *
 * Escalabilidad: componentes nuevos solo necesitan llamar useRegistrarCapa
 * para integrarse automaticamente. Los stores legacy se revisan como fallback
 * hasta que migren al registro.
 */

import { useEffect } from 'react';
import { cerrarCapaSuperior, hayCapasAbiertas } from '@app/services/registroCapas';
import { useNavigationStore } from '@/core/router';

/* Importaciones de stores — se consultan via getState() fuera de React */
import { useAuthModalStore } from '@app/stores/authModalStore';
import { useCompraModalStore } from '@app/stores/compraModalStore';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useCorregirIAStore } from '@app/stores/corregirIAStore';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useEditarModalStore } from '@app/stores/editarModalStore';
import { useExtenderRecorteStore } from '@app/stores/extenderRecorteStore';
import { useGenerosModalStore } from '@app/stores/generosModalStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { usePublicarModalStore } from '@app/stores/publicarModalStore';
import { useSeguidoresModalStore } from '@app/stores/seguidoresModalStore';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { useVisorImagenStore } from '@app/stores/visorImagenStore';
import { useReportarStore } from '@app/stores/reportarStore';
import { useChatFlotanteStore } from '@app/stores/chatFlotanteStore';

/*
 * Lista de stores con patron abierto/cerrar, ordenados por prioridad visual
 * (el mas "encima" se cierra primero).
 * Para agregar un store nuevo: anadir una entrada aqui.
 */
interface CapaFallback {
    nombre: string;
    estaAbierta: () => boolean;
    cerrar: () => void;
}

const capasFallback: CapaFallback[] = [
    /* Overlays de maxima prioridad (cubren toda la pantalla) */
    {
        nombre: 'visorImagen',
        estaAbierta: () => useVisorImagenStore.getState().url !== null,
        cerrar: () => useVisorImagenStore.getState().cerrar(),
    },
    /* Chat flotante — cerrar el ultimo chat abierto */
    {
        nombre: 'chatFlotante',
        estaAbierta: () => useChatFlotanteStore.getState().chatsAbiertos.length > 0,
        cerrar: () => {
            const chats = useChatFlotanteStore.getState().chatsAbiertos;
            if (chats.length > 0) {
                useChatFlotanteStore.getState().cerrarChat(chats[chats.length - 1].conversacionId);
            }
        },
    },
    /* Modales principales */
    {
        nombre: 'authModal',
        estaAbierta: () => useAuthModalStore.getState().abierto,
        cerrar: () => useAuthModalStore.getState().cerrar(),
    },
    {
        nombre: 'compraModal',
        estaAbierta: () => useCompraModalStore.getState().abierto,
        cerrar: () => useCompraModalStore.getState().cerrar(),
    },
    {
        nombre: 'planesModal',
        estaAbierta: () => usePlanesModalStore.getState().abierto,
        cerrar: () => usePlanesModalStore.getState().cerrar(),
    },
    {
        nombre: 'corregirIA',
        estaAbierta: () => useCorregirIAStore.getState().abierto,
        cerrar: () => useCorregirIAStore.getState().cerrar(),
    },
    {
        nombre: 'extenderRecorte',
        estaAbierta: () => useExtenderRecorteStore.getState().abierto,
        cerrar: () => useExtenderRecorteStore.getState().cerrar(),
    },
    {
        nombre: 'subirModal',
        estaAbierta: () => useSubirModalStore.getState().abierto,
        cerrar: () => useSubirModalStore.getState().cerrar(),
    },
    {
        nombre: 'crearModal',
        estaAbierta: () => useCrearModalStore.getState().abierto,
        cerrar: () => useCrearModalStore.getState().cerrar(),
    },
    {
        nombre: 'editarModal',
        estaAbierta: () => useEditarModalStore.getState().abierto,
        cerrar: () => useEditarModalStore.getState().cerrar(),
    },
    {
        nombre: 'publicarModal',
        estaAbierta: () => usePublicarModalStore.getState().abierto,
        cerrar: () => usePublicarModalStore.getState().cerrar(),
    },
    {
        nombre: 'seguidoresModal',
        estaAbierta: () => useSeguidoresModalStore.getState().abierto,
        cerrar: () => useSeguidoresModalStore.getState().cerrar(),
    },
    {
        nombre: 'generosModal',
        estaAbierta: () => useGenerosModalStore.getState().abierto,
        cerrar: () => useGenerosModalStore.getState().cerrar(),
    },
    {
        nombre: 'coleccionPicker',
        estaAbierta: () => useColeccionPickerStore.getState().abierto,
        cerrar: () => useColeccionPickerStore.getState().cerrar(),
    },
    {
        nombre: 'configuracionModal',
        estaAbierta: () => useConfiguracionModalStore.getState().abierto,
        cerrar: () => useConfiguracionModalStore.getState().cerrar(),
    },
    {
        nombre: 'reportar',
        estaAbierta: () => useReportarStore.getState().abierto,
        cerrar: () => useReportarStore.getState().cerrar(),
    },
];

/*
 * Intenta cerrar la capa abierta de mayor prioridad.
 * Primero consulta el registro dinamico, luego el fallback de stores.
 * Retorna true si se cerro algo.
 */
function cerrarCapaAbierta(): boolean {
    /* Prioridad 1: registro dinamico (capas registradas via useRegistrarCapa) */
    if (hayCapasAbiertas()) {
        return cerrarCapaSuperior();
    }

    /* Prioridad 2: fallback — stores Zustand conocidos */
    for (const capa of capasFallback) {
        if (capa.estaAbierta()) {
            capa.cerrar();
            return true;
        }
    }

    return false;
}

/*
 * Hook principal. Se monta una sola vez en InicializadorAuth.
 * Registra un listener popstate en fase de captura que intercepta
 * el boton atras cuando hay capas modales abiertas.
 */
export function useBackHandler(): void {
    useEffect(() => {
        /*
         * Usamos capture: true para que este handler se ejecute ANTES
         * del listener del navigationStore (que usa bubble phase default).
         * Esto permite interceptar la navegacion y anularla.
         */
        const manejarPopstate = (evento: PopStateEvent): void => {
            if (!cerrarCapaAbierta()) return;

            /* Se cerro una capa — anular la navegacion del browser.
             * pushState no dispara popstate, asi que no hay loop. */
            evento.stopImmediatePropagation();

            /* Re-push la ruta actual del navigation store para restablecer
             * el historial. getState() es sincrono y el store aun tiene
             * la ruta previa porque stopImmediatePropagation evito su update. */
            const rutaActual = useNavigationStore.getState().rutaActual
                ?? window.location.pathname;
            window.history.pushState({ gloryRoute: rutaActual }, '', rutaActual);
        };

        window.addEventListener('popstate', manejarPopstate, true);

        return () => {
            window.removeEventListener('popstate', manejarPopstate, true);
        };
    }, []);
}
