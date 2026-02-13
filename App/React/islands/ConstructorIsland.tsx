/*
 * ConstructorIsland - Page Builder de Cosmo Revenue
 * Wrapper que integra el PageBuilder del framework con bloques del proyecto.
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';

/* TO-DO: Importar PageBuilder cuando se implementen los bloques nativos */

export function ConstructorIsland(): React.JSX.Element {
    return (
        <div className="contenedorConstructor" id="constructorCosmo">
            <CosmoHeader />
            <div style={{ padding: '120px 20px 60px', textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '48px', fontWeight: 400 }}>
                    Constructor de Páginas
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', color: '#666', marginTop: '16px' }}>
                    El page builder estará disponible próximamente con bloques personalizados.
                </p>
            </div>
        </div>
    );
}

export default ConstructorIsland;
