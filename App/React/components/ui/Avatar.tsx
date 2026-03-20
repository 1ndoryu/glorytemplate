/*
 * Componente: Avatar
 * Muestra la imagen del usuario o sus iniciales.
 * Soporta indicador de estado online.
 */

import { ImgOptimizada } from './ImgOptimizada';
import '../../styles/componentes/avatar.css';

type TamanoAvatar = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type EstadoAvatar = 'online' | 'offline' | 'ninguno';

interface AvatarProps {
    src?: string | null;
    nombre?: string;
    tamano?: TamanoAvatar;
    estado?: EstadoAvatar;
    borde?: boolean;
    className?: string;
    onClick?: () => void;
}

const mapaTamano: Record<TamanoAvatar, string> = {
    xs: 'avatarXs',
    sm: 'avatarSm',
    md: 'avatarMd',
    lg: 'avatarLg',
    xl: 'avatarXl',
    '2xl': 'avatar2xl',
};

const mapaPixeles: Record<TamanoAvatar, number> = {
    xs: 22,
    sm: 28,
    md: 36,
    lg: 48,
    xl: 80,
    '2xl': 120,
};

/* Extrae las primeras 2 iniciales del nombre */
const obtenerIniciales = (nombre?: string): string => {
    if (!nombre || nombre.trim() === '') return '?';
    return nombre
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join('')
        .toUpperCase();
};

export const Avatar = ({
    src,
    nombre = '',
    tamano = 'md',
    estado = 'ninguno',
    borde = false,
    className = '',
    onClick,
}: AvatarProps): JSX.Element => {
    /* Normalizar nombre defensivamente */
    const nombreSeguro = nombre || '?';
    const clases = [
        'avatar',
        mapaTamano[tamano],
        borde ? 'avatarBorde' : '',
        onClick ? 'avatarClickeable' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    /* Normalizar: string vacío, URL inválida → null (muestra iniciales) */
    const srcNormalizado = src && src.trim() !== '' ? src : null;
    const tamanoPx = mapaPixeles[tamano];

    return (
        <div className={clases} onClick={onClick} title={nombreSeguro} role={onClick ? 'button' : undefined}>
            {srcNormalizado ? (
                <ImgOptimizada
                    className="avatarImagen"
                    src={srcNormalizado}
                    alt={nombreSeguro}
                    w={tamanoPx}
                    h={tamanoPx}
                    quality={75}
                    loading="lazy"
                    onError={(e) => {
                        /* Si la imagen falla, ocultar y mostrar iniciales */
                        (e.target as HTMLImageElement).style.display = 'none';
                        const iniciales = e.currentTarget.parentElement?.querySelector('.avatarIniciales');
                        if (iniciales) (iniciales as HTMLElement).style.display = 'flex';
                    }}
                />
            ) : null}
            <span className={`avatarIniciales${srcNormalizado ? ' avatarInicialesOcultas' : ''}`}>{obtenerIniciales(nombreSeguro)}</span>
            {estado !== 'ninguno' && (
                <span
                    className={`avatarEstado ${estado === 'online' ? 'estadoOnline' : 'estadoOffline'}`}
                />
            )}
        </div>
    );
};

export default Avatar;
