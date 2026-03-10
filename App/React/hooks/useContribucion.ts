/*
 * Hook: useContribucion
 * Gestiona el estado del formulario de contribucion comunitaria.
 * Separa logica de fetch/submit del componente ModalContribucion.
 */

import { useState } from 'react';
import { crearContribucion, type DatosContribucion } from '../services/apiContribuciones';
import type { Cancion } from '../types/cancion';

type ModoRelacion = 'esta_samplea' | 'fue_sampleada';
type TipoRelacion = DatosContribucion['tipo_relacion'];
type TipoElemento = DatosContribucion['tipo_elemento'];

interface EstadoContribucion {
    cargando: boolean;
    error: string | null;
    exito: boolean;
}

interface UseContribucionResult {
    modo: ModoRelacion;
    tipoRelacion: TipoRelacion;
    tipoElemento: TipoElemento;
    cancionSeleccionada: Cancion | null;
    nuevoTitulo: string;
    nuevoArtista: string;
    nuevoYoutubeUrl: string;
    agregarNueva: boolean;
    estado: EstadoContribucion;
    setModo: (m: ModoRelacion) => void;
    setTipoRelacion: (t: TipoRelacion) => void;
    setTipoElemento: (t: TipoElemento) => void;
    seleccionarCancion: (c: Cancion | null) => void;
    setNuevoTitulo: (v: string) => void;
    setNuevoArtista: (v: string) => void;
    setNuevoYoutubeUrl: (v: string) => void;
    setAgregarNueva: (v: boolean) => void;
    enviar: (cancionBaseId: number) => Promise<boolean>;
    resetear: () => void;
}

export function useContribucion(): UseContribucionResult {
    const [modo, setModo] = useState<ModoRelacion>('esta_samplea');
    const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('sample');
    const [tipoElemento, setTipoElemento] = useState<TipoElemento>('hook_riff');
    const [cancionSeleccionada, setCancionSeleccionada] = useState<Cancion | null>(null);
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevoArtista, setNuevoArtista] = useState('');
    const [nuevoYoutubeUrl, setNuevoYoutubeUrl] = useState('');
    const [agregarNueva, setAgregarNueva] = useState(false);
    const [estado, setEstado] = useState<EstadoContribucion>({
        cargando: false,
        error: null,
        exito: false,
    });

    const seleccionarCancion = (c: Cancion | null) => {
        setCancionSeleccionada(c);
        setAgregarNueva(false);
    };

    const resetear = () => {
        setModo('esta_samplea');
        setTipoRelacion('sample');
        setTipoElemento('hook_riff');
        setCancionSeleccionada(null);
        setNuevoTitulo('');
        setNuevoArtista('');
        setNuevoYoutubeUrl('');
        setAgregarNueva(false);
        setEstado({ cargando: false, error: null, exito: false });
    };

    /*
     * cancionBaseId: ID de la cancion que esta abierta en la vista actual.
     * El "modo" determina si esa cancion es la fuente o el destino.
     */
    const enviar = async (cancionBaseId: number): Promise<boolean> => {
        setEstado({ cargando: true, error: null, exito: false });

        const datos: DatosContribucion = {
            tipo_relacion: tipoRelacion,
            tipo_elemento: tipoElemento,
        };

        if (modo === 'esta_samplea') {
            /* La cancion base samplea a otra: base=destino, nueva=fuente */
            datos.cancion_destino_id = cancionBaseId;

            if (agregarNueva) {
                datos.cancion_nueva_titulo      = nuevoTitulo;
                datos.cancion_nueva_artista     = nuevoArtista;
                datos.cancion_nueva_youtube_url = nuevoYoutubeUrl || undefined;
                datos.cancion_nueva_lado        = 'fuente';
            } else if (cancionSeleccionada) {
                datos.cancion_fuente_id = cancionSeleccionada.id;
            } else {
                setEstado({ cargando: false, error: 'Selecciona una cancion fuente.', exito: false });
                return false;
            }
        } else {
            /* La cancion base fue sampleada por otra: base=fuente, nueva=destino */
            datos.cancion_fuente_id = cancionBaseId;

            if (agregarNueva) {
                datos.cancion_nueva_titulo      = nuevoTitulo;
                datos.cancion_nueva_artista     = nuevoArtista;
                datos.cancion_nueva_youtube_url = nuevoYoutubeUrl || undefined;
                datos.cancion_nueva_lado        = 'destino';
            } else if (cancionSeleccionada) {
                datos.cancion_destino_id = cancionSeleccionada.id;
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
    };

    return {
        modo,
        tipoRelacion,
        tipoElemento,
        cancionSeleccionada,
        nuevoTitulo,
        nuevoArtista,
        nuevoYoutubeUrl,
        agregarNueva,
        estado,
        setModo,
        setTipoRelacion,
        setTipoElemento,
        seleccionarCancion,
        setNuevoTitulo,
        setNuevoArtista,
        setNuevoYoutubeUrl,
        setAgregarNueva,
        enviar,
        resetear,
    };
}
