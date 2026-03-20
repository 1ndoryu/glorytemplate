/*
 * Subcomponentes auxiliares para TabColaIaAdmin.
 * Extraidos para mantener el componente principal bajo 300 lineas.
 */

import { AlertCircle, Clock, ChevronUp, ChevronDown, RotateCcw, CheckCircle, XCircle, Key } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import type { ItemColaIa, EstadisticasColaIa, CuotaGroq, EstadoKeysGroq } from '../../services/apiColaIa';
import { useT } from '@app/utils/i18n/useT';

/* Mapa de colores para badges de estado */
export const COLORES_ESTADO: Record<string, 'exito' | 'advertencia' | 'error' | 'info' | 'neutro'> = {
    pendiente: 'info',
    procesando: 'advertencia',
    completado: 'exito',
    error_reintento: 'advertencia',
    error_final: 'error',
};

export const ETIQUETAS_ESTADO: Record<string, string> = {
    pendiente: 'Pendiente',
    procesando: 'Procesando',
    completado: 'Completado',
    error_reintento: 'Reintento',
    error_final: 'Error final',
};

/* Formateador de fecha compacto */
const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
};

/* Resumen de estadisticas */
export const EstadisticasResumen = ({ stats }: { stats: EstadisticasColaIa }): JSX.Element => {
    const { t } = useT();
    return (
        <div className="colaIaEstadisticas">
            <div className="colaIaStat">
                <span className="colaIaStatNumero">{stats.total}</span>
                <span className="colaIaStatLabel">{t('admin.cola.total')}</span>
            </div>
            <div className="colaIaStat colaIaStatPendiente">
                <span className="colaIaStatNumero">{stats.pendientes}</span>
                <span className="colaIaStatLabel">{t('admin.cola.pendientes')}</span>
            </div>
            <div className="colaIaStat colaIaStatProcesando">
                <span className="colaIaStatNumero">{stats.procesando}</span>
                <span className="colaIaStatLabel">{t('admin.cola.procesando')}</span>
            </div>
            <div className="colaIaStat colaIaStatExito">
                <span className="colaIaStatNumero">{stats.completados_hoy}</span>
                <span className="colaIaStatLabel">{t('admin.cola.completadosHoy')}</span>
            </div>
            <div className="colaIaStat colaIaStatError">
                <span className="colaIaStatNumero">{stats.errores + stats.en_reintento}</span>
                <span className="colaIaStatLabel">{t('admin.cola.errores')}</span>
            </div>
        </div>
    );
};

/* Estado de las API Keys Groq (GROQ_API_1/2/3) — confirma que las 3 están configuradas */
export const KeysGroqEstado = ({ estado }: { estado: EstadoKeysGroq }): JSX.Element => {
    const todasOk = estado.total_configuradas === 3;
    const ninguna = estado.total_configuradas === 0;
    const indiceActivo = estado.indice_actual;

    return (
        <div className="colaIaKeysEstado">
            <div className="colaIaKeysTitulo">
                <Key size={14} />
                <span>Keys Groq</span>
                {todasOk
                    ? <Badge variante="exito">3/3 OK</Badge>
                    : <Badge variante={ninguna ? 'error' : 'advertencia'}>{estado.total_configuradas}/3 configuradas</Badge>
                }
            </div>
            <div className="colaIaKeysList">
                {estado.keys.map((k, i) => (
                    <div
                        key={k.nombre}
                        className={`colaIaKeyItem${i === indiceActivo && k.configurada ? ' colaIaKeyActiva' : ''}`}
                        title={k.configurada ? `Preview: ${k.preview}` : 'No configurada — agregar al .env del servidor'}
                    >
                        {k.configurada
                            ? <CheckCircle size={13} className="colaIaKeyOk" />
                            : <XCircle size={13} className="colaIaKeyError" />
                        }
                        <span className="colaIaKeyNombre">{k.nombre}</span>
                        {i === indiceActivo && k.configurada && (
                            <Badge variante="info">activa ahora</Badge>
                        )}
                    </div>
                ))}
                {!todasOk && (
                    <div className="colaIaKeyItem">
                        {estado.legacy_groq_api.configurada
                            ? <CheckCircle size={13} className="colaIaKeyOk" />
                            : <XCircle size={13} className="colaIaKeyError" />
                        }
                        <span className="colaIaKeyNombre">GROQ_API (legacy)</span>
                        {estado.legacy_groq_api.configurada
                            ? <Badge variante="advertencia">fallback</Badge>
                            : <Badge variante="error">falta</Badge>
                        }
                    </div>
                )}
            </div>
            {(estado.ultimo_audio_ts || estado.contador_diario > 0) && (
                <div className="colaIaKeysExtra">
                    {estado.ultimo_audio_ts && <span><Clock size={12} /> Último audio: {estado.ultimo_audio_ts}</span>}
                    {estado.contador_diario > 0 && <span>Procesados hoy: {estado.contador_diario}</span>}
                </div>
            )}
        </div>
    );
};

