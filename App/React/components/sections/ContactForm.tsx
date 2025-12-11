// Componente ContactForm
// Formulario de contacto con campos RGPD segun project-extends.md

import {useState, useEffect} from 'react';
import {Send, CheckCircle, AlertCircle} from 'lucide-react';
import {Button} from '../ui/Button';

interface ContactFormProps {
    // Titulo de la seccion
    title?: string;
    // Subtitulo opcional
    subtitle?: string;
}

// Estados del formulario
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// Campos del formulario segun project-extends.md
interface FormData {
    nombre: string;
    email: string;
    telefono: string;
    empresa: string;
    servicio: string;
    mensaje: string;
    canalPreferido: string;
    consentimiento: boolean;
    // Campos ocultos para tracking
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    pageUrl: string;
    timestamp: string;
}

const initialFormData: FormData = {
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    servicio: '',
    mensaje: '',
    canalPreferido: '',
    consentimiento: false,
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    pageUrl: '',
    timestamp: ''
};

// Opciones de servicio/interes
const servicioOptions = [
    {value: '', label: 'Selecciona un servicio'},
    {value: 'chatbot-whatsapp', label: 'Chatbot WhatsApp'},
    {value: 'chatbot-instagram', label: 'Chatbot Instagram'},
    {value: 'chatbot-web', label: 'Chatbot Web'},
    {value: 'voicebot', label: 'Voicebot (llamadas)'},
    {value: 'automatizacion', label: 'Automatizacion de tareas'},
    {value: 'integraciones', label: 'Integraciones CRM/Software'},
    {value: 'otro', label: 'Otro / No estoy seguro'}
];

// Opciones de canal preferido
const canalOptions = [
    {value: '', label: 'Canal preferido de contacto'},
    {value: 'whatsapp', label: 'WhatsApp'},
    {value: 'email', label: 'Email'},
    {value: 'telefono', label: 'Llamada telefonica'},
    {value: 'cualquiera', label: 'Cualquiera'}
];

