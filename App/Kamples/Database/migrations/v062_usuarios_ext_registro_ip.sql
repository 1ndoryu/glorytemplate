-- [183A-69] Agregar columna registro_ip a usuarios_ext para anti-abuso en descargas.
-- Almacena la IP con la que el usuario creó su cuenta (máx 45 chars para IPv6).
-- Nullable: usuarios existentes no tendrán este dato.
ALTER TABLE usuarios_ext
    ADD COLUMN IF NOT EXISTS registro_ip VARCHAR(45) DEFAULT NULL;
