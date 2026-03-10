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
import { Trash2, Play, AlertTriangle, Link } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';
import { devPurgarCanciones, devEjecutarScraper } from '@app/services/apiCanciones';

type EstadoAccion = 'idle' | 'loading' | 'ok' | 'error';

interface EstadoPanel {
    purga: EstadoAccion;
    scraper: EstadoAccion;
    mensajePurga: string;
    mensajeScraper: string;
}

const ESTADO_INICIAL: EstadoPanel = {
    purga: 'idle',
    scraper: 'idle',
    mensajePurga: '',
    mensajeScraper: '',
};

const URL_DEFAULT = 'https://www.whosampled.com/Ol%27-Dirty-Bastard/Brooklyn-Zoo/';

export const PanelDevCanciones = (): JSX.Element => {
    const [estado, setEstado] = useState<EstadoPanel>(ESTADO_INICIAL);
    const [confirmarPurga, setConfirmarPurga] = useState(false);
    const [urlTrack, setUrlTrack] = useState(URL_DEFAULT);

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

    const handleScraper = async (): Promise<void> => {
        setEstado(prev => ({ ...prev, scraper: 'loading', mensajeScraper: '' }));

        /* Si hay URL en el input, usar spider 'track' con esa URL */
        const url = urlTrack.trim();
        const resp = url
            ? await devEjecutarScraper('track', 0, url)
            : await devEjecutarScraper('hot_samples', 5);

        if (resp.ok && resp.data) {
            setEstado(prev => ({
                ...prev,
                scraper: 'ok',
                mensajeScraper: `${resp.data!.mensaje} (PID: ${resp.data!.pid ?? '?'})`,
            }));
        } else {
            setEstado(prev => ({
                ...prev,
                scraper: 'error',
                mensajeScraper: resp.error ?? 'Error al iniciar scraper.',
            }));
        }
    };

    const cargandoPurga = estado.purga === 'loading';
    const cargandoScraper = estado.scraper === 'loading';

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
                        disabled={cargandoPurga || cargandoScraper}
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
                    <label className="panelDevLabel" htmlFor="inputUrlTrack">
                        <Link size={12} />
                        URL de WhoSampled a scrapear:
                    </label>
                    <Input
                        id="inputUrlTrack"
                        className="panelDevInputUrl"
                        type="url"
                        value={urlTrack}
                        onChange={e => { setUrlTrack(e.target.value); }}
                        placeholder="https://www.whosampled.com/Artista/Cancion/"
                        disabled={cargandoScraper || cargandoPurga}
                    />
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        cargando={cargandoScraper}
                        disabled={cargandoScraper || cargandoPurga}
                        onClick={() => { void handleScraper(); }}
                    >
                        <Play size={14} />
                        {urlTrack.trim() ? 'Scrapear track' : 'Ejecutar scraper (5 items)'}
                    </BotonBase>
                    {estado.mensajeScraper && (
                        <span className={`panelDevMensaje panelDevMensaje--${estado.scraper}`}>
                            {estado.mensajeScraper}
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
};
