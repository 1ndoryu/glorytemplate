import {useLocalStorage} from './useLocalStorage';

export interface ColumnasHabitos {
    indice: boolean;
    nombre: boolean;
    racha: boolean;
    frecuencia: boolean;
    importancia: boolean;
    tocaHoy: boolean;
    acciones: boolean;
    urgencia: boolean;
    inactividad: boolean;
}

/*
 * Presets de tolerancia de urgencia para hábitos
 * Define cuántos días de inactividad se necesitan para cada nivel de urgencia
 */
export type ToleranciaPreset = 'muyEstricto' | 'estricto' | 'moderado' | 'relajado' | 'personalizado';

export interface UmbralesUrgencia {
    normal: number;
    urgente: number;
    bloqueante: number;
}

export const TOLERANCIA_PRESETS: Record<ToleranciaPreset, UmbralesUrgencia> = {
    muyEstricto: {normal: 1, urgente: 1, bloqueante: 2},
    estricto: {normal: 1, urgente: 2, bloqueante: 4},
    moderado: {normal: 1, urgente: 3, bloqueante: 5},
    relajado: {normal: 3, urgente: 7, bloqueante: 14}
} as Record<ToleranciaPreset, UmbralesUrgencia>;

export interface ConfiguracionHabitos {
    ocultarCompletadosHoy: boolean;
    modoCompacto: boolean;
    columnasVisibles: ColumnasHabitos;
    toleranciaPreset: ToleranciaPreset;
    umbralesPersonalizados: UmbralesUrgencia;
}

export const COLUMNAS_POR_DEFECTO: ColumnasHabitos = {
    indice: true,
    nombre: true,
    racha: false /* Oculta por defecto */,
    frecuencia: true /* Visible por defecto */,
    importancia: true /* Prioridad visible */,
    tocaHoy: true /* Días visible */,
    acciones: false,
    urgencia: false /* Oculta por defecto */,
    inactividad: false
};

export const CONFIG_HABITOS_POR_DEFECTO: ConfiguracionHabitos = {
    ocultarCompletadosHoy: false,
    modoCompacto: true,
    columnasVisibles: COLUMNAS_POR_DEFECTO,
    toleranciaPreset: 'moderado',
    umbralesPersonalizados: {normal: 1, urgente: 3, bloqueante: 5}
};

export function useConfiguracionHabitos() {
    const {valor, setValor} = useLocalStorage<ConfiguracionHabitos>('glory_config_habitos', {
        valorPorDefecto: CONFIG_HABITOS_POR_DEFECTO
    });

    const toggleOcultarCompletadosHoy = () => {
        setValor(prev => ({...prev, ocultarCompletadosHoy: !prev.ocultarCompletadosHoy}));
    };

    const toggleModoCompacto = () => {
        setValor(prev => ({...prev, modoCompacto: !prev.modoCompacto}));
    };

    const toggleColumnaVisible = (columna: keyof ColumnasHabitos) => {
        setValor(prev => ({
            ...prev,
            columnasVisibles: {
                ...prev.columnasVisibles,
                [columna]: !prev.columnasVisibles[columna]
            }
        }));
    };

    const cambiarToleranciaPreset = (preset: ToleranciaPreset) => {
        setValor(prev => ({...prev, toleranciaPreset: preset}));
    };

    const actualizarUmbralesPersonalizados = (umbrales: UmbralesUrgencia) => {
        setValor(prev => ({
            ...prev,
            toleranciaPreset: 'personalizado',
            umbralesPersonalizados: umbrales
        }));
    };

    /* Obtener los umbrales efectivos según el preset actual */
    const obtenerUmbralesActuales = (): UmbralesUrgencia => {
        if (valor.toleranciaPreset === 'personalizado') {
            return valor.umbralesPersonalizados;
        }
        return TOLERANCIA_PRESETS[valor.toleranciaPreset] || TOLERANCIA_PRESETS.moderado;
    };

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        toggleOcultarCompletadosHoy,
        toggleModoCompacto,
        toggleColumnaVisible,
        cambiarToleranciaPreset,
        actualizarUmbralesPersonalizados,
        obtenerUmbralesActuales
    };
}
