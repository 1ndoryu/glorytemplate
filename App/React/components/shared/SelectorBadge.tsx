/*
 * SelectorBadge
 * Componente de selección estilizado como badge con menú desplegable
 * Reemplaza selects nativos por una interfaz más elegante tipo badge
 */

import {useState, useRef, useEffect, useCallback} from 'react';
import {ChevronDown} from 'lucide-react';
import type {ReactNode} from 'react';

export interface OpcionBadge<T extends string = string> {
    id: T;
    etiqueta: string;
    icono?: ReactNode;
    descripcion?: string;
}

interface SelectorBadgeProps<T extends string = string> {
    opciones: OpcionBadge<T>[];
    valorActual: T;
    onChange: (valor: T) => void;
    icono?: ReactNode;
    titulo?: string;
    className?: string;
}

export function SelectorBadge<T extends string = string>({opciones, valorActual, onChange, icono, titulo, className = ''}: SelectorBadgeProps<T>): JSX.Element {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const opcionActual = opciones.find(o => o.id === valorActual);

    /* Cerrar al hacer click fuera */
    const cerrarMenu = useCallback(() => {
        setMenuAbierto(false);
    }, []);

    useEffect(() => {
        if (!menuAbierto) return;

        const manejarClickFuera = (evento: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
                cerrarMenu();
            }
        };

        const manejarEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                cerrarMenu();
            }
        };

        /* Delay para evitar cerrar inmediatamente */
        const timeout = setTimeout(() => {
            document.addEventListener('click', manejarClickFuera);
        }, 0);

        document.addEventListener('keydown', manejarEscape);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('click', manejarClickFuera);
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [menuAbierto, cerrarMenu]);

    /* Posicionar menú */
    useEffect(() => {
        if (!menuAbierto || !menuRef.current || !contenedorRef.current) return;

        const menu = menuRef.current;
        const contenedor = contenedorRef.current;
        const rectContenedor = contenedor.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const rectMenu = menu.getBoundingClientRect();

        /* Ajuste Vertical: Mostrar arriba si no hay espacio abajo */
        const espacioAbajo = viewportHeight - rectContenedor.bottom;
        if (espacioAbajo < 150) {
            menu.style.bottom = '100%';
            menu.style.top = 'auto';
            menu.style.marginBottom = '4px';
        } else {
            menu.style.top = '100%';
            menu.style.bottom = 'auto';
            menu.style.marginTop = '4px';
        }

        /* Ajuste Horizontal: Alinear a la derecha si se sale por la derecha */
        // Usamos un margen de seguridad de 10px
        if (rectContenedor.left + rectMenu.width > viewportWidth - 10) {
            menu.style.left = 'auto';
            menu.style.right = '0';
        } else {
            menu.style.left = '0';
            menu.style.right = 'auto';
        }
    }, [menuAbierto]);

    const seleccionarOpcion = (opcion: OpcionBadge<T>) => {
        onChange(opcion.id);
        cerrarMenu();
    };

    return (
        <div id="selector-badge-contenedor" ref={contenedorRef} className={`selectorBadgeContenedor ${className}`.trim()}>
            <button type="button" className={`selectorBadgeBoton ${menuAbierto ? 'selectorBadgeBotonActivo' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)} title={titulo || opcionActual?.descripcion}>
                {icono && <span className="selectorBadgeIcono">{icono}</span>}
                {opcionActual?.icono && <span className="selectorBadgeOpcionIcono">{opcionActual.icono}</span>}
                <span className="selectorBadgeTexto">{opcionActual?.etiqueta || 'Seleccionar'}</span>
                <ChevronDown size={10} className={`selectorBadgeFlecha ${menuAbierto ? 'selectorBadgeFlechaAbierta' : ''}`} />
            </button>

            {menuAbierto && (
                <div ref={menuRef} className="selectorBadgeMenu" role="menu">
                    {opciones.map(opcion => (
                        <button key={opcion.id} type="button" className={`selectorBadgeOpcion ${opcion.id === valorActual ? 'selectorBadgeOpcionActiva' : ''}`} onClick={() => seleccionarOpcion(opcion)} role="menuitem">
                            {opcion.icono && <span className="selectorBadgeOpcionIcono">{opcion.icono}</span>}
                            <span className="selectorBadgeOpcionTexto">{opcion.etiqueta}</span>
                            {opcion.descripcion && <span className="selectorBadgeOpcionDesc">{opcion.descripcion}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
