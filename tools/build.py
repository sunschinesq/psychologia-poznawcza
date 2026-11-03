import json, re, sys, html

notes_path, plan_txt, out_path = sys.argv[1:4]
notes = json.load(open(notes_path))

# drop the colour legend lines from the intro (the app draws its own legend)
notes['intro'] = [b for b in notes['intro'] if '●' not in b.get('h', '') and not b.get('h', '').startswith('<b>definicje</b>')]

# ---------- plan ----------
DAYS = {'pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'}
rows, cur = [], None
for raw in open(plan_txt, encoding='utf-8'):
    line = raw.rstrip('\n').replace('☐', '').rstrip()
    if not line.strip() or line.strip().startswith(('Plan nauki – psychologia poznawcza', 'Nr ', 'Legenda', 'bez nowego')):
        continue
    left, right = line[:22], line[22:].strip()
    m = re.match(r'\s*(\d+)?\s+(pon|wt|śr|czw|pt|sob|niedz)\s*(\d\d\.\d\d)?', left)
    if m:
        cur = {'nr': int(m.group(1)) if m.group(1) else None, 'dow': m.group(2), 'date': m.group(3), 'text': right}
        rows.append(cur)
    elif cur is not None:
        m2 = re.match(r'\s*(\d\d\.\d\d)', left)
        if m2 and not cur['date']:
            cur['date'] = m2.group(1)
        if right:
            cur['text'] += ' ' + right
# keep only from first row with nr
start = next(i for i, r in enumerate(rows) if r['nr'] == 1)
rows = rows[start:]
plan = []
for r in rows:
    d, mth = r['date'].split('.')
    iso = f'2026-{mth}-{d}'
    text = re.sub(r'\s+', ' ', r['text']).strip()
    parts = re.split(r'(Blok \d(?:–\d)?:)', text)
    blocks = []
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            blocks.append({'label': parts[i][:-1], 'text': parts[i + 1].strip()})
    stage = 1 if iso <= '2026-11-22' else (2 if iso <= '2026-12-13' else 3)
    entry = {'nr': r['nr'], 'date': iso, 'dow': r['dow'], 'stage': stage, 'blocks': blocks}
    if not blocks:
        entry['note'] = text
    plan.append(entry)

# ---------- flashcards ----------
def plain(h):
    return html.unescape(re.sub(r'<[^>]+>', '', h)).strip()

SKIP_TERMS = {'Nie są tożsame', 'Przypominanie jest procesem dwufazowym', 'Kategoryzacja = porównanie z ważnym egzemplarzem', 'Postacie kontroli: monitorowanie', 'Nurt teorioinformacyjny – Broadbent'}
cards = []
for s in notes['sections']:
    for q in s['questions']:
        for b in q['blocks']:
            if b['t'] != 'item' or b['c'] in ('grey', 'yellow', 'num'):
                continue
            m = re.match(r'^<b>([^<]+)</b>\s*(\([^)]*\))?\s*(?:–|:)\s*(.+)$', b['h'])
            if not m:
                continue
            term = plain(m.group(1)).rstrip(':').strip()
            if len(term) < 3 or len(term) > 48 or term.lower().startswith(('dodatkowo', 'sprawdzone', 'wniosek', 'wnioski', 'krytyka', 'badanie', 'przebieg', 'istota', 'rola', 'skutki', 'mechanizm', 'czynniki', 'funkcje', 'metody', 'podział', 'fazy', 'cechy formalne')):
                continue
            if term in SKIP_TERMS or re.match(r'^\d', term):
                continue
            extra = plain(m.group(2)) if m.group(2) else ''
            cards.append({'id': f'{q["n"]}-{len(cards)}', 'q': q['n'], 's': s['id'],
                          'term': term + (' ' + extra if extra else ''), 'def': m.group(3).strip()})
# stable ids: question number + index within question
per_q = {}
for c in cards:
    per_q[c['q']] = per_q.get(c['q'], 0) + 1
    c['id'] = f'{c["q"]}.{per_q[c["q"]]}'

data = {'notes': notes, 'plan': plan, 'cards': cards}
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('// Wygenerowane z PDF-ów (notatka + plan nauki). Nie edytuj ręcznie.\n')
    f.write('window.APP_DATA = ')
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print('plan days', len(plan), 'cards', len(cards))
for p in plan[:3] + plan[-6:]:
    print(p)
