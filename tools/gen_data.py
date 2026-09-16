# -*- coding: utf-8 -*-
"""Собирает js/data.js из файла 2026年茶叶价格表.xlsx.

Цифры не переписываются руками: скрипт читает лист и раскладывает 45 позиций
по садам и сезонам, сохраняя историю цен 2014-2026.
"""
import json
import os
import re
import sys

import openpyxl

# Путь к прайсу передаётся первым аргументом; по умолчанию — файл рядом со скриптом.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', '2026年茶叶价格表.xlsx')
OUT = os.path.join(ROOT, 'js', 'data.js')

# --- сады: ключ = строка 产地 из файла без сезонной скобки -------------------
# img — слаг картинки, note — короткое описание участка на трёх языках.
GARDENS = {
    '一村,苗寨，木文': dict(
        key='yicun', img='garden-yicun',
        ru='Ицунь · Мяочжай · Мувэнь', en='Yicun · Miaozhai · Muwen', zh='一村 · 苗寨 · 木文'),
    '二村,把边': dict(
        key='ercun', img='garden-ercun',
        ru='Эрцунь · Бабянь', en='Ercun · Babian', zh='二村 · 把边'),
    '外村，外二村，将来，江浦': dict(
        key='waicun', img='garden-waicun',
        ru='Вайцунь · Вайэрцунь · Цзянлай · Цзянпу', en='Waicun · Wai’ercun · Jianglai · Jiangpu',
        zh='外村 · 外二村 · 将来 · 江浦'),
    '紫芽村': dict(
        key='ziya', img='garden-ziya',
        ru='Цзыяцунь · пурпурная почка', en='Ziya Village · Purple Bud', zh='紫芽村'),
    '厂区紫芽': dict(
        key='ziya-estate', img='garden-ziya-estate',
        ru='Пурпурная почка, участок при фабрике', en='Purple Bud, Factory Estate', zh='厂区紫芽'),
    '白霜茶': dict(
        key='baishuang', img='garden-baishuang',
        ru='Байшуан · «Белый иней»', en='Baishuang · White Frost', zh='白霜茶'),
    '山春茶，大班寨': dict(
        key='dabanzhai', img='garden-dabanzhai',
        ru='Шаньчунь · Дабаньчжай', en='Shanchun · Dabanzhai', zh='山春茶 · 大班寨'),
    '会塔': dict(key='huita', img='garden-huita', ru='Хуэйта', en='Huita', zh='会塔'),
    '巴多里': dict(key='baduoli', img='garden-baduoli', ru='Бадоли', en='Baduoli', zh='巴多里'),
    '普家乐，勐蒙，班多': dict(
        key='pujiale', img='garden-pujiale',
        ru='Пуцзяле · Мэнмэн · Баньдо', en='Pujiale · Mengmeng · Banduo', zh='普家乐 · 勐蒙 · 班多'),
    '虎帕，南普乐': dict(
        key='hupa', img='garden-hupa',
        ru='Хупа · Наньпуле', en='Hupa · Nanpule', zh='虎帕 · 南普乐'),
    '虎南卡': dict(key='hunanka', img='garden-hunanka', ru='Хунанька', en='Hunanka', zh='虎南卡'),
    '普思旺': dict(key='pusiwang', img='garden-pusiwang', ru='Пусыван', en='Pusiwang', zh='普思旺'),
    '潘安': dict(key='panan', img='garden-panan', ru='Пань’ань', en='Pan’an', zh='潘安'),
    '回窝': dict(key='huiwo', img='garden-huiwo', ru='Хуэйво', en='Huiwo', zh='回窝'),
    '模勒': dict(key='mole', img='garden-mole', ru='Моле', en='Mole', zh='模勒'),
    '外外村，班易': dict(
        key='waiwai', img='garden-waiwai',
        ru='Вайвайцунь · Баньи', en='Waiwaicun · Banyi', zh='外外村 · 班易'),
}

# Наценка к прайсу поставщика. Отсюда она попадает и в data.js, и в отчёт скрипта,
# чтобы цифра не разъезжалась по файлу.
MARKUP = 1.15

SEASONS = {'春': 'spring', '夏': 'summer', '秋': 'autumn'}

FACTORIES = {
    '把边茶厂': dict(key='babian', ru='Чайная фабрика Бабянь', en='Babian Tea Factory', zh='把边茶厂'),
    '勐门茶厂': dict(key='mengmen', ru='Чайная фабрика Мэнмэнь', en='Mengmen Tea Factory', zh='勐门茶厂'),
}


