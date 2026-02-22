import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

/*
 * Vite config para Kamples Desktop (Tauri 2.0)
 * Reutiliza los mismos componentes React del proyecto web via aliases.
 */
export default defineConfig({
    plugins: [react(), tailwindcss()],

    /* Tauri espera un index.html estático servido por Vite */
    root: '.',

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: ['es2021', 'chrome100', 'safari13'],
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_DEBUG,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },

    server: {
        port: 1420,
        strictPort: true,
        host: 'localhost',
        /*
         * Permitir servir archivos del proyecto principal
         * (App/React, Glory/assets/react/src, Mezclador)
         */
        fs: {
            allow: [
                '.',
                '../App/React',
                '../App/Assets',
                '../Glory/assets/react/src',
                '../Glory/assets/react/node_modules',
                '../Mezclador',
            ],
        },
        hmr: {
            host: 'localhost',
            port: 1420,
            protocol: 'ws',
        },
    },

    resolve: {
        alias: {
            /* Framework Glory (core) */
            '@': resolve(__dirname, '../Glory/assets/react/src'),
            /* Islas y componentes del proyecto Kamples */
            '@app': resolve(__dirname, '../App/React'),
            /* DAW / Mezclador */
            '@mezclador': resolve(__dirname, '../Mezclador'),
            /* Desktop-specific code */
            '@desktop': resolve(__dirname, 'src'),
            /* Dependencias compartidas: resolver desde node_modules del desktop */
            'soundtouchjs': resolve(__dirname, 'node_modules/soundtouchjs'),
        },
        dedupe: [
            'react',
            'react-dom',
            'lucide-react',
            'framer-motion',
            'zustand',
            '@editorjs/editorjs',
            '@editorjs/header',
            '@editorjs/paragraph',
            '@editorjs/list',
            '@editorjs/quote',
            '@editorjs/delimiter',
            '@editorjs/image',
            '@editorjs/embed',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
        ],
    },

    /* Capacitor no se usa en desktop — excluir para evitar errores de resolución */
    optimizeDeps: {
        exclude: [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/local-notifications',
            '@codetrix-studio/capacitor-google-auth',
        ],
    },
});
