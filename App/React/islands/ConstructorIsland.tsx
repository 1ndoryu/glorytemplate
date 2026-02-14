/*
 * ConstructorIsland - Page Builder de Cosmo Revenue
 * Wrapper que integra el PageBuilder del framework.
 */

import React from 'react';
import '@app/styles/init.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';

export function ConstructorIsland(): React.JSX.Element {
    return (
        <div className="landing-container" id="constructorCosmo">
            <CosmoHeader />
            <div style={{ padding: '120px 20px 60px', textAlign: 'center' }}>
                <h1 className="section-title" style={{ fontSize: '48px' }}>
                    Constructor de Páginas
                </h1>
                <p className="section-subtitle" style={{ marginTop: '16px' }}>
                    El page builder estará disponible próximamente con bloques personalizados.
                </p>
            </div>
        </div>
    );
}

export default ConstructorIsland;
