/*
 * Componente: ModalExtenderRecorte — Kamples (QQ130 + QK59)
 * Modal para extender el recorte de audio de un sample de extraccion.
 * Permite agregar segundos antes/despues, generar sample del segmento siguiente,
 * y restaurar al timing original si fue extendido previamente.
 * Logica en useExtenderRecorte (SRP).
 */

import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { Badge } from '@app/components/ui/Badge';
import { useExtenderRecorteStore } from '@app/stores/extenderRecorteStore';
import { useExtenderRecorte } from '@app/hooks/useExtenderRecorte';
import { Scissors, Plus, RotateCcw } from 'lucide-react';
import '../../styles/componentes/modalExtenderRecorte.css';

export const ModalExtenderRecorte = (): JSX.Element | null => {
    const abierto = useExtenderRecorteStore(s => s.abierto);
    const sample = useExtenderRecorteStore(s => s.sample);
    const cerrar = useExtenderRecorteStore(s => s.cerrar);

    const {
        segAntes, setSegAntes,
        segDespues, setSegDespues,
        duracionSiguiente, setDuracionSiguiente,
        enviando,
        enviarExtension,
        enviarSiguiente,
        enviarRestauracion,
        puedeRestaurar,
    } = useExtenderRecorte();

    if (!abierto || !sample) return null;

    const duracionActual = sample.duracion ?? 0;
    const duracionEstimada = duracionActual + segAntes + segDespues;

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="normal">
            <div className="extenderRecorteContenedor">
                <div className="extenderRecorteCabecera">
                    <Scissors size={20} className="extenderRecorteIcono" />
                    <h3 className="extenderRecorteTitulo">Extender recorte</h3>
                </div>

                <p className="extenderRecorteDescripcion">
                    Re-descarga el audio de YouTube y genera un nuevo recorte con timing extendido.
                    Esto reemplaza el audio actual del sample.
                </p>

                {/* Info del sample actual */}
                <div className="extenderRecorteInfo">
                    <span className="extenderRecorteSubtitulo">Sample actual</span>
                    <div className="extenderRecorteCampos">
                        <div className="extenderRecorteCampo">
                            <span className="extenderRecorteCampoLabel">Título</span>
                            <span className="extenderRecorteCampoValor">{sample.titulo}</span>
                        </div>
                        <div className="extenderRecorteCampo">
                            <span className="extenderRecorteCampoLabel">Duración</span>
                            <span className="extenderRecorteCampoValor">{duracionActual.toFixed(1)}s</span>
                        </div>
                        {sample.bpm && (
                            <div className="extenderRecorteCampo">
                                <span className="extenderRecorteCampoLabel">BPM</span>
                                <span className="extenderRecorteCampoValor">{sample.bpm}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Seccion 1: Extender recorte actual */}
                <div className="extenderRecorteSeccion">
                    <span className="extenderRecorteSubtitulo">Extender recorte actual</span>
                    <div className="extenderRecorteControles">
                        <CampoTexto
                            etiqueta="Segundos antes"
                            type="number"
                            min={0}
                            max={30}
                            step={1}
                            value={segAntes}
                            onChange={e => setSegAntes(Math.max(0, Number(e.target.value)))}
                            disabled={enviando}
                            variante="bordado"
                        />
                        <CampoTexto
                            etiqueta="Segundos después"
                            type="number"
                            min={0}
                            max={30}
                            step={1}
                            value={segDespues}
                            onChange={e => setSegDespues(Math.max(0, Number(e.target.value)))}
                            disabled={enviando}
                            variante="bordado"
                        />
                    </div>
                    <div className="extenderRecortePrevisualizacion">
                        <Badge variante="neutro" tamano="sm">
                            Duración estimada: {duracionEstimada.toFixed(1)}s
                        </Badge>
                        {duracionEstimada > 60 && (
                            <Badge variante="advertencia" tamano="sm">Máximo 60s</Badge>
                        )}
                    </div>
                    <BotonBase
                        variante="primario"
                        onClick={enviarExtension}
                        disabled={enviando || (segAntes === 0 && segDespues === 0) || duracionEstimada > 60}
                        className="extenderRecorteBoton"
                    >
                        {enviando ? 'Procesando...' : 'Extender recorte'}
                    </BotonBase>
                </div>

                {/* Separador */}
                <div className="extenderRecorteSeparador" />

                {/* Seccion 2: Generar sample siguiente (QQ130-B) */}
                <div className="extenderRecorteSeccion">
                    <span className="extenderRecorteSubtitulo">
                        <Plus size={14} /> Generar sample siguiente
                    </span>
                    <p className="extenderRecorteDescripcionSecundaria">
                        Crea un nuevo sample que empieza donde termina el actual.
                    </p>
                    <div className="extenderRecorteControles">
                        <CampoTexto
                            etiqueta="Duración del nuevo segmento (seg)"
                            type="number"
                            min={1}
                            max={60}
                            step={1}
                            value={duracionSiguiente}
                            onChange={e => setDuracionSiguiente(Math.max(1, Number(e.target.value)))}
                            disabled={enviando}
                            variante="bordado"
                        />
                    </div>
                    <BotonBase
                        variante="secundario"
                        onClick={enviarSiguiente}
                        disabled={enviando || duracionSiguiente <= 0 || duracionSiguiente > 60}
                        className="extenderRecorteBoton"
                    >
                        {enviando ? 'Generando...' : 'Generar siguiente'}
                    </BotonBase>
                </div>

                <ModalAcciones>
                    {puedeRestaurar && (
                        <BotonBase
                            variante="peligro"
                            onClick={enviarRestauracion}
                            disabled={enviando}
                            className="extenderRecorteBoton"
                        >
                            <RotateCcw size={14} />
                            {enviando ? 'Restaurando...' : 'Restaurar al original'}
                        </BotonBase>
                    )}
                    <BotonBase variante="secundario" onClick={cerrar} disabled={enviando}>
                        Cerrar
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalExtenderRecorte;
