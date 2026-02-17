import Avatar from '@app/components/ui/Avatar';
import Badge from '@app/components/ui/Badge';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/enlaceCreador.css';

/*
 * EnlaceCreador — Boton clickeable de avatar + nombre que navega al perfil.
 *
 * Centraliza el patron repetido en SampleDetalleIsland, ComunidadIsland,
 * ColeccionDetalleIsland, y PanelDetalleSample.
 * Props flexibles para las variaciones de cada contexto.
 */

interface EnlaceCreadorProps {
    username: string;
    nombreVisible: string;
    avatarUrl?: string | null;
    tamanoAvatar?: 'xs' | 'sm' | 'md';
    mostrarUsername?: boolean;
    verificado?: boolean;
    /** Texto extra debajo del nombre (ej: "@user · hace 2h") */
    meta?: string;
    className?: string;
}

export default function EnlaceCreador({
    username,
    nombreVisible,
    avatarUrl,
    tamanoAvatar = 'sm',
    mostrarUsername = false,
    verificado = false,
    meta,
    className = '',
}: EnlaceCreadorProps) {
    const { navegar } = useNavigationStore();

    const tieneMeta = mostrarUsername || meta || verificado;

    return (
        <button
            className={`enlaceCreador ${className}`}
            onClick={() => navegar(`/perfil/${username}/`)}
            type="button"
        >
            <Avatar
                src={avatarUrl ?? undefined}
                nombre={nombreVisible}
                tamano={tamanoAvatar}
            />
            {tieneMeta ? (
                <div className="enlaceCreadorInfo">
                    <span className="enlaceCreadorNombre">
                        {nombreVisible}
                        {verificado && <Badge variante="acento" tamano="xs">✓</Badge>}
                    </span>
                    {(mostrarUsername || meta) && (
                        <span className="enlaceCreadorMeta">
                            {mostrarUsername && `@${username}`}
                            {mostrarUsername && meta && ' · '}
                            {meta}
                        </span>
                    )}
                </div>
            ) : (
                <span className="enlaceCreadorNombre">{nombreVisible}</span>
            )}
        </button>
    );
}
