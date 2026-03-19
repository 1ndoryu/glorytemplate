/*
 * Hook: useModalConfiguracion — Kamples
 * Lógica extraída de ModalConfiguracion (SRP).
 * Estado de perfil, cuenta, tema, avatar, portada, y guardado.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { actualizarPerfil, subirAvatar, subirPortada, cambiarEmail, cambiarPassword } from '@app/services/apiAuth';
import { crearLogger } from '@app/services/logger';
import { crearToast } from '@app/components/ui/Notificacion';
import type { UsuarioAutenticado } from '@app/types';
import { aplicarTemaApp, guardarTemaApp, obtenerTemaAppActual, type TemaApp } from '@app/services/tema';

const log = crearLogger('ModalConfiguracion');

export type SeccionConfig = 'perfil' | 'cuenta' | 'notificaciones' | 'apariencia' | 'bloqueos' | 'legal' | 'admin';

export function useModalConfiguracion() {
    const abierto = useConfiguracionModalStore(s => s.abierto);
    const cerrar = useConfiguracionModalStore(s => s.cerrar);
    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const setUsuario = useAuthStore(s => s.setUsuario);

    const [seccionActiva, setSeccionActiva] = useState<SeccionConfig>('perfil');
    /* QL51: En móvil, controla si mostramos la nav o el contenido de la sección */
    const [movilEnMenu, setMovilEnMenu] = useState(true);
    const [nombreVisible, setNombreVisible] = useState(usuario?.nombreVisible ?? '');
    const [username, setUsername] = useState(usuario?.username ?? '');
    const [bio, setBio] = useState('');
    const [sitioWeb, setSitioWeb] = useState('');
    const [notificaciones, setNotificaciones] = useState(true);
    const [temaSeleccionado, setTemaSeleccionado] = useState<TemaApp>('dark');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarArchivo, setAvatarArchivo] = useState<File | null>(null);
    const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
    const [portadaArchivo, setPortadaArchivo] = useState<File | null>(null);
    const [guardando, setGuardando] = useState(false);
    const inputFotoRef = useRef<HTMLInputElement>(null);
    const inputPortadaRef = useRef<HTMLInputElement>(null);

    /* QK89: Estados para cambio de email */
    const [nuevoEmail, setNuevoEmail] = useState('');
    const [emailPasswordActual, setEmailPasswordActual] = useState('');
    const [cambiandoEmail, setCambiandoEmail] = useState(false);
    const [emailEditando, setEmailEditando] = useState(false);

    /* QK89: Estados para cambio de contraseña */
    const [passwordActual, setPasswordActual] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [cambiandoPassword, setCambiandoPassword] = useState(false);
    const [passwordEditando, setPasswordEditando] = useState(false);
    /* [183A-96] PayPal email para retiros */
    const [paypalEmail, setPaypalEmail] = useState(usuario?.paypalEmail ?? '');
    const [guardandoPaypal, setGuardandoPaypal] = useState(false);

    /* Sincronizar campos cuando el modal se abre o los datos del usuario cambian */
    useEffect(() => {
        if (abierto && usuario) {
            setNombreVisible(usuario.nombreVisible ?? '');
            setUsername(usuario.username ?? '');
            setBio(usuario.bio ?? '');
            setSitioWeb(usuario.sitioWeb ?? '');
            setTemaSeleccionado(obtenerTemaAppActual());
            setAvatarPreview(null);
            setAvatarArchivo(null);
            setPortadaPreview(null);
            setPortadaArchivo(null);
            setSeccionActiva('perfil');
            setMovilEnMenu(true);
            /* QK89: Reset estados email/password */
            setNuevoEmail('');
            setEmailPasswordActual('');
            setEmailEditando(false);
            setPasswordActual('');
            setNuevaPassword('');
            setConfirmarPassword('');
            setPasswordEditando(false);
            setPaypalEmail(usuario.paypalEmail ?? '');
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
        setPortadaArchivo(archivo);
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

            /* QQ95: Subir portada al servidor (antes solo se guardaba blob local) */
            if (portadaArchivo) {
                const respPortada = await subirPortada(portadaArchivo);
                if (respPortada.ok && respPortada.data) {
                    const datos = (respPortada.data as Record<string, unknown>).data ?? respPortada.data;
                    setUsuario(datos as UsuarioAutenticado);
                    log.info('Portada subida correctamente');
                }
            }

            const resp = await actualizarPerfil({
                nombreVisible,
                username,
                bio,
                sitioWeb: sitioWeb || null,
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
    }, [guardando, usuario, nombreVisible, username, bio, sitioWeb, avatarArchivo, portadaArchivo, setUsuario, cerrar]);

    /* QK89: Cambiar email con verificación de contraseña */
    const manejarCambiarEmail = useCallback(async () => {
        if (cambiandoEmail || !nuevoEmail.trim() || !emailPasswordActual) return;
        setCambiandoEmail(true);

        try {
            const resp = await cambiarEmail(nuevoEmail.trim(), emailPasswordActual);
            if (resp.ok && resp.data) {
                setUsuario(resp.data as UsuarioAutenticado);
                crearToast('exito', 'Email actualizado correctamente');
                setEmailEditando(false);
                setNuevoEmail('');
                setEmailPasswordActual('');
            } else {
                crearToast('error', resp.error ?? 'Error al cambiar el email');
            }
        } catch (err) {
            log.error('Error al cambiar email', err);
            crearToast('error', 'Error de conexión');
        }

        setCambiandoEmail(false);
    }, [cambiandoEmail, nuevoEmail, emailPasswordActual, setUsuario]);

    /* QK89: Cambiar contraseña */
    const manejarCambiarPassword = useCallback(async () => {
        if (cambiandoPassword || !passwordActual || !nuevaPassword || !confirmarPassword) return;

        if (nuevaPassword !== confirmarPassword) {
            crearToast('error', 'Las contraseñas no coinciden');
            return;
        }
        if (nuevaPassword.length < 6) {
            crearToast('error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setCambiandoPassword(true);

        try {
            const resp = await cambiarPassword(passwordActual, nuevaPassword, confirmarPassword);
            if (resp.ok) {
                crearToast('exito', 'Contraseña actualizada correctamente');
                setPasswordEditando(false);
                setPasswordActual('');
                setNuevaPassword('');
                setConfirmarPassword('');
            } else {
                crearToast('error', resp.error ?? 'Error al cambiar la contraseña');
            }
        } catch (err) {
            log.error('Error al cambiar contraseña', err);
            crearToast('error', 'Error de conexión');
        }

        setCambiandoPassword(false);
    }, [cambiandoPassword, passwordActual, nuevaPassword, confirmarPassword]);

    /* [183A-96] Guardar PayPal email */
    const manejarGuardarPaypal = useCallback(async () => {
        if (guardandoPaypal) return;
        setGuardandoPaypal(true);
        try {
            const resp = await actualizarPerfil({ paypalEmail: paypalEmail.trim() || null });
            if (resp.ok && resp.data) {
                setUsuario(resp.data as UsuarioAutenticado);
                crearToast('exito', 'Email de PayPal guardado');
            } else {
                crearToast('error', resp.error ?? 'Error al guardar');
            }
        } catch {
            crearToast('error', 'Error de conexión');
        }
        setGuardandoPaypal(false);
    }, [guardandoPaypal, paypalEmail, setUsuario]);

    const manejarCerrar = useCallback(() => {
        if (guardando) return;
        cerrar();
        setAvatarPreview(null);
        setPortadaPreview(null);
        setPortadaArchivo(null);
    }, [cerrar, guardando]);

    const avatarActual = avatarPreview || usuario?.avatarUrl || null;

    /* QL51: Seleccionar sección en móvil — navega al contenido */
    const seleccionarSeccionMovil = useCallback((seccion: SeccionConfig) => {
        setSeccionActiva(seccion);
        setMovilEnMenu(false);
    }, []);

    const volverAlMenuMovil = useCallback(() => {
        setMovilEnMenu(true);
    }, []);

    return {
        abierto, autenticado, usuario,
        seccionActiva, setSeccionActiva,
        movilEnMenu, seleccionarSeccionMovil, volverAlMenuMovil,
        nombreVisible, setNombreVisible,
        username, setUsername,
        bio, setBio,
        sitioWeb, setSitioWeb,
        notificaciones, setNotificaciones,
        temaSeleccionado,
        avatarActual,
        portadaPreview,
        guardando,
        inputFotoRef, inputPortadaRef,
        manejarCambioTema, manejarCambioFoto, manejarCambioPortada,
        manejarGuardar, manejarCerrar,
        /* QK89: Email */
        nuevoEmail, setNuevoEmail,
        emailPasswordActual, setEmailPasswordActual,
        cambiandoEmail, emailEditando, setEmailEditando,
        manejarCambiarEmail,
        /* QK89: Password */
        passwordActual, setPasswordActual,
        nuevaPassword, setNuevaPassword,
        confirmarPassword, setConfirmarPassword,
        cambiandoPassword, passwordEditando, setPasswordEditando,
        manejarCambiarPassword,
        /* [183A-96] PayPal */
        paypalEmail, setPaypalEmail, guardandoPaypal, manejarGuardarPaypal,
    };
}
