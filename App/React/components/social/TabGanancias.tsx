/* [183A-96] Tab de ganancias para el perfil del usuario.
 * Admin (rol === 'admin'): ve panel real con stats, transacciones e ingresos.
 * Otros usuarios: estado vacío — la funcionalidad se habilitará progresivamente.
 * Lógica de carga reutiliza las mismas APIs del DashboardCreadorIsland. */

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Download, Wallet } from 'lucide-react';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import { Skeleton } from '@app/components/skeletons';
import { useAuthStore } from '@app/stores/authStore';
import {
    obtenerEstadisticasCreador,
    obtenerTransacciones,
    type EstadisticasCreador,
    type TransaccionCreador,
} from '@app/services/apiPagos';
import '../../styles/componentes/tabGanancias.css';

const formatearMoneda = (monto: number): string => `$${Number(monto).toFixed(2)}`;

const formatearFecha = (fecha: string): string =>
    new Date(fecha).toLocaleDateString('es', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

export const TabGanancias = (): JSX.Element => {
    const usuarioAuth = useAuthStore(s => s.usuario);
    const esAdmin = usuarioAuth?.rol === 'admin';

    if (!esAdmin) {
        return (
            <EstadoVacio
                icono={<Wallet size={48} />}
                titulo="Ganancias"
                mensaje="Esto estará disponible pronto para que generes ganancias a partir de tus samples y contribuciones"
            />
        );
    }

    return <TabGananciasAdmin />;
};

/* Componente interno para admin — carga datos reales */
const TabGananciasAdmin = (): JSX.Element => {
    const [stats, setStats] = useState<EstadisticasCreador | null>(null);
    const [transacciones, setTransacciones] = useState<TransaccionCreador[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            try {
                const [resStats, resTrans] = await Promise.all([
                    obtenerEstadisticasCreador(),
                    obtenerTransacciones(),
                ]);
                if (controller.signal.aborted) return;
                if (resStats.ok && resStats.data) setStats(resStats.data);
                if (resTrans.ok && resTrans.data) setTransacciones(resTrans.data);
            } catch { /* fallo silencioso — tab queda vacía */ }
            finally {
                if (!controller.signal.aborted) setCargando(false);
            }
        };

        cargar();
        return () => { controller.abort(); };
    }, []);

    if (cargando) {
        return (
            <div className="tabGananciasContenedor">
                <Skeleton alto={80} />
                <Skeleton alto={200} />
            </div>
        );
    }

    return (
        <div className="tabGananciasContenedor">
            {/* Resumen de ingresos */}
            <div className="tabGananciasResumen">
                <div className="tabGananciasStat">
                    <DollarSign size={16} />
                    <span className="tabGananciasStatLabel">Este mes</span>
                    <span className="tabGananciasStatValor">{formatearMoneda(stats?.ingresosMes ?? 0)}</span>
                </div>
                <div className="tabGananciasStat">
                    <TrendingUp size={16} />
                    <span className="tabGananciasStatLabel">Total</span>
                    <span className="tabGananciasStatValor">{formatearMoneda(stats?.ingresosTotal ?? 0)}</span>
                </div>
                <div className="tabGananciasStat">
                    <Download size={16} />
                    <span className="tabGananciasStatLabel">Descargas mes</span>
                    <span className="tabGananciasStatValor">{stats?.descargasMes ?? 0}</span>
                </div>
            </div>

            {/* Transacciones recientes */}
            {transacciones.length > 0 ? (
                <div className="tabGananciasTransacciones">
                    <h3 className="tabGananciasTitulo">Transacciones recientes</h3>
                    {transacciones.map(t => (
                        <div key={t.id} className="tabGananciasFila">
                            <span className="tabGananciasFecha">{formatearFecha(t.fecha)}</span>
                            <span className="tabGananciasSample">{t.sample}</span>
                            <span className="tabGananciasComprador">@{t.comprador}</span>
                            <span className="tabGananciasNeto">{formatearMoneda(t.neto)}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <EstadoVacio
                    icono={<DollarSign size={32} />}
                    mensaje="Aún no hay transacciones registradas"
                />
            )}
        </div>
    );
};
