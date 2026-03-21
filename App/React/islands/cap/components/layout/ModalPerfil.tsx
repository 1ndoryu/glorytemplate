/**
 * ModalPerfil
 *
 * [2003A-12] Modal para editar nombre, email y contraseña del usuario actual.
 * Se abre desde el sidebar del dashboard.
 */

import {useEffect} from 'react';
import {Modal, Input, Boton, Alerta} from '../ui';
import {usePerfil} from '../../hooks/usePerfil';
import './modalPerfil.css';

interface ModalPerfilProps {
    abierto: boolean;
    onCerrar: () => void;
    userName: string;
    userEmail: string;
}

export function ModalPerfil({abierto, onCerrar, userName, userEmail}: ModalPerfilProps) {
    const {datos, guardando, error, exito, setDatos, guardar, limpiarMensajes} = usePerfil(userName, userEmail);

    /* Limpiar mensajes al cerrar/abrir */
    useEffect(() => {
        if (abierto) {
            limpiarMensajes();
        }
    }, [abierto, limpiarMensajes]);

    const handleGuardar = async () => {
        const ok = await guardar();
        if (ok) {
            setTimeout(() => {
                onCerrar();
                /* Recargar para actualizar nombre visible en sidebar */
                window.location.reload();
            }, 1200);
        }
    };

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Mi Perfil" subtitulo="Actualiza tus datos personales" tamano="sm">
            <div className="capModalPerfil">
                {error && <Alerta variante="error" className="capMb--md">{error}</Alerta>}
                {exito && <Alerta variante="exito" className="capMb--md">{exito}</Alerta>}

                <div className="capModalPerfil__campos">
                    <Input
                        etiqueta="Nombre"
                        tipo="text"
                        value={datos.nombre}
                        onChange={e => setDatos({nombre: e.target.value})}
                        disabled={guardando}
                    />

                    <Input
                        etiqueta="Email"
                        tipo="email"
                        value={datos.email}
                        onChange={e => setDatos({email: e.target.value})}
                        disabled={guardando}
                    />

                    <hr className="capModalPerfil__separador" />

                    <p className="capTexto capTexto--sm capTexto--secundario">
                        Deja los campos de contraseña vacíos si no deseas cambiarla.
                    </p>

                    <Input
                        etiqueta="Contraseña actual"
                        tipo="password"
                        value={datos.contrasenaActual}
                        onChange={e => setDatos({contrasenaActual: e.target.value})}
                        disabled={guardando}
                    />

                    <Input
                        etiqueta="Nueva contraseña"
                        tipo="password"
                        value={datos.contrasenaNueva}
                        onChange={e => setDatos({contrasenaNueva: e.target.value})}
                        disabled={guardando}
                    />

                    <Input
                        etiqueta="Confirmar contraseña"
                        tipo="password"
                        value={datos.confirmarContrasena}
                        onChange={e => setDatos({confirmarContrasena: e.target.value})}
                        disabled={guardando}
                    />
                </div>

                <div className="capModalPerfil__acciones">
                    <Boton variante="ghost" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </Boton>
                    <Boton variante="primario" onClick={handleGuardar} cargando={guardando}>
                        Guardar cambios
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

export default ModalPerfil;
