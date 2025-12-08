<?php

namespace App\Helpers;

/**
 * ContactForm - Helper para generar formularios de contacto reutilizables
 * 
 * Los estilos estan definidos globalmente en init.css con clases genericas
 * que no dependen del contenedor de pagina.
 */
class ContactForm
{
    /**
     * Renderiza el formulario de contacto completo
     * 
     * @param string $formId ID unico del formulario para tracking
     * @param string $title Titulo de la seccion (opcional, vacio para no mostrar)
     * @param bool $showHabitaciones Mostrar campos de habitaciones y PMS
     * @return void
     */
    public static function render(
        string $formId = 'contacto',
        string $title = 'Contacto',
        bool $showHabitaciones = true
    ): void {
?>
        <section gloryDiv class="cosmo-contact-section">
            <div gloryDivSecundario class="cosmo-contact-container">
                <?php if (!empty($title)): ?>
                    <div gloryDivSecundario class="cosmo-section-header">
                        <h2 gloryTexto class="cosmo-section-title"><?php echo esc_html($title); ?></h2>
                    </div>
                <?php endif; ?>

                <form gloryForm opciones="formId: '<?php echo esc_attr($formId); ?>', ajaxSubmit: true, honeypot: true" class="cosmo-contact-form">
                    <div gloryDivSecundario class="cosmo-form-row">
                        <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="cosmo-form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre">
                        </div>
                        <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="cosmo-form-group">
                            <label>Email</label>
                            <input type="email" name="email">
                        </div>
                    </div>
                    <div gloryDivSecundario class="cosmo-form-row">
                        <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="cosmo-form-group">
                            <label>Telefono</label>
                            <input type="tel" name="telefono">
                        </div>
                        <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="cosmo-form-group">
                            <label>Alojamiento</label>
                            <input type="text" name="alojamiento">
                        </div>
                    </div>
                    <?php if ($showHabitaciones): ?>
                        <div gloryDivSecundario class="cosmo-form-row">
                            <div gloryInput opciones="name: 'habitaciones', label: 'N habitaciones', type: 'text'" class="cosmo-form-group">
                                <label>N habitaciones</label>
                                <input type="text" name="habitaciones">
                            </div>
                            <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="cosmo-form-group">
                                <label>PMS/Channel</label>
                                <input type="text" name="pms">
                            </div>
                        </div>
                    <?php endif; ?>
                    <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="cosmo-form-group cosmo-full-width">
                        <label>Mensaje</label>
                        <textarea name="mensaje" rows="1"></textarea>
                    </div>

                    <div gloryDivSecundario class="cosmo-form-footer">
                        <label class="cosmo-checkbox-label">
                            <input type="checkbox" name="privacy" required>
                            He leido y acepto la Politica de Privacidad.
                        </label>
                        <button glorySubmit opciones="texto: 'Enviar', loadingText: 'Enviando...'" type="submit" class="cosmo-btn-submit">Enviar</button>
                    </div>
                </form>
            </div>
        </section>
    <?php
    }

    /**
     * Renderiza solo el formulario sin la seccion wrapper
     * Util para insertar en secciones personalizadas
     * 
     * @param string $formId ID unico del formulario
     * @param bool $showHabitaciones Mostrar campos de habitaciones y PMS
     * @return void
     */
    public static function renderFormOnly(string $formId = 'contacto', bool $showHabitaciones = true): void
    {
    ?>
        <form gloryForm opciones="formId: '<?php echo esc_attr($formId); ?>', ajaxSubmit: true, honeypot: true" class="cosmo-contact-form">
            <div gloryDivSecundario class="cosmo-form-row">
                <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="cosmo-form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre">
                </div>
                <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="cosmo-form-group">
                    <label>Email</label>
                    <input type="email" name="email">
                </div>
            </div>
            <div gloryDivSecundario class="cosmo-form-row">
                <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="cosmo-form-group">
                    <label>Telefono</label>
                    <input type="tel" name="telefono">
                </div>
                <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="cosmo-form-group">
                    <label>Alojamiento</label>
                    <input type="text" name="alojamiento">
                </div>
            </div>
            <?php if ($showHabitaciones): ?>
                <div gloryDivSecundario class="cosmo-form-row">
                    <div gloryInput opciones="name: 'habitaciones', label: 'N habitaciones', type: 'text'" class="cosmo-form-group">
                        <label>N habitaciones</label>
                        <input type="text" name="habitaciones">
                    </div>
                    <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="cosmo-form-group">
                        <label>PMS/Channel</label>
                        <input type="text" name="pms">
                    </div>
                </div>
            <?php endif; ?>
            <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="cosmo-form-group cosmo-full-width">
                <label>Mensaje</label>
                <textarea name="mensaje" rows="1"></textarea>
            </div>

            <div gloryDivSecundario class="cosmo-form-footer">
                <label class="cosmo-checkbox-label">
                    <input type="checkbox" name="privacy" required>
                    He leido y acepto la Politica de Privacidad.
                </label>
                <button glorySubmit opciones="texto: 'Enviar', loadingText: 'Enviando...'" type="submit" class="cosmo-btn-submit">Enviar</button>
            </div>
        </form>
<?php
    }
}
