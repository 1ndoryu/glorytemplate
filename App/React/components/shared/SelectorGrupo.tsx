/*
 * SelectorGrupo
 * Selector de grupo de ejecucion
 * Variante "pill" para formularios (igual que SelectorEstadoPill / SelectorProyectoPill)
 * Variante "badge" para headers de panel (igual que SelectorBadge)
 */

import {useState, useRef, useCallback} from 'react';
import {FolderOpen, Plus, Folder} from 'lucide-react';
import {createPortal} from 'react-dom';
import type {Ref} from 'react';
import {Boton} from '../ui';
import {MenuContextual, type OpcionMenu} from './MenuContextual';
import {useSelectorBadge} from '../../hooks/shared/useSelectorBadge';
import {useGruposEjecucionStore} from '../../stores/gruposEjecucionStore';

interface SelectorGrupoProps {
    grupos: string[];
    grupoActual: string | null;
    onChange: (grupo: string | null) => void;
    placeholder?: string;
    titulo?: string;
    soloIcono?: boolean;
    variante?: 'pill' | 'badge';
}

export function SelectorGrupo({
    grupos,
    grupoActual,
    onChange,
    placeholder = 'Sin grupo',
    titulo = 'Grupo',
    soloIcono = false,
    variante = 'pill'
}: SelectorGrupoProps): JSX.Element {
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const registrarYNotificar = useCallback((grupo: string | null) => {
        if (grupo) {
            useGruposEjecucionStore.getState().registrarGrupo(grupo);
        }
        onChange(grupo);
    }, [onChange]);

    const crearGrupo = useCallback((cerrarMenuLocal: () => void) => {
        const nombre = nuevoGrupo.trim();
        if (nombre) {
            registrarYNotificar(nombre);
            setNuevoGrupo('');
            cerrarMenuLocal();
        }
    }, [nuevoGrupo, registrarYNotificar]);

    /* Variante PILL: igual que SelectorEstadoPill / SelectorProyectoPill */
    if (variante === 'pill') {
        const [menuAbierto, setMenuAbierto] = useState(false);
        const [posicionMenu, setPosicionMenu] = useState({x: 0, y: 0});
        const botonRef = useRef<HTMLButtonElement>(null);

        const abrirMenu = () => {
            if (botonRef.current) {
                const rect = botonRef.current.getBoundingClientRect();
                setPosicionMenu({x: rect.left, y: rect.bottom + 4});
            }
            setMenuAbierto(true);
        };

        const cerrarMenu = () => setMenuAbierto(false);

        const opciones: OpcionMenu[] = [
            {id: '', etiqueta: 'Sin grupo', icono: <FolderOpen size={12} />},
            ...grupos.map(g => ({id: g, etiqueta: g, icono: <Folder size={12} />}))
        ];

        const seleccionar = (id: string) => {
            registrarYNotificar(id || null);
            cerrarMenu();
        };

        return (
            <div className="propiedadesCompactas__item">
                <Boton
                    ref={botonRef}
                    type="button"
                    variante="ghost"
                    claseAdicional={`pillOpcion ${!grupoActual ? 'pillOpcion--vacio' : ''}`}
                    onClick={abrirMenu}
                    title={titulo}
                >
                    <FolderOpen size={14} />
                    <span>{grupoActual || placeholder}</span>
                </Boton>

                {menuAbierto && (
                    <MenuContextual
                        opciones={opciones}
                        posicionX={posicionMenu.x}
                        posicionY={posicionMenu.y}
                        onSeleccionar={seleccionar}
                        onCerrar={cerrarMenu}
                        footer={
                            <div className="selectorGrupoCrearPill">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={nuevoGrupo}
                                    onChange={e => setNuevoGrupo(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            crearGrupo(cerrarMenu);
                                        }
                                    }}
                                    placeholder="Nuevo grupo"
                                    className="selectorGrupoInputPill"
                                />
                                <Boton type="button" variante="ghost" soloIcono onClick={() => crearGrupo(cerrarMenu)} icono={<Plus size={14} />} title="Crear grupo" />
                            </div>
                        }
                    />
                )}
            </div>
        );
    }

    /* Variante BADGE: reutiliza selectorBadge (headers de panel) */
    const opciones = [
        {id: '', etiqueta: 'Sin grupo'},
        ...grupos.map(g => ({id: g, etiqueta: g}))
    ];

    const manejarCambio = useCallback((valor: string) => {
        registrarYNotificar(valor || null);
    }, [registrarYNotificar]);

    const {menuAbierto, contenedorRef, menuRef, toggleMenu, seleccionarOpcion, cerrarMenu} = useSelectorBadge({
        opciones,
        valorActual: grupoActual || '',
        onChange: manejarCambio
    });

    const etiquetaBoton = grupoActual || placeholder;
    const icono = <FolderOpen size={12} />;

    return (
        <div ref={contenedorRef as Ref<HTMLDivElement>} className="selectorBadgeContenedor">
            <Boton
                type="button"
                variante="badge"
                soloIcono={soloIcono}
                activo={menuAbierto}
                icono={icono}
                claseAdicional={soloIcono ? 'selectorBadgeBoton--soloIcono' : 'selectorBadgeBotonCompacto'}
                onClick={toggleMenu}
                title={titulo ? `${titulo}: ${etiquetaBoton}` : etiquetaBoton}
            >
                {!soloIcono && <span>{etiquetaBoton}</span>}
            </Boton>

            {menuAbierto && createPortal(
                <div ref={menuRef as Ref<HTMLDivElement>} className="selectorBadgeMenu" role="menu">
                    <Boton type="button" variante="ghost" claseAdicional={`selectorBadgeOpcion ${grupoActual === null ? 'selectorBadgeOpcionActiva' : ''}`} onClick={() => seleccionarOpcion({id: '', etiqueta: 'Sin grupo'})} role="menuitem">
                        <span className="selectorBadgeOpcionTexto">Sin grupo</span>
                    </Boton>

                    {grupos.map(grupo => (
                        <Boton key={grupo} type="button" variante="ghost" claseAdicional={`selectorBadgeOpcion ${grupoActual === grupo ? 'selectorBadgeOpcionActiva' : ''}`} onClick={() => seleccionarOpcion({id: grupo, etiqueta: grupo})} role="menuitem">
                            <span className="selectorBadgeOpcionTexto">{grupo}</span>
                        </Boton>
                    ))}

                    <div className="selectorGrupoCrear">
                        <input
                            ref={inputRef}
                            type="text"
                            value={nuevoGrupo}
                            onChange={e => setNuevoGrupo(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    crearGrupo(cerrarMenu);
                                }
                            }}
                            placeholder="Nuevo grupo"
                            className="selectorGrupoInput"
                        />
                        <Boton type="button" variante="ghost" soloIcono onClick={() => crearGrupo(cerrarMenu)} icono={<Plus size={14} />} title="Crear grupo" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
