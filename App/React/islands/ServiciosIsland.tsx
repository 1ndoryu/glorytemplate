/**
 * Componente: ServiciosIsland
 * Página completa de Servicios con grid filtrable.
 * Categorías centralizadas en data/navegacion.ts (DRY).
 */
import React from 'react';
import '../styles/variables.css';
import './ServiciosIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {BarraFiltros} from '../components/servicios/BarraFiltros';
import {GridServicios} from '../components/servicios/GridServicios';
import {useServicios} from '../hooks/useServicios';
import {CATEGORIAS_SERVICIOS} from '../data/navegacion';

interface ServiciosIslandProps {
    titulo?: string;
}

export const ServiciosIsland = ({titulo = 'Nuestros Servicios'}: ServiciosIslandProps): JSX.Element => {
    const {categoriaActiva, setCategoriaActiva, busqueda, setBusqueda, serviciosFiltrados} = useServicios();

    return (
        <LayoutPagina className="serviciosMain" id="paginaServicios">
            <section className="serviciosHero">
                <div className="heroContenido">
                    <div>
                        <h1 className="heroTitulo">{titulo}</h1>
                    </div>

                    <div className="heroDescripcion">
                        <p>Ofrecemos servicios integrales que combinan creatividad y tecnología para transformar tu visión en productos digitales excepcionales.</p>
                    </div>
                </div>
            </section>

            <section className="serviciosContenido">
                <div className="serviciosContenedor">
                    <BarraFiltros categorias={CATEGORIAS_SERVICIOS} categoriaActiva={categoriaActiva} busqueda={busqueda} onCategoriaChange={setCategoriaActiva} onBusquedaChange={setBusqueda} />
                    <GridServicios servicios={serviciosFiltrados} />
                </div>
            </section>
        </LayoutPagina>
    );
};

export default ServiciosIsland;
