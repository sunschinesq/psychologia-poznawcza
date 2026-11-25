"""Buduje cards-data.js z ręcznie napisanych fiszek (tools/cards_source.py).
Fiszki o tym samym pojęciu co dawniej zachowują stare id (postęp w pudełkach Leitnera);
nowe dostają kolejne numery w ramach pytania, np. 12.3."""
import json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
ns = {}
exec(open(os.path.join(here, 'cards_source.py'), encoding='utf-8').read(), ns)
src = open(os.path.join(root, 'data.js'), encoding='utf-8').read()
data = json.loads(src[src.index('=') + 1:].strip().rstrip(';'))
old_ids = {c['id'] for c in data['cards']}
questions = {q['n'] for s in data['notes']['sections'] for q in s['questions']}

used, out, nxt = set(), [], {}
for q, _, _, _ in ns['CARDS']:
    nxt.setdefault(q, 1 + max([int(i.split('.')[1]) for i in old_ids if i.split('.')[0] == str(q)] or [0]))
for q, old, term, definition in ns['CARDS']:
    assert q in questions, (q, term)
    if old:
        assert old in old_ids and old.split('.')[0] == str(q), (old, term)
        cid = old
    else:
        cid = '%d.%d' % (q, nxt[q])
        nxt[q] += 1
    assert cid not in used, cid
    used.add(cid)
    assert term.strip() and len(definition) > 15 and not definition.rstrip().endswith(':'), term
    out.append({'id': cid, 'q': q, 'term': term, 'def': definition})

missing = sorted(questions - {c['q'] for c in out})
with open(os.path.join(root, 'cards-data.js'), 'w', encoding='utf-8') as f:
    f.write('// Fiszki napisane ręcznie na podstawie notatki – źródło: tools/cards_source.py (python3 tools/build_cards.py).\n')
    f.write('window.CARDS_DATA = ')
    json.dump(out, f, ensure_ascii=False, indent=0)
    f.write(';\n')
print('fiszek:', len(out), '| pytania bez fiszek:', missing, '| stare id zachowane:', len(used & old_ids), '/', len(old_ids))
