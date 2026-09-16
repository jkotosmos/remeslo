/* ============================================================================
   Каталог. Файл собран скриптом из «2026年茶叶价格表.xlsx» — цифры не набирались
   руками. base — цена прайса 2026 за кг в юанях ДО наценки; на сайт она выходит
   умноженной на MARKUP. Историю прошлых лет из файла не переносим: на сайте
   она нигде не показывается.
   Две позиции без цены 2026 (last: год последней котировки) показываются как
   «цена по запросу» — выдумывать за них цифру нельзя.
   ============================================================================ */
'use strict';

/* Наценка к прайсу поставщика: +15 %. */
const MARKUP = 1.15;

const CURRENCY = 'CNY';
const PRICE_VALID_UNTIL = '2026-12-31';

/* Диапазон цен прайса 2026 до наценки — для подзаголовков и разметки. */
const PRICE_MIN = 312;
const PRICE_MAX = 1344;

const FACTORIES = [
  {
    "key": "babian",
    "name": {
      "ru": "Чайная фабрика Бабянь",
      "en": "Babian Tea Factory",
      "zh": "把边茶厂"
    }
  },
  {
    "key": "mengmen",
    "name": {
      "ru": "Чайная фабрика Мэнмэнь",
      "en": "Mengmen Tea Factory",
      "zh": "勐门茶厂"
    }
  }
];

const SEASONS = [
  { key: 'spring', img: 'season-spring' },
  { key: 'summer', img: 'season-summer' },
  { key: 'autumn', img: 'season-autumn' }
];

const GARDENS = [
  {
    "key": "yicun",
    "img": "garden-yicun",
    "name": {
      "ru": "Ицунь · Мяочжай · Мувэнь",
      "en": "Yicun · Miaozhai · Muwen",
      "zh": "一村 · 苗寨 · 木文"
    }
  },
  {
    "key": "ercun",
    "img": "garden-ercun",
    "name": {
      "ru": "Эрцунь · Бабянь",
      "en": "Ercun · Babian",
      "zh": "二村 · 把边"
    }
  },
  {
    "key": "waicun",
    "img": "garden-waicun",
    "name": {
      "ru": "Вайцунь · Вайэрцунь · Цзянлай · Цзянпу",
      "en": "Waicun · Wai’ercun · Jianglai · Jiangpu",
      "zh": "外村 · 外二村 · 将来 · 江浦"
    }
  },
  {
    "key": "ziya",
    "img": "garden-ziya",
    "name": {
      "ru": "Цзыяцунь · пурпурная почка",
      "en": "Ziya Village · Purple Bud",
      "zh": "紫芽村"
    }
  },
  {
    "key": "ziya-estate",
    "img": "garden-ziya-estate",
    "name": {
      "ru": "Пурпурная почка, участок при фабрике",
      "en": "Purple Bud, Factory Estate",
      "zh": "厂区紫芽"
    }
  },
  {
    "key": "baishuang",
    "img": "garden-baishuang",
    "name": {
      "ru": "Байшуан · «Белый иней»",
      "en": "Baishuang · White Frost",
      "zh": "白霜茶"
    }
  },
  {
    "key": "dabanzhai",
    "img": "garden-dabanzhai",
    "name": {
      "ru": "Шаньчунь · Дабаньчжай",
      "en": "Shanchun · Dabanzhai",
      "zh": "山春茶 · 大班寨"
    }
  },
  {
    "key": "huita",
    "img": "garden-huita",
    "name": {
      "ru": "Хуэйта",
      "en": "Huita",
      "zh": "会塔"
    }
  },
  {
    "key": "baduoli",
    "img": "garden-baduoli",
    "name": {
      "ru": "Бадоли",
      "en": "Baduoli",
      "zh": "巴多里"
    }
  },
  {
    "key": "pujiale",
    "img": "garden-pujiale",
    "name": {
      "ru": "Пуцзяле · Мэнмэн · Баньдо",
      "en": "Pujiale · Mengmeng · Banduo",
      "zh": "普家乐 · 勐蒙 · 班多"
    }
  },
  {
    "key": "hupa",
    "img": "garden-hupa",
    "name": {
      "ru": "Хупа · Наньпуле",
      "en": "Hupa · Nanpule",
      "zh": "虎帕 · 南普乐"
    }
  },
  {
    "key": "hunanka",
    "img": "garden-hunanka",
    "name": {
      "ru": "Хунанька",
      "en": "Hunanka",
      "zh": "虎南卡"
    }
  },
  {
    "key": "pusiwang",
    "img": "garden-pusiwang",
    "name": {
      "ru": "Пусыван",
      "en": "Pusiwang",
      "zh": "普思旺"
    }
  },
  {
    "key": "panan",
    "img": "garden-panan",
    "name": {
      "ru": "Пань’ань",
      "en": "Pan’an",
      "zh": "潘安"
    }
  },
  {
    "key": "huiwo",
    "img": "garden-huiwo",
    "name": {
      "ru": "Хуэйво",
      "en": "Huiwo",
      "zh": "回窝"
    }
  },
  {
    "key": "mole",
    "img": "garden-mole",
    "name": {
      "ru": "Моле",
      "en": "Mole",
      "zh": "模勒"
    }
  },
  {
    "key": "waiwai",
    "img": "garden-waiwai",
    "name": {
      "ru": "Вайвайцунь · Баньи",
      "en": "Waiwaicun · Banyi",
      "zh": "外外村 · 班易"
    }
  }
];

