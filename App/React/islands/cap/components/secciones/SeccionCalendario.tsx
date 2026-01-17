/**
 * SeccionCalendario
 *
 * Vista del calendario de clases CAP.
 * Placeholder que se implementará en Fase 5.
 */

import {Boton, Tarjeta, TarjetaBody} from '../ui';
import {IconoCalendario} from '../icons';

export function SeccionCalendario() {
    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Calendario</h2>
                <p className="capTexto capTexto--secundario">Gestiona las clases del curso CAP</p>
            </div>

            <Tarjeta className="capMt--lg">
                <TarjetaBody>
                    <div className="capPlaceholder">
                        <IconoCalendario size={48} />
                        <h3 className="capTitulo capTitulo--sm capMt--md">Próximamente</h3>
                        <p className="capTexto capTexto--secundario capMt--sm">El calendario de clases estará disponible en la siguiente fase de desarrollo.</p>
                        <Boton variante="primario" className="capMt--lg" disabled>
                            Generar Calendario
                        </Boton>
                    </div>
                </TarjetaBody>
            </Tarjeta>
        </div>
    );
}

export default SeccionCalendario;
