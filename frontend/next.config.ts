import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    /*
     * Configuracion para permitir imagenes desde WordPress
     */
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'glorybuilder.local'
            },
            {
                protocol: 'https',
                hostname: 'glorybuilder.com'
            }
        ]
    }
};

export default nextConfig;
