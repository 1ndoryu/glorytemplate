/*
 * useTablaHabitos
 * Hooks que encapsulan la lógica de TablaHabitos y FilaHabito
 * Maneja: filtrado de hábitos, estado de fila, menú contextual,
 * tracking, cálculos de urgencia/racha y acciones de menú
 */

import {useState, useCallback, useMemo} from 'react';
import {useMenuContextualConId} from '../useMenuContextualGlobal';
import {useEsMovil} from '../useEsMovil';
import {useTimeTrackerStore} from '../../stores/timeTrackerStore';
import {useShallow} from 'zustand/react/shallow';
import type {Habito, NivelImportancia} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {tocaHoy, describirFrecuencia, obtenerIntervaloFrecuencia, calcularUmbralInactividad} from '../../utils/frecuenciaHabitos';
import type {VarianteBadge} from '../../components/shared/BadgeInfo';
import type {ConfiguracionHabitos} from '../useConfiguracionHabitos';
import {CONFIG_HABITOS_POR_DEFECTO} from '../useConfiguracionHabitos';
import type {EstadoHabito} from '../../types/historialHabitos';
import {obtenerFechaHoy, fueCompletadoHoy} from '../../utils/fecha';
import {MENU_HABITO_IDS, extraerImportanciaDeOpcion} from '../../config/opcionesMenuHabito';

/* Re-exportar para consumidores que importaban desde aquí */
export {fueCompletadoHoy};

/* Determina si el hábito fue pospuesto hoy */
export function fuePospuestoHoy(historialPospuestos: string[] | undefined): boolean {
    if (!historialPospuestos || historialPospuestos.length === 0) return false;
    const hoy = obtenerFechaHoy();
    return historialPospuestos.includes(hoy);
}

/* Mapeo de importancia a variante de badge */
export function obtenerVariantePrioridad(importancia: Habito['importancia']): VarianteBadge {
    switch (importancia) {
        case 'Muy Alta': return 'prioridadMuyAlta';
        case 'Alta': return 'prioridadAlta';
        case 'Media': return 'prioridadMedia';
        case 'Baja': return 'prioridadBaja';
        case 'Muy Baja': return 'prioridadMuyBaja';
    }
}

/*
 * Hook para la lógica del componente TablaHabitos principal
 * Maneja filtrado de hábitos y cálculo del grid template
 */
export function useTablaHabitos(habitos: Habito[], configuracion: ConfiguracionHabitos = CONFIG_HABITOS_POR_DEFECTO) {
    const habitosVisibles = useMemo(() => habitos.filter(habito => {
        if (habito.pausado) return false;
        if (configuracion.ocultarCompletadosHoy && fueCompletadoHoy(habito.ultimoCompletado, habito.historialCompletados)) return false;
        return true;
    }), [habitos, configuracion.ocultarCompletadosHoy]);

    const habitosPausados = useMemo(() => habitos.filter(habito => habito.pausado), [habitos]);

    const estiloGrid = useMemo(() => {
        const widths: string[] = [];
        if (configuracion.columnasVisibles.indice) widths.push('2rem');
        widths.push('3fr');
        if (configuracion.columnasVisibles.historial) widths.push('auto');
        if (configuracion.columnasVisibles.importancia) widths.push('1fr');
        if (configuracion.columnasVisibles.inactividad) widths.push('1fr');
        if (configuracion.columnasVisibles.urgencia) widths.push('2fr');
        if (configuracion.columnasVisibles.racha) widths.push('1.5fr');
        if (configuracion.columnasVisibles.acciones) widths.push('auto');
        return {gridTemplateColumns: widths.join(' ')};
    }, [configuracion.columnasVisibles]);

    return {habitosVisibles, habitosPausados, estiloGrid};
}

/*
 * Hook para la lógica de cada fila de hábito (FilaHabito)
 * Maneja estado, cálculos de urgencia/racha, historial,
 * tracking de tiempo, y acciones del menú contextual
 */
interface UseFilaHabitoParams {
    habito: Habito;
    onToggle?: (id: number) => void;
    onEditar?: (habito: Habito) => void;
    onEliminar?: (id: number) => void;
    onPosponer?: (id: number) => void;
    onPausar?: (id: number) => void;
    onActualizar?: (id: number, datos: Partial<Habito>) => void;
}

