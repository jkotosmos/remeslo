/* ============================================================================
   Логика страницы: язык, каталог, график, разметка для поисковиков.
   Зависит от I18N (i18n.js) и PRODUCTS / GARDENS / FACTORIES / MARKUP (data.js).
   ============================================================================ */
'use strict';

const SITE = 'https://jkotosmos.github.io/tea/';
const PAGE_STEP = 12;
const LOCALES = { ru: 'ru-RU', en: 'en-US', zh: 'zh-CN' };
const OG_LOCALES = { ru: 'ru_RU', en: 'en_US', zh: 'zh_CN' };

const CONTACT = {
  phone: '+79001433601',                 // он же WhatsApp
  telegram: 'https://t.me/speakkek',
  email: 'speakkek@gmail.com'
};

/* Курс ЦБ РФ на указанную дату. Страница не ходит в интернет (connect-src 'none'),
   поэтому курс зашит в код и обновляется руками — цифра в прайсе всё равно юаневая,
   рубли на витрине справочные. Меняете курс — поменяйте и дату: она видна в сноске. */
const RUB_PER_CNY = 12.1655;
const RUB_RATE_DATE = '2026-08-08';

const state = {
  lang: 'ru',
  cur: 'RUB',
  season: 'all',
  factory: 'all',
  query: '',
  sort: 'default',
  shown: PAGE_STEP
};

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const GARDEN_BY_KEY  = Object.fromEntries(GARDENS.map(g => [g.key, g]));
const FACTORY_BY_KEY = Object.fromEntries(FACTORIES.map(f => [f.key, f]));

/* ------------------------------------------------------------------ утилиты */

