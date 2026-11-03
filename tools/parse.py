import pdfplumber, sys, json, re, html

COLORS = {
    (0.85, 0.19, 0.15): 'red',
    (0.89, 0.64, 0.0): 'yellow',
    (0.18, 0.62, 0.27): 'green',
    (0.6, 0.63, 0.65): 'grey',
}


def col(ch):
    c = ch['non_stroking_color'] or (0,)
    return tuple(round(x, 2) for x in c)


def is_bold(ch):
    return 'Bold' in ch['fontname']


def esc(s):
    return html.escape(s, quote=False)


def line_html(chars):
    out, cur, buf = [], None, ''
    for ch in chars:
        kind = 'sub' if 7.3 < ch['size'] < 7.45 and ch['text'].strip() else ('b' if is_bold(ch) and ch['text'].strip() else (cur if ch['text'] == ' ' and cur == 'b' else None))
        if kind != cur:
            if buf:
                out.append(f'<{cur}>{esc(buf)}</{cur}>' if cur else esc(buf))
            cur, buf = kind, ''
        buf += ch['text']
    if buf:
        out.append(f'<{cur}>{esc(buf)}</{cur}>' if cur else esc(buf))
    h = ''.join(out)
    h = re.sub(r'\s+</b>', '</b> ', h)
    return re.sub(r'\s+', ' ', h).strip()


def plain(h):
    return re.sub(r'<[^>]+>', '', h)


