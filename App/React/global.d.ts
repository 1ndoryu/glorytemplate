/**
 * Declaraciones de tipo globales para el proyecto React.
 *
 * TypeScript (en modo bundler) no conoce los CSS como módulos de efectos
 * secundarios. Esta declaración lo silencia y delega el procesamiento a esbuild.
 */

declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}
