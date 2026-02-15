/*
 * Sección Showcase: Espaciados y Tipografía.
 * Muestra el sistema de espaciado y tamaños tipográficos del design system.
 */

const ESPACIADOS = [
    { nombre: 'Xs', variable: '--espacioXs', px: 4 },
    { nombre: 'Sm', variable: '--espacioSm', px: 8 },
    { nombre: 'Md', variable: '--espacioMd', px: 12 },
    { nombre: 'Lg', variable: '--espacioLg', px: 16 },
    { nombre: 'Xl', variable: '--espacioXl', px: 20 },
    { nombre: '2xl', variable: '--espacio2xl', px: 32 },
    { nombre: '3xl', variable: '--espacio3xl', px: 48 },
];

const FUENTES = [
    { nombre: 'Xs', variable: '--fuenteXs', px: 9 },
    { nombre: 'Sm', variable: '--fuenteSm', px: 11 },
    { nombre: 'Md', variable: '--fuenteMd', px: 14 },
    { nombre: 'Lg', variable: '--fuenteLg', px: 18 },
    { nombre: 'Xl', variable: '--fuenteXl', px: 24 },
    { nombre: '2xl', variable: '--fuente2xl', px: 32 },
    { nombre: '3xl', variable: '--fuente3xl', px: 40 },
];

export const ShowcaseEspaciados = (): JSX.Element => (
    <>
        <section className="showcaseSeccion">
            <h2 className="showcaseSeccionTitulo">Espaciados</h2>
            <p className="showcaseSeccionDesc">Sistema de espaciado escalable.</p>
            <div className="showcaseEspaciados">
                {ESPACIADOS.map((e) => (
                    <div className="showcaseEspaciadoItem" key={e.variable}>
                        <div
                            className="showcaseEspaciadoBloque"
                            style={{ '--tamano': `${e.px}px` } as React.CSSProperties}
                        />
                        <span className="showcaseColorNombre">{e.nombre} ({e.px}px)</span>
                    </div>
                ))}
            </div>
        </section>

        <section className="showcaseSeccion">
            <h2 className="showcaseSeccionTitulo">Tipografía</h2>
            <div className="showcaseTipos">
                {FUENTES.map((f) => (
                    <div className="showcaseTipoItem" key={f.variable}>
                        <span className="showcaseTipoLabel">{f.nombre} ({f.px}px)</span>
                        <span style={{ '--tamanoFuente': `${f.px}px` } as React.CSSProperties} className="showcaseTextoTipografia">Kamples Audio Platform</span>
                    </div>
                ))}
            </div>
        </section>
    </>
);
