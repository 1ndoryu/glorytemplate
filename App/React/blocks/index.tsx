/*
 * Cosmo Revenue - Bloques del Page Builder
 * Registra todos los bloques disponibles en el constructor de páginas.
 */

import { BlockRegistry } from '@/pageBuilder';
import type { BlockDefinition } from '@/pageBuilder/types';
import React from 'react';
import { GloryLink } from '@/core/router';

/* Importar componentes reutilizables para los bloques */
import { EncabezadoSeccion } from '@app/components/ui/EncabezadoSeccion';
import { Marquee } from '@app/components/ui/Marquee';
import { BloqueCita } from '@app/components/ui/BloqueCita';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';

/* Bloque: Hero */
interface HeroBlockProps { titulo: string; subtitulo: string; textoBoton: string; enlaceBoton: string; }
function HeroBlockComponent({ data }: { data: HeroBlockProps; blockId: string }): React.JSX.Element {
    return (
        <section className="paginaHero" style={{ minHeight: '60vh' }}>
            <div className="heroContenido">
                <h1 className="heroTitulo">{data.titulo}</h1>
                {data.subtitulo && <p className="heroSubtitulo">{data.subtitulo}</p>}
                {data.textoBoton && (
                    <GloryLink href={data.enlaceBoton} className="botonAbout" style={{ marginTop: '20px', display: 'inline-block' }}>
                        {data.textoBoton}
                    </GloryLink>
                )}
            </div>
        </section>
    );
}

/* Bloque: Encabezado de Sección */
interface EncabezadoBlockProps { titulo: string; subtitulo: string; etiqueta: string; }
function EncabezadoBlockComponent({ data }: { data: EncabezadoBlockProps }): React.JSX.Element {
    return <EncabezadoSeccion titulo={data.titulo} subtitulo={data.subtitulo} etiqueta={data.etiqueta} />;
}

/* Bloque: Texto */
interface TextoBlockProps { contenido: string; }
function TextoBlockComponent({ data }: { data: TextoBlockProps }): React.JSX.Element {
    return (
        <div className="bloqueTexto" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <div
                style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', lineHeight: 1.8, color: '#444' }}
                dangerouslySetInnerHTML={{ __html: data.contenido }}
            />
        </div>
    );
}

/* Bloque: Imagen */
interface ImagenBlockProps { src: string; alt: string; ancho: string; }
function ImagenBlockComponent({ data }: { data: ImagenBlockProps }): React.JSX.Element {
    return (
        <div style={{ maxWidth: data.ancho || '100%', margin: '40px auto', textAlign: 'center' }}>
            <img src={data.src} alt={data.alt} style={{ width: '100%', borderRadius: '12px' }} loading="lazy" />
        </div>
    );
}

/* Bloque: Marquee */
interface MarqueeBlockProps { textos: string; variante: 'light' | 'dark'; }
function MarqueeBlockComponent({ data }: { data: MarqueeBlockProps }): React.JSX.Element {
    return <Marquee texto={data.textos} variante={data.variante} />;
}

/* Bloque: Cita */
interface CitaBlockProps { texto: string; autor: string; }
function CitaBlockComponent({ data }: { data: CitaBlockProps }): React.JSX.Element {
    return <BloqueCita texto={data.texto} autor={data.autor} />;
}

/* Bloque: CTA */
interface CtaBlockProps { titulo: string; texto: string; textoBoton: string; enlaceBoton: string; }
function CtaBlockComponent({ data }: { data: CtaBlockProps }): React.JSX.Element {
    return (
        <section className="ctaCasos">
            <h2 className="tituloCta">{data.titulo}</h2>
            <p className="textoCta">{data.texto}</p>
            <GloryLink href={data.enlaceBoton} className="botonCta">{data.textoBoton}</GloryLink>
        </section>
    );
}

/* Bloque: Formulario */
interface FormBlockProps { formId: string; titulo: string; }
function FormBlockComponent({ data }: { data: FormBlockProps }): React.JSX.Element {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <FormularioContacto formId={data.formId} titulo={data.titulo} />
        </div>
    );
}

/* Bloque: Espaciador */
interface EspaciadorBlockProps { altura: string; }
function EspaciadorBlockComponent({ data }: { data: EspaciadorBlockProps }): React.JSX.Element {
    return <div style={{ height: data.altura || '60px' }} />;
}

/* Bloque: Columnas (2 cols texto) */
interface ColumnasBlockProps { izquierda: string; derecha: string; }
function ColumnasBlockComponent({ data }: { data: ColumnasBlockProps }): React.JSX.Element {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <div
                style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, color: '#444' }}
                dangerouslySetInnerHTML={{ __html: data.izquierda }}
            />
            <div
                style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, color: '#444' }}
                dangerouslySetInnerHTML={{ __html: data.derecha }}
            />
        </div>
    );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* Definiciones de bloques — se usa any en component para satisfacer el genérico BlockDefinition */
