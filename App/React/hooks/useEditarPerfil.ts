/*
 * Hook: useEditarPerfil
 * Lógica de edición de perfil: carga de datos, manejo de avatar/portada,
 * submit con subida de archivos.
 * Extraído de EditarPerfilIsland para cumplir SRP (max 3 useState en componente).
 */

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { crearToast } from '@app/components/ui/Notificacion';
import { obtenerUsuarioActual, actualizarPerfil, subirAvatar } from '@app/services/apiAuth';
import { useAuthStore } from '@app/stores/authStore';
import type { Usuario, UsuarioAutenticado } from '@app/types/usuario';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('useEditarPerfil');

export const useEditarPerfil = () => {
    const [nombre, setNombre] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [portadaUrl, setPortadaUrl] = useState<string | null>(null);
    const [avatarArchivo, setAvatarArchivo] = useState<File | null>(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoInicial, setCargandoInicial] = useState(true);

    const setUsuario = useAuthStore(s => s.setUsuario);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const portadaInputRef = useRef<HTMLInputElement>(null);

    /* Cargar datos actuales del usuario con cleanup */
    useEffect(() => {
        let activo = true;

        const cargar = async () => {
            try {
                const resp = await obtenerUsuarioActual();
                if (!activo) return;
                if (resp.ok && resp.data) {
                    const u = resp.data as unknown as Record<string, unknown>;
                    setNombre((u.nombreVisible as string) ?? (u.nombreDisplay as string) ?? '');
                    setUsername((u.username as string) ?? '');
                    setBio((u.bio as string) ?? '');
                    setAvatarUrl((u.avatarUrl as string) ?? null);
                    setPortadaUrl((u.portadaUrl as string) ?? null);
                }
            } catch (err) {
                if (activo) log.error('Error cargando usuario', err);
            } finally {
                if (activo) setCargandoInicial(false);
            }
        };

        cargar();
        return () => { activo = false; };
    }, []);

    const manejarSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);

        try {
            if (avatarArchivo) {
                const respAvatar = await subirAvatar(avatarArchivo);
                if (respAvatar.ok && respAvatar.data) {
                    const datos = (respAvatar.data as Record<string, unknown>).data ?? respAvatar.data;
                    setUsuario(datos as UsuarioAutenticado);
                    setAvatarArchivo(null);
                    log.info('Avatar subido correctamente');
                } else {
                    crearToast('error', 'Error al subir avatar');
                }
            }

            const resp = await actualizarPerfil({
                nombreVisible: nombre,
                username,
                bio,
            } as Partial<Usuario>);

            if (resp.ok) {
                if (resp.data) setUsuario(resp.data as unknown as UsuarioAutenticado);
                crearToast('exito', 'Perfil actualizado correctamente');
            } else {
                crearToast('error', resp.error ?? 'Error al actualizar');
            }
        } catch (err) {
            log.error('Error actualizando perfil', err);
            crearToast('error', 'Error de conexión');
        } finally {
            setCargando(false);
        }
    };

    const manejarCambioAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            const url = URL.createObjectURL(archivo);
            setAvatarUrl(url);
            setAvatarArchivo(archivo);
        }
    };

    const manejarCambioPortada = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            setPortadaUrl(URL.createObjectURL(archivo));
        }
    };

    return {
        nombre, setNombre,
        username, setUsername,
        bio, setBio,
        avatarUrl, portadaUrl,
        cargando, cargandoInicial,
        avatarInputRef, portadaInputRef,
        manejarSubmit, manejarCambioAvatar, manejarCambioPortada,
    };
};
