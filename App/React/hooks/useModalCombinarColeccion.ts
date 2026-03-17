/*
 * useModalCombinarColeccion — Lógica del modal para combinar colecciones.
 * QL115+QL120: Manejo de selección, nombre, imagen, hijas y ejecución.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@app/stores/toastStore';
import {
    listarColecciones,
    combinarColecciones,
} from '@app/services/apiColecciones';
import type { Coleccion, ColeccionResumen } from '@app/types';
import type { OpcionSelector } from '@app/components/ui/SelectorMenu';

interface UseModalCombinarParams {
    abierto: boolean;
    onCerrar: () => void;
    onCombinado?: (destinoId: number) => void;
    coleccion: Coleccion | null;
    esAdmin: boolean;
}

export function useModalCombinarColeccion({
    abierto,
    onCerrar,
    onCombinado,
    coleccion,
    esAdmin: _esAdmin,
}: UseModalCombinarParams) {
    const [origenId, setOrigenId] = useState<number | null>(null);
    const [nombreFuente, setNombreFuente] = useState<'destino' | 'origen'>('destino');
    const [imagenFuente, setImagenFuente] = useState<'destino' | 'origen'>('destino');
    const [manejoHijas, setManejoHijas] = useState<'mover' | 'aplanar'>('mover');
    const [coleccionesUsuario, setColeccionesUsuario] = useState<Coleccion[]>([]);
    const [combinando, setCombinando] = useState(false);
    const [cargando, setCargando] = useState(false);

    /* Cargar colecciones del usuario al abrir */
    useEffect(() => {
        if (!abierto || !coleccion) return;

        setCargando(true);
        listarColecciones().then(resp => {
            if (resp.ok && resp.data) {
                /* Normalizar: aplanar padres + subcolecciones para tener lista completa */
                const todas: Coleccion[] = [];
                const datos = 'colecciones' in resp.data
                    ? (resp.data as { colecciones: Coleccion[] }).colecciones
                    : (resp.data as unknown as Coleccion[]);
                for (const col of datos) {
                    todas.push(col);
                    if (col.subcolecciones) {
                        for (const sub of col.subcolecciones) {
                            todas.push(sub as unknown as Coleccion);
                        }
                    }
                }
                setColeccionesUsuario(todas);
            }
        }).finally(() => setCargando(false));

        /* Limpiar estado al abrir */
        setOrigenId(null);
        setNombreFuente('destino');
        setImagenFuente('destino');
        setManejoHijas('mover');
    }, [abierto, coleccion]);

    /* Colección origen seleccionada */
    const coleccionOrigen = useMemo(() => {
        if (!origenId) return null;
        return coleccionesUsuario.find(c => c.id === origenId) ?? null;
    }, [origenId, coleccionesUsuario]);

    /* Opciones para el selector "combinar con..." (excluir la colección actual y sus hijas) */
    const opcionesCombinar = useMemo((): OpcionSelector[] => {
        if (!coleccion) return [];
        const hijasIds = new Set(
            (coleccion.subcolecciones ?? []).map((s: ColeccionResumen) => s.id)
        );
        return coleccionesUsuario
            .filter(c => c.id !== coleccion.id && !hijasIds.has(c.id))
            .map(c => ({
                valor: String(c.id),
                etiqueta: c.parentId
                    ? `  ↳ ${c.nombre} (${c.totalSamples})`
                    : `${c.nombre} (${c.totalSamples})`,
            }));
    }, [coleccion, coleccionesUsuario]);

    /* Opciones para "nombre a conservar" */
    const opcionesNombre = useMemo((): OpcionSelector[] => {
        if (!coleccion) return [];
        const opciones: OpcionSelector[] = [
            { valor: 'destino', etiqueta: coleccion.nombre },
        ];
        if (coleccionOrigen) {
            opciones.push({ valor: 'origen', etiqueta: coleccionOrigen.nombre });
        }
        return opciones;
    }, [coleccion, coleccionOrigen]);

    /* Opciones para "imagen a conservar" */
    const opcionesImagen = useMemo((): OpcionSelector[] => {
        const opciones: OpcionSelector[] = [
            { valor: 'destino', etiqueta: 'Imagen actual' },
        ];
        if (coleccionOrigen?.imagenUrl) {
            opciones.push({ valor: 'origen', etiqueta: 'Imagen de la otra colección' });
        }
        return opciones;
    }, [coleccionOrigen]);

    /* QL120: La colección origen tiene subcolecciones? */
    const origenTieneHijas = useMemo(() => {
        if (!origenId) return false;
        return coleccionesUsuario.some(c => c.parentId === origenId);
    }, [origenId, coleccionesUsuario]);

    /* Opciones para manejo de hijas */
    const opcionesManejoHijas = useMemo((): OpcionSelector[] => [
        { valor: 'mover', etiqueta: 'Mover subcolecciones al destino' },
        { valor: 'aplanar', etiqueta: 'Fusionar samples de hijas en el destino' },
    ], []);

    /* Nombre e imagen finales calculados */
    const nombreFinal = useMemo(() => {
        if (nombreFuente === 'origen' && coleccionOrigen) return coleccionOrigen.nombre;
        return coleccion?.nombre ?? '';
    }, [nombreFuente, coleccion, coleccionOrigen]);

    const imagenFinal = useMemo(() => {
        if (imagenFuente === 'origen' && coleccionOrigen) return coleccionOrigen.imagenUrl;
        return coleccion?.imagenUrl ?? null;
    }, [imagenFuente, coleccion, coleccionOrigen]);

    const manejarCombinar = useCallback(async () => {
        if (!coleccion || !origenId || combinando) return;

        setCombinando(true);
        const resp = await combinarColecciones(coleccion.id, {
            origenId,
            nombreFinal,
            imagenFinal,
            manejoHijas: origenTieneHijas ? manejoHijas : undefined,
        });

        if (resp.ok && resp.data) {
            toast.exito(`Colecciones combinadas — ${resp.data.samplesMovidos} samples movidos`);
            onCerrar();
            onCombinado?.(coleccion.id);
        } else {
            toast.error(resp.error ?? 'Error al combinar colecciones');
        }
        setCombinando(false);
    }, [coleccion, origenId, nombreFinal, imagenFinal, manejoHijas, origenTieneHijas, combinando, onCerrar, onCombinado]);

    return {
        origenId,
        setOrigenId: (val: string) => setOrigenId(val ? Number(val) : null),
        nombreFuente,
        setNombreFuente: (val: string) => setNombreFuente(val as 'destino' | 'origen'),
        imagenFuente,
        setImagenFuente: (val: string) => setImagenFuente(val as 'destino' | 'origen'),
        manejoHijas,
        setManejoHijas: (val: string) => setManejoHijas(val as 'mover' | 'aplanar'),
        coleccionOrigen,
        opcionesCombinar,
        opcionesNombre,
        opcionesImagen,
        opcionesManejoHijas,
        origenTieneHijas,
        combinando,
        cargando,
        manejarCombinar,
    };
}
