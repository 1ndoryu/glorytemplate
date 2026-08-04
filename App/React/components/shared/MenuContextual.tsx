/*
 * MenuContextual
 * Componente de menu contextual reutilizable para click derecho
 * Responsabilidad unica: mostrar acciones contextuales en posicion del cursor
 */

import {ChevronRight} from 'lucide-react';
import {Boton} from '../ui';
import {useMenuContextual} from '../../hooks/shared/useMenuContextual';

export interface OpcionMenu {
    id: string;
    etiqueta: string;
    icono?: React.ReactNode;
    peligroso?: boolean;
    deshabilitado?: boolean;
    separadorDespues?: boolean;
    subOpciones?: OpcionMenu[];
}

interface MenuContextualProps {
    opciones: OpcionMenu[];
    posicionX: number;
    posicionY: number;
    onSeleccionar: (opcionId: string) => void;
    onCerrar: () => void;
    esSubmenu?: boolean;
    footer?: React.ReactNode;
}

export function MenuContextual({opciones, posicionX, posicionY, onSeleccionar, onCerrar, esSubmenu = false, footer}: MenuContextualProps): JSX.Element {
    const {menuRef, opcionActivaId, estiloSubmenu, manejarClick, manejarMouseEnterOpcion} = useMenuContextual({posicionX, posicionY, onSeleccionar, onCerrar, esSubmenu});

    return (
        <div id={esSubmenu ? undefined : 'menu-contextual'} ref={menuRef as React.RefObject<HTMLDivElement>} className={`menuContextual ${esSubmenu ? 'menuContextualSubmenu' : ''}`} role="menu" aria-orientation="vertical" style={esSubmenu ? estiloSubmenu : undefined}>
            {opciones.map(opcion => (
                <div key={opcion.id} className="menuContextualItemWrapper posicionRelativa" onMouseEnter={() => manejarMouseEnterOpcion(opcion.id)}>
                    <Boton type="button" variante="ghost" claseAdicional={`menuContextualOpcion ${opcion.peligroso ? 'menuContextualOpcionPeligrosa' : ''} ${opcion.deshabilitado ? 'menuContextualOpcionDeshabilitada' : ''} ${opcionActivaId === opcion.id && opcion.subOpciones ? 'menuContextualOpcionActiva' : ''}`} onClick={() => manejarClick(opcion)} disabled={opcion.deshabilitado} role="menuitem">
                        {opcion.icono && <span className="menuContextualIcono">{opcion.icono}</span>}
                        <span className="menuContextualEtiqueta">{opcion.etiqueta}</span>
                        {opcion.subOpciones && opcion.subOpciones.length > 0 && (
                            <span className="menuContextualFlecha">
                                <ChevronRight size={12} />
                            </span>
                        )}
                    </Boton>

                    {/* Renderizar Submenu si esta activo */}
                    {opcion.subOpciones && opcion.subOpciones.length > 0 && opcionActivaId === opcion.id && <MenuContextual opciones={opcion.subOpciones} posicionX={0} posicionY={0} onSeleccionar={onSeleccionar} onCerrar={onCerrar} esSubmenu={true} />}

                    {opcion.separadorDespues && <div className="menuContextualSeparador" />}
                </div>
            ))}

            {footer && (
                <>
                    <div className="menuContextualSeparador" />
                    <div className="menuContextualFooter" role="none">{footer}</div>
                </>
            )}
        </div>
    );
}

export type {MenuContextualProps};
