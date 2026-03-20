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
import { useT } from '@app/utils/i18n/useT';

export const SeccionBloqueos = (): JSX.Element => {
    const bloqueados = useBloqueosStore(s => s.bloqueados);
    const cargado = useBloqueosStore(s => s.cargado);
    const cargar = useBloqueosStore(s => s.cargar);
    const desbloquear = useBloqueosStore(s => s.desbloquear);

    const { t } = useT();

    useEffect(() => {
        if (!cargado) cargar();
    }, [cargado, cargar]);

    if (!cargado) {
        return (
            <div className="configSeccion">
                <span className="configSubtexto">{t('bloqueos.cargando')}</span>
            </div>
        );
    }

    if (bloqueados.length === 0) {
        return (
            <div className="configSeccion configSeccionVacia">
                <Ban size={32} />
                <span className="configLabel">{t('bloqueos.sinBloqueos')}</span>
                <span className="configSubtexto">{t('bloqueos.sinBloqueosDesc')}</span>
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
