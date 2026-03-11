/*
 * Hook: useContribucion
 * Gestiona el estado del formulario de contribucion comunitaria.
 * Separa logica de fetch/submit del componente ModalContribucion.
 * Refactorizado: un solo useState con reducer para cumplir max 3 useState.
 */

import { useState, useCallback } from 'react';
import { crearContribucion, type DatosContribucion } from '../services/apiContribuciones';
import type { Cancion } from '../types/cancion';

type ModoRelacion = 'esta_samplea' | 'fue_sampleada';
type TipoRelacion = DatosContribucion['tipo_relacion'];
type TipoElemento = DatosContribucion['tipo_elemento'];

interface FormularioContribucion {
    modo: ModoRelacion;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento;
    cancionSeleccionada: Cancion | null;
    nuevoTitulo: string;
    nuevoArtista: string;
    nuevoYoutubeUrl: string;
    agregarNueva: boolean;
    timingFuente: string;
    timingDestino: string;
}

interface EstadoContribucion {
    cargando: boolean;
    error: string | null;
    exito: boolean;
}

const FORM_INICIAL: FormularioContribucion = {
    modo: 'esta_samplea',
    tipoRelacion: 'sample',
    tipoElemento: 'hook_riff',
    cancionSeleccionada: null,
    nuevoTitulo: '',
    nuevoArtista: '',
    nuevoYoutubeUrl: '',
    agregarNueva: false,
    timingFuente: '',
    timingDestino: '',
};

/*
 * Parsea un timing en formato "m:ss" o segundos directos a entero.
 * Retorna null si el string esta vacio o es invalido.
 */
const parsearTiming = (valor: string): number | null => {
    const limpio = valor.trim();
    if (!limpio) return null;

    /* Formato m:ss o mm:ss */
    const matchMinSeg = /^(\d{1,3}):(\d{1,2})$/.exec(limpio);
    if (matchMinSeg) {
        const min = parseInt(matchMinSeg[1], 10);
        const seg = parseInt(matchMinSeg[2], 10);
        if (seg >= 60) return null;
        return min * 60 + seg;
    }

    /* Solo segundos */
    const num = parseInt(limpio, 10);
    return !isNaN(num) && num >= 0 ? num : null;
};

export function useContribucion() {
    const [form, setForm] = useState<FormularioContribucion>(FORM_INICIAL);
    const [estado, setEstado] = useState<EstadoContribucion>({
        cargando: false, error: null, exito: false,
    });

    const actualizar = useCallback(<K extends keyof FormularioContribucion>(campo: K, valor: FormularioContribucion[K]) => {
        setForm(prev => ({ ...prev, [campo]: valor }));
    }, []);

    const seleccionarCancion = useCallback((c: Cancion | null) => {
        setForm(prev => ({ ...prev, cancionSeleccionada: c, agregarNueva: false }));
    }, []);

    const resetear = useCallback(() => {
        setForm(FORM_INICIAL);
        setEstado({ cargando: false, error: null, exito: false });
    }, []);

    const enviar = useCallback(async (cancionBaseId: number): Promise<boolean> => {
        /* Validar timings obligatorios */
        const tfParsed = parsearTiming(form.timingFuente);
        const tdParsed = parsearTiming(form.timingDestino);

        if (tfParsed === null) {
            setEstado({ cargando: false, error: 'Indica el timing en la cancion fuente (ej: 1:23).', exito: false });
            return false;
        }
        if (tdParsed === null) {
            setEstado({ cargando: false, error: 'Indica el timing en la cancion destino (ej: 0:45).', exito: false });
            return false;
        }

        setEstado({ cargando: true, error: null, exito: false });

        const datos: DatosContribucion = {
            tipo_relacion: form.tipoRelacion,
            tipo_elemento: form.tipoElemento,
            timing_fuente: tfParsed,
            timing_destino: tdParsed,
        };

        if (form.modo === 'esta_samplea') {
            datos.cancion_destino_id = cancionBaseId;

            if (form.agregarNueva) {
                datos.cancion_nueva_titulo      = form.nuevoTitulo;
                datos.cancion_nueva_artista     = form.nuevoArtista;
                datos.cancion_nueva_youtube_url = form.nuevoYoutubeUrl || undefined;
                datos.cancion_nueva_lado        = 'fuente';
            } else if (form.cancionSeleccionada) {
                datos.cancion_fuente_id = form.cancionSeleccionada.id;
            } else {
                setEstado({ cargando: false, error: 'Selecciona una cancion fuente.', exito: false });
                return false;
            }
        } else {
            datos.cancion_fuente_id = cancionBaseId;

            if (form.agregarNueva) {
                datos.cancion_nueva_titulo      = form.nuevoTitulo;
                datos.cancion_nueva_artista     = form.nuevoArtista;
                datos.cancion_nueva_youtube_url = form.nuevoYoutubeUrl || undefined;
                datos.cancion_nueva_lado        = 'destino';
            } else if (form.cancionSeleccionada) {
                datos.cancion_destino_id = form.cancionSeleccionada.id;
            } else {
                setEstado({ cargando: false, error: 'Selecciona una cancion destino.', exito: false });
                return false;
            }
        }

        const resp = await crearContribucion(datos);

        if (!resp.ok || resp.data?.error) {
            const mensajeError = resp.data?.error ?? resp.error ?? 'Error desconocido';
            setEstado({ cargando: false, error: mensajeError, exito: false });
            return false;
        }

        setEstado({ cargando: false, error: null, exito: true });
        return true;
    }, [form]);

    return {
        /* Campos individuales para compatibilidad con ModalContribucion */
        modo: form.modo,
        tipoRelacion: form.tipoRelacion,
        tipoElemento: form.tipoElemento,
        cancionSeleccionada: form.cancionSeleccionada,
        nuevoTitulo: form.nuevoTitulo,
        nuevoArtista: form.nuevoArtista,
        nuevoYoutubeUrl: form.nuevoYoutubeUrl,
        agregarNueva: form.agregarNueva,
        timingFuente: form.timingFuente,
        timingDestino: form.timingDestino,
        estado,
        setModo: (m: ModoRelacion) => actualizar('modo', m),
        setTipoRelacion: (t: TipoRelacion) => actualizar('tipoRelacion', t),
        setTipoElemento: (t: TipoElemento) => actualizar('tipoElemento', t),
        seleccionarCancion,
        setNuevoTitulo: (v: string) => actualizar('nuevoTitulo', v),
        setNuevoArtista: (v: string) => actualizar('nuevoArtista', v),
        setNuevoYoutubeUrl: (v: string) => actualizar('nuevoYoutubeUrl', v),
        setAgregarNueva: (v: boolean) => actualizar('agregarNueva', v),
        setTimingFuente: (v: string) => actualizar('timingFuente', v),
        setTimingDestino: (v: string) => actualizar('timingDestino', v),
        enviar,
        resetear,
    };
}

