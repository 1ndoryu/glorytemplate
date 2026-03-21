/**
 * ModalReportarProblema
 *
 * [2003A-13] Modal para reportar un problema desde cualquier sección.
 * Admin: envía email directo a soporte.
 * No-admin: guarda en BD para revisión del admin.
 */

import {useEffect} from 'react';
import {Modal, Boton, Alerta} from '../ui';
import {useReportarProblema} from '../../hooks/useReportarProblema';
import './modalReportarProblema.css';

interface ModalReportarProblemaProps {
    abierto: boolean;
    onCerrar: () => void;
    isAdmin: boolean;
}

export function ModalReportarProblema({abierto, onCerrar, isAdmin}: ModalReportarProblemaProps) {
    const {mensaje, setMensaje, enviando, error, exito, enviarReporte, limpiar} = useReportarProblema();

    useEffect(() => {
        if (abierto) limpiar();
    }, [abierto, limpiar]);

    const handleEnviar = async () => {
        const ok = await enviarReporte();
        if (ok) {
            setTimeout(onCerrar, 2000);
        }
    };

    const subtitulo = isAdmin
        ? 'Se enviará un email a soporte con tu reporte'
        : 'El administrador revisará tu reporte';

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Reportar Problema" subtitulo={subtitulo} tamano="sm">
            <div className="capModalReportar">
                {error && <Alerta variante="error" className="capMb--md">{error}</Alerta>}
                {exito && <Alerta variante="exito" className="capMb--md">{exito}</Alerta>}

                <textarea
                    className="capModalReportar__textarea"
                    placeholder="Describe el problema que encontraste..."
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    disabled={enviando || !!exito}
                    rows={5}
                />

                <div className="capModalReportar__acciones">
                    <Boton variante="ghost" onClick={onCerrar} disabled={enviando}>
                        Cancelar
                    </Boton>
                    <Boton variante="primario" onClick={handleEnviar} cargando={enviando} disabled={!!exito}>
                        Enviar reporte
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}
