/*
 * ShowcaseIsland — Kamples
 * Galería visual interactiva de todos los componentes del design system.
 * Ruta: /dev/componentes
 */

import { useState, useCallback } from 'react';
import {
    BotonBase,
    Badge,
    Modal,
    InputBusqueda,
    ContenedorNotificaciones,
    crearToast,
    Avatar,
    CampoTexto,
    TabBar,
    DropZone,
    BarraProgreso,
    MenuContextual,
} from '@app/components/ui';
import type { DatosToast, TabDefinicion, MenuItemDef } from '@app/components/ui';
import {
    Music,
    Heart,
    Download,
    Share2,
    Trash2,
    Edit3,
    Star,
    Headphones,
    Layers,
    Zap,
} from 'lucide-react';
import '../../styles/componentes/showcase.css';

/* Paleta de colores del design system para mostrar visualmente */
const COLORES_PALETA = [
    { nombre: '--fondoBase', valor: '#050505' },
    { nombre: '--fondoElevado1', valor: '#0a0a0a' },
    { nombre: '--fondoElevado2', valor: '#111111' },
    { nombre: '--fondoElevado3', valor: '#1a1a1a' },
    { nombre: '--acento', valor: '#7c3aed' },
    { nombre: '--acentoHover', valor: '#6d28d9' },
    { nombre: '--acentoTexto', valor: '#a78bfa' },
    { nombre: '--exito', valor: '#22c55e' },
    { nombre: '--error', valor: '#ef4444' },
    { nombre: '--advertencia', valor: '#f59e0b' },
    { nombre: '--info', valor: '#3b82f6' },
    { nombre: '--textoPrimario', valor: '#e5e5e5' },
    { nombre: '--textoSecundario', valor: '#888888' },
    { nombre: '--textoTerciario', valor: '#555555' },
    { nombre: '--bordeSutil', valor: '#1f1f1f' },
    { nombre: '--bordeActivo', valor: '#333333' },
];

const ESPACIADOS = [
    { nombre: 'Xs', variable: '--espacioXs', px: 4 },
    { nombre: 'Sm', variable: '--espacioSm', px: 8 },
    { nombre: 'Md', variable: '--espacioMd', px: 12 },
    { nombre: 'Lg', variable: '--espacioLg', px: 16 },
    { nombre: 'Xl', variable: '--espacioXl', px: 20 },
    { nombre: '2xl', variable: '--espacio2xl', px: 32 },
    { nombre: '3xl', variable: '--espacio3xl', px: 48 },
];

const FUENTES = [
    { nombre: 'Xs', variable: '--fuenteXs', px: 9 },
    { nombre: 'Sm', variable: '--fuenteSm', px: 11 },
    { nombre: 'Md', variable: '--fuenteMd', px: 14 },
    { nombre: 'Lg', variable: '--fuenteLg', px: 18 },
    { nombre: 'Xl', variable: '--fuenteXl', px: 24 },
    { nombre: '2xl', variable: '--fuente2xl', px: 32 },
    { nombre: '3xl', variable: '--fuente3xl', px: 40 },
];

const TABS_DEMO: TabDefinicion[] = [
    { id: 'samples', etiqueta: 'Samples', icono: <Music size={14} />, contador: 128 },
    { id: 'packs', etiqueta: 'Packs', icono: <Layers size={14} />, contador: 12 },
    { id: 'favoritos', etiqueta: 'Favoritos', icono: <Heart size={14} />, contador: 45 },
    { id: 'activos', etiqueta: 'Activos', icono: <Zap size={14} /> },
];

const ITEMS_MENU_DEMO: MenuItemDef[] = [
    { id: 'editar', etiqueta: 'Editar', icono: <Edit3 size={14} />, onClick: () => {} },
    { id: 'descargar', etiqueta: 'Descargar', icono: <Download size={14} />, onClick: () => {} },
    { id: 'compartir', etiqueta: 'Compartir', icono: <Share2 size={14} />, separadorDespues: true, onClick: () => {} },
    { id: 'eliminar', etiqueta: 'Eliminar', icono: <Trash2 size={14} />, peligro: true, onClick: () => {} },
];

