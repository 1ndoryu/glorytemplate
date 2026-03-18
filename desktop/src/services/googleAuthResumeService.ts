import { crearLogger } from '@app/services/logger';
import { aplicarSesionAutenticadaDesktop } from '@desktop/services/authDesktopService';
import { extraerResultadoDeepLink, leerDeepLinkPendienteAndroid } from './googleAuthDeepLink';

const log = crearLogger('googleAuthResumeService');

/*
 * Recupera un callback OAuth pendiente al arrancar la APK.
 * Cubre el caso en que Android relanza la app y la promesa original del login ya no existe.
 */
export async function procesarOAuthGooglePendienteAlArrancar(): Promise<boolean> {
    const deepLinkPendiente = await leerDeepLinkPendienteAndroid();
    if (!deepLinkPendiente) {
        return false;
    }

    log.info('Deep link OAuth pendiente detectado al arrancar');

    const resultado = extraerResultadoDeepLink(deepLinkPendiente);
    await aplicarSesionAutenticadaDesktop(resultado.token, resultado.usuario);
    return true;
}