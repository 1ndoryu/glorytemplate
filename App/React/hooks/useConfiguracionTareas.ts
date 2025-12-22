import {useLocalStorage} from './useLocalStorage';

export interface ConfiguracionTareas {
    ocultarCompletadas: boolean;
    ocultarBadgeProyecto: boolean;
    eliminarCompletadasDespuesDeUnDia: boolean;
}

export const CONFIG_POR_DEFECTO: ConfiguracionTareas = {
    ocultarCompletadas: true,
    ocultarBadgeProyecto: true,
    eliminarCompletadasDespuesDeUnDia: false
};

export function useConfiguracionTareas() {
    const {valor, setValor} = useLocalStorage<ConfiguracionTareas>('glory_config_tareas', {
        valorPorDefecto: CONFIG_POR_DEFECTO
    });

    const toggleOcultarCompletadas = () => {
        setValor(prev => ({...prev, ocultarCompletadas: !prev.ocultarCompletadas}));
    };

    const toggleOcultarBadgeProyecto = () => {
        setValor(prev => ({...prev, ocultarBadgeProyecto: !prev.ocultarBadgeProyecto}));
    };

    const toggleEliminarCompletadasDespuesDeUnDia = () => {
        setValor(prev => ({...prev, eliminarCompletadasDespuesDeUnDia: !prev.eliminarCompletadasDespuesDeUnDia}));
    };

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        toggleOcultarCompletadas,
        toggleOcultarBadgeProyecto,
        toggleEliminarCompletadasDespuesDeUnDia
    };
}
