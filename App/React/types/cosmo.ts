/*
 * Tipos TypeScript específicos del proyecto Cosmo Revenue
 */

/* Caso de éxito — estructura del CPT 'casos' */
export interface CasoExito {
    id: number;
    slug: string;
    titulo: string;
    extracto: string;
    contenido: string;
    imagen: string;
    meta: {
        caso_tipo: string;
        caso_ubicacion: string;
        caso_valor: string;
        caso_descripcion: string;
        caso_cliente: string;
        caso_servicios: string;
        caso_duracion: string;
        caso_cita: string;
        caso_cita_autor: string;
        caso_resultados: string;
    };
}

/* Plan de servicio (datos estáticos, propiedades en español) */
export interface PlanServicio {
    slug: string;
    nombre: string;
    subtitulo: string;
    categoria: 'marketing' | 'consultoria' | 'revenue';
    descripcion: string;
    features: string[];
    idealPara: string;
}

/* Props de las islas */
export interface LandingIslandProps {
    titulo?: string;
}

export interface ServiciosIslandProps {
    titulo?: string;
}

export interface ServicioDetalleIslandProps {
    planKey: string;
}

export interface CasosIslandProps {
    titulo?: string;
}

export interface AboutIslandProps {
    titulo?: string;
}

export interface ContactoIslandProps {
    titulo?: string;
}

/* Paso de la metodología COSMO */
export interface PasoCosmo {
    letra: string;
    titulo: string;
    subtitulo: string;
    descripcion: string;
}

/* Info de contacto */
export interface InfoContacto {
    icono: string;
    titulo: string;
    texto: string;
}

/* Tarjeta flip */
export interface TarjetaFlipData {
    titulo: string;
    descripcionReverso: string;
    imagenUrl: string;
    temaOscuro?: boolean;
}

/* Tarjeta de servicio/feature */
export interface TarjetaServicioData {
    icono: string;
    titulo: string;
    subtitulo: string;
    descripcion: string;
    features: string[];
    ctaTexto: string;
    ctaUrl: string;
}
