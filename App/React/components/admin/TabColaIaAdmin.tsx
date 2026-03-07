/*
 * Componente: TabColaIaAdmin — C356
 * Tab del panel admin para visualizar y gestionar la cola de procesamiento IA.
 * Muestra estadisticas, lista de items con filtros, y acciones de reintento.
 * Solo vista — logica delegada a useTabColaIa.
 */

import { RefreshCw, Play, RotateCcw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabColaIa } from '../../hooks/useTabColaIa';
import type { ItemColaIa, EstadisticasColaIa, CuotaGroq } from '../../services/apiColaIa';
import '../../styles/componentes/colaIaAdmin.css';

/* Mapa de colores para badges de estado */
const COLORES_ESTADO: Record<string, 'exito' | 'advertencia' | 'error' | 'info' | 'neutro'> = {
    pendiente: 'info',
    procesando: 'advertencia',
    completado: 'exito',
    error_reintento: 'advertencia',
    error_final: 'error',
};

/* Etiquetas legibles para estados */
const ETIQUETAS_ESTADO: Record<string, string> = {
    pendiente: 'Pendiente',
    procesando: 'Procesando',
    completado: 'Completado',
    error_reintento: 'Reintento',
    error_final: 'Error final',
};

/* Opciones de filtro */
const OPCIONES_ESTADO = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'procesando', etiqueta: 'Procesando' },
    { valor: 'completado', etiqueta: 'Completado' },
    { valor: 'error_reintento', etiqueta: 'Error (reintento)' },
    { valor: 'error_final', etiqueta: 'Error final' },
];

const OPCIONES_TIPO = [
    { valor: '', etiqueta: 'Todos los tipos' },
    { valor: 'sample', etiqueta: 'Sample' },
    { valor: 'publicacion', etiqueta: 'Publicación' },
    { valor: 'comentario', etiqueta: 'Comentario' },
];

