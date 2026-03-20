/*
 * Componente: TabColaIaAdmin — QK49
 * Tab del panel admin para visualizar la cola de procesamiento IA.
 * Tabla completa con busqueda, ordenamiento por columna y paginacion.
 * Solo vista — logica delegada a useTabColaIa.
 */

import { RefreshCw, Play, RotateCcw, Search, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import { EstadoVacio } from '../ui/EstadoVacio';
import { CampoTexto } from '../ui/CampoTexto';
import { useTabColaIa } from '../../hooks/useTabColaIa';
import { useT } from '@app/utils/i18n/useT';
import {
    EstadisticasResumen,
    CuotaGroqResumen,
    KeysGroqEstado,
    CabeceraOrdenable,
    FilaItemColaIa,
} from './ColaIaSubcomponentes';
import '../../styles/componentes/colaIaAdmin.css';

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

/* Columnas ordenables del header */
const COLUMNAS = [
    { col: 'id', etiqueta: 'ID' },
    { col: 'tipo', etiqueta: 'Tipo' },
    { col: 'entidad_id', etiqueta: 'Entidad' },
    { col: 'operacion', etiqueta: 'Operación' },
    { col: 'estado', etiqueta: 'Estado' },
    { col: 'intentos', etiqueta: 'Intentos' },
    { col: 'ultimo_error', etiqueta: 'Error' },
    { col: 'proximo_intento', etiqueta: 'Proximo intento' },
    { col: 'created_at', etiqueta: 'Creado' },
    { col: 'procesado_at', etiqueta: 'Procesado' },
] as const;

export const TabColaIaAdmin = (): JSX.Element => {
    const cola = useTabColaIa();
    const { t } = useT();

    return (
        <div className="tabColaIa">
            {cola.estadisticas && <EstadisticasResumen stats={cola.estadisticas} />}
            {cola.estadoKeys && <KeysGroqEstado estado={cola.estadoKeys} />}
            {cola.cuotaGroq && <CuotaGroqResumen cuota={cola.cuotaGroq} />}

            {/* Barra de controles: busqueda + filtros + acciones */}
            <div className="colaIaAcciones">
                <div className="colaIaFiltros">
                    <div className="adminBusquedaContenedor">
                        <Search size={14} className="adminBusquedaIcono" />
                        <CampoTexto
                            className="adminUsuariosBusqueda"
                            variante="bordado"
                            placeholder={t('admin.buscar.colaIa')}
                            value={cola.busqueda}
                            onChange={(e) => cola.setBusqueda(e.target.value)}
                        />
                    </div>
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
                    <BotonBase onClick={cola.recargar} variante="secundario" disabled={cola.cargando}>
                        <RefreshCw size={14} /> {t('admin.recargar')}
                    </BotonBase>
                    <BotonBase onClick={cola.reintentarTodos} variante="secundario" disabled={cola.procesando}>
                        <RotateCcw size={14} /> {t('admin.reintentar')}
                    </BotonBase>
                    <BotonBase onClick={cola.procesarAhora} variante="primario" disabled={cola.procesando}>
                        {cola.procesando ? <Loader2 size={14} className="adminSpinner" /> : <Play size={14} />}
                        {t('admin.procesarAhora')}
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

            {cola.cargando && (
                <div className="colaIaCargando">
                    <Loader2 size={20} className="adminSpinner" />
                </div>
            )}

            {!cola.cargando && cola.items.length === 0 && (
                <EstadoVacio
                    mensaje={t('admin.colaVacia')}
                    icono={<CheckCircle size={24} />}
                />
            )}

            {/* Tabla completa con headers ordenables */}
            {!cola.cargando && cola.items.length > 0 && (
                <div className="colaIaTabla adminTablaContenedor">
                    <table className="adminTabla">
                        <thead>
                            <tr>
                                {COLUMNAS.map(({ col, etiqueta }) => (
                                    <CabeceraOrdenable
                                        key={col}
                                        columna={col}
                                        etiqueta={etiqueta}
                                        sortCol={cola.sortCol}
                                        sortDir={cola.sortDir}
                                        onOrdenar={cola.ordenarPor}
                                    />
                                ))}
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cola.items.map(item => (
                                <FilaItemColaIa
                                    key={item.id}
                                    item={item}
                                    onReintentar={cola.reintentarItem}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginacion con total */}
            {!cola.cargando && cola.items.length > 0 && (
                <div className="colaIaPaginacion">
                    <BotonBase
                        onClick={() => cola.setPagina(Math.max(1, cola.pagina - 1))}
                        variante="secundario"
                        disabled={cola.pagina <= 1}
                    >
                        <ChevronLeft size={14} /> Anterior
                    </BotonBase>
                    <span className="colaIaPaginaActual">
                        {cola.pagina} / {cola.totalPaginas} ({cola.total} total)
                    </span>
                    <BotonBase
                        onClick={() => cola.setPagina(cola.pagina + 1)}
                        variante="secundario"
                        disabled={cola.pagina >= cola.totalPaginas}
                    >
                        Siguiente <ChevronRight size={14} />
                    </BotonBase>
                </div>
            )}
        </div>
    );
};
