import React, {useState, useEffect, useRef} from 'react';
import {Servicio} from './GridServicios';
import {TarjetaServicio} from './TarjetaServicio';
import {DropdownMinimal} from '../ui/DropdownMinimal';
import {InputBusqueda} from '../ui/InputBusqueda';
import {Boton} from '../ui/Boton';

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

    useEffect(() => {
        const filtrados = servicios.filter(servicio => {
            const coincideTexto = servicio.nombre.toLowerCase().includes(busqueda.toLowerCase()) || servicio.descripcionCorta.toLowerCase().includes(busqueda.toLowerCase());

            const coincidePrecio = servicio.precioDesde <= precioMaximo;

            const coincideCategoria = categoriaSeleccionada === 'Todas' || servicio.nombre.toLowerCase().includes(categoriaSeleccionada.toLowerCase());

            return coincideTexto && coincidePrecio && coincideCategoria;
        });
        setServiciosFiltrados(filtrados);
    }, [busqueda, categoriaSeleccionada, precioMaximo, servicios]);

    const CATEGORIAS_FILTRO = ['Todas', 'Diseño', 'Web', 'App', 'Marketing', 'Consultoría', 'SEO', 'E-commerce'];

    return (
        <div className="paginaServicios animate-fade-in">
            <header className="cabeceraServicios">
                <h1 className="tituloPaginaServicios">Servicios</h1>

                <div className="barraBusquedaCompacta">
                    <InputBusqueda placeholder="Buscar servicios..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
            </header>

            <div className="barraHerramientas">
                <div className="grupoFiltros">
                    {/* Filtro Categoría */}
                    <DropdownMinimal etiqueta={categoriaSeleccionada === 'Todas' ? 'Categoría' : categoriaSeleccionada} estaAbierto={mostrandoFiltroCategoria} onToggle={() => setMostrandoFiltroCategoria(!mostrandoFiltroCategoria)} onCerrar={() => setMostrandoFiltroCategoria(false)} activo={categoriaSeleccionada !== 'Todas'} anchoMenu="180px">
                        {CATEGORIAS_FILTRO.map(cat => (
                            <Boton
                                key={cat}
                                variante="ghost"
                                bloque
                                className={`opcionCategoria ${categoriaSeleccionada === cat ? 'seleccionada' : ''}`}
                                onClick={() => {
                                    setCategoriaSeleccionada(cat);
                                    setMostrandoFiltroCategoria(false);
                                }}>
                                {cat}
                            </Boton>
                        ))}
                    </DropdownMinimal>

                    {/* Filtro Precio */}
                    <DropdownMinimal etiqueta={precioMaximo < 10000 ? `Max: $${precioMaximo}` : 'Presupuesto'} estaAbierto={mostrandoFiltroPrecio} onToggle={() => setMostrandoFiltroPrecio(!mostrandoFiltroPrecio)} onCerrar={() => setMostrandoFiltroPrecio(false)} activo={precioMaximo < 10000} anchoMenu="220px">
                        <div className="contenedorSliderPrecio">
                            <div className="etiquetaPrecio">
                                <span>$0</span>
                                <span>${precioMaximo.toLocaleString()}</span>
                            </div>
                            <input type="range" min="0" max="10000" step="500" value={precioMaximo} onChange={e => setPrecioMaximo(Number(e.target.value))} className="sliderPrecio" />
                        </div>
                    </DropdownMinimal>
                </div>

                <div className="resumenResultados">{serviciosFiltrados.length} servicios</div>
            </div>

            <div className="gridResultados">
                {serviciosFiltrados.length > 0 ? (
                    serviciosFiltrados.map(servicio => <TarjetaServicio key={servicio.id} servicio={servicio} />)
                ) : (
                    <div className="sinResultados">
                        <p>No se encontraron servicios.</p>
                        <Boton
                            onClick={() => {
                                setBusqueda('');
                                setCategoriaSeleccionada('Todas');
                                setPrecioMaximo(10000);
                            }}
                            variante="outline">
                            Limpiar filtros
                        </Boton>
                    </div>
                )}
            </div>
        </div>
    );
};
