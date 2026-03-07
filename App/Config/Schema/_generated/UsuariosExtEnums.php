<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/UsuariosExtSchema.php */

namespace App\Config\Schema\_generated;

final class UsuariosExtEnums
{
    /* Valores para columna "plan" */
    const PLAN_FREE = 'free';
    const PLAN_PRO = 'pro';
    const PLAN_PREMIUM = 'premium';

    const TODOS_PLAN = [self::PLAN_FREE, self::PLAN_PRO, self::PLAN_PREMIUM];

    /* Valores para columna "rol" */
    const ROL_USUARIO = 'usuario';
    const ROL_CREADOR = 'creador';
    const ROL_ADMIN = 'admin';

    const TODOS_ROL = [self::ROL_USUARIO, self::ROL_CREADOR, self::ROL_ADMIN];
}
