/*
 * DesgloseExplain — Desglose visual del EXPLAIN ANALYZE de PostgreSQL.
 *
 * Muestra timing real por CTE y operaciones principales del query del feed.
 * Extraído de ModalAlgoTiming para respetar el límite de 300 líneas por componente.
 *
 * [2003A-3-B] Creado para profiling detallado del query CTE del feed.
 */

import type { RegistroTiming, NodoExplain } from '@app/stores/algoTimingStore';

function claseMs(ms: number): string {
    if (ms > 400) return 'timingAlto';
    if (ms > 100) return 'timingMedio';
    return 'timingBajo';
}

function formatMs(ms: number | undefined): string {
    if (ms === undefined || ms === null) return '—';
    return ms.toFixed(1) + ' ms';
}

export const DesgloseExplain = ({ explain }: { explain: NonNullable<RegistroTiming['explain']> }): JSX.Element => {
    const { nodos, planificacionMs, ejecucionMs } = explain;
    const ctes = nodos.filter((n: NodoExplain) => n.esCte);
    const operaciones = nodos.filter((n: NodoExplain) => !n.esCte);

    return (
        <div className="algoTimingExplain">
            <h4 className="algoTimingExplainTitulo">Desglose CTE (EXPLAIN ANALYZE)</h4>

            <div className="algoTimingMeta">
                <span>Planificación: <strong>{formatMs(planificacionMs)}</strong></span>
                <span>Ejecución: <strong>{formatMs(ejecucionMs)}</strong></span>
            </div>

            {ctes.length > 0 && (
                <>
                    <h5 className="algoTimingExplainSubtitulo">CTEs ({ctes.length})</h5>
                    <table className="algoTimingTabla">
                        <thead>
                            <tr>
                                <th>CTE</th>
                                <th className="algoTimingCeldaMs">Total</th>
                                <th className="algoTimingCeldaMs">Exclusivo</th>
                                <th className="algoTimingCeldaPct">Filas</th>
                                <th className="algoTimingCeldaBarra"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {ctes.map((nodo: NodoExplain, i: number) => {
                                const pctTotal = ejecucionMs > 0 ? (nodo.totalMs / ejecucionMs) * 100 : 0;
                                return (
                                    <tr key={i} className={`algoTimingFila ${claseMs(nodo.totalMs)}`}>
                                        <td className="algoTimingCeldaNombre">{nodo.etiqueta}</td>
                                        <td className="algoTimingCeldaMs">{formatMs(nodo.totalMs)}</td>
                                        <td className="algoTimingCeldaMs algoTimingCeldaSecundaria">{formatMs(nodo.exclusivoMs)}</td>
                                        <td className="algoTimingCeldaPct">{nodo.filas.toLocaleString()}</td>
                                        <td className="algoTimingCeldaBarra">
                                            <div className="algoTimingBarra">
                                                <div
                                                    className={`algoTimingBarraRelleno ${claseMs(nodo.totalMs)}`}
                                                    style={{ width: `${Math.min(100, pctTotal)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}

            {operaciones.length > 0 && (
                <>
                    <h5 className="algoTimingExplainSubtitulo">Operaciones principales</h5>
                    <table className="algoTimingTabla">
                        <thead>
                            <tr>
                                <th>Operación</th>
                                <th className="algoTimingCeldaMs">Total</th>
                                <th className="algoTimingCeldaMs">Exclusivo</th>
                                <th className="algoTimingCeldaPct">Filas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operaciones.slice(0, 15).map((nodo: NodoExplain, i: number) => (
                                <tr key={i} className={`algoTimingFila ${claseMs(nodo.exclusivoMs)}`}>
                                    <td className="algoTimingCeldaNombre" style={{ paddingLeft: `${nodo.profundidad * 12 + 8}px` }}>
                                        {nodo.etiqueta}
                                    </td>
                                    <td className="algoTimingCeldaMs">{formatMs(nodo.totalMs)}</td>
                                    <td className="algoTimingCeldaMs algoTimingCeldaSecundaria">{formatMs(nodo.exclusivoMs)}</td>
                                    <td className="algoTimingCeldaPct">{nodo.filas.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};
