/*
 * MenuContextual: Componente de menú desplegable.
 * Usa Portal para renderizar fuera del DOM padre, evitando cortes por overflow.
 * Soporta trigger personalizado y cabecera opcional.
 */

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {createPortal} from 'react-dom';
import {MoreVertical} from 'lucide-react';
import {Boton} from './Boton';

export interface AccionMenu {
    id: string;
    label: string;
    icono?: React.ReactNode;
    onClick: () => void;
    peligroso?: boolean;
    separadorAntes?: boolean;
}

interface MenuContextualProps {
    acciones: AccionMenu[];
    ariaLabel?: string;
    trigger?: React.ReactNode; /* Elemento que abre el menú. Por defecto icono 3 puntos. */
    cabecera?: React.ReactNode; /* Contenido custom al tope de la lista */
    anchoMinimo?: number; /* Ancho mínimo del menú (px) */
}

interface PosicionMenu {
    top: number;
    left: number;
}

export const MenuContextual: React.FC<MenuContextualProps> = ({acciones, ariaLabel = 'Menú de acciones', trigger, cabecera, anchoMinimo = 160}) => {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState<PosicionMenu>({top: 0, left: 0});
    /* Usamos un div genérico para el trigger si viene personalizado, o Boton ref si no */
    const triggerRef = useRef<HTMLElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    /* Calcula la posición del menú basándose en el trigger */
    const calcularPosicion = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        // Altura estimada (puede variar si hay cabecera, pero Portal ajusta)
        const cabeceraAlto = cabecera ? 60 : 0;
        const menuAlto = acciones.length * 36 + 8 + cabeceraAlto;

        /* Posición inicial: debajo del botón, alineado a la derecha del botón */
        let top = rect.bottom + 4;
        let left = rect.right - anchoMinimo;

        /* Ajustar si se sale por la izquierda */
        if (left < 8) {
            // Si no cabe alineado a la derecha, intentar alinear a la izquierda
            left = rect.left;
        }

        /* Ajustar si se sale por la derecha (viewport) */
        if (left + anchoMinimo > window.innerWidth - 8) {
            left = window.innerWidth - anchoMinimo - 8;
        }

        /* Ajustar si se sale por abajo */
        if (top + menuAlto > window.innerHeight - 8) {
            top = rect.top - menuAlto - 4;
        }

        setPosicion({top, left});
    }, [acciones.length, cabecera, anchoMinimo]);

    /* Abrir menú y calcular posición */
    const toggleMenu = () => {
        if (!abierto) {
            calcularPosicion();
        }
        setAbierto(!abierto);
    };

    /* Cierra el menú al hacer clic fuera */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Verificar si el click fue dentro del trigger (que puede ser un componente complejo)
            const clickEnTrigger = triggerRef.current?.contains(target);
            const clickEnMenu = menuRef.current?.contains(target);

            if (!clickEnTrigger && !clickEnMenu) {
                setAbierto(false);
            }
        };

        /* Cerrar al hacer scroll o resize */
        const handleCerrar = () => setAbierto(false);

        if (abierto) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleCerrar, true);
            window.addEventListener('resize', handleCerrar);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleCerrar, true);
            window.removeEventListener('resize', handleCerrar);
        };
    }, [abierto]);

    const handleAccionClick = (accion: AccionMenu) => {
        accion.onClick();
        setAbierto(false);
    };

    /* Portal del menú renderizado en el body */
    const menuPortal = abierto
        ? createPortal(
              <div
                  className="menuContextualLista fade-in"
                  ref={menuRef}
                  role="menu"
                  style={{
                      position: 'fixed',
                      top: posicion.top,
                      left: posicion.left,
                      zIndex: 9999,
                      minWidth: anchoMinimo
                  }}>
                  {cabecera && (
                      <div className="menuContextualCabecera">
                          {cabecera}
                          <div className="menuContextualSeparador" />
                      </div>
                  )}

                  {acciones.map(accion => (
                      <React.Fragment key={accion.id}>
                          {accion.separadorAntes && <div className="menuContextualSeparador" />}
                          <Boton variante="ghost" bloque className={`menuContextualItem ${accion.peligroso ? 'peligroso' : ''}`} onClick={() => handleAccionClick(accion)} icono={accion.icono}>
                              <span>{accion.label}</span>
                          </Boton>
                      </React.Fragment>
                  ))}
              </div>,
              document.body
          )
        : null;

    /* Renderizar Trigger */
    if (trigger) {
        return (
            <div className={`menuContextualContenedor ${abierto ? 'abierto' : ''}`}>
                <div ref={triggerRef as React.RefObject<HTMLDivElement>} onClick={toggleMenu} style={{cursor: 'pointer', display: 'inline-block'}}>
                    {trigger}
                </div>
                {menuPortal}
            </div>
        );
    }

    /* Trigger por defecto (Botón 3 puntos) */
    return (
        <div className="menuContextualContenedor">
            <Boton ref={triggerRef as React.RefObject<HTMLButtonElement>} variante="ghost" className={`menuContextualBoton ${abierto ? 'activo' : ''}`} onClick={toggleMenu} icono={<MoreVertical size={16} />} />
            {menuPortal}
        </div>
    );
};
