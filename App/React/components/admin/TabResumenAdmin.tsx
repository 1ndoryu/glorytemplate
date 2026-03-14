/*
 * Componente: TabResumenAdmin — Kamples (FASE 13)
 * Muestra KPIs y gráfica de actividad del panel admin.
 * Solo vista, la lógica viene del hook useAdminPanel.
 */

import {
    Users,
    Music2,
    Download,
    MessageSquare,
    AlertTriangle,
    Flag,
    Crown,
    TrendingUp,
    BarChart3,
} from 'lucide-react';
import type { KpisAdmin, DatosActividad } from '../../services/apiAdmin';
import type { ItemColaIa, EstadisticasColaIa } from '../../services/apiColaIa';
import { ListaHistorialAdmin } from './ListaHistorialAdmin';
import { EstadoVacio } from '../ui/EstadoVacio';

interface TabResumenAdminProps {
    kpis: KpisAdmin | null;
    actividad: DatosActividad | null;
    colaIaStats: EstadisticasColaIa | null;
    colaIaRecientes: ItemColaIa[];
}

/* Tarjeta de KPI individual */
const TarjetaKpi = ({
    etiqueta,
    valor,
    detalle,
    icono,
}: {
    etiqueta: string;
    valor: string | number;
    detalle?: string;
    icono: React.ReactNode;
}): JSX.Element => (
    <div className="adminKpiTarjeta">
        <div className="adminKpiCabecera">
            <span className="adminKpiEtiqueta">{etiqueta}</span>
            <span className="adminKpiIcono">{icono}</span>
        </div>
        <div className="adminKpiValor">{valor}</div>
        {detalle && <div className="adminKpiDetalle">{detalle}</div>}
    </div>
);

/*
 * C236+C350: Gráfica de barras rediseñada — registros, uploads, descargas por día.
 * Barras agrupadas con tooltip CSS personalizado al hacer hover sobre cada día.
 * Eje X con fechas, eje Y con escalones, grid lines de referencia.
 */
