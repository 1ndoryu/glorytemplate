import React, {useState, useEffect} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {Elements, PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';
import {X, Lock, CreditCard} from 'lucide-react';

interface ModalStripeProps {
    clientSecret: string;
    publishableKey: string;
    total: number;
    onClose: () => void;
    onSuccess: () => void;
}

// Subcomponente interno que usa los hooks de Stripe
const FormularioPago = ({total, onSuccess, onClose}: {total: number; onSuccess: () => void; onClose: () => void}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setCargando(true);
        setMensaje(null);

        const {error, paymentIntent} = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href // En SPA redirigir a misma página suele funcionar si manejamos status
            },
            redirect: 'if_required'
        });

        if (error) {
            setMensaje(error.message || 'Error desconocido al procesar el pago.');
            setCargando(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setMensaje('¡Pago exitoso!');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } else {
            setMensaje('Estado del pago: ' + (paymentIntent?.status || 'desconocido'));
            setCargando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="espacio-y-4">
            <div className="bg-slate-50 p-4 rounded-lg borde borde-slate-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="texto-sm texto-slate-500">Monto a pagar</span>
                    <span className="texto-lg negrita texto-slate-800">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 texto-xs texto-slate-500">
                    <Lock size={12} />
                    <span>Transacción segura encriptada</span>
                </div>
            </div>

            <PaymentElement />

            {mensaje && <div className={`p-3 rounded texto-sm ${mensaje.includes('exitoso') ? 'bg-green-100 texto-green-700' : 'bg-red-100 texto-red-700'}`}>{mensaje}</div>}

            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 texto-sm texto-slate-600 hover:texto-slate-800" disabled={cargando}>
                    Cancelar
                </button>
                <button type="submit" disabled={!stripe || cargando} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg texto-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    {cargando ? (
                        'Procesando...'
                    ) : (
                        <>
                            <CreditCard size={16} />
                            Pagar ${total.toFixed(2)}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default function ModalStripe({clientSecret, publishableKey, total, onClose, onSuccess}: ModalStripeProps) {
    // Aseguramos que la key no esté vacía antes de cargar
    const stripePromise = React.useMemo(() => {
        if (publishableKey) return loadStripe(publishableKey);
        return null;
    }, [publishableKey]);

    if (!clientSecret || !publishableKey || !stripePromise) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animacion-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animacion-scale-in">
                {/* Cabecera */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">Pago con Tarjeta</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <Elements stripe={stripePromise} options={{clientSecret}}>
                        <FormularioPago total={total} onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                        {/* Iconos de tarjetas simulados o imágenes */}
                        <div className="h-6 w-10 bg-slate-300 rounded"></div>
                        <div className="h-6 w-10 bg-slate-300 rounded"></div>
                        <div className="h-6 w-10 bg-slate-300 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
