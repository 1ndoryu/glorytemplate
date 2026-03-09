/**
 * AdminConfiguracion — Formulario de configuración del negocio.
 * Datos empresa, horarios, temporadas, precios.
 */

import { useState, useCallback, useEffect } from 'react';
import { Boton } from '@app/components/ui/Boton';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { CampoSelect } from '@app/components/ui/CampoSelect';
import type { AdminConfiguracion as ConfigTipo } from '@app/types/cresta';

interface AdminConfiguracionProps {
    configuracion: ConfigTipo | null;
    loading: boolean;
    onGuardar: (c: ConfigTipo) => Promise<boolean>;
}

const CONFIG_INICIAL: ConfigTipo = {
    empresaNombre: '',
    empresaEmail: '',
    empresaTelefono: '',
    empresaDireccion: '',
    empresaCif: '',
    horarioRecogida: '16:00',
    horarioDevolucion: '10:00',
    minNoches: 2,
    maxNoches: 30,
    diasAnticipacion: 1,
    multiplicadorMedia: 1.3,
    multiplicadorAlta: 1.6,
    multiplicadorEspecial: 2.0,
    emailNotificaciones: '',
    stripeSecretKey: '',
    stripePublishableKey: '',
    stripeWebhookSecret: '',
    stripeMode: 'test',
};

