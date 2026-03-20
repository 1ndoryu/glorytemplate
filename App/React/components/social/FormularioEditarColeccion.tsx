/*
 * Sub-componente: FormularioEditarColeccion — Kamples
 * Formulario de edicion de coleccion, extraido de ModalEditar (SRP + limite-lineas).
 */

import { CampoTexto } from '@app/components/ui/CampoTexto';
import { Checkbox } from '@app/components/ui/Checkbox';
import { useT } from '@app/utils/i18n/useT';
import type { FormularioColeccion } from '@app/hooks/useEditar';

interface FormularioEditarColeccionProps {
    formulario: FormularioColeccion;
    setFormulario: React.Dispatch<React.SetStateAction<FormularioColeccion>>;
}

export const FormularioEditarColeccion = ({
    formulario,
    setFormulario,
}: FormularioEditarColeccionProps): JSX.Element => {
    const { t } = useT();
    return (
    <>
        <CampoTexto
            etiqueta={t('coleccion.nombre')}
            value={formulario.nombre}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    nombre: (e.target as HTMLInputElement).value,
                }))
            }
            placeholder={t('coleccion.nombrePlaceholder')}
            maxLength={100}
            autoFocus
        />

        <CampoTexto
            etiqueta={t('coleccion.descripcion')}
            value={formulario.descripcion}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    descripcion: (e.target as unknown as HTMLTextAreaElement).value,
                }))
            }
            placeholder={t('coleccion.descripcionPlaceholder')}
            maxLength={300}
        />

        <Checkbox
            label={t('coleccion.publica')}
            checked={formulario.esPublica}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    esPublica: e.target.checked,
                }))
            }
        />
    </>
    );
};
