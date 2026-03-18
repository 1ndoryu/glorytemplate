/*
 * Componente: ModalReporteLegal
 * Formulario DMCA / reclamacion de derechos de autor.
 * Accesible sin autenticacion (titulares externos).
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { Checkbox } from '../ui/Checkbox';
import { useReporteLegal } from '../../hooks/useReporteLegal';
import type { DatosReporteLegal } from '../../services/apiReporteLegal';
import '../../styles/componentes/modalReporteLegal.css';

const TIPOS_DERECHO: Array<{ valor: DatosReporteLegal['tipo_derecho']; etiqueta: string }> = [
    { valor: 'copyright', etiqueta: 'Derechos de autor (Copyright)' },
    { valor: 'trademark', etiqueta: 'Marca registrada (Trademark)' },
    { valor: 'otro',      etiqueta: 'Otro tipo de derecho' },
];

interface ModalReporteLegalProps {
    abierto: boolean;
    tipo: DatosReporteLegal['tipo'];
    targetId: number;
    descripcionTarget?: string;
    onCerrar: () => void;
}

export function ModalReporteLegal({
    abierto,
    tipo,
    targetId,
    descripcionTarget,
    onCerrar,
}: ModalReporteLegalProps): JSX.Element {
    const {
        razon,
        nombre,
        email,
        tipoDerecho,
        obraProtegida,
        declaracion,
        estado,
        setRazon,
        setNombre,
        setEmail,
        setTipoDerecho,
        setObraProtegida,
        setDeclaracion,
        enviar,
        resetear,
    } = useReporteLegal();

    const cerrar = () => {
        resetear();
        onCerrar();
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        await enviar(tipo, targetId);
    };

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            titulo="Reclamacion de derechos (DMCA)"
            tamano="normal"
            pie={
                !estado.exito && (
                    <div className="modalReporteLegalPie">
                        <BotonBase variante="ghost" onClick={cerrar} disabled={estado.cargando}>
                            Cancelar
                        </BotonBase>
                        <BotonBase
                            variante="peligro"
                            type="submit"
                            form="formReporteLegal"
                            disabled={estado.cargando || !declaracion}
                        >
                            {estado.cargando ? 'Enviando...' : 'Enviar reclamación'}
                        </BotonBase>
                    </div>
                )
            }
        >
            {estado.exito ? (
                <div className="modalReporteLegalExito">
                    <p>Reclamación enviada correctamente.</p>
                    <p className="modalReporteLegalExitoSub">
                        Nuestro equipo la revisará en un plazo de 72 horas hábiles.
                        Recibirás actualizaciones en el email proporcionado.
                    </p>
                    <BotonBase variante="ghost" onClick={cerrar} className="modalReporteLegalCerrar">
                        Cerrar
                    </BotonBase>
                </div>
            ) : (
                <form id="formReporteLegal" onSubmit={manejarEnvio} className="modalReporteLegalForm">
                    {descripcionTarget && (
                        <div className="modalReporteLegalTarget">
                            <span className="modalReporteLegalTargetLabel">Elemento reclamado</span>
                            <span className="modalReporteLegalTargetValor">{descripcionTarget}</span>
                        </div>
                    )}

                    <div className="modalReporteLegalAviso">
                        Presentar una reclamacion falsa puede tener consecuencias legales.
                        Solo complete este formulario si es el titular de los derechos o su representante autorizado.
                    </div>

                    <div className="modalReporteLegalSeccion">
                        <span className="modalReporteLegalSeccionTitulo">Datos del reclamante</span>
                        <CampoTexto
                            etiqueta="Nombre completo o razon social"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            placeholder="Ej: Juan Garcia / SGAE"
                        />
                        <CampoTexto
                            etiqueta="Email de contacto"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="contacto@empresa.com"
                        />
                    </div>

                    <div className="modalReporteLegalSeccion">
                        <span className="modalReporteLegalSeccionTitulo">Detalles de la reclamacion</span>

                        <div className="modalReporteLegalCampo">
                            <label className="modalReporteLegalLabel">Tipo de derecho infringido</label>
                            <select
                                className="modalReporteLegalSelect"
                                value={tipoDerecho}
                                onChange={(e) => setTipoDerecho(e.target.value as typeof tipoDerecho)}
                                required
                            >
                                {TIPOS_DERECHO.map((t) => (
                                    <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                                ))}
                            </select>
                        </div>

                        <CampoTexto
                            etiqueta="Obra protegida reclamada"
                            value={obraProtegida}
                            onChange={(e) => setObraProtegida(e.target.value)}
                            required
                            placeholder="Título de la obra, número de registro, etc."
                        />

                        <div className="modalReporteLegalCampo">
                            <label className="modalReporteLegalLabel">Descripción de la infracción</label>
                            <textarea
                                className="modalReporteLegalTextarea"
                                value={razon}
                                onChange={(e) => setRazon(e.target.value)}
                                required
                                minLength={10}
                                rows={4}
                                placeholder="Describa cómo el contenido infringe sus derechos..."
                            />
                        </div>
                    </div>

                    <Checkbox
                        checked={declaracion}
                        onChange={(e) => setDeclaracion((e.target as HTMLInputElement).checked)}
                        label="Declaro de buena fe que el uso del material reclamado no está autorizado por el titular de los derechos, su agente o la ley. La información proporcionada es verídica."
                    />

                    {estado.error && (
                        <p className="modalReporteLegalError">{estado.error}</p>
                    )}
                </form>
            )}
        </Modal>
    );
}