export function AdminConfiguracion({ configuracion, loading, onGuardar }: AdminConfiguracionProps): JSX.Element {
    const [form, setForm] = useState<ConfigTipo>(CONFIG_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [guardado, setGuardado] = useState(false);

    useEffect(() => {
        if (configuracion) setForm(configuracion);
    }, [configuracion]);

    const actualizar = useCallback(<K extends keyof ConfigTipo>(campo: K, valor: ConfigTipo[K]) => {
        setForm(prev => ({ ...prev, [campo]: valor }));
        setGuardado(false);
    }, []);

    const handleGuardar = useCallback(async () => {
        setGuardando(true);
        const ok = await onGuardar(form);
        setGuardando(false);
        if (ok) setGuardado(true);
    }, [form, onGuardar]);

    if (loading) {
        return (
            <div className="adminSeccionCargando">
                <div className="cargandoSpinner" />
                <p>Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="adminSeccion">
            <h2 className="adminSeccionTitulo">Configuración</h2>
            <p className="adminSeccionDesc">Datos de tu empresa, horarios y precios</p>

            {/* Datos de empresa */}
            <div className="adminConfigSeccion">
                <h3 className="adminConfigSubtitulo">Empresa</h3>
                <div className="adminFormGrid">
                    <CampoTexto
                        label="Nombre"
                        value={form.empresaNombre}
                        onChange={v => actualizar('empresaNombre', v)}
                    />
                    <CampoTexto
                        label="Email"
                        type="email"
                        value={form.empresaEmail}
                        onChange={v => actualizar('empresaEmail', v)}
                    />
                    <CampoTexto
                        label="Teléfono"
                        type="tel"
                        value={form.empresaTelefono}
                        onChange={v => actualizar('empresaTelefono', v)}
                    />
                    <CampoTexto
                        label="Dirección"
                        value={form.empresaDireccion}
                        onChange={v => actualizar('empresaDireccion', v)}
                    />
                    <CampoTexto
                        label="CIF/NIF"
                        value={form.empresaCif}
                        onChange={v => actualizar('empresaCif', v)}
                    />
                </div>
            </div>

            {/* Horarios */}
            <div className="adminConfigSeccion">
                <h3 className="adminConfigSubtitulo">Horarios de recogida/devolución</h3>
                <div className="adminFormGrid">
                    <CampoTexto
                        label="Hora de recogida"
                        value={form.horarioRecogida}
                        onChange={v => actualizar('horarioRecogida', v)}
                        placeholder="16:00"
                    />
                    <CampoTexto
                        label="Hora de devolución"
                        value={form.horarioDevolucion}
                        onChange={v => actualizar('horarioDevolucion', v)}
                        placeholder="10:00"
                    />
                </div>
            </div>

            {/* Reservas */}
            <div className="adminConfigSeccion">
                <h3 className="adminConfigSubtitulo">Reservas</h3>
                <div className="adminFormGrid">
                    <CampoTexto
                        label="Noches mínimas"
                        type="number"
                        value={String(form.minNoches)}
                        onChange={v => actualizar('minNoches', Number(v))}
                    />
                    <CampoTexto
                        label="Noches máximas"
                        type="number"
                        value={String(form.maxNoches)}
                        onChange={v => actualizar('maxNoches', Number(v))}
                    />
                    <CampoTexto
                        label="Días de anticipación mínima"
                        type="number"
                        value={String(form.diasAnticipacion)}
                        onChange={v => actualizar('diasAnticipacion', Number(v))}
                    />
                </div>
            </div>

            {/* Multiplicadores de temporada */}
            <div className="adminConfigSeccion">
                <h3 className="adminConfigSubtitulo">Multiplicadores de temporada</h3>
                <p className="adminConfigAyuda">El precio final = precio base del vehiculo x multiplicador</p>
                <div className="adminFormGrid">
                    <CampoTexto
                        label="Temporada media (x)"
                        type="number"
                        value={String(form.multiplicadorMedia)}
                        onChange={v => actualizar('multiplicadorMedia', Number(v))}
                    />
                    <CampoTexto
                        label="Temporada alta (x)"
                        type="number"
                        value={String(form.multiplicadorAlta)}
                        onChange={v => actualizar('multiplicadorAlta', Number(v))}
                    />
                    <CampoTexto
                        label="Temporada especial (x)"
                        type="number"
                        value={String(form.multiplicadorEspecial)}
                        onChange={v => actualizar('multiplicadorEspecial', Number(v))}
                    />
                </div>
            </div>

            {/* Notificaciones */}
            <div className="adminConfigSeccion">
                <h3 className="adminConfigSubtitulo">Notificaciones</h3>
                <p className="adminConfigAyuda">
                    Email donde se reciben las notificaciones de reservas. Si se deja vacio, se usa el email de empresa.
                </p>
                <div className="adminFormGrid">
                    <CampoTexto
                        label="Email de notificaciones"
                        type="email"
                        value={form.emailNotificaciones}
                        onChange={v => actualizar('emailNotificaciones', v)}
                        placeholder="notificaciones@tuempresa.com"
                    />
                </div>
            </div>

            {/* Pasarela de pago (Stripe) */}
            <div className="adminConfigSeccion">
                <h3 className="adminConfigSubtitulo">Pasarela de pago (Stripe)</h3>
                <div className="adminStripeEstado">
                    <span className={`adminStripeBadge ${form.stripeMode === 'live' ? 'adminStripeBadgeLive' : 'adminStripeBadgeTest'}`}>
                        {form.stripeMode === 'live' ? 'Produccion' : 'Modo test'}
                    </span>
                    {form.stripeSecretKey
                        ? <span className="adminStripeConfigurado">Configurado</span>
                        : <span className="adminStripeNoConfigurado">No configurado</span>
                    }
                </div>
                <p className="adminConfigAyuda">
                    Si las claves estan configuradas en el archivo .env del servidor, se usan esas como prioridad.
                    Los valores enmascarados (sk_test_...) indican claves ya guardadas.
                </p>
                <div className="adminFormGrid">
                    <CampoSelect
                        label="Modo"
                        value={form.stripeMode}
                        onChange={v => actualizar('stripeMode', v)}
                    >
                        <option value="test">Test</option>
                        <option value="live">Live (Producción)</option>
                    </CampoSelect>
                    <CampoTexto
                        label="Publishable Key"
                        value={form.stripePublishableKey}
                        onChange={v => actualizar('stripePublishableKey', v)}
                        placeholder="pk_test_..."
                    />
                    <CampoTexto
                        label="Secret Key"
                        value={form.stripeSecretKey}
                        onChange={v => actualizar('stripeSecretKey', v)}
                        placeholder="sk_test_..."
                    />
                    <CampoTexto
                        label="Webhook Secret"
                        value={form.stripeWebhookSecret}
                        onChange={v => actualizar('stripeWebhookSecret', v)}
                        placeholder="whsec_..."
                    />
                </div>
                <p className="adminConfigAyuda adminConfigAyudaMono">
                    URL del webhook: /wp-json/glory/v1/stripe/webhook
                </p>
            </div>

            <div className="adminFormAcciones">
                <Boton onClick={handleGuardar} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar configuración'}
                </Boton>
                {guardado && <span className="adminGuardadoMsg">Configuración guardada correctamente</span>}
            </div>
        </div>
    );
}