/** Ключ из словаря текущего языка; если его там нет — русский вариант. */
function t(key) {
  const dict = I18N[state.lang] || I18N.ru;
  return dict[key] !== undefined ? dict[key] : (I18N.ru[key] !== undefined ? I18N.ru[key] : key);
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fill(tpl, values) {
  return Object.keys(values).reduce((acc, k) => acc.split('{' + k + '}').join(values[k]), tpl);
}

/** Цена прайса + наценка, округлённая до целого юаня.
    Одно и то же число уходит и в вёрстку, и в микроразметку — расхождений нет. */
function priced(base) {
  return Math.round(base * MARKUP);
}

function format(value, currency) {
  try {
    return new Intl.NumberFormat(LOCALES[state.lang], {
      style: 'currency', currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0
    }).format(value);
  } catch (e) {
    return num(value) + ' ' + (currency === 'RUB' ? '₽' : '¥');  // старые движки не знают narrowSymbol
  }
}

/** Цена в выбранной валюте. Рубли всегда со знаком «примерно»: прайс юаневый,
    и счёт выставляется в юанях — округлённый пересчёт выдавать за точную цену нельзя. */
function money(base) {
  const cny = priced(base);
  if (state.cur === 'CNY') return format(cny, CURRENCY);
  return '≈ ' + format(Math.round(cny * RUB_PER_CNY), 'RUB');
}

function num(value, decimals) {
  try {
    return new Intl.NumberFormat(LOCALES[state.lang],
      decimals ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : undefined
    ).format(value);
  } catch (e) { return String(value); }
}

function gardenName(key) {
  const garden = GARDEN_BY_KEY[key];
  return garden ? (garden.name[state.lang] || garden.name.ru) : key;
}

function factoryName(key) {
  const factory = FACTORY_BY_KEY[key];
  return factory ? (factory.name[state.lang] || factory.name.ru) : key;
}

function seasonName(key) {
  return key ? t('s_' + key) : '';
}

function waHref(extra) {
  const text = extra ? t('wa_msg') + ' — ' + extra : t('wa_msg');
  return 'https://wa.me/' + CONTACT.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(text);
}

/** Заголовок позиции: сад + сезон, если сезон у позиции есть. */
function productName(p) {
  const name = gardenName(p.g);
  return p.s ? name + ' · ' + seasonName(p.s) : name;
}

/* ------------------------------------------------------------------- языки */

function applyI18n() {
  const dict = I18N[state.lang] || I18N.ru;

  document.documentElement.lang = dict.html_lang || state.lang;
  document.title = t('meta_title');
  $('#metaDesc').content = t('meta_desc');
  $('#ogTitle').content  = t('meta_title');
  $('#ogDesc').content   = t('og_desc');
  $('#ogLocale').content = OG_LOCALES[state.lang] || 'ru_RU';

  $$('[data-i18n]').forEach(el      => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML   = t(el.dataset.i18nHtml); });
  $$('[data-i18n-ph]').forEach(el   => { el.placeholder = t(el.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });

  $$('.lang-switch button').forEach(btn => {
    const on = btn.dataset.lang === state.lang;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });

  $$('.cur-switch button').forEach(btn => {
    const on = btn.dataset.cur === state.cur;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });

  $('#heroWa').href = waHref();
  $('#barWa').href  = waHref();
  $('#waLink').href = waHref();
  $('#tgLink').href = CONTACT.telegram;
  $('#mailLink').href = 'mailto:' + CONTACT.email;
  $('#waValue').textContent   = CONTACT.phone;
  $('#tgValue').textContent   = CONTACT.telegram.replace('https://t.me/', '@');
  $('#mailValue').textContent = CONTACT.email;

  $('#catLead').textContent = fill(t('cat_lead'), {
    min: money(PRICE_MIN), max: money(PRICE_MAX)
  });

  // ru-RU отдаёт «31 декабря 2026 г.» — точка в конце даёт «г..» перед следующей фразой
  // ru-RU отдаёт «31 декабря 2026 г.»: точка в конце даёт «г..» перед следующей
  // фразой, а одинокое «г» перед двоеточием читается как опечатка — убираем весь хвост
  const longDate = iso => new Date(iso)
    .toLocaleDateString(LOCALES[state.lang], { year: 'numeric', month: 'long', day: 'numeric' })
    .replace(/\s*г\.?$/, '')
    .replace(/\.$/, '');

  $('#priceNote').textContent = fill(t('price_note'), { date: longDate(PRICE_VALID_UNTIL) });

  // сноска про курс нужна, только когда на витрине рубли
  const rateNote = $('#rateNote');
  rateNote.hidden = state.cur !== 'RUB';
  rateNote.textContent = fill(t('rate_note'), {
    date: longDate(RUB_RATE_DATE),
    rate: num(RUB_PER_CNY, 4)          // курс ЦБ даётся с четырьмя знаками, не режем
  });

  renderFeatured();
  renderSeasons();
  renderFilters();
  renderSortOptions();
  renderFaq();
  renderCatalog();
  renderJsonLd();
}

function setLang(lang, push) {
  if (!I18N[lang]) return;
  state.lang = lang;
  try { localStorage.setItem('yt_lang', lang); } catch (e) { /* приватный режим */ }
  if (push) {
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
  applyI18n();
}

function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && I18N[fromUrl]) return fromUrl;

  let saved = null;
  try { saved = localStorage.getItem('yt_lang'); } catch (e) { /* нет доступа */ }
  if (saved && I18N[saved]) return saved;

  const nav = (navigator.languages && navigator.languages[0] || navigator.language || 'ru').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ru') || nav.startsWith('uk') || nav.startsWith('be') || nav.startsWith('kk')) return 'ru';
  return 'en';
}

/* ----------------------------------------------------------------- валюта */

function setCur(cur) {
  if (cur !== 'RUB' && cur !== 'CNY') return;
  state.cur = cur;
  try { localStorage.setItem('yt_cur', cur); } catch (e) { /* приватный режим */ }
  applyI18n();
}

