/**
 * useReservarFlujo — Lógica del flujo multi-step de reserva.
 * Gestiona: paso actual, selección de vehículo/fechas, datos del cliente,
 * verificación de disponibilidad, cálculo de precio y creación de reserva.
 */

import { useState, useCallback, useMemo } from 'react';
import { useWordPressApi, useGloryOptions } from '@/hooks';
import { useDisponibilidad } from '@app/hooks/useDisponibilidad';
import { useReserva } from '@app/hooks/useReserva';
import type { VehiculosListResponse, DatosCliente, CalculoPrecio, Vehiculo } from '@app/types/cresta';

type Paso = 1 | 2 | 3 | 4;

export interface UseReservarFlujoResult {
    /* Configuración */
    horarioRecogida: string;
    horarioDevolucion: string;

    /* Paso actual */
    paso: Paso;
    setPaso: (p: Paso) => void;

    /* Vehículos */
    vehiculos: Vehiculo[];
    vehiculoId: number;
    setVehiculoId: (id: number) => void;
    vehiculoSeleccionado: Vehiculo | undefined;

    /* Fechas */
    fechaInicio: string;
    setFechaInicio: (f: string) => void;
    fechaFin: string;
    setFechaFin: (f: string) => void;

    /* Precio */
    precioCalculado: CalculoPrecio | null;
    fianza: number;

    /* Datos cliente */
    datosCliente: DatosCliente;
    setDatosCliente: React.Dispatch<React.SetStateAction<DatosCliente>>;
    erroresForm: Record<string, string>;

    /* Disponibilidad */
    disponible: boolean | null;
    motivo: string | null;
    loadingDisp: boolean;

    /* Reserva */
    loadingReserva: boolean;
    errorReserva: string | null;

    /* Acciones */
    handleContinuarPaso1: () => Promise<void>;
    handleReservar: () => Promise<void>;

    /* Estado URL */
    cancelado: boolean;
}

export function useReservarFlujo(): UseReservarFlujoResult {
    const { get } = useGloryOptions();
    const reservasConfig = get('reservas', {}) as Record<string, string>;
    const horarioRecogida = reservasConfig.horarioRecogida || '16:00';
    const horarioDevolucion = reservasConfig.horarioDevolucion || '10:00';

    const params = useMemo(() => new URLSearchParams(window.location.search), []);

    /* Estado del flujo */
    const [paso, setPaso] = useState<Paso>(1);
    const [vehiculoId, setVehiculoId] = useState<number>(Number(params.get('vehiculo_id')) || 0);
    const [fechaInicio, setFechaInicio] = useState(params.get('inicio') ?? '');
    const [fechaFin, setFechaFin] = useState(params.get('fin') ?? '');
    const [precioCalculado, setPrecioCalculado] = useState<CalculoPrecio | null>(null);
    const [fianza, setFianza] = useState(0);
    const [datosCliente, setDatosCliente] = useState<DatosCliente>({
        nombre: '', email: '', telefono: '', notas: '',
    });
    const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

    /* Datos remotos */
    const { data: vehiculosData } = useWordPressApi<VehiculosListResponse>('/glory/v1/vehiculos');
    const vehiculos = vehiculosData?.vehiculos ?? [];
    const vehiculoSeleccionado = vehiculos.find(v => v.id === vehiculoId);

    const { disponible, motivo, loading: loadingDisp, verificar } = useDisponibilidad(vehiculoId);
    const { crear, loading: loadingReserva, error: errorReserva } = useReserva();

    /* Acciones */
    const handleContinuarPaso1 = useCallback(async () => {
        if (!vehiculoId || !fechaInicio || !fechaFin) return;

        const result = await verificar(fechaInicio, fechaFin);
        if (result?.disponible && result.precio) {
            setPrecioCalculado(result.precio);
            setFianza(result.vehiculo?.fianza ?? 0);
            setPaso(2);
        }
    }, [vehiculoId, fechaInicio, fechaFin, verificar]);

    const validarDatos = useCallback((): boolean => {
        const errores: Record<string, string> = {};
        if (!datosCliente.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
        if (!datosCliente.email.trim()) errores.email = 'El email es obligatorio.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosCliente.email)) errores.email = 'Email inválido.';
        if (!datosCliente.telefono.trim()) errores.telefono = 'El teléfono es obligatorio.';
        setErroresForm(errores);
        return Object.keys(errores).length === 0;
    }, [datosCliente]);

    const handleReservar = useCallback(async () => {
        if (!validarDatos()) return;

        const result = await crear({
            vehiculo_id: vehiculoId,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            ...datosCliente,
        });

        if (result?.success && result.checkoutUrl) {
            setPaso(4);
            window.location.href = result.checkoutUrl;
        }
    }, [validarDatos, crear, vehiculoId, fechaInicio, fechaFin, datosCliente]);

    const cancelado = params.get('cancelado') === '1';

    return {
        horarioRecogida, horarioDevolucion,
        paso, setPaso,
        vehiculos, vehiculoId, setVehiculoId, vehiculoSeleccionado,
        fechaInicio, setFechaInicio, fechaFin, setFechaFin,
        precioCalculado, fianza,
        datosCliente, setDatosCliente, erroresForm,
        disponible, motivo, loadingDisp,
        loadingReserva, errorReserva,
        handleContinuarPaso1, handleReservar,
        cancelado,
    };
}
