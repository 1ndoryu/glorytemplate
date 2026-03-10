/*
 * PanelDevCanciones — Kamples
 * Panel de herramientas de desarrollo exclusivo para el módulo Sample Discovery.
 * Solo visible para admins y únicamente en entornos con WP_DEBUG activo.
 *
 * Herramientas disponibles:
 *   1. Purgar BD de canciones (TRUNCATE con CASCADE)
 *   2. Ejecutar el scraper hot_samples en segundo plano
 */

import { useState } from 'react';
import { Trash2, Play, AlertTriangle } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { devPurgarCanciones, devProcesarDeCola } from '@app/services/apiCanciones';

type EstadoAccion = 'idle' | 'loading' | 'ok' | 'error' | 'vacio';

interface EstadoPanel {
    purga: EstadoAccion;
    cola: EstadoAccion;
    mensajePurga: string;
    mensajeCola: string;
}

const ESTADO_INICIAL: EstadoPanel = {
    purga: 'idle',
    cola: 'idle',
    mensajePurga: '',
    mensajeCola: '',
};

export const PanelDevCanciones = (): JSX.Element => {
    const [estado, setEstado] = useState<EstadoPanel>(ESTADO_INICIAL);
    const [confirmarPurga, setConfirmarPurga] = useState(false);

    const handlePurgar = async (): Promise<void> => {
        if (!confirmarPurga) {
            setConfirmarPurga(true);
            return;
        }

        setConfirmarPurga(false);
        setEstado(prev => ({ ...prev, purga: 'loading', mensajePurga: '' }));

        const resp = await devPurgarCanciones();

        if (resp.ok && resp.data) {
            setEstado(prev => ({
                ...prev,
                purga: 'ok',
                mensajePurga: `Truncadas: ${resp.data!.tablas.join(', ')}`,
            }));
        } else {
            setEstado(prev => ({
                ...prev,
                purga: 'error',
                mensajePurga: resp.error ?? 'Error al purgar.',
            }));
        }
    };

    const handleProcesarCola = async (): Promise<void> => {
        setEstado(prev => ({ ...prev, cola: 'loading', mensajeCola: '' }));

        const resp = await devProcesarDeCola();

        if (!resp.ok) {
            setEstado(prev => ({
                ...prev,
                cola: 'error',
                mensajeCola: resp.error ?? 'Error al procesar cola.',
            }));
            return;
        }

        if (resp.data?.cola_vacia) {
            setEstado(prev => ({ ...prev, cola: 'vacio', mensajeCola: 'Cola vacía — no hay URLs pendientes.' }));
            return;
        }

        setEstado(prev => ({
            ...prev,
            cola: 'ok',
            mensajeCola: resp.data?.mensaje ?? 'Procesando...',
        }));
    };

    const cargandoPurga = estado.purga === 'loading';
    const cargandoCola  = estado.cola === 'loading';

    return (
        <section className="panelDevCanciones" role="region" aria-label="Herramientas de desarrollo">
            <header className="panelDevCabecera">
                <AlertTriangle size={16} />
                <span>DEV — Sample Discovery</span>
            </header>

            <div className="panelDevAcciones">
                <div className="panelDevAccion">
                    <BotonBase
                        variante="peligro"
                        tamano="sm"
                        cargando={cargandoPurga}
                        disabled={cargandoPurga || cargandoCola}
                        onClick={() => { void handlePurgar(); }}
                    >
                        <Trash2 size={14} />
                        {confirmarPurga ? '¿Confirmar purga?' : 'Purgar BD canciones'}
                    </BotonBase>
                    {estado.mensajePurga && (
                        <span className={`panelDevMensaje panelDevMensaje--${estado.purga}`}>
                            {estado.mensajePurga}
                        </span>
                    )}
                </div>

                <div className="panelDevAccion">
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        cargando={cargandoCola}
                        disabled={cargandoCola || cargandoPurga}
                        onClick={() => { void handleProcesarCola(); }}
                    >
                        <Play size={14} />
                        Procesar 1 de cola
                    </BotonBase>
                    {estado.mensajeCola && (
                        <span className={`panelDevMensaje panelDevMensaje--${estado.cola === 'vacio' ? 'idle' : estado.cola}`}>
                            {estado.mensajeCola}
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
};
