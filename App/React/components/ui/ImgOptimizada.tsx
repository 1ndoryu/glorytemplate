/*
 * ImgOptimizada — [183A-40]
 * Wrapper de <img> que pasa la URL por Jetpack Photon CDN automáticamente.
 * Equivalente React de ImageUtility::optimizar() de Glory.
 *
 * Uso: <ImgOptimizada src={url} alt="texto" w={300} quality={75} />
 * Gotcha: Si src es relativo o data: URI, se usa sin modificar.
 * Gotcha: En localhost no aplica Photon (URLs del servidor local no son accesibles externamente).
 */

import { photonUrl } from '@app/services/photonUrl';

interface ImgOptimizadaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    w?: number;
    h?: number;
    quality?: number;
    fit?: 'cover' | 'contain';
}

export const ImgOptimizada = ({
    src,
    alt,
    w,
    h,
    quality = 80,
    fit,
    loading = 'lazy',
    ...rest
}: ImgOptimizadaProps): JSX.Element => {
    const srcOptimizado = photonUrl(src, { w, h, quality, fit });

    return (
        <img
            src={srcOptimizado}
            alt={alt}
            loading={loading}
            {...rest}
        />
    );
};
