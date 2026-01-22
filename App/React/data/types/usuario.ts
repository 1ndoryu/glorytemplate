/*
 * Tipos para usuarios del panel.
 * Incluye tanto clientes como administradores/proveedores de servicios.
 */

export type RolUsuario = 'admin' | 'cliente' | 'proveedor';

/* Usuario del panel (datos de WordPress) */
export interface UsuarioPanel {
    id: string;
    wpUserId: number;
    nombre: string;
    email: string;
    avatar: string;
    rol: RolUsuario;
    fechaRegistro: string;
}

/* Estado del contexto de usuario */
export interface EstadoUsuario {
    usuarioActual: UsuarioPanel;
    simulandoCliente: boolean;
    clienteSimulado?: UsuarioPanel;
    esAdmin: boolean;
}
