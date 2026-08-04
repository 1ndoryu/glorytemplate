import {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {Search, X, Shield, Unlock} from 'lucide-react';
import {Modal} from '../shared';
import {Input} from '../ui';
import type {Habito, ReferenciaDependencia, Tarea} from '../../types/dashboard';
import {obtenerNombreDependencia} from '../../utils/dependencias';

export type TipoElementoDependencia = 'tarea' | 'habito' | 'subhabito';

interface ModalDependenciasProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    tipoActual: TipoElementoDependencia;
    idActual: number;
    padreIdActual?: number;
    nombreActual: string;
    dependencias: ReferenciaDependencia[];
    onGuardar: (dependencias: ReferenciaDependencia[]) => void;
    tareas: Tarea[];
    habitos: Habito[];
}

export function ModalDependencias({
    estaAbierto,
    onCerrar,
    tipoActual,
    idActual,
    padreIdActual,
    dependencias,
    onGuardar,
    tareas,
    habitos
}: ModalDependenciasProps): JSX.Element | null {
    const [busqueda, setBusqueda] = useState('');
    const [dependenciasLocal, setDependenciasLocal] = useState<ReferenciaDependencia[]>(dependencias || []);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDependenciasLocal(dependencias || []);
    }, [dependencias, estaAbierto]);

    const opciones = useMemo(() => {
        const lista: {tipo: TipoElementoDependencia; id: number; padreId?: number; nombre: string}[] = [];

        tareas.forEach(t => {
            if (tipoActual === 'tarea' && t.id === idActual) return;
            lista.push({tipo: 'tarea', id: t.id, nombre: t.texto});
        });

        habitos.forEach(h => {
            if (tipoActual === 'habito' && h.id === idActual) return;
            lista.push({tipo: 'habito', id: h.id, nombre: h.nombre});

            h.subhabitos?.forEach(sh => {
                if (tipoActual === 'subhabito' && h.id === (padreIdActual || 0) && sh.id === idActual) return;
                lista.push({tipo: 'subhabito', id: sh.id, padreId: h.id, nombre: `${h.nombre} > ${sh.nombre}`});
            });
        });

        return lista;
    }, [tareas, habitos, tipoActual, idActual, padreIdActual]);

    const opcionesFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return opciones.slice(0, 8);
        return opciones.filter(o => o.nombre.toLowerCase().includes(texto)).slice(0, 8);
    }, [opciones, busqueda]);

    const agregarDependencia = useCallback(
        (tipo: TipoElementoDependencia, id: number, padreId?: number, nombre?: string) => {
            const yaExiste = dependenciasLocal.some(d => d.tipo === tipo && d.id === id && d.padreId === padreId);
            if (yaExiste) return;

            const nueva: ReferenciaDependencia = {
                tipo,
                id,
                padreId,
                nombreSnapshot: nombre || undefined,
                modo: 'estricto'
            };
            setDependenciasLocal(prev => [...prev, nueva]);
        },
        [dependenciasLocal]
    );

    const eliminarDependencia = useCallback((tipo: TipoElementoDependencia, id: number, padreId?: number) => {
        setDependenciasLocal(prev => prev.filter(d => !(d.tipo === tipo && d.id === id && d.padreId === padreId)));
    }, []);

    const cambiarModoDependencia = useCallback((index: number, modo: 'estricto' | 'suave') => {
        setDependenciasLocal(prev => {
            const nuevas = [...prev];
            if (nuevas[index]) {
                nuevas[index] = {...nuevas[index], modo};
            }
            return nuevas;
        });
    }, []);

    /* Auto-guardar al cerrar (X, overlay click) */
    const handleCerrar = useCallback(() => {
        onGuardar(dependenciasLocal);
        onCerrar();
    }, [dependenciasLocal, onGuardar, onCerrar]);

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={handleCerrar} titulo="Dependencias">
            <div className="modalDependencias">
                <div className="modalDependenciasBuscador">
                    <Input
                        ref={inputRef}
                        tipo="text"
                        icono={<Search size={14} />}
                        placeholder="Buscar tarea, hábito o subhábito..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />

                    {opcionesFiltradas.length > 0 && (
                        <div className="modalDependenciasResultados">
                            {opcionesFiltradas.map(opcion => (
                                <button
                                    key={`${opcion.tipo}-${opcion.id}-${opcion.padreId || ''}`}
                                    type="button"
                                    className="modalDependenciasResultado"
                                    onClick={() => {
                                        agregarDependencia(opcion.tipo, opcion.id, opcion.padreId, opcion.nombre);
                                        setBusqueda('');
                                        inputRef.current?.focus();
                                    }}>
                                    <span className="modalDependenciasResultadoNombre">{opcion.nombre}</span>
                                    <span className="modalDependenciasResultadoTipo">{opcion.tipo}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {dependenciasLocal.length > 0 && (
                    <div className="modalDependenciasLista">
                        {dependenciasLocal.map((dep, index) => (
                            <div key={`${dep.tipo}-${dep.id}-${dep.padreId || ''}`} className="modalDependenciasItem">
                                <span className="modalDependenciasItemNombre">{obtenerNombreDependencia(dep, tareas, habitos)}</span>
                                <span className="modalDependenciasItemTipo">{dep.tipo}</span>
                                <div className="modalDependenciasItemModo">
                                    <button
                                        type="button"
                                        className={`modalDependenciasModo ${dep.modo !== 'suave' ? 'modalDependenciasModoActivo' : ''}`}
                                        onClick={() => cambiarModoDependencia(index, 'estricto')}
                                        title="Estricto: se reinicia cada periodo">
                                        <Shield size={10} />
                                        <span>Estricto</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`modalDependenciasModo ${dep.modo === 'suave' ? 'modalDependenciasModoActivo' : ''}`}
                                        onClick={() => cambiarModoDependencia(index, 'suave')}
                                        title="Suave: queda desbloqueado una vez cumplido">
                                        <Unlock size={10} />
                                        <span>Suave</span>
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="modalDependenciasItemEliminar"
                                    onClick={() => eliminarDependencia(dep.tipo, dep.id, dep.padreId)}
                                    aria-label="Eliminar dependencia">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {dependenciasLocal.length === 0 && opcionesFiltradas.length === 0 && (
                    <div className="modalDependenciasVacio">
                        <span>No hay elementos disponibles para configurar dependencias.</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
