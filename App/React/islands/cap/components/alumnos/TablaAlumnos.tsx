/**
 * TablaAlumnos
 *
 * Tabla con lista de alumnos, ordenación, búsqueda y paginación.
 * Renderiza filas con acciones de editar/eliminar/disponibilidad/descarga.
 */

import {useState} from 'react';
import {Input, Boton, Badge, Spinner, Tooltip} from '../ui';
import {IconoBuscar, IconoEditar, IconoEliminar, IconoOrdenar, IconoReloj, IconoDescargar} from '../icons';
import type {Alumno, FiltrosAlumnos} from '../../hooks/useAlumnos';
import {calcularProgreso, estadoProgreso} from '../../hooks/useAlumnos';

interface TablaAlumnosProps {
    alumnos: Alumno[];
    total: number;
    cargando: boolean;
    eliminando: number | null;
    filtros: FiltrosAlumnos;
    onCambiarFiltros: (filtros: Partial<FiltrosAlumnos>) => void;
    onEditar: (alumno: Alumno) => void;
    onEliminar: (id: number) => void;
    onDisponibilidad?: (alumno: Alumno) => void;
    onVerProgreso?: (alumno: Alumno) => void;
    onDescargarPlan?: (alumno: Alumno) => void;
    descargando?: number | null;
}

