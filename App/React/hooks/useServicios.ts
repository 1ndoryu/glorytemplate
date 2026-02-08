import {useState, useMemo} from 'react';
import {SERVICIOS_DATA} from '../data/servicios';
import {Servicio} from '../types/servicios';

interface UseServiciosProps {
    initialCategory?: string;
    initialSearch?: string;
}

export const useServicios = ({initialCategory = 'todos', initialSearch = ''}: UseServiciosProps = {}) => {
    const [categoriaActiva, setCategoriaActiva] = useState(initialCategory);
    const [busqueda, setBusqueda] = useState(initialSearch);

    /* Filtrado de servicios según categoría y búsqueda */
    const serviciosFiltrados = useMemo(() => {
        return SERVICIOS_DATA.filter((servicio: Servicio) => {
            /* Filtro por categoría */
            const coincideCategoria = categoriaActiva === 'todos' || servicio.categorias.includes(categoriaActiva);

            /* Filtro por búsqueda */
            const terminoBusqueda = busqueda.toLowerCase().trim();
            const coincideBusqueda = terminoBusqueda === '' || servicio.titulo.toLowerCase().includes(terminoBusqueda) || servicio.descripcion.toLowerCase().includes(terminoBusqueda);

            return coincideCategoria && coincideBusqueda;
        });
    }, [categoriaActiva, busqueda]);

    return {
        categoriaActiva,
        setCategoriaActiva,
        busqueda,
        setBusqueda,
        serviciosFiltrados
    };
};
