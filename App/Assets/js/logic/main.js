/* eslint-disable func-names */
(function (window) {
    'use strict';

    const app = window.GloryLogic;
    if (!app) return;

    app.render.init();
    if (app.events && app.events.registrar) {
        app.events.registrar();
    }
})(window);





