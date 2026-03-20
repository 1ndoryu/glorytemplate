/*
 * [2003A-16] SeccionAdminVersiones — Formulario de gestión de versiones de app.
 * Permite al admin actualizar versiones Windows/APK/Web directamente desde el VPS.
 * Lógica en useGestionVersiones (SRP). Se importa desde SeccionAdmin en ConfiguracionSecciones.
 */

import { Save } from 'lucide-react';
import { Input } from '@app/components/ui/Input';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useGestionVersiones } from '@app/hooks/useGestionVersiones';

const PLATAFORMAS = [
    { id: 'windows' as const, label: 'Windows', conUrl: true },
    { id: 'apk' as const, label: 'APK (Android)', conUrl: true },
    { id: 'web' as const, label: 'Web', conUrl: false },
];

export const SeccionAdminVersiones = (): JSX.Element => {
    const { borrador, actualizar, guardar, guardando } = useGestionVersiones();

    return (
        <div className="configSeccion">
            <span className="configLabel">Versiones de app</span>
            <span className="configSubtexto">Versión y URL de descarga por plataforma. Se muestra en el menú de perfil y en el modal de actualización.</span>
            {PLATAFORMAS.map(({ id, label, conUrl }) => (
                <div key={id} className="configAdminVersionFila">
                    <span className="configAdminVersionLabel">{label}</span>
                    <div className="configAdminVersionCampos">
                        <Input
                            placeholder="0.1.0"
                            value={borrador[id].version}
                            onChange={e => actualizar(id, 'version', e.target.value)}
                            className="configAdminVersionInput"
                            aria-label={`Versión ${label}`}
                        />
                        {conUrl && (
                            <Input
                                placeholder="https://..."
                                value={borrador[id].url}
                                onChange={e => actualizar(id, 'url', e.target.value)}
                                className="configAdminVersionInputUrl"
                                aria-label={`URL ${label}`}
                            />
                        )}
                    </div>
                </div>
            ))}
            <BotonBase variante="primario" tamano="sm" onClick={() => void guardar()} disabled={guardando} type="button">
                <Save size={13} />
                {guardando ? 'Guardando...' : 'Guardar versiones'}
            </BotonBase>
        </div>
    );
};
