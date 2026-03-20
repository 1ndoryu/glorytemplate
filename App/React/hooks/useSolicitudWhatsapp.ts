/*
 * Hook: useSolicitudWhatsapp — Kamples (QQ63)
 * Lógica del modal de solicitud de ingreso al grupo de WhatsApp.
 * Reutiliza endpoint /reportar con tipo solicitud_whatsapp.
 * Campos: nombre, telefono, pais, motivo, descripcion.
 * Restricciones: 1 solicitud por usuario, 6 solicitudes diarias globales.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSolicitudWhatsappStore } from '@app/stores/solicitudWhatsappStore';
import { apiGet, apiPost } from '@app/services/apiCliente';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

const URL_GRUPO_WA = 'https://chat.whatsapp.com/JOduGKvWGR9KbYfBS9BWGL';

interface EstadoDisponibilidad {
    disponible: boolean;
    yaEnviada: boolean;
    limiteDiario: boolean;
}

export function useSolicitudWhatsapp() {
    const abierto = useSolicitudWhatsappStore(s => s.abierto);
    const cerrarStore = useSolicitudWhatsappStore(s => s.cerrar);

    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [pais, setPais] = useState('');
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [estado, setEstado] = useState<EstadoDisponibilidad>({
        disponible: true,
        yaEnviada: false,
        limiteDiario: false,
    });

    /* Verificar disponibilidad al abrir el modal */
    useEffect(() => {
        if (!abierto) {
            setCargando(true);
            return;
        }

        let cancelado = false;
        apiGet<{ data: EstadoDisponibilidad }>('/solicitud-whatsapp/estado').then((resp) => {
            if (cancelado) return;
            if (resp.ok && resp.data?.data) {
                setEstado(resp.data.data);
            }
            setCargando(false);
        }).catch(() => {
            if (!cancelado) setCargando(false);
        });

        return () => { cancelado = true; };
    }, [abierto]);

    const limpiar = useCallback(() => {
        setNombre('');
        setTelefono('');
        setPais('');
        setMotivo('');
        setDescripcion('');
    }, []);

    const cerrar = useCallback(() => {
        limpiar();
        cerrarStore();
    }, [limpiar, cerrarStore]);

    const enviar = useCallback(async () => {
        const nombreTrim = nombre.trim();
        const telefonoTrim = telefono.trim();
        const paisTrim = pais.trim();
        const motivoTrim = motivo.trim();
        const descripcionTrim = descripcion.trim();

        if (!nombreTrim || !telefonoTrim || !paisTrim || !motivoTrim || !descripcionTrim) {
            toast.error(getT()('error.camposRequeridos'));
            return;
        }

        setEnviando(true);

        /* Codificar campos estructurados en razon + detalles del sistema de reportes */
        const razon = motivoTrim;
        const detalles = `Nombre: ${nombreTrim}\nTeléfono: ${telefonoTrim}\nPaís: ${paisTrim}\n\n${descripcionTrim}`;

        const resp = await apiPost<{ ok: boolean; message: string }>('/reportar', {
            tipo: 'solicitud_whatsapp',
            targetId: 0,
            razon,
            detalles,
        });

        setEnviando(false);

        if (resp.ok) {
            toast.exito('Solicitud enviada. Redirigiendo al grupo...');
            cerrar();
            window.open(URL_GRUPO_WA, '_blank', 'noopener,noreferrer');
        } else {
            toast.error(resp.error ?? 'No se pudo enviar la solicitud');
        }
    }, [nombre, telefono, pais, motivo, descripcion, cerrar]);

    const puedeEnviar = nombre.trim().length > 0
        && telefono.trim().length > 0
        && pais.trim().length > 0
        && motivo.trim().length > 0
        && descripcion.trim().length > 0
        && !enviando;

    return {
        abierto,
        cargando,
        estado,
        nombre,
        setNombre,
        telefono,
        setTelefono,
        pais,
        setPais,
        motivo,
        setMotivo,
        descripcion,
        setDescripcion,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    };
}
