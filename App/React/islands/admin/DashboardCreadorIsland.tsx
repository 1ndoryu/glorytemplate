/*
 * Isla: DashboardCreadorIsland — Kamples (Fase 7.3)
 * Panel de estadísticas del creador: ingresos, descargas,
 * reproducciones, top samples, transacciones recientes.
 * Incluye sección Stripe Connect (onboarding + balance + dashboard).
 * Requiere auth + rol creador.
 */

import { useEffect, useState, useCallback } from 'react';
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
    CreditCard,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    Loader2,
    Wallet,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { TabBar } from '@app/components/ui/TabBar';
import type { TabDefinicion } from '@app/components/ui';
import {
    obtenerEstadisticasCreador,
    obtenerTopSamples,
    obtenerTransacciones,
    obtenerIngresosPorPeriodo,
    iniciarOnboardingConnect,
    obtenerEstadoConnect,
    abrirDashboardStripe,
    obtenerBalanceConnect,
    type EstadisticasCreador,
    type SampleStats,
    type TransaccionCreador,
    type IngresosPorPeriodo,
    type DatosConnect,
    type BalanceConnect,
} from '@app/services/apiPagos';
import { useNavigationStore } from '@/core/router';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/dashboard.css';

/* Tabs del dashboard */
const TABS_DASHBOARD: TabDefinicion[] = [
    { id: 'resumen', etiqueta: 'Resumen' },
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'transacciones', etiqueta: 'Transacciones' },
];

/* Formatear moneda */
const formatearMoneda = (monto: number): string => {
    return `$${monto.toFixed(2)}`;
};

/* Formatear número con K/M */
const formatearNumero = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
};

/* Formatear fecha corta */
const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/* Calcular porcentaje de cambio */
const calcularCambio = (actual: number, anterior: number): { valor: number; positivo: boolean } => {
    if (anterior === 0) return { valor: 0, positivo: true };
    const cambio = ((actual - anterior) / anterior) * 100;
    return { valor: Math.abs(Math.round(cambio)), positivo: cambio >= 0 };
};

