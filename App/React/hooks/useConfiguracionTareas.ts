import {useLocalStorage} from './useLocalStorage';

export interface ConfiguracionTareas {
    ocultarCompletadas: boolean;
    ocultarBadgeProyecto: boolean;
}

export const CONFIG_POR_DEFECTO: ConfiguracionTareas = {
    ocultarCompletadas: false,
    ocultarBadgeProyecto: false
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

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        toggleOcultarCompletadas,
        toggleOcultarBadgeProyecto
    };
}