/** Русскому покупателю по умолчанию показываем рубли, остальным — юани прайса. */
function detectCur() {
  let saved = null;
  try { saved = localStorage.getItem('yt_cur'); } catch (e) { /* нет доступа */ }
  if (saved === 'RUB' || saved === 'CNY') return saved;
  return state.lang === 'ru' ? 'RUB' : 'CNY';
}

/* ---------------------------------------------------------------- флагман */

/** Пурпурная почка: три сезона деревенского сада Цзыяцунь. */
function renderFeatured() {
  const lots = PRODUCTS.filter(p => p.g === 'ziya' && p.base);
  $('#featuredPrices').innerHTML = lots.map(p => `
    <div class="price-card">
      <dt>${esc(seasonName(p.s))}</dt>
      <dd>${esc(money(p.base))}<small>${esc(t('lbl_per_kg'))}</small></dd>
    </div>`).join('');
}

/* ----------------------------------------------------------------- сезоны */

function renderSeasons() {
  $('#seasonGrid').innerHTML = SEASONS.map(s => `
    <article class="season-card">
      <picture>
        <source type="image/webp" srcset="img/${s.img}-450.webp 450w, img/${s.img}.webp 900w" sizes="(min-width:820px) 30vw, 92vw">
        <img src="img/${s.img}.jpg" srcset="img/${s.img}-450.jpg 450w, img/${s.img}.jpg 900w" sizes="(min-width:820px) 30vw, 92vw"
             width="900" height="675" loading="lazy" decoding="async" alt="${esc(seasonName(s.key))}">
      </picture>
      <div class="season-body">
        <h3 class="h3">${esc(seasonName(s.key))}</h3>
        <p>${esc(t('season_' + s.key + '_txt'))}</p>
        <span class="season-tag">${esc(t('season_' + s.key + '_tag'))}</span>
      </div>
    </article>`).join('');
}

/* ---------------------------------------------------------------- каталог */

function renderFilters() {
  const seasons = [{ key: 'all', label: t('filter_all') }]
    .concat(SEASONS.map(s => ({ key: s.key, label: seasonName(s.key) })));

  $('#filterSeason').innerHTML = seasons.map(item => `
    <button type="button" class="chip${item.key === state.season ? ' active' : ''}"
            data-season="${esc(item.key)}" aria-pressed="${item.key === state.season}">${esc(item.label)}</button>`).join('');

  const factories = [{ key: 'all', label: t('filter_all') }]
    .concat(FACTORIES.map(f => ({ key: f.key, label: factoryName(f.key) })));

  $('#filterFactory').innerHTML = factories.map(item => `
    <button type="button" class="chip${item.key === state.factory ? ' active' : ''}"
            data-factory="${esc(item.key)}" aria-pressed="${item.key === state.factory}">${esc(item.label)}</button>`).join('');
}

function renderSortOptions() {
  const select = $('#sort');
  const keys = ['default', 'price_asc', 'price_desc', 'name'];
  select.innerHTML = keys.map(k =>
    `<option value="${k}">${esc(t('sort_' + k))}</option>`).join('');
  select.value = state.sort;
}

/** Поиск идёт по всем трём языкам сразу: русский покупатель ищет «Хуэйта»,
    закупщик — «Huita», китайский партнёр — 会塔. Все три должны находить лот. */
function haystack(p) {
  const garden = GARDEN_BY_KEY[p.g] || { name: {} };
  const factory = FACTORY_BY_KEY[p.f] || { name: {} };
  return [
    garden.name.ru, garden.name.en, garden.name.zh,
    factory.name.ru, factory.name.en, factory.name.zh,
    p.s ? [I18N.ru['s_' + p.s], I18N.en['s_' + p.s], I18N.zh['s_' + p.s]].join(' ') : '',
    String(p.id)
  ].join(' ').toLowerCase();
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  let list = PRODUCTS.filter(p =>
    (state.season === 'all' || p.s === state.season) &&
    (state.factory === 'all' || p.f === state.factory) &&
    (!q || haystack(p).includes(q)));

  // позиции без цены всегда в конце: сортировать их не по чему
  const byPrice = dir => (a, b) => {
    if (!a.base) return 1;
    if (!b.base) return -1;
    return dir * (a.base - b.base);
  };

  if (state.sort === 'price_asc')  list = list.slice().sort(byPrice(1));
  if (state.sort === 'price_desc') list = list.slice().sort(byPrice(-1));
  if (state.sort === 'name') {
    list = list.slice().sort((a, b) =>
      gardenName(a.g).localeCompare(gardenName(b.g), LOCALES[state.lang]));
  }
  return list;
}