export const TabColaIaAdmin = (): JSX.Element => {
    const cola = useTabColaIa();

    return (
        <div className="tabColaIa">
            {/* Estadisticas resumidas */}
            {cola.estadisticas && <EstadisticasResumen stats={cola.estadisticas} />}

            {/* Cuota Groq */}
            {cola.cuotaGroq && <CuotaGroqResumen cuota={cola.cuotaGroq} />}

            {/* Barra de acciones */}
            <div className="colaIaAcciones">
                <div className="colaIaFiltros">
                    <SelectorMenu
                        opciones={OPCIONES_ESTADO}
                        valor={cola.filtroEstado}
                        onChange={cola.setFiltroEstado}
                    />
                    <SelectorMenu
                        opciones={OPCIONES_TIPO}
                        valor={cola.filtroTipo}
                        onChange={cola.setFiltroTipo}
                    />
                </div>

                <div className="colaIaBotones">
                    <BotonBase
                        onClick={cola.recargar}
                        variante="secundario"
                        disabled={cola.cargando}
                        title="Recargar"
                    >
                        <RefreshCw size={14} />
                        Recargar
                    </BotonBase>

                    <BotonBase
                        onClick={cola.reintentarTodos}
                        variante="secundario"
                        disabled={cola.procesando}
                        title="Reintentar todos los items con error"
                    >
                        <RotateCcw size={14} />
                        Reintentar todos
                    </BotonBase>

                    <BotonBase
                        onClick={cola.procesarAhora}
                        variante="primario"
                        disabled={cola.procesando}
                        title="Procesar cola ahora (sin esperar cron)"
                    >
                        {cola.procesando ? <Loader2 size={14} className="adminSpinner" /> : <Play size={14} />}
                        Procesar ahora
                    </BotonBase>
                </div>
            </div>

            {/* Resultado del ultimo procesamiento */}
            {cola.ultimoResultado && (
                <div className="colaIaResultado">
                    <CheckCircle size={14} />
                    <span>
                        Procesados: {cola.ultimoResultado.procesados} |
                        Exitosos: {cola.ultimoResultado.exitosos} |
                        Errores: {cola.ultimoResultado.errores}
                        {cola.ultimoResultado.rateLimited && ' | Rate limited'}
                    </span>
                </div>
            )}

            {/* Loading */}
            {cola.cargando && (
                <div className="colaIaCargando">
                    <Loader2 size={20} className="adminSpinner" />
                </div>
            )}

            {/* Lista de items */}
            {!cola.cargando && cola.items.length === 0 && (
                <EstadoVacio
                    mensaje="No hay items en la cola con los filtros seleccionados."
                    icono={<CheckCircle size={24} />}
                />
            )}

            {!cola.cargando && cola.items.length > 0 && (
                <div className="colaIaTabla">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Entidad</th>
                                <th>Operación</th>
                                <th>Estado</th>
                                <th>Intentos</th>
                                <th>Error</th>
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cola.items.map(item => (
                                <FilaItem
                                    key={item.id}
                                    item={item}
                                    onReintentar={cola.reintentarItem}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginacion simple */}
            {!cola.cargando && cola.items.length > 0 && (
                <div className="colaIaPaginacion">
                    <BotonBase
                        onClick={() => cola.setPagina(Math.max(1, cola.pagina - 1))}
                        variante="secundario"
                        disabled={cola.pagina <= 1}
                    >
                        Anterior
                    </BotonBase>
                    <span className="colaIaPaginaActual">Página {cola.pagina}</span>
                    <BotonBase
                        onClick={() => cola.setPagina(cola.pagina + 1)}
                        variante="secundario"
                        disabled={cola.items.length < 20}
                    >
                        Siguiente
                    </BotonBase>
                </div>
            )}
        </div>
    );
};

/* Subcomponente: Resumen de estadisticas */
const EstadisticasResumen = ({ stats }: { stats: EstadisticasColaIa }): JSX.Element => (
    <div className="colaIaEstadisticas">
        <div className="colaIaStat">
            <span className="colaIaStatNumero">{stats.total}</span>
            <span className="colaIaStatLabel">Total</span>
        </div>
        <div className="colaIaStat colaIaStatPendiente">
            <span className="colaIaStatNumero">{stats.pendientes}</span>
            <span className="colaIaStatLabel">Pendientes</span>
        </div>
        <div className="colaIaStat colaIaStatProcesando">
            <span className="colaIaStatNumero">{stats.procesando}</span>
            <span className="colaIaStatLabel">Procesando</span>
        </div>
        <div className="colaIaStat colaIaStatExito">
            <span className="colaIaStatNumero">{stats.completados_hoy}</span>
            <span className="colaIaStatLabel">Completados hoy</span>
        </div>
        <div className="colaIaStat colaIaStatError">
            <span className="colaIaStatNumero">{stats.errores + stats.en_reintento}</span>
            <span className="colaIaStatLabel">Errores</span>
        </div>
    </div>
);

/* Subcomponente: Cuota de Groq */
const CuotaGroqResumen = ({ cuota }: { cuota: CuotaGroq }): JSX.Element => {
    const pctRequests = cuota.limitRequests > 0
        ? Math.round((cuota.remainingRequests / cuota.limitRequests) * 100)
        : 0;
    const pctTokens = cuota.limitTokens > 0
        ? Math.round((cuota.remainingTokens / cuota.limitTokens) * 100)
        : 0;

    const clasePctReq = pctRequests <= 10 ? 'colaIaStatError' : pctRequests <= 30 ? 'colaIaStatPendiente' : '';
    const clasePctTok = pctTokens <= 10 ? 'colaIaStatError' : pctTokens <= 30 ? 'colaIaStatPendiente' : '';

    return (
        <div className="colaIaCuotaGroq">
            <span className="colaIaCuotaTitulo">Cuota Groq</span>
            <div className="colaIaEstadisticas">
                <div className={`colaIaStat ${clasePctReq}`}>
                    <span className="colaIaStatNumero">{cuota.remainingRequests.toLocaleString()}/{cuota.limitRequests.toLocaleString()}</span>
                    <span className="colaIaStatLabel">Requests ({pctRequests}%)</span>
                </div>
                <div className={`colaIaStat ${clasePctTok}`}>
                    <span className="colaIaStatNumero">{cuota.remainingTokens.toLocaleString()}/{cuota.limitTokens.toLocaleString()}</span>
                    <span className="colaIaStatLabel">Tokens ({pctTokens}%)</span>
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

/* Subcomponente: Fila de item en la tabla */
const FilaItem = ({
    item,
    onReintentar,
}: {
    item: ItemColaIa;
    onReintentar: (id: number) => Promise<void>;
}): JSX.Element => {
    const puedeReintentar = item.estado === 'error_reintento' || item.estado === 'error_final';
    const fechaCreado = new Date(item.created_at).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <tr>
            <td>{item.id}</td>
            <td>
                <Badge variante="neutro">{item.tipo}</Badge>
            </td>
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
                        {item.ultimo_error.substring(0, 60)}
                        {item.ultimo_error.length > 60 ? '...' : ''}
                    </span>
                ) : (
                    <span className="colaIaSinError">
                        <Clock size={12} />
                    </span>
                )}
            </td>
            <td>{fechaCreado}</td>
            <td>
                {puedeReintentar && (
                    <BotonBase
                        onClick={() => onReintentar(item.id)}
                        variante="secundario"
                        tamano="sm"
                        title="Reintentar este item"
                    >
                        <RotateCcw size={12} />
                    </BotonBase>
                )}
            </td>
        </tr>
    );
};