const PRODUCTS = [
  {"id": 1, "g": "yicun", "f": "babian", "s": "spring", "base": 1152.0, "last": null},
  {"id": 2, "g": "yicun", "f": "babian", "s": "summer", "base": 806.4, "last": null},
  {"id": 3, "g": "yicun", "f": "babian", "s": "autumn", "base": 979.2, "last": null},
  {"id": 4, "g": "ercun", "f": "babian", "s": "spring", "base": 768.0, "last": null},
  {"id": 5, "g": "ercun", "f": "babian", "s": "summer", "base": 537.6, "last": null},
  {"id": 6, "g": "ercun", "f": "babian", "s": "autumn", "base": 652.8, "last": null},
  {"id": 7, "g": "waicun", "f": "babian", "s": "spring", "base": 1296.0, "last": null},
  {"id": 8, "g": "waicun", "f": "babian", "s": "summer", "base": 907.2, "last": null},
  {"id": 9, "g": "waicun", "f": "babian", "s": "autumn", "base": 1101.6, "last": null},
  {"id": 10, "g": "ziya", "f": "babian", "s": "spring", "base": 1248.0, "last": null},
  {"id": 11, "g": "ziya", "f": "babian", "s": "summer", "base": 873.6, "last": null},
  {"id": 12, "g": "ziya", "f": "babian", "s": "autumn", "base": 1060.8, "last": null},
  {"id": 13, "g": "ziya-estate", "f": "babian", "s": "spring", "base": 1344.0, "last": null},
  {"id": 14, "g": "ziya-estate", "f": "babian", "s": "summer", "base": 940.8, "last": null},
  {"id": 15, "g": "ziya-estate", "f": "babian", "s": "autumn", "base": 1142.4, "last": null},
  {"id": 16, "g": "baishuang", "f": "babian", "s": null, "base": null, "last": 2023},
  {"id": 17, "g": "dabanzhai", "f": "mengmen", "s": null, "base": null, "last": 2024},
  {"id": 18, "g": "huita", "f": "mengmen", "s": "spring", "base": 810.0, "last": null},
  {"id": 19, "g": "huita", "f": "mengmen", "s": "summer", "base": 567.0, "last": null},
  {"id": 20, "g": "huita", "f": "mengmen", "s": "autumn", "base": 688.5, "last": null},
  {"id": 21, "g": "baduoli", "f": "mengmen", "s": "spring", "base": 810.0, "last": null},
  {"id": 22, "g": "baduoli", "f": "mengmen", "s": "summer", "base": 567.0, "last": null},
  {"id": 23, "g": "baduoli", "f": "mengmen", "s": "autumn", "base": 688.5, "last": null},
  {"id": 24, "g": "pujiale", "f": "mengmen", "s": "spring", "base": 1296.0, "last": null},
  {"id": 25, "g": "pujiale", "f": "mengmen", "s": "summer", "base": 907.2, "last": null},
  {"id": 26, "g": "pujiale", "f": "mengmen", "s": "autumn", "base": 1101.6, "last": null},
  {"id": 27, "g": "hupa", "f": "mengmen", "s": "spring", "base": 1296.0, "last": null},
  {"id": 28, "g": "hupa", "f": "mengmen", "s": "summer", "base": 907.2, "last": null},
  {"id": 29, "g": "hupa", "f": "mengmen", "s": "autumn", "base": 1101.6, "last": null},
  {"id": 30, "g": "hunanka", "f": "mengmen", "s": "spring", "base": 1152.0, "last": null},
  {"id": 31, "g": "hunanka", "f": "mengmen", "s": "summer", "base": 806.4, "last": null},
  {"id": 32, "g": "hunanka", "f": "mengmen", "s": "autumn", "base": 979.2, "last": null},
  {"id": 33, "g": "pusiwang", "f": "mengmen", "s": "spring", "base": 1152.0, "last": null},
  {"id": 34, "g": "pusiwang", "f": "mengmen", "s": "summer", "base": 806.4, "last": null},
  {"id": 35, "g": "pusiwang", "f": "mengmen", "s": "autumn", "base": 979.2, "last": null},
  {"id": 36, "g": "panan", "f": "mengmen", "s": "spring", "base": 768.0, "last": null},
  {"id": 37, "g": "panan", "f": "mengmen", "s": "summer", "base": 537.6, "last": null},
  {"id": 38, "g": "panan", "f": "mengmen", "s": "autumn", "base": 652.8, "last": null},
  {"id": 39, "g": "huiwo", "f": "mengmen", "s": "spring", "base": 672.0, "last": null},
  {"id": 40, "g": "huiwo", "f": "mengmen", "s": "summer", "base": 470.4, "last": null},
  {"id": 41, "g": "huiwo", "f": "mengmen", "s": "autumn", "base": 571.2, "last": null},
  {"id": 42, "g": "mole", "f": "mengmen", "s": "spring", "base": 672.0, "last": null},
  {"id": 43, "g": "mole", "f": "mengmen", "s": "summer", "base": 470.4, "last": null},
  {"id": 44, "g": "mole", "f": "mengmen", "s": "autumn", "base": 571.2, "last": null},
  {"id": 45, "g": "waiwai", "f": "mengmen", "s": null, "base": 312.0, "last": null}
];
