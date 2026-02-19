/*
 * useConfigBloque — Lógica para el modal de configuración avanzada de bloque.
 * Extraído de ModalConfigBloque para cumplir SRP y límite de 300 líneas.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { BloqueMezclador, ConfigBloque } from '../types/mezclador';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { useVentanasStore } from '../stores/ventanasStore';
import { invalidarCacheBloque } from '../services/pitchShiftService';

export const useConfigBloque = (bloque: BloqueMezclador, onCerrar: () => void) => {
    const actualizarConfigBloque = useMezcladorStore(s => s.actualizarConfigBloque);
    const setDuracionBloque = useMezcladorStore(s => s.setDuracionBloque);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const abrirVentana = useVentanasStore(s => s.abrirVentana);

    const ventanaId = `config-bloque-${bloque.id}`;

    /* Registrar ventana al montar */
    useEffect(() => {
        abrirVentana({
            id: ventanaId,
            tipo: 'configBloque',
            titulo: bloque.sample.titulo,
            bloqueId: bloque.id,
            posicion: {
                x: Math.max(20, Math.round(window.innerWidth / 2 - 350)),
                y: Math.max(20, Math.round(window.innerHeight / 2 - 280)),
            },
        });
    }, []);

    /*
     * C319: Detectar cierre externo de la ventana.
     * Usar ref para evitar cerrar antes de que la ventana se registre en el store.
     * Solo cerrar cuando la ventana fue vista al menos una vez y luego desaparece.
     */
    const ventana = useVentanasStore(s => s.ventanas.find(v => v.id === ventanaId));
    const ventanaVista = useRef(false);
    useEffect(() => {
        if (ventana !== undefined) {
            ventanaVista.current = true;
        } else if (ventanaVista.current) {
            onCerrar();
        }
    }, [ventana, onCerrar]);

    /* Estado local — se aplica inmediatamente al store */
    const [silenciado, setSilenciado] = useState(bloque.silenciado);
    const [invertido, setInvertido] = useState(bloque.invertido);
    const [normalizado, setNormalizado] = useState(bloque.normalizado);
    const [fadeIn, setFadeIn] = useState(bloque.fadeIn);
    const [fadeOut, setFadeOut] = useState(bloque.fadeOut);
    const [volumen, setVolumen] = useState(bloque.volumen);
    const [playbackRate, setPlaybackRate] = useState(bloque.playbackRate);
    const [detune, setDetune] = useState(bloque.detune ?? 0);
    const [modoTonalidad, setModoTonalidad] = useState<'resample' | 'stretch'>(bloque.modoTonalidad ?? 'resample');
    const [pan, setPan] = useState(bloque.pan ?? 0);
    const [modoDeclic, setModoDeclic] = useState(bloque.modoDeclic ?? 'none');
    const [invertirPolaridad, setInvertirPolaridad] = useState(bloque.invertirPolaridad ?? false);
    const [intercambiarEstereo, setIntercambiarEstereo] = useState(bloque.intercambiarEstereo ?? false);

    const duracionBuffer = bloque.audioBuffer?.duration ?? 0;
    const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
    const duracionWall = bloque.duracionCompases * durCompas;

    const aplicar = useCallback((config: ConfigBloque) => {
        actualizarConfigBloque(bloque.id, config);
    }, [bloque.id, actualizarConfigBloque]);

    const toggleSilenciado = useCallback(() => {
        const nuevo = !silenciado;
        setSilenciado(nuevo);
        useMezcladorStore.setState(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.map(b =>
                    b.id === bloque.id ? { ...b, silenciado: nuevo } : b
                ),
            })),
        }));
    }, [silenciado, bloque.id]);

    const alCambiarPan = useCallback((valor: number) => {
        const v = Math.max(-1, Math.min(1, valor)); setPan(v); aplicar({ pan: v });
    }, [aplicar]);
    const alCambiarVolumen = useCallback((valor: number) => {
        const v = Math.max(0, Math.min(2, valor)); setVolumen(v); aplicar({ volumen: v });
    }, [aplicar]);
    const alCambiarRate = useCallback((valor: number) => {
        const v = Math.max(0.25, Math.min(4, valor)); setPlaybackRate(v);
        setDuracionBloque(bloque.id, Math.max(0.25, duracionBuffer / (v * durCompas)));
    }, [duracionBuffer, durCompas, bloque.id, setDuracionBloque]);
    const alCambiarDetune = useCallback((valor: number) => {
        const v = Math.max(-12, Math.min(12, Math.round(valor))); setDetune(v);
        if (modoTonalidad === 'stretch') invalidarCacheBloque(bloque.id);
        aplicar({ detune: v });
    }, [modoTonalidad, bloque.id, aplicar]);
    const alCambiarModoTonalidad = useCallback((modo: 'resample' | 'stretch') => {
        setModoTonalidad(modo); invalidarCacheBloque(bloque.id); aplicar({ modoTonalidad: modo });
    }, [bloque.id, aplicar]);
    const alCambiarFadeIn = useCallback((valor: number) => {
        const v = Math.max(0, Math.min(duracionWall / 2, valor)); setFadeIn(v); aplicar({ fadeIn: v });
    }, [duracionWall, aplicar]);
    const alCambiarFadeOut = useCallback((valor: number) => {
        const v = Math.max(0, Math.min(duracionWall / 2, valor)); setFadeOut(v); aplicar({ fadeOut: v });
    }, [duracionWall, aplicar]);
    const alCambiarDeclic = useCallback((modo: 'none' | 'corto' | 'medio' | 'largo') => {
        setModoDeclic(modo); aplicar({ modoDeclic: modo });
    }, [aplicar]);

    /* Toggles de efecto con patrón uniforme */
    const crearToggle = (getter: boolean, setter: (v: boolean) => void, key: keyof ConfigBloque) => () => {
        const nuevo = !getter;
        setter(nuevo);
        aplicar({ [key]: nuevo } as ConfigBloque);
    };

    const toggleInvertido = crearToggle(invertido, setInvertido, 'invertido');
    const toggleNormalizado = crearToggle(normalizado, setNormalizado, 'normalizado');
    const toggleInvertirPolaridad = crearToggle(invertirPolaridad, setInvertirPolaridad, 'invertirPolaridad');
    const toggleIntercambiarEstereo = crearToggle(intercambiarEstereo, setIntercambiarEstereo, 'intercambiarEstereo');

    return {
        ventanaId, silenciado, invertido, normalizado, fadeIn, fadeOut,
        volumen, playbackRate, detune, modoTonalidad, pan, modoDeclic,
        invertirPolaridad, intercambiarEstereo,
        duracionBuffer, duracionWall,
        setSilenciado,
        toggleSilenciado, alCambiarPan, alCambiarVolumen, alCambiarRate,
        alCambiarDetune, alCambiarModoTonalidad, alCambiarFadeIn,
        alCambiarFadeOut, alCambiarDeclic,
        toggleInvertido, toggleNormalizado, toggleInvertirPolaridad, toggleIntercambiarEstereo,
    };
};
