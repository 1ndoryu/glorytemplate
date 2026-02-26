/*
 * Sub-componente: FormularioEditarSample — Kamples
 * Formulario de edicion de sample, extraido de ModalEditar (SRP + limite-lineas).
 * Incluye MetadataChips para mostrar info IA detectada.
 */

import { CampoTexto } from '@app/components/ui/CampoTexto';
import { Badge } from '@app/components/ui/Badge';
import { Checkbox } from '@app/components/ui/Checkbox';
import { SelectorBase } from '@app/components/ui/SelectorBase';
import type { FormularioSample } from '@app/hooks/useEditar';
import type { TipoSample, SampleResumen } from '@app/types';

const tiposSample: { valor: TipoSample; etiqueta: string }[] = [
    { valor: 'loop', etiqueta: 'Loop' },
    { valor: 'oneshot', etiqueta: 'One Shot' },
    { valor: 'fx', etiqueta: 'FX' },
    { valor: 'vocal', etiqueta: 'Vocal' },
    { valor: 'stem', etiqueta: 'Stem' },
    { valor: 'otro', etiqueta: 'Otro' },
];

/* C170: Chips informativos de metadata IA (solo lectura) */
const MetadataChips = ({ sample }: { sample: SampleResumen }): JSX.Element | null => {
    const chips: string[] = [];
    if (sample.bpm) chips.push(`${sample.bpm} BPM`);
    if (sample.key) chips.push(`${sample.key}${sample.escala === 'menor' ? 'm' : ''}`);
    if (sample.metadata?.genero) {
        const generos = Array.isArray(sample.metadata.genero)
            ? sample.metadata.genero
            : [sample.metadata.genero];
        chips.push(...generos.slice(0, 3));
    }
    if (sample.metadata?.emocionEs) chips.push(sample.metadata.emocionEs);
    if (!chips.length) return null;
    return (
        <div className="editarMetadataChips">
            <span className="editarMetadataLabel">Detectado por IA</span>
            <div className="editarChipsFila">
                {chips.map((c) => (
                    <Badge key={c} variante="neutro" tamano="xs">{c}</Badge>
                ))}
            </div>
        </div>
    );
};

interface FormularioEditarSampleProps {
    formulario: FormularioSample;
    setFormulario: React.Dispatch<React.SetStateAction<FormularioSample>>;
    sample: SampleResumen | null;
}

export const FormularioEditarSample = ({
    formulario,
    setFormulario,
    sample,
}: FormularioEditarSampleProps): JSX.Element => (
    <>
        {sample && <MetadataChips sample={sample} />}

        <CampoTexto
            etiqueta="Título"
            value={formulario.titulo}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    titulo: (e.target as HTMLInputElement).value,
                }))
            }
            placeholder="Nombre del sample"
            maxLength={200}
            autoFocus
        />

        <CampoTexto
            etiqueta="Descripción"
            value={formulario.descripcion}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    descripcion: (e.target as HTMLTextAreaElement).value,
                }))
            }
            placeholder="Descripción del sample (opcional)"
            maxLength={1000}
            multilínea
        />

        <div className="editarGrupo">
            <CampoTexto
                etiqueta="Tags"
                value={formulario.tags}
                onChange={(e) =>
                    setFormulario((prev) => ({
                        ...prev,
                        tags: (e.target as HTMLInputElement).value,
                    }))
                }
                placeholder="trap, dark, 808, ambient"
                maxLength={500}
            />
            <span className="editarTagsHint">Separados por comas. Mínimo 2 tags.</span>
        </div>

        <div className="editarFilaDoble">
            <div className="editarGrupo">
                <span className="editarGrupoLabel">Tipo</span>
                <div className="editarSelectContenedor">
                    <SelectorBase
                        className="editarSelect"
                        value={formulario.tipo}
                        onChange={(e) =>
                            setFormulario((prev) => ({
                                ...prev,
                                tipo: e.target.value as TipoSample,
                            }))
                        }
                    >
                        {tiposSample.map((t) => (
                            <option key={t.valor} value={t.valor}>
                                {t.etiqueta}
                            </option>
                        ))}
                    </SelectorBase>
                </div>
            </div>

            <CampoTexto
                etiqueta="Precio"
                value={formulario.precio}
                onChange={(e) =>
                    setFormulario((prev) => ({
                        ...prev,
                        precio: (e.target as HTMLInputElement).value,
                    }))
                }
                placeholder="0.00"
                type="number"
                disabled={!formulario.esPremium}
            />
        </div>

        <div className="editarFilaDoble">
            <Checkbox
                label="Premium"
                checked={formulario.esPremium}
                onChange={(e) =>
                    setFormulario((prev) => ({
                        ...prev,
                        esPremium: e.target.checked,
                    }))
                }
            />

            <Checkbox
                label="Permitir descarga"
                checked={formulario.permitirDescarga}
                onChange={(e) =>
                    setFormulario((prev) => ({
                        ...prev,
                        permitirDescarga: e.target.checked,
                    }))
                }
            />
        </div>
    </>
);
