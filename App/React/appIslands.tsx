/**
 * App Islands Registry - Clean Slate
 *
 * This file is the main entry point for your React components.
 * Add your islands here.
 */

import {registerAppBlocks} from './blocks';

// Register blocks
registerAppBlocks();

/**
 * AppProvider (Optional)
 * Export a component here to wrap the entire application (e.g. for Context)
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = undefined;

/**
 * App Islands Registry
 * Provide your island components here.
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {};

export default appIslands;
