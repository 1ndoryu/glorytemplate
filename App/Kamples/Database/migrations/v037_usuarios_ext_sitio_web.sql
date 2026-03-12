/*
 * v037_usuarios_ext_sitio_web.sql — Agrega campo sitio_web al perfil de usuario.
 * QQ32: Permite a los usuarios mostrar un enlace externo en su perfil.
 */

ALTER TABLE usuarios_ext
    ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(500) DEFAULT NULL;
