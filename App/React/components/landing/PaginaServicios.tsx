import React, {useState, useEffect} from 'react';
import {Servicio} from './GridServicios';

/*
 * PaginaServicios: Vista completa de servicios con filtros avanzados.
 * Permite filtrar por texto, categoría y rango de precio.
 */

interface PaginaServiciosProps {
    servicios: Servicio[];
}

export const PaginaServicios: React.FC<PaginaServiciosProps> = ({servicios}) => {
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [precioMaximo, setPrecioMaximo] = useState<number>(10000);
    const [serviciosFiltrados, setServiciosFiltrados] = useState<Servicio[]>(servicios);

    /* Extraer categorías únicas de los servicios disponibles */
    const categorias = ['Todas', ...Array.from(new Set(servicios.map(s => s.nombre.split(' ')[0])))];
    /* Nota: Esto es una simplificación para obtener categorías. En un caso real vendrían de una propiedad 'categoria'.
       Dado que Servicio no tiene 'categoria', usaremos una lógica simple o asumiremos que se añada. 
       Mirando los datos en LandingIsland, no hay campo categoria explícito en Servicio, solo nombre.
       Pero LandingIsland tiene 'serviciosEjemplo' con objetos que tienen 'nombre'.
       Voy a usar el nombre como pseudo-categoría o añadir una propiedad opcional si pudiera, pero no puedo modificar la interfaz fácilmente sin romper otros usos.
       Mejor: Filtraré por coincidencia en nombre/descripción.
       
       Espera, 'GridServicios.tsx' define la interfaz Servicio:
       id, nombre, descripcionCorta, precioDesde, imagen.
       
       No hay campo categoría. Voy a inferir categorías o hardcodear algunas comunes basadas en los datos de ejemplo:
       "Diseño", "Desarrollo", "Marketing", "Consultoría", "SEO".
    */

    const CATEGORIAS_FILTRO = ['Todas', 'Diseño', 'Web', 'App', 'Marketing', 'Consultoría', 'SEO', 'E-commerce'];

    useEffect(() => {
        const filtrados = servicios.filter(servicio => {
            const coincideTexto = servicio.nombre.toLowerCase().includes(busqueda.toLowerCase()) || servicio.descripcionCorta.toLowerCase().includes(busqueda.toLowerCase());

            const coincidePrecio = servicio.precioDesde <= precioMaximo;

            const coincideCategoria = categoriaSeleccionada === 'Todas' || servicio.nombre.toLowerCase().includes(categoriaSeleccionada.toLowerCase());

            return coincideTexto && coincidePrecio && coincideCategoria;
        });
        setServiciosFiltrados(filtrados);
    }, [busqueda, categoriaSeleccionada, precioMaximo, servicios]);

    return (
        <div className="paginaServicios animate-fade-in">
            <header className="cabeceraServicios">
                <h1 className="tituloPaginaServicios">Explora nuestros Servicios</h1>
                <p className="subtituloPaginaServicios">Encuentra la solución perfecta para tu proyecto</p>

                <div className="barraBusquedaPrincipal">
                    <svg className="iconoBusqueda" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" placeholder="¿Qué estás buscando hoy?" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="inputBusqueda" />
                </div>
            </header>

            <div className="contenedorFiltros">
                <div className="grupoFiltros">
                    <label className="etiquetaFiltro">Categoría</label>
                    <select value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value)} className="selectFiltro">
                        {CATEGORIAS_FILTRO.map(cat => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grupoFiltros">
                    <label className="etiquetaFiltro">Presupuesto Máximo: ${precioMaximo.toLocaleString()}</label>
                    <input type="range" min="500" max="10000" step="500" value={precioMaximo} onChange={e => setPrecioMaximo(Number(e.target.value))} className="sliderFiltro" />
                </div>

                <div className="resumenResultados">{serviciosFiltrados.length} servicios disponibles</div>
            </div>

            <div className="gridResultadosServicios">
                {serviciosFiltrados.length > 0 ? (
                    serviciosFiltrados.map(servicio => (
                        <article key={servicio.id} className="tarjetaServicioPage">
                            <div className="imagenServicioWrapper">
                                <img src={servicio.imagen} alt={servicio.nombre} className="imagenServicioPage" loading="lazy" />
                            </div>
                            <div className="infoServicioPage">
                                <div className="cabeceraInfoPage">
                                    <h3 className="tituloServicioPage">{servicio.nombre}</h3>
                                    <span className="precioServicioPage">Desde ${servicio.precioDesde.toLocaleString()}</span>
                                </div>
                                <p className="descripcionServicioPage">{servicio.descripcionCorta}</p>
                                <button className="botonVerServicio">Ver detalles</button>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="sinResultados">
                        <p>No encontramos servicios que coincidan con tu búsqueda.</p>
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setCategoriaSeleccionada('Todas');
                                setPrecioMaximo(10000);
                            }}
                            className="btnLimpiarFiltros">
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
