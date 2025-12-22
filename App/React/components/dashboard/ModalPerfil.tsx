/*
 * ModalPerfil.tsx
 * Modal para editar el perfil del usuario
 */

import {useState, useEffect, useRef} from 'react';
import {Camera, Save, X} from 'lucide-react';
import {Modal} from '../shared/Modal';
import {useAuth} from '../../hooks/useAuth';
// Importamos los estilos registrandolos en index.css, pero definimos clases aqui
// Se asume que perfil.css ya esta importado globalmente

interface ModalPerfilProps {
    estaAbierto: boolean;
    onCerrar: () => void;
}

interface DatosPerfil {
    nombre: string;
    descripcion: string;
    avatarUrl: string;
    passwordActual: string;
    passwordNueva: string;
    passwordConfirmar: string;
}

export function ModalPerfil({estaAbierto, onCerrar}: ModalPerfilProps): JSX.Element {
    const {user} = useAuth();
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<{tipo: 'exito' | 'error'; texto: string} | null>(null);

    // Estado del formulario
    const [datos, setDatos] = useState<DatosPerfil>({
        nombre: user?.name || '',
        descripcion: 'Usuario del Dashboard', // TODO: Traer de backend
        avatarUrl: '', // TODO: Traer de backend
        passwordActual: '',
        passwordNueva: '',
        passwordConfirmar: ''
    });

    // Referencia para input de archivo
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* Actualizar datos cuando cambia el user */
    useEffect(() => {
        if (user && estaAbierto) {
            setDatos(prev => ({
                ...prev,
                nombre: user.name,
                descripcion: user.description || '',
                avatarUrl: user.avatarUrl || ''
            }));
        }
    }, [user, estaAbierto]);

    const handleChange = (campo: keyof DatosPerfil, valor: string) => {
        setDatos(prev => ({...prev, [campo]: valor}));
        // Limpiar mensajes al editar
        if (mensaje) setMensaje(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamano (2MB)
            if (file.size > 2 * 1024 * 1024) {
                setMensaje({tipo: 'error', texto: 'La imagen no debe superar los 2MB'});
                // Limpiar input
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Preview local
            const reader = new FileReader();
            reader.onloadend = () => {
                setDatos(prev => ({...prev, avatarUrl: reader.result as string}));
                setMensaje(null); // Limpiar mensaje de error si hubo
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        // Validaciones basicas
        if (!datos.nombre.trim()) {
            setMensaje({tipo: 'error', texto: 'El nombre es obligatorio'});
            return;
        }

        if (datos.passwordNueva) {
            if (datos.passwordNueva !== datos.passwordConfirmar) {
                setMensaje({tipo: 'error', texto: 'Las contraseñas nuevas no coinciden'});
                return;
            }
            if (!datos.passwordActual) {
                setMensaje({tipo: 'error', texto: 'Debes ingresar tu contraseña actual para cambiarla'});
                return;
            }
        }

        setCargando(true);
        setMensaje(null);

        try {
            // Obtener nonce global de WP
            const nonce = (window as any).gloryDashboard?.nonce;
            if (!nonce) {
                throw new Error('Error de autenticación: No se encontró nonce');
            }

            const payload = {
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                passwordActual: datos.passwordActual,
                passwordNueva: datos.passwordNueva,
                avatar: datos.avatarUrl // Envia data:image base64
            };

            const response = await fetch('/wp-json/glory/v1/perfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Error al actualizar perfil');
            }

            setMensaje({tipo: 'exito', texto: data.message || 'Perfil actualizado correctamente'});

            /* Recargar la página para actualizar los datos del usuario en WP */
            setTimeout(() => {
                window.location.reload();
            }, 1500);

            // Limpiar passwords
            setDatos(prev => ({
                ...prev,
                passwordActual: '',
                passwordNueva: '',
                passwordConfirmar: ''
            }));
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : 'Error desconocido al actualizar perfil';
            setMensaje({tipo: 'error', texto: msg});
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Mi Perfil">
            <div className="contenedorPerfil">
                {/* Avatar y Datos Basicos */}
                <div className="avatarContainer">
                    <div className="avatarPreview">{datos.avatarUrl ? <img src={datos.avatarUrl} alt="Avatar" /> : <span style={{fontSize: '24px'}}>{datos.nombre.charAt(0).toUpperCase()}</span>}</div>
                    <button className="botonPerfil" style={{background: 'var(--dashboard-fondoSecundario)', border: '1px solid var(--dashboard-bordePrincipal)', color: 'var(--dashboard-textoActivo)', display: 'flex', gap: '8px', alignItems: 'center'}} onClick={handleAvatarClick}>
                        <Camera size={14} />
                        Cambiar Foto
                    </button>
                    <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleFileChange} />
                </div>

                <div className="seccionPerfil">
                    <div className="tituloSeccionPerfil">Información Personal</div>

                    <div className="grupoInputPerfil">
                        <label className="labelPerfil">Nombre de Usuario</label>
                        <input type="text" className="inputPerfil" value={datos.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Tu nombre visible" />
                    </div>

                    <div className="grupoInputPerfil">
                        <label className="labelPerfil">Breve Descripción</label>
                        <textarea className="inputPerfil" value={datos.descripcion} onChange={e => handleChange('descripcion', e.target.value)} placeholder="Developer, Designer, etc." rows={2} style={{resize: 'none'}} />
                    </div>
                </div>

                <div className="seccionPerfil">
                    <div className="tituloSeccionPerfil">Seguridad</div>

                    <div className="grupoInputPerfil">
                        <label className="labelPerfil">Contraseña Actual</label>
                        <input type="password" className="inputPerfil" value={datos.passwordActual} onChange={e => handleChange('passwordActual', e.target.value)} placeholder="Necesaria para cambios sensibles" />
                    </div>

                    <div className="grupoInputPerfil">
                        <label className="labelPerfil">Nueva Contraseña</label>
                        <input type="password" className="inputPerfil" value={datos.passwordNueva} onChange={e => handleChange('passwordNueva', e.target.value)} placeholder="Dejar en blanco para mantener" />
                    </div>

                    <div className="grupoInputPerfil">
                        <label className="labelPerfil">Confirmar Nueva Contraseña</label>
                        <input type="password" className="inputPerfil" value={datos.passwordConfirmar} onChange={e => handleChange('passwordConfirmar', e.target.value)} placeholder="Repite la nueva contraseña" />
                    </div>
                </div>

                {mensaje && <div className={`mensajePerfil mensajePerfil--${mensaje.tipo}`}>{mensaje.texto}</div>}

                <div className="accionesPerfil">
                    <button className="botonPerfil botonCancelar" onClick={onCerrar} disabled={cargando}>
                        Cancelar
                    </button>
                    <button className="botonPerfil botonGuardar" onClick={handleSubmit} disabled={cargando}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {cargando ? <span className="cargandoSpinner" style={{width: '12px', height: '12px', borderWidth: '2px'}}></span> : <Save size={14} />}
                            Guardar Cambios
                        </div>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
