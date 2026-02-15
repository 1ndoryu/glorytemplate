/*
 * Sección Showcase: Botones, Badges y Avatars.
 * Muestra las variantes, tamaños y estados de estos componentes base.
 */

import {
    BotonBase,
    Badge,
    Avatar,
} from '@app/components/ui';
import {
    Heart,
    Download,
    Star,
    Headphones,
} from 'lucide-react';

interface Props {
    onToast: (tipo: 'exito' | 'error' | 'advertencia' | 'info') => void;
}

export const ShowcaseBotones = ({ onToast }: Props): JSX.Element => (
    <>
        {/* Botones */}
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

        {/* Badges */}
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
                <Badge variante="acento" interactivo onClick={() => onToast('info')}>
                    Click me
                </Badge>
                <Badge variante="exito" interactivo estilo="borde" onClick={() => onToast('exito')}>
                    Confirmar
                </Badge>
            </div>
        </section>

        {/* Avatars */}
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
                <Avatar nombre="Clickable" tamano="lg" onClick={() => onToast('info')} />
            </div>
        </section>
    </>
);
