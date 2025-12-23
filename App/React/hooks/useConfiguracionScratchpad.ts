import {useLocalStorage} from './useLocalStorage';

export type TamanoFuente = 'pequeno' | 'normal' | 'grande';
export type AlturaScratchpad = string;

export interface ConfiguracionScratchpad {
    tamanoFuente: TamanoFuente;
    altura: AlturaScratchpad;
    autoGuardadoIntervalo: number; // milisegundos
}

export const CONFIG_SCRATCHPAD_DEFECTO: ConfiguracionScratchpad = {
    tamanoFuente: 'normal',
    altura: '100%',
    autoGuardadoIntervalo: 1500
};

export function useConfiguracionScratchpad() {
    const {valor, setValor} = useLocalStorage<ConfiguracionScratchpad>('glory_config_scratchpad', {
        valorPorDefecto: CONFIG_SCRATCHPAD_DEFECTO
    });

    const cambiarTamanoFuente = (tamano: TamanoFuente) => {
        setValor(prev => ({...prev, tamanoFuente: tamano}));
    };

    const cambiarAltura = (altura: AlturaScratchpad) => {
        setValor(prev => ({...prev, altura: altura}));
    };

    const cambiarAutoGuardado = (intervalo: number) => {
        setValor(prev => ({...prev, autoGuardadoIntervalo: intervalo}));
    };

    return {
        configuracion: valor,
        actualizarConfiguracion: setValor,
        cambiarTamanoFuente,
        cambiarAltura,
        cambiarAutoGuardado
    };
}
