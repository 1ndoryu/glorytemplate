/*
 * MenuContextual: Componente de menú desplegable con icono de tres puntos.
 * Usa Portal para renderizar fuera del DOM padre, evitando cortes por overflow.
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
}

interface PosicionMenu {
    top: number;
    left: number;
}

export const MenuContextual: React.FC<MenuContextualProps> = ({acciones, ariaLabel = 'Menú de acciones'}) => {
    const [abierto, setAbierto] = useState(false);
    const [posicion, setPosicion] = useState<PosicionMenu>({top: 0, left: 0});
    const botonRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    /* Calcula la posición del menú basándose en el botón */
    const calcularPosicion = useCallback(() => {
        if (!botonRef.current) return;

        const rect = botonRef.current.getBoundingClientRect();
        const menuAncho = 160;
        const menuAlto = acciones.length * 36 + 8;

        /* Posición inicial: debajo del botón, alineado a la derecha */
        let top = rect.bottom + 4;
        let left = rect.right - menuAncho;

        /* Ajustar si se sale por la derecha */
        if (left < 8) {
            left = 8;
        }

        /* Ajustar si se sale por abajo */
        if (top + menuAlto > window.innerHeight - 8) {
            top = rect.top - menuAlto - 4;
        }

        setPosicion({top, left});
    }, [acciones.length]);

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
            const clickEnBoton = botonRef.current?.contains(target);
            const clickEnMenu = menuRef.current?.contains(target);

            if (!clickEnBoton && !clickEnMenu) {
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
                  className="menuContextualLista"
                  ref={menuRef}
                  role="menu"
                  style={{
                      position: 'fixed',
                      top: posicion.top,
                      left: posicion.left,
                      zIndex: 9999
                  }}>
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

    return (
        <div className="menuContextualContenedor">
            <Boton ref={botonRef} variante="ghost" className={`menuContextualBoton ${abierto ? 'activo' : ''}`} onClick={toggleMenu} icono={<MoreVertical size={16} />} />
            {menuPortal}
        </div>
    );
};
