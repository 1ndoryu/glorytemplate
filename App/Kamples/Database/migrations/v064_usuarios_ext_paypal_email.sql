/* [183A-96] Agregar paypal_email para retiros de ganancias */
ALTER TABLE usuarios_ext ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255) DEFAULT NULL;
