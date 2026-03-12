/*
 * ModalReportar — Kamples (QQ38)
 * Modal centralizado de reportes. Adapta UI segun tipo:
 * - error_plataforma: campo asunto + descripcion + URL auto
 * - usuario: muestra "@username" + motivo + detalles
 * - publicacion/comentario/sample: motivo + detalles
 * Reemplaza ModalReportarUsuario y ModalReportarError.
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { Input } from '../ui/Input';
import { CampoTexto } from '../ui/CampoTexto';
import { useReportar } from '@app/hooks/useReportar';
import '../../styles/componentes/modalReportarError.css';

export const ModalReportar = (): JSX.Element | null => {
    const {
        abierto,
        tipo,
        targetNombre,
        config,
        esError,
        razon,
        setRazon,
        detalles,
        setDetalles,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    } = useReportar();

    if (!abierto || !tipo) return null;

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            tamano="pequeno"
        >
            <div className="reportarErrorFormulario">
                {tipo === 'usuario' && targetNombre && (
                    <p className="reportarErrorNota" style={{ fontSize: 'var(--fuenteSm)', color: 'var(--textoPrimario)' }}>
                        Reportando a <strong>@{targetNombre}</strong>
                    </p>
                )}

                <label className="reportarErrorLabel" htmlFor="reportarRazon">
                    {config.etiqueta}
                </label>
                <Input
                    id="reportarRazon"
                    className="reportarErrorInput"
                    type="text"
                    placeholder={config.placeholder}
                    value={razon}
                    onChange={(e) => setRazon(e.target.value)}
                    maxLength={500}
                    autoFocus
                />

                <label className="reportarErrorLabel" htmlFor="reportarDetalles">
                    {esError ? 'Descripcion' : 'Detalles adicionales (opcional)'}
                </label>
                <CampoTexto
                    multilínea
                    variante="desnudo"
                    id="reportarDetalles"
                    className="reportarErrorTextarea"
                    placeholder={
                        esError
                            ? 'Describe que paso, que esperabas que ocurriera y los pasos para reproducir el error...'
                            : 'Describe la situacion con mas detalle si lo deseas...'
                    }
                    value={detalles}
                    onChange={(e) => setDetalles(e.target.value)}
                    maxLength={2000}
                    rows={esError ? 5 : 4}
                />

                {esError && (
                    <p className="reportarErrorNota">
                        Se incluira automaticamente la pagina donde te encuentras.
                    </p>
                )}

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

export default ModalReportar;
