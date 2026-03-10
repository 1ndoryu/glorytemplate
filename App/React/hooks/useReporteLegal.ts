/*
 * Hook: useReporteLegal
 * Gestiona estado y envio del formulario de reclamacion DMCA.
 * Separa logica del componente ModalReporteLegal.
 */

import { useState } from 'react';
import { crearReporteLegal, type DatosReporteLegal } from '../services/apiReporteLegal';

type TipoDerecho = DatosReporteLegal['tipo_derecho'];

interface EstadoForm {
    cargando: boolean;
    error: string | null;
    exito: boolean;
}

interface UseReporteLegalResult {
    razon: string;
    nombre: string;
    email: string;
    tipoDerecho: TipoDerecho;
    obraProtegida: string;
    declaracion: boolean;
    estado: EstadoForm;
    setRazon: (v: string) => void;
    setNombre: (v: string) => void;
    setEmail: (v: string) => void;
    setTipoDerecho: (v: TipoDerecho) => void;
    setObraProtegida: (v: string) => void;
    setDeclaracion: (v: boolean) => void;
    enviar: (tipo: DatosReporteLegal['tipo'], targetId: number) => Promise<boolean>;
    resetear: () => void;
}

export function useReporteLegal(): UseReporteLegalResult {
    const [razon, setRazon] = useState('');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [tipoDerecho, setTipoDerecho] = useState<TipoDerecho>('copyright');
    const [obraProtegida, setObraProtegida] = useState('');
    const [declaracion, setDeclaracion] = useState(false);
    const [estado, setEstado] = useState<EstadoForm>({
        cargando: false,
        error: null,
        exito: false,
    });

    const resetear = () => {
        setRazon('');
        setNombre('');
        setEmail('');
        setTipoDerecho('copyright');
        setObraProtegida('');
        setDeclaracion(false);
        setEstado({ cargando: false, error: null, exito: false });
    };

    const enviar = async (
        tipo: DatosReporteLegal['tipo'],
        targetId: number
    ): Promise<boolean> => {
        setEstado({ cargando: true, error: null, exito: false });

        const resp = await crearReporteLegal({
            tipo,
            target_id: targetId,
            razon,
            nombre,
            email,
            tipo_derecho: tipoDerecho,
            obra_protegida: obraProtegida,
            declaracion,
        });

        if (!resp.ok || resp.data?.error) {
            const msg = resp.data?.error ?? resp.error ?? 'Error al enviar la reclamacion.';
            setEstado({ cargando: false, error: msg, exito: false });
            return false;
        }

        setEstado({ cargando: false, error: null, exito: true });
        return true;
    };

    return {
        razon,
        nombre,
        email,
        tipoDerecho,
        obraProtegida,
        declaracion,
        estado,
        setRazon,
        setNombre,
        setEmail,
        setTipoDerecho,
        setObraProtegida,
        setDeclaracion,
        enviar,
        resetear,
    };
}
