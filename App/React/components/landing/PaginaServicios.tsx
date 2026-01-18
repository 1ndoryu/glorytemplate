import React, {useState, useEffect, useRef} from 'react';
import {Servicio} from './GridServicios';
import {TarjetaServicio} from './TarjetaServicio';

/*
 * PaginaServicios: Vista completa de servicios
 * Refactorizado para usar TarjetaServicio y diseño consistente con landing
 */

interface PaginaServiciosProps {
    servicios: Servicio[];
}

export const PaginaServicios: React.FC<PaginaServiciosProps> = ({servicios}) => {
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [precioMaximo, setPrecioMaximo] = useState<number>(10000);
    const [mostrandoFiltroPrecio, setMostrandoFiltroPrecio] = useState(false);
    const [mostrandoFiltroCategoria, setMostrandoFiltroCategoria] = useState(false);

    const [serviciosFiltrados, setServiciosFiltrados] = useState<Servicio[]>(servicios);

    // Refs para cerrar dropdowns al clicar fuera
    const precioRef = useRef<HTMLDivElement>(null);
    const categoriaRef = useRef<HTMLDivElement>(null);

    const CATEGORIAS_FILTRO = ['Todas', 'Diseño', 'Web', 'App', 'Marketing', 'Consultoría', 'SEO', 'E-commerce'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (precioRef.current && !precioRef.current.contains(event.target as Node)) {
                setMostrandoFiltroPrecio(false);
            }
            if (categoriaRef.current && !categoriaRef.current.contains(event.target as Node)) {
                setMostrandoFiltroCategoria(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                <h1 className="tituloPaginaServicios">Servicios</h1>

                <div className="barraBusquedaCompacta">
                    <svg className="iconoBusqueda" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" placeholder="Buscar servicios..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="inputBusqueda" />
                </div>
            </header>

            <div className="barraHerramientas">
                <div className="grupoFiltros">
                    {/* Filtro Categoría */}
                    <div className="filtroItem" ref={categoriaRef}>
                        <button className={`botonFiltro ${categoriaSeleccionada !== 'Todas' ? 'activo' : ''}`} onClick={() => setMostrandoFiltroCategoria(!mostrandoFiltroCategoria)}>
                            {categoriaSeleccionada === 'Todas' ? 'Categoría' : categoriaSeleccionada}
                            <span className="flechaFiltro">▼</span>
                        </button>

                        {mostrandoFiltroCategoria && (
                            <div className="menuFiltro">
                                {CATEGORIAS_FILTRO.map(cat => (
                                    <button
                                        key={cat}
                                        className={`opcionCategoria ${categoriaSeleccionada === cat ? 'seleccionada' : ''}`}
                                        onClick={() => {
                                            setCategoriaSeleccionada(cat);
                                            setMostrandoFiltroCategoria(false);
                                        }}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filtro Precio */}
                    <div className="filtroItem" ref={precioRef}>
                        <button className={`botonFiltro ${precioMaximo < 10000 ? 'activo' : ''}`} onClick={() => setMostrandoFiltroPrecio(!mostrandoFiltroPrecio)}>
                            {precioMaximo < 10000 ? `Max: $${precioMaximo}` : 'Presupuesto'}
                            <span className="flechaFiltro">▼</span>
                        </button>

                        {mostrandoFiltroPrecio && (
                            <div className="menuFiltro">
                                <div className="contenedorSliderPrecio">
                                    <div className="etiquetaPrecio">
                                        <span>$0</span>
                                        <span>${precioMaximo.toLocaleString()}</span>
                                    </div>
                                    <input type="range" min="0" max="10000" step="500" value={precioMaximo} onChange={e => setPrecioMaximo(Number(e.target.value))} className="sliderPrecio" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="resumenResultados">{serviciosFiltrados.length} servicios</div>
            </div>

            <div className="gridResultados">
                {serviciosFiltrados.length > 0 ? (
                    serviciosFiltrados.map(servicio => <TarjetaServicio key={servicio.id} servicio={servicio} />)
                ) : (
                    <div className="sinResultados">
                        <p>No se encontraron servicios.</p>
                        <button
                            onClick={() => {
                                setBusqueda('');
                                setCategoriaSeleccionada('Todas');
                                setPrecioMaximo(10000);
                            }}
                            className="btnLimpiar">
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
