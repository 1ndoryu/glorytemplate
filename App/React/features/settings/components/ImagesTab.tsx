/**
 * ImagesTab - Configuracion de imagenes del sitio
 *
 * Permite configurar:
 * - Imagen de Hero/Perfil
 * - Imagen secundaria (trabajando)
 */

import {Image} from 'lucide-react';
import {ImageUploader} from './ImageUploader';

interface ImagesTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
    onUpload: (file: File) => Promise<string>;
}

export function ImagesTab({options, onUpdate, onUpload}: ImagesTabProps): JSX.Element {
    return (
        <div id="settings-images-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <Image className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Imagenes del Sitio</h2>
                    <p className="settings-tab-description">Configura las imagenes principales que aparecen en las secciones Hero y Sobre Mi.</p>
                </div>
            </header>

            <div className="settings-images-grid">
                <ImageUploader id="glory_image_hero" label="Imagen Principal (Hero)" value={options.glory_image_hero || ''} onChange={url => onUpdate('glory_image_hero', url)} onUpload={onUpload} description="Imagen de perfil usada en las secciones Hero y Sobre Mi." aspectRatio="4/5" />

                <ImageUploader id="glory_image_secondary" label="Imagen Secundaria" value={options.glory_image_secondary || ''} onChange={url => onUpdate('glory_image_secondary', url)} onUpload={onUpload} description="Imagen secundaria usada en la seccion Sobre Mi (ej: foto trabajando)." aspectRatio="4/5" />
            </div>
        </div>
    );
}
