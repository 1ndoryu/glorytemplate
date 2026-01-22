/*
 * Datos mock de usuarios del panel.
 * Admin (ID 1) es el proveedor de servicios.
 * Guillermo es el cliente de prueba.
 */

import {UsuarioPanel} from '../types/usuario';

/* Usuario Admin - Proveedor de servicios (WP User ID 1) */
export const usuarioAdmin: UsuarioPanel = {
    id: 'USR-001',
    wpUserId: 1,
    nombre: 'Nakomi Agency',
    email: 'admin@nakomi.dev',
    avatar: 'N',
    rol: 'admin',
    fechaRegistro: '2024-01-01'
};

/* Usuario Cliente - Guillermo */
export const usuarioGuillermo: UsuarioPanel = {
    id: 'USR-002',
    wpUserId: 2,
    nombre: 'Guillermo',
    email: 'guillermo@example.com',
    avatar: 'G',
    rol: 'cliente',
    fechaRegistro: '2025-11-01'
};

/* Lista de todos los usuarios */
export const usuariosMock: UsuarioPanel[] = [usuarioAdmin, usuarioGuillermo];

/* Helper para obtener usuario por ID de WordPress */
export const obtenerUsuarioPorWpId = (wpUserId: number): UsuarioPanel | undefined => {
    return usuariosMock.find(u => u.wpUserId === wpUserId);
};

/* Helper para obtener usuario por ID interno */
export const obtenerUsuarioPorId = (id: string): UsuarioPanel | undefined => {
    return usuariosMock.find(u => u.id === id);
};
