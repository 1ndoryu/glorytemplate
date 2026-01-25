import React from 'react';

/*
 * Boton - Componente reutilizable de botón
 *
 * Variantes: solid, outline, ghost, link, acento
 * Tamaños: sm, md, lg
 * Extras: bloque (full width), pill (bordes redondeados)
 *
 * Este componente reemplaza las siguientes clases CSS obsoletas (ya eliminadas):
 * manifiestoBoton, ecosistemaBotonVer, serviciosBotonVer,
 * blogBotonVer, blogLeerMas, resenasBotonVer, resenaBotonProyecto
 *
 * TO-DO: navegacionBotonLogin todavía necesita estilos específicos en landing.css
 * Considerar crear una variante 'invertido' para botones con fondo claro.
 */

type VarianteBoton = 'solid' | 'outline' | 'ghost' | 'link' | 'acento';
type TamanoBoton = 'sm' | 'md' | 'lg';

interface BotonProps {
    children?: React.ReactNode;
    variante?: VarianteBoton;
    tamano?: TamanoBoton;
    href?: string;
    onClick?: (e: React.MouseEvent) => void;
    bloque?: boolean;
    pill?: boolean;
    disabled?: boolean;
    cargando?: boolean;
    icono?: React.ReactNode;
    iconoPosicion?: 'inicio' | 'fin';
    className?: string;
    tipo?: 'button' | 'submit' | 'reset';
    target?: '_blank' | '_self' | '_parent' | '_top';
}

const mapeoTamano: Record<TamanoBoton, string> = {
    sm: 'botonSm',
    md: 'botonMd',
    lg: 'botonLg'
};

const mapeoVariante: Record<VarianteBoton, string> = {
    solid: 'botonSolid',
    outline: 'botonOutline',
    ghost: 'botonGhost',
    link: 'botonLink',
    acento: 'botonAcento'
};

export const Boton = React.forwardRef<HTMLButtonElement & HTMLAnchorElement, BotonProps>(({children, variante = 'outline', tamano = 'md', href, onClick, bloque = false, pill = false, disabled = false, cargando = false, icono, iconoPosicion = 'inicio', className = '', tipo = 'button', target}, ref) => {
    const clases = ['boton', mapeoTamano[tamano], mapeoVariante[variante], bloque && 'botonBloque', pill && 'botonPill', disabled && 'botonDisabled', cargando && 'botonCargando', className].filter(Boolean).join(' ');

    const contenido = (
        <>
            {icono && iconoPosicion === 'inicio' && <span className="botonIcono">{icono}</span>}
            {children}
            {icono && iconoPosicion === 'fin' && <span className="botonIcono">{icono}</span>}
        </>
    );

    /* Si tiene href, renderiza como enlace */
    if (href) {
        return (
            <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={clases} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} onClick={disabled ? e => e.preventDefault() : onClick}>
                {contenido}
            </a>
        );
    }

    /* Si no tiene href, renderiza como botón */
    return (
        <button ref={ref as React.Ref<HTMLButtonElement>} type={tipo} className={clases} onClick={onClick} disabled={disabled || cargando}>
            {contenido}
        </button>
    );
});

export default Boton;
