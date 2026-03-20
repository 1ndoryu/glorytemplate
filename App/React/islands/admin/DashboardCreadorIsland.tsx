/*
 * Isla: DashboardCreadorIsland — Kamples (Fase 7.3)
 * Panel de estadísticas del creador: ingresos, descargas,
 * reproducciones, top samples, transacciones recientes.
 * Logica extraida a useDashboardCreador (SRP).
 * Seccion Connect extraida a SeccionConnect (SRP).
 */

import {
    DollarSign,
    Download,
    Headphones,
    Users,
    Music2,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    BarChart3,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { TabBar } from '@app/components/ui/TabBar';
import { SeccionConnect } from '@app/components/ui/SeccionConnect';
import type { IngresosPorPeriodo } from '@app/services/apiPagos';
import { useDashboardCreador } from '@app/hooks/useDashboardCreador';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { Skeleton } from '@app/components/skeletons';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/dashboard.css';

/* Tabs del dashboard — claves i18n, se traducen en render */
const TABS_DASHBOARD: { id: string; claveI18n: string }[] = [
    { id: 'resumen', claveI18n: 'dashboard.resumen' },
    { id: 'samples', claveI18n: 'dashboard.samples' },
    { id: 'transacciones', claveI18n: 'dashboard.transacciones' },
];

/* Formatear moneda */
const formatearMoneda = (monto: number): string => `$${Number(monto).toFixed(2)}`;

/* Formatear número con K/M */
const formatearNumero = (n: number): string => {
    const num = Number(n);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

/* Formatear fecha corta */
const formatearFecha = (fecha: string): string =>
    new Date(fecha).toLocaleDateString('es', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

/* Tarjeta de estadística */
const TarjetaStat = ({ titulo, valor, icono, cambio }: {
    titulo: string; valor: string; icono: React.ReactNode;
    cambio?: { valor: number; positivo: boolean };
}): JSX.Element => (
    <div className="dashboardStat">
        <div className="dashboardStatHeader">
            <span className="dashboardStatTitulo">{titulo}</span>
            <span className="dashboardStatIcono">{icono}</span>
        </div>
        <div className="dashboardStatValor">{valor}</div>
        {cambio && (
            <div className={`dashboardStatCambio ${cambio.positivo ? 'dashboardStatCambioPositivo' : 'dashboardStatCambioNegativo'}`}>
                {cambio.positivo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{cambio.valor}% vs. mes anterior</span>
            </div>
        )}
    </div>
);

/* Mini gráfica de barras para ingresos */
const GraficaIngresos = ({ datos }: { datos: IngresosPorPeriodo[] }): JSX.Element => {
    const maxMonto = Math.max(...datos.map((d) => d.monto), 1);
    return (
        <div className="dashboardGrafica">
            <div className="dashboardGraficaBarras">
                {datos.map((d) => (
                    <div
                        key={d.fecha}
                        className="dashboardGraficaBarra"
                        style={{ height: `${(d.monto / maxMonto) * 100}%` }}
                        title={`${d.fecha}: ${formatearMoneda(d.monto)}`}
                    />
                ))}
            </div>
            <div className="dashboardGraficaEje">
                <span>{datos.length > 0 ? datos[0].fecha : ''}</span>
                <span>{datos.length > 0 ? datos[datos.length - 1].fecha : ''}</span>
            </div>
        </div>
    );
};

const DashboardIslandBase = (): JSX.Element => {
    const { t } = useT();
    const {
        tabActiva, setTabActiva, stats, topSamples, transacciones, ingresos,
        cargando, navegar, estadoConnect, balanceConnect, conectando,
        manejarOnboarding, manejarDashboardStripe, cambioIngresos,
    } = useDashboardCreador();

    return (
        <div className="dashboardIsland" id="dashboardIsland">
            {/* Header */}
            <div className="dashboardHeader">
                <div className="dashboardHeaderTitulo">
                    <BarChart3 size={20} />
                    <h1>{t('comun.dashboard')}</h1>
                </div>
                <BotonBase variante="secundario" tamano="sm" onClick={() => navegar('/libreria/')}>
                    {t('comun.irALibreria')}
                </BotonBase>
            </div>

            {cargando ? (
                <div className="dashboardStatsGrid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={`dash-skeleton-${i}`} alto={100} />
                    ))}
                </div>
            ) : (
                <>
                    {/* Tarjetas de stats */}
                    <div className="dashboardStatsGrid">
                        <TarjetaStat
                            titulo={t('dashboard.ingresosMes')}
                            valor={stats ? formatearMoneda(stats.ingresosMes) : '$0.00'}
                            icono={<DollarSign size={16} />}
                            cambio={cambioIngresos}
                        />
                        <TarjetaStat
                            titulo={t('dashboard.descargasMes')}
                            valor={stats ? formatearNumero(stats.descargasMes) : '0'}
                            icono={<Download size={16} />}
                        />
                        <TarjetaStat
                            titulo={t('dashboard.reproducciones')}
                            valor={stats ? formatearNumero(stats.reproduccionesMes) : '0'}
                            icono={<Headphones size={16} />}
                        />
                        <TarjetaStat
                            titulo={t('dashboard.seguidoresNuevos')}
                            valor={stats ? `+${stats.seguidoresNuevosMes}` : '0'}
                            icono={<Users size={16} />}
                        />
                    </div>

                    {/* Sección Stripe Connect */}
                    <SeccionConnect
                        estadoConnect={estadoConnect}
                        balanceConnect={balanceConnect}
                        conectando={conectando}
                        onIniciarOnboarding={manejarOnboarding}
                        onAbrirDashboard={manejarDashboardStripe}
                    />

                    {/* Gráfica de ingresos */}
                    {ingresos.length > 0 && (
                        <div className="dashboardSeccion">
                            <h2 className="dashboardSeccionTitulo">
                                <DollarSign size={16} />
                                {t('dashboard.ingresosUltimos30')}
                            </h2>
                            <GraficaIngresos datos={ingresos} />
                            <div className="dashboardSeccionFooter">
                                <span>Total: {stats ? formatearMoneda(stats.ingresosTotal) : '$0.00'}</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <TabBar
                        tabs={TABS_DASHBOARD.map(tab => ({ id: tab.id, etiqueta: t(tab.claveI18n) }))}
                        activa={tabActiva}
                        onChange={setTabActiva}
                    />

                    {/* Contenido por tab */}
                    {tabActiva === 'resumen' && (
                        <div className="dashboardResumen">
                            <div className="dashboardResumenStats">
                                <div className="dashboardResumenItem">
                                    <Music2 size={14} />
                                    <span>{stats?.samplesPublicados ?? 0} samples publicados</span>
                                </div>
                                <div className="dashboardResumenItem">
                                    <Download size={14} />
                                    <span>{stats ? formatearNumero(stats.descargasTotal) : '0'} descargas totales</span>
                                </div>
                                <div className="dashboardResumenItem">
                                    <Headphones size={14} />
                                    <span>{stats ? formatearNumero(stats.reproduccionesTotal) : '0'} reproducciones totales</span>
                                </div>
                                <div className="dashboardResumenItem">
                                    <Users size={14} />
                                    <span>{stats?.seguidoresTotal ?? 0} seguidores</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {tabActiva === 'samples' && (
                        <div className="dashboardTopSamples">
                            <h3 className="dashboardSubtitulo">Más descargados</h3>
                            <div className="dashboardTabla">
                                <div className="dashboardTablaHead">
                                    <span>Sample</span>
                                    <span>Descargas</span>
                                    <span>Plays</span>
                                    <span>Likes</span>
                                    <span>Ingresos</span>
                                </div>
                                {topSamples.map((s, i) => (
                                    <BotonBase variante="ghost"
                                        key={s.id}
                                        className="dashboardTablaFila"
                                        onClick={() => navegar(`/sample/${s.slug}/`)}
                                        type="button"
                                    >
                                        <span className="dashboardTablaCelda">
                                            <span className="dashboardTablaRank">#{i + 1}</span>
                                            {s.titulo}
                                            <ArrowUpRight size={12} />
                                        </span>
                                        <span>{formatearNumero(s.descargas)}</span>
                                        <span>{formatearNumero(s.reproducciones)}</span>
                                        <span>{formatearNumero(s.likes)}</span>
                                        <span className="dashboardTablaIngresos">
                                            {formatearMoneda(s.ingresos)}
                                        </span>
                                    </BotonBase>
                                ))}
                            </div>
                        </div>
                    )}

                    {tabActiva === 'transacciones' && (
                        <div className="dashboardTransacciones">
                            <h3 className="dashboardSubtitulo">Historial reciente</h3>
                            <div className="dashboardTabla">
                                <div className="dashboardTablaHead">
                                    <span>Fecha</span>
                                    <span>Tipo</span>
                                    <span>Sample</span>
                                    <span>Comprador</span>
                                    <span>Neto</span>
                                </div>
                                {transacciones.map((t) => (
                                    <div key={t.id} className="dashboardTablaFila">
                                        <span>{formatearFecha(t.fecha)}</span>
                                        <span>
                                            <Badge>{t.tipo}</Badge>
                                        </span>
                                        <span>{t.sample}</span>
                                        <span className="dashboardTablaComprador">@{t.comprador}</span>
                                        <span className="dashboardTablaIngresos">
                                            {formatearMoneda(t.neto)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export const DashboardCreadorIsland = conAutenticacion(DashboardIslandBase);
export default DashboardCreadorIsland;
