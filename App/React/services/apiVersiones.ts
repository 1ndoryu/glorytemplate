/*
 * [2003A-16] apiVersiones — Servicio para gestión de versiones de app desde el VPS.
 * Las versiones se almacenan en WP options y se actualizan via el endpoint admin.
 * Sin dependencia de GitHub — todo gestionado desde el propio servidor.
 */

import { apiPeticion } from './apiCliente';
import type { VersionesDisponibles } from '@app/stores/versionStore';

export const guardarVersionesAdmin = (versiones: VersionesDisponibles) =>
    apiPeticion<{ ok: boolean }>('/kamples/v1/admin/app/versions', {
        method: 'POST',
        body: versiones,
    });
