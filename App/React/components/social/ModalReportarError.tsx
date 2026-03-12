/*
 * Componente: ModalReportarError — Kamples
 * Modal para que los usuarios reporten errores/bugs de la plataforma.
 * Lógica extraída a useReportarError (SRP).
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { Input } from '../ui/Input';
import { CampoTexto } from '../ui/CampoTexto';
import { useReportarError } from '@app/hooks/useReportarError';
import '../../styles/componentes/modalReportarError.css';

export const ModalReportarError = (): JSX.Element | null => {
    const {
        abierto,
        asunto,
        setAsunto,
        descripcion,
        setDescripcion,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    } = useReportarError();

    if (!abierto) return null;

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            titulo="Reportar un error"
            tamano="pequeno"
        >
            <div className="reportarErrorFormulario">
                <label className="reportarErrorLabel" htmlFor="reportarErrorAsunto">
                    Asunto
                </label>
                <Input
                    id="reportarErrorAsunto"
                    className="reportarErrorInput"
                    type="text"
                    placeholder="Ej: El reproductor no carga"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    maxLength={200}
                    autoFocus
                />

                <label className="reportarErrorLabel" htmlFor="reportarErrorDescripcion">
                    Descripción
                </label>
                <CampoTexto
                    multilínea
                    variante="desnudo"
                    id="reportarErrorDescripcion"
                    className="reportarErrorTextarea"
                    placeholder="Describe qué pasó, qué esperabas que ocurriera y los pasos para reproducir el error..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={2000}
                    rows={5}
                />

                <p className="reportarErrorNota">
                    Se incluirá automáticamente la página donde te encuentras.
                </p>

                <div className="reportarErrorAcciones">
                    <BotonBase
                        variante="ghost"
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

export default ModalReportarError;
