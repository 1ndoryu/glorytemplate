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

interface TabResumenAdminProps {
    kpis: KpisAdmin | null;
    actividad: DatosActividad | null;
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

/* Gráfica de barras de actividad (registros, uploads, descargas) */
const GraficaActividad = ({ datos }: { datos: DatosActividad }): JSX.Element => {
    const registros = datos?.registros ?? [];
    const uploads = datos?.uploads ?? [];
    const descargas = datos?.descargas ?? [];

    /* Calcular máximo para escalar */
    const todosLosTotales = [
        ...registros.map(d => d.total),
        ...uploads.map(d => d.total),
        ...descargas.map(d => d.total),
    ];
    const maximo = Math.max(...todosLosTotales, 1);

    /* Unificar fechas */
    const fechas = new Set([
        ...registros.map(d => d.fecha),
        ...uploads.map(d => d.fecha),
        ...descargas.map(d => d.fecha),
    ]);
    const fechasOrdenadas = [...fechas].sort();

    const buscar = (arr: { fecha: string; total: number }[], fecha: string) =>
        arr.find(d => d.fecha === fecha)?.total ?? 0;

    return (
        <div className="adminGraficaContenedor">
            <div className="adminGraficaTitulo">
                <BarChart3 size={16} />
                Actividad últimos 14 días
            </div>
            <div className="adminGraficaBarras">
                {fechasOrdenadas.map(fecha => {
                    const reg = buscar(registros, fecha);
                    const upl = buscar(uploads, fecha);
                    const desc = buscar(descargas, fecha);

                    return (
                        <div key={fecha} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px', alignItems: 'stretch', justifyContent: 'flex-end', height: '100%' }}>
                            <div
                                className="adminGraficaBarra adminGraficaBarraDescargas"
                                style={{ height: `${(desc / maximo) * 100}%` }}
                                title={`${fecha} — Descargas: ${desc}`}
                            />
                            <div
                                className="adminGraficaBarra adminGraficaBarraUploads"
                                style={{ height: `${(upl / maximo) * 100}%` }}
                                title={`${fecha} — Uploads: ${upl}`}
                            />
                            <div
                                className="adminGraficaBarra adminGraficaBarraRegistros"
                                style={{ height: `${(reg / maximo) * 100}%` }}
                                title={`${fecha} — Registros: ${reg}`}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="adminGraficaLeyenda">
                <span className="adminGraficaLeyendaItem">
                    <span className="adminGraficaLeyendaPunto" style={{ background: 'var(--acento)' }} />
                    Registros
                </span>
                <span className="adminGraficaLeyendaItem">
                    <span className="adminGraficaLeyendaPunto" style={{ background: 'var(--exito)' }} />
                    Uploads
                </span>
                <span className="adminGraficaLeyendaItem">
                    <span className="adminGraficaLeyendaPunto" style={{ background: 'var(--advertencia)' }} />
                    Descargas
                </span>
            </div>
        </div>
    );
};

export const TabResumenAdmin = ({ kpis, actividad }: TabResumenAdminProps): JSX.Element => {
    if (!kpis) {
        return <div className="adminVacio">No hay datos disponibles</div>;
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
        </div>
    );
};
