/* Поведение листа: тема, язык, штамп с номером текущего листа
   и подсветка корешка. Страница читается и без этого файла —
   по-русски и в теме, которую попросила система. */

(function () {
  'use strict';

  var root = document.documentElement;
  var I18N = window.NP_I18N;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ------------------------------------------------------------------ */
  /*  Язык                                                               */
  /* ------------------------------------------------------------------ */

  /* Русские строки снимаем из разметки — так словарь не может разойтись
     с текстом на странице, и русский не нужно дублировать в словаре. */
  var RU = { text: [], html: [], alt: [], aria: [] };

  function collect() {
    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      RU.text.push([el, el.getAttribute('data-i18n'), el.textContent]);
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-html]'), function (el) {
      RU.html.push([el, el.getAttribute('data-i18n-html'), el.innerHTML]);
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-alt]'), function (el) {
      RU.alt.push([el, el.getAttribute('data-i18n-alt'), el.getAttribute('alt')]);
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (el) {
      RU.aria.push([el, el.getAttribute('data-i18n-aria'), el.getAttribute('aria-label')]);
    });
  }

  var META_RU = {
    title: document.title,
    desc: (document.querySelector('meta[name="description"]') || {}).content,
    ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content,
    ogDesc: (document.querySelector('meta[property="og:description"]') || {}).content,
    locale: 'ru_RU'
  };

  function setMeta(sel, attr, value) {
    var el = document.querySelector(sel);
    if (el && value != null) el.setAttribute(attr, value);
  }

  function applyLang(lang) {
    var en = lang === 'en';
    var D = I18N ? I18N.EN : {};

    RU.text.forEach(function (r) {
      var v = en ? D[r[1]] : r[2];
      if (v != null) r[0].textContent = v;
    });
    RU.html.forEach(function (r) {
      var v = en ? D[r[1]] : r[2];
      if (v != null) r[0].innerHTML = v;
    });
    RU.alt.forEach(function (r) {
      var v = en ? D[r[1]] : r[2];
      if (v != null) r[0].setAttribute('alt', v);
    });
    RU.aria.forEach(function (r) {
      var v = en ? D[r[1]] : r[2];
      if (v != null) r[0].setAttribute('aria-label', v);
    });

    /* Ключ unit.bn содержит неразрывный пробел как сущность — textContent
       её не разворачивает, поэтому такие строки ставим как разметку. */
    [].forEach.call(document.querySelectorAll('[data-i18n="unit.bn"], [data-i18n="mod"]'), function (el) {
      var k = el.getAttribute('data-i18n');
      var v = en ? D[k] : null;
      if (v != null) el.innerHTML = v;
    });

    var M = en && I18N ? I18N.META_EN : META_RU;
    document.title = M.title;
    setMeta('meta[name="description"]', 'content', M.desc);
    setMeta('meta[property="og:title"]', 'content', M.ogTitle);
    setMeta('meta[property="og:description"]', 'content', M.ogDesc);
    setMeta('meta[property="og:locale"]', 'content', M.locale);

    /* Буквы координатной сетки по верхнему полю. */
    var cols = document.getElementById('sfCols');
    if (cols && I18N) {
      var letters = I18N.COLS[en ? 'en' : 'ru'];
      [].forEach.call(cols.children, function (i, n) { i.textContent = letters[n]; });
    }

    root.lang = en ? 'en' : 'ru';
    root.setAttribute('data-lang', en ? 'en' : 'ru');

    [].forEach.call(document.querySelectorAll('[data-lang-set]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === (en ? 'en' : 'ru')));
    });

    relabel();          /* штамп держит название текущего листа */
  }

  /* ------------------------------------------------------------------ */
  /*  Тема                                                               */
  /* ------------------------------------------------------------------ */

  function systemDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function currentTheme() {
    return root.getAttribute('data-theme') || (systemDark() ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    [].forEach.call(document.querySelectorAll('[data-theme-set]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === theme));
    });
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', theme === 'dark' ? '#121110' : '#f4f1ea');
  }

  /* ------------------------------------------------------------------ */
  /*  Штамп и корешок                                                    */
  /* ------------------------------------------------------------------ */

  var sections = [].slice.call(document.querySelectorAll('.sec[data-num]'));
  var num = document.getElementById('stampNum');
  var title = document.getElementById('stampTitle');
  var links = [].slice.call(document.querySelectorAll('.rail a[data-rail]'));
  var current = sections[0] || null;

  function titleOf(sec) {
    /* Название листа берём из корешка — он уже переведён. */
    var n = sec.getAttribute('data-num');
    var a = document.querySelector('.rail a[data-rail="' + n + '"] span');
    return a ? a.textContent : '';
  }

  function relabel() {
    if (!current) return;
    if (num) num.textContent = current.getAttribute('data-num');
    if (title) title.textContent = titleOf(current);
  }

  function mark(sec) {
    if (sec === current) return;
    current = sec;
    var n = sec.getAttribute('data-num');
    relabel();
    links.forEach(function (a) {
      var on = a.getAttribute('data-rail') === n;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  function watchSections() {
    if (!sections.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        var best = null;
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (!best || e.boundingClientRect.top < best.boundingClientRect.top) best = e;
        });
        if (best) mark(best.target);
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    } else {
      var tick = false;
      window.addEventListener('scroll', function () {
        if (tick) return;
        tick = true;
        requestAnimationFrame(function () {
          tick = false;
          var mid = window.innerHeight / 2;
          for (var i = sections.length - 1; i >= 0; i--) {
            if (sections[i].getBoundingClientRect().top <= mid) { mark(sections[i]); return; }
          }
          mark(sections[0]);
        });
      }, { passive: true });
    }
    var first = sections[0];
    current = null;
    mark(first);
  }

  /* ------------------------------------------------------------------ */
  /*  Запуск                                                             */
  /* ------------------------------------------------------------------ */

  collect();

  var ctl = document.getElementById('ctl');
  if (ctl) ctl.hidden = false;          /* кнопки показываем только при рабочем JS */

  applyTheme(currentTheme());
  applyLang(root.getAttribute('data-lang') === 'en' ? 'en' : 'ru');
  watchSections();

  if (ctl) {
    ctl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme-set], [data-lang-set]');
      if (!b) return;
      var t = b.getAttribute('data-theme-set');
      if (t) { applyTheme(t); store('np-theme', t); return; }
      var l = b.getAttribute('data-lang-set');
      if (l) { applyLang(l); store('np-lang', l); }
    });
  }

  /* Печать. Закрытые <details> браузер прячет своим механизмом, который
     из CSS не перебить надёжно, — раскрываем их на время печати и
     возвращаем как было. */
  var reopened = [];
  function beforePrint() {
    reopened = [].filter.call(document.querySelectorAll('details'), function (d) { return !d.open; });
    reopened.forEach(function (d) { d.open = true; });
  }
  function afterPrint() {
    reopened.forEach(function (d) { d.open = false; });
    reopened = [];
  }
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);
  if (window.matchMedia) {
    var pm = window.matchMedia('print');
    var onPrint = function (e) { (e.matches ? beforePrint : afterPrint)(); };
    if (pm.addEventListener) pm.addEventListener('change', onPrint);
    else if (pm.addListener) pm.addListener(onPrint);
  }

  /* Пока пользователь не выбрал тему сам, следуем за системной. */
  if (window.matchMedia && !read('np-theme')) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (!read('np-theme')) applyTheme(mq.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
}());
