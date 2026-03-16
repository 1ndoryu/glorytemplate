import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { existsSync } from 'fs';

/*
 * Vite config para Kamples Desktop (Tauri 2.0)
 * Reutiliza los mismos componentes React del proyecto web via aliases.
 *
 * El proxy de dev redirige a KAMPLES_API_TARGET (env) o kamples.com por defecto.
 * Para apuntar a WP local: set KAMPLES_API_TARGET=http://glory.local
 */

const apiTarget = process.env.KAMPLES_API_TARGET || 'https://kamples.com';

/*
 * Raiz del tema (glorytemplate/) — los assets del tema estan aqui.
 * En dev, las rutas /wp-content/themes/glorytemplate/... deben servirse
 * del filesystem local, no proxiarse al servidor remoto.
 * Solo /wp-content/uploads/ (imagenes subidas por usuarios) va al proxy remoto.
 */
const THEME_ROOT = resolve(__dirname, '..');
const THEME_URL_PREFIX = '/wp-content/themes/glorytemplate/';

/*
 * Plugin Vite para servir assets locales del tema.
 * Intercepta requests a /wp-content/themes/glorytemplate/... y los sirve
 * del filesystem local. Todo lo demas (/wp-content/uploads/, etc.) va al proxy.
 */
function servirAssetsLocales(): Plugin {
    return {
        name: 'servir-assets-tema-local',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (!req.url?.startsWith(THEME_URL_PREFIX)) {
                    next();
                    return;
                }
                /* Extraer ruta relativa dentro del tema y buscar en filesystem */
                const rutaRelativa = req.url.slice(THEME_URL_PREFIX.length).split('?')[0];
                const rutaLocal = resolve(THEME_ROOT, rutaRelativa ?? '');

                /* Seguridad: verificar que la ruta no escapa del tema (path traversal) */
                if (!rutaLocal.startsWith(THEME_ROOT) || !existsSync(rutaLocal)) {
                    next();
                    return;
                }

                /* Dejar que el middleware statico de Vite sirva el archivo */
                req.url = '/@fs/' + rutaLocal.replace(/\\/g, '/');
                next();
            });
        },
    };
}

/*
 * Cargar variables del .env del proyecto raiz (../) para reutilizar
 * GOOGLE_CLIENT_ID sin duplicar archivos de configuracion.
 * loadEnv() es la API oficial de Vite para cargar .env files.
 */
const envRaiz = loadEnv('production', resolve(__dirname, '..'), '');

export default defineConfig({
    plugins: [react(), tailwindcss(), servirAssetsLocales()],

    /* Inyectar config publica del proyecto en el bundle (build time) */
    define: {
        '__GOOGLE_CLIENT_ID__': JSON.stringify(envRaiz.GOOGLE_CLIENT_ID || ''),
    },

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
                sync: resolve(__dirname, 'sync.html'),
                config: resolve(__dirname, 'config.html'),
            },
        },
    },

    server: {
        port: 1420,
        strictPort: true,
        /* 0.0.0.0 para escuchar en TODAS las interfaces (WiFi, VPN, loopback).
         * TAURI_DEV_HOST controla QUÉ IP se le dice al emulador Android,
         * pero Vite debe estar disponible en todas para que cualquier IP funcione.
         * Setear TAURI_DEV_HOST=192.168.0.X (IP WiFi) al correr android dev. */
        host: '0.0.0.0',
        /*
         * Proxy: redirige peticiones al API target (kamples.com por defecto).
         * Elimina CORS porque las peticiones salen de Vite (mismo origen).
         * Para WP local: set KAMPLES_API_TARGET=http://glory.local
         */
        proxy: {
            '/wp-json': {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
            },
            /* Solo proxiar uploads (contenido subido por usuarios) al servidor.
             * Los assets del tema se sirven localmente via servirAssetsLocales(). */
            '/wp-content/uploads': {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
            },
        },
        /*
         * Permitir servir archivos del proyecto principal
         * (App/React, Glory/assets/react/src, Mezclador)
         */
        fs: {
            allow: [
                '.',
                '..',
                '../App/React',
                '../App/Assets',
                '../Glory/assets/react/src',
                '../Glory/assets/react/node_modules',
                '../Mezclador',
            ],
        },
        hmr: {
            /* TAURI_DEV_HOST es la IP WiFi del host (192.168.0.127) que el emulador
             * Android puede alcanzar. Usar localhost solo funciona en desktop. */
            host: process.env.TAURI_DEV_HOST ?? 'localhost',
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
            /* QL17: Plugin notification vive en desktop/node_modules pero se importa
             * desde App/React/ (fuera del root). Vite no lo encuentra sin alias explicito. */
            '@tauri-apps/plugin-notification': resolve(__dirname, 'node_modules/@tauri-apps/plugin-notification'),
            /* QL34: Plugin FS — mismo caso, importado desde App/React/services/fcmToken.ts */
            '@tauri-apps/plugin-fs': resolve(__dirname, 'node_modules/@tauri-apps/plugin-fs'),
            /* QL49: Plugin shell + API app — usados desde App/React/utils/plataforma.ts */
            '@tauri-apps/plugin-shell': resolve(__dirname, 'node_modules/@tauri-apps/plugin-shell'),
            '@tauri-apps/api/app': resolve(__dirname, 'node_modules/@tauri-apps/api/app'),
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
