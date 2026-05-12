/* ==================== УНИВЕРСАЛЬНАЯ МОДАЛКА ПРОСМОТРА РЕЦЕПТА ====================
   Используется и в recipes.html (системные + пользовательские), и в planner.html.
   Ожидает window.SYSTEM_RECIPES (из recipes-data.js).

   API: window.RecipeView.openBySlug(slug)
        window.RecipeView.openData(data)
        window.RecipeView.openFromCard(cardEl)
        window.RecipeView.close()
*/
(function() {
    'use strict';

    var SYSTEM_BY_SLUG = {};
    function buildIndex() {
        SYSTEM_BY_SLUG = {};
        (window.SYSTEM_RECIPES || []).forEach(function(r) { SYSTEM_BY_SLUG[r.slug] = r; });
    }
    buildIndex();

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function openData(d, opts) {
        opts = opts || {};
        var existing = document.querySelector('.recipe-view-modal');
        if (existing) existing.remove();

        var imgHtml = d.image
            ? '<div class="rv-image" style="background-image:url(\'' + esc(d.image) + '\')"></div>'
            : '<div class="rv-image rv-image--empty">🍽</div>';

        var ingredientsHtml = (d.ingredients && d.ingredients.length)
            ? '<ul>' + d.ingredients.map(function(l){ return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>'
            : '<p class="rv-empty">Ингредиенты не указаны</p>';

        var stepsHtml = (d.steps && d.steps.length)
            ? '<ol>' + d.steps.map(function(l){ return '<li>' + esc(l) + '</li>'; }).join('') + '</ol>'
            : '<p class="rv-empty">Шаги приготовления не указаны</p>';

        var hasMacros = (d.prot !== '' && d.prot != null) || (d.fat !== '' && d.fat != null) || (d.carbs !== '' && d.carbs != null);
        var nutritionHtml = '';
        if (hasMacros || (d.kcal !== '' && d.kcal != null)) {
            nutritionHtml = '<div class="rv-nutrition">';
            if (d.kcal  !== '' && d.kcal  != null) nutritionHtml += '<div class="rv-nutri-item"><div class="rv-nutri-val">' + esc(d.kcal)  + '</div><div class="rv-nutri-lbl">ккал</div></div>';
            if (d.prot  !== '' && d.prot  != null) nutritionHtml += '<div class="rv-nutri-item"><div class="rv-nutri-val">' + esc(d.prot)  + ' г</div><div class="rv-nutri-lbl">Белки</div></div>';
            if (d.fat   !== '' && d.fat   != null) nutritionHtml += '<div class="rv-nutri-item"><div class="rv-nutri-val">' + esc(d.fat)   + ' г</div><div class="rv-nutri-lbl">Жиры</div></div>';
            if (d.carbs !== '' && d.carbs != null) nutritionHtml += '<div class="rv-nutri-item"><div class="rv-nutri-val">' + esc(d.carbs) + ' г</div><div class="rv-nutri-lbl">Углеводы</div></div>';
            nutritionHtml += '</div>';
        }

        var modal = document.createElement('div');
        modal.className = 'modal-overlay modal-overlay--open recipe-view-modal';
        modal.onclick = function(e) { if (e.target === modal) close(); };
        modal.innerHTML =
            '<div class="modal modal--wide">' +
                '<div class="modal__header">' +
                    '<h2 class="modal__title">' + esc(d.name) + '</h2>' +
                    '<button class="modal__close" type="button" aria-label="Закрыть">✕</button>' +
                '</div>' +
                '<div class="modal__body">' +
                    imgHtml +
                    '<div class="rv-badge">' + esc(d.catLabel || '') + '</div>' +
                    (d.desc && d.desc !== 'Без описания' ? '<p class="rv-desc">' + esc(d.desc) + '</p>' : '') +
                    '<div class="rv-meta">' +
                        (d.time     ? '<span>⏱ ' + esc(d.time)     + '</span>' : '') +
                        (d.portions ? '<span>🍽 ' + esc(d.portions) + '</span>' : '') +
                    '</div>' +
                    nutritionHtml +
                    '<h3 class="rv-section-title">🥕 Ингредиенты</h3>' +
                    ingredientsHtml +
                    '<h3 class="rv-section-title">📝 Приготовление</h3>' +
                    stepsHtml +
                    '<div class="rv-actions">' +
                        '<button class="btn btn--outline" type="button" data-rv-action="close">Закрыть</button>' +
                        '<button class="btn btn--primary" type="button" data-rv-action="print">🖨 Распечатать</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        modal.querySelector('.modal__close').addEventListener('click', close);
        modal.querySelector('[data-rv-action="close"]').addEventListener('click', close);
        modal.querySelector('[data-rv-action="print"]').addEventListener('click', function() { window.print(); });

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        /* Управление URL только если это явно разрешено (на странице каталога) */
        if (opts.updateUrl && d.slug && history.replaceState) {
            history.replaceState({ recipe: d.slug }, '', location.pathname + '?recipe=' + encodeURIComponent(d.slug));
        }
        modal._opts = opts;
    }

    function close() {
        var modal = document.querySelector('.recipe-view-modal');
        if (!modal) return;
        var opts = modal._opts || {};
        modal.remove();
        document.body.style.overflow = '';
        if (opts.updateUrl && history.replaceState && location.search.indexOf('recipe=') !== -1) {
            history.replaceState({}, '', location.pathname);
        }
    }

    function openBySlug(slug, opts) {
        if (!slug) return false;
        if (Object.keys(SYSTEM_BY_SLUG).length === 0) buildIndex(); /* на случай поздней загрузки данных */
        var r = SYSTEM_BY_SLUG[slug];
        if (!r) return false;
        openData({
            slug: slug,
            name: r.name, catLabel: r.catLabel, desc: r.desc,
            time: r.time, kcal: r.kcal, portions: r.portions,
            prot: r.prot, fat: r.fat, carbs: r.carbs,
            image: r.image, ingredients: r.ingredients, steps: r.steps
        }, opts);
        return true;
    }

    /* Открытие из карточки в каталоге: системная (по data-slug) или пользовательская (из data-*) */
    function openFromCard(card, opts) {
        var slug = card.getAttribute('data-slug');
        if (slug) return openBySlug(slug, opts);

        /* Пользовательский рецепт — собираем данные из карточки */
        var meta = card.querySelectorAll('.recipe-card__meta span');
        var time = meta[0] ? meta[0].textContent.replace('⏱ ', '') : '';
        var kcalRaw = meta[1] ? meta[1].textContent.replace('🔥 ', '').replace(' ккал', '') : '';
        var portions = meta[2] ? meta[2].textContent.replace('🍽 ', '') : '';
        var ingrText = card.getAttribute('data-ingredients') || '';
        var stepsText = card.getAttribute('data-steps') || '';
        openData({
            slug: null,
            name: card.querySelector('.recipe-card__title').textContent,
            catLabel: card.querySelector('.recipe-card__badge').textContent,
            desc: card.querySelector('.recipe-card__desc').textContent,
            time: time,
            kcal: kcalRaw,
            portions: portions,
            prot: card.getAttribute('data-prot') || '',
            fat: card.getAttribute('data-fat') || '',
            carbs: card.getAttribute('data-carbs') || '',
            image: card.getAttribute('data-image') || '',
            ingredients: ingrText ? ingrText.split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean) : [],
            steps: stepsText ? stepsText.split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean) : []
        }, opts);
        return true;
    }

    /* Глобальный обработчик Escape */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.querySelector('.recipe-view-modal')) close();
    });

    window.RecipeView = {
        openBySlug: openBySlug,
        openData: openData,
        openFromCard: openFromCard,
        close: close,
        rebuildIndex: buildIndex
    };
})();