def split_season(raw):
    """'会塔(春)' -> ('会塔', 'spring'). Скобки в файле и полуширинные, и полные."""
    m = re.search(r'[（(]\s*([春夏秋])\s*[）)]', raw)
    if not m:
        return raw.strip(), None
    return raw[:m.start()].strip(), SEASONS[m.group(1)]


def main():
    wb = openpyxl.load_workbook(SRC, data_only=True)
    ws = wb.active

    years = []
    for cell in ws[2][4:]:                       # строка 2 — шапка: 编号 厂名 产地 单位 2026年 ...
        if cell.value and re.match(r'^\d{4}年$', str(cell.value)):
            years.append(int(str(cell.value)[:4]))

    products, factory = [], None
    for row in ws.iter_rows(min_row=4, values_only=True):
        num, fac, origin, unit = row[0], row[1], row[2], row[3]
        if fac:
            factory = FACTORIES[str(fac).strip()]['key']
        if not origin or num is None:
            continue

        garden_raw, season = split_season(str(origin))
        garden = GARDENS[garden_raw]

        history = {}
        for i, year in enumerate(years):
            value = row[4 + i]
            if isinstance(value, (int, float)):
                history[year] = round(float(value), 2)

        current = history.get(2026)
        last_year = max(history) if history else None

        products.append(dict(
            id=int(num),
            g=garden['key'],
            f=factory,
            s=season,
            base=current,                       # None -> цена по запросу
            last=None if current else last_year,
        ))

    gardens = []
    seen = set()
    for raw, meta in GARDENS.items():
        if meta['key'] in seen:
            continue
        seen.add(meta['key'])
        gardens.append(dict(key=meta['key'], img=meta['img'],
                            name=dict(ru=meta['ru'], en=meta['en'], zh=meta['zh'])))

    factories = [dict(key=v['key'], name=dict(ru=v['ru'], en=v['en'], zh=v['zh']))
                 for v in FACTORIES.values()]

    def js(obj, indent=0):
        return json.dumps(obj, ensure_ascii=False, indent=indent if indent else None)

    priced = [p for p in products if p['base']]
    lo, hi = min(p['base'] for p in priced), max(p['base'] for p in priced)

    lines = [
        '/* ============================================================================',
        '   Каталог. Файл собран скриптом из «2026年茶叶价格表.xlsx» — цифры не набирались',
        '   руками. base — цена прайса 2026 за кг в юанях ДО наценки; на сайт она выходит',
        '   умноженной на MARKUP. Историю прошлых лет из файла не переносим: на сайте',
        '   она нигде не показывается.',
        '   Две позиции без цены 2026 (last: год последней котировки) показываются как',
        '   «цена по запросу» — выдумывать за них цифру нельзя.',
        '   ============================================================================ */',
        "'use strict';",
        '',
        '/* Наценка к прайсу поставщика: +%g %%. */' % round((MARKUP - 1) * 100),
        'const MARKUP = %s;' % MARKUP,
        '',
        "const CURRENCY = 'CNY';",
        "const PRICE_VALID_UNTIL = '2026-12-31';",
        '',
        '/* Диапазон цен прайса 2026 до наценки — для подзаголовков и разметки. */',
        'const PRICE_MIN = %g;' % lo,
        'const PRICE_MAX = %g;' % hi,
        '',
        'const FACTORIES = ' + js(factories, 2) + ';',
        '',
        'const SEASONS = [',
        "  { key: 'spring', img: 'season-spring' },",
        "  { key: 'summer', img: 'season-summer' },",
        "  { key: 'autumn', img: 'season-autumn' }",
        '];',
        '',
        'const GARDENS = ' + js(gardens, 2) + ';',
        '',
        'const PRODUCTS = [',
    ]
    for p in products:
        lines.append('  ' + js(p) + ',')
    lines[-1] = lines[-1][:-1]
    lines += ['];', '']

    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(lines))

    print('products:', len(products), '| gardens:', len(gardens), '| years:', years)
    print('no 2026 price:', [(p['id'], p['g'], p['last']) for p in products if not p['base']])
    print('price range 2026: %g - %g | +%g%% = %g - %g'
          % (lo, hi, round((MARKUP - 1) * 100), round(lo * MARKUP), round(hi * MARKUP)))


if __name__ == '__main__':
    main()
