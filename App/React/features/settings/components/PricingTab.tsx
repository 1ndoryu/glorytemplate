/**
 * PricingTab - Configuracion de precios de planes
 *
 * Permite configurar:
 * - Precio Plan Basico
 * - Precio Plan Avanzado
 * - Precio Plan Total
 * - Simbolo de moneda
 * - Periodo de facturacion
 */

import {DollarSign} from 'lucide-react';
import {SettingsField} from './SettingsField';

interface PricingTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export function PricingTab({options, onUpdate}: PricingTabProps): JSX.Element {
    const currency = options.glory_pricing_currency || '€';
    const period = options.glory_pricing_period || '/mes';

    const formatPricePreview = (price: string): string => {
        if (!price) return '';
        return `${price}${currency}${period}`;
    };

    return (
        <div id="settings-pricing-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <DollarSign className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Precios de Planes</h2>
                    <p className="settings-tab-description">Configura los precios mensuales de cada plan que se muestran en la pagina de precios.</p>
                </div>
            </header>

            <div className="settings-fields-grid">
                <div className="settings-field-group">
                    <h3 className="settings-group-title">
                        <DollarSign className="settings-group-icon" />
                        Formato de Precio
                    </h3>

                    <SettingsField id="glory_pricing_currency" label="Simbolo de Moneda" type="text" value={options.glory_pricing_currency || ''} onChange={(value: string) => onUpdate('glory_pricing_currency', value)} description="Simbolo de la moneda (ej: €, $, £)." placeholder="€" />

                    <SettingsField id="glory_pricing_period" label="Periodo de Facturacion" type="text" value={options.glory_pricing_period || ''} onChange={(value: string) => onUpdate('glory_pricing_period', value)} description="Texto del periodo (ej: /mes, /año)." placeholder="/mes" />
                </div>

                <div className="settings-field-group">
                    <h3 className="settings-group-title">
                        <DollarSign className="settings-group-icon" />
                        Precios por Plan
                    </h3>

                    <SettingsField id="glory_pricing_basico" label="Precio Plan Basico" type="text" value={options.glory_pricing_basico || ''} onChange={(value: string) => onUpdate('glory_pricing_basico', value)} description="Precio mensual del plan Basico (solo numero)." placeholder="99" />

                    {options.glory_pricing_basico && (
                        <div className="settings-preview-link">
                            <span className="settings-preview-label">Vista previa:</span>
                            <span className="settings-preview-url">{formatPricePreview(options.glory_pricing_basico)}</span>
                        </div>
                    )}

                    <SettingsField id="glory_pricing_avanzado" label="Precio Plan Avanzado" type="text" value={options.glory_pricing_avanzado || ''} onChange={(value: string) => onUpdate('glory_pricing_avanzado', value)} description="Precio mensual del plan Avanzado (solo numero)." placeholder="149" />

                    {options.glory_pricing_avanzado && (
                        <div className="settings-preview-link">
                            <span className="settings-preview-label">Vista previa:</span>
                            <span className="settings-preview-url">{formatPricePreview(options.glory_pricing_avanzado)}</span>
                        </div>
                    )}

                    <SettingsField id="glory_pricing_total" label="Precio Plan Total" type="text" value={options.glory_pricing_total || ''} onChange={(value: string) => onUpdate('glory_pricing_total', value)} description="Precio mensual del plan Total (solo numero)." placeholder="199" />

                    {options.glory_pricing_total && (
                        <div className="settings-preview-link">
                            <span className="settings-preview-label">Vista previa:</span>
                            <span className="settings-preview-url">{formatPricePreview(options.glory_pricing_total)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