export function useFilaHabito({
    habito,
    onToggle,
    onEditar,
    onEliminar,
    onPosponer,
    onPausar,
    onActualizar
}: UseFilaHabitoParams) {
    const DIAS_ADVERTENCIA_RACHA = 2;

    const {esMovil} = useEsMovil();
    const menuContextual = useMenuContextualConId(`habito-${habito.id}`);
    const tracker = useTimeTrackerStore(useShallow(s => ({
        sesionActiva: s.sesionActiva,
        estado: s.estado,
        iniciarTracking: s.iniciarTracking,
        completarTracking: s.completarTracking
    })));
    const [mostrarAcciones, setMostrarAcciones] = useState(false);

    /* Frecuencia del hábito */
    const frecuencia = habito.frecuencia || FRECUENCIA_POR_DEFECTO;
    const umbralInactividad = calcularUmbralInactividad(frecuencia);

    /* Cálculos basados en el umbral de la frecuencia */
    const esUrgente = habito.diasInactividad > Math.floor(umbralInactividad * 0.4);
    const porcentajeUrgencia = Math.min((habito.diasInactividad / umbralInactividad) * 100, 100);
    const completadoHoy = fueCompletadoHoy(habito.ultimoCompletado, habito.historialCompletados);

    const habitoTocaHoy = tocaHoy(frecuencia, habito.ultimoCompletado);
    const pospuestoHoy = fuePospuestoHoy(habito.historialPospuestos);
    const textoFrecuencia = describirFrecuencia(frecuencia);
    const intervaloFrecuencia = obtenerIntervaloFrecuencia(frecuencia);

    /* Lógica de advertencia de racha */
    const diasAntesDePerder = umbralInactividad - habito.diasInactividad;
    const rachaEnPeligro = habito.racha > 0 && diasAntesDePerder <= DIAS_ADVERTENCIA_RACHA && diasAntesDePerder > 0;
    const rachaPerdida = habito.diasInactividad > umbralInactividad;
    const estaPausado = habito.pausado ?? false;

    /* Construir historial directamente desde los arrays del hábito */
    const historialParaComponente = useMemo((): {[fecha: string]: EstadoHabito} => {
        const resultado: {[fecha: string]: EstadoHabito} = {};
        if (habito.historialCompletados) {
            for (const fecha of habito.historialCompletados) {
                resultado[fecha] = 'completado';
            }
        }
        if (habito.historialPospuestos) {
            for (const fecha of habito.historialPospuestos) {
                resultado[fecha] = 'pospuesto';
            }
        }
        return resultado;
    }, [habito.historialCompletados, habito.historialPospuestos]);

    /* Detectar si este hábito está siendo trackeado */
    const estaEnTracking = tracker.sesionActiva?.entidadId === habito.id
        && tracker.sesionActiva?.tipoEntidad === 'habito'
        && tracker.estado !== 'inactivo';

    /* Variante de badge para prioridad */
    const variantePrioridad = obtenerVariantePrioridad(habito.importancia);

    /* Clase de urgencia para la barra */
    const claseUrgencia = useMemo((): string => {
        if (completadoHoy) return 'barraRellenoCompletado';
        if (porcentajeUrgencia >= 80) return 'barraRellenoUrgenteCritico';
        if (esUrgente) return 'barraRellenoUrgente';
        if (porcentajeUrgencia >= 40) return 'barraRellenoAdvertencia';
        return '';
    }, [completadoHoy, porcentajeUrgencia, esUrgente]);

    /* Handlers */
    const manejarToggle = useCallback(
        (evento: React.MouseEvent) => {
            evento.stopPropagation();
            onToggle?.(habito.id);
        },
        [onToggle, habito.id]
    );

    const manejarEditar = useCallback(() => {
        onEditar?.(habito);
    }, [onEditar, habito]);

    const manejarClickDerecho = useCallback(
        (evento: React.MouseEvent) => {
            evento.preventDefault();
            evento.stopPropagation();
            menuContextual.toggle(evento.clientX, evento.clientY);
        },
        [menuContextual]
    );

    const manejarOpcionMenu = useCallback(
        (opcionId: string) => {
            /* Tracking de tiempo */
            if (opcionId === 'iniciar-tracking') {
                tracker.iniciarTracking(habito.id, 'habito', habito.nombre);
                return;
            }
            if (opcionId === 'detener-tracking') {
                tracker.completarTracking();
                return;
            }

            switch (opcionId) {
                case MENU_HABITO_IDS.CONFIGURAR:
                case MENU_HABITO_IDS.EDITAR:
                    onEditar?.(habito);
                    break;
                case MENU_HABITO_IDS.TOGGLE:
                    onToggle?.(habito.id);
                    break;
                case MENU_HABITO_IDS.POSPONER:
                    onPosponer?.(habito.id);
                    break;
                case MENU_HABITO_IDS.PAUSAR:
                    onPausar?.(habito.id);
                    break;
                case MENU_HABITO_IDS.ELIMINAR:
                    onEliminar?.(habito.id);
                    break;
            }
            /* Manejar cambio de importancia */
            const nuevaImportancia = extraerImportanciaDeOpcion(opcionId) as NivelImportancia | null;
            if (nuevaImportancia) {
                onActualizar?.(habito.id, {
                    ...habito,
                    importancia: nuevaImportancia
                });
            }
        },
        [habito, onEditar, onToggle, onPosponer, onPausar, onEliminar, onActualizar, tracker]
    );

    return {
        /* Estado */
        mostrarAcciones, setMostrarAcciones,
        menuContextual,
        /* Computed */
        esMovil, frecuencia, esUrgente, porcentajeUrgencia,
        completadoHoy, habitoTocaHoy, pospuestoHoy,
        textoFrecuencia, intervaloFrecuencia,
        rachaEnPeligro, rachaPerdida, diasAntesDePerder,
        estaPausado, estaEnTracking,
        historialParaComponente,
        variantePrioridad, claseUrgencia,
        /* Handlers */
        manejarToggle, manejarEditar, manejarClickDerecho, manejarOpcionMenu
    };
}
