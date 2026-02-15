/*
 * Componente: Avatar
 * Muestra la imagen del usuario o sus iniciales.
 * Soporta indicador de estado online.
 */

import '../../styles/componentes/avatar.css';

type TamanoAvatar = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type EstadoAvatar = 'online' | 'offline' | 'ninguno';

interface AvatarProps {
    src?: string | null;
    nombre: string;
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

/* Extrae las primeras 2 iniciales del nombre */
const obtenerIniciales = (nombre: string): string => {
    return nombre
        .split(' ')
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join('')
        .toUpperCase();
};

export const Avatar = ({
    src,
    nombre,
    tamano = 'md',
    estado = 'ninguno',
    borde = false,
    className = '',
    onClick,
}: AvatarProps): JSX.Element => {
    const clases = [
        'avatar',
        mapaTamano[tamano],
        borde ? 'avatarBorde' : '',
        onClick ? 'avatarClickeable' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={clases} onClick={onClick} title={nombre} role={onClick ? 'button' : undefined}>
            {src ? (
                <img
                    className="avatarImagen"
                    src={src}
                    alt={nombre}
                    loading="lazy"
                />
            ) : (
                <span className="avatarIniciales">{obtenerIniciales(nombre)}</span>
            )}
            {estado !== 'ninguno' && (
                <span
                    className={`avatarEstado ${estado === 'online' ? 'estadoOnline' : 'estadoOffline'}`}
                />
            )}
        </div>
    );
};

export default Avatar;
