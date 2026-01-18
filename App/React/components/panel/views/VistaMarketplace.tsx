import React, {useState, useEffect} from 'react';
import {TarjetaServicio} from '../../landing/TarjetaServicio';
import {usePanel} from '../../../context/PanelContext';
import {Servicio} from '../../landing/GridServicios';
import {InputBusqueda} from '../../ui/InputBusqueda';
import {DropdownMinimal} from '../../ui/DropdownMinimal';

/**
 * VistaMarketplace: Catálogo de servicios disponibles en el panel.
 * Reutiliza TarjetaServicio y agrega lógica de filtrado del sistema.
 */
export const VistaMarketplace: React.FC = () => {
    const {servicios} = usePanel();

    // Estados de filtrado y búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [precioMaximo, setPrecioMaximo] = useState<number>(10000);
    const [mostrandoFiltroPrecio, setMostrandoFiltroPrecio] = useState(false);
    const [mostrandoFiltroCategoria, setMostrandoFiltroCategoria] = useState(false);
    const [serviciosFiltrados, setServiciosFiltrados] = useState<Servicio[]>([]);

    const CATEGORIAS_FILTRO = ['Todas', 'Diseño', 'Web', 'App', 'Marketing', 'Consultoría', 'SEO', 'E-commerce'];

    // Lógica de filtrado
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
        <div className="marketplaceView animate-fade-in">
            <header className="marketplaceHeader">
                <div className="titleArea">
                    <h2 className="marketplaceTitulo">Marketplace</h2>
                    <p className="marketplaceSubtitulo">Explora y contrata servicios digitales premium.</p>
                </div>

                <div className="barraBusquedaCompacta">
                    <InputBusqueda placeholder="Buscar servicios..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
            </header>

            <div className="barraHerramientas">
                <div className="grupoFiltros">
                    {/* Filtro Categoría */}
                    <DropdownMinimal etiqueta={categoriaSeleccionada === 'Todas' ? 'Categoría' : categoriaSeleccionada} estaAbierto={mostrandoFiltroCategoria} onToggle={() => setMostrandoFiltroCategoria(!mostrandoFiltroCategoria)} onCerrar={() => setMostrandoFiltroCategoria(false)} activo={categoriaSeleccionada !== 'Todas'} anchoMenu="180px">
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

            <div className="marketplaceGrid">
                {serviciosFiltrados.length > 0 ? (
                    serviciosFiltrados.map(s => <TarjetaServicio key={s.id} servicio={s} />)
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