export const ShowcaseIsland = (): JSX.Element => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('samples');
    const [toasts, setToasts] = useState<DatosToast[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [campoTexto, setCampoTexto] = useState('');
    const [campoArea, setCampoArea] = useState('');

    const agregarToast = useCallback((tipo: 'exito' | 'error' | 'advertencia' | 'info') => {
        const mensajes: Record<string, { titulo: string; mensaje: string }> = {
            exito: { titulo: 'Sample subido', mensaje: 'Tu sample se procesó correctamente.' },
            error: { titulo: 'Error de carga', mensaje: 'No se pudo procesar el archivo.' },
            advertencia: { titulo: 'Formato no soportado', mensaje: 'Intenta con WAV o FLAC.' },
            info: { titulo: 'Nuevo seguidor', mensaje: '@productor_42 te sigue.' },
        };
        const { titulo, mensaje } = mensajes[tipo];
        const nuevoToast = crearToast(tipo, titulo, mensaje);
        setToasts((prev) => [...prev, nuevoToast]);
    }, []);

    const cerrarToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const abrirMenuContextual = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuAbierto(true);
    };

    return (
        <div className="showcaseContenedor" id="seccionShowcase">
            <h1 className="showcaseTitulo">Kamples — Design System</h1>
            <p className="showcaseSubtitulo">
                Galería visual de componentes. Revisa cada elemento antes de integrarlo.
            </p>

            {/* ==== ESPACIADOS ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Espaciados</h2>
                <p className="showcaseSeccionDesc">Sistema de espaciado escalable.</p>
                <div className="showcaseEspaciados">
                    {ESPACIADOS.map((e) => (
                        <div className="showcaseEspaciadoItem" key={e.variable}>
                            <div
                                className="showcaseEspaciadoBloque"
                                style={{ width: e.px, height: e.px }}
                            />
                            <span className="showcaseColorNombre">{e.nombre} ({e.px}px)</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ==== TIPOGRAFÍA ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Tipografía</h2>
                <div className="showcaseTipos">
                    {FUENTES.map((f) => (
                        <div className="showcaseTipoItem" key={f.variable}>
                            <span className="showcaseTipoLabel">{f.nombre} ({f.px}px)</span>
                            <span style={{ fontSize: f.px }}>Kamples Audio Platform</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ==== BOTON BASE ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">BotonBase</h2>
                <p className="showcaseSeccionDesc">Variantes: primario, secundario, ghost, peligro. Tamaños: sm, md.</p>

                <p className="showcaseEtiqueta">Variantes — tamaño md</p>
                <div className="showcaseFila">
                    <BotonBase variante="primario">Primario</BotonBase>
                    <BotonBase variante="secundario">Secundario</BotonBase>
                    <BotonBase variante="ghost">Ghost</BotonBase>
                    <BotonBase variante="peligro">Peligro</BotonBase>
                </div>

                <p className="showcaseEtiqueta">Variantes — tamaño sm</p>
                <div className="showcaseFila">
                    <BotonBase variante="primario" tamano="sm">Primario</BotonBase>
                    <BotonBase variante="secundario" tamano="sm">Secundario</BotonBase>
                    <BotonBase variante="ghost" tamano="sm">Ghost</BotonBase>
                    <BotonBase variante="peligro" tamano="sm">Peligro</BotonBase>
                </div>

                <p className="showcaseEtiqueta">Estados</p>
                <div className="showcaseFila">
                    <BotonBase cargando>Cargando</BotonBase>
                    <BotonBase disabled>Deshabilitado</BotonBase>
                    <BotonBase anchoCompleto>Ancho completo</BotonBase>
                </div>

                <p className="showcaseEtiqueta">Con iconos</p>
                <div className="showcaseFila">
                    <BotonBase variante="primario"><Heart size={14} /> Like</BotonBase>
                    <BotonBase variante="secundario"><Download size={14} /> Descargar</BotonBase>
                    <BotonBase variante="ghost" soloIcono><Star size={16} /></BotonBase>
                    <BotonBase variante="ghost" soloIcono tamano="sm"><Headphones size={14} /></BotonBase>
                </div>
            </section>

            {/* ==== BADGE ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Badge</h2>
                <p className="showcaseSeccionDesc">Etiquetas de metadata con 7 variantes y 2 estilos.</p>

                <p className="showcaseEtiqueta">Estilo relleno</p>
                <div className="showcaseFila">
                    <Badge variante="neutro">Neutro</Badge>
                    <Badge variante="acento">Acento</Badge>
                    <Badge variante="exito">Éxito</Badge>
                    <Badge variante="error">Error</Badge>
                    <Badge variante="advertencia">Advertencia</Badge>
                    <Badge variante="info">Info</Badge>
                    <Badge variante="premium">Premium</Badge>
                </div>

                <p className="showcaseEtiqueta">Estilo borde</p>
                <div className="showcaseFila">
                    <Badge variante="neutro" estilo="borde">Neutro</Badge>
                    <Badge variante="acento" estilo="borde">Acento</Badge>
                    <Badge variante="exito" estilo="borde">WAV</Badge>
                    <Badge variante="error" estilo="borde">120 BPM</Badge>
                    <Badge variante="info" estilo="borde">C# Minor</Badge>
                    <Badge variante="premium" estilo="borde">PRO</Badge>
                </div>

                <p className="showcaseEtiqueta">Interactivos (click)</p>
                <div className="showcaseFila">
                    <Badge variante="acento" interactivo onClick={() => agregarToast('info')}>
                        Click me
                    </Badge>
                    <Badge variante="exito" interactivo estilo="borde" onClick={() => agregarToast('exito')}>
                        Confirmar
                    </Badge>
                </div>
            </section>

            {/* ==== AVATAR ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Avatar</h2>
                <p className="showcaseSeccionDesc">5 tamaños, indicador de estado, fallback a iniciales.</p>

                <p className="showcaseEtiqueta">Tamaños (sin imagen → iniciales)</p>
                <div className="showcaseFila">
                    <Avatar nombre="Pedro Sánchez" tamano="sm" />
                    <Avatar nombre="Ana López" tamano="md" />
                    <Avatar nombre="Mario DJ" tamano="lg" />
                    <Avatar nombre="Elena R" tamano="xl" />
                    <Avatar nombre="Kamples" tamano="2xl" />
                </div>

                <p className="showcaseEtiqueta">Con estado y borde</p>
                <div className="showcaseFila">
                    <Avatar nombre="Online User" tamano="lg" estado="online" />
                    <Avatar nombre="Offline User" tamano="lg" estado="offline" />
                    <Avatar nombre="Con Borde" tamano="lg" borde />
                    <Avatar nombre="Clickable" tamano="lg" onClick={() => agregarToast('info')} />
                </div>
            </section>

            {/* ==== CAMPO TEXTO ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">CampoTexto</h2>
                <p className="showcaseSeccionDesc">Inputs y textareas con etiqueta y error.</p>

                <div className="showcaseAnchoCompleto">
                    <div className="showcaseFilaVertical">
                        <CampoTexto
                            etiqueta="Nombre de usuario"
                            placeholder="@tu_nombre"
                            value={campoTexto}
                            onChange={(e) => setCampoTexto((e.target as HTMLInputElement).value)}
                        />
                        <CampoTexto
                            etiqueta="Email"
                            type="email"
                            placeholder="tu@email.com"
                        />
                        <CampoTexto
                            etiqueta="Con error"
                            error="Este campo es obligatorio"
                            value=""
                            readOnly
                        />
                        <CampoTexto
                            etiqueta="Biografía"
                            multilínea
                            placeholder="Cuéntanos sobre ti..."
                            rows={3}
                            value={campoArea}
                            onChange={(e) => setCampoArea((e.target as HTMLTextAreaElement).value)}
                        />
                    </div>
                </div>
            </section>

            {/* ==== INPUT BUSQUEDA ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">InputBusqueda</h2>
                <p className="showcaseSeccionDesc">Input con debounce de 300ms, icono y botón limpiar.</p>

                <div className="showcaseAnchoCompleto">
                    <div className="showcaseFilaVertical">
                        <InputBusqueda
                            valor={busqueda}
                            onChange={setBusqueda}
                            placeholder="Buscar samples, packs, artistas..."
                        />
                        <InputBusqueda
                            onChange={() => {}}
                            compacto
                            placeholder="Búsqueda compacta"
                        />
                        {busqueda && (
                            <p style={{ color: 'var(--textoSecundario)', fontSize: 'var(--fuenteSm)' }}>
                                Buscando: &ldquo;{busqueda}&rdquo;
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ==== TAB BAR ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">TabBar</h2>
                <p className="showcaseSeccionDesc">Tabs de navegación con icono y contador.</p>

                <TabBar
                    tabs={TABS_DEMO}
                    activa={tabActiva}
                    onChange={setTabActiva}
                />
                <p style={{ color: 'var(--textoSecundario)', fontSize: 'var(--fuenteSm)', marginTop: 'var(--espacioSm)' }}>
                    Tab activa: {tabActiva}
                </p>
            </section>

            {/* ==== BARRA PROGRESO ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">BarraProgreso</h2>
                <p className="showcaseSeccionDesc">4 estados: normal, éxito, error, indeterminado.</p>

                <div className="showcaseAnchoCompleto">
                    <div className="showcaseFilaVertical">
                        <BarraProgreso porcentaje={35} etiqueta="Subiendo kick_808.wav" />
                        <BarraProgreso porcentaje={72} etiqueta="Procesando audio" />
                        <BarraProgreso porcentaje={100} estado="exito" etiqueta="Completado" />
                        <BarraProgreso porcentaje={45} estado="error" etiqueta="Error de red" />
                        <BarraProgreso estado="indeterminado" />
                    </div>
                </div>
            </section>

            {/* ==== DROP ZONE ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">DropZone</h2>
                <p className="showcaseSeccionDesc">Drag & drop para archivos de audio.</p>

                <DropZone
                    onArchivos={(archivos) => {
                        agregarToast('exito');
                        console.log('Archivos recibidos:', archivos);
                    }}
                />
            </section>

            {/* ==== MODAL ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Modal</h2>
                <p className="showcaseSeccionDesc">Con portal, cierre por Escape y click overlay. 3 tamaños.</p>

                <div className="showcaseFila">
                    <BotonBase onClick={() => setModalAbierto(true)}>
                        Abrir Modal
                    </BotonBase>
                </div>

                <Modal
                    abierto={modalAbierto}
                    onCerrar={() => setModalAbierto(false)}
                    titulo="Modal de ejemplo"
                    pie={
                        <div className="showcaseFila">
                            <BotonBase variante="ghost" onClick={() => setModalAbierto(false)}>
                                Cancelar
                            </BotonBase>
                            <BotonBase onClick={() => setModalAbierto(false)}>
                                Confirmar
                            </BotonBase>
                        </div>
                    }
                >
                    <p style={{ color: 'var(--textoSecundario)' }}>
                        Este es el contenido del modal. Soporta cualquier JSX como hijos.
                        Presiona Escape o haz click fuera para cerrar.
                    </p>
                    <div style={{ marginTop: 'var(--espacioLg)' }}>
                        <CampoTexto etiqueta="Nombre del pack" placeholder="Mi pack de samples" />
                    </div>
                </Modal>
            </section>

            {/* ==== MENU CONTEXTUAL ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">MenuContextual</h2>
                <p className="showcaseSeccionDesc">Menú posicionado por coordenadas. Click derecho para probar.</p>

                <div
                    className="showcaseModalPreview"
                    onContextMenu={abrirMenuContextual}
                    style={{ cursor: 'context-menu', textAlign: 'center' }}
                >
                    <p style={{ color: 'var(--textoSecundario)' }}>
                        Click derecho aquí para ver el menú contextual
                    </p>
                </div>

                <MenuContextual
                    abierto={menuAbierto}
                    onCerrar={() => setMenuAbierto(false)}
                    items={ITEMS_MENU_DEMO}
                    x={menuPos.x}
                    y={menuPos.y}
                />
            </section>

            {/* ==== NOTIFICACIONES (TOASTS) ==== */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Notificaciones (Toast)</h2>
                <p className="showcaseSeccionDesc">4 tipos de toast con auto-dismiss.</p>

                <div className="showcaseFila">
                    <BotonBase variante="primario" tamano="sm" onClick={() => agregarToast('exito')}>
                        Toast éxito
                    </BotonBase>
                    <BotonBase variante="peligro" tamano="sm" onClick={() => agregarToast('error')}>
                        Toast error
                    </BotonBase>
                    <BotonBase variante="secundario" tamano="sm" onClick={() => agregarToast('advertencia')}>
                        Toast advertencia
                    </BotonBase>
                    <BotonBase variante="ghost" tamano="sm" onClick={() => agregarToast('info')}>
                        Toast info
                    </BotonBase>
                </div>
            </section>

            {/* Contenedor global de toasts */}
            <ContenedorNotificaciones toasts={toasts} onCerrar={cerrarToast} />
        </div>
    );
};

export default ShowcaseIsland;
