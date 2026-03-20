import { useEffect, useMemo, useState } from 'react';
import { crearVolumenColeccion } from '@app/services/apiColecciones';
import { toast } from '@app/stores/toastStore';
import type { Coleccion } from '@app/types';

interface UseModalCrearVolumenColeccionParams {
    abierto: boolean;
    onCerrar: () => void;
    onCreado?: () => void | Promise<void>;
    coleccion: Coleccion | null;
}

const numeroARomano = (numero: number): string => {
    const mapa: Array<[number, string]> = [
        [1000, 'M'],
        [900, 'CM'],
        [500, 'D'],
        [400, 'CD'],
        [100, 'C'],
        [90, 'XC'],
        [50, 'L'],
        [40, 'XL'],
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I'],
    ];

    let restante = numero;
    let resultado = '';
    for (const [valor, simbolo] of mapa) {
        while (restante >= valor) {
            resultado += simbolo;
            restante -= valor;
        }
    }
    return resultado;
};

export function useModalCrearVolumenColeccion({
    abierto,
    onCerrar,
    onCreado,
    coleccion,
}: UseModalCrearVolumenColeccionParams) {
    const [numeroVolumen, setNumeroVolumen] = useState('2');
    const [creando, setCreando] = useState(false);

    useEffect(() => {
        if (!abierto) return;
        setNumeroVolumen('2');
        setCreando(false);
    }, [abierto]);

    const numero = useMemo(() => {
        const parsed = Number.parseInt(numeroVolumen, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [numeroVolumen]);

    const nombrePrevisto = useMemo(() => {
        if (!coleccion?.nombre || numero < 2) return '';
        return `${coleccion.nombre} Vol ${numeroARomano(numero)}`;
    }, [coleccion?.nombre, numero]);

    const manejarCrear = async () => {
        if (!coleccion?.id || creando) return;
        if (numero < 2) {
            toast.error('El número de volumen debe ser 2 o mayor');
            return;
        }

        setCreando(true);
        const resp = await crearVolumenColeccion(coleccion.id, numero);

        if (resp.ok && resp.data) {
            toast.exito(`Volumen creado: ${resp.data.nombreVolumen} (${resp.data.samplesMovidos} samples movidos)`);
            await onCreado?.();
            onCerrar();
        } else {
            toast.error(resp.error ?? 'No se pudo crear el volumen');
        }

        setCreando(false);
    };

    return {
        numeroVolumen,
        setNumeroVolumen,
        numero,
        nombrePrevisto,
        creando,
        manejarCrear,
    };
}

export default useModalCrearVolumenColeccion;