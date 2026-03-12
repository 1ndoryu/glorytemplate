/*
 * Componente: SeccionBloqueos — Kamples (QQ25)
 * Sección de la configuración para gestionar usuarios bloqueados.
 * Lista los bloqueos activos con opción de desbloquear.
 */

import { useEffect } from 'react';
import { Ban } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useBloqueosStore } from '@app/stores/bloqueosStore';

export const SeccionBloqueos = (): JSX.Element => {
    const bloqueados = useBloqueosStore(s => s.bloqueados);
    const cargado = useBloqueosStore(s => s.cargado);
    const cargar = useBloqueosStore(s => s.cargar);
    const desbloquear = useBloqueosStore(s => s.desbloquear);

    useEffect(() => {
        if (!cargado) cargar();
    }, [cargado, cargar]);

    if (!cargado) {
        return (
            <div className="configSeccion">
                <span className="configSubtexto">Cargando bloqueos...</span>
            </div>
        );
    }

    if (bloqueados.length === 0) {
        return (
            <div className="configSeccion configSeccionVacia">
                <Ban size={32} />
                <span className="configLabel">Sin bloqueos</span>
                <span className="configSubtexto">No tienes usuarios bloqueados.</span>
            </div>
        );
    }

    return (
        <>
            <div className="configSeccion">
                <span className="configSubtexto">
                    Los usuarios bloqueados no pueden ver tu contenido ni interactuar contigo.
                </span>
            </div>
            {bloqueados.map((usuario) => (
                <div key={usuario.id} className="configSeccion configSeccionHorizontal">
                    <div className="configBloqueoUsuario">
                        <Avatar
                            src={usuario.avatar_url}
                            nombre={usuario.nombre_visible || usuario.username}
                            tamano="sm"
                        />
                        <div className="configBloqueoInfo">
                            <span className="configLabel">{usuario.nombre_visible || usuario.username}</span>
                            <span className="configSubtexto">@{usuario.username}</span>
                        </div>
                    </div>
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        onClick={() => desbloquear(usuario.id)}
                    >
                        Desbloquear
                    </BotonBase>
                </div>
            ))}
        </>
    );
};