const bloques: BlockDefinition[] = [
    {
        type: 'hero',
        label: 'Hero',
        icon: 'image',
        component: HeroBlockComponent as any,
        defaultProps: { titulo: 'Título Hero', subtitulo: '', textoBoton: '', enlaceBoton: '' },
        editableFields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
            { key: 'textoBoton', label: 'Texto del botón', type: 'text' },
            { key: 'enlaceBoton', label: 'Enlace del botón', type: 'url' },
        ],
    },
    {
        type: 'encabezado',
        label: 'Encabezado de Sección',
        icon: 'heading',
        component: EncabezadoBlockComponent as any,
        defaultProps: { titulo: 'Título', subtitulo: '', etiqueta: '' },
        editableFields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'subtitulo', label: 'Subtítulo', type: 'textarea' },
            { key: 'etiqueta', label: 'Etiqueta', type: 'text' },
        ],
    },
    {
        type: 'texto',
        label: 'Texto',
        icon: 'type',
        component: TextoBlockComponent as any,
        defaultProps: { contenido: '<p>Escribe aquí tu contenido...</p>' },
        editableFields: [
            { key: 'contenido', label: 'Contenido HTML', type: 'textarea' },
        ],
    },
    {
        type: 'imagen',
        label: 'Imagen',
        icon: 'image',
        component: ImagenBlockComponent as any,
        defaultProps: { src: '', alt: 'Imagen', ancho: '100%' },
        editableFields: [
            { key: 'src', label: 'URL de la imagen', type: 'url' },
            { key: 'alt', label: 'Texto alternativo', type: 'text' },
            { key: 'ancho', label: 'Ancho máximo', type: 'text' },
        ],
    },
    {
        type: 'marquee',
        label: 'Marquee',
        icon: 'move-horizontal',
        component: MarqueeBlockComponent as any,
        defaultProps: { textos: 'Texto 1|Texto 2|Texto 3', variante: 'dark' },
        editableFields: [
            { key: 'textos', label: 'Textos (separados por |)', type: 'text' },
            { key: 'variante', label: 'Variante', type: 'select', options: [
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Oscuro' },
            ]},
        ],
    },
    {
        type: 'cita',
        label: 'Cita',
        icon: 'quote',
        component: CitaBlockComponent as any,
        defaultProps: { texto: 'Texto de la cita...', autor: '— Autor' },
        editableFields: [
            { key: 'texto', label: 'Texto de la cita', type: 'textarea' },
            { key: 'autor', label: 'Autor', type: 'text' },
        ],
    },
    {
        type: 'cta',
        label: 'Call to Action',
        icon: 'megaphone',
        component: CtaBlockComponent as any,
        defaultProps: { titulo: '¿Listo para empezar?', texto: '', textoBoton: 'Contactar', enlaceBoton: '/contacto/' },
        editableFields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'texto', label: 'Texto', type: 'textarea' },
            { key: 'textoBoton', label: 'Texto del botón', type: 'text' },
            { key: 'enlaceBoton', label: 'Enlace del botón', type: 'url' },
        ],
    },
    {
        type: 'formulario',
        label: 'Formulario de Contacto',
        icon: 'mail',
        component: FormBlockComponent as any,
        defaultProps: { formId: 'constructor-form', titulo: 'Contacto' },
        editableFields: [
            { key: 'formId', label: 'ID del formulario', type: 'text' },
            { key: 'titulo', label: 'Título', type: 'text' },
        ],
    },
    {
        type: 'espaciador',
        label: 'Espaciador',
        icon: 'separator',
        component: EspaciadorBlockComponent as any,
        defaultProps: { altura: '60px' },
        editableFields: [
            { key: 'altura', label: 'Altura (px)', type: 'text' },
        ],
    },
    {
        type: 'columnas',
        label: 'Dos Columnas',
        icon: 'columns',
        component: ColumnasBlockComponent as any,
        defaultProps: { izquierda: '<p>Columna izquierda</p>', derecha: '<p>Columna derecha</p>' },
        editableFields: [
            { key: 'izquierda', label: 'Columna Izquierda (HTML)', type: 'textarea' },
            { key: 'derecha', label: 'Columna Derecha (HTML)', type: 'textarea' },
        ],
    },
];

/* Función de registro invocada desde appIslands.tsx */
export function registerAppBlocks(): void {
    BlockRegistry.registerAll(bloques);
}