function priceBlock(p) {
  if (!p.base) {
    return `
      <div class="product-prices"><span class="price-ask">${esc(t('price_ask'))}</span></div>
      <span class="note-chip">${esc(fill(t('price_ask_note'), { year: p.last }))}</span>`;
  }

  return `
    <div class="product-prices">
      <span class="price-main">${esc(money(p.base))}<small>${esc(t('lbl_per_kg'))}</small></span>
    </div>`;
}

function cardHtml(p) {
  const garden = GARDEN_BY_KEY[p.g];
  const name = productName(p);
  const sizes = '(min-width:980px) 30vw, (min-width:600px) 46vw, 92vw';

  return `
  <article class="product">
    <div class="product-media">
      <picture>
        <source type="image/webp" srcset="img/${garden.img}-450.webp 450w, img/${garden.img}.webp 900w" sizes="${sizes}">
        <img src="img/${garden.img}.jpg" srcset="img/${garden.img}-450.jpg 450w, img/${garden.img}.jpg 900w" sizes="${sizes}"
             width="900" height="675" loading="lazy" decoding="async" alt="${esc(name)}">
      </picture>
      <span class="badge">${esc(factoryName(p.f))}</span>
      ${p.s ? `<span class="badge badge-season">${esc(seasonName(p.s))}</span>` : ''}
    </div>
    <div class="product-body">
      <h3 class="product-title">${esc(gardenName(p.g))}</h3>
      <p class="product-sub">№ ${esc(String(p.id))} · ${esc(factoryName(p.f))}${p.s ? ' · ' + esc(seasonName(p.s)) : ''}</p>
      ${priceBlock(p)}
      <div class="product-foot">
        <a class="btn btn-ghost btn-sm" href="${esc(waHref(name))}" target="_blank" rel="noopener noreferrer">${esc(t('ask_price'))}</a>
      </div>
    </div>
  </article>`;
}

function renderCatalog() {
  const list = filtered();
  const slice = list.slice(0, state.shown);

  $('#grid').innerHTML = slice.map(cardHtml).join('');
  $('#empty').hidden = list.length > 0;
  $('#count').textContent = fill(t('found_n'), {
    shown: num(slice.length), total: num(list.length)
  });
  $('#loadMore').hidden = slice.length >= list.length;
}

/* -------------------------------------------------------------------- FAQ */

const FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7'];

function renderFaq() {
  $('#faqList').innerHTML = FAQ_KEYS.map(n => `
    <details>
      <summary>${esc(t('q' + n))}</summary>
      <p class="answer">${esc(t('a' + n))}</p>
    </details>`).join('');
}

/* -------------------------------------------------- разметка для поисковых */

