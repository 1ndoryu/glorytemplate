/*
 * Script de transformacion automatica: button -> BotonBase
 * Lee archivos del reporte sentinel y reemplaza <button> nativos con <BotonBase>.
 * Solo procesa archivos que NO son componentes base (BotonBase, CampoTexto, etc.)
 */

const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\Owner\\OneDrive\\Documentos\\WP\\app\\public\\wp-content\\themes\\glorytemplate';

/* Archivos que NO deben ser transformados (componentes base que usan nativos intencionalmente) */
const EXCLUIR = new Set([
    'App/React/components/ui/BotonBase.tsx',
    'App/React/components/ui/CampoTexto.tsx',
    'App/React/components/ui/SelectorBase.tsx',
]);

/* Archivos del reporte sentinel con violaciones html-nativo-en-vez-de-componente */
const archivos = [
    'App/React/islands/player/ReproductorIsland.tsx',
    'App/React/components/social/ModalConfiguracion.tsx',
    'App/React/components/social/ChatFlotante.tsx',
    'App/React/components/social/ContenidoCrear.tsx',
    'Mezclador/components/ControlesMezclador.tsx',
    'Mezclador/components/MezcladorPanel.tsx',
    'App/React/components/social/ComentarioItem.tsx',
    'Mezclador/components/ChannelRack/SelectorPatron.tsx',
    'Mezclador/components/ModalConfigBloque.tsx',
    'App/React/components/social/ListaComentarios.tsx',
    'App/React/components/admin/TabUsuariosAdmin.tsx',
    'App/React/components/ui/ReproductorGlobal.tsx',
    'App/React/islands/feed/InicioIsland.tsx',
    'App/React/components/ui/BotonExperimentos.tsx',
    'App/React/components/admin/TabModeracionAdmin.tsx',
    'App/React/islands/mensajes/ChatIsland.tsx',
    'App/React/islands/colecciones/ColeccionDetalleIsland.tsx',
    'App/React/components/ui/TarjetaSample.tsx',
    'App/React/components/samples/SampleDetalleAcciones.tsx',
    'Mezclador/components/PianoRoll/CabeceraPianoRoll.tsx',
    'App/React/components/ui/BotonDevTools.tsx',
    'App/React/components/social/ModalEditar.tsx',
    'App/React/components/social/TarjetaColeccion.tsx',
    'App/React/components/social/ModalSeleccionColeccion.tsx',
    'App/React/components/ui/SelectorBPM.tsx',
    'Mezclador/components/PistaTimeline.tsx',
    'Mezclador/components/ChannelRack/CanalStrip.tsx',
    'Mezclador/components/BloqueSample.tsx',
    'Mezclador/components/PianoRoll/MenuContextualPR.tsx',
    'Mezclador/components/Mixer/InsertStrip.tsx',
    'App/React/islands/planes/PlanesIsland.tsx',
    'App/React/components/social/ModalPublicar.tsx',
    'App/React/components/ui/SelectFiltro.tsx',
    'App/React/components/social/BarraAccionesPost.tsx',
    'App/React/components/ui/subir/PasoMetadata.tsx',
    'App/React/components/desktop/PanelSincronizacion.tsx',
    'Mezclador/components/VentanaFlotante.tsx',
    'Mezclador/components/PianoRoll/PanelControl.tsx',
    'Mezclador/components/Mixer/PanelDetalleInsert.tsx',
    'App/React/islands/comunidad/ComunidadIsland.tsx',
    'App/React/islands/social/EditarPerfilIsland.tsx',
    'App/React/islands/notificaciones/NotificacionesIsland.tsx',
    'App/React/islands/BienvenidaIsland.tsx',
    'App/React/islands/auth/RegistroIsland.tsx',
    'App/React/islands/auth/LoginIsland.tsx',
    'App/React/components/ui/ContenedorToasts.tsx',
    'App/React/components/ui/ModalInspectorSample.tsx',
    'App/React/components/ui/ModalFiltros.tsx',
    'App/React/components/ui/InputBusqueda.tsx',
    'App/React/components/ui/DropdownNotificaciones.tsx',
    'App/React/components/layout/Sidebar.tsx',
    'App/React/components/auth/ModalAuth.tsx',
    'App/React/components/feed/PanelLibreria.tsx',
    'App/React/components/feed/FeedSamples.tsx',
    'Mezclador/components/ErrorBoundaryMezclador.tsx',
    'Mezclador/components/Timeline.tsx',
    'Mezclador/components/ChannelRack/PasoBoton.tsx',
    'Mezclador/components/ChannelRack/GraphEditor.tsx',
    'Mezclador/components/ChannelRack/ChannelRack.tsx',
    'Mezclador/components/ChannelRack/CabeceraChannelRack.tsx',
    'Mezclador/components/ModalConfigDaw.tsx',
    'Mezclador/components/PanelBrowserDaw.tsx',
    'Mezclador/components/InputTempo.tsx',
    'Mezclador/components/BarraVentanasMinimizadas.tsx',
    'Mezclador/components/Mixer/EQVisualizer.tsx',
    'Mezclador/components/Mixer/SlotEfectoUI.tsx',
    'App/React/islands/social/PerfilIsland.tsx',
    'App/React/islands/mensajes/MensajesIsland.tsx',
    'App/React/islands/admin/DashboardCreadorIsland.tsx',
    'App/React/hooks/useBurbujaMensaje.tsx',
    'App/React/components/social/ModalColeccion.tsx',
    'App/React/components/ui/TooltipReacciones.tsx',
    'App/React/components/social/FilaColecciones.tsx',
    'App/React/components/social/EnlaceCreador.tsx',
    'App/React/components/ui/TabBar.tsx',
    'App/React/components/social/ComentarioAudio.tsx',
    'App/React/components/social/BotonLike.tsx',
    'App/React/components/social/BotonFollow.tsx',
    'App/React/components/ui/Notificacion.tsx',
    'App/React/components/ui/Modal.tsx',
    'App/React/components/ui/MenuContextual.tsx',
    'App/React/components/ui/DropZone.tsx',
    'App/React/components/layout/TopBar.tsx',
    'App/React/components/feed/PanelSugerencias.tsx',
    'App/React/components/feed/PanelDetalleSample.tsx',
    'App/React/components/feed/ModalSugerenciasLike.tsx',
    'App/React/islands/libreria/FavoritosIsland.tsx',
    'App/React/islands/libreria/DescargasIsland.tsx',
];

