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
import { useT } from '@app/utils/i18n/useT';
import { Sparkles } from 'lucide-react';
import '../../styles/componentes/modalCorregirIA.css';

export const ModalCorregirIA = (): JSX.Element | null => {
    const { t } = useT();
    const abierto = useCorregirIAStore(s => s.abierto);
    const sample = useCorregirIAStore(s => s.sample);
    const cerrar = useCorregirIAStore(s => s.cerrar);

    const { instrucciones, setInstrucciones, enviando, enviar } = useCorregirIA();

    if (!abierto || !sample) return null;

    /* Metadata actual para contexto visual */
    const metaActual = sample.metadata ?? {};
    const camposActuales = [
        { clave: t('sample.form.titulo'), valor: sample.titulo },
        { clave: t('sample.form.tags'), valor: Array.isArray(sample.tags) ? sample.tags.join(', ') : '' },
        { clave: 'BPM', valor: sample.bpm?.toString() ?? 'N/A' },
        { clave: 'Key', valor: sample.key ?? 'N/A' },
        { clave: t('metadata.generos'), valor: Array.isArray(metaActual.genero) ? (metaActual.genero as string[]).join(', ') : 'N/A' },
        { clave: t('metadata.emocion'), valor: typeof metaActual.emocion === 'string' ? metaActual.emocion : 'N/A' },
    ];

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="normal">
            <div className="corregirIAContenedor">
                <div className="corregirIACabecera">
                    <Sparkles size={20} className="corregirIAIcono" />
                    <h3 className="corregirIATitulo">{t('metadata.corregirIaTitle')}</h3>
                </div>

                <p className="corregirIADescripcion">
                    {t('metadata.corregirIaDesc')}
                </p>

                {/* Metadata actual como referencia */}
                <div className="corregirIAMetadataActual">
                    <span className="corregirIASubtitulo">{t('metadata.actual')}</span>
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
                        {t('metadata.instruccionesCorreccion')}
                    </label>
                    <textarea
                        id="instrucciones-ia"
                        className="corregirIATextarea"
                        placeholder={t('metadata.instruccionesPlaceholder')}
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
                        {t('comun.cancelar')}
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={enviar}
                        disabled={enviando || instrucciones.trim().length < 5}
                    >
                        {enviando ? t('metadata.corrigiendo') : t('metadata.enviarCorreccion')}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalCorregirIA;
