/*
 * TarjetaCarpeta — Kamples (C349)
 * Tarjeta visual para representar una carpeta en el explorador tipo file manager.
 * Click para navegar dentro de la carpeta. Soporta drag-drop.
 */

import { Folder } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';

interface TarjetaCarpetaProps {
    nombre: string;
    totalItems: number;
    esDragOver?: boolean;
    onClick: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
}

export const TarjetaCarpeta = ({
    nombre,
    totalItems,
    esDragOver = false,
    onClick,
    onDragOver,
    onDragLeave,
    onDrop,
}: TarjetaCarpetaProps): JSX.Element => (
    <BotonBase
        variante="ghost"
        className={`tarjetaCarpeta ${esDragOver ? 'tarjetaCarpetaDragOver' : ''}`}
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        type="button"
    >
        <div className="tarjetaCarpetaIcono">
            <Folder size={32} />
        </div>
        <span className="tarjetaCarpetaNombre">{nombre}</span>
        <span className="tarjetaCarpetaConteo">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
    </BotonBase>
);
