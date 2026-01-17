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
// (Bloques de ejemplo eliminados)

/*
 * Array de todas las definiciones de bloque del proyecto
 */
const blockDefinitions: any[] = [];

/*
 * Registrar todos los bloques en Glory
 */
export function registerAppBlocks(): void {
    if (blockDefinitions.length > 0) {
        BlockRegistry.registerAll(blockDefinitions);
    }
    console.log(`[App Blocks] ${blockDefinitions.length} bloques registrados`);
}

/*
 * Exportar componentes individuales para uso directo
 */
// export {HeroBlock, heroBlockDefinition};

/*
 * Exportar todos los bloques como objeto
 */
export const AppBlocks = {};

export default AppBlocks;
