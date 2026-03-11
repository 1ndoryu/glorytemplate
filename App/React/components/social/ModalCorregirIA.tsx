/*
 * Componente: ModalCorregirIA — Kamples (C800)
 * Modal para corregir metadata generada por IA en samples extraidos del pipeline.
 * El admin ingresa instrucciones de correccion y el backend re-procesa.
 * Logica en useCorregirIA (SRP).
 */

import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { Badge } from '@app/components/ui/Badge';
import { useCorregirIAStore } from '@app/stores/corregirIAStore';
import { useCorregirIA } from '@app/hooks/useCorregirIA';
import { Sparkles } from 'lucide-react';
import '../../styles/componentes/modalCorregirIA.css';

export const ModalCorregirIA = (): JSX.Element | null => {
    const abierto = useCorregirIAStore(s => s.abierto);
    const sample = useCorregirIAStore(s => s.sample);
    const cerrar = useCorregirIAStore(s => s.cerrar);

    const { instrucciones, setInstrucciones, enviando, enviar } = useCorregirIA();

    if (!abierto || !sample) return null;

    /* Metadata actual para contexto visual */
    const metaActual = sample.metadata ?? {};
    const camposActuales = [
        { clave: 'Titulo', valor: sample.titulo },
        { clave: 'Tags', valor: Array.isArray(sample.tags) ? sample.tags.join(', ') : '' },
        { clave: 'BPM', valor: sample.bpm?.toString() ?? 'N/A' },
        { clave: 'Key', valor: sample.key ?? 'N/A' },
        { clave: 'Genero', valor: Array.isArray(metaActual.genero) ? (metaActual.genero as string[]).join(', ') : 'N/A' },
        { clave: 'Emocion', valor: typeof metaActual.emocion === 'string' ? metaActual.emocion : 'N/A' },
    ];

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="normal">
            <div className="corregirIAContenedor">
                <div className="corregirIACabecera">
                    <Sparkles size={20} className="corregirIAIcono" />
                    <h3 className="corregirIATitulo">Corregir metadata IA</h3>
                </div>

                <p className="corregirIADescripcion">
                    Este sample fue generado automaticamente. Si la IA cometio errores en el titulo,
                    tags, genero u otros datos, escribe las correcciones necesarias.
                </p>

                {/* Metadata actual como referencia */}
                <div className="corregirIAMetadataActual">
                    <span className="corregirIASubtitulo">Metadata actual</span>
                    <div className="corregirIACampos">
                        {camposActuales.map(c => (
                            <div key={c.clave} className="corregirIACampo">
                                <span className="corregirIACampoLabel">{c.clave}</span>
                                <span className="corregirIACampoValor">{c.valor || '—'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input de instrucciones */}
                <div className="corregirIAGrupo">
                    <label className="corregirIALabel" htmlFor="instrucciones-ia">
                        Instrucciones de correccion
                    </label>
                    <textarea
                        id="instrucciones-ia"
                        className="corregirIATextarea"
                        placeholder="Ej: El titulo correcto es 'Artista - Cancion'. El genero es hip-hop, no jazz. Los tags deberian incluir 'boom bap'..."
                        value={instrucciones}
                        onChange={e => setInstrucciones(e.target.value)}
                        rows={4}
                        maxLength={1000}
                        disabled={enviando}
                    />
                    <div className="corregirIAContador">
                        <Badge variante="neutro" tamano="xs">{instrucciones.length}/1000</Badge>
                    </div>
                </div>

                <ModalAcciones>
                    <BotonBase variante="secundario" onClick={cerrar} disabled={enviando}>
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={enviar}
                        disabled={enviando || instrucciones.trim().length < 5}
                    >
                        {enviando ? 'Corrigiendo...' : 'Enviar correccion'}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalCorregirIA;
