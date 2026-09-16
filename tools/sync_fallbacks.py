# -*- coding: utf-8 -*-
"""Подставляет в index.html русские тексты из i18n.js как статические подписи.

Зачем: подписи в разметке — это то, что видят соцсети при построении карточки
ссылки и краулеры, не выполняющие JS. Когда правишь словарь, а разметку забываешь,
они расходятся молча. Скрипт приводит их в соответствие и печатает, что поменял.

    python tools/sync_fallbacks.py           проверить (ничего не пишет)
    python tools/sync_fallbacks.py --write   записать
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
I18N = os.path.join(ROOT, 'js', 'i18n.js')


def load_ru():
    js = open(I18N, encoding='utf-8').read()
    ru = js[js.index('ru: {'):js.index('english')]
    dic = {}
    for m in re.finditer(r"^ {2}([a-z0-9_]+): '((?:[^'\\]|\\.)*)'", ru, re.M):
        dic[m.group(1)] = m.group(2).replace("\\'", "'")
    return dic


def main():
    write = '--write' in sys.argv
    dic = load_ru()
    html = open(HTML, encoding='utf-8').read()
    changed = []

    def swap(match):
        open_tag, attr, key, body = (match.group('open'), match.group('attr'),
                                     match.group('key'), match.group('body'))
        if key not in dic:
            return match.group(0)
        want = dic[key]
        # текстовые подписи экранируем, html-подписи кладём как есть
        if attr == 'data-i18n':
            want = want.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        if body.strip() == want.strip():
            return match.group(0)
        changed.append((key, body.strip()[:60], want[:60]))
        return '%s%s</%s>' % (open_tag, want, match.group('tag'))

    # data-i18n почти всегда идёт после class/href, поэтому атрибут ищем в любом месте
    pattern = re.compile(
        r'(?P<open><(?P<tag>[a-z0-9]+)[^>]*?\s(?P<attr>data-i18n(?:-html)?)'
        r'="(?P<key>[a-z0-9_]+)"[^>]*>)(?P<body>.*?)</(?P=tag)>',
        re.S)
    out = pattern.sub(swap, html)

    # мета-описания правим отдельно: у них текст в атрибуте
    for tag_id, key in [('metaDesc', 'meta_desc'), ('ogDesc', 'og_desc')]:
        m = re.search(r'(id="%s" content=")([^"]*)(")' % tag_id, out)
        if m and m.group(2) != dic.get(key, m.group(2)):
            changed.append((key, m.group(2)[:60], dic[key][:60]))
            out = out[:m.start(2)] + dic[key].replace('"', '&quot;') + out[m.end(2):]

    if not changed:
        print('подписи совпадают со словарём — править нечего')
        return

    print('расхождений: %d' % len(changed))
    for key, was, now in changed:
        print('  %-16s %s\n  %-16s -> %s' % (key, was, '', now))

    if write:
        open(HTML, 'w', encoding='utf-8', newline='\n').write(out)
        print('\nindex.html обновлён')
    else:
        print('\nзапустите с --write, чтобы применить')


if __name__ == '__main__':
    main()
