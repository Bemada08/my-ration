/* firebase-loader.js
   Подключает firebase-config.js только когда возможно (http/https).
   На file:// сразу сигнализирует что Firebase недоступен — сайт работает офлайн через localStorage.
*/
(function() {
    'use strict';

    var canUseFirebase = location.protocol === 'http:' || location.protocol === 'https:';

    if (!canUseFirebase) {
        console.log('🔓 Сайт открыт через ' + location.protocol + ' — Firebase отключён, работаем локально');
        /* Заглушка чтобы код который проверяет window.firebaseAPI знал что Firebase не будет */
        window.firebaseUnavailable = true;
        return;
    }

    /* Динамически подключаем модуль Firebase */
    var script = document.createElement('script');
    script.type = 'module';
    script.src = 'firebase-config.js';
    script.onerror = function() {
        console.warn('⚠️ Не удалось загрузить firebase-config.js — работаем локально');
        window.firebaseUnavailable = true;
    };
    document.head.appendChild(script);
})();
