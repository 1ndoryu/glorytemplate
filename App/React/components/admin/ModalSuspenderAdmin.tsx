/*
 * Componente: ModalSuspenderAdmin — QQ65
 * Modal reutilizable para suspender o marcar eliminación de un usuario desde admin.
 * Recibe la acción (suspender/eliminar) y callbacks del hook useAccionesSuspension.
 */

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { SelectorMenu, type OpcionSelector } from '../ui/SelectorMenu';
import { useT } from '@app/utils/i18n/useT';
import type { UsuarioAdmin } from '@app/services/apiAdmin';

type AccionSuspension = 'suspender' | 'eliminar' | null;

interface ModalSuspenderAdminProps {
    accion: AccionSuspension;
    usuario: UsuarioAdmin | null;
    procesando: boolean;
    onCerrar: () => void;
    onConfirmarSuspension: (horas: number, razon: string) => Promise<boolean>;
    onConfirmarEliminacion: (razon: string) => Promise<boolean>;
}

const OPCIONES_DURACION: OpcionSelector[] = [
    { valor: '24', etiqueta: '24 horas' },
    { valor: '48', etiqueta: '48 horas' },
    { valor: '168', etiqueta: '7 días' },
    { valor: '720', etiqueta: '30 días' },
];

export const ModalSuspenderAdmin = ({
    accion,
    usuario,
    procesando,
    onCerrar,
    onConfirmarSuspension,
    onConfirmarEliminacion,
}: ModalSuspenderAdminProps): JSX.Element | null => {
    const [horas, setHoras] = useState('48');
    const [razon, setRazon] = useState('');
    const { t } = useT();

    const titulo = accion === 'eliminar'
        ? t('admin.suspender.tituloEliminar', { username: usuario?.username ?? '' })
        : t('admin.suspender.tituloSuspender', { username: usuario?.username ?? '' });

    const manejarConfirmar = async () => {
        if (!razon.trim()) return;
        if (accion === 'suspender') {
            await onConfirmarSuspension(parseInt(horas, 10), razon.trim());
        } else if (accion === 'eliminar') {
            await onConfirmarEliminacion(razon.trim());
        }
        setRazon('');
        setHoras('48');
    };

    const pie = (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <BotonBase variante="ghost" onClick={onCerrar} disabled={procesando} type="button">
                {t('comun.cancelar')}
            </BotonBase>
            <BotonBase
                variante={accion === 'eliminar' ? 'peligro' : 'primario'}
                onClick={manejarConfirmar}
                disabled={procesando || !razon.trim()}
                type="button"
            >
                {procesando
                    ? t('admin.suspender.procesando')
                    : accion === 'eliminar'
                        ? t('admin.suspender.botonEliminar')
                        : t('admin.suspender.botonSuspender')}
            </BotonBase>
        </div>
    );

    return (
        <Modal
            abierto={accion !== null && usuario !== null}
            onCerrar={onCerrar}
            titulo={titulo}
            tamano="pequeno"
            pie={pie}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {accion === 'suspender' && (
                    <div>
                        <label
                            htmlFor="duracionSuspension"
                            style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--textoSecundario)' }}
                        >
                            {t('admin.suspender.duracion')}
                        </label>
                        <SelectorMenu
                            opciones={OPCIONES_DURACION}
                            valor={horas}
                            onChange={setHoras}
                            disabled={procesando}
                        />
                    </div>
                )}

                <div>
                    <label
                        htmlFor="razonSuspension"
                        style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--textoSecundario)' }}
                    >
                        {accion === 'eliminar' ? t('admin.suspender.razonEliminacion') : t('admin.suspender.razonSuspension')}
                    </label>
                    <CampoTexto
                        id="razonSuspension"
                        variante="bordado"
                        placeholder={t('admin.suspender.razonPlaceholder')}
                        value={razon}
                        onChange={(e) => setRazon(e.target.value)}
                        disabled={procesando}
                    />
                </div>
            </div>
        </Modal>
    );
};
