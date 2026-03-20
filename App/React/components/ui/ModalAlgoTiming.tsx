/* ModalAlgoTiming — Modal de métricas del algoritmo de recomendación (admin only).
 * Tres tabs: última medición, promedio, historial. Historial en WP options.
 * [2003A-3] Creado para profiling del algoritmo de feed.
 * [2003A-3-B] Desglose EXPLAIN extraído a DesgloseExplain.tsx. */

import { useState } from 'react';
import { RefreshCw, Trash2, Activity } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useAlgoTimingStore, type RegistroTiming } from '@app/stores/algoTimingStore';
import { DesgloseExplain } from '@app/components/ui/DesgloseExplain';
import '../../styles/componentes/modalAlgoTiming.css';

type TabTiming = 'ultima' | 'promedio' | 'historial';

/* Etiquetas legibles por etapa — extensible sin cambiar el modal */
const ETIQUETAS: Record<string, string> = {
    perfilUsuario: 'Perfil usuario',
    generacionSQL: 'Generación SQL (PHP)',
    sqlFeed: 'Query CTE feed (SQL)',
};

function etiquetaEtapa(clave: string): string {
    return ETIQUETAS[clave] ?? clave;
}

function claseMs(ms: number): string {
    if (ms > 400) return 'timingAlto';
    if (ms > 100) return 'timingMedio';
    return 'timingBajo';
}

function formatMs(ms: number | undefined): string {
    if (ms === undefined || ms === null) return '—';
    return ms.toFixed(1) + ' ms';
}

