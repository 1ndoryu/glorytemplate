/*
 * [2003A-16] useGestionVersiones — Lógica de edición y guardado de versiones de app.
 * Permite al admin actualizar versiones Windows/APK/Web directamente desde el VPS.
 * SRP: toda la lógica de estado aquí; SeccionAdminVersiones solo renderiza.
 */

import { useState, useEffect } from 'react';
import { useVersionStore } from '@app/stores/versionStore';
import { crearToast } from '@app/components/ui/Notificacion';
import { guardarVersionesAdmin } from '@app/services/apiVersiones';

export interface CampoBorrador { version: string; url: string; notes: string; }
export interface BorradorVersiones { windows: CampoBorrador; apk: CampoBorrador; web: CampoBorrador; }

const VACIO: CampoBorrador = { version: '', url: '', notes: '' };

const mapear = (v: { version?: string; url?: string; notes?: string } | null | undefined): CampoBorrador => ({
    version: v?.version ?? '',
    url: v?.url ?? '',
    notes: v?.notes ?? '',
});

export const useGestionVersiones = () => {
    const versions = useVersionStore(s => s.versions);
    const [borrador, setBorrador] = useState<BorradorVersiones>({ windows: VACIO, apk: VACIO, web: VACIO });
    const [guardando, setGuardando] = useState(false);

    /* Poblar formulario con las versiones actuales cuando el store cargue */
    useEffect(() => {
        setBorrador({
            windows: mapear(versions.windows),
            apk: mapear(versions.apk),
            web: mapear(versions.web),
        });
    }, [versions]);

    const actualizar = (plataforma: keyof BorradorVersiones, campo: keyof CampoBorrador, valor: string) => {
        setBorrador(prev => ({ ...prev, [plataforma]: { ...prev[plataforma], [campo]: valor } }));
    };

    const guardar = async () => {
        setGuardando(true);
        try {
            const res = await guardarVersionesAdmin({
                windows: borrador.windows.version ? borrador.windows : null,
                apk: borrador.apk.version ? borrador.apk : null,
                /* web: sin campo URL (solo version + notes) */
                web: borrador.web.version ? { version: borrador.web.version, notes: borrador.web.notes } : null,
            });
            if (res.ok) {
                crearToast('exito', 'Versiones de app actualizadas');
            } else {
                crearToast('error', res.error ?? 'Error al guardar versiones');
            }
        } catch {
            crearToast('error', 'Error de conexión');
        } finally {
            setGuardando(false);
        }
    };

    return { borrador, actualizar, guardar, guardando };
};