def main(path):
    pdf = pdfplumber.open(path)
    events = []  # (page, top, kind, payload)
    for pi, p in enumerate(pdf.pages):
        H = p.height
        real_tables = []
        for t in p.find_tables():
            x0, top, x1, bottom = t.bbox
            inside = [c for c in p.chars if top <= c['top'] <= bottom and x0 <= c['x0'] <= x1]
            if any(abs(c['size'] - 8.2) < 0.2 for c in inside) and not any(abs(c['size'] - 11) < 0.2 for c in inside):
                rows = [[re.sub(r'\s+', ' ', (cell or '')).strip() for cell in r] for r in t.extract()]
                real_tables.append(t.bbox)
                events.append((pi, top, 'table', rows))

        def in_table(c):
            return any(b[1] - 1 <= c['top'] <= b[3] + 1 and b[0] - 1 <= c['x0'] <= b[2] + 1 for b in real_tables)

        chars = [c for c in p.chars if not in_table(c) and c['top'] < H - 40]
        # group lines; subscripts join nearest line above
        chars.sort(key=lambda c: c['top'])
        lines = []
        for c in chars:
            if 7.3 < c['size'] < 7.45 and lines:
                # subscript
                lines[-1].append(c)
                continue
            if lines and abs(lines[-1][0]['top'] - c['top']) <= 3:
                lines[-1].append(c)
            else:
                lines.append([c])
        for ln in lines:
            ln.sort(key=lambda c: c['x0'])
            events.append((pi, min(c['top'] for c in ln), 'line', ln))
    events.sort(key=lambda e: (e[0], e[1]))

    doc = {'intro': [], 'sections': [], 'appendix': []}
    cur_blocks = doc['intro']
    cur_q = None
    sec = None
    last = None  # last block for continuation
    last_kind = None
    appendix_mode = False
    for pi, top, kind, payload in events:
        if kind == 'table':
            rows = payload
            prev = cur_blocks[-1] if cur_blocks else None
            if prev and prev['t'] == 'table' and len(prev['rows'][0]) == len(rows[0]):
                prev['rows'].extend(rows[1:] if rows[0] == prev['rows'][0] else rows)
            else:
                cur_blocks.append({'t': 'table', 'rows': rows})
            last = None
            continue
        ln = payload
        txt = ''.join(c['text'] for c in ln).strip()
        if not txt:
            continue
        f = next(c for c in ln if c['text'].strip())
        size = round(f['size'], 1)
        if size == 20.0:
            continue  # doc title
        if size == 13.5:
            m = re.match(r'([IVX]+)\.\s*(.*?)\s*\(pyt\. (\d+)–(\d+)\)', txt)
            if not m:
                appendix_mode = True
                app = {'title': txt, 'blocks': []}
                doc['appendix'].append(app)
                cur_blocks = app['blocks']
                last = None
                continue
            sec = {'id': m.group(1), 'title': m.group(2), 'from': int(m.group(3)), 'to': int(m.group(4)), 'source': '', 'questions': []}
            doc['sections'].append(sec)
            cur_blocks = []
            last = None
            continue
        if any(abs(c['size'] - 11) < 0.2 for c in ln):
            m = re.match(r'(\d+)\.\s*(.*)', txt)
            if m and sec is not None and not appendix_mode:
                cur_q = {'n': int(m.group(1)), 'title': m.group(2).strip(), 'blocks': []}
                sec['questions'].append(cur_q)
                cur_blocks = cur_q['blocks']
                last_kind = 'qtitle'
            elif last_kind == 'qtitle':
                cur_q['title'] += ' ' + txt
            continue
        if 'Oblique' in f['fontname'] and size == 7.8:
            if txt.startswith('Źródła:') and sec is not None and not sec['source'] and not sec['questions']:
                sec['source'] = txt
            else:
                cur_blocks.append({'t': 'caption', 'h': esc(txt)})
            last = None
            last_kind = 'cap'
            continue
        if size == 7.5:
            cur_blocks.append({'t': 'caption', 'h': esc(txt)})
            last = None
            last_kind = 'cap'
            continue
        # appendix headings: bold 9.3 lines starting at left margin, after section VIII ends
        x0 = f['x0']
        bold_all = all(is_bold(c) for c in ln if c['text'].strip())
        if f['text'] == '●' and size == 10.0:
            color = COLORS.get(col(f), 'plain')
            rest = [c for c in ln if c is not f]
            b = {'t': 'item', 'c': color, 'h': line_html(rest)}
            cur_blocks.append(b)
            last = b
            last_kind = 'item'
            continue
        if f['text'] == '–' and 'Helvetica' in f['fontname']:
            rest = [c for c in ln if c is not f]
            b = {'t': 'item', 'c': 'plain', 'h': line_html(rest)}
            cur_blocks.append(b)
            last = b
            last_kind = 'item'
            continue
        if bold_all and x0 < 52 and size == 9.3 and (txt.startswith(('Ściąga', 'Pytania kontrolne', 'Co poprawiono', 'Niejasności', 'Nie udało', 'Jak napisać'))):
            if txt.startswith(('Ściąga',)):
                appendix_mode = True
            if appendix_mode:
                app = {'title': txt, 'blocks': []}
                doc['appendix'].append(app)
                cur_blocks = app['blocks']
            else:
                cur_blocks.append({'t': 'h', 'h': esc(txt)})
            last = None
            last_kind = 'h'
            continue
        if appendix_mode is False and sec is not None and doc['sections'][-1]['id'] == 'VIII' and txt.startswith('Ściąga'):
            pass
        h = line_html(ln)
        if re.match(r'^\d+\.\s', txt) and x0 > 52:
            b = {'t': 'item', 'c': 'num', 'h': h}
            cur_blocks.append(b)
            last = b
            last_kind = 'item'
            continue
        if last is not None and x0 > 52:
            last['h'] += ' ' + h
            continue
        if last is not None and last.get('t') == 'p' and x0 < 52:
            last['h'] += ' ' + h
            continue
        b = {'t': 'p', 'h': h}
        cur_blocks.append(b)
        last = b
        last_kind = 'p'

    # tidy html: merge adjacent bold, fix hyphen spacing
    def tidy(h):
        h = h.replace('</b> <b>', ' ').replace('</b><b>', '')
        return re.sub(r'\s+', ' ', h).strip()

    def walk(blocks):
        for b in blocks:
            if 'h' in b:
                b['h'] = tidy(b['h'])
    walk(doc['intro'])
    for s in doc['sections']:
        for q in s['questions']:
            walk(q['blocks'])
    for a in doc['appendix']:
        walk(a['blocks'])
    return doc


if __name__ == '__main__':
    d = main(sys.argv[1])
    json.dump(d, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
    print('sections', len(d['sections']), 'questions', sum(len(s['questions']) for s in d['sections']))
    print([q['n'] for s in d['sections'] for q in s['questions']])
    print('appendix', [a['title'] for a in d['appendix']])
