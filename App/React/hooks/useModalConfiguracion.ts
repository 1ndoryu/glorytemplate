/*
 * Hook: useModalConfiguracion — Kamples
 * Lógica extraída de ModalConfiguracion (SRP).
 * Estado de perfil, cuenta, tema, avatar, portada, y guardado.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { actualizarPerfil, subirAvatar } from '@app/services/apiAuth';
import { crearLogger } from '@app/services/logger';
import type { UsuarioAutenticado } from '@app/types';
import { aplicarTemaApp, guardarTemaApp, obtenerTemaAppActual, type TemaApp } from '@app/services/tema';

const log = crearLogger('ModalConfiguracion');

export type SeccionConfig = 'perfil' | 'cuenta' | 'notificaciones' | 'apariencia' | 'bloqueos';

export function useModalConfiguracion() {
    const abierto = useConfiguracionModalStore(s => s.abierto);
    const cerrar = useConfiguracionModalStore(s => s.cerrar);
    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const setUsuario = useAuthStore(s => s.setUsuario);

    const [seccionActiva, setSeccionActiva] = useState<SeccionConfig>('perfil');
    const [nombreVisible, setNombreVisible] = useState(usuario?.nombreVisible ?? '');
    const [username, setUsername] = useState(usuario?.username ?? '');
    const [bio, setBio] = useState('');
    const [notificaciones, setNotificaciones] = useState(true);
    const [temaSeleccionado, setTemaSeleccionado] = useState<TemaApp>('dark');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarArchivo, setAvatarArchivo] = useState<File | null>(null);
    const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const inputFotoRef = useRef<HTMLInputElement>(null);
    const inputPortadaRef = useRef<HTMLInputElement>(null);

    /* Sincronizar campos cuando el modal se abre o los datos del usuario cambian */
    useEffect(() => {
        if (abierto && usuario) {
            setNombreVisible(usuario.nombreVisible ?? '');
            setUsername(usuario.username ?? '');
            setTemaSeleccionado(obtenerTemaAppActual());
            setAvatarPreview(null);
            setAvatarArchivo(null);
            setPortadaPreview(null);
            setSeccionActiva('perfil');
        }
    }, [abierto, usuario]);

    const manejarCambioTema = useCallback((tema: TemaApp) => {
        setTemaSeleccionado(tema);
        aplicarTemaApp(tema);
        guardarTemaApp(tema);
        log.info('Tema actualizado', { tema });
    }, []);

    const manejarCambioFoto = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const url = URL.createObjectURL(archivo);
        setAvatarPreview(url);
        setAvatarArchivo(archivo);
    }, []);

    const manejarCambioPortada = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const url = URL.createObjectURL(archivo);
        setPortadaPreview(url);
    }, []);

    const manejarGuardar = useCallback(async () => {
        if (guardando || !usuario) return;
        setGuardando(true);

        try {
            if (avatarArchivo) {
                const respAvatar = await subirAvatar(avatarArchivo);
                if (respAvatar.ok && respAvatar.data) {
                    const datos = (respAvatar.data as Record<string, unknown>).data ?? respAvatar.data;
                    setUsuario(datos as UsuarioAutenticado);
                    log.info('Avatar subido correctamente');
                }
            }

            const resp = await actualizarPerfil({
                nombreVisible,
                username,
                bio,
            });

            if (resp.ok && resp.data) {
                setUsuario(resp.data as UsuarioAutenticado);
            }

            log.info('Configuración guardada', { nombreVisible, username });
        } catch (err) {
            log.error('Error al guardar configuración', err);
        }

        setGuardando(false);
        cerrar();
    }, [guardando, usuario, nombreVisible, username, bio, avatarArchivo, setUsuario, cerrar]);

    const manejarCerrar = useCallback(() => {
        if (guardando) return;
        cerrar();
        setAvatarPreview(null);
        setPortadaPreview(null);
    }, [cerrar, guardando]);

    const avatarActual = avatarPreview || usuario?.avatarUrl || null;

    return {
        abierto, autenticado, usuario,
        seccionActiva, setSeccionActiva,
        nombreVisible, setNombreVisible,
        username, setUsername,
        bio, setBio,
        notificaciones, setNotificaciones,
        temaSeleccionado,
        avatarActual,
        portadaPreview,
        guardando,
        inputFotoRef, inputPortadaRef,
        manejarCambioTema, manejarCambioFoto, manejarCambioPortada,
        manejarGuardar, manejarCerrar,
    };
}