/* Determinar import path para BotonBase segun ubicacion del archivo */
function calcularImportBotonBase(archivoRel) {
    if (archivoRel.startsWith('Mezclador/')) {
        return `import { BotonBase } from '@app/components/ui/BotonBase';`;
    }
    /* Para App/React, calcular path relativo */
    const dir = path.dirname(archivoRel);
    const targetDir = 'App/React/components/ui';
    const rel = path.relative(dir, targetDir).replace(/\\/g, '/');
    return `import { BotonBase } from '${rel}/BotonBase';`;
}

function calcularImportCampoTexto(archivoRel) {
    if (archivoRel.startsWith('Mezclador/')) {
        return `import { CampoTexto } from '@app/components/ui/CampoTexto';`;
    }
    const dir = path.dirname(archivoRel);
    const targetDir = 'App/React/components/ui';
    const rel = path.relative(dir, targetDir).replace(/\\/g, '/');
    return `import { CampoTexto } from '${rel}/CampoTexto';`;
}

function calcularImportSelectorBase(archivoRel) {
    if (archivoRel.startsWith('Mezclador/')) {
        return `import { SelectorBase } from '@app/components/ui/SelectorBase';`;
    }
    const dir = path.dirname(archivoRel);
    const targetDir = 'App/React/components/ui';
    const rel = path.relative(dir, targetDir).replace(/\\/g, '/');
    return `import { SelectorBase } from '${rel}/SelectorBase';`;
}

let totalCambios = 0;
let totalArchivos = 0;

