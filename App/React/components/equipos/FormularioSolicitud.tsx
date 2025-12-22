/*
 * FormularioSolicitud
 *
 * Formulario para enviar una solicitud de conexión por correo.
 */

import {useState, useCallback} from 'react';
import {UserPlus} from 'lucide-react';

interface FormularioSolicitudProps {
    onEnviar: (email: string) => Promise<void>;
    enviando: boolean;
}

export function FormularioSolicitud({onEnviar, enviando}: FormularioSolicitudProps): JSX.Element {
    const [email, setEmail] = useState('');

    const manejarSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            const emailTrimmed = email.trim();
            if (!emailTrimmed) return;

            await onEnviar(emailTrimmed);
            setEmail('');
        },
        [email, onEnviar]
    );

    const esEmailValido = useCallback((valor: string): boolean => {
        if (!valor) return true;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(valor);
    }, []);

    const emailValido = esEmailValido(email);

    return (
        <form className="formularioSolicitud" onSubmit={manejarSubmit}>
            <div className="formularioSolicitudCampo">
                <label htmlFor="email-solicitud" className="formularioSolicitudLabel">
                    Invitar compañero por correo
                </label>
                <div className="formularioSolicitudInputGrupo">
                    <input id="email-solicitud" type="email" className={`formularioSolicitudInput ${!emailValido ? 'invalido' : ''}`} placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} disabled={enviando} autoComplete="email" />
                    <button type="submit" className="formularioSolicitudBoton" disabled={enviando || !email.trim() || !emailValido} title="Enviar solicitud">
                        {enviando ? <span className="equiposSpinner pequeno" /> : <UserPlus size={16} />}
                        <span>Invitar</span>
                    </button>
                </div>
                {!emailValido && <span className="formularioSolicitudError">Ingresa un correo válido</span>}
            </div>
        </form>
    );
}
