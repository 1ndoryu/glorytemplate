export interface ScenarioMessage {
    isUser: boolean;
    text: string;
}

export interface Scenario {
    id: string;
    name: string;
    initials: string;
    title: string;
    desc: string;
    features: string[];
    messages: ScenarioMessage[];
}

export const SCENARIOS: Record<string, Scenario> = {
    restaurant: {
        id: 'restaurant',
        name: 'La Trattoria',
        initials: 'LT',
        title: 'Restaurantes y Hostelería',
        desc: 'Automatiza reservas, preguntas sobre el menú y alérgenos.',
        features: ['Gestión de mesas', 'Menú digital', 'Recordatorios'],
        messages: [
            {isUser: true, text: 'Hola, ¿tienen mesa para hoy?'},
            {isUser: false, text: '¡Hola! 👋 Soy el asistente de La Trattoria. ¿Para cuántas personas sería?'},
            {isUser: true, text: 'Somos 2 personas.'},
            {isUser: false, text: 'Perfecto. Tengo hueco a las 20:30 o 21:15. ¿Cuál prefieres?'},
            {isUser: true, text: '20:30 está bien.'},
            {isUser: false, text: '✅ ¡Hecho! Mesa reservada para 2 a las 20:30. Te he enviado un email de confirmación.'}
        ]
    },
    clinic: {
        id: 'clinic',
        name: 'Clínica Dental',
        initials: 'CD',
        title: 'Clínicas y Salud',
        desc: 'Triaje de pacientes, gestión de citas y recordatorios anuales.',
        features: ['Triaje previo', 'Citas recurrentes', 'Privacidad datos'],
        messages: [
            {isUser: true, text: 'Me duele una muela y quiero cita.'},
            {isUser: false, text: 'Vaya, siento oír eso. ¿Es un dolor agudo constante o solo al morder?'},
            {isUser: true, text: 'Es constante, bastante molesto.'},
            {isUser: false, text: 'Entendido. Al ser dolor agudo, podemos verte hoy mismo de urgencia a las 18:00 con el Dr. Pérez. ¿Te encaja?'},
            {isUser: true, text: 'Sí, por favor.'},
            {isUser: false, text: 'Agendado. Recuerda traer tu tarjeta sanitaria.'}
        ]
    },
    ecommerce: {
        id: 'ecommerce',
        name: 'Tienda Moda',
        initials: 'TM',
        title: 'E-commerce / Retail',
        desc: 'Estado de pedidos, devoluciones y stock sin intervención humana.',
        features: ['Estado pedido', 'Gestión stock', 'Soporte 24/7'],
        messages: [
            {isUser: true, text: '¿Dónde está mi pedido #12345?'},
            {isUser: false, text: 'Un segundo, lo consulto en el sistema... 📦'},
            {isUser: false, text: 'Tu pedido salió ayer del almacén. La entrega está prevista para mañana antes de las 14:00 por Correos.'},
            {isUser: true, text: 'Genial, gracias.'},
            {isUser: false, text: '¿Necesitas ayuda con algo más?'}
        ]
    }
};
