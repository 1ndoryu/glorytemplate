/**
 * SeccionProblemas
 *
 * [2003A-13] Vista de problemas reportados por usuarios (solo admin).
 * Lista todos los reportes con acciones para resolver o eliminar.
 */

import {Alerta, Spinner, Badge, Boton} from '../ui';
import {IconoCheck, IconoEliminar} from '../icons';
import {useProblemas, type ProblemaReportado} from '../../hooks/useProblemas';
import './seccionProblemas.css';

function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return fecha;
    }
}

function TarjetaProblema({
    problema,
    onResolver,
    onEliminar,
}: {
    problema: ProblemaReportado;
    onResolver: (id: number) => void;
    onEliminar: (id: number) => void;
}) {
    const esPendiente = problema.estado === 'pendiente';

    return (
        <div className={`capProblema ${esPendiente ? '' : 'capProblema--resuelto'}`}>
            <div className="capProblema__cabecera">
                <div className="capProblema__usuario">
                    <span className="capProblema__nombre">{problema.nombre_usuario || 'Usuario eliminado'}</span>
                    <span className="capProblema__email">{problema.email_usuario || ''}</span>
                </div>
                <div className="capProblema__meta">
                    <Badge variante={esPendiente ? 'advertencia' : 'exito'} tamano="sm">
                        {esPendiente ? 'Pendiente' : 'Resuelto'}
                    </Badge>
                    <span className="capProblema__fecha">{formatearFecha(problema.created_at)}</span>
                </div>
            </div>

            <p className="capProblema__mensaje">{problema.mensaje}</p>

            {problema.resuelto_at && (
                <p className="capProblema__resueltoFecha">Resuelto: {formatearFecha(problema.resuelto_at)}</p>
            )}

            <div className="capProblema__acciones">
                {esPendiente && (
                    <Boton variante="ghost" tamano="sm" onClick={() => onResolver(problema.id)}>
                        <IconoCheck size={16} /> Marcar resuelto
                    </Boton>
                )}
                <Boton variante="ghost" tamano="sm" onClick={() => onEliminar(problema.id)}>
                    <IconoEliminar size={16} /> Eliminar
                </Boton>
            </div>
        </div>
    );
}

export function SeccionProblemas() {
    const {problemas, cargando, error, resolverProblema, eliminarProblema} = useProblemas();

    const pendientes = problemas.filter(p => p.estado === 'pendiente');
    const resueltos = problemas.filter(p => p.estado === 'resuelto');

    if (cargando) {
        return (
            <div className="capSeccionProblemas__cargando">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="capSeccionProblemas">
            <div className="capSeccionProblemas__header">
                <h2 className="capSeccionProblemas__titulo">Problemas reportados</h2>
                {pendientes.length > 0 && (
                    <Badge variante="advertencia">{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</Badge>
                )}
            </div>

            {error && <Alerta variante="error">{error}</Alerta>}

            {problemas.length === 0 && !error && (
                <Alerta variante="info">No hay problemas reportados.</Alerta>
            )}

            {pendientes.length > 0 && (
                <div className="capSeccionProblemas__grupo">
                    <h3 className="capSeccionProblemas__subtitulo">Pendientes</h3>
                    {pendientes.map(p => (
                        <TarjetaProblema key={p.id} problema={p} onResolver={resolverProblema} onEliminar={eliminarProblema} />
                    ))}
                </div>
            )}

            {resueltos.length > 0 && (
                <div className="capSeccionProblemas__grupo">
                    <h3 className="capSeccionProblemas__subtitulo">Resueltos</h3>
                    {resueltos.map(p => (
                        <TarjetaProblema key={p.id} problema={p} onResolver={resolverProblema} onEliminar={eliminarProblema} />
                    ))}
                </div>
            )}
        </div>
    );
}