const GraficaActividad = ({ datos }: { datos: DatosActividad }): JSX.Element => {
    const registros = datos?.registros ?? [];
    const uploads = datos?.uploads ?? [];
    const descargas = datos?.descargas ?? [];

    /* Unificar y ordenar fechas */
    const fechas = new Set([
        ...registros.map(d => d.fecha),
        ...uploads.map(d => d.fecha),
        ...descargas.map(d => d.fecha),
    ]);
    const fechasOrdenadas = [...fechas].sort();

    const buscar = (arr: { fecha: string; total: number }[], fecha: string) =>
        arr.find(d => d.fecha === fecha)?.total ?? 0;

    /* Calcular máximo para escalar barras */
    const maximo = Math.max(
        ...fechasOrdenadas.flatMap(f => [
            buscar(registros, f),
            buscar(uploads, f),
            buscar(descargas, f),
        ]),
        1
    );

    /* Totales del periodo para mostrar resumen */
    const totalReg = registros.reduce((s, d) => s + d.total, 0);
    const totalUpl = uploads.reduce((s, d) => s + d.total, 0);
    const totalDesc = descargas.reduce((s, d) => s + d.total, 0);

    /* Formatear fecha corta: "17 feb" */
    const formatearFecha = (f: string) => {
        const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
        const partes = f.split('-');
        return `${parseInt(partes[2], 10)} ${meses[parseInt(partes[1], 10) - 1]}`;
    };

    /* Calcular escalones del eje Y (4 líneas) */
    const lineasY = [0.25, 0.5, 0.75, 1].map(p => Math.round(maximo * p));

    return (
        <div className="adminGraficaContenedor">
            <div className="adminGraficaCabecera">
                <div className="adminGraficaTitulo">
                    <BarChart3 size={16} />
                    Actividad últimos 14 días
                </div>
                {/* Leyenda compacta en cabecera */}
                <div className="adminGraficaLeyenda">
                    <span className="adminGraficaLeyendaItem">
                        <span className="adminGraficaLeyendaPunto adminGraficaLeyendaPuntoRegistros" />
                        Registros ({totalReg})
                    </span>
                    <span className="adminGraficaLeyendaItem">
                        <span className="adminGraficaLeyendaPunto adminGraficaLeyendaPuntoUploads" />
                        Uploads ({totalUpl})
                    </span>
                    <span className="adminGraficaLeyendaItem">
                        <span className="adminGraficaLeyendaPunto adminGraficaLeyendaPuntoDescargas" />
                        Descargas ({totalDesc})
                    </span>
                </div>
            </div>

            {/* Área de la gráfica con eje Y */}
            <div className="adminGraficaArea">
                {/* Líneas de referencia horizontales */}
                <div className="adminGraficaEjeY">
                    {lineasY.reverse().map(val => (
                        <span key={val} className="adminGraficaEjeYLabel">{val}</span>
                    ))}
                </div>

                <div className="adminGraficaBarrasArea">
                    {/* Grid lines horizontales */}
                    <div className="adminGraficaGridLines">
                        {[0.25, 0.5, 0.75, 1].map(p => (
                            <div
                                key={p}
                                className="adminGraficaGridLinea"
                                style={{ bottom: `${p * 100}%` }}
                            />
                        ))}
                    </div>

                    {/* Barras agrupadas por fecha */}
                    <div className="adminGraficaBarras">
                        {fechasOrdenadas.map((fecha, i) => {
                            const reg = buscar(registros, fecha);
                            const upl = buscar(uploads, fecha);
                            const desc = buscar(descargas, fecha);

                            return (
                                <div key={fecha} className="adminGraficaDia">
                                    {/* Tooltip CSS — visible al hover del día */}
                                    <div className="adminGraficaTooltip">
                                        <span className="adminGraficaTooltipFecha">{formatearFecha(fecha)}</span>
                                        <span className="adminGraficaTooltipLinea">
                                            <span className="adminGraficaLeyendaPunto adminGraficaLeyendaPuntoRegistros" />
                                            {reg}
                                        </span>
                                        <span className="adminGraficaTooltipLinea">
                                            <span className="adminGraficaLeyendaPunto adminGraficaLeyendaPuntoUploads" />
                                            {upl}
                                        </span>
                                        <span className="adminGraficaTooltipLinea">
                                            <span className="adminGraficaLeyendaPunto adminGraficaLeyendaPuntoDescargas" />
                                            {desc}
                                        </span>
                                    </div>

                                    <div className="adminGraficaDiaBarras">
                                        <div
                                            className="adminGraficaBarra adminGraficaBarraRegistros"
                                            style={{ height: `${(reg / maximo) * 100}%` }}
                                        />
                                        <div
                                            className="adminGraficaBarra adminGraficaBarraUploads"
                                            style={{ height: `${(upl / maximo) * 100}%` }}
                                        />
                                        <div
                                            className="adminGraficaBarra adminGraficaBarraDescargas"
                                            style={{ height: `${(desc / maximo) * 100}%` }}
                                        />
                                    </div>
                                    {/* Mostrar fecha cada 2 días o si es el último */}
                                    {(i % 2 === 0 || i === fechasOrdenadas.length - 1) && (
                                        <span className="adminGraficaFecha">
                                            {formatearFecha(fecha)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TabResumenAdmin = ({ kpis, actividad, colaIaStats, colaIaRecientes }: TabResumenAdminProps): JSX.Element => {
    if (!kpis) {
        return <EstadoVacio mensaje="No hay datos disponibles" />;
    }

    return (
        <div>
            <div className="adminKpisGrid">
                <TarjetaKpi
                    etiqueta="Usuarios"
                    valor={kpis.total_usuarios}
                    detalle={`+${kpis.registros_semana} esta semana`}
                    icono={<Users size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Samples"
                    valor={kpis.total_samples}
                    detalle={`+${kpis.samples_semana} esta semana`}
                    icono={<Music2 size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Descargas"
                    valor={kpis.total_descargas}
                    icono={<Download size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Publicaciones"
                    valor={kpis.total_publicaciones}
                    icono={<MessageSquare size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Pro"
                    valor={kpis.usuarios_pro}
                    icono={<Crown size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Premium"
                    valor={kpis.usuarios_premium}
                    icono={<TrendingUp size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Moderación pendiente"
                    valor={kpis.pendientes_moderacion}
                    icono={<AlertTriangle size={16} />}
                />
                <TarjetaKpi
                    etiqueta="Reportes"
                    valor={kpis.reportes_pendientes}
                    icono={<Flag size={16} />}
                />
            </div>

            {actividad && <GraficaActividad datos={actividad} />}

            <ListaHistorialAdmin stats={colaIaStats} items={colaIaRecientes} />
        </div>
    );
};