function renderJsonLd() {
  const lang = state.lang;
  const dict = I18N[lang];

  const org = {
    '@type': 'Organization',
    '@id': SITE + '#org',
    name: 'Yunnan Tea',
    url: SITE,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    sameAs: [CONTACT.telegram, 'https://wa.me/' + CONTACT.phone.replace(/\D/g, '')],
    description: dict.meta_desc,
    areaServed: ['RU', 'KZ', 'BY', 'CN'],
    address: { '@type': 'PostalAddress', addressRegion: 'Yunnan', addressCountry: 'CN' }
  };

  const itemList = {
    '@type': 'ItemList',
    '@id': SITE + '#catalog',
    name: dict.cat_title,
    numberOfItems: PRODUCTS.length,
    itemListElement: PRODUCTS.map((p, i) => {
      const product = {
        '@type': 'Product',
        name: productName(p),
        sku: 'TEA-' + p.id,
        image: SITE + 'img/' + GARDEN_BY_KEY[p.g].img + '.jpg',
        category: factoryName(p.f),
        countryOfOrigin: 'CN',
        brand: { '@type': 'Brand', name: factoryName(p.f) }
      };
      if (p.base) {
        // В разметке всегда юани, даже когда на витрине рубли: цена прайса юаневая,
        // а рублёвая — пересчёт по курсу, который к моменту индексации устареет.
        product.offers = {
          '@type': 'Offer',
          price: priced(p.base),
          priceCurrency: CURRENCY,
          eligibleQuantity: { '@type': 'QuantitativeValue', unitCode: 'KGM', value: 1 },
          priceValidUntil: PRICE_VALID_UNTIL,
          availability: 'https://schema.org/InStock',
          seller: { '@id': SITE + '#org' }
        };
      }
      return { '@type': 'ListItem', position: i + 1, item: product };
    })
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': SITE + '#faq',
    mainEntity: FAQ_KEYS.map(n => ({
      '@type': 'Question',
      name: dict['q' + n],
      acceptedAnswer: { '@type': 'Answer', text: dict['a' + n] }
    }))
  };

  const website = {
    '@type': 'WebSite',
    '@id': SITE + '#site',
    url: SITE,
    name: 'Yunnan Tea',
    inLanguage: dict.html_lang,
    publisher: { '@id': SITE + '#org' }
  };

  $('#ldGraph').textContent = JSON.stringify(
    { '@context': 'https://schema.org', '@graph': [org, website, itemList, faq] });
}

/* ------------------------------------------------------------- интерактив */

function resetPage() { state.shown = PAGE_STEP; }

function bind() {
  $$('.lang-switch button').forEach(btn =>
    btn.addEventListener('click', () => setLang(btn.dataset.lang, true)));

  $$('.cur-switch button').forEach(btn =>
    btn.addEventListener('click', () => setCur(btn.dataset.cur)));

  $('#filterSeason').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.season = chip.dataset.season;
    resetPage(); renderFilters(); renderCatalog();
  });

  $('#filterFactory').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.factory = chip.dataset.factory;
    resetPage(); renderFilters(); renderCatalog();
  });

  let searchTimer;
  $('#search').addEventListener('input', e => {
    clearTimeout(searchTimer);
    const value = e.target.value;
    searchTimer = setTimeout(() => {
      state.query = value;
      resetPage(); renderCatalog();
    }, 180);
  });

  $('#sort').addEventListener('change', e => {
    state.sort = e.target.value;
    resetPage(); renderCatalog();
  });

  $('#loadMore').addEventListener('click', () => {
    state.shown += PAGE_STEP;
    renderCatalog();
  });

  const toggle = $('#navToggle');
  const mobileNav = $('#mobileNav');
  toggle.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  mobileNav.addEventListener('click', e => {
    if (e.target.closest('a')) {
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // нижняя панель появляется, когда герой уехал вверх
  const bar = $('#mobileBar');
  const hero = $('.hero');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => bar.classList.toggle('show', !entry.isIntersecting),
      { rootMargin: '-60% 0px 0px 0px' }).observe(hero);
  } else {
    bar.classList.add('show');
  }
}

/* Появление по скроллу. Скрываем только то, что и так за пределами экрана,
   поэтому сломанный или отложенный observer не оставит пустую страницу. */
function initReveal() {
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('pending');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  $$('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight) return;  // уже на экране
    el.classList.add('pending');
    io.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  state.lang = detectLang();
  state.cur = detectCur();
  bind();
  applyI18n();
  initReveal();
});
