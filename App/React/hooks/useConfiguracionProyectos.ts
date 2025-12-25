import {useLocalStorage} from './useLocalStorage';

export type OrdenamientoProyectos = 'nombre' | 'fecha' | 'prioridad';

export interface ConfiguracionProyectos {
    ocultarCompletados: boolean;
    ocultarTareasCompletadas: boolean;
    ordenDefecto: OrdenamientoProyectos;
    mostrarProgreso: boolean;
}

export const CONFIG_PROYECTOS_DEFECTO: ConfiguracionProyectos = {
    ocultarCompletados: false,
    ocultarTareasCompletadas: false,
    ordenDefecto: 'fecha',
    mostrarProgreso: true
};

export function useConfiguracionProyectos() {
    const {valor, setValor} = useLocalStorage<ConfiguracionProyectos>('glory_config_proyectos', {
        valorPorDefecto: CONFIG_PROYECTOS_DEFECTO
    });

    const toggleOcultarCompletados = () => {
        setValor(prev => ({...prev, ocultarCompletados: !prev.ocultarCompletados}));
    };

    const cambiarOrdenDefecto = (orden: OrdenamientoProyectos) => {
        setValor(prev => ({...prev, ordenDefecto: orden}));
    };

    const toggleMostrarProgreso = () => {
        setValor(prev => ({...prev, mostrarProgreso: !prev.mostrarProgreso}));
    };

    const toggleOcultarTareasCompletadas = () => {
        setValor(prev => ({...prev, ocultarTareasCompletadas: !prev.ocultarTareasCompletadas}));
    };

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        toggleOcultarCompletados,
        toggleOcultarTareasCompletadas,
        cambiarOrdenDefecto,
        toggleMostrarProgreso
    };
}
