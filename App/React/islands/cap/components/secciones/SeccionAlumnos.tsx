/**
 * SeccionAlumnos
 *
 * Vista de gestión de alumnos del módulo CAP.
 * Implementa tabla con CRUD, búsqueda, ordenación, paginación, matriz de disponibilidad
 * y descarga individual de plan de formación.
 *
 * Las horas de disponibilidad se adaptan al horario configurado de la autoescuela.
 */

import {Boton, Alerta, Modal} from '../ui';
import {TablaAlumnos, FormularioAlumno, MatrizDisponibilidad, ModalProgresoAlumno} from '../alumnos';
import {IconoUsuarioMas} from '../icons';
import {useSeccionAlumnos} from '../../hooks/useSeccionAlumnos';

export function SeccionAlumnos() {
    const {
        alumnos, total, cargando, guardando, eliminando, error, exito, filtros, cambiarFiltros,
        rangoHoras,
        modalVisible, alumnoEditar,
        modalDisponibilidadVisible, alumnoDisponibilidad,
        modalProgresoVisible, alumnoProgreso,
        descargandoAlumno,
        handleNuevoAlumno, handleEditar, handleEliminar, handleGuardar, handleCerrarModal,
        handleAbrirDisponibilidad, handleCerrarDisponibilidad,
        handleVerProgreso, handleCerrarProgreso,
        handleDescargarPlan,
    } = useSeccionAlumnos();

    return (
        <div className="capSeccion capAnimFadeIn">
            {/* Header con título y botón de crear */}
            <div className="capSeccionAlumnos__header">
                <div>
                    <h2 className="capTitulo capTitulo--lg">Alumnos</h2>
                    <p className="capTexto capTexto--secundario">{total > 0 ? `${total} alumno${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los alumnos de tu autoescuela'}</p>
                </div>
                <div className="capSeccionAlumnos__acciones">
                    <Boton variante="primario" onClick={handleNuevoAlumno}>
                        <IconoUsuarioMas />
                        Nuevo Alumno
                    </Boton>
                </div>
            </div>

            {/* Mensajes de feedback */}
            {error && (
                <Alerta variante="error" className="capMt--md capAnimSlideUp">
                    {error}
                </Alerta>
            )}
            {exito && (
                <Alerta variante="exito" className="capMt--md capAnimSlideUp">
                    {exito}
                </Alerta>
            )}

            {/* Tabla de alumnos */}
            <div className="capMt--lg">
                <TablaAlumnos alumnos={alumnos} total={total} cargando={cargando} eliminando={eliminando} filtros={filtros} onCambiarFiltros={cambiarFiltros} onEditar={handleEditar} onEliminar={handleEliminar} onDisponibilidad={handleAbrirDisponibilidad} onVerProgreso={handleVerProgreso} onDescargarPlan={handleDescargarPlan} descargando={descargandoAlumno} />
            </div>

            {/* Modal de creación/edición */}
            <FormularioAlumno visible={modalVisible} alumno={alumnoEditar} guardando={guardando} onCerrar={handleCerrarModal} onGuardar={handleGuardar} />

            {/* Modal de disponibilidad - Las horas se adaptan al horario de la autoescuela */}
            <Modal abierto={modalDisponibilidadVisible} onCerrar={handleCerrarDisponibilidad} titulo="Disponibilidad Horaria" tamano="lg">
                {alumnoDisponibilidad && <MatrizDisponibilidad alumnoId={alumnoDisponibilidad.id} alumnoNombre={alumnoDisponibilidad.nombre} onGuardadoExitoso={handleCerrarDisponibilidad} horasDisponibles={rangoHoras.horasDisponibles} />}
            </Modal>

            {/* Modal de progreso por asignatura */}
            <ModalProgresoAlumno visible={modalProgresoVisible} alumno={alumnoProgreso} onCerrar={handleCerrarProgreso} />
        </div>
    );
}

export default SeccionAlumnos;
