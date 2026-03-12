/*
 * Componente: ModalReportarUsuario — Kamples (QQ23)
 * Modal para que los usuarios reporten a otro usuario.
 * Logica extraida a useReportarUsuario (SRP).
 * Reutiliza las clases CSS de modalReportarError (mismo layout).
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { Input } from '../ui/Input';
import { CampoTexto } from '../ui/CampoTexto';
import { useReportarUsuario } from '@app/hooks/useReportarUsuario';
import '../../styles/componentes/modalReportarError.css';

export const ModalReportarUsuario = (): JSX.Element | null => {
    const {
        abierto,
        usuarioUsername,
        razon,
        setRazon,
        detalles,
        setDetalles,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    } = useReportarUsuario();

    if (!abierto) return null;

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            tamano="pequeno"
        >
            <div className="reportarErrorFormulario">
                <p className="reportarErrorNota" style={{ fontSize: 'var(--fuenteSm)', color: 'var(--textoPrimario)' }}>
                    Reportando a <strong>@{usuarioUsername}</strong>
                </p>

                <label className="reportarErrorLabel" htmlFor="reportarUsuarioRazon">
                    Motivo del reporte
                </label>
                <Input
                    id="reportarUsuarioRazon"
                    className="reportarErrorInput"
                    type="text"
                    placeholder="Ej: Spam, acoso, contenido inapropiado"
                    value={razon}
                    onChange={(e) => setRazon(e.target.value)}
                    maxLength={500}
                    autoFocus
                />

                <label className="reportarErrorLabel" htmlFor="reportarUsuarioDetalles">
                    Detalles adicionales (opcional)
                </label>
                <CampoTexto
                    multilínea
                    variante="desnudo"
                    id="reportarUsuarioDetalles"
                    className="reportarErrorTextarea"
                    placeholder="Describe la situacion con mas detalle si lo deseas..."
                    value={detalles}
                    onChange={(e) => setDetalles(e.target.value)}
                    maxLength={2000}
                    rows={4}
                />

                <div className="modalAcciones">
                    <BotonBase
                        variante="secundario"
                        onClick={cerrar}
                        type="button"
                    >
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={enviar}
                        disabled={!puedeEnviar}
                        type="button"
                    >
                        {enviando ? 'Enviando...' : 'Enviar reporte'}
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};

export default ModalReportarUsuario;
