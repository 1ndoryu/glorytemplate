/* QL61: Hacer todas las colecciones existentes publicas y cambiar default */
UPDATE colecciones SET publica = true WHERE publica = false;
ALTER TABLE colecciones ALTER COLUMN publica SET DEFAULT true;
