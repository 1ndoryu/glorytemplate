/**
 * App Blocks - Registro de bloques del proyecto
 *
 * Este archivo registra todos los bloques especificos del proyecto
 * en el BlockRegistry de Glory.
 *
 * Para agregar un nuevo bloque:
 * 1. Crear el componente en App/React/blocks/NombreBlock.tsx
 * 2. Exportar la definicion del bloque (nombreBlockDefinition)
 * 3. Importar aqui y agregarlo al array blockDefinitions
 */

import {BlockRegistry} from '@/pageBuilder';

// Importar bloques y sus definiciones
import {HeroBlock, heroBlockDefinition} from './HeroBlock';
import {FeaturesBlock, featuresBlockDefinition} from './FeaturesBlock';
import {PricingBlock, pricingBlockDefinition} from './PricingBlock';

/*
 * Array de todas las definiciones de bloque del proyecto
 */
const blockDefinitions = [heroBlockDefinition, featuresBlockDefinition, pricingBlockDefinition];

/*
 * Registrar todos los bloques en Glory
 */
export function registerAppBlocks(): void {
    BlockRegistry.registerAll(blockDefinitions);
    console.log(`[App Blocks] ${blockDefinitions.length} bloques registrados`);
}

/*
 * Exportar componentes individuales para uso directo
 */
export {HeroBlock, heroBlockDefinition};
export {FeaturesBlock, featuresBlockDefinition};
export {PricingBlock, pricingBlockDefinition};

/*
 * Exportar todos los bloques como objeto
 */
export const AppBlocks = {
    HeroBlock,
    FeaturesBlock,
    PricingBlock
};

export default AppBlocks;
