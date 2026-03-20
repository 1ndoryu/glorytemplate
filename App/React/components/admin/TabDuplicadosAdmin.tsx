/*
 * Componente: TabDuplicadosAdmin — D5
 * Tab del panel admin para moderar samples duplicados.
 * Carga incremental por scroll — logica delegada a usePanelDuplicados.
 */

import { useRef, useEffect, useState } from 'react';
import { RefreshCw, Loader2, CheckCircle, Hash, ChevronDown, ChevronRight } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import { EstadoVacio } from '../ui/EstadoVacio';
import { Badge } from '../ui/Badge';
import { TarjetaDuplicado } from './TarjetaDuplicado';
import { usePanelDuplicados } from '../../hooks/usePanelDuplicados';
import { useT } from '@app/utils/i18n/useT';
import type { GrupoDuplicados } from '../../services/apiAdmin';
import '../../styles/componentes/duplicadosAdmin.css';

/* Opciones de filtro */
const OPCIONES_ESTADO = [
    { valor: 'pendiente', etiqueta: 'Pendientes' },
    { valor: 'aprobado', etiqueta: 'Aprobados' },
    { valor: 'rechazado', etiqueta: 'Rechazados' },
    { valor: 'fusionado', etiqueta: 'Fusionados' },
];

const OPCIONES_TIPO = [
    { valor: '', etiqueta: 'Todos los tipos' },
    { valor: 'cross_usuario', etiqueta: 'Cross-usuario' },
    { valor: 'mismo_usuario', etiqueta: 'Mismo usuario' },
    { valor: 'backfill', etiqueta: 'Backfill' },
];

/*
 * QL70: Grupo colapsable de duplicados del mismo original.
 * Si el grupo tiene una sola instancia, se muestra directo sin cabecera.
 * Si tiene varias, se muestra cabecera expandible con conteo.
 */
const GrupoColapsable = ({ grupo, procesandoId, onAccion }: {
    grupo: GrupoDuplicados;
    procesandoId: number | null;
    onAccion: (id: number, accion: 'fusionar' | 'aprobar' | 'rechazar' | 'intercambiar') => void;
}): JSX.Element => {
    const [expandido, setExpandido] = useState(true);
    const { instancias } = grupo;

    /* Grupo de 1: renderizar tarjeta directa sin wrapper */
    if (instancias.length === 1) {
        return (
            <TarjetaDuplicado
                duplicado={instancias[0]}
                procesando={procesandoId === instancias[0].id}
                onAccion={onAccion}
            />
        );
    }

    return (
        <div className="dupGrupo">
            <BotonBase
                variante="ghost"
                tamano="sm"
                className="dupGrupoCabecera"
                onClick={() => setExpandido(p => !p)}
            >
                {expandido
                    ? <ChevronDown size={16} />
                    : <ChevronRight size={16} />}
                <span className="dupGrupoTitulo">
                    {grupo.originalTitulo || `Sample #${grupo.originalId}`}
                </span>
                <Badge variante="neutro" tamano="xs">
                    {instancias.length} duplicados
                </Badge>
                {grupo.originalHash && (
                    <span className="dupGrupoHash" title={grupo.originalHash}>
                        {grupo.originalHash.slice(0, 8)}…
                    </span>
                )}
            </BotonBase>

            {expandido && (
                <div className="dupGrupoContenido">
                    {instancias.map(d => (
                        <TarjetaDuplicado
                            key={d.id}
                            duplicado={d}
                            procesando={procesandoId === d.id}
                            onAccion={onAccion}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const TabDuplicadosAdmin = (): JSX.Element => {
    const dup = usePanelDuplicados();
    const sentinelaRef = useRef<HTMLDivElement>(null);
    const { t } = useT();
    /* Siempre ref a la ultima version de cargarMas para el observer */
    const cargarMasRef = useRef(dup.cargarMas);
    useEffect(() => { cargarMasRef.current = dup.cargarMas; }, [dup.cargarMas]);

    useEffect(() => {
        const el = sentinelaRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            entries => { if (entries[0]?.isIntersecting) void cargarMasRef.current(); },
            { rootMargin: '300px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div className="tabDuplicados">
            {/* Contador resumen */}
            <div className="dupResumen">
                <span className="dupResumenNumero">{dup.total}</span>
                <span className="dupResumenLabel">{t('admin.duplicados.titulo')}</span>
            </div>

            {/* Barra de filtros y acciones */}
            <div className="dupBarraFiltros">
                <div className="dupFiltros">
                    <SelectorMenu
                        opciones={OPCIONES_ESTADO}
                        valor={dup.filtroEstado}
                        onChange={dup.setFiltroEstado}
                    />
                    <SelectorMenu
                        opciones={OPCIONES_TIPO}
                        valor={dup.filtroTipo}
                        onChange={dup.setFiltroTipo}
                    />
                </div>

                <div className="dupBotonesAccion">
                    <BotonBase
                        onClick={dup.ejecutarBackfill}
                        variante="secundario"
                        tamano="sm"
                        disabled={dup.backfillEnCurso}
                        title="Calcular hashes SHA-256 para samples sin hash (batch 100)"
                    >
                        {dup.backfillEnCurso
                            ? <Loader2 size={14} className="adminSpinner" />
                            : <Hash size={14} />}
                        {t('admin.duplicados.backfill')}
                    </BotonBase>

                    <BotonBase
                        onClick={dup.recargar}
                        variante="secundario"
                        tamano="sm"
                        disabled={dup.cargando}
                        title="Recargar lista"
                    >
                        <RefreshCw size={14} />
                        {t('admin.recargar')}
                    </BotonBase>
                </div>
            </div>

            {/* Resultado del backfill */}
            {dup.backfillStats && (
                <div className="dupBackfillResultado">
                    <CheckCircle size={14} />
                    <span>
                        Procesados: {dup.backfillStats.procesados} |
                        Hasheados: {dup.backfillStats.hasheados} |
                        Duplicados: {dup.backfillStats.duplicados} |
                        Sin archivo: {dup.backfillStats.sin_archivo}
                    </span>
                </div>
            )}

            {/* Loading */}
            {dup.cargando && (
                <div className="dupCargando">
                    <Loader2 size={20} className="adminSpinner" />
                </div>
            )}

            {/* Sin resultados */}
            {!dup.cargando && dup.duplicados.length === 0 && (
                <EstadoVacio
                    mensaje="No hay duplicados con los filtros seleccionados."
                    icono={<CheckCircle size={24} />}
                />
            )}

            {/* QL70: Lista agrupada por original */}
            {!dup.cargando && dup.grupos.length > 0 && (
                <div className="dupLista">
                    {dup.grupos.map(grupo => (
                        <GrupoColapsable
                            key={grupo.originalId}
                            grupo={grupo}
                            procesandoId={dup.procesandoId}
                            onAccion={dup.ejecutarAccion}
                        />
                    ))}
                </div>
            )}

            {/* Sentinel de scroll infinito */}
            <div ref={sentinelaRef} className="dupSentinela" aria-hidden="true">
                {!dup.cargando && dup.hayMas && (
                    <Loader2 size={16} className="adminSpinner" />
                )}
            </div>
        </div>
    );
};