export function TablaAlumnos({alumnos, total, cargando, eliminando, filtros, onCambiarFiltros, onEditar, onEliminar, onDisponibilidad, onVerProgreso, onDescargarPlan, descargando}: TablaAlumnosProps) {
    const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda);

    const normalizarNumero = (valor: number | string | undefined) => {
        if (valor === undefined || valor === null) return 0;
        const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
        return Number.isFinite(numero) ? numero : 0;
    };

    const formatearHoras = (valor: number | string | undefined) => {
        const numero = normalizarNumero(valor);
        const redondeado = Math.round(numero * 10) / 10;
        return Number.isInteger(redondeado) ? redondeado.toString() : redondeado.toFixed(1);
    };

    const handleBusqueda = (e: React.FormEvent) => {
        e.preventDefault();
        onCambiarFiltros({busqueda: busquedaLocal});
    };

    const handleOrdenar = (columna: 'nombre' | 'email' | 'created_at') => {
        if (filtros.ordenarPor === columna) {
            onCambiarFiltros({orden: filtros.orden === 'ASC' ? 'DESC' : 'ASC'});
        } else {
            onCambiarFiltros({ordenarPor: columna, orden: 'ASC'});
        }
    };

    const totalPaginas = Math.ceil(total / filtros.porPagina);

    const renderEstadoBadge = (estado: string) => {
        const variantes: Record<string, 'exito' | 'info' | 'neutral'> = {
            activo: 'info',
            completado: 'exito',
            pausado: 'neutral'
        };
        const etiquetas: Record<string, string> = {
            activo: 'Activo',
            completado: 'Completado',
            pausado: 'Pausado'
        };
        return <Badge variante={variantes[estado] || 'neutral'}>{etiquetas[estado] || estado}</Badge>;
    };

    const renderProgreso = (alumno: Alumno) => {
        const horasCompletadas = alumno.horas_completadas_calculadas !== undefined ? normalizarNumero(alumno.horas_completadas_calculadas) : normalizarNumero(alumno.horas_completadas);
        const horasAsignadas = alumno.horas_asignadas !== undefined ? normalizarNumero(alumno.horas_asignadas) : horasCompletadas;

        const maxHoras = 35; // CAP_REGLAS.HORAS_TOTALES ideally
        const pctCompletado = Math.min(100, (horasCompletadas / maxHoras) * 100);

        // Calculamos el porcentaje visual de lo planificado (lo que falta por completar del plan)
        const horasRestantesPlan = Math.max(0, horasAsignadas - horasCompletadas);
        const pctPlanificado = Math.min(100 - pctCompletado, (horasRestantesPlan / maxHoras) * 100);

        const esClickeable = Boolean(onVerProgreso);

        const handleClick = () => {
            if (onVerProgreso) {
                onVerProgreso(alumno);
            }
        };

        const tooltipContent = (
            <div className="capFlexCol capGap--xs">
                <div>
                    Completadas: <strong>{formatearHoras(horasCompletadas)}h</strong>
                </div>
                <div>
                    Planificadas: <strong>{formatearHoras(horasRestantesPlan)}h</strong>
                </div>
                <div style={{borderTop: '1px solid currentColor', paddingTop: 2, marginTop: 2}}>
                    Total Estimado: <strong>{formatearHoras(horasCompletadas + horasRestantesPlan)}h</strong> / 35h
                </div>
            </div>
        );

        return (
            <div className={`capProgresoCelda ${esClickeable ? 'capProgresoCelda--clickeable' : ''}`} onClick={esClickeable ? handleClick : undefined} title={undefined /* Removed native title to use Tooltip */}>
                <Tooltip content={tooltipContent} position="top" className="capFlex-1">
                    <div className="capProgreso capProgreso--multi">
                        <div className="capProgreso__barra--completado" style={{width: `${pctCompletado}%`}} />
                        <div className="capProgreso__barra--planificado" style={{width: `${pctPlanificado}%`}} />
                    </div>
                </Tooltip>

                <div className="capProgreso__textos">
                    <span className="capProgreso__texto">
                        <span className="capProgreso__texto--completado">{formatearHoras(horasCompletadas)}h</span>
                        <span className="capTexto--terciario"> / 35h</span>
                    </span>
                    {horasRestantesPlan > 0.1 && (
                        <span className="capProgreso__textoSec capFlexStart capGap--xs">
                            <span className="capPunto capPunto--planificado"></span>+{formatearHoras(horasRestantesPlan)}h plan
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const renderColumnaOrdenable = (columna: 'nombre' | 'email' | 'created_at', label: string) => {
        const esActiva = filtros.ordenarPor === columna;
        return (
            <th className={`capTabla__th capTabla__th--ordenable ${esActiva ? 'capTabla__th--activa' : ''}`} onClick={() => handleOrdenar(columna)}>
                <span>{label}</span>
                <IconoOrdenar direccion={esActiva ? filtros.orden : undefined} className="capTabla__iconoOrden" />
            </th>
        );
    };

    return (
        <div className="capTablaAlumnos">
            {/* Barra de búsqueda */}
            <form onSubmit={handleBusqueda} className="capTablaAlumnos__busqueda">
                <Input tipo="text" placeholder="Buscar por nombre, email o DNI..." value={busquedaLocal} onChange={e => setBusquedaLocal(e.target.value)} icono={<IconoBuscar />} className="capTablaAlumnos__inputBusqueda" />
                <Boton type="submit" variante="secundario" tamano="md">
                    Buscar
                </Boton>
            </form>

            {/* Leyenda de Progreso */}
            <div className="capFlexEnd capMb--sm capGap--md">
                <div className="capFlexStart capGap--xs">
                    <span className="capPunto capPunto--completado"></span>
                    <span className="capTexto--xs capTexto--secundario">Completadas</span>
                </div>
                <div className="capFlexStart capGap--xs">
                    <span className="capPunto capPunto--planificado"></span>
                    <span className="capTexto--xs capTexto--secundario">Planificadas</span>
                </div>
            </div>

            {/* Tabla */}
            <div className="capTabla__contenedor">
                {cargando ? (
                    <div className="capTabla__cargando">
                        <Spinner tamano="lg" />
                    </div>
                ) : alumnos.length === 0 ? (
                    <div className="capTabla__vacio">
                        <p className="capTexto capTexto--secundario">{filtros.busqueda ? 'No se encontraron alumnos con esa búsqueda' : 'No hay alumnos registrados aún'}</p>
                    </div>
                ) : (
                    <table className="capTabla">
                        <thead>
                            <tr>
                                {renderColumnaOrdenable('nombre', 'Nombre')}
                                {renderColumnaOrdenable('email', 'Email')}
                                <th className="capTabla__th">Teléfono</th>
                                <th className="capTabla__th">Progreso</th>
                                <th className="capTabla__th">Estado</th>
                                <th className="capTabla__th capTabla__th--acciones">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alumnos.map(alumno => (
                                <tr key={alumno.id} className="capTabla__tr">
                                    <td className="capTabla__td capTabla__td--nombre">
                                        <span className="capTabla__nombreCompleto">{alumno.nombre}</span>
                                        {alumno.dni && <span className="capTabla__dni">DNI: {alumno.dni}</span>}
                                    </td>
                                    <td className="capTabla__td">{alumno.email || '-'}</td>
                                    <td className="capTabla__td">{alumno.telefono || '-'}</td>
                                    <td className="capTabla__td">{renderProgreso(alumno)}</td>
                                    <td className="capTabla__td">{renderEstadoBadge(alumno.estado)}</td>
                                    <td className="capTabla__td capTabla__td--acciones">
                                        <div className="capTabla__acciones">
                                            {onDisponibilidad && (
                                                <Boton variante="ghost" tamano="sm" onClick={() => onDisponibilidad(alumno)} title="Disponibilidad horaria">
                                                    <IconoReloj />
                                                </Boton>
                                            )}
                                            {onDescargarPlan && (
                                                <Boton variante="ghost" tamano="sm" onClick={() => onDescargarPlan(alumno)} cargando={descargando === alumno.id} title="Descargar plan de formación">
                                                    <IconoDescargar />
                                                </Boton>
                                            )}
                                            <Boton variante="ghost" tamano="sm" onClick={() => onEditar(alumno)} title="Editar alumno">
                                                <IconoEditar />
                                            </Boton>
                                            <Boton variante="ghost" tamano="sm" onClick={() => onEliminar(alumno.id)} cargando={eliminando === alumno.id} className="capBoton--peligroGhost" title="Eliminar alumno">
                                                <IconoEliminar />
                                            </Boton>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="capPaginacion">
                    <span className="capPaginacion__info">
                        Mostrando {(filtros.pagina - 1) * filtros.porPagina + 1} - {Math.min(filtros.pagina * filtros.porPagina, total)} de {total}
                    </span>
                    <div className="capPaginacion__controles">
                        <Boton variante="secundario" tamano="sm" disabled={filtros.pagina <= 1} onClick={() => onCambiarFiltros({pagina: filtros.pagina - 1})}>
                            Anterior
                        </Boton>
                        <span className="capPaginacion__paginas">
                            Página {filtros.pagina} de {totalPaginas}
                        </span>
                        <Boton variante="secundario" tamano="sm" disabled={filtros.pagina >= totalPaginas} onClick={() => onCambiarFiltros({pagina: filtros.pagina + 1})}>
                            Siguiente
                        </Boton>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TablaAlumnos;
