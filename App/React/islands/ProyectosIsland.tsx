/**
 * Componente: ProyectosIsland
 * Página de portfolio/proyectos con grid filtrable.
 */
import React, {useState, useMemo} from 'react';
import '../styles/variables.css';
import './ProyectosIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {PROYECTOS_DATA} from '../data/showcase';
import {CATEGORIAS_PROYECTOS} from '../data/navegacion';
import {BarraFiltros} from '../components/servicios/BarraFiltros';
import {Badge} from '../components/ui/Badge';
import {obtenerImagenShowcase} from '../hooks/useImagenes';
import {Proyecto} from '../types/contenido';

interface ProyectosIslandProps {
    titulo?: string;
}

/* Componente tarjeta de proyecto individual */
const TarjetaProyecto: React.FC<{proyecto: Proyecto; indice: number}> = ({proyecto, indice}) => {
    const categorias = Array.isArray(proyecto.categorias) ? proyecto.categorias : [proyecto.categorias];

    /* Fallback a imagen showcase si el backend no resolvió la URL */
    const imagenSrc = proyecto.imagen || obtenerImagenShowcase(indice);

    return (
        <a href={proyecto.link || '#'} className="tarjetaProyecto">
            <div className="tarjetaProyectoImagen">
                <img src={imagenSrc} alt={proyecto.titulo} loading="lazy" />
            </div>
            <div className="tarjetaProyectoInfo">
                <h3 className="tarjetaProyectoTitulo">{proyecto.titulo}</h3>
                <span className="tarjetaProyectoCliente">{proyecto.cliente}</span>
                <div className="tarjetaProyectoTags">
                    {categorias.map(cat => (
                        <Badge key={cat} label={cat} />
                    ))}
                </div>
            </div>
        </a>
    );
};

export const ProyectosIsland = ({titulo = 'Nuestros Proyectos'}: ProyectosIslandProps): JSX.Element => {
    const [categoriaActiva, setCategoriaActiva] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    const proyectosFiltrados = useMemo(() => {
        return PROYECTOS_DATA.filter(p => {
            const coincideCategoria = categoriaActiva === 'todos' ||
                (Array.isArray(p.categorias) ? p.categorias.includes(categoriaActiva) : p.categorias === categoriaActiva);
            const coincideBusqueda = !busqueda ||
                p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.cliente.toLowerCase().includes(busqueda.toLowerCase());
            return coincideCategoria && coincideBusqueda;
        });
    }, [categoriaActiva, busqueda]);

    return (
        <LayoutPagina className="proyectosMain" id="paginaProyectos">
            <section className="proyectosHero">
                <div className="heroContenido">
                    <div>
                        <h1 className="heroTitulo">{titulo}</h1>
                    </div>
                    <div className="heroDescripcion">
                        <p>Cada proyecto es una historia de colaboración. Explorá nuestro trabajo y descubrí cómo transformamos ideas en experiencias digitales memorables.</p>
                    </div>
                </div>
            </section>

            <section className="proyectosContenido">
                <div className="proyectosContenedor">
                    <BarraFiltros
                        categorias={CATEGORIAS_PROYECTOS}
                        categoriaActiva={categoriaActiva}
                        busqueda={busqueda}
                        onCategoriaChange={setCategoriaActiva}
                        onBusquedaChange={setBusqueda}
                    />
                    <div className="proyectosGrid">
                        {proyectosFiltrados.map((proyecto, i) => (
                            <TarjetaProyecto key={proyecto.id} proyecto={proyecto} indice={i} />
                        ))}
                    </div>
                    {proyectosFiltrados.length === 0 && (
                        <p className="proyectosSinResultados">No se encontraron proyectos para esta categoría.</p>
                    )}
                </div>
            </section>
        </LayoutPagina>
    );
};

export default ProyectosIsland;