export function ContactForm({title = 'Si prefieres escribirme ahora', subtitle}: ContactFormProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Capturar UTMs al montar el componente
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            setFormData(prev => ({
                ...prev,
                utmSource: urlParams.get('utm_source') || '',
                utmMedium: urlParams.get('utm_medium') || '',
                utmCampaign: urlParams.get('utm_campaign') || '',
                utmContent: urlParams.get('utm_content') || '',
                pageUrl: window.location.href,
                timestamp: new Date().toISOString()
            }));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar consentimiento obligatorio
        if (!formData.consentimiento) {
            setErrorMessage('Debes aceptar la Politica de Privacidad para continuar.');
            setStatus('error');
            return;
        }

        setStatus('submitting');
        setErrorMessage('');

        // TODO: Implementar envio real del formulario
        // Por ahora simulamos un envio exitoso
        setTimeout(() => {
            setStatus('success');
            setFormData(initialFormData);
        }, 1500);
    };

    // Estilos de input y label usando clases Tailwind que referencian variables CSS nativas
    // Esto asegura que se adapte perfectamente al tema activo (default o project)
    const inputClasses = 'w-full px-4 py-3 rounded-lg border bg-surface border-primary text-primary transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder:text-subtle text-base shadow-sm';

    const labelClasses = 'block text-sm font-medium mb-1.5 text-secondary';

    return (
        <section id="formulario" className="mx-auto w-full max-w-7xl px-4 md:px-0">
            <div className="rounded-2xl bg-[var(--color-bg-elevated)] border-subtle p-6 md:p-10 shadow-sm relative overflow-hidden">
                {/* Encabezado limpio */}
                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-primary">{title}</h2>
                    {subtitle && <p className="text-base text-muted max-w-xl mx-auto">{subtitle}</p>}
                </div>

                {/* Mensaje de exito */}
                {status === 'success' && (
                    <div className="flex items-center gap-3 p-4 rounded-lg mb-6 bg-green-50 border border-green-200 text-green-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                        <p className="font-medium">Mensaje enviado. Te respondo hoy mismo.</p>
                    </div>
                )}

                {/* Mensaje de error */}
                {status === 'error' && errorMessage && (
                    <div className="flex items-center gap-3 p-4 rounded-lg mb-6 bg-red-50 border border-red-200 text-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                        <p className="font-medium">{errorMessage}</p>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    {/* Fila 1: Nombre y Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label htmlFor="nombre" className={labelClasses}>
                                Nombre *
                            </label>
                            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Tu nombre" className={inputClasses} />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="email" className={labelClasses}>
                                Email *
                            </label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="tu@email.com" className={inputClasses} />
                        </div>
                    </div>

                    {/* Fila 2: Telefono y Empresa */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label htmlFor="telefono" className={labelClasses}>
                                Telefono / WhatsApp
                            </label>
                            <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+34 600 000 000" className={inputClasses} />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="empresa" className={labelClasses}>
                                Empresa
                            </label>
                            <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Nombre empresa" className={inputClasses} />
                        </div>
                    </div>

                    {/* Fila 3: Servicio y Canal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label htmlFor="servicio" className={labelClasses}>
                                Interes / Servicio
                            </label>
                            <div className="relative">
                                <select id="servicio" name="servicio" value={formData.servicio} onChange={handleChange} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    {servicioOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {/* Chevron custom para select */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="canalPreferido" className={labelClasses}>
                                Canal preferido
                            </label>
                            <div className="relative">
                                <select id="canalPreferido" name="canalPreferido" value={formData.canalPreferido} onChange={handleChange} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    {canalOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mensaje */}
                    <div className="space-y-1">
                        <label htmlFor="mensaje" className={labelClasses}>
                            Mensaje
                        </label>
                        <textarea id="mensaje" name="mensaje" value={formData.mensaje} onChange={handleChange} rows={4} placeholder="Cuentame brevemente que necesitas..." className={`${inputClasses} resize-y min-h-[120px]`} />
                    </div>

                    {/* Checkbox de consentimiento RGPD - OBLIGATORIO */}
                    <div className="flex items-start gap-3 py-2">
                        <div className="flex h-6 items-center">
                            <input type="checkbox" id="consentimiento" name="consentimiento" checked={formData.consentimiento} onChange={handleChange} required className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer" />
                        </div>
                        <label htmlFor="consentimiento" className="text-sm leading-relaxed text-muted cursor-pointer select-none">
                            He leido y acepto la{' '}
                            <a href="/privacidad" className="font-medium text-[var(--color-accent-primary)] hover:underline">
                                Politica de Privacidad
                            </a>
                            . Autorizo el tratamiento de mis datos para atender mi solicitud.
                        </label>
                    </div>

                    {/* Campos ocultos para tracking */}
                    <input type="hidden" name="utmSource" value={formData.utmSource} />
                    <input type="hidden" name="utmMedium" value={formData.utmMedium} />
                    <input type="hidden" name="utmCampaign" value={formData.utmCampaign} />
                    <input type="hidden" name="utmContent" value={formData.utmContent} />
                    <input type="hidden" name="pageUrl" value={formData.pageUrl} />
                    <input type="hidden" name="timestamp" value={formData.timestamp} />

                    {/* Boton de envio */}
                    <div className="pt-2">
                        <Button type="submit" disabled={status === 'submitting'} icon={Send} className="w-full h-12 text-base shadow-sm hover:translate-y-[-1px] transition-all">
                            {status === 'submitting' ? 'Enviando...' : 'Enviar mensaje'}
                        </Button>
                    </div>

                    {/* Enlace a Cookies */}
                    <p className="text-center text-xs text-subtle mt-4">
                        Protegido por reCAPTCHA. Consulta tambien nuestra{' '}
                        <a href="/cookies" className="text-muted hover:underline transition-colors">
                            Politica de Cookies
                        </a>
                    </p>
                </form>
            </div>
        </section>
    );
}
