/**
 * FormularioAlumno
 *
 * Modal de creación/edición de alumno.
 * Incluye validación de campos.
 */

import {useState, useEffect} from 'react';
import {Modal, Input, Boton, Alerta} from '../ui';
import type {Alumno} from '../../hooks/useAlumnos';

interface FormularioAlumnoProps {
    visible: boolean;
    alumno: Alumno | null;
    guardando: boolean;
    onCerrar: () => void;
    onGuardar: (datos: Partial<Alumno>) => Promise<boolean>;
}

interface FormData {
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
}

interface Errores {
    nombre?: string;
    email?: string;
    dni?: string;
}

export function FormularioAlumno({visible, alumno, guardando, onCerrar, onGuardar}: FormularioAlumnoProps) {
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        email: '',
        telefono: '',
        dni: ''
    });
    const [errores, setErrores] = useState<Errores>({});
    const [enviado, setEnviado] = useState(false);

    const esEdicion = alumno !== null;

    /* Inicializar datos cuando se abre el modal */
    useEffect(() => {
        if (visible) {
            if (alumno) {
                setFormData({
                    nombre: alumno.nombre || '',
                    email: alumno.email || '',
                    telefono: alumno.telefono || '',
                    dni: alumno.dni || ''
                });
            } else {
                setFormData({nombre: '', email: '', telefono: '', dni: ''});
            }
            setErrores({});
            setEnviado(false);
        }
    }, [visible, alumno]);

    const handleChange = (campo: keyof FormData, valor: string) => {
        setFormData(prev => ({...prev, [campo]: valor}));
        /* Limpiar error del campo al modificar */
        if (errores[campo as keyof Errores]) {
            setErrores(prev => ({...prev, [campo]: undefined}));
        }
    };

    const validar = (): boolean => {
        const nuevosErrores: Errores = {};

        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        } else if (formData.nombre.length < 3) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nuevosErrores.email = 'Email no válido';
        }

        if (formData.dni && !/^[0-9]{8}[A-Z]$/i.test(formData.dni)) {
            nuevosErrores.dni = 'DNI no válido (formato: 12345678A)';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviado(true);

        if (!validar()) return;

        const exito = await onGuardar({
            nombre: formData.nombre.trim(),
            email: formData.email.trim() || undefined,
            telefono: formData.telefono.trim() || undefined,
            dni: formData.dni.trim().toUpperCase() || undefined
        });

        if (exito) {
            onCerrar();
        }
    };

    return (
        <Modal visible={visible} titulo={esEdicion ? 'Editar Alumno' : 'Nuevo Alumno'} onCerrar={onCerrar} ancho="md">
            <form onSubmit={handleSubmit} className="capFormAlumno">
                <Input etiqueta="Nombre completo" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Juan García López" error={enviado ? errores.nombre : undefined} required autoFocus />

                <div className="capGrid capGrid--2cols capGap--md">
                    <Input etiqueta="Email" tipo="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="alumno@email.com" error={enviado ? errores.email : undefined} />

                    <Input etiqueta="Teléfono" tipo="tel" value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="600 123 456" />
                </div>

                <Input etiqueta="DNI" value={formData.dni} onChange={e => handleChange('dni', e.target.value)} placeholder="12345678A" error={enviado ? errores.dni : undefined} ayuda="Formato: 8 números + letra" />

                <div className="capFormAlumno__acciones">
                    <Boton type="button" variante="secundario" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </Boton>
                    <Boton type="submit" variante="primario" cargando={guardando}>
                        {esEdicion ? 'Guardar Cambios' : 'Crear Alumno'}
                    </Boton>
                </div>
            </form>
        </Modal>
    );
}

export default FormularioAlumno;
