/**
 * PanelStripe
 *
 * Panel de configuración de la pasarela de pago Stripe.
 * Solo visible para usuarios con rol administrator.
 * Permite configurar API keys, webhook secret y modo test/live.
 */

import {useState} from 'react';
import {useStripe} from '../../hooks/useStripe';
import {Tarjeta, TarjetaHeader, Boton, Input, Alerta, Spinner, Badge} from '../ui';
import {CreditCard, Key, Link, AlertTriangle, Check, Eye, EyeOff, Copy} from 'lucide-react';

export function PanelStripe() {
    const {estado, formulario, cargando, guardando, error, exito, setFormulario, guardarConfiguracion, limpiarMensajes} = useStripe();

    /* Estados para mostrar/ocultar claves secretas */
    const [mostrarTestSecret, setMostrarTestSecret] = useState(false);
    const [mostrarLiveSecret, setMostrarLiveSecret] = useState(false);
    const [mostrarWebhookSecret, setMostrarWebhookSecret] = useState(false);
    const [copiado, setCopiado] = useState(false);

    /* Limpiar mensajes después de 4 segundos */
    if (exito || error) {
        setTimeout(limpiarMensajes, 4000);
    }

    /* Copiar URL de webhook */
    const copiarWebhookUrl = async () => {
        if (estado?.webhookUrl) {
            await navigator.clipboard.writeText(estado.webhookUrl);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        }
    };

    if (cargando) {
        return (
            <Tarjeta className="capPanelConfig capAnimFadeIn">
                <TarjetaHeader>
                    <div className="capFlexStart capGap--sm">
                        <span className="capPanelConfig__icono">
                            <CreditCard size={20} />
                        </span>
                        <h3 className="capTitulo capTitulo--sm">Stripe</h3>
                    </div>
                </TarjetaHeader>
                <div className="capFlexCenter capPy--lg">
                    <Spinner />
                </div>
            </Tarjeta>
        );
    }

    return (
        <Tarjeta className="capPanelConfig capAnimFadeIn">
            <TarjetaHeader>
                <div className="capFlexStart capGap--sm">
                    <span className="capPanelConfig__icono">
                        <CreditCard size={20} />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Configuración de Stripe</h3>
                    {estado?.configurado ? <Badge variante="exito">Configurado</Badge> : <Badge variante="advertencia">Sin configurar</Badge>}
                </div>
            </TarjetaHeader>

            <div className="capTarjeta__contenido capFlexCol capGap--md">
                {/* Mensajes de feedback */}
                {error && (
                    <Alerta variante="error" className="capAnimSlideUp">
                        {error}
                    </Alerta>
                )}
                {exito && (
                    <Alerta variante="exito" className="capAnimSlideUp">
                        {exito}
                    </Alerta>
                )}

                {/* Modo Test/Live Toggle */}
                <div className="capPanelStripe__modo">
                    <label className="capPanelStripe__modoLabel">
                        <span className="capTexto capTexto--bold">Modo de operación:</span>
                    </label>
                    <div className="capPanelStripe__modoOpciones">
                        <button type="button" className={`capPanelStripe__modoBtn ${formulario.modoTest ? 'capPanelStripe__modoBtn--activo' : ''}`} onClick={() => setFormulario(prev => ({...prev, modoTest: true}))}>
                            <AlertTriangle size={16} />
                            Test
                        </button>
                        <button type="button" className={`capPanelStripe__modoBtn ${!formulario.modoTest ? 'capPanelStripe__modoBtn--activo capPanelStripe__modoBtn--live' : ''}`} onClick={() => setFormulario(prev => ({...prev, modoTest: false}))}>
                            <Check size={16} />
                            Producción
                        </button>
                    </div>
                </div>

                {/* Sección Test Keys */}
                <div className="capPanelStripe__seccion">
                    <div className="capPanelStripe__seccionHeader">
                        <Key size={16} />
                        <span className="capTexto capTexto--sm capTexto--bold">Claves de Test</span>
                        {estado?.testKeysConfiguradas && (
                            <Badge variante="exito" tamano="sm">
                                ✓ Configuradas
                            </Badge>
                        )}
                    </div>

                    <Input placeholder="pk_test_..." value={formulario.testPublishableKey} onChange={e => setFormulario(prev => ({...prev, testPublishableKey: e.target.value}))} etiqueta="Clave Pública (Publishable Key)" />

                    <div className="capPanelStripe__inputConToggle">
                        <Input tipo={mostrarTestSecret ? 'text' : 'password'} placeholder="sk_test_..." value={formulario.testSecretKey} onChange={e => setFormulario(prev => ({...prev, testSecretKey: e.target.value}))} etiqueta="Clave Secreta (Secret Key)" />
                        <button type="button" className="capPanelStripe__toggleVisibilidad" onClick={() => setMostrarTestSecret(!mostrarTestSecret)} title={mostrarTestSecret ? 'Ocultar' : 'Mostrar'}>
                            {mostrarTestSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Sección Live Keys */}
                <div className="capPanelStripe__seccion">
                    <div className="capPanelStripe__seccionHeader">
                        <Key size={16} />
                        <span className="capTexto capTexto--sm capTexto--bold">Claves de Producción</span>
                        {estado?.liveKeysConfiguradas && (
                            <Badge variante="exito" tamano="sm">
                                ✓ Configuradas
                            </Badge>
                        )}
                    </div>

                    <Input placeholder="pk_live_..." value={formulario.livePublishableKey} onChange={e => setFormulario(prev => ({...prev, livePublishableKey: e.target.value}))} etiqueta="Clave Pública (Publishable Key)" />

                    <div className="capPanelStripe__inputConToggle">
                        <Input tipo={mostrarLiveSecret ? 'text' : 'password'} placeholder="sk_live_..." value={formulario.liveSecretKey} onChange={e => setFormulario(prev => ({...prev, liveSecretKey: e.target.value}))} etiqueta="Clave Secreta (Secret Key)" />
                        <button type="button" className="capPanelStripe__toggleVisibilidad" onClick={() => setMostrarLiveSecret(!mostrarLiveSecret)} title={mostrarLiveSecret ? 'Ocultar' : 'Mostrar'}>
                            {mostrarLiveSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Webhook */}
                <div className="capPanelStripe__seccion">
                    <div className="capPanelStripe__seccionHeader">
                        <Link size={16} />
                        <span className="capTexto capTexto--sm capTexto--bold">Webhook</span>
                        {estado?.webhookConfigurado && (
                            <Badge variante="exito" tamano="sm">
                                ✓ Configurado
                            </Badge>
                        )}
                    </div>

                    {/* URL del Webhook para copiar */}
                    <div className="capPanelStripe__webhookUrl">
                        <span className="capTexto capTexto--xs capTexto--secundario">URL del Webhook (configúrala en Stripe Dashboard):</span>
                        <div className="capPanelStripe__urlCopiar">
                            <code className="capPanelStripe__urlCodigo">{estado?.webhookUrl}</code>
                            <button type="button" className="capPanelStripe__btnCopiar" onClick={copiarWebhookUrl} title="Copiar URL">
                                {copiado ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="capPanelStripe__inputConToggle">
                        <Input tipo={mostrarWebhookSecret ? 'text' : 'password'} placeholder="whsec_..." value={formulario.webhookSecret} onChange={e => setFormulario(prev => ({...prev, webhookSecret: e.target.value}))} etiqueta="Secreto del Webhook" />
                        <button type="button" className="capPanelStripe__toggleVisibilidad" onClick={() => setMostrarWebhookSecret(!mostrarWebhookSecret)} title={mostrarWebhookSecret ? 'Ocultar' : 'Mostrar'}>
                            {mostrarWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Price ID */}
                <div className="capPanelStripe__seccion">
                    <Input placeholder="price_..." value={formulario.priceId} onChange={e => setFormulario(prev => ({...prev, priceId: e.target.value}))} etiqueta="ID del Precio de Suscripción" ayuda="Crea un producto y precio en Stripe Dashboard y copia el Price ID aquí" />
                </div>

                {/* Nota informativa */}
                <Alerta variante="info" className="capMt--sm">
                    <strong>Importante:</strong> Las claves se almacenan encriptadas. Por seguridad, no se muestran los valores actuales. Solo introduce nuevos valores si deseas actualizarlos.
                </Alerta>

                {/* Botón guardar */}
                <div className="capTarjeta__footer">
                    <Boton variante="primario" onClick={guardarConfiguracion} cargando={guardando} disabled={guardando}>
                        Guardar Configuración
                    </Boton>
                </div>
            </div>
        </Tarjeta>
    );
}
