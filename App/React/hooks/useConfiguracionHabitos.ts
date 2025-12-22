import {useLocalStorage} from './useLocalStorage';

export interface ColumnasHabitos {
    indice: boolean;
    nombre: boolean; // Generalmente siempre true, pero por consistencia
    racha: boolean;
    frecuencia: boolean;
    importancia: boolean;
    tocaHoy: boolean;
    acciones: boolean;
    urgencia: boolean;
    inactividad: boolean;
}

export interface ConfiguracionHabitos {
    ocultarCompletadosHoy: boolean;
    modoCompacto: boolean;
    columnasVisibles: ColumnasHabitos;
}

export const COLUMNAS_POR_DEFECTO: ColumnasHabitos = {
    indice: true,
    nombre: true,
    racha: true,
    frecuencia: false,
    importancia: true,
    tocaHoy: true,
    acciones: false,
    urgencia: true,
    inactividad: true
};

export const CONFIG_HABITOS_POR_DEFECTO: ConfiguracionHabitos = {
    ocultarCompletadosHoy: false,
    modoCompacto: true,
    columnasVisibles: COLUMNAS_POR_DEFECTO
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

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        toggleOcultarCompletadosHoy,
        toggleModoCompacto,
        toggleColumnaVisible
    };
}
