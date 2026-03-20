/*
 * Componente: KpisCompactosAdmin — Kamples (QK46)
 * Grid compacto de KPIs administrativos. Extraido de TabUsuariosAdmin
 * para respetar limite de lineas SRP.
 */

import {
    Users, Music2, Download, MessageSquare, AlertTriangle, Flag, Crown, TrendingUp,
} from 'lucide-react';
import type { KpisAdmin } from '../../services/apiAdmin';
import { useT } from '@app/utils/i18n/useT';

interface KpisCompactosAdminProps {
    kpis: KpisAdmin;
}

export const KpisCompactosAdmin = ({ kpis }: KpisCompactosAdminProps): JSX.Element => {
    const { t } = useT();
    return (
    <div className="adminKpisGrid adminKpisCompacto">
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.usuarios')}</span><span className="adminKpiIcono"><Users size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_usuarios}</div>
            <div className="adminKpiDetalle">{t('admin.kpis.estaSemana').replace('{n}', String(kpis.registros_semana))}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.samples')}</span><span className="adminKpiIcono"><Music2 size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_samples}</div>
            <div className="adminKpiDetalle">{t('admin.kpis.estaSemana').replace('{n}', String(kpis.samples_semana))}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.descargas')}</span><span className="adminKpiIcono"><Download size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_descargas}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.publicaciones')}</span><span className="adminKpiIcono"><MessageSquare size={14} /></span></div>
            <div className="adminKpiValor">{kpis.total_publicaciones}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.pro')}</span><span className="adminKpiIcono"><Crown size={14} /></span></div>
            <div className="adminKpiValor">{kpis.usuarios_pro}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.premium')}</span><span className="adminKpiIcono"><TrendingUp size={14} /></span></div>
            <div className="adminKpiValor">{kpis.usuarios_premium}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.moderacion')}</span><span className="adminKpiIcono"><AlertTriangle size={14} /></span></div>
            <div className="adminKpiValor">{kpis.pendientes_moderacion}</div>
        </div>
        <div className="adminKpiTarjeta">
            <div className="adminKpiCabecera"><span className="adminKpiEtiqueta">{t('admin.kpis.reportes')}</span><span className="adminKpiIcono"><Flag size={14} /></span></div>
            <div className="adminKpiValor">{kpis.reportes_pendientes}</div>
        </div>
    </div>
    );
};
