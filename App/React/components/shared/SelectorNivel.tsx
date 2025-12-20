/*
 * SelectorNivel
 * Componente reutilizable para seleccionar niveles (prioridad, importancia, etc.)
 */

interface SelectorNivelProps<T extends string> {
    niveles: T[];
    seleccionado: T | null;
    onSeleccionar: (nivel: T) => void;
    disabled?: boolean;
}

export function SelectorNivel<T extends string>({niveles, seleccionado, onSeleccionar, disabled = false}: SelectorNivelProps<T>): JSX.Element {
    return (
        <div className="selectorNivelContenedor">
            {niveles.map(nivel => {
                const claseSufijo = nivel.charAt(0).toUpperCase() + nivel.slice(1).toLowerCase();
                return (
                    <button key={nivel} type="button" className={`selectorNivelBoton ${seleccionado === nivel ? `selectorNivelBotonActivo selectorNivelBoton${claseSufijo}` : ''}`} onClick={() => onSeleccionar(nivel)} disabled={disabled} style={{textTransform: 'capitalize'}}>
                        {nivel}
                    </button>
                );
            })}
        </div>
    );
}
