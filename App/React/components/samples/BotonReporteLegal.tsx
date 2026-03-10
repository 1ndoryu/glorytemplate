/*
 * Componente: BotonReporteLegal
 * Boton de icono (escudo) que abre el ModalReporteLegal.
 * No requiere autenticacion; disponible para cualquier visitante.
 * Uso: <BotonReporteLegal tipo="legal_sample" targetId={sampleId} descripcion={titulo} />
 */

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ModalReporteLegal } from './ModalReporteLegal';
import type { DatosReporteLegal } from '../../services/apiReporteLegal';
import '../../styles/componentes/botonReporteLegal.css';

interface BotonReporteLegalProps {
    tipo: DatosReporteLegal['tipo'];
    targetId: number;
    descripcion?: string;
    className?: string;
}

export function BotonReporteLegal({
    tipo,
    targetId,
    descripcion,
    className = '',
}: BotonReporteLegalProps): JSX.Element {
    const [abierto, setAbierto] = useState(false);

    return (
        <>
            <button
                type="button"
                className={`botonReporteLegal ${className}`}
                onClick={() => setAbierto(true)}
                title="Reclamar derechos de autor (DMCA)"
                aria-label="Abrir formulario de reclamacion legal"
            >
                <ShieldAlert size={14} />
                <span className="botonReporteLegalTexto">Reclamar derechos</span>
            </button>

            <ModalReporteLegal
                abierto={abierto}
                tipo={tipo}
                targetId={targetId}
                descripcionTarget={descripcion}
                onCerrar={() => setAbierto(false)}
            />
        </>
    );
}
