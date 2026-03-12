/*
 * ModalSolicitudWhatsapp — Kamples (QQ63)
 * Modal de solicitud de ingreso al grupo de WhatsApp del proyecto.
 * Temporal durante la beta. Reutiliza estilos de reportarError.
 * Restricciones: 1 por usuario, 6 por día globales.
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { Input } from '../ui/Input';
import { CampoTexto } from '../ui/CampoTexto';
import { useSolicitudWhatsapp } from '@app/hooks/useSolicitudWhatsapp';
import '../../styles/componentes/modalReportarError.css';

export const ModalSolicitudWhatsapp = (): JSX.Element | null => {
    const {
        abierto,
        cargando,
        estado,
        nombre,
        setNombre,
        telefono,
        setTelefono,
        pais,
        setPais,
        motivo,
        setMotivo,
        descripcion,
        setDescripcion,
        enviando,
        puedeEnviar,
        enviar,
        cerrar,
    } = useSolicitudWhatsapp();

    if (!abierto) return null;

    /* Mensaje de limite diario alcanzado */
    if (!cargando && estado.limiteDiario) {
        return (
            <Modal abierto={abierto} onCerrar={cerrar} tamano="pequeno">
                <div className="reportarErrorFormulario">
                    <p className="reportarErrorNota" style={{ fontSize: 'var(--fuenteSm)', color: 'var(--textoPrimario)', lineHeight: 1.6 }}>
                        Hoy se han enviado muchas solicitudes de ingreso al grupo.
                        Por favor, espera hasta mañana. Si tienes algo que compartir
                        puedes usar los reportes, pero si tu aportación es valiosa,
                        regresa aquí mañana temprano y envía tu solicitud de ingreso
                        al grupo de WhatsApp.
                    </p>
                    <div className="modalAcciones">
                        <BotonBase variante="secundario" onClick={cerrar} type="button">Cerrar</BotonBase>
                    </div>
                </div>
            </Modal>
        );
    }

    /* Mensaje de solicitud ya enviada */
    if (!cargando && estado.yaEnviada) {
        return (
            <Modal abierto={abierto} onCerrar={cerrar} tamano="pequeno">
                <div className="reportarErrorFormulario">
                    <p className="reportarErrorNota" style={{ fontSize: 'var(--fuenteSm)', color: 'var(--textoPrimario)', lineHeight: 1.6 }}>
                        Ya enviaste tu solicitud de ingreso al grupo de WhatsApp.
                        Si aún no has sido aceptado, ten paciencia — revisamos las solicitudes manualmente.
                    </p>
                    <div className="modalAcciones">
                        <BotonBase variante="secundario" onClick={cerrar} type="button">Cerrar</BotonBase>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="pequeno">
            <div className="reportarErrorFormulario">
                <p className="reportarErrorNota" style={{ fontSize: 'var(--fuenteXs)', color: 'var(--textoSecundario)', lineHeight: 1.5 }}>
                    Envía una solicitud para entrar al grupo de Kamples.
                    Esto es temporal y solo estará disponible durante la beta.
                    Comparte tu feedback directamente con nosotros.
                    Si los datos son incorrectos tu solicitud será rechazada automáticamente.
                </p>

                <label className="reportarErrorLabel" htmlFor="solicitudNombre">Nombre</label>
                <Input
                    id="solicitudNombre"
                    className="reportarErrorInput"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={100}
                    autoFocus
                />

                <label className="reportarErrorLabel" htmlFor="solicitudTelefono">Número de teléfono</label>
                <Input
                    id="solicitudTelefono"
                    className="reportarErrorInput"
                    type="tel"
                    placeholder="Ej: +52 55 1234 5678"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    maxLength={20}
                />

                <label className="reportarErrorLabel" htmlFor="solicitudPais">País</label>
                <Input
                    id="solicitudPais"
                    className="reportarErrorInput"
                    type="text"
                    placeholder="Ej: México"
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    maxLength={60}
                />

                <label className="reportarErrorLabel" htmlFor="solicitudMotivo">Motivo</label>
                <Input
                    id="solicitudMotivo"
                    className="reportarErrorInput"
                    type="text"
                    placeholder="Ej: Quiero dar feedback sobre el reproductor"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    maxLength={500}
                />

                <label className="reportarErrorLabel" htmlFor="solicitudDescripcion">Descripción</label>
                <CampoTexto
                    multilínea
                    variante="desnudo"
                    id="solicitudDescripcion"
                    className="reportarErrorTextarea"
                    placeholder="Cuéntanos más sobre ti y por qué quieres unirte al grupo..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={2000}
                    rows={4}
                />

                <div className="modalAcciones">
                    <BotonBase variante="secundario" onClick={cerrar} type="button">
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={enviar}
                        disabled={!puedeEnviar}
                        type="button"
                    >
                        {enviando ? 'Enviando...' : 'Enviar solicitud'}
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};

export default ModalSolicitudWhatsapp;
