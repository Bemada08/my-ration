/* ==================== ОБЩИЕ ВИДЖЕТЫ ==================== */
(function() {
    'use strict';

    /* Удаляем старый виджет воды если он где-то остался в DOM */
    var oldW = document.querySelector('.water-widget');
    if (oldW) oldW.remove();

    /* ========== КНОПКА «ПРОЙТИ ОПРОС ЗАНОВО» ========== */
    function initRestartQuiz() {
        /* Не показываем на странице опроса */
        if (window.location.pathname.indexOf('quiz.html') !== -1) return;
        /* Показываем только тем, кто уже прошёл опрос */
        if (!localStorage.getItem('nutriplan_quiz_done')) return;

        var nav = document.querySelector('.header .nav');
        if (!nav) return;

        var btn = document.createElement('a');
        btn.href = '#';
        btn.className = 'nav__link nav__restart';
        btn.title = 'Пройти опрос заново';
        btn.textContent = '↻';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!confirm('Пройти опрос заново? Предыдущие настройки и план питания будут сброшены.')) return;
            /* Очищаем данные связанные с опросом и планом */
            var keys = ['nutriplan_quiz_done','nutriplan_kcal','nutriplan_protein','nutriplan_fat','nutriplan_carbs',
                        'nutriplan_weight','nutriplan_height','nutriplan_goal','nutriplan_water','nutriplan_sleep',
                        'nutriplan_problem','nutriplan_activity','nutriplan_diet','nutriplan_allergies',
                        'nutriplan_weekplan'];
            keys.forEach(function(k) { localStorage.removeItem(k); });
            window.location.href = 'quiz.html';
        });
        nav.appendChild(btn);
    }

    /* ========== МОБИЛЬНОЕ МЕНЮ-БУРГЕР ========== */
    function initBurgerMenu() {
        var header = document.querySelector('.header__inner');
        var nav = document.querySelector('.header .nav');
        if (!header || !nav) return;

        /* Кнопка-бургер */
        var burger = document.createElement('button');
        burger.className = 'burger';
        burger.setAttribute('aria-label', 'Открыть меню');
        burger.innerHTML = '<span></span><span></span><span></span>';

        /* Вставляем после логотипа (чтобы логотип слева, бургер справа) */
        header.appendChild(burger);

        burger.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.toggle('nav--open');
            burger.classList.toggle('burger--open');
            document.body.classList.toggle('nav-open-body');
        });

        /* Клик по ссылке внутри меню — закрыть */
        nav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                nav.classList.remove('nav--open');
                burger.classList.remove('burger--open');
                document.body.classList.remove('nav-open-body');
            }
        });

        /* Клик вне меню — закрыть */
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !burger.contains(e.target)) {
                nav.classList.remove('nav--open');
                burger.classList.remove('burger--open');
                document.body.classList.remove('nav-open-body');
            }
        });
    }

    /* ========== ИНИЦИАЛИЗАЦИЯ ========== */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initBurgerMenu();
            initRestartQuiz();
        });
    } else {
        initBurgerMenu();
        initRestartQuiz();
    }
})();

/* ==================== ОБЩИЕ ФУНКЦИИ (доступны глобально) ==================== */

/* Расчёт базового метаболизма (BMR) и суточной нормы по формуле Миффлина–Сан Жеора
   gender: 'male' | 'female'
   age: число лет
   height: рост в см
   weight: вес в кг
   activity: коэффициент активности (1.2 – 1.9)
   goal: 'lose' | 'maintain' | 'gain'
   Возвращает объект: { bmr, maintain, kcal, protein, fat, carbs, bmi, bmiStatus } */
function nutriCalc(gender, age, height, weight, activity, goal) {
    var bmr = gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age - 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    var maintain = Math.round(bmr * activity);
    var kcal = maintain;
    if (goal === 'lose') kcal = maintain - 500;
    else if (goal === 'gain') kcal = maintain + 500;

    /* БЖУ: 30% белок, 30% жир, 40% углеводы */
    var protein = Math.round(kcal * 0.30 / 4);
    var fat     = Math.round(kcal * 0.30 / 9);
    var carbs   = Math.round(kcal * 0.40 / 4);

    /* ИМТ */
    var h = height / 100;
    var bmi = weight / (h * h);
    var bmiStatus = 'normal';
    if (bmi < 18.5) bmiStatus = 'under';
    else if (bmi < 25) bmiStatus = 'normal';
    else if (bmi < 30) bmiStatus = 'over';
    else bmiStatus = 'obese';

    return {
        bmr: Math.round(bmr),
        maintain: maintain,
        kcal: kcal,
        protein: protein,
        fat: fat,
        carbs: carbs,
        bmi: +bmi.toFixed(1),
        bmiStatus: bmiStatus
    };
}