for (const archivoRel of archivos) {
    if (EXCLUIR.has(archivoRel)) continue;

    const ruta = path.join(base, archivoRel);
    if (!fs.existsSync(ruta)) {
        console.log(`SKIP (no existe): ${archivoRel}`);
        continue;
    }

    let contenido = fs.readFileSync(ruta, 'utf-8');
    const original = contenido;
    let cambios = 0;

    /* 1. Reemplazar <button con <BotonBase variante="ghost" */
    const tieneButton = /<button[\s\n]/.test(contenido) || /<button>/.test(contenido);
    if (tieneButton) {
        /* Agregar import si no existe */
        if (!contenido.includes('BotonBase')) {
            const importLine = calcularImportBotonBase(archivoRel);
            /* Insertar despues del ultimo import */
            const ultimoImport = contenido.lastIndexOf('\nimport ');
            if (ultimoImport >= 0) {
                const finLinea = contenido.indexOf('\n', ultimoImport + 1);
                contenido = contenido.slice(0, finLinea + 1) + importLine + '\n' + contenido.slice(finLinea + 1);
            }
        }
        
        /* Reemplazar tags */
        contenido = contenido.replace(/<button(\s)/g, '<BotonBase variante="ghost"$1');
        contenido = contenido.replace(/<button>/g, '<BotonBase variante="ghost">');
        contenido = contenido.replace(/<\/button>/g, '</BotonBase>');
        
        /* Contar cambios */
        const buttonCount = (original.match(/<button[\s>]/g) || []).length;
        cambios += buttonCount;
    }

    /* 2. Reemplazar <textarea con <CampoTexto multilinea */
    if (/<textarea[\s\n]/.test(contenido) || /<textarea>/.test(contenido)) {
        if (!contenido.includes('CampoTexto')) {
            const importLine = calcularImportCampoTexto(archivoRel);
            const ultimoImport = contenido.lastIndexOf('\nimport ');
            if (ultimoImport >= 0) {
                const finLinea = contenido.indexOf('\n', ultimoImport + 1);
                contenido = contenido.slice(0, finLinea + 1) + importLine + '\n' + contenido.slice(finLinea + 1);
            }
        }
        /* textarea es self-closing o con children. Solo manejar el simple caso */
        /* <textarea ... /> y <textarea ...>...</textarea> */
        contenido = contenido.replace(/<textarea(\s)/g, '<CampoTexto multilínea$1');
        contenido = contenido.replace(/<textarea>/g, '<CampoTexto multilínea>');
        contenido = contenido.replace(/<\/textarea>/g, '</CampoTexto>');
        /* Quitar multilínea de closing tags que se duplicaron */
        cambios++;
    }

    /* 3. Reemplazar <select nativo con SelectorBase */
    if (/<select[\s\n]/.test(contenido) || /<select>/.test(contenido)) {
        if (!contenido.includes('SelectorBase')) {
            const importLine = calcularImportSelectorBase(archivoRel);
            const ultimoImport = contenido.lastIndexOf('\nimport ');
            if (ultimoImport >= 0) {
                const finLinea = contenido.indexOf('\n', ultimoImport + 1);
                contenido = contenido.slice(0, finLinea + 1) + importLine + '\n' + contenido.slice(finLinea + 1);
            }
        }
        contenido = contenido.replace(/<select(\s)/g, '<SelectorBase$1');
        contenido = contenido.replace(/<select>/g, '<SelectorBase>');
        contenido = contenido.replace(/<\/select>/g, '</SelectorBase>');
        cambios++;
    }

    /* 4. Para <input tipo texto/email/password/number, reemplazar con CampoTexto */
    /* Solo inputs tipo text que no sean range/file/checkbox/radio/color/hidden */
    const tieneInput = /<input[\s\n]/.test(contenido);
    if (tieneInput) {
        /* Verificar si hay inputs que deberian ser CampoTexto */
        const inputRegex = /<input\s[^>]*type=["'](text|email|password|number|search|tel|url)["'][^>]*\/?>/g;
        const inputSimple = /<input\s[^>]*(?!type=)[^>]*\/?>/g; /* inputs sin type explicitado = text */
        
        if (inputRegex.test(contenido) || inputSimple.test(contenido)) {
            if (!contenido.includes('CampoTexto')) {
                const importLine = calcularImportCampoTexto(archivoRel);
                const ultimoImport = contenido.lastIndexOf('\nimport ');
                if (ultimoImport >= 0) {
                    const finLinea = contenido.indexOf('\n', ultimoImport + 1);
                    contenido = contenido.slice(0, finLinea + 1) + importLine + '\n' + contenido.slice(finLinea + 1);
                }
            }
        }

        /* Reemplazar inputs de texto con CampoTexto, preservar atributos */
        /* Solo reemplazar inputs que son claramente de texto, no file/range/checkbox/radio/color/hidden */
        contenido = contenido.replace(/<input(\s[^>]*?)type=["'](?:text|email|password|number|search|tel|url)["']([^>]*?)\/?>/g, '<CampoTexto$1$2 />');
        /* Para el volumen range, agregar sentinel disable */
        /* No transformar inputs sin type que tienen atributos de range (min/max/step) */
        cambios++;
    }

    if (contenido !== original) {
        fs.writeFileSync(ruta, contenido, 'utf-8');
        totalCambios += cambios;
        totalArchivos++;
        console.log(`OK: ${archivoRel} (${cambios} cambios)`);
    } else {
        console.log(`SIN CAMBIOS: ${archivoRel}`);
    }
}

console.log(`\nTotal: ${totalArchivos} archivos modificados, ${totalCambios} cambios.`);
