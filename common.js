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

    /* ========== КНОПКА «ВОЙТИ / ПРОФИЛЬ» ========== */
    function initAuthButton() {
        if (window.location.pathname.indexOf('auth.html') !== -1) return;
        var nav = document.querySelector('.header .nav');
        if (!nav) return;

        var btn = document.createElement('a');
        btn.className = 'nav__link nav__auth';
        btn.href = 'auth.html';
        btn.textContent = '👤 Войти';
        nav.appendChild(btn);

        function watchAuth() {
            if (!window.firebaseAPI) {
                setTimeout(watchAuth, 100);
                return;
            }
            window.firebaseAPI.onUserChange(function(user) {
                if (user) {
                    var nickname = user.email.split('@')[0];
                    btn.textContent = '👤 ' + nickname;
                    btn.href = '#';
                    btn.title = 'Выйти из аккаунта (' + user.email + ')';
                    btn.onclick = function(e) {
                        e.preventDefault();
                        if (confirm('Выйти из аккаунта?')) {
                            window.firebaseAPI.logout().then(function() {
                                window.location.reload();
                            });
                        }
                    };
                } else {
                    btn.textContent = '👤 Войти';
                    btn.href = 'auth.html';
                    btn.title = '';
                    btn.onclick = null;
                }
            });
        }
        watchAuth();
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
            initRestartQuiz();
            initAuthButton();
        });
    } else {
        initRestartQuiz();
        initAuthButton();
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

/* Возрастные особенности метаболизма
   После 25 лет базовый метаболизм падает в среднем на 1-2% за 10 лет.
   Возвращает: { stage, percent, title, desc, tips: [...] }
   stage: 'youth' (до 25) | 'prime' (25-35) | 'middle' (36-50) | 'senior' (50+) */
function ageMetabolism(age) {
    if (age < 25) {
        return {
            stage: 'youth',
            percent: 95,
            icon: '🚀',
            title: 'Метаболизм на пике',
            desc: 'В вашем возрасте обмен веществ работает максимально активно. Организм легко усваивает калории и быстро восстанавливается. Самое подходящее время заложить здоровые привычки на всю жизнь.',
            tips: [
                'Не злоупотребляйте «пустыми» калориями — даже если вес держится, фастфуд и сладкое формируют будущие проблемы',
                'Получайте достаточно белка для формирования мышечной массы (1.2-1.6 г на кг веса)',
                'Включайте больше кальция — кости продолжают укрепляться до 30 лет',
                'Вырабатывайте режим питания: 3-4 приёма пищи в одно и то же время'
            ]
        };
    } else if (age <= 35) {
        return {
            stage: 'prime',
            percent: 80,
            icon: '⚡',
            title: 'Активный метаболизм',
            desc: 'Базовый обмен веществ ещё высокий, но начинает плавно замедляться — примерно на 1-2% каждые 10 лет. Появляется первый риск набора веса при том же рационе что и в молодости.',
            tips: [
                'Если заметили что вес стал немного расти — пересмотрите порции, не калории',
                'Антиоксиданты в овощах и ягодах помогают замедлить старение клеток',
                'Магний и витамины группы B поддерживают энергию (тёмная зелень, орехи)',
                'Силовые тренировки 2 раза в неделю — лучшая защита от потери мышц'
            ]
        };
    } else if (age <= 50) {
        return {
            stage: 'middle',
            percent: 60,
            icon: '🌿',
            title: 'Замедленный метаболизм',
            desc: 'Метаболизм замедляется на 5-10% по сравнению с молодостью. Мышечная масса начинает естественно уменьшаться (саркопения). Один и тот же ужин теперь откладывается легче, чем 15 лет назад.',
            tips: [
                'Уменьшите порции на 15-20% по сравнению с возрастом 25 лет',
                'Увеличьте белок до 1.4-1.6 г на кг веса — это сохранит мышечную массу',
                'Ограничьте простые углеводы (сахар, белый хлеб) — растёт риск диабета 2 типа',
                'Добавьте Омега-3: жирная рыба 2 раза в неделю или льняное масло',
                'Кальций и витамин D становятся критически важными для костей'
            ]
        };
    } else {
        return {
            stage: 'senior',
            percent: 40,
            icon: '🌳',
            title: 'Метаболизм требует поддержки',
            desc: 'После 50 лет метаболизм замедлен на 15-20%. Снижается выработка гормонов, ухудшается усвоение белка и кальция. Питание становится одним из ключевых факторов долголетия и качества жизни.',
            tips: [
                'Белок особенно важен: 1.6-1.8 г/кг помогает бороться с потерей мышц',
                'Дробное питание 4-5 раз в день — лучше чем 2-3 больших порции',
                'Витамин B12 хуже усваивается с возрастом — ешьте больше мяса, рыбы, яиц',
                'Клетчатка 25-30 г в день — для пищеварения и сердца',
                'Сократите соль до 5 г в день — давление становится более чувствительным',
                'Пейте больше воды: чувство жажды ослабевает, риск обезвоживания растёт'
            ]
        };
    }
}
