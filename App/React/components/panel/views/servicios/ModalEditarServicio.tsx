/*
 * ModalEditarServicio: Modal para crear/editar servicios publicados.
 * Permite modificar todos los campos del servicio.
 *
 * Usa createPortal hacia #modal-root (definido en PanelCliente.tsx) para
 * renderizar fuera del panelLayout y evitar el overflow:hidden del layout.
 */

import React, {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';
import {X, Package, DollarSign, Clock, Tag, Image, FileText, Save} from 'lucide-react';
import {Boton} from '../../../ui/Boton';
import {ServicioPublicado, CategoriaServicio} from '../../../../data/types/servicio';

interface ModalEditarServicioProps {
    servicio: ServicioPublicado | null;
    visible: boolean;
    onCerrar: () => void;
    onGuardar: (servicio: ServicioPublicado) => void;
    modoCrear?: boolean;
}

/* Categorías disponibles para servicios */
const CATEGORIAS: {valor: CategoriaServicio; etiqueta: string}[] = [
    {valor: 'web', etiqueta: 'Web'},
    {valor: 'desarrollo', etiqueta: 'Desarrollo'},
    {valor: 'diseno', etiqueta: 'Diseño'},
    {valor: 'marketing', etiqueta: 'Marketing'},
    {valor: 'consultoria', etiqueta: 'Consultoría'}
];

/* Estado inicial para nuevo servicio */
const servicioVacio: ServicioPublicado = {
    id: '',
    proveedorId: '',
    nombre: '',
    descripcion: '',
    precio: 0,
    imagenUrl: '',
    categoria: 'web',
    tiempoEntregaDias: 7,
    activo: true,
    fechaCreacion: new Date().toISOString().split('T')[0]
};

export const ModalEditarServicio: React.FC<ModalEditarServicioProps> = ({servicio, visible, onCerrar, onGuardar, modoCrear = false}) => {
    const [formData, setFormData] = useState<ServicioPublicado>(servicioVacio);
    const [errores, setErrores] = useState<Record<string, string>>({});

    /* Cargar datos del servicio cuando se abre el modal */
    useEffect(() => {
        if (visible) {
            if (servicio && !modoCrear) {
                setFormData(servicio);
            } else {
                setFormData({
                    ...servicioVacio,
                    id: `SRVPUB-${Date.now()}`,
                    proveedorId: 'USR-001'
                });
            }
            setErrores({});
        }
    }, [servicio, visible, modoCrear]);

    if (!visible) return null;

    const handleChange = (campo: keyof ServicioPublicado, valor: string | number | boolean) => {
        setFormData(prev => ({...prev, [campo]: valor}));
        /* Limpiar error del campo al modificarlo */
        if (errores[campo]) {
            setErrores(prev => {
                const nuevos = {...prev};
                delete nuevos[campo];
                return nuevos;
            });
        }
    };

    const validarFormulario = (): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        }

        if (!formData.descripcion.trim()) {
            nuevosErrores.descripcion = 'La descripción es obligatoria';
        }

        if (formData.precio <= 0) {
            nuevosErrores.precio = 'El precio debe ser mayor a 0';
        }

        if (formData.tiempoEntregaDias <= 0) {
            nuevosErrores.tiempoEntregaDias = 'El tiempo de entrega debe ser mayor a 0';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validarFormulario()) {
            onGuardar(formData);
        }
    };

    const titulo = modoCrear ? 'Nuevo Servicio' : 'Editar Servicio';

    /*
     * Renderiza en #modal-root (fuera de panelLayout) para evitar overflow:hidden.
     * Si #modal-root no existe, usa document.body como fallback.
     */
    const modalRoot = document.getElementById('modal-root') || document.body;

    return createPortal(
        <div className="modalOverlay" onClick={onCerrar}>
            <div className="modalVentana modalEditarServicio" onClick={e => e.stopPropagation()}>
                <header className="modalHeader">
                    <div className="modalTituloWrapper">
                        <Package size={20} />
                        <h2 className="modalTitulo">{titulo}</h2>
                    </div>
                    <button className="modalCerrar" onClick={onCerrar} type="button">
                        <X size={18} />
                    </button>
                </header>

                <form className="modalContenido" onSubmit={handleSubmit}>
                    {/* Nombre del servicio */}
                    <div className="campoFormulario">
                        <label className="campoLabel" htmlFor="servicio-nombre">
                            <FileText size={14} />
                            Nombre del servicio
                        </label>
                        <input id="servicio-nombre" type="text" className={`campoInput ${errores.nombre ? 'campoError' : ''}`} value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Ej: Diseño Web Profesional" />
                        {errores.nombre && <span className="campoMensajeError">{errores.nombre}</span>}
                    </div>

                    {/* Descripción */}
                    <div className="campoFormulario">
                        <label className="campoLabel" htmlFor="servicio-descripcion">
                            <FileText size={14} />
                            Descripción
                        </label>
                        <textarea id="servicio-descripcion" className={`campoInput campoTextarea ${errores.descripcion ? 'campoError' : ''}`} value={formData.descripcion} onChange={e => handleChange('descripcion', e.target.value)} placeholder="Describe qué incluye este servicio..." rows={3} />
                        {errores.descripcion && <span className="campoMensajeError">{errores.descripcion}</span>}
                    </div>

                    {/* Fila: Precio y Tiempo de entrega */}
                    <div className="filaCampos">
                        <div className="campoFormulario">
                            <label className="campoLabel" htmlFor="servicio-precio">
                                <DollarSign size={14} />
                                Precio ($)
                            </label>
                            <input id="servicio-precio" type="number" min="0" step="1" className={`campoInput ${errores.precio ? 'campoError' : ''}`} value={formData.precio} onChange={e => handleChange('precio', parseFloat(e.target.value) || 0)} />
                            {errores.precio && <span className="campoMensajeError">{errores.precio}</span>}
                        </div>

                        <div className="campoFormulario">
                            <label className="campoLabel" htmlFor="servicio-tiempo">
                                <Clock size={14} />
                                Tiempo de entrega (días)
                            </label>
                            <input id="servicio-tiempo" type="number" min="1" className={`campoInput ${errores.tiempoEntregaDias ? 'campoError' : ''}`} value={formData.tiempoEntregaDias} onChange={e => handleChange('tiempoEntregaDias', parseInt(e.target.value) || 1)} />
                            {errores.tiempoEntregaDias && <span className="campoMensajeError">{errores.tiempoEntregaDias}</span>}
                        </div>
                    </div>

                    {/* Categoría */}
                    <div className="campoFormulario">
                        <label className="campoLabel" htmlFor="servicio-categoria">
                            <Tag size={14} />
                            Categoría
                        </label>
                        <select id="servicio-categoria" className="campoInput campoSelect" value={formData.categoria} onChange={e => handleChange('categoria', e.target.value as CategoriaServicio)}>
                            {CATEGORIAS.map(cat => (
                                <option key={cat.valor} value={cat.valor}>
                                    {cat.etiqueta}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* URL de imagen */}
                    <div className="campoFormulario">
                        <label className="campoLabel" htmlFor="servicio-imagen">
                            <Image size={14} />
                            URL de imagen (opcional)
                        </label>
                        <input id="servicio-imagen" type="text" className="campoInput" value={formData.imagenUrl} onChange={e => handleChange('imagenUrl', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" />
                        {formData.imagenUrl && (
                            <div className="previsualizacionImagen">
                                <img
                                    src={formData.imagenUrl}
                                    alt="Previsualización"
                                    onError={e => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Toggle Activo */}
                    <div className="campoFormulario campoToggle">
                        <label className="toggleLabel">
                            <input type="checkbox" checked={formData.activo} onChange={e => handleChange('activo', e.target.checked)} />
                            <span className="toggleSwitch" />
                            <span className="toggleTexto">{formData.activo ? 'Servicio activo' : 'Servicio inactivo'}</span>
                        </label>
                        <span className="campoAyuda">Los servicios inactivos no aparecen en el catálogo público.</span>
                    </div>
                </form>

                <footer className="modalFooter">
                    <Boton variante="ghost" onClick={onCerrar}>
                        Cancelar
                    </Boton>
                    <Boton variante="acento" icono={<Save size={16} />} onClick={handleSubmit}>
                        {modoCrear ? 'Crear Servicio' : 'Guardar Cambios'}
                    </Boton>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default ModalEditarServicio;
