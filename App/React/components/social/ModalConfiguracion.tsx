/*
 * Componente: ModalConfiguracion  Kamples
 * Desktop: modal con panel lateral de navegacion.
 * Movil (QL89): pantalla completa con drill-down, sin wrapper Modal.
 * Logica en useModalConfiguracion (SRP), secciones en ConfiguracionSecciones.
 */

import {createPortal} from 'react-dom';
import {Save, ArrowLeft, X} from 'lucide-react';
import {BotonBase} from '@app/components/ui/BotonBase';
import {Modal} from '@app/components/ui/Modal';
import {useModalConfiguracion} from '@app/hooks/useModalConfiguracion';
import {useEsMovil} from '@app/hooks/useEsMovil';
import {useRegistrarCapa} from '@app/hooks/useRegistrarCapa';
import {ContenidoSeccion, NavSecciones, SECCIONES_NAV, type HookConfiguracion} from './ConfiguracionSecciones';
import '../../styles/componentes/modalConfiguracion.css';

/* Desktop: modal clasico con panel lateral */
const ConfiguracionDesktop = (h: HookConfiguracion): JSX.Element => (
    <Modal abierto={h.abierto && h.autenticado} onCerrar={h.manejarCerrar} className="configModalLayout">
        <div className="configNavLateral">
            <h3 className="configNavTitulo">Configuracion</h3>
            <NavSecciones h={h} />
        </div>
        <div className="configContenido">
            <div className="configSeccionContenido"><ContenidoSeccion h={h} /></div>
            <div className="configAcciones">
                <BotonBase variante="ghost" onClick={h.manejarCerrar} disabled={h.guardando}>Cancelar</BotonBase>
                <BotonBase variante="primario" onClick={h.manejarGuardar} disabled={h.guardando}>
                    <Save size={14} /> {h.guardando ? 'Guardando...' : 'Guardar'}
                </BotonBase>
            </div>
        </div>
    </Modal>
);

/* QL89+QL101: Movil  bottom sheet parcial tipo dropdown/menu contextual */
/* code-sentinel-disable: bottom-sheet requiere overlay custom, no el <Modal> estandar */
const ConfiguracionMovil = (h: HookConfiguracion): JSX.Element => createPortal(
    <div className="configMovilOverlay" onClick={h.manejarCerrar}>
        <div className="configMovilPantalla" onClick={(e) => e.stopPropagation()}>
            {h.movilEnMenu ? (
                <div className="configMovilNav">
                    <div className="configMovilCabecera">
                        <h3 className="configNavTitulo">Configuracion</h3>
                        <BotonBase variante="ghost" className="configMovilCerrar" onClick={h.manejarCerrar} type="button" aria-label="Cerrar">
                            <X size={20} />
                        </BotonBase>
                    </div>
                    <NavSecciones h={h} />
                </div>
            ) : (
                <div className="configMovilDetalle">
                    <div className="configMovilCabecera">
                        <BotonBase variante="ghost" className="configMovilVolver" onClick={h.volverAlMenuMovil} type="button">
                            <ArrowLeft size={18} />
                            <span>{SECCIONES_NAV.find(s => s.id === h.seccionActiva)?.etiqueta ?? 'Configuracion'}</span>
                        </BotonBase>
                        <BotonBase variante="ghost" className="configMovilCerrar" onClick={h.manejarCerrar} type="button" aria-label="Cerrar">
                            <X size={20} />
                        </BotonBase>
                    </div>
                    <div className="configMovilContenido"><ContenidoSeccion h={h} /></div>
                    <div className="configAcciones">
                        <BotonBase variante="ghost" onClick={h.manejarCerrar} disabled={h.guardando}>Cancelar</BotonBase>
                        <BotonBase variante="primario" onClick={h.manejarGuardar} disabled={h.guardando}>
                            <Save size={14} /> {h.guardando ? 'Guardando...' : 'Guardar'}
                        </BotonBase>
                    </div>
                </div>
            )}
        </div>
    </div>,
    document.body
);

export const ModalConfiguracion = (): JSX.Element | null => {
    const hookData = useModalConfiguracion();
    const {abierto, autenticado, manejarCerrar} = hookData;
    const esMovil = useEsMovil();

    useRegistrarCapa('configMovil', abierto && autenticado && esMovil, manejarCerrar);

    if (!abierto || !autenticado) return null;

    if (esMovil) return <ConfiguracionMovil {...hookData} />;
    return <ConfiguracionDesktop {...hookData} />;
};