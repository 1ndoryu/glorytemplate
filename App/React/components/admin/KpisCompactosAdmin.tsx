/*
 * Componente: KpisCompactosAdmin — Kamples (QK46)
 * Grid compacto de KPIs administrativos. Extraido de TabUsuariosAdmin
 * para respetar limite de lineas SRP.
 */

import {
    Users, Music2, Download, MessageSquare, AlertTriangle, Flag, Crown, TrendingUp,
} from 'lucide-react';
import type { KpisAdmin } from '../../services/apiAdmin';

interface KpisCompactosAdminProps {
    kpis: KpisAdmin;
}

export const KpisCompactosAdmin = ({ kpis }: KpisCompactosAdminProps): JSX.Element => (
    <div className="adminKpisGrid adminKpisCompacto">
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Usuarios</span><span className="adminKpiIcono"><Users size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_usuarios}</div>
            <div className="adminKpiDetalle">+{kpis.registros_semana} esta semana</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Samples</span><span className="adminKpiIcono"><Music2 size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_samples}</div>
            <div className="adminKpiDetalle">+{kpis.samples_semana} esta semana</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Descargas</span><span className="adminKpiIcono"><Download size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_descargas}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Publicaciones</span><span className="adminKpiIcono"><MessageSquare size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_publicaciones}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Pro</span><span className="adminKpiIcono"><Crown size={14} /></span></div>
            <div className="adminKpiValor">{kpis.usuarios_pro}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Premium</span><span className="adminKpiIcono"><TrendingUp size={14} /></span></div>
            <div className="adminKpiValor">{kpis.usuarios_premium}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Moderacion</span><span className="adminKpiIcono"><AlertTriangle size={14} /></span></div>
            <div className="adminKpiValor">{kpis.pendientes_moderacion}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">Reportes</span><span className="adminKpiIcono"><Flag size={14} /></span></div>
            <div className="adminKpiValor">{kpis.reportes_pendientes}</div>
        </div>
    </div>
);
