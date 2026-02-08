/*
 * Datos de contacto centralizados.
 * Fuente única de verdad para email, teléfono, ubicación y redes sociales.
 * Se usa en ContactoIsland, Footer y cualquier lugar que muestre info de contacto.
 */

export interface RedSocial {
    nombre: string;
    url: string;
}

export interface InfoContacto {
    email: string;
    telefono: string;
    ubicacion: string;
    ubicacionDetalle: string;
    redesSociales: RedSocial[];
}

export const INFO_CONTACTO: InfoContacto = {
    email: 'hello@nakomi.studio',
    telefono: '+34 612 345 678',
    ubicacion: 'Madrid, España',
    ubicacionDetalle: 'Disponibles mundialmente. Oficina en Madrid, España.',
    redesSociales: [
        {nombre: 'LinkedIn', url: 'https://linkedin.com/company/nakomi'},
        {nombre: 'Twitter', url: 'https://twitter.com/nakomi'},
        {nombre: 'Dribbble', url: 'https://dribbble.com/nakomi'},
    ]
};
