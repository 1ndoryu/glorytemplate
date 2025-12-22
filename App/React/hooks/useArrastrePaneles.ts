/*
 * useArrastrePaneles
 * Hook personalizado para manejar arrastre de paneles del dashboard
 * Sistema propio basado en mouse events (sin usar HTML5 Drag & Drop nativo)
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import type {PanelId, OrdenPanel} from './useConfiguracionLayout';

interface PosicionMouse {
    x: number;
    y: number;
}

interface ZonaDropDetectada {
    panelId: PanelId;
    posicion: 'antes' | 'despues';
}

interface EstadoArrastre {
    panelArrastrando: PanelId | null;
    posicionMouse: PosicionMouse | null;
    zonaDropActiva: ZonaDropDetectada | null;
    estaArrastrando: boolean;
}

interface RefPaneles {
    [key: string]: HTMLElement | null;
}

export function useArrastrePaneles(ordenPaneles: OrdenPanel[], onReordenar: (panelId: PanelId, columna: 1 | 2 | 3, posicion: number) => void) {
    const [estado, setEstado] = useState<EstadoArrastre>({
        panelArrastrando: null,
        posicionMouse: null,
        zonaDropActiva: null,
        estaArrastrando: false
    });

    /* Referencias a los elementos DOM de cada panel */
    const refsPaneles = useRef<RefPaneles>({});

    /* Registrar referencia de un panel */
    const registrarPanel = useCallback((panelId: PanelId, elemento: HTMLElement | null) => {
        refsPaneles.current[panelId] = elemento;
    }, []);

    /* Iniciar arrastre */
    const iniciarArrastre = useCallback((panelId: PanelId, evento: React.MouseEvent) => {
        evento.preventDefault();
        evento.stopPropagation();

        setEstado({
            panelArrastrando: panelId,
            posicionMouse: {x: evento.clientX, y: evento.clientY},
            zonaDropActiva: null,
            estaArrastrando: true
        });
    }, []);

    /* Detectar zona de drop basado en posición del mouse */
    const detectarZonaDrop = useCallback(
        (mouseY: number): ZonaDropDetectada | null => {
            const panelArrastrado = estado.panelArrastrando;
            if (!panelArrastrado) return null;

            /* Iterar sobre todos los paneles para encontrar el más cercano */
            for (const [panelId, elemento] of Object.entries(refsPaneles.current)) {
                if (!elemento || panelId === panelArrastrado) continue;

                const rect = elemento.getBoundingClientRect();

                /* Verificar si el mouse está dentro del área vertical del panel */
                if (mouseY >= rect.top && mouseY <= rect.bottom) {
                    const mitad = rect.top + rect.height / 2;
                    return {
                        panelId: panelId as PanelId,
                        posicion: mouseY < mitad ? 'antes' : 'despues'
                    };
                }
            }

            return null;
        },
        [estado.panelArrastrando]
    );

    /* Manejar movimiento del mouse (global) */
    useEffect(() => {
        if (!estado.estaArrastrando) return;

        const manejarMovimiento = (evento: MouseEvent) => {
            const nuevaPosicion = {x: evento.clientX, y: evento.clientY};
            const nuevaZona = detectarZonaDrop(evento.clientY);

            setEstado(prev => ({
                ...prev,
                posicionMouse: nuevaPosicion,
                zonaDropActiva: nuevaZona
            }));
        };

        const manejarSoltar = () => {
            if (estado.panelArrastrando && estado.zonaDropActiva) {
                /* Calcular nueva posición basada en el panel destino */
                const panelDestino = ordenPaneles.find(p => p.id === estado.zonaDropActiva!.panelId);

                if (panelDestino) {
                    const nuevaPosicion = estado.zonaDropActiva.posicion === 'antes' ? panelDestino.posicion : panelDestino.posicion + 1;

                    onReordenar(estado.panelArrastrando, panelDestino.columna, nuevaPosicion);
                }
            }

            /* Limpiar estado */
            setEstado({
                panelArrastrando: null,
                posicionMouse: null,
                zonaDropActiva: null,
                estaArrastrando: false
            });
        };

        /* Agregar listeners globales */
        document.addEventListener('mousemove', manejarMovimiento);
        document.addEventListener('mouseup', manejarSoltar);

        /* Cambiar cursor y deshabilitar selección de texto */
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', manejarMovimiento);
            document.removeEventListener('mouseup', manejarSoltar);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [estado.estaArrastrando, estado.panelArrastrando, estado.zonaDropActiva, ordenPaneles, onReordenar, detectarZonaDrop]);

    /* Cancelar arrastre con Escape */
    useEffect(() => {
        if (!estado.estaArrastrando) return;

        const manejarTecla = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                setEstado({
                    panelArrastrando: null,
                    posicionMouse: null,
                    zonaDropActiva: null,
                    estaArrastrando: false
                });
            }
        };

        document.addEventListener('keydown', manejarTecla);
        return () => document.removeEventListener('keydown', manejarTecla);
    }, [estado.estaArrastrando]);

    return {
        panelArrastrando: estado.panelArrastrando,
        posicionMouse: estado.posicionMouse,
        zonaDropActiva: estado.zonaDropActiva,
        estaArrastrando: estado.estaArrastrando,
        iniciarArrastre,
        registrarPanel
    };
}