/* Componente: tarjeta de estadística */
const TarjetaStat = ({
    titulo,
    valor,
    icono,
    cambio,
}: {
    titulo: string;
    valor: string;
    icono: React.ReactNode;
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

/* Componente: sección de Stripe Connect */
const SeccionConnect = ({
    estadoConnect,
    balanceConnect,
    conectando,
    onIniciarOnboarding,
    onAbrirDashboard,
}: {
    estadoConnect: DatosConnect | null;
    balanceConnect: BalanceConnect | null;
    conectando: boolean;
    onIniciarOnboarding: () => void;
    onAbrirDashboard: () => void;
}): JSX.Element => {
    if (!estadoConnect) return <></>;

    const { estado, cargosActivos, payoutsActivos, detalle, requerimientosPendientes } = estadoConnect;

    return (
        <div className="dashboardSeccion dashboardConnect">
            <h2 className="dashboardSeccionTitulo">
                <CreditCard size={16} />
                Configuración de pagos
            </h2>

            <div className="dashboardConnectEstado">
                {estado === 'no_configurado' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerInfo">
                        <AlertCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Configura Stripe para recibir pagos</strong>
                            <span>Conecta tu cuenta de Stripe para empezar a ganar dinero con tus samples.</span>
                        </div>
                        <BotonBase
                            variante="primario"
                            tamano="sm"
                            onClick={onIniciarOnboarding}
                            disabled={conectando}
                        >
                            {conectando ? (
                                <><Loader2 size={14} className="dashboardSpinner" /> Conectando...</>
                            ) : (
                                <><CreditCard size={14} /> Configurar Stripe</>
                            )}
                        </BotonBase>
                    </div>
                )}

                {estado === 'pendiente' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerAdvertencia">
                        <AlertCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Onboarding incompleto</strong>
                            <span>
                                Tienes {requerimientosPendientes ?? 0} dato(s) pendiente(s) por completar en Stripe.
                            </span>
                        </div>
                        <BotonBase
                            variante="secundario"
                            tamano="sm"
                            onClick={onIniciarOnboarding}
                            disabled={conectando}
                        >
                            {conectando ? (
                                <><Loader2 size={14} className="dashboardSpinner" /> Cargando...</>
                            ) : (
                                <>Completar configuración</>
                            )}
                        </BotonBase>
                    </div>
                )}

                {estado === 'activo' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerExito">
                        <CheckCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Stripe conectado</strong>
                            <span>
                                {cargosActivos && payoutsActivos
                                    ? 'Tu cuenta está activa y recibiendo pagos.'
                                    : 'Tu cuenta está configurada.'}
                            </span>
                        </div>
                        <BotonBase variante="ghost" tamano="sm" onClick={onAbrirDashboard}>
                            <ExternalLink size={14} /> Ver dashboard Stripe
                        </BotonBase>
                    </div>
                )}

                {estado === 'restringido' && (
                    <div className="dashboardConnectBanner dashboardConnectBannerAdvertencia">
                        <AlertCircle size={16} />
                        <div className="dashboardConnectBannerTexto">
                            <strong>Cuenta restringida</strong>
                            <span>{detalle ?? 'Stripe requiere información adicional para activar los pagos.'}</span>
                        </div>
                        <BotonBase variante="secundario" tamano="sm" onClick={onIniciarOnboarding}>
                            Actualizar información
                        </BotonBase>
                    </div>
                )}
            </div>

            {/* Balance cuando la cuenta está activa */}
            {estado === 'activo' && balanceConnect && (
                <div className="dashboardConnectBalance">
                    <div className="dashboardConnectBalanceItem">
                        <Wallet size={14} />
                        <span className="dashboardConnectBalanceLabel">Disponible</span>
                        <span className="dashboardConnectBalanceMonto">
                            ${balanceConnect.disponible.toFixed(2)}
                        </span>
                    </div>
                    <div className="dashboardConnectBalanceItem">
                        <DollarSign size={14} />
                        <span className="dashboardConnectBalanceLabel">Pendiente</span>
                        <span className="dashboardConnectBalanceMonto dashboardConnectBalancePendiente">
                            ${balanceConnect.pendiente.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardIslandBase = (): JSX.Element => {
    const [tabActiva, setTabActiva] = useState('resumen');
    const [stats, setStats] = useState<EstadisticasCreador | null>(null);
    const [topSamples, setTopSamples] = useState<SampleStats[]>([]);
    const [transacciones, setTransacciones] = useState<TransaccionCreador[]>([]);
    const [ingresos, setIngresos] = useState<IngresosPorPeriodo[]>([]);
    const [cargando, setCargando] = useState(true);
    const navegar = useNavigationStore(s => s.navegar);

    /* Estado Connect */
    const [estadoConnect, setEstadoConnect] = useState<DatosConnect | null>(null);
    const [balanceConnect, setBalanceConnect] = useState<BalanceConnect | null>(null);
    const [conectando, setConectando] = useState(false);

    /* Cargar datos */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [resStats, resTop, resTrans, resIngresos, resConnect] = await Promise.all([
                    obtenerEstadisticasCreador(),
                    obtenerTopSamples(),
                    obtenerTransacciones(),
                    obtenerIngresosPorPeriodo('mes'),
                    obtenerEstadoConnect(),
                ]);

                if (resStats.ok && resStats.data) setStats(resStats.data);
                if (resTop.ok && resTop.data) setTopSamples(resTop.data);
                if (resTrans.ok && resTrans.data) setTransacciones(resTrans.data);
                if (resIngresos.ok && resIngresos.data) setIngresos(resIngresos.data);

                if (resConnect.ok && resConnect.data) {
                    setEstadoConnect(resConnect.data);
                    /* Solo cargar balance si la cuenta está activa */
                    if (resConnect.data.estado === 'activo') {
                        const resBalance = await obtenerBalanceConnect();
                        if (resBalance.ok && resBalance.data) setBalanceConnect(resBalance.data);
                    }
                }
            } catch {
                /* Fallo de carga — dashboard queda vacio */
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    /* Iniciar onboarding Connect */
    const manejarOnboarding = useCallback(async () => {
        setConectando(true);
        try {
            const resultado = await iniciarOnboardingConnect();
            if (resultado.ok && resultado.url) {
                window.location.href = resultado.url;
            }
        } catch {
            /* Fallo silencioso */
        } finally {
            setConectando(false);
        }
    }, []);

    /* Abrir dashboard Stripe */
    const manejarDashboardStripe = useCallback(async () => {
        try {
            const resultado = await abrirDashboardStripe();
            if (resultado.ok && resultado.url) {
                window.open(resultado.url, '_blank');
            }
        } catch {
            /* Fallo silencioso */
        }
    }, []);

    const cambioIngresos = stats
        ? calcularCambio(stats.ingresosMes, stats.ingresosAnterior)
        : undefined;

    return (
        <div className="dashboardIsland" id="dashboardIsland">
            {/* Header */}
            <div className="dashboardHeader">
                <div className="dashboardHeaderTitulo">
                    <BarChart3 size={20} />
                    <h1>Dashboard</h1>
                </div>
                <BotonBase variante="secundario" tamano="sm" onClick={() => navegar('/libreria/')}>
                    Ir a librería
                </BotonBase>
            </div>

            {cargando ? (
                <div className="dashboardVacio">Cargando estadísticas...</div>
            ) : (
                <>
                    {/* Tarjetas de stats */}
                    <div className="dashboardStatsGrid">
                        <TarjetaStat
                            titulo="Ingresos del mes"
                            valor={stats ? formatearMoneda(stats.ingresosMes) : '$0.00'}
                            icono={<DollarSign size={16} />}
                            cambio={cambioIngresos}
                        />
                        <TarjetaStat
                            titulo="Descargas del mes"
                            valor={stats ? formatearNumero(stats.descargasMes) : '0'}
                            icono={<Download size={16} />}
                        />
                        <TarjetaStat
                            titulo="Reproducciones"
                            valor={stats ? formatearNumero(stats.reproduccionesMes) : '0'}
                            icono={<Headphones size={16} />}
                        />
                        <TarjetaStat
                            titulo="Seguidores nuevos"
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
                                Ingresos últimos 30 días
                            </h2>
                            <GraficaIngresos datos={ingresos} />
                            <div className="dashboardSeccionFooter">
                                <span>Total: {stats ? formatearMoneda(stats.ingresosTotal) : '$0.00'}</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <TabBar
                        tabs={TABS_DASHBOARD}
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
                                    <button
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
                                    </button>
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
