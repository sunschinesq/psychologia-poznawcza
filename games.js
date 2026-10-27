/* Gry do nauki. Korzysta z API aplikacji (window.PP) i treści z games-data.js. */
(function () {
  'use strict';

  const GD = window.GAMES_DATA;
  let PP; // ustawiane przy pierwszym użyciu (app.js ładuje się po tym pliku)
  const api = () => (PP = PP || window.PP);
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const GAMES = [
    { id: 'luka', icon: '✍', name: 'Uzupełnij lukę', desc: 'Zdanie z notatki bez jednego terminu – wybierz brakujący.', best: b => b + ' / 10' },
    { id: 'kto', icon: '🗣', name: 'Kto to powiedział?', desc: 'Hasło → autor albo autor → hasło (ściąga).', best: b => b + ' / 10' },
    { id: 'kolejnosc', icon: '🔢', name: 'Ułóż w kolejności', desc: 'Fazy, etapy i poziomy – stukaj w dobrej kolejności.', best: null },
    { id: 'tabela', icon: '▤', name: 'Puzzle z tabeli', desc: 'Rozłóż komórki do właściwych kolumn.', best: null },
    { id: 'pary', icon: '⚡', name: 'Dopasuj pary', desc: '6 terminów i 6 definicji na czas.', best: b => b + ' s' },
    { id: 'pf', icon: '⚖', name: 'Prawda czy fałsz', desc: '60 sekund, pułapki z notatki.', best: b => b + ' pkt' },
    { id: 'losuj', icon: '🎲', name: 'Losownik pytań', desc: 'Wylosuj 3 pytania na próbny egzamin.', best: null }
  ];

  // ---------- stan gier ----------
  function G() {
    const S = api().S;
    S.games = S.games || {};
    const g = S.games;
    g.best = g.best || {};
    g.seq = g.seq || {};
    g.tables = g.tables || {};
    g.plays = g.plays || {};
    return g;
  }
  function record(key, value, better) {
    const g = G();
    g.plays[key] = (g.plays[key] || 0) + 1;
    const old = g.best[key];
    const improved = old == null || better(value, old);
    if (improved) g.best[key] = value;
    api().save();
    return improved && old != null;
  }
  const higher = (a, b) => a > b;
  const lower = (a, b) => a < b;

  // ---------- seria dni ----------
  function addDays(iso, n) {
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  const isSunday = iso => new Date(iso + 'T00:00:00Z').getUTCDay() === 0;
  function streak() {
    const S = api().S;
    const act = S.activity || {};
    const today = api().todayISO();
    let n = 0;
    for (let d = today, i = 0; i < 400; i++, d = addDays(d, -1)) {
      if (act[d]) n++;
      else if (isSunday(d) || d === today) continue; // niedziela wolna; dziś jeszcze można nadrobić
      else break;
    }
    const g = G();
    if (n > (g.bestStreak || 0)) g.bestStreak = n;
    return n;
  }

  // ---------- odznaki ----------
  function badgeList() {
    const P = api();
    const S = P.S;
    const g = G();
    const st = streak();
    const stage1 = P.STUDY_DAYS.filter(p => p.stage === 1);
    const examsOnly = S.exams.filter(e => e.kind !== 'single');
    const list = [
      ['start', '👣', 'Pierwszy krok', 'Odhacz pierwszy blok z planu', Object.keys(S.done).length >= 1],
      ['seria3', '🔥', 'Rozgrzewka', 'Seria 3 dni nauki', (g.bestStreak || st) >= 3],
      ['seria6', '🔥', 'Tydzień w rytmie', 'Seria 6 dni nauki', (g.bestStreak || st) >= 6],
      ['seria12', '🔥', 'Dwa tygodnie', 'Seria 12 dni nauki', (g.bestStreak || st) >= 12],
      ['seria24', '🌋', 'Maraton', 'Seria 24 dni nauki', (g.bestStreak || st) >= 24],
      ['etap1', '🏁', 'Etap 1 za Tobą', 'Wszystkie bloki z etapu 1', stage1.every(p => P.dayDone(p) === p.blocks.length)],
      ['plan', '🎓', 'Cały plan', 'Wszystkie bloki z planu', P.doneBlocks() === P.TOTAL_BLOCKS],
      ['read72', '📚', 'Wszystko przeczytane', '72 pytania oznaczone jako przeczytane', Object.keys(S.read).length >= 72],
      ['egz1', '✎', 'Pierwszy egzamin', 'Zapisz pierwszy próbny egzamin', examsOnly.length >= 1],
      ['egz5', '✎', 'Pięć egzaminów', 'Zapisz 5 próbnych egzaminów', examsOnly.length >= 5],
      ['egzok', '🟢', 'Trzy razy dobrze', 'Egzamin z oceną „dobrze” przy każdym pytaniu', examsOnly.some(e => e.qs.every(n => e.grades[n] === 'ok'))],
      ['luka', '✍', 'Mistrz terminów', '9+/10 w „Uzupełnij lukę”', (g.best.luka || 0) >= 9],
      ['kto', '🗣', 'Znawca autorów', '9+/10 w „Kto to powiedział?”', (g.best.kto || 0) >= 9],
      ['seq', '🔢', 'Wszystko po kolei', 'Każda sekwencja bez błędu', GD.sequences.every((_, i) => g.seq[i] === 0)],
      ['tabela', '▤', 'Tabelaryczna głowa', '3 tabele ułożone bez błędu', Object.values(g.tables).filter(v => v === 0).length >= 3],
      ['pary', '⚡', 'Para za parą', 'Pary w mniej niż 30 s', g.best.pary != null && g.best.pary < 30],
      ['pf', '⚖', 'Błyskawica', '15+ pkt w „Prawda czy fałsz”', (g.best.pf || 0) >= 15],
      ['losuj', '🎲', 'Kostka rzucona', 'Użyj losownika pytań', (g.plays.losuj || 0) >= 1]
    ];
    P.NOTES.sections.forEach(s => {
      const cards = P.CARDS.filter(c => c.s === s.id);
      if (cards.length) list.push(['dzial-' + s.id, '◧', 'Dział ' + s.id + ' opanowany', 'Wszystkie fiszki działu ' + s.id + ' w pudełku 3× umiem lub wyżej', cards.every(c => P.cardBox(c.id) >= 4)]);
    });
    return list.map(([id, icon, name, desc, ok]) => ({ id, icon, name, desc, ok }));
  }
  function checkBadges() {
    const P = api();
    if (!P) return;
    const S = P.S;
    S.badges = S.badges || {};
    const fresh = badgeList().filter(b => b.ok && !S.badges[b.id]);
    if (!fresh.length) return;
    fresh.forEach(b => { S.badges[b.id] = P.todayISO(); });
    P.persist();
    P.toast('Nowa odznaka: ' + fresh.map(b => b.icon + ' ' + b.name).join(', '));
  }

  function todayCard() {
    const P = api();
    const st = streak();
    const doneToday = !!(P.S.activity || {})[P.todayISO()];
    const earned = Object.keys(P.S.badges || {}).length;
    return '<a class="card streak-card" href="#/gry"><div class="flame">' + (st ? '🔥' : '🌱') + '</div><div><div class="stat">' + st + ' ' + P.plural(st, 'dzień', 'dni', 'dni') + ' z rzędu</div>' +
      '<div class="small muted">' + (doneToday ? 'Dziś już coś zrobione ✓' : 'Dziś jeszcze nic – jeden blok albo jedna gra utrzyma serię.') + ' Niedziele nie przerywają serii.</div></div>' +
      '<div class="badge-count"><b>' + earned + '</b><span class="small muted">odznak</span></div></a>';
  }

  // ---------- ekran główny ----------
  function viewHome() {
    const P = api();
    const g = G();
    const st = streak();
    let html = '<h1>Gry</h1><p class="muted">Krótkie gry na rozgrzewkę albo przerwę między blokami. Wszystkie korzystają z Twojej notatki.</p>' +
      todayCard() + scopePicker('') + '<div class="grid2">' +
      GAMES.map(x => {
        let best = '';
        if (x.id === 'kolejnosc') { const ok = GD.sequences.filter((_, i) => g.seq[i] === 0).length; best = ok + ' / ' + GD.sequences.length + ' bez błędu'; }
        else if (x.id === 'tabela') { const ok = Object.values(g.tables).filter(v => v === 0).length; best = ok ? ok + ' bez błędu' : ''; }
        else if (x.best && g.best[x.id] != null) best = 'rekord: ' + x.best(g.best[x.id]);
        return '<a class="card tile game-tile" href="#/gry/' + x.id + '"><div class="stat">' + x.icon + '</div><b>' + x.name + '</b><div class="small muted">' + x.desc + '</div>' +
          (best ? '<div class="small best">' + best + '</div>' : '') + '</a>';
      }).join('') + '</div>';
    const badges = badgeList();
    const S = P.S;
    html += '<h2 style="margin-top:24px">Odznaki <span class="muted small">' + badges.filter(b => S.badges && S.badges[b.id]).length + ' / ' + badges.length + '</span></h2>' +
      '<p class="small muted">Najdłuższa seria: ' + Math.max(g.bestStreak || 0, st) + ' ' + P.plural(Math.max(g.bestStreak || 0, st), 'dzień', 'dni', 'dni') + '.</p><div class="badges">' +
      badges.map(b => {
        const when = S.badges && S.badges[b.id];
        return '<div class="badge' + (when ? ' on' : '') + '"><div class="bicon">' + b.icon + '</div><b>' + P.esc(b.name) + '</b><span>' + P.esc(b.desc) + '</span>' +
          (when ? '<span class="when">' + P.fmtDate(when) + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    P.setView(html, { keepScroll: viewHome.keep });
    viewHome.keep = false;
    bindScope(() => { viewHome.keep = true; viewHome(); });
  }

  function head(title, right) {
    return '<div class="row between"><a class="btn sm ghost" href="#/gry">‹ Gry</a><span class="muted small">' + (right || '') + '</span></div><h1 style="margin-top:10px">' + title + '</h1>';
  }
  // ---------- wspólny zakres pytań dla wszystkich gier ----------
  function scope() { return G().scope || { mode: 'all' }; }
  function scopeQs() {
    const P = api();
    const sc = scope();
    if (sc.mode === 'weak') return new Set(P.S.weak);
    if (sc.mode === 'secs') return new Set(P.QUESTIONS.filter(q => (sc.secs || []).includes(q.sec.id)).map(q => q.n));
    if (sc.mode === 'custom') return new Set(P.parseRange(sc.from + '–' + sc.to));
    return new Set(P.QUESTIONS.map(q => q.n));
  }
  // q = 0 oznacza materiał spoza jednego pytania (np. oś czasu) – tylko przy „wszystkich”
  function inScope(q) { return q ? scopeQs().has(q) : scope().mode === 'all'; }
  function scopeLabel() {
    const sc = scope();
    if (sc.mode === 'weak') return '★ słabe pytania (' + api().S.weak.length + ')';
    if (sc.mode === 'secs') return 'dział' + ((sc.secs || []).length > 1 ? 'y ' : ' ') + (sc.secs || []).join(', ');
    if (sc.mode === 'custom') return 'pyt. ' + (sc.from === sc.to ? sc.from : sc.from + '–' + sc.to);
    return 'wszystkie pytania (1–72)';
  }
  function setScope(sc) {
    if (sc.mode === 'secs' && !(sc.secs || []).length) sc = { mode: 'all' };
    G().scope = sc;
    api().persist();
  }
  function scopePicker(countText) {
    const P = api();
    const sc = scope();
    const secs = sc.mode === 'secs' ? sc.secs : [];
    return '<div class="card scope"><div class="row between"><b>Zakres pytań</b><span class="small muted">wspólny dla wszystkich gier</span></div>' +
      '<div class="chips" style="margin:10px 0">' +
      '<button class="chip' + (sc.mode === 'all' ? ' on' : '') + '" data-scope="all">Wszystkie</button>' +
      '<button class="chip' + (sc.mode === 'weak' ? ' on' : '') + '" data-scope="weak"' + (P.S.weak.length ? '' : ' disabled') + '>★ Słabe (' + P.S.weak.length + ')</button>' +
      P.NOTES.sections.map(x => '<button class="chip' + (secs.includes(x.id) ? ' on' : '') + '" data-scope-sec="' + x.id + '" title="' + P.esc(x.title) + '">' + x.id + ' <span class="muted">' + x.from + '–' + x.to + '</span></button>').join('') +
      '</div><div class="row range-row"><span>Własny zakres: pyt.</span>' +
      '<input type="number" inputmode="numeric" min="1" max="72" id="sc-from" value="' + (sc.mode === 'custom' ? sc.from : '') + '" placeholder="od" aria-label="od pytania">' +
      '<span>–</span><input type="number" inputmode="numeric" min="1" max="72" id="sc-to" value="' + (sc.mode === 'custom' ? sc.to : '') + '" placeholder="do" aria-label="do pytania">' +
      '<button class="btn sm' + (sc.mode === 'custom' ? ' primary' : '') + '" id="sc-set">Ustaw</button></div>' +
      '<p class="small" style="margin:10px 0 0"><b>Teraz:</b> ' + P.esc(scopeLabel()) + (countText ? ' · <span class="muted">' + countText + '</span>' : '') + '</p></div>';
  }
  function bindScope(rerender) {
    $$('[data-scope]').forEach(b => b.addEventListener('click', () => { setScope({ mode: b.dataset.scope }); rerender(); }));
    $$('[data-scope-sec]').forEach(b => b.addEventListener('click', () => {
      const sc = scope();
      const secs = sc.mode === 'secs' ? (sc.secs || []).slice() : [];
      const id = b.dataset.scopeSec;
      const at = secs.indexOf(id);
      if (at >= 0) secs.splice(at, 1); else secs.push(id);
      const order = api().NOTES.sections.map(x => x.id);
      secs.sort((x, y) => order.indexOf(x) - order.indexOf(y));
      setScope({ mode: 'secs', secs });
      rerender();
    }));
    const set = $('#sc-set');
    if (set) set.addEventListener('click', () => {
      let a = parseInt($('#sc-from').value, 10), b = parseInt($('#sc-to').value, 10);
      if (isNaN(a) && isNaN(b)) { api().toast('Wpisz numery pytań, np. 21 i 29.'); return; }
      if (isNaN(a)) a = b; if (isNaN(b)) b = a;
      a = Math.max(1, Math.min(72, a)); b = Math.max(1, Math.min(72, b));
      if (a > b) [a, b] = [b, a];
      setScope({ mode: 'custom', from: a, to: b });
      rerender();
    });
  }
  function tooFew(what) {
    return '<div class="empty">W tym zakresie jest za mało ' + what + '. Poszerz zakres powyżej.</div>';
  }
  function qLink(q) {
    const Q = api().Q[q];
    return Q ? '<a href="#/n/' + q + '">pyt. ' + q + ' · ' + api().esc(Q.title) + '</a>' : '';
  }
  function progressBar(i, n) { return '<div class="progress" style="margin:8px 0 16px"><i style="width:' + (100 * i / n) + '%"></i></div>'; }

  // ---------- 1. Uzupełnij lukę ----------
  const BAD_TERM = /^(dodatkowo|sprawdzone|wniosek|wnioski|badanie|krytyka|przebieg|efekty|rola|istota|skutki|mechanizm|podsumowanie|z opracowania)/i;
  let clozePool = null;
  // dzieli na zdania, ale nie po skrótach typu „np.”, „ok.”, „m.in.”
  function splitSentences(text) {
    const out = [];
    text.split(/(?<=[.?!])\s+/).forEach(part => {
      if (out.length && /(?:\b(?:np|ok|m\.in|tzw|tj|wg|zob|pyt|itd|itp|r|s|ms|maks|min|dr|prof)\.|\b[A-ZŁŚŻ]\.)$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + part;
      else out.push(part);
    });
    return out;
  }
  function buildCloze() {
    if (clozePool) return clozePool;
    const P = api();
    clozePool = [];
    P.QUESTIONS.forEach(q => q.blocks.forEach(b => {
      if (b.t !== 'item' || b.c === 'grey' || b.c === 'num') return;
      const text = P.plainText(b.h).replace(/\s+/g, ' ').trim();
      (b.h.match(/<b>[^<]+<\/b>/g) || []).forEach(raw => {
        const term = P.plainText(raw).replace(/^\d+\.\s*/, '').replace(/[:.,;]+$/, '').trim();
        if (term.length < 4 || term.length > 40 || BAD_TERM.test(term) || /^\d/.test(term)) return;
        const sentences = splitSentences(text);
        let sent = sentences.find(s => s.includes(term)) || text;
        if (sent.length < 100) sent = text;
        const at = sent.indexOf(term);
        if (at < 0) return;
        let start = 0, end = sent.length;
        if (sent.length > 260) { start = Math.max(0, at - 120); end = Math.min(sent.length, at + term.length + 140); }
        const before = (start ? '…' : '') + sent.slice(start, at);
        const after = sent.slice(at + term.length, end) + (end < sent.length ? '…' : '');
        if ((before + after).replace(/[^a-ząćęłńóśźż]/gi, '').length < 25) return;
        clozePool.push({ q: q.n, s: q.sec.id, term, before, after });
      });
    }));
    return clozePool;
  }
  let cz = null;
  function viewCloze(params) {
    const P = api();
    if (!cz) {
      const qs = scopeQs();
      const pool = buildCloze().filter(c => qs.has(c.q));
      const nTerms = new Set(pool.map(c => c.term.toLowerCase())).size;
      P.setView(head('✍ Uzupełnij lukę') + '<p class="muted">Dostaniesz do 10 zdań z notatki. W każdym brakuje pogrubionego terminu – dokładnie tych słów oczekuje wykładowca.</p>' +
        scopePicker(nTerms + ' ' + P.plural(nTerms, 'termin', 'terminy', 'terminów') + ' do gry') +
        (nTerms ? '<button class="btn primary big-start" id="go">Start' + (nTerms < 10 ? ' (' + nTerms + ' ' + P.plural(nTerms, 'zdanie', 'zdania', 'zdań') + ')' : '') + '</button>' : tooFew('terminów')));
      bindScope(() => viewCloze(params));
      if (nTerms) $('#go').addEventListener('click', () => {
        const picked = [];
        const usedTerms = new Set();
        P.shuffle(pool).forEach(c => { if (picked.length < 10 && !usedTerms.has(c.term.toLowerCase())) { usedTerms.add(c.term.toLowerCase()); picked.push(c); } });
        cz = { items: picked, i: 0, score: 0, pool, picked: null, wrong: [] };
        viewCloze(params);
      });
      return;
    }
    if (cz.i >= cz.items.length) {
      const n = cz.items.length;
      const rec = n === 10 ? record('luka', cz.score, higher) : (G().plays.luka = (G().plays.luka || 0) + 1, api().save(), false);
      P.setView(head('✍ Uzupełnij lukę') + '<div class="card"><div class="stat">' + cz.score + ' / ' + n + '</div>' + (rec ? '<div class="best">Nowy rekord!</div>' : '') + '</div>' +
        (cz.wrong.length ? '<h2>Do powtórki</h2>' + cz.wrong.map(c => '<div class="card small"><p>' + P.esc(c.before) + '<b>' + P.esc(c.term) + '</b>' + P.esc(c.after) + '</p>' + qLink(c.q) + '</div>').join('') : '') +
        '<div class="row"><button class="btn primary" id="again">↻ Jeszcze raz</button><a class="btn" href="#/gry">Gry</a></div>' +
        (n < 10 ? '<p class="small muted">Rekord liczy się tylko w pełnej rundzie (10 zdań).</p>' : ''));
      $('#again').addEventListener('click', () => { cz = null; viewCloze(params); });
      return;
    }
    const c = cz.items[cz.i];
    if (!c.opts) {
      const near = cz.pool.length >= 20 ? cz.pool : buildCloze();
      const others = P.shuffle(near.filter(x => x.term.toLowerCase() !== c.term.toLowerCase() && !(c.before + c.after).toLowerCase().includes(x.term.toLowerCase())));
      const same = others.filter(x => x.s === c.s);
      const seen = new Set([c.term.toLowerCase()]);
      const opts = [c.term];
      same.concat(others).forEach(x => { if (opts.length < 4 && !seen.has(x.term.toLowerCase())) { seen.add(x.term.toLowerCase()); opts.push(x.term); } });
      c.opts = P.shuffle(opts);
    }
    const answered = cz.picked != null;
    P.setView(head('✍ Uzupełnij lukę', (cz.i + 1) + ' / ' + cz.items.length + ' · ' + cz.score + ' pkt') + progressBar(cz.i, cz.items.length) +
      '<div class="card"><p class="cloze">' + P.esc(c.before) + (answered ? '<b class="' + (cz.picked === c.term ? 'okt' : 'badt') + '">' + P.esc(c.term) + '</b>' : '<span class="gap">______</span>') + P.esc(c.after) + '</p>' +
      '<div class="small muted">' + qLink(c.q) + '</div></div>' +
      c.opts.map((o, i) => '<button class="btn opt' + (answered ? (o === c.term ? ' right' : (o === cz.picked ? ' wrong' : '')) : '') + '" data-o="' + i + '">' + String.fromCharCode(65 + i) + '. ' + P.esc(o) + '</button>').join('') +
      (answered ? '<div class="row" style="justify-content:flex-end"><button class="btn primary" id="next">Dalej ›</button></div>' : ''));
    if (!answered) {
      $$('[data-o]').forEach(b => b.addEventListener('click', () => {
        cz.picked = c.opts[+b.dataset.o];
        if (cz.picked === c.term) cz.score++; else cz.wrong.push(c);
        viewCloze(params);
      }));
    } else $('#next').addEventListener('click', () => { cz.i++; cz.picked = null; viewCloze(params); });
  }

  // ---------- 2. Kto to powiedział? ----------
  function authorRows() {
    const tbl = (api().NOTES.appendix.find(a => a.title.startsWith('Ściąga')) || { blocks: [] }).blocks.find(b => b.t === 'table');
    return tbl ? tbl.rows.slice(1).filter(r => r[0] && r[1]).map(r => ({ who: r[0], what: r[1] })) : [];
  }
  // pytania, w których notatka wspomina autora (po nazwisku)
  let authorQsCache = null;
  function authorQs(row) {
    authorQsCache = authorQsCache || new Map();
    if (!authorQsCache.has(row.who)) {
      const names = (row.who.match(/[A-ZŁŚŻ][a-ząćęłńóśźż'’-]{3,}/g) || []).map(n => n.toLowerCase());
      authorQsCache.set(row.who, api().QUESTIONS.filter(q => names.some(n => q.text.includes(n))).map(q => q.n));
    }
    return authorQsCache.get(row.who);
  }
  let kt = null;
  function viewWho(started) {
    const P = api();
    if (!kt) {
      const rows = authorRows();
      const qs = scopeQs();
      const inRange = rows.filter(r => authorQs(r).some(n => qs.has(n)));
      if (!started) {
        P.setView(head('🗣 Kto to powiedział?') + '<p class="muted">Raz dostajesz hasło i wybierasz autora, raz odwrotnie. Autorzy są dobrani do zakresu – po pytaniach, w których notatka o nich wspomina.</p>' +
          scopePicker(inRange.length + ' ' + P.plural(inRange.length, 'autor', 'autorów', 'autorów') + ' w zakresie') +
          (inRange.length ? '<button class="btn primary big-start" id="go">Start</button>' : tooFew('autorów')));
        bindScope(() => viewWho());
        if (inRange.length) $('#go').addEventListener('click', () => viewWho(true));
        return;
      }
      kt = { items: P.shuffle(inRange).slice(0, 10).map(r => ({ r, mode: Math.random() < 0.6 ? 'who' : 'what' })), rows, i: 0, score: 0, picked: null, wrong: [] };
    }
    if (kt.i >= kt.items.length) {
      const rec = kt.items.length === 10 ? record('kto', kt.score, higher) : false;
      P.setView(head('🗣 Kto to powiedział?') + '<div class="card"><div class="stat">' + kt.score + ' / ' + kt.items.length + '</div>' + (rec ? '<div class="best">Nowy rekord!</div>' : '') + '</div>' +
        (kt.wrong.length ? '<h2>Do powtórki</h2><div class="card">' + kt.wrong.map(r => '<p><b>' + P.esc(r.who) + '</b> – ' + P.esc(r.what) + '</p>').join('') + '</div>' : '') +
        '<div class="row"><button class="btn primary" id="again">↻ Jeszcze raz</button><a class="btn" href="#/n/sciaga">Ściąga</a><a class="btn" href="#/gry">Gry</a></div>');
      $('#again').addEventListener('click', () => { kt = null; viewWho(true); });
      return;
    }
    const it = kt.items[kt.i];
    const key = it.mode === 'who' ? 'who' : 'what';
    if (!it.opts) it.opts = P.shuffle([it.r].concat(P.shuffle(kt.rows.filter(x => x !== it.r)).slice(0, 3)));
    const answered = kt.picked != null;
    const prompt = it.mode === 'who'
      ? '<div class="kicker">Kto to powiedział / zbadał?</div><p class="big-q">' + P.esc(it.r.what) + '</p>'
      : '<div class="kicker">Z czym kojarzysz autora?</div><p class="big-q"><b>' + P.esc(it.r.who) + '</b></p>';
    P.setView(head('🗣 Kto to powiedział?', (kt.i + 1) + ' / ' + kt.items.length + ' · ' + kt.score + ' pkt') + progressBar(kt.i, kt.items.length) +
      '<div class="card">' + prompt + '</div>' +
      it.opts.map((o, i) => '<button class="btn opt' + (answered ? (o === it.r ? ' right' : (i === kt.picked ? ' wrong' : '')) : '') + '" data-o="' + i + '">' + String.fromCharCode(65 + i) + '. ' + P.esc(o[key]) + '</button>').join('') +
      (answered ? '<div class="row" style="justify-content:flex-end"><button class="btn primary" id="next">Dalej ›</button></div>' : ''));
    if (!answered) {
      $$('[data-o]').forEach(b => b.addEventListener('click', () => {
        kt.picked = +b.dataset.o;
        if (it.opts[kt.picked] === it.r) kt.score++; else kt.wrong.push(it.r);
        viewWho(true);
      }));
    } else $('#next').addEventListener('click', () => { kt.i++; kt.picked = null; viewWho(true); });
  }

  // ---------- 3. Ułóż w kolejności ----------
  let sq = null;
  function nextSeq(idx) {
    const idxs = GD.sequences.map((s, i) => i).filter(i => inScope(GD.sequences[i].q));
    return idxs.find(i => i > idx) ?? idxs[0] ?? (idx + 1) % GD.sequences.length;
  }
  function viewSeq(arg) {
    const P = api();
    const g = G();
    if (arg == null || !GD.sequences[arg]) {
      sq = null;
      const idxs = GD.sequences.map((s, i) => i).filter(i => inScope(GD.sequences[i].q));
      P.setView(head('🔢 Ułóż w kolejności') + '<p class="muted">Stukaj elementy po kolei – od pierwszego do ostatniego. Zielony ✓ = ułożone bez błędu.</p>' +
        scopePicker(idxs.length + ' ' + P.plural(idxs.length, 'sekwencja', 'sekwencje', 'sekwencji')) +
        (idxs.length ? '<a class="btn primary" style="margin-bottom:14px" href="#/gry/kolejnosc/' + idxs[Math.floor(Math.random() * idxs.length)] + '">🎲 Losowa sekwencja z zakresu</a>' +
        '<div class="card qlist" style="padding:0">' + idxs.map(i => [GD.sequences[i], i]).map(([s, i]) =>
          '<a href="#/gry/kolejnosc/' + i + '"><span class="qnum">' + (s.q || '★') + '</span><span>' + P.esc(s.title) + ' <span class="muted small">(' + s.items.length + ')</span></span><span class="flags">' +
          (g.seq[i] === 0 ? '<span class="flag-read">✓</span>' : g.seq[i] != null ? '<span class="muted small">' + g.seq[i] + ' bł.</span>' : '') + '</span></a>').join('') + '</div>' : tooFew('sekwencji')));
      bindScope(() => viewSeq());
      return;
    }
    const idx = +arg;
    const s = GD.sequences[idx];
    if (!sq || sq.idx !== idx) {
      let order = P.shuffle(s.items.map((_, i) => i));
      if (order.every((v, i) => v === i) && order.length > 1) order = order.reverse();
      sq = { idx, order, done: [], mistakes: 0, flash: null };
    }
    const finished = sq.done.length === s.items.length;
    let html = head('🔢 ' + P.esc(s.title), sq.mistakes + ' ' + P.plural(sq.mistakes, 'błąd', 'błędy', 'błędów')) +
      (s.q ? '<p class="small muted">' + qLink(s.q) + '</p>' : '') +
      '<ol class="seq-done">' + sq.done.map(i => '<li>' + P.esc(s.items[i]) + '</li>').join('') +
      (finished ? '' : '<li class="next">?</li>') + '</ol>';
    if (!finished) {
      html += '<div class="kicker">Co jest ' + (sq.done.length ? 'dalej' : 'pierwsze') + '?</div>' +
        sq.order.filter(i => !sq.done.includes(i)).map(i => '<button class="btn opt' + (sq.flash === i ? ' wrong shake' : '') + '" data-i="' + i + '">' + P.esc(s.items[i]) + '</button>').join('');
    } else {
      html += '<div class="card"><div class="stat">' + (sq.mistakes ? sq.mistakes + ' ' + P.plural(sq.mistakes, 'błąd', 'błędy', 'błędów') : 'Bez błędu! 🎉') + '</div></div>' +
        '<div class="row"><button class="btn" id="again">↻ Jeszcze raz</button><a class="btn primary" href="#/gry/kolejnosc/' + nextSeq(idx) + '">Następna ›</a><a class="btn" href="#/gry/kolejnosc">Lista</a></div>';
    }
    P.setView(html, { keepScroll: true });
    sq.flash = null;
    $$('[data-i]').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i === sq.done.length) sq.done.push(i);
      else { sq.mistakes++; sq.flash = i; }
      if (sq.done.length === s.items.length) {
        const prev = g.seq[idx];
        if (prev == null || sq.mistakes < prev) g.seq[idx] = sq.mistakes;
        g.plays.kolejnosc = (g.plays.kolejnosc || 0) + 1;
        P.save();
      }
      viewSeq(arg);
    }));
    const again = $('#again');
    if (again) again.addEventListener('click', () => { sq = null; viewSeq(arg); });
  }

  // ---------- 4. Puzzle z tabeli ----------
  let tablesCache = null;
  function puzzleTables() {
    if (tablesCache) return tablesCache;
    tablesCache = [];
    api().QUESTIONS.forEach(q => q.blocks.forEach(b => {
      if (b.t !== 'table') return;
      const cols = b.rows[0].length;
      if (cols < 3 || cols > 4 || b.rows.length < 3 || b.rows.length > 21) return;
      tablesCache.push({ id: q.n + '-' + tablesCache.filter(t => t.q === q.n).length, q: q.n, sec: q.sec.id, rows: b.rows, title: q.title });
    }));
    return tablesCache;
  }
  let tz = null;
  function viewTable(arg) {
    const P = api();
    const g = G();
    const all = puzzleTables();
    const t = all.find(x => x.id === arg);
    if (!t) {
      tz = null;
      const list = all.filter(x => inScope(x.q));
      P.setView(head('▤ Puzzle z tabeli') + '<p class="muted">Stuknij kafelek z dołu, a potem pustą komórkę, do której pasuje. Dobre trafienie zostaje, złe miga na czerwono.</p>' +
        scopePicker(list.length + ' ' + P.plural(list.length, 'tabela', 'tabele', 'tabel')) +
        (list.length ? '<div class="card qlist" style="padding:0">' + list.map(x =>
          '<a href="#/gry/tabela/' + x.id + '" style="--sec:' + P.SECTION_COLORS[x.sec] + '"><span class="qnum">' + x.q + '</span><span>' + P.esc(x.title) +
          ' <span class="muted small">(' + (x.rows.length - 1) * (x.rows[0].length - 1) + ' komórek)</span></span><span class="flags">' +
          (g.tables[x.id] === 0 ? '<span class="flag-read">✓</span>' : g.tables[x.id] != null ? '<span class="muted small">' + g.tables[x.id] + ' bł.</span>' : '') + '</span></a>').join('') + '</div>' : tooFew('tabel – tabele są m.in. w pyt. 29, 31, 35, 43, 49, 55, 62, 66')));
      bindScope(() => viewTable());
      return;
    }
    if (!tz || tz.id !== t.id) {
      const cells = [];
      t.rows.slice(1).forEach((r, ri) => r.slice(1).forEach((c, ci) => cells.push({ key: ri + ':' + ci, text: c })));
      tz = { id: t.id, cells, pool: P.shuffle(cells.map(c => c.key)), placed: {}, sel: null, mistakes: 0, flash: null };
    }
    const total = tz.cells.length;
    const nPlaced = Object.keys(tz.placed).length;
    const text = key => tz.cells.find(c => c.key === key).text;
    const finished = nPlaced === total;
    let html = head('▤ Puzzle z tabeli', nPlaced + ' / ' + total + ' · ' + tz.mistakes + ' bł.') + '<p class="small muted">' + qLink(t.q) + '</p>' +
      '<div class="tbl puzzle" style="--sec:' + P.SECTION_COLORS[t.sec] + '"><table><thead><tr>' + t.rows[0].map(h => '<th>' + P.esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
      t.rows.slice(1).map((r, ri) => '<tr><td class="crit">' + P.esc(r[0]) + '</td>' + r.slice(1).map((c, ci) => {
        const key = ri + ':' + ci;
        const placed = tz.placed[key];
        return '<td class="slot' + (placed ? ' filled' : '') + (tz.flash === key ? ' wrong shake' : '') + '" data-slot="' + key + '">' + (placed ? P.esc(c) : (tz.sel ? '＋' : '')) + '</td>';
      }).join('') + '</tr>').join('') + '</tbody></table></div>';
    if (!finished) {
      html += '<div class="kicker" style="margin-top:12px">' + (tz.sel ? 'Teraz stuknij komórkę w tabeli' : 'Wybierz kafelek') + '</div><div class="pool">' +
        tz.pool.filter(k => !Object.values(tz.placed).includes(k)).map(k => '<button class="chip' + (tz.sel === k ? ' on' : '') + '" data-pool="' + k + '">' + P.esc(text(k)) + '</button>').join('') + '</div>';
    } else {
      html += '<div class="card" style="margin-top:12px"><div class="stat">' + (tz.mistakes ? tz.mistakes + ' ' + P.plural(tz.mistakes, 'błąd', 'błędy', 'błędów') : 'Bez błędu! 🎉') + '</div></div>' +
        '<div class="row"><button class="btn" id="again">↻ Jeszcze raz</button><a class="btn primary" href="#/gry/tabela">Inna tabela</a></div>';
    }
    P.setView(html, { keepScroll: true });
    tz.flash = null;
    $$('[data-pool]').forEach(b => b.addEventListener('click', () => { tz.sel = tz.sel === b.dataset.pool ? null : b.dataset.pool; viewTable(arg); }));
    $$('[data-slot]').forEach(td => td.addEventListener('click', () => {
      const key = td.dataset.slot;
      if (!tz.sel || tz.placed[key]) return;
      // komórki o tym samym tekście są wymienne
      if (text(tz.sel) === text(key)) { tz.placed[key] = tz.sel; tz.sel = null; }
      else { tz.mistakes++; tz.flash = key; }
      if (Object.keys(tz.placed).length === total) {
        const prev = g.tables[t.id];
        if (prev == null || tz.mistakes < prev) g.tables[t.id] = tz.mistakes;
        g.plays.tabela = (g.plays.tabela || 0) + 1;
        P.save();
      }
      viewTable(arg);
    }));
    const again = $('#again');
    if (again) again.addEventListener('click', () => { tz = null; viewTable(arg); });
  }

  // ---------- 5. Dopasuj pary ----------
  let pr = null, prTick = null;
  function viewPairs() {
    const P = api();
    clearInterval(prTick);
    if (!pr) {
      const qs = scopeQs();
      const avail = P.CARDS.filter(c => qs.has(c.q));
      const nAvail = new Set(avail.map(c => c.term.toLowerCase())).size;
      P.setView(head('⚡ Dopasuj pary') + '<p class="muted">Stuknij termin, a potem jego definicję. Liczy się czas – każdy błąd to +3 s kary. Rekord liczy się przy 6 parach.</p>' +
        scopePicker(nAvail + ' ' + P.plural(nAvail, 'termin', 'terminy', 'terminów') + ' z fiszek') +
        (nAvail >= 3 ? '<button class="btn primary big-start" id="go">Start</button>' : tooFew('terminów (potrzeba min. 3)')));
      bindScope(() => viewPairs());
      if (nAvail >= 3) $('#go').addEventListener('click', () => {
        const seen = new Set();
        const cards = P.shuffle(avail).filter(c => { const k = c.term.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
        const defs = cards.map(c => { let d = P.plainText(c.def); if (d.length > 130) d = d.slice(0, 127) + '…'; return { id: c.id, d }; });
        pr = { cards, left: P.shuffle(cards.map(c => c.id)), right: P.shuffle(defs), matched: new Set(), selL: null, selR: null, mistakes: 0, start: Date.now(), flash: [] };
        viewPairs();
      });
      return;
    }
    const n = pr.cards.length;
    if (pr.matched.size === n) {
      const secs = Math.round((Date.now() - pr.start) / 1000) + pr.mistakes * 3;
      if (!pr.result) pr.result = { secs, rec: n === 6 ? record('pary', secs, lower) : false };
      P.setView(head('⚡ Dopasuj pary') + '<div class="card"><div class="stat">' + pr.result.secs + ' s</div><div class="small muted">' + pr.mistakes + ' ' + P.plural(pr.mistakes, 'błąd', 'błędy', 'błędów') + ' (+3 s każdy)</div>' +
        (pr.result.rec ? '<div class="best">Nowy rekord!</div>' : '') + '</div>' +
        '<div class="row"><button class="btn primary" id="again">↻ Jeszcze raz</button><button class="btn" id="change">Zmień zakres</button><a class="btn" href="#/gry">Gry</a></div>');
      $('#again').addEventListener('click', () => { pr = null; viewPairs(); const go = $('#go'); if (go) go.click(); });
      $('#change').addEventListener('click', () => { pr = null; viewPairs(); });
      return;
    }
    const byId = id => pr.cards.find(c => c.id === id);
    P.setView(head('⚡ Dopasuj pary', '<span id="ptime"></span> · ' + pr.matched.size + ' / ' + n) +
      '<div class="pairs"><div>' + pr.left.map(id => '<button class="btn pair' + (pr.matched.has(id) ? ' done' : '') + (pr.selL === id ? ' sel' : '') + (pr.flash.includes('L' + id) ? ' wrong shake' : '') + '" data-l="' + id + '"' + (pr.matched.has(id) ? ' disabled' : '') + '>' + P.esc(byId(id).term) + '</button>').join('') + '</div>' +
      '<div>' + pr.right.map(r => '<button class="btn pair def' + (pr.matched.has(r.id) ? ' done' : '') + (pr.selR === r.id ? ' sel' : '') + (pr.flash.includes('R' + r.id) ? ' wrong shake' : '') + '" data-r="' + r.id + '"' + (pr.matched.has(r.id) ? ' disabled' : '') + '>' + P.esc(r.d) + '</button>').join('') + '</div></div>', { keepScroll: true });
    pr.flash = [];
    const tryMatch = () => {
      if (!pr.selL || !pr.selR) return;
      if (pr.selL === pr.selR) pr.matched.add(pr.selL);
      else { pr.mistakes++; pr.flash = ['L' + pr.selL, 'R' + pr.selR]; }
      pr.selL = pr.selR = null;
    };
    $$('[data-l]').forEach(b => b.addEventListener('click', () => { pr.selL = b.dataset.l; tryMatch(); viewPairs(); }));
    $$('[data-r]').forEach(b => b.addEventListener('click', () => { pr.selR = b.dataset.r; tryMatch(); viewPairs(); }));
    const tick = () => { const el = $('#ptime'); if (!el) { clearInterval(prTick); return; } el.textContent = '⏱ ' + P.fmtMin(Date.now() - pr.start); };
    tick();
    prTick = setInterval(tick, 500);
  }

  // ---------- 6. Prawda czy fałsz ----------
  let pf = null, pfTick = null;
  const PF_SECONDS = 60;
  function viewTF() {
    const P = api();
    clearInterval(pfTick);
    if (!pf) {
      const items = GD.statements.filter(x => inScope(x.q));
      P.setView(head('⚖ Prawda czy fałsz') + '<p class="muted">60 sekund. Zdania z notatki – część z nich to pułapki z części „Niejasności” (np. obniżenie / podwyższenie progu, pomylone autorstwo). Za dobrą odpowiedź +1, za złą −1. Rekord liczy się przy wszystkich pytaniach.</p>' +
        scopePicker(items.length + ' ' + P.plural(items.length, 'zdanie', 'zdania', 'zdań')) +
        (items.length ? '<button class="btn primary big-start" id="go">Start</button>' : tooFew('zdań')));
      bindScope(() => viewTF());
      if (items.length) $('#go').addEventListener('click', () => { pf = { full: scope().mode === 'all', items: P.shuffle(items), i: 0, score: 0, good: 0, wrong: [], end: Date.now() + PF_SECONDS * 1000, fb: null }; viewTF(); });
      return;
    }
    const over = Date.now() >= pf.end || pf.i >= pf.items.length;
    if (over) {
      if (!pf.result) pf.result = { rec: pf.full ? record('pf', pf.score, higher) : false };
      P.setView(head('⚖ Prawda czy fałsz') + '<div class="card"><div class="stat">' + pf.score + ' pkt</div><div class="small muted">' + pf.good + ' dobrych, ' + pf.wrong.length + ' złych</div>' +
        (pf.result.rec ? '<div class="best">Nowy rekord!</div>' : '') + '</div>' +
        (pf.wrong.length ? '<h2>Pomyłki</h2>' + pf.wrong.map(w => '<div class="card small"><p><b>' + (w.t ? 'PRAWDA' : 'FAŁSZ') + ':</b> ' + P.esc(w.s) + '</p><p class="muted">' + P.esc(w.why) + '</p>' + qLink(w.q) + '</div>').join('') : '') +
        '<div class="row"><button class="btn primary" id="again">↻ Jeszcze raz</button><a class="btn" href="#/gry">Gry</a></div>');
      $('#again').addEventListener('click', () => { pf = null; viewTF(); });
      return;
    }
    const it = pf.items[pf.i];
    P.setView(head('⚖ Prawda czy fałsz', '<span id="tleft" class="big-timer"></span> · ' + pf.score + ' pkt') +
      '<div class="card tf-card' + (pf.fb ? ' ' + pf.fb : '') + '"><p class="big-q">' + P.esc(it.s) + '</p></div>' +
      '<div class="answer-btns"><button class="btn bad" data-tf="0" style="min-height:72px">✗ Fałsz</button><button class="btn ok" data-tf="1" style="min-height:72px">✓ Prawda</button></div>');
    pf.fb = null;
    $$('[data-tf]').forEach(b => b.addEventListener('click', () => {
      const ans = b.dataset.tf === '1';
      if (ans === it.t) { pf.score++; pf.good++; pf.fb = 'flash-ok'; } else { pf.score--; pf.wrong.push(it); pf.fb = 'flash-bad'; }
      pf.i++;
      viewTF();
    }));
    const tick = () => {
      const el = $('#tleft');
      if (!el) { clearInterval(pfTick); return; }
      const left = pf.end - Date.now();
      if (left <= 0) { clearInterval(pfTick); viewTF(); return; }
      el.textContent = '⏱ ' + Math.ceil(left / 1000) + ' s';
      el.classList.toggle('late', left < 10000);
    };
    tick();
    pfTick = setInterval(tick, 250);
  }

  // ---------- 7. Losownik ----------
  let spin = null;
  function viewDraw() {
    const P = api();
    const S = P.S;
    const result = viewDraw.result;
    const qs = Array.from(scopeQs()).sort((x, y) => x - y);
    P.setView(head('🎲 Losownik pytań') + scopePicker(qs.length + ' ' + P.plural(qs.length, 'pytanie', 'pytania', 'pytań') + ' do losowania') +
      '<div class="slots">' + [0, 1, 2].map(i => '<div class="slot-n" id="s' + i + '">' + (result ? (result[i] != null ? result[i] : '–') : '?') + '</div>').join('') + '</div>' +
      '<button class="btn primary" id="spin" style="width:100%;min-height:60px;font-size:1.15rem;margin:14px 0"' + (qs.length ? '' : ' disabled') + '>🎲 Losuj' + (qs.length && qs.length < 3 ? ' (tylko ' + qs.length + ')' : '') + '</button>' +
      '<div id="res">' + (result ? result.map(n => '<div class="card small" style="margin-bottom:8px">' + qLink(n) + '</div>').join('') +
        '<button class="btn primary" id="exam">✎ Napisz próbny egzamin z tych pytań</button>' : '') + '</div>');
    bindScope(() => { viewDraw.result = null; viewDraw(); });
    const pool = () => qs;
    $('#spin').addEventListener('click', () => {
      if (spin) return;
      const p = pool();
      const final = P.shuffle(p).slice(0, 3).sort((a, b) => a - b);
      const t0 = Date.now();
      $('#res').innerHTML = '';
      spin = setInterval(() => {
        const el = Date.now() - t0;
        [0, 1, 2].forEach(i => {
          const box = $('#s' + i);
          if (!box) return;
          if (el > 700 + i * 450) { box.textContent = final[i] != null ? final[i] : '–'; box.classList.add('stop'); }
          else if (i >= p.length) box.textContent = '–';
          else box.textContent = p[Math.floor(Math.random() * p.length)];
        });
        if (el > 700 + 2 * 450 + 100) {
          clearInterval(spin); spin = null;
          viewDraw.result = final;
          G().plays.losuj = (G().plays.losuj || 0) + 1;
          P.save();
          viewDraw();
        }
      }, 70);
    });
    const ex = $('#exam');
    if (ex) ex.addEventListener('click', () => {
      if (S.exam && !confirm('Masz rozpoczęty egzamin. Zacząć nowy (stary zostanie porzucony)?')) return;
      const label = scopeLabel();
      viewDraw.result = null;
      P.startExamWith(result, label + ' (losownik)');
    });
  }

  // ---------- router ----------
  function view(parts, params) {
    clearInterval(prTick); clearInterval(pfTick);
    const [id, arg] = parts;
    if (id !== 'luka') cz = null;
    if (id !== 'kto') kt = null;
    if (id !== 'pary') pr = null;
    if (id !== 'pf') pf = null;
    switch (id) {
      case 'luka': viewCloze(params); break;
      case 'kto': viewWho(); break;
      case 'kolejnosc': viewSeq(arg); break;
      case 'tabela': viewTable(arg); break;
      case 'pary': viewPairs(); break;
      case 'pf': viewTF(); break;
      case 'losuj': viewDraw(); break;
      default: viewHome();
    }
  }

  window.GAMES = { view, todayCard, checkBadges, streak };
})();
