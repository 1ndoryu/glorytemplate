/*
 * Sub-componente: FormularioEditarColeccion — Kamples
 * Formulario de edicion de coleccion, extraido de ModalEditar (SRP + limite-lineas).
 */

import { CampoTexto } from '@app/components/ui/CampoTexto';
import { Checkbox } from '@app/components/ui/Checkbox';
import type { FormularioColeccion } from '@app/hooks/useEditar';

interface FormularioEditarColeccionProps {
    formulario: FormularioColeccion;
    setFormulario: React.Dispatch<React.SetStateAction<FormularioColeccion>>;
}

export const FormularioEditarColeccion = ({
    formulario,
    setFormulario,
}: FormularioEditarColeccionProps): JSX.Element => (
    <>
        <CampoTexto
            etiqueta="Nombre"
            value={formulario.nombre}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    nombre: (e.target as HTMLInputElement).value,
                }))
            }
            placeholder="Mi colección..."
            maxLength={100}
            autoFocus
        />

        <CampoTexto
            etiqueta="Descripción"
            value={formulario.descripcion}
            onChange={(e) =>
                setFormulario((prev) => ({
                    ...prev,
                    descripcion: (e.target as unknown as HTMLTextAreaElement).value,
                }))
            }
            placeholder="Descripción (opcional)"
            maxLength={300}
        />

        <Checkbox
            label="Colección pública"
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
