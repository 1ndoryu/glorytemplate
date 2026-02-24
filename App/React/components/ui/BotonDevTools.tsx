/*
 * Componente: BotonDevTools — Kamples (C29)
 * Boton flotante minimalista en la parte superior para cambio de modo.
 * Solo visible para admin. Permite simular: deslogueado, free, pro, premium, admin/usuario.
 */

import { useCallback } from 'react';
import { Settings, X, LogOut, Crown, Sparkles, User, Shield } from 'lucide-react';
import { useAuthStore } from '@app/stores/authStore';
import { useDevToolsStore } from '@app/stores/devToolsStore';
import type { TipoPlan, RolUsuario } from '@app/types';
import '../../styles/componentes/devTools.css';
import { BotonBase } from './BotonBase';

interface OpcionModo {
    etiqueta: string;
    icono: JSX.Element;
    plan?: TipoPlan;
    rol?: RolUsuario;
    deslogueado?: boolean;
}

const modos: OpcionModo[] = [
    { etiqueta: 'Deslogueado', icono: <LogOut size={14} />, deslogueado: true },
    { etiqueta: 'Free', icono: <User size={14} />, plan: 'free', rol: 'usuario' },
    { etiqueta: 'Pro', icono: <Sparkles size={14} />, plan: 'pro', rol: 'usuario' },
    { etiqueta: 'Premium', icono: <Crown size={14} />, plan: 'premium', rol: 'usuario' },
    { etiqueta: 'Admin', icono: <Shield size={14} />, plan: 'premium', rol: 'admin' },
];

export const BotonDevTools = (): JSX.Element | null => {
    const usuario = useAuthStore(s => s.usuario);
    const panelVisible = useDevToolsStore(s => s.panelVisible);
    const override = useDevToolsStore(s => s.override);
    const togglePanel = useDevToolsStore(s => s.togglePanel);
    const aplicarOverride = useDevToolsStore(s => s.aplicarOverride);
    const limpiarOverride = useDevToolsStore(s => s.limpiarOverride);

    const seleccionarModo = useCallback((modo: OpcionModo) => {
        if (modo.deslogueado) {
            aplicarOverride({ simulaDeslogueado: true });
        } else {
            aplicarOverride({ plan: modo.plan, rol: modo.rol });
        }
    }, [aplicarOverride]);

    /* Solo visible para admin (verificar rol real, no override) — después de hooks */
    const esAdmin = usuario?.rol === 'admin';
    if (!esAdmin) return null;

    const modoActivo = override
        ? override.simulaDeslogueado
            ? 'Deslogueado'
            : `${override.plan ?? 'free'} / ${override.rol ?? 'usuario'}`
        : 'Real';

    return (
        <>
            {/* Botón flotante pequeño */}
            <BotonBase variante="ghost"
                className="devToolsBoton"
                onClick={togglePanel}
                type="button"
                aria-label="Dev Tools"
                title={`Modo: ${modoActivo}`}
            >
                {override ? <span className="devToolsPulso" /> : null}
                <Settings size={14} />
            </BotonBase>

            {/* Panel de opciones */}
            {panelVisible && (
                <div className="devToolsPanel">
                    <div className="devToolsHeader">
                        <span>Cambiar Modo</span>
                        <BotonBase variante="ghost" onClick={togglePanel} type="button" className="devToolsCerrar">
                            <X size={12} />
                        </BotonBase>
                    </div>

                    <div className="devToolsOpciones">
                        {modos.map((modo) => {
                            const activo = override
                                ? modo.deslogueado
                                    ? override.simulaDeslogueado === true
                                    : override.plan === modo.plan && override.rol === modo.rol
                                : false;

                            return (
                                <BotonBase variante="ghost"
                                    key={modo.etiqueta}
                                    className={`devToolsOpcion ${activo ? 'devToolsOpcionActiva' : ''}`}
                                    onClick={() => seleccionarModo(modo)}
                                    type="button"
                                >
                                    {modo.icono}
                                    <span>{modo.etiqueta}</span>
                                </BotonBase>
                            );
                        })}
                    </div>

                    {override && (
                        <BotonBase variante="ghost"
                            className="devToolsReset"
                            onClick={limpiarOverride}
                            type="button"
                        >
                            Restaurar modo real
                        </BotonBase>
                    )}

                    <div className="devToolsInfo">
                        Solo afecta la UI, las APIs usan el rol real.
                    </div>
                </div>
            )}
        </>
    );
};

export default BotonDevTools;
