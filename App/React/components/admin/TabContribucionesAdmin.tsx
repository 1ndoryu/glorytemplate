/*
 * Componente: TabContribucionesAdmin — C807
 * Tab admin para moderar contribuciones de Sample Discovery.
 * Lista pendientes con acciones aprobar/rechazar.
 */

import { RefreshCw, Loader2, Check, X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { Badge } from '../ui/Badge';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabContribuciones } from '../../hooks/useTabContribuciones';
import type { ContribucionAdmin } from '../../services/apiContribuciones';
import '../../styles/componentes/contribucionesAdmin.css';

const ETIQUETAS_TIPO: Record<string, string> = {
    nueva:       'Nueva relación',
    edicion:     'Edición',
    eliminacion: 'Eliminación',
};

const ETIQUETAS_RELACION: Record<string, string> = {
    sample:        'Sample',
    cover:         'Cover',
    remix:         'Remix',
    interpolation: 'Interpolación',
};

/* Fila de contribución individual */
const FilaContribucion = ({
    item,
    accionEnCurso,
    onAprobar,
    onRechazar,
}: {
    item: ContribucionAdmin;
    accionEnCurso: number | null;
    onAprobar: (id: number) => void;
    onRechazar: (id: number) => void;
}): JSX.Element => {
    const estaActuando = accionEnCurso === item.id;
    const tipoLabel = ETIQUETAS_TIPO[item.tipoContribucion ?? 'nueva'] ?? 'Nueva';
    const relacionLabel = ETIQUETAS_RELACION[item.tipoRelacion] ?? item.tipoRelacion;

    /* Descripción legible del cambio propuesto */
    const descripcion = (() => {
        if (item.cancionNuevaTitulo) {
            const ladoNuevo = item.cancionNuevaTitulo;
            const ladoExistente = item.destinoTitulo ?? item.fuenteTitulo ?? '—';
            return `${ladoNuevo} → ${ladoExistente}`;
        }
        const destino = item.destinoTitulo ?? '—';
        const fuente  = item.fuenteTitulo ?? '—';
        return `${destino} → ${fuente}`;
    })();

    return (
        <div className="contribFila">
            <div className="contribFilaInfo">
                <div className="contribFilaCabecera">
                    <Badge variante="info" tamano="sm">{tipoLabel}</Badge>
                    <Badge variante="neutro" tamano="sm">{relacionLabel}</Badge>
                    <span className="contribFilaUsuario">
                        @{item.contribuidorUsername}
                    </span>
                    <span className="contribFilaFecha">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className="contribFilaDescripcion">{descripcion}</div>
                {item.tipoElemento && (
                    <span className="contribFilaElemento">
                        Elemento: {item.tipoElemento.replace(/_/g, ' ')}
                    </span>
                )}
            </div>
            <div className="contribFilaAcciones">
                <BotonBase
                    onClick={() => onAprobar(item.id)}
                    variante="primario"
                    tamano="sm"
                    disabled={estaActuando}
                >
                    {estaActuando
                        ? <Loader2 size={14} className="adminSpinner" />
                        : <Check size={14} />}
                    Aprobar
                </BotonBase>
                <BotonBase
                    onClick={() => onRechazar(item.id)}
                    variante="peligro"
                    tamano="sm"
                    disabled={estaActuando}
                >
                    {estaActuando
                        ? <Loader2 size={14} className="adminSpinner" />
                        : <X size={14} />}
                    Rechazar
                </BotonBase>
            </div>
        </div>
    );
};

export const TabContribucionesAdmin = (): JSX.Element => {
    const {
        contribuciones,
        total,
        pagina,
        setPagina,
        cargando,
        accionEnCurso,
        error,
        moderar,
        recargar,
    } = useTabContribuciones();

    const totalPaginas = Math.max(1, Math.ceil(total / 20));

    return (
        <div className="tabContribuciones">
            <div className="contribBarraSuperior">
                <div className="contribResumen">
                    <span className="contribResumenNumero">{total}</span>
                    <span className="contribResumenLabel">pendientes</span>
                </div>
                <BotonBase
                    onClick={() => recargar()}
                    variante="secundario"
                    tamano="sm"
                    disabled={cargando}
                >
                    <RefreshCw size={14} />
                    Recargar
                </BotonBase>
            </div>

            {error && (
                <div className="contribError">{error}</div>
            )}

            {cargando && contribuciones.length === 0 && (
                <div className="contribCargando">
                    <Loader2 size={20} className="adminSpinner" />
                </div>
            )}

            {!cargando && contribuciones.length === 0 && (
                <EstadoVacio
                    mensaje="No hay contribuciones pendientes de revisión."
                    icono={<FileText size={24} />}
                />
            )}

            <div className="contribLista">
                {contribuciones.map(c => (
                    <FilaContribucion
                        key={c.id}
                        item={c}
                        accionEnCurso={accionEnCurso}
                        onAprobar={(id) => moderar(id, 'aprobada')}
                        onRechazar={(id) => moderar(id, 'rechazada')}
                    />
                ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="contribPaginacion">
                    <BotonBase
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                        variante="secundario"
                        tamano="sm"
                        disabled={pagina <= 1}
                    >
                        <ChevronLeft size={14} />
                    </BotonBase>
                    <span className="contribPaginaInfo">
                        {pagina} / {totalPaginas}
                    </span>
                    <BotonBase
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                        variante="secundario"
                        tamano="sm"
                        disabled={pagina >= totalPaginas}
                    >
                        <ChevronRight size={14} />
                    </BotonBase>
                </div>
            )}
        </div>
    );
};
