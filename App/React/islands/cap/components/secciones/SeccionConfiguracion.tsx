/**
 * SeccionConfiguracion
 *
 * Vista de configuración del centro y suscripción.
 * Placeholder que se implementará en Fase 3.
 */

import {Boton, Tarjeta, TarjetaHeader, TarjetaBody, Badge} from '../ui';

interface SeccionConfiguracionProps {
    userName: string;
    userEmail: string;
}

export function SeccionConfiguracion({userName, userEmail}: SeccionConfiguracionProps) {
    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Configuración</h2>
                <p className="capTexto capTexto--secundario">Ajustes de tu centro y suscripción</p>
            </div>

            <div className="capGrid capGrid--2cols capGap--lg capMt--lg">
                <Tarjeta>
                    <TarjetaHeader>
                        <h3 className="capTitulo capTitulo--sm">Perfil</h3>
                    </TarjetaHeader>
                    <TarjetaBody>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Nombre</span>
                            <span className="capConfigItem__value">{userName}</span>
                        </div>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Email</span>
                            <span className="capConfigItem__value">{userEmail}</span>
                        </div>
                    </TarjetaBody>
                </Tarjeta>

                <Tarjeta>
                    <TarjetaHeader>
                        <h3 className="capTitulo capTitulo--sm">Suscripción</h3>
                    </TarjetaHeader>
                    <TarjetaBody>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Plan</span>
                            <Badge variante="exito">Activo</Badge>
                        </div>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Próxima facturación</span>
                            <span className="capConfigItem__value">Período de prueba</span>
                        </div>
                        <Boton variante="outline" tamano="sm" className="capMt--md" disabled>
                            Gestionar Pagos
                        </Boton>
                    </TarjetaBody>
                </Tarjeta>
            </div>
        </div>
    );
}

export default SeccionConfiguracion;
