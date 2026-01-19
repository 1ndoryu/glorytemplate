/**
 * SeccionAlumnos
 *
 * Vista de gestión de alumnos del módulo CAP.
 * Implementa tabla con CRUD, búsqueda, ordenación, paginación y matriz de disponibilidad.
 */

import {useState} from 'react';
import {Boton, Alerta, Modal} from '../ui';
import {TablaAlumnos, FormularioAlumno, MatrizDisponibilidad, ModalProgresoAlumno} from '../alumnos';
import {IconoUsuarioMas} from '../icons';
import {useAlumnos, type Alumno} from '../../hooks/useAlumnos';

export function SeccionAlumnos() {
    const {alumnos, total, cargando, guardando, eliminando, error, exito, filtros, crearAlumno, actualizarAlumno, eliminarAlumno, cambiarFiltros, limpiarMensajes} = useAlumnos();

    const [modalVisible, setModalVisible] = useState(false);
    const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null);
    const [confirmandoEliminar, setConfirmandoEliminar] = useState<number | null>(null);

    /* Estado para modal de disponibilidad */
    const [modalDisponibilidadVisible, setModalDisponibilidadVisible] = useState(false);
    const [alumnoDisponibilidad, setAlumnoDisponibilidad] = useState<Alumno | null>(null);

    /* Estado para modal de progreso por asignatura */
    const [modalProgresoVisible, setModalProgresoVisible] = useState(false);
    const [alumnoProgreso, setAlumnoProgreso] = useState<Alumno | null>(null);

    /* Limpiar mensajes después de 4 segundos */
    if (exito || error) {
        setTimeout(limpiarMensajes, 4000);
    }

    const handleNuevoAlumno = () => {
        setAlumnoEditar(null);
        setModalVisible(true);
    };

    const handleEditar = (alumno: Alumno) => {
        setAlumnoEditar(alumno);
        setModalVisible(true);
    };

    const handleEliminar = async (id: number) => {
        /* Primera llamada: mostrar confirmación */
        if (confirmandoEliminar !== id) {
            setConfirmandoEliminar(id);
            /* Auto-limpiar confirmación después de 3 segundos */
            setTimeout(() => setConfirmandoEliminar(null), 3000);
            return;
        }
        /* Segunda llamada: ejecutar eliminación */
        setConfirmandoEliminar(null);
        await eliminarAlumno(id);
    };

    const handleGuardar = async (datos: Partial<Alumno>): Promise<boolean> => {
        if (alumnoEditar) {
            return await actualizarAlumno(alumnoEditar.id, datos);
        }
        return await crearAlumno(datos);
    };

    const handleCerrarModal = () => {
        setModalVisible(false);
        setAlumnoEditar(null);
    };

    /* Handlers para disponibilidad */
    const handleAbrirDisponibilidad = (alumno: Alumno) => {
        setAlumnoDisponibilidad(alumno);
        setModalDisponibilidadVisible(true);
    };

    const handleCerrarDisponibilidad = () => {
        setModalDisponibilidadVisible(false);
        setAlumnoDisponibilidad(null);
    };

    /* Handlers para modal de progreso */
    const handleVerProgreso = (alumno: Alumno) => {
        setAlumnoProgreso(alumno);
        setModalProgresoVisible(true);
    };

    const handleCerrarProgreso = () => {
        setModalProgresoVisible(false);
        setAlumnoProgreso(null);
    };

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
                <TablaAlumnos alumnos={alumnos} total={total} cargando={cargando} eliminando={eliminando} filtros={filtros} onCambiarFiltros={cambiarFiltros} onEditar={handleEditar} onEliminar={handleEliminar} onDisponibilidad={handleAbrirDisponibilidad} onVerProgreso={handleVerProgreso} />
            </div>

            {/* Modal de creación/edición */}
            <FormularioAlumno visible={modalVisible} alumno={alumnoEditar} guardando={guardando} onCerrar={handleCerrarModal} onGuardar={handleGuardar} />

            {/* Modal de disponibilidad */}
            <Modal abierto={modalDisponibilidadVisible} onCerrar={handleCerrarDisponibilidad} titulo="Disponibilidad Horaria" tamano="lg">
                {alumnoDisponibilidad && <MatrizDisponibilidad alumnoId={alumnoDisponibilidad.id} alumnoNombre={alumnoDisponibilidad.nombre} onGuardadoExitoso={handleCerrarDisponibilidad} />}
            </Modal>

            {/* Modal de progreso por asignatura */}
            <ModalProgresoAlumno visible={modalProgresoVisible} alumno={alumnoProgreso} onCerrar={handleCerrarProgreso} />
        </div>
    );
}

export default SeccionAlumnos;
