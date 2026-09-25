/* Нарек Погосян — поведение листа.
   Три вещи: тема, штамп с номером текущего листа и подсветка корешка.
   Ничего больше — страница должна работать и без этого файла. */

(function () {
  'use strict';

  /* --- Тема: день / ночь ------------------------------------------------ */

  var root = document.documentElement;
  var btn  = document.getElementById('themeBtn');
  var KEY  = 'np-theme';

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (btn) {
      /* Кнопка называет то, во что переключит. */
      btn.textContent = theme === 'dark' ? 'день' : 'ночь';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Светлая тема' : 'Тёмная тема');
    }
  }

  apply(read(KEY) || (systemDark() ? 'dark' : 'light'));

  if (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      store(KEY, next);
    });
  }

  /* --- Штамп и корешок --------------------------------------------------- */

  var sections = [].slice.call(document.querySelectorAll('.sec[data-num]'));
  var num   = document.getElementById('stampNum');
  var title = document.getElementById('stampTitle');
  var links = [].slice.call(document.querySelectorAll('.rail a[data-rail]'));

  if (!sections.length) return;

  var current = null;

  function mark(sec) {
    if (sec === current) return;
    current = sec;

    var n = sec.getAttribute('data-num');
    if (num)   num.textContent = n;
    if (title) title.textContent = sec.getAttribute('data-title') || '';

    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('on', links[i].getAttribute('data-rail') === n);
      if (links[i].getAttribute('data-rail') === n) {
        links[i].setAttribute('aria-current', 'true');
      } else {
        links[i].removeAttribute('aria-current');
      }
    }
  }

  if ('IntersectionObserver' in window) {
    /* Активным считаем раздел, пересекающий полосу чуть выше середины экрана. */
    var io = new IntersectionObserver(function (entries) {
      var best = null;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          if (!best || entries[i].boundingClientRect.top < best.boundingClientRect.top) {
            best = entries[i];
          }
        }
      }
      if (best) mark(best.target);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    for (var i = 0; i < sections.length; i++) io.observe(sections[i]);
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

  mark(sections[0]);
}());
