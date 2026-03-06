/*
 * SkeletonPerfil — Placeholder para la cabecera del perfil.
 * Avatar centrado + nombre + username + bio + stats.
 */

import { Skeleton } from './Skeleton';

export function SkeletonPerfil(): JSX.Element {
    return (
        <div className="skeletonPerfil" aria-hidden="true">
            <Skeleton className="skeletonPerfilAvatar" circulo />
            <Skeleton className="skeletonPerfilNombre" />
            <Skeleton className="skeletonPerfilUsername" />
            <Skeleton className="skeletonPerfilBio" />
            <div className="skeletonPerfilStats">
                <Skeleton className="skeletonPerfilStatItem" />
                <Skeleton className="skeletonPerfilStatItem" />
            </div>
        </div>
    );
}
