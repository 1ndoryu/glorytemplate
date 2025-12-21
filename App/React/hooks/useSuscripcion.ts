/**
 * useSuscripcion
 *
 * Hook para manejar el estado de suscripción del usuario.
 * Proporciona información sobre el plan actual, límites y funciones
 * para verificar acceso a funcionalidades premium.
 *
 * @package App/React/hooks
 */

import {useState, useCallback, useMemo} from 'react';
import type {InfoSuscripcion, LimitesPlan, ErrorLimite, PlanSuscripcion} from '../types/dashboard';

/*
 * Límites por defecto para plan FREE (fallback)
 * Nota: cifradoE2E disponible para todos los planes
 */
const LIMITES_FREE: LimitesPlan = {
    habitos: 10,
    tareasActivas: 50,
    proyectos: 3,
    adjuntosPorTarea: 0,
    sincronizacion: false,
    estadisticasAvanzadas: false,
    temas: false,
    cifradoE2E: true
};

/*
 * Obtiene la suscripción inicial desde window.gloryDashboard
 */
function obtenerSuscripcionInicial(): InfoSuscripcion | null {
    const wpData = (
        window as unknown as {
            gloryDashboard?: {
                suscripcion?: InfoSuscripcion;
                isLoggedIn?: boolean;
            };
        }
    ).gloryDashboard;

    if (!wpData?.isLoggedIn) {
        return null;
    }

    return wpData.suscripcion ?? null;
}

/*
 * Genera info de suscripción FREE por defecto
 */
function crearSuscripcionFree(): InfoSuscripcion {
    return {
        plan: 'free',
        estado: 'activa',
        esPremium: false,
        diasRestantes: null,
        trialDisponible: true,
        limites: LIMITES_FREE,
        fechaInicio: new Date().toISOString(),
        fechaExpiracion: null
    };
}

interface UseSuscripcionReturn {
    suscripcion: InfoSuscripcion;
    esPremium: boolean;
    enTrial: boolean;
    limites: LimitesPlan;
    puedeCrear: (entidad: 'habitos' | 'tareasActivas' | 'proyectos', cantidadActual: number) => boolean;
    tieneAcceso: (funcionalidad: keyof LimitesPlan) => boolean;
    verificarLimites: (datos: {habitos?: unknown[]; tareas?: unknown[]; proyectos?: unknown[]}) => ErrorLimite[];
    activarTrial: () => Promise<boolean>;
    recargarSuscripcion: () => Promise<void>;
    cargando: boolean;
    error: string | null;
}

/**
 * Hook principal de suscripción
 */
export function useSuscripcion(): UseSuscripcionReturn {
    const inicial = obtenerSuscripcionInicial();

    const [suscripcion, setSuscripcion] = useState<InfoSuscripcion>(inicial ?? crearSuscripcionFree());
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * Helpers de estado
     */
    const esPremium = useMemo(() => suscripcion.esPremium, [suscripcion]);
    const enTrial = useMemo(() => suscripcion.estado === 'trial', [suscripcion]);
    const limites = useMemo(() => suscripcion.limites, [suscripcion]);

    /*
     * Verifica si el usuario puede crear más entidades
     */
    const puedeCrear = useCallback(
        (entidad: 'habitos' | 'tareasActivas' | 'proyectos', cantidadActual: number): boolean => {
            const limite = limites[entidad];

            /* -1 significa ilimitado */
            if (limite === -1) {
                return true;
            }

            return cantidadActual < limite;
        },
        [limites]
    );

    /*
     * Verifica si una funcionalidad está disponible
     */
    const tieneAcceso = useCallback(
        (funcionalidad: keyof LimitesPlan): boolean => {
            const valor = limites[funcionalidad];

            if (typeof valor === 'boolean') {
                return valor;
            }

            /* Para valores numéricos, > 0 significa acceso (o -1 = ilimitado) */
            return valor !== 0;
        },
        [limites]
    );

    /*
     * Verifica límites antes de guardar (cliente-side)
     */
    const verificarLimites = useCallback(
        (datos: {habitos?: unknown[]; tareas?: unknown[]; proyectos?: unknown[]}): ErrorLimite[] => {
            const errores: ErrorLimite[] = [];

            /* Verificar hábitos */
            if (datos.habitos && limites.habitos !== -1) {
                const cantidad = datos.habitos.length;
                if (cantidad > limites.habitos) {
                    errores.push({
                        tipo: 'habitos',
                        limite: limites.habitos,
                        actual: cantidad,
                        mensaje: `Límite de hábitos excedido (${cantidad}/${limites.habitos}). Actualiza a Premium.`
                    });
                }
            }

            /* Verificar tareas activas */
            if (datos.tareas && limites.tareasActivas !== -1) {
                const tareasActivas = (datos.tareas as Array<{completado?: boolean}>).filter(t => !t.completado);
                const cantidad = tareasActivas.length;
                if (cantidad > limites.tareasActivas) {
                    errores.push({
                        tipo: 'tareas',
                        limite: limites.tareasActivas,
                        actual: cantidad,
                        mensaje: `Límite de tareas activas excedido (${cantidad}/${limites.tareasActivas}). Actualiza a Premium.`
                    });
                }
            }

            /* Verificar proyectos */
            if (datos.proyectos && limites.proyectos !== -1) {
                const cantidad = datos.proyectos.length;
                if (cantidad > limites.proyectos) {
                    errores.push({
                        tipo: 'proyectos',
                        limite: limites.proyectos,
                        actual: cantidad,
                        mensaje: `Límite de proyectos excedido (${cantidad}/${limites.proyectos}). Actualiza a Premium.`
                    });
                }
            }

            return errores;
        },
        [limites]
    );

    /*
     * Activa el trial de 14 días
     */
    const activarTrial = useCallback(async (): Promise<boolean> => {
        const wpData = (
            window as unknown as {
                gloryDashboard?: {nonce?: string; apiBase?: string};
            }
        ).gloryDashboard;

        if (!wpData?.apiBase || !wpData?.nonce) {
            setError('No hay conexión con el servidor');
            return false;
        }

        setCargando(true);
        setError(null);

        try {
            const response = await fetch(wpData.apiBase.replace('/dashboard', '/suscripcion/trial'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': wpData.nonce
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                setSuscripcion(data.data);
                return true;
            }

            setError(data.message || 'No se pudo activar el trial');
            return false;
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error de conexión';
            setError(mensaje);
            return false;
        } finally {
            setCargando(false);
        }
    }, []);

    /*
     * Recarga la información de suscripción desde el servidor
     */
    const recargarSuscripcion = useCallback(async (): Promise<void> => {
        const wpData = (
            window as unknown as {
                gloryDashboard?: {nonce?: string; apiBase?: string};
            }
        ).gloryDashboard;

        if (!wpData?.apiBase || !wpData?.nonce) {
            return;
        }

        setCargando(true);

        try {
            const response = await fetch(wpData.apiBase.replace('/dashboard', '/suscripcion'), {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': wpData.nonce
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                setSuscripcion(data.data);
            }
        } catch (err) {
            console.error('[useSuscripcion] Error al recargar:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    return {
        suscripcion,
        esPremium,
        enTrial,
        limites,
        puedeCrear,
        tieneAcceso,
        verificarLimites,
        activarTrial,
        recargarSuscripcion,
        cargando,
        error
    };
}
