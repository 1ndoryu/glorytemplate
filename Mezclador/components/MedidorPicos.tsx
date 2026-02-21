/*
 * MedidorPicos — Peak meter estéreo L/R (C306).
 * Componente de vista. Lógica en useMedidorPicos.
 */

import { useMedidorPicos } from '../hooks/useMedidorPicos';

interface MedidorPicosProps {
    alto?: number;
    activo: boolean;
}

export const MedidorPicos = ({ alto = 28, activo }: MedidorPicosProps): JSX.Element => {
    const { canvasRef } = useMedidorPicos(activo);

    return (
        <canvas
            ref={canvasRef}
            className="medidorPicos"
            width={12}
            height={alto}
            title="Peak meter L/R"
        />
    );
};