/* Cuota de Groq */
export const CuotaGroqResumen = ({ cuota }: { cuota: CuotaGroq }): JSX.Element => {
    const pctReq = cuota.limitRequests > 0
        ? Math.round((cuota.remainingRequests / cuota.limitRequests) * 100) : 0;
    const pctTok = cuota.limitTokens > 0
        ? Math.round((cuota.remainingTokens / cuota.limitTokens) * 100) : 0;
    const clasePctReq = pctReq <= 10 ? 'colaIaStatError' : pctReq <= 30 ? 'colaIaStatPendiente' : '';
    const clasePctTok = pctTok <= 10 ? 'colaIaStatError' : pctTok <= 30 ? 'colaIaStatPendiente' : '';

    return (
        <div className="colaIaCuotaGroq">
            <span className="colaIaCuotaTitulo">Cuota Groq</span>
            <div className="colaIaEstadisticas">
                <div className={`colaIaStat ${clasePctReq}`}>
                    <span className="colaIaStatNumero">{cuota.remainingRequests.toLocaleString()}/{cuota.limitRequests.toLocaleString()}</span>
                    <span className="colaIaStatLabel">Requests ({pctReq}%)</span>
                </div>
                <div className={`colaIaStat ${clasePctTok}`}>
                    <span className="colaIaStatNumero">{cuota.remainingTokens.toLocaleString()}/{cuota.limitTokens.toLocaleString()}</span>
                    <span className="colaIaStatLabel">Tokens ({pctTok}%)</span>
                </div>
                {cuota.resetRequests && (
                    <div className="colaIaStat">
                        <span className="colaIaStatNumero">{cuota.resetRequests}</span>
                        <span className="colaIaStatLabel">Reset requests</span>
                    </div>
                )}
            </div>
        </div>
    );
};

/* Header clickable para ordenar */
export const CabeceraOrdenable = ({
    columna, etiqueta, sortCol, sortDir, onOrdenar,
}: {
    columna: string;
    etiqueta: string;
    sortCol: string;
    sortDir: 'ASC' | 'DESC';
    onOrdenar: (col: string) => void;
}): JSX.Element => {
    const activa = sortCol === columna;
    return (
        <th
            className="colaIaThOrdenable"
            onClick={() => onOrdenar(columna)}
            title={`Ordenar por ${etiqueta}`}
        >
            <span>{etiqueta}</span>
            {activa && (sortDir === 'ASC' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </th>
    );
};

/* Fila de item en la tabla */
export const FilaItemColaIa = ({
    item, onReintentar,
}: {
    item: ItemColaIa;
    onReintentar: (id: number) => Promise<void>;
}): JSX.Element => {
    const puedeReintentar = item.estado === 'error_reintento' || item.estado === 'error_final';

    return (
        <tr>
            <td>{item.id}</td>
            <td><Badge variante="neutro">{item.tipo}</Badge></td>
            <td>#{item.entidad_id}</td>
            <td className="colaIaOperacion">{item.operacion.replace(/_/g, ' ')}</td>
            <td>
                <Badge variante={COLORES_ESTADO[item.estado] ?? 'neutro'}>
                    {ETIQUETAS_ESTADO[item.estado] ?? item.estado}
                </Badge>
            </td>
            <td>{item.intentos}/{item.max_intentos}</td>
            <td className="colaIaError" title={item.ultimo_error ?? ''}>
                {item.ultimo_error ? (
                    <span className="colaIaErrorTexto">
                        <AlertCircle size={12} />
                        {item.ultimo_error.substring(0, 100)}
                        {item.ultimo_error.length > 100 ? '...' : ''}
                    </span>
                ) : (
                    <span className="colaIaSinError"><Clock size={12} /></span>
                )}
            </td>
            <td>{formatearFecha(item.proximo_intento)}</td>
            <td>{formatearFecha(item.created_at)}</td>
            <td>{formatearFecha(item.procesado_at)}</td>
            <td>
                {puedeReintentar && (
                    <BotonBase
                        onClick={() => onReintentar(item.id)}
                        variante="secundario"
                        tamano="sm"
                        title="Reintentar"
                    >
                        <RotateCcw size={12} />
                    </BotonBase>
                )}
            </td>
        </tr>
    );
};
