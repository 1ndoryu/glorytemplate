/*
 * useAlertas
 * Hook para gestionar alertas y confirmaciones personalizadas
 * Reemplaza alert() y confirm() nativos del navegador
 */

import {useState, useCallback, useRef} from 'react';

export type TipoAlerta = 'exito' | 'error' | 'advertencia' | 'info';

export interface AlertaToast {
    id: string;
    tipo: TipoAlerta;
    mensaje: string;
    duracion?: number;
}

export interface AlertaConfirmacion {
    id: string;
    titulo: string;
    mensaje: string;
    textoAceptar?: string;
    textoCancelar?: string;
    tipo?: 'peligro' | 'advertencia' | 'normal';
}

interface ConfirmacionPendiente {
    alerta: AlertaConfirmacion;
    resolver: (valor: boolean) => void;
}

const DURACION_DEFECTO = 4000;

export interface UseAlertasReturn {
    toasts: AlertaToast[];
    confirmacion: AlertaConfirmacion | null;
    mostrarExito: (mensaje: string, duracion?: number) => void;
    mostrarError: (mensaje: string, duracion?: number) => void;
    mostrarAdvertencia: (mensaje: string, duracion?: number) => void;
    mostrarInfo: (mensaje: string, duracion?: number) => void;
    confirmar: (opciones: Omit<AlertaConfirmacion, 'id'>) => Promise<boolean>;
    cerrarToast: (id: string) => void;
    responderConfirmacion: (aceptar: boolean) => void;
}

export function useAlertas(): UseAlertasReturn {
    const [toasts, setToasts] = useState<AlertaToast[]>([]);
    const [confirmacion, setConfirmacion] = useState<AlertaConfirmacion | null>(null);
    const confirmacionPendienteRef = useRef<ConfirmacionPendiente | null>(null);

    /*
     * Genera un ID unico para cada alerta
     */
    const generarId = (): string => {
        return `alerta-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    };

    /*
     * Muestra un toast y lo elimina automaticamente despues de la duracion
     */
    const mostrarToast = useCallback((tipo: TipoAlerta, mensaje: string, duracion: number = DURACION_DEFECTO) => {
        const id = generarId();
        const nuevoToast: AlertaToast = {id, tipo, mensaje, duracion};

        setToasts(prev => [...prev, nuevoToast]);

        if (duracion > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duracion);
        }
    }, []);

    const mostrarExito = useCallback((mensaje: string, duracion?: number) => mostrarToast('exito', mensaje, duracion), [mostrarToast]);

    const mostrarError = useCallback((mensaje: string, duracion?: number) => mostrarToast('error', mensaje, duracion ?? 6000), [mostrarToast]);

    const mostrarAdvertencia = useCallback((mensaje: string, duracion?: number) => mostrarToast('advertencia', mensaje, duracion), [mostrarToast]);

    const mostrarInfo = useCallback((mensaje: string, duracion?: number) => mostrarToast('info', mensaje, duracion), [mostrarToast]);

    /*
     * Cierra un toast manualmente
     */
    const cerrarToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    /*
     * Muestra dialogo de confirmacion y retorna promesa con resultado
     */
    const confirmar = useCallback((opciones: Omit<AlertaConfirmacion, 'id'>): Promise<boolean> => {
        return new Promise(resolver => {
            const id = generarId();
            const alerta: AlertaConfirmacion = {
                id,
                titulo: opciones.titulo,
                mensaje: opciones.mensaje,
                textoAceptar: opciones.textoAceptar ?? 'Aceptar',
                textoCancelar: opciones.textoCancelar ?? 'Cancelar',
                tipo: opciones.tipo ?? 'normal'
            };

            confirmacionPendienteRef.current = {alerta, resolver};
            setConfirmacion(alerta);
        });
    }, []);

    /*
     * Responde a la confirmacion activa
     */
    const responderConfirmacion = useCallback((aceptar: boolean) => {
        if (confirmacionPendienteRef.current) {
            confirmacionPendienteRef.current.resolver(aceptar);
            confirmacionPendienteRef.current = null;
        }
        setConfirmacion(null);
    }, []);

    return {
        toasts,
        confirmacion,
        mostrarExito,
        mostrarError,
        mostrarAdvertencia,
        mostrarInfo,
        confirmar,
        cerrarToast,
        responderConfirmacion
    };
}
