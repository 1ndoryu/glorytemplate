import { BadgeCheck } from 'lucide-react';
import Avatar from '@app/components/ui/Avatar';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import '../../styles/componentes/enlaceCreador.css';

/*
 * EnlaceCreador — Enlace clickeable de avatar + nombre que navega al perfil.
 * Usa EnlaceNavegacion para soportar apertura en nueva pestaña (middle-click).
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
    const tieneMeta = mostrarUsername || meta || verificado;

    return (
        <EnlaceNavegacion
            href={`/perfil/${username}/`}
            className={`enlaceCreador ${className}`}
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
                        {verificado && <BadgeCheck size={14} className="enlaceCreadorVerificado" />}
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
        </EnlaceNavegacion>
    );
}
