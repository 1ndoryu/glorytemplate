export interface Servicio {
    id: string;
    titulo: string;
    descripcion: string;
    imagen: string;
    categorias: string[];
    link: string;
    cta?: {
        titulo: string;
        descripcion: string;
        precio: string;
        botones: {
            primario: string;
            secundario: string;
        };
    };
}