function formatFecha(ts: string): string {
    try {
        return new Date(ts).toLocaleString('es', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch {
        return ts;
    }
}

/* -------- Tab: Última medición -------- */
const TabUltima = ({ registro }: { registro: RegistroTiming }): JSX.Element => {
    const etapas = registro.etapas ?? {};
    const claves = Object.keys(etapas);
    const total = registro.totalMs;

    return (
        <div className="algoTimingSeccion">
            <div className="algoTimingFecha">{formatFecha(registro.ts)}</div>
            <div className="algoTimingTotalRow">
                <span className="algoTimingTotalLabel">Total</span>
                <span className={`algoTimingTotalMs ${claseMs(total)}`}>{formatMs(total)}</span>
            </div>

            <table className="algoTimingTabla">
                <thead>
                    <tr>
                        <th>Etapa</th>
                        <th className="algoTimingCeldaMs">ms</th>
                        <th className="algoTimingCeldaPct">%</th>
                        <th className="algoTimingCeldaBarra"></th>
                    </tr>
                </thead>
                <tbody>
                    {claves.map((clave) => {
                        const ms = etapas[clave] ?? 0;
                        const pct = total > 0 ? (ms / total) * 100 : 0;
                        return (
                            <tr key={clave} className={`algoTimingFila ${claseMs(ms)}`}>
                                <td className="algoTimingCeldaNombre">{etiquetaEtapa(clave)}</td>
                                <td className="algoTimingCeldaMs">{formatMs(ms)}</td>
                                <td className="algoTimingCeldaPct">{pct.toFixed(1)}%</td>
                                <td className="algoTimingCeldaBarra">
                                    <div className="algoTimingBarra">
                                        <div
                                            className={`algoTimingBarraRelleno ${claseMs(ms)}`}
                                            style={{ width: `${Math.min(100, pct)}%` }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="algoTimingMeta">
                <span>Samples activos: <strong>{registro.meta?.totalSamples ?? '—'}</strong></span>
                <span>Resultados: <strong>{registro.meta?.resultados ?? '—'}</strong></span>
                <span>Bulk-fetch: <strong>{registro.meta?.bulkFetch ? 'Sí' : 'No'}</strong></span>
                <span>MV trending: <strong>{registro.meta?.usoMV ? 'Sí' : 'No'}</strong></span>
                <span>Pipeline candidatos: <strong>{registro.meta?.usoCandidatos ? 'Sí' : 'No'}</strong></span>
            </div>

            {/* [2003A-3-B] Desglose EXPLAIN ANALYZE del CTE feed */}
            {registro.explain && <DesgloseExplain explain={registro.explain} />}
        </div>
    );
};

/* -------- Tab: Promedio -------- */
const TabPromedio = ({ historial }: { historial: RegistroTiming[] }): JSX.Element => {
    if (historial.length === 0) {
        return <p className="algoTimingVacio">Sin mediciones en el historial.</p>;
    }

    /* Calcular promedio por etapa */
    const sumatorias: Record<string, { suma: number; cantidad: number }> = {};
    let sumaTotal = 0;

    for (const reg of historial) {
        sumaTotal += reg.totalMs;
        for (const [clave, ms] of Object.entries(reg.etapas ?? {})) {
            if (ms === undefined) continue;
            if (!sumatorias[clave]) sumatorias[clave] = { suma: 0, cantidad: 0 };
            sumatorias[clave].suma += ms;
            sumatorias[clave].cantidad += 1;
        }
    }

    const promedioTotal = sumaTotal / historial.length;
    const claves = Object.keys(sumatorias).sort(
        (a, b) => (sumatorias[b].suma / sumatorias[b].cantidad) - (sumatorias[a].suma / sumatorias[a].cantidad)
    );

    return (
        <div className="algoTimingSeccion">
            <div className="algoTimingFecha">{historial.length} mediciones promediadas</div>
            <div className="algoTimingTotalRow">
                <span className="algoTimingTotalLabel">Promedio total</span>
                <span className={`algoTimingTotalMs ${claseMs(promedioTotal)}`}>{formatMs(promedioTotal)}</span>
            </div>

            <table className="algoTimingTabla">
                <thead>
                    <tr>
                        <th>Etapa</th>
                        <th className="algoTimingCeldaMs">Promedio</th>
                        <th className="algoTimingCeldaMs">Min</th>
                        <th className="algoTimingCeldaMs">Max</th>
                        <th className="algoTimingCeldaPct">%</th>
                    </tr>
                </thead>
                <tbody>
                    {claves.map((clave) => {
                        const s = sumatorias[clave];
                        const prom = s.suma / s.cantidad;
                        const vals = historial
                            .map(r => r.etapas?.[clave])
                            .filter((v): v is number => v !== undefined);
                        const min = Math.min(...vals);
                        const max = Math.max(...vals);
                        const pct = promedioTotal > 0 ? (prom / promedioTotal) * 100 : 0;
                        return (
                            <tr key={clave} className={`algoTimingFila ${claseMs(prom)}`}>
                                <td className="algoTimingCeldaNombre">{etiquetaEtapa(clave)}</td>
                                <td className="algoTimingCeldaMs">{formatMs(prom)}</td>
                                <td className="algoTimingCeldaMs algoTimingCeldaSecundaria">{formatMs(min)}</td>
                                <td className="algoTimingCeldaMs algoTimingCeldaSecundaria">{formatMs(max)}</td>
                                <td className="algoTimingCeldaPct">{pct.toFixed(1)}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

/* -------- Tab: Historial -------- */
const TabHistorial = ({
    historial,
    onSeleccionar,
}: {
    historial: RegistroTiming[];
    onSeleccionar: (r: RegistroTiming) => void;
}): JSX.Element => {
    if (historial.length === 0) {
        return <p className="algoTimingVacio">Sin mediciones todavía. Recarga la página siendo user 1.</p>;
    }

    return (
        <div className="algoTimingSeccion">
            <table className="algoTimingTabla algoTimingTablaHistorial">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th className="algoTimingCeldaMs">Total</th>
                        <th className="algoTimingCeldaMs">Feed SQL</th>
                        <th className="algoTimingCeldaMs">Perfil</th>
                        <th>Samples</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {historial.map((reg, i) => (
                        <tr key={reg.ts + i} className="algoTimingFila">
                            <td className="algoTimingCeldaSecundaria">{historial.length - i}</td>
                            <td className="algoTimingCeldaNombre">{formatFecha(reg.ts)}</td>
                            <td className={`algoTimingCeldaMs ${claseMs(reg.totalMs)}`}>{formatMs(reg.totalMs)}</td>
                            <td className={`algoTimingCeldaMs ${claseMs(reg.etapas?.sqlFeed ?? 0)}`}>{formatMs(reg.etapas?.sqlFeed)}</td>
                            <td className={`algoTimingCeldaMs ${claseMs(reg.etapas?.perfilUsuario ?? 0)}`}>{formatMs(reg.etapas?.perfilUsuario)}</td>
                            <td className="algoTimingCeldaSecundaria">{reg.meta?.totalSamples ?? '—'}</td>
                            <td>
                                <BotonBase variante="ghost" tamano="md" onClick={() => onSeleccionar(reg)} type="button">
                                    Ver
                                </BotonBase>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/* -------- Modal principal -------- */
export const ModalAlgoTiming = (): JSX.Element | null => {
    const abierto = useAlgoTimingStore(s => s.abierto);
    const cerrar = useAlgoTimingStore(s => s.cerrar);
    const historial = useAlgoTimingStore(s => s.historial);
    const cargando = useAlgoTimingStore(s => s.cargando);
    const error = useAlgoTimingStore(s => s.error);
    const cargarHistorial = useAlgoTimingStore(s => s.cargarHistorial);
    const limpiarHistorial = useAlgoTimingStore(s => s.limpiarHistorial);

    const [tab, setTab] = useState<TabTiming>('ultima');
    const [detalleHistorial, setDetalleHistorial] = useState<RegistroTiming | null>(null);

    if (!abierto) return null;

    const ultima = historial[0] ?? null;

    /* Si el usuario seleccionó un registro del historial, mostrar ese detalle */
    const registroDetalle = detalleHistorial ?? ultima;

    const verDetalle = (reg: RegistroTiming) => {
        setDetalleHistorial(reg);
        setTab('ultima');
    };

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="grande">
            <div className="algoTimingModal">
                <div className="algoTimingCabecera">
                    <div className="algoTimingTitulo">
                        <Activity size={16} />
                        <span>Rendimiento del algoritmo</span>
                        <span className="algoTimingSubtitulo">User ID 1</span>
                    </div>
                    <div className="algoTimingAcciones">
                        <BotonBase
                            variante="ghost"
                            tamano="sm"
                            onClick={() => void cargarHistorial()}
                            disabled={cargando}
                            type="button"
                        >
                            <RefreshCw size={12} className={cargando ? 'algoTimingRotando' : ''} />
                            Refrescar
                        </BotonBase>
                        <BotonBase
                            variante="ghost"
                            tamano="sm"
                            onClick={() => { void limpiarHistorial(); setDetalleHistorial(null); }}
                            type="button"
                        >
                            <Trash2 size={12} />
                            Limpiar
                        </BotonBase>
                    </div>
                </div>

                {error && <p className="algoTimingError">{error}</p>}
                {cargando && <p className="algoTimingCargando">Cargando...</p>}

                {/* Tabs */}
                <div className="algoTimingTabs">
                    <BotonBase
                        variante={tab === 'ultima' ? 'primario' : 'ghost'}
                        tamano="sm"
                        className="algoTimingTab"
                        onClick={() => { setTab('ultima'); setDetalleHistorial(null); }}
                    >
                        {detalleHistorial ? 'Registro seleccionado' : 'Última medición'}
                    </BotonBase>
                    <BotonBase
                        variante={tab === 'promedio' ? 'primario' : 'ghost'}
                        tamano="sm"
                        className="algoTimingTab"
                        onClick={() => setTab('promedio')}
                    >
                        Promedio ({historial.length})
                    </BotonBase>
                    <BotonBase
                        variante={tab === 'historial' ? 'primario' : 'ghost'}
                        tamano="sm"
                        className="algoTimingTab"
                        onClick={() => setTab('historial')}
                    >
                        Historial
                    </BotonBase>
                </div>

                <div className="algoTimingContenido">
                    {tab === 'ultima' && (
                        registroDetalle
                            ? <TabUltima registro={registroDetalle} />
                            : <p className="algoTimingVacio">Sin mediciones todavía. Recarga el feed siendo user 1.</p>
                    )}
                    {tab === 'promedio' && <TabPromedio historial={historial} />}
                    {tab === 'historial' && (
                        <TabHistorial historial={historial} onSeleccionar={verDetalle} />
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ModalAlgoTiming;
