/**
 * Settings Feature - Barrel exports
 *
 * Exporta todos los componentes y hooks del feature de configuracion.
 */

// Componentes de tabs
export {IdentityTab} from './components/IdentityTab';
export {ContactTab} from './components/ContactTab';
export {SocialTab} from './components/SocialTab';
export {ImagesTab} from './components/ImagesTab';
export {IntegrationsTab} from './components/IntegrationsTab';
export {LogoTab} from './components/LogoTab';
export {PricingTab} from './components/PricingTab';

// Componentes auxiliares
export {SettingsField} from './components/SettingsField';
export {ImageUploader} from './components/ImageUploader';

// Hooks
export {useSettingsApi} from './hooks/useSettingsApi';

// Types
export type {SettingsTab, SettingsState, ThemeOption, SettingsSection, SaveResult, ValidationError} from './types';
