/* Poznawcza – aplikacja do nauki. Czysty JS, bez zależności; postęp w localStorage. */
(function () {
  'use strict';

  const DATA = window.APP_DATA;
  const NOTES = DATA.notes;
  const PLAN = DATA.plan;
  const CARDS = DATA.cards;
  const EXAM_DATE = '2026-12-17';
  const STORE_KEY = 'poznawcza-v1';
  const SECTION_COLORS = {
    I: '#2e5e8c', II: '#1f7a7a', III: '#8a6d1f', IV: '#7a4a9e',
    V: '#9c2f5c', VI: '#b5531d', VII: '#5a6b2a', VIII: '#3c7d3c'
  };
  const DOW = { pon: 'pon', wt: 'wt', 'śr': 'śr', czw: 'czw', pt: 'pt', sob: 'sob', niedz: 'niedz' };
  const STAGES = {
    1: 'Etap 1 – nowy materiał',
    2: 'Etap 2 – powtórki działami i próbne egzaminy',
    3: 'Etap 3 – tylko powtórka'
  };

  // ---------- indeksy ----------
  const QUESTIONS = [];
  const Q = {};
  NOTES.sections.forEach(s => s.questions.forEach(q => {
    q.sec = s;
    q.text = plainText(q.title + ' ' + q.blocks.map(b => b.h || (b.rows || []).flat().join(' ')).join(' ')).toLowerCase();
    QUESTIONS.push(q);
    Q[q.n] = q;
  }));
  const CARD_BY_ID = {};
  CARDS.forEach(c => { CARD_BY_ID[c.id] = c; });
  const APPENDIX = {
    szkielet: { title: 'Jak pisać odpowiedź (szkielet)', blocks: NOTES.intro },
    sciaga: { title: 'Ściąga – kto co powiedział', blocks: findAppendix('Ściąga') },
    kontrolne: { title: 'Pytania kontrolne', blocks: findAppendix('Pytania kontrolne') },
    poprawki: {
      title: 'Co poprawiono i niejasności',
      blocks: [].concat(
        [{ t: 'h', h: 'Co poprawiono względem opracowania' }], findAppendix('Co poprawiono'),
        [{ t: 'h', h: 'Niejasności w notatkach – sprawdzone odpowiedzi' }], findAppendix('Niejasności'))
    }
  };
  function findAppendix(prefix) {
    const a = NOTES.appendix.find(x => x.title.startsWith(prefix));
    return a ? a.blocks : [];
  }

  // ---------- stan ----------
  const defaults = () => ({ done: {}, read: {}, weak: [], cards: {}, exams: [], exam: null, practice: null, timer: null, drafts: {} });
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) { return defaults(); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
    catch (e) { toast('Nie udało się zapisać postępu (pamięć przeglądarki).'); }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // ---------- narzędzia ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function plainText(h) {
    const d = document.createElement('div');
    d.innerHTML = h;
    return d.textContent;
  }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function todayISO() {
    const o = new URLSearchParams(location.search).get('dzien');
    if (o && /^\d{4}-\d\d-\d\d$/.test(o)) return o;
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
  function fmtDate(iso) { const [, m, d] = iso.split('-'); return d + '.' + m; }
  function fmtMin(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function plural(n, one, few, many) {
    if (n === 1) return one;
    const d = n % 10, t = n % 100;
    return (d >= 2 && d <= 4 && (t < 10 || t >= 20)) ? few : many;
  }
  let toastTimer;
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
  function parseRange(str) {
    // "1–3" -> [1,2,3]; "12" -> [12]
    const m = String(str).trim().match(/^(\d+)(?:\s*[–-]\s*(\d+))?$/);
    if (!m) return [];
    const a = +m[1], b = m[2] ? +m[2] : a;
    const out = [];
    for (let i = a; i <= b; i++) if (Q[i]) out.push(i);
    return out;
  }
  function rangeLabel(nums) {
    if (!nums.length) return '';
    return nums.length === 1 ? String(nums[0]) : nums[0] + '–' + nums[nums.length - 1];
  }
  function isWeak(n) { return S.weak.includes(n); }
  function toggleWeak(n, on) {
    const has = isWeak(n);
    if (on === undefined) on = !has;
    if (on && !has) S.weak.push(n);
    if (!on && has) S.weak = S.weak.filter(x => x !== n);
    S.weak.sort((a, b) => a - b);
    save();
  }
  function cardBox(id) { return (S.cards[id] && S.cards[id].box) || 0; }
  function setBox(id, box) {
    S.cards[id] = { box: Math.max(1, Math.min(5, box)), t: Date.now() };
    save();
  }

  // ---------- treść notatek ----------
  function linkRefs(h) {
    const one = (m, a, b) => '<a class="ref" href="#/n/' + a + (b ? '-' + b : '') + '">' + m + '</a>';
    return h.replace(/pyt\. \d+(?:–\d+)?(?:, \d+(?:–\d+)?)*/g, list => list.replace(/(?:pyt\. )?(\d+)(?:–(\d+))?/g, one));
  }
  function highlight(h, query) {
    if (!query) return h;
    const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return h.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : part.replace(re, '<mark>$1</mark>')).join('');
  }
  function renderBlocks(blocks, query) {
    return blocks.map(b => {
      if (b.t === 'table') {
        const [head, ...rows] = b.rows;
        return '<div class="tbl"><table><thead><tr>' + head.map(c => '<th>' + highlight(esc(c), query) + '</th>').join('') +
          '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + highlight(linkRefs(esc(c)), query) + '</td>').join('') + '</tr>').join('') +
          '</tbody></table></div>';
      }
      const h = highlight(linkRefs(b.h), query);
      if (b.t === 'item') return '<div class="it it-' + b.c + '">' + h + '</div>';
      if (b.t === 'caption') return '<div class="cap">' + h + '</div>';
      if (b.t === 'h') return '<h4>' + h + '</h4>';
      return '<p>' + h + '</p>';
    }).join('');
  }
  const STOP_TERMS = /^(dodatkowo|sprawdzone|wniosek|wnioski|badanie|krytyka|podsumowanie|przebieg|efekty|rola|istota|skutki)/i;
  function keyTerms(q) {
    const seen = new Set();
    const out = [];
    q.blocks.forEach(b => {
      if (b.t !== 'item' || b.c === 'grey') return;
      (b.h.match(/<b>[^<]+<\/b>/g) || []).forEach(t => {
        let s = plainText(t).replace(/^\d+\.\s*/, '').replace(/[:.,;]+$/, '').trim();
        if (s.length < 3 || STOP_TERMS.test(s) || /^\d/.test(s)) return;
        const k = s.toLowerCase();
        if (!seen.has(k)) { seen.add(k); out.push(s); }
      });
    });
    return out;
  }
  function normWords(s) { return s.toLowerCase().split(/[^a-ząćęłńóśźż0-9]+/i).filter(Boolean); }
  function termHit(term, answerWords) {
    const words = normWords(term).filter(w => w.length >= 4 && !/^(oraz|jest|przez|który|która|które|tego|jako|albo)$/.test(w));
    if (!words.length) {
      const whole = normWords(term).join(' ');
      return whole.length > 0 && answerWords.join(' ').includes(whole);
    }
    const hits = words.filter(w => {
      const stem = w.slice(0, Math.max(4, w.length - 3));
      return answerWords.some(a => a.startsWith(stem));
    }).length;
    return hits >= Math.ceil(words.length * 0.6);
  }
  function termCoverage(q, answer) {
    const terms = keyTerms(q);
    const aw = normWords(answer || '');
    const res = terms.map(t => ({ t, hit: termHit(t, aw) }));
    const hits = res.filter(r => r.hit).length;
    return { res, pct: terms.length ? Math.round(100 * hits / terms.length) : 0, hits, total: terms.length };
  }

  // ---------- plan ----------
  const blockKey = (date, i) => date + '#' + i;
  function dayDone(p) { return p.blocks.filter((_, i) => S.done[blockKey(p.date, i)]).length; }
  const STUDY_DAYS = PLAN.filter(p => p.blocks.length);
  const TOTAL_BLOCKS = STUDY_DAYS.reduce((a, p) => a + p.blocks.length, 0);
  function doneBlocks() { return STUDY_DAYS.reduce((a, p) => a + dayDone(p), 0); }

  function actionsFor(text, dayText) {
    const acts = [];
    const pyt = text.match(/pyt\. ([\d–, ]+\d)/);
    const ranges = pyt ? pyt[1].split(',').map(s => s.trim()).filter(Boolean) : [];
    const nums = ranges.map(parseRange);
    const isWrite = /napisz z pamięci/.test(text);
    if (/PRÓBNY EGZAMIN/.test(text)) {
      const m = text.match(/zakresu (\d+)–(\d+)/);
      acts.push(['✎ Próbny egzamin' + (m ? ' (' + m[1] + '–' + m[2] + ')' : ''), '#/egzamin/nowy/' + (m ? m[1] + '-' + m[2] : '1-72'), 'primary']);
      return acts;
    }
    const secMatch = text.match(/Dział(?:y)? ([IVX]+)(?:–([IVX]+))?/);
    if (secMatch && /fiszki|quiz/.test(text)) {
      const ids = NOTES.sections.map(s => s.id);
      const a = ids.indexOf(secMatch[1]);
      const b = secMatch[2] ? ids.indexOf(secMatch[2]) : a;
      const secs = ids.slice(a, b + 1).join(',');
      acts.push(['◧ Fiszki', '#/fiszki/sesja?s=' + secs + '&m=terms', 'primary']);
      acts.push(['? Quiz ABCD', '#/fiszki/sesja?s=' + secs + '&m=quiz', '']);
    }
    const daySec = (dayText || '').match(/Dział(?:y)? ([IVX]+)/);
    if (/przepisz z pamięci tabele/.test(text) && daySec) acts.push(['▤ Tabele działu ' + daySec[1], '#/tabele/' + daySec[1], '']);
    if (isWrite && nums.length && nums[0].length === 1) {
      acts.push(['✎ Napisz z pamięci', '#/cwicz/' + nums[0][0], 'primary']);
      acts.push(['📖 Notatka pyt. ' + nums[0][0], '#/n/' + nums[0][0], '']);
    } else if (nums.length) {
      nums.forEach(r => { if (r.length) acts.push(['📖 pyt. ' + rangeLabel(r), '#/n/' + r[0] + (r.length > 1 ? '-' + r[r.length - 1] : ''), '']); });
      if (/fiszki/.test(text) && nums[0].length) acts.push(['◧ Fiszki pyt. ' + rangeLabel(nums[0]), '#/fiszki/sesja?q=' + nums[0][0] + '-' + nums[0][nums[0].length - 1] + '&m=terms', '']);
    }
    if (/słabe pytania|słabsze/.test(text)) acts.push(['★ Słabe pytania', '#/notatki/slabe', '']);
    if (/Ściąg|ściąg/.test(text)) acts.push(['Ściąga', '#/n/sciaga', '']);
    if (/szkielet/.test(text)) acts.push(['Szkielet odpowiedzi', '#/n/szkielet', '']);
    if (/pytania kontrolne/.test(text)) acts.push(['Pytania kontrolne', '#/n/kontrolne', '']);
    if (/Co poprawiono/.test(text)) acts.push(['Co poprawiono', '#/n/poprawki', '']);
    if (/4 tabele/.test(text)) acts.push(['▤ Wszystkie tabele', '#/tabele', '']);
    if (/quiz z fiszek|szybki quiz/.test(text)) {
      acts.push(['◧ Fiszki – wszystko', '#/fiszki/sesja?m=terms', 'primary']);
      acts.push(['? Quiz ABCD', '#/fiszki/sesja?m=quiz', '']);
    }
    return acts;
  }

  function blockHTML(p, i, b) {
    const on = !!S.done[blockKey(p.date, i)];
    const acts = actionsFor(b.text, p.blocks.map(x => x.text).join(' '));
    return '<div class="block' + (on ? ' done' : '') + '">' +
      '<button class="check' + (on ? ' on' : '') + '" data-check="' + blockKey(p.date, i) + '" aria-pressed="' + on + '" aria-label="Zrobione: ' + esc(b.label) + '">✓</button>' +
      '<div><div class="txt"><span class="label">' + esc(b.label) + '</span>' + linkRefs(esc(b.text)) + '</div>' +
      '<div class="acts">' + acts.map(a => '<a class="btn sm ' + a[2] + '" href="' + a[1] + '">' + esc(a[0]) + '</a>').join('') +
      '<button class="btn sm ghost" data-timer="' + esc(b.label + ' – ' + fmtDate(p.date)) + '">⏱ 25 min</button></div></div></div>';
  }
  function bindChecks(root, rerender) {
    $$('[data-check]', root).forEach(btn => btn.addEventListener('click', () => {
      const k = btn.dataset.check;
      if (S.done[k]) delete S.done[k]; else S.done[k] = Date.now();
      save();
      rerender();
    }));
    $$('[data-timer]', root).forEach(btn => btn.addEventListener('click', () => startTimer(btn.dataset.timer)));
  }

  // ---------- widoki ----------
  const view = () => $('#view');
  function setView(html, opts) {
    const v = view();
    v.className = (opts && opts.wide) ? 'wide' : '';
    v.innerHTML = html;
    if (!opts || !opts.keepScroll) window.scrollTo(0, 0);
  }

  function viewToday() {
    const today = todayISO();
    const first = PLAN[0].date, last = PLAN[PLAN.length - 1].date;
    let entry = PLAN.find(p => p.date === today);
    let headline;
    if (today < first) {
      entry = PLAN[0];
      headline = '<div class="kicker">Plan startuje w poniedziałek ' + fmtDate(first) + '</div><h1>Podgląd dnia 1</h1>';
    } else if (today > last) {
      headline = '<h1>Po egzaminie 🎉</h1><p class="muted">Plan zakończony. Notatki i fiszki zostają do dyspozycji.</p>';
    } else if (entry) {
      headline = '<div class="kicker">' + DOW[entry.dow] + ' ' + fmtDate(entry.date) + (entry.nr ? ' · dzień ' + entry.nr + ' z 45' : '') + ' · ' + esc(STAGES[entry.stage]) + '</div><h1>Dziś</h1>';
    }
    let body = '';
    if (entry && entry.blocks.length) {
      const nd = dayDone(entry);
      body += '<div class="card">' + headline +
        '<div class="row between small muted"><span>' + nd + ' / ' + entry.blocks.length + ' bloków</span><span>3 × 25 min + 5 min przerwy</span></div>' +
        '<div class="progress ok" style="margin:8px 0 6px"><i style="width:' + (100 * nd / entry.blocks.length) + '%"></i></div>' +
        entry.blocks.map((b, i) => blockHTML(entry, i, b)).join('') + '</div>';
    } else if (entry) {
      const next = PLAN.find(p => p.date > entry.date && p.blocks.length);
      body += '<div class="card">' + headline + '<p style="font-size:1.15rem">' + esc(entry.note || '') + '</p>' +
        (next ? '<p class="muted">Następny dzień nauki: ' + DOW[next.dow] + ' ' + fmtDate(next.date) + ' – <a href="#/plan/' + next.date + '">zobacz zadania</a>.</p>' : '') + '</div>';
    } else if (headline) {
      body += '<div class="card">' + headline + '</div>';
    }

    // zaległości
    const overdue = STUDY_DAYS.filter(p => p.date < today && dayDone(p) < p.blocks.length);
    if (overdue.length) {
      body += '<div class="card"><h2>Zaległe bloki</h2><p class="muted small">Nic się nie stało – sobota 12.12 to dzień zapasu. Odhacz, jeśli już zrobione.</p><div class="chips">' +
        overdue.map(p => '<a class="chip" href="#/plan/' + p.date + '">' + DOW[p.dow] + ' ' + fmtDate(p.date) + ' · ' + (p.blocks.length - dayDone(p)) + '</a>').join('') + '</div></div>';
    }

    // statystyki
    const db = doneBlocks();
    const read = Object.keys(S.read).length;
    const mastered = CARDS.filter(c => cardBox(c.id) >= 4).length;
    body += '<div class="grid2">' +
      statCard('Plan', db + ' / ' + TOTAL_BLOCKS, 'bloków zrobionych', db / TOTAL_BLOCKS, '#/plan') +
      statCard('Notatki', read + ' / 72', 'pytań przeczytanych', read / 72, '#/notatki') +
      statCard('Fiszki', mastered + ' / ' + CARDS.length, 'opanowanych (3+ razy „umiem”)', mastered / CARDS.length, '#/fiszki') +
      statCard('Słabe pytania', String(S.weak.length), S.exams.length + ' ' + plural(S.exams.length, 'próbny egzamin', 'próbne egzaminy', 'próbnych egzaminów') + ' za Tobą', null, '#/notatki/slabe') +
      '</div>';
    body += '<div class="card flat small muted"><b>Zasady planu:</b> każdy blok = jedno zadanie, po bloku 5 min przerwy. Powtórki wracają po 1, 3 i 7 dniach. Na próbnych egzaminach pisz pełnymi zdaniami i terminami fachowymi.</div>';
    setView(body, { keepScroll: viewToday.rendered });
    viewToday.rendered = true;
    bindChecks(view(), viewToday);
  }
  function statCard(title, val, sub, frac, href) {
    return '<a class="card" href="' + href + '" style="text-decoration:none;color:inherit;margin:0">' +
      '<div class="kicker">' + title + '</div><div class="stat">' + val + '</div><div class="small muted">' + sub + '</div>' +
      (frac != null ? '<div class="progress" style="margin-top:10px"><i style="width:' + Math.round(100 * frac) + '%"></i></div>' : '') + '</a>';
  }

  function viewPlan(focusDate) {
    const today = todayISO();
    const open = focusDate || (today < PLAN[0].date ? PLAN[0].date : today);
    let html = '<h1>Plan nauki</h1><p class="muted">26.10 – 16.12 · niedziele wolne · egzamin czw 17.12 · ' + doneBlocks() + ' / ' + TOTAL_BLOCKS + ' bloków</p>';
    let stage = 0;
    PLAN.forEach(p => {
      if (p.stage !== stage) {
        stage = p.stage;
        html += '<div class="stage-h s' + stage + '"><span class="dot"></span><h2 style="margin:0">' + esc(STAGES[stage]) + '</h2></div>';
      }
      const isToday = p.date === today;
      const date = '<div class="d">' + DOW[p.dow] + ' ' + fmtDate(p.date) + '<small>' + (p.nr ? 'dzień ' + p.nr : '&nbsp;') + '</small></div>';
      if (!p.blocks.length) {
        const isExam = p.date === EXAM_DATE;
        html += '<details class="day ' + (isExam ? 'exam' : 'rest') + (isToday ? ' today' : '') + '" id="d-' + p.date + '"><summary>' + date +
          '<div class="sum">' + esc(p.note) + '</div></summary></details>';
        return;
      }
      const nd = dayDone(p);
      const summary = p.blocks.map(b => b.text).join(' · ');
      html += '<details class="day' + (nd === p.blocks.length ? ' complete' : '') + (isToday ? ' today' : '') + '" id="d-' + p.date + '"' + (p.date === open ? ' open' : '') + '>' +
        '<summary>' + date + '<div class="sum">' + esc(summary) + '</div><div class="cnt">' + (nd === p.blocks.length ? '✓' : nd + '/' + p.blocks.length) + '</div></summary>' +
        '<div class="inner">' + p.blocks.map((b, i) => blockHTML(p, i, b)).join('') + '</div></details>';
    });
    html += backupCard();
    setView(html);
    bindChecks(view(), () => { const y = window.scrollY; viewPlan(focusDate); window.scrollTo(0, y); });
    bindBackup();
    const target = document.getElementById('d-' + open);
    if (target && !viewPlan.scrolled) { target.scrollIntoView({ block: 'center' }); }
  }

  function backupCard() {
    return '<div class="card" style="margin-top:26px"><h2>Kopia postępu</h2>' +
      '<p class="small muted">Postęp zapisuje się tylko na tym urządzeniu, w tej przeglądarce. Ikona na ekranie głównym i Safari mają <b>osobną</b> pamięć – używaj jednego z nich. Raz na jakiś czas zrób kopię (plik trafi do aplikacji Pliki).</p>' +
      '<div class="row"><button class="btn" id="exp">⇩ Zapisz kopię</button>' +
      '<label class="btn">⇧ Wczytaj kopię<input type="file" id="imp" accept="application/json,.json" hidden></label>' +
      '<button class="btn bad" id="rst">Wyczyść postęp</button></div></div>';
  }
  function bindBackup() {
    $('#exp').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'poznawcza-postep-' + todayISO() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
    $('#imp').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then(t => {
        const obj = JSON.parse(t);
        if (!obj || typeof obj !== 'object' || !('done' in obj)) throw new Error('format');
        S = Object.assign(defaults(), obj);
        save();
        toast('Wczytano kopię postępu.');
        route();
      }).catch(() => toast('To nie jest plik kopii z tej aplikacji.'));
    });
    $('#rst').addEventListener('click', () => {
      if (confirm('Na pewno wyczyścić cały postęp (odhaczone bloki, fiszki, egzaminy)? Tego nie da się cofnąć.')) {
        S = defaults(); save(); toast('Postęp wyczyszczony.'); route();
      }
    });
  }

  // ----- notatki -----
  function viewNotes(filter) {
    const weakOnly = filter === 'slabe';
    let html = '<h1>Notatki</h1>' +
      '<input type="search" id="q" placeholder="Szukaj w notatkach (np. Treisman, priming, STM)…" autocomplete="off" value="' + esc(viewNotes.query || '') + '">' +
      '<div class="chips" style="margin:12px 0">' +
      '<a class="chip' + (weakOnly ? '' : ' on') + '" href="#/notatki">Wszystkie</a>' +
      '<a class="chip' + (weakOnly ? ' on' : '') + '" href="#/notatki/slabe">★ Słabe pytania (' + S.weak.length + ')</a>' +
      '<a class="chip" href="#/n/szkielet">Szkielet odpowiedzi</a><a class="chip" href="#/n/sciaga">Ściąga</a>' +
      '<a class="chip" href="#/n/kontrolne">Pytania kontrolne</a><a class="chip" href="#/n/poprawki">Poprawki i niejasności</a>' +
      '<a class="chip" href="#/tabele">▤ Tabele</a></div>' +
      '<div class="legend"><span class="l-red">kluczowe pojęcia i definicje</span><span class="l-yellow">przykłady i badania</span><span class="l-green">porównania i powiązania</span><span class="l-grey">dopiski spoza notatek</span></div>' +
      '<div id="qres"></div>';
    setView(html);
    const input = $('#q');
    const draw = () => {
      const query = input.value.trim().toLowerCase();
      viewNotes.query = input.value;
      let out = '';
      NOTES.sections.forEach(s => {
        const qs = s.questions.filter(q => (!weakOnly || isWeak(q.n)) && (!query || q.text.includes(query)));
        if (!qs.length) return;
        out += '<div class="sec-h" style="--sec:' + SECTION_COLORS[s.id] + '">' + s.id + '. ' + esc(s.title) + ' <span style="opacity:.8;font-weight:500">(pyt. ' + s.from + '–' + s.to + ')</span></div>' +
          '<div class="card qlist" style="padding:0;--sec:' + SECTION_COLORS[s.id] + '">' + qs.map(q =>
            '<a href="#/n/' + q.n + (query ? '?q=' + encodeURIComponent(query) : '') + '"><span class="qnum">' + q.n + '</span><span>' + esc(q.title) + '</span><span class="flags">' +
            (isWeak(q.n) ? '<span class="flag-weak" title="słabe">★</span> ' : '') + (S.read[q.n] ? '<span class="flag-read" title="przeczytane">✓</span>' : '') + '</span></a>').join('') + '</div>';
      });
      $('#qres').innerHTML = out || '<div class="empty">' + (weakOnly ? 'Brak słabych pytań. Dodasz je gwiazdką przy pytaniu albo po próbnym egzaminie.' : 'Nic nie znaleziono.') + '</div>';
    };
    input.addEventListener('input', draw);
    draw();
  }

  function viewQuestion(arg, query) {
    if (APPENDIX[arg]) {
      const a = APPENDIX[arg];
      setView('<a class="btn sm ghost" href="#/notatki">‹ Notatki</a><h1 style="margin-top:12px">' + esc(a.title) + '</h1><div class="card note">' + renderBlocks(a.blocks, query) + '</div>');
      return;
    }
    const nums = parseRange(arg);
    if (!nums.length) { setView('<div class="empty">Nie ma takiego pytania.</div>'); return; }
    const single = nums.length === 1;
    let html = '<a class="btn sm ghost" href="#/notatki">‹ Notatki</a>';
    if (!single) html += '<h1 style="margin-top:12px">Pytania ' + rangeLabel(nums) + '</h1>';
    nums.forEach(n => {
      const q = Q[n];
      const color = SECTION_COLORS[q.sec.id];
      const hasCards = CARDS.some(c => c.q === n);
      html += '<section style="--sec:' + color + ';margin-top:16px" id="q' + n + '">' +
        '<div class="kicker">Dział ' + q.sec.id + ' · ' + esc(q.sec.title) + '</div>' +
        '<div class="qhead"><span class="qnum">' + n + '</span><h1>' + esc(q.title) + '</h1></div>' +
        '<div class="toolbar">' +
        '<button class="btn sm" data-read="' + n + '">' + (S.read[n] ? '✓ Przeczytane' : '○ Oznacz jako przeczytane') + '</button>' +
        '<button class="btn sm" data-weak="' + n + '">' + (isWeak(n) ? '★ Słabe pytanie' : '☆ Dodaj do słabych') + '</button>' +
        '<button class="btn sm" data-hide="' + n + '">🙈 Zasłoń</button>' +
        '<a class="btn sm" href="#/cwicz/' + n + '">✎ Napisz z pamięci</a>' +
        (hasCards ? '<a class="btn sm" href="#/fiszki/sesja?q=' + n + '&m=terms">◧ Fiszki</a>' : '') +
        '</div><div class="card note" id="note' + n + '">' + renderBlocks(q.blocks, query) + '</div></section>';
    });
    if (single) {
      const n = nums[0];
      html += '<div class="pager">' + (Q[n - 1] ? '<a class="btn" href="#/n/' + (n - 1) + '">‹ pyt. ' + (n - 1) + '</a>' : '<span></span>') +
        (Q[n + 1] ? '<a class="btn" href="#/n/' + (n + 1) + '">pyt. ' + (n + 1) + ' ›</a>' : '') + '</div>';
    }
    setView(html, { keepScroll: viewQuestion.keep });
    viewQuestion.keep = false;
    const rerender = () => { const y = window.scrollY; viewQuestion.keep = true; viewQuestion(arg, query); window.scrollTo(0, y); };
    $$('[data-read]').forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.read;
      if (S.read[n]) delete S.read[n]; else S.read[n] = Date.now();
      save(); rerender();
    }));
    $$('[data-weak]').forEach(b => b.addEventListener('click', () => { toggleWeak(+b.dataset.weak); rerender(); }));
    $$('[data-hide]').forEach(b => b.addEventListener('click', () => {
      const el = $('#note' + b.dataset.hide);
      const hidden = el.classList.toggle('hidden-note');
      b.textContent = hidden ? '👁 Odsłoń' : '🙈 Zasłoń';
    }));
    if (query) { const m = $('mark'); if (m) m.scrollIntoView({ block: 'center' }); }
  }

  function viewTables(secId) {
    const secs = secId ? NOTES.sections.filter(s => s.id === secId) : NOTES.sections;
    let html = '<a class="btn sm ghost" href="#/notatki">‹ Notatki</a><h1 style="margin-top:12px">Tabele i porównania' + (secId ? ' – dział ' + secId : '') + '</h1>' +
      '<p class="muted">Najpierw spróbuj odtworzyć tabelę z pamięci (na kartce), potem odsłoń i porównaj.</p>' +
      '<div class="chips" style="margin-bottom:10px"><a class="chip' + (secId ? '' : ' on') + '" href="#/tabele">Wszystkie</a>' +
      NOTES.sections.map(s => '<a class="chip' + (s.id === secId ? ' on' : '') + '" href="#/tabele/' + s.id + '">' + s.id + '</a>').join('') + '</div>';
    let count = 0;
    secs.forEach(s => s.questions.forEach(q => q.blocks.forEach(b => {
      if (b.t !== 'table') return;
      count++;
      html += '<div class="card" style="--sec:' + SECTION_COLORS[s.id] + '"><div class="row between"><div><span class="qnum">' + q.n + '</span> <b>' + esc(q.title) + '</b></div>' +
        '<button class="btn sm" data-reveal="t' + count + '">👁 Odsłoń</button></div><div class="note hidden-note" id="t' + count + '" style="margin-top:10px">' + renderBlocks([b]) + '</div></div>';
    })));
    if (!count) html += '<div class="empty">W tym dziale nie ma tabel – opowiedz na głos 2 losowe pytania z działu.</div>';
    setView(html);
    $$('[data-reveal]').forEach(b => b.addEventListener('click', () => {
      const hidden = $('#' + b.dataset.reveal).classList.toggle('hidden-note');
      b.textContent = hidden ? '👁 Odsłoń' : '🙈 Zasłoń';
    }));
  }

  // ----- fiszki -----
  let session = null;
  function viewCardsHome() {
    const boxes = [0, 0, 0, 0, 0];
    CARDS.forEach(c => { const b = cardBox(c.id); if (b) boxes[b - 1]++; });
    const fresh = CARDS.filter(c => !cardBox(c.id)).length;
    const sel = viewCardsHome.sel || (viewCardsHome.sel = new Set());
    let html = '<h1>Fiszki</h1><p class="muted">' + CARDS.length + ' fiszek „termin → definicja” z pogrubionych pojęć w notatce oraz 72 pytania egzaminacyjne.</p>' +
      '<div class="card"><div class="kicker">Twoje pudełka (system Leitnera)</div><div class="boxes">' +
      boxes.map((n, i) => '<div><b>' + n + '</b>' + (i === 0 ? 'nie umiem' : (i === 4 ? '4+' : i) + '× umiem') + '</div>').join('') +
      '</div><p class="small muted" style="margin:10px 0 0">Nowych: ' + fresh + '. Fiszki z niższych pudełek pojawiają się w sesji jako pierwsze.</p></div>' +
      '<div class="card"><h2>Zakres</h2><div class="chips" id="secs">' +
      NOTES.sections.map(s => '<button class="chip' + (sel.has(s.id) ? ' on' : '') + '" data-sec="' + s.id + '" title="' + esc(s.title) + '">' + s.id + '. ' + esc(s.title.split(' – ')[0]) + '</button>').join('') +
      '</div><p class="small muted" style="margin:10px 0 0">Nic nie zaznaczone = wszystkie działy.</p></div>' +
      '<div class="grid2">' +
      '<button class="card btn tile" data-start="terms"><div class="stat">◧</div><b>Termin → definicja</b><div class="small muted">Odwróć kartę, oceń „umiem / nie umiem”.</div></button>' +
      '<button class="card btn tile" data-start="quiz"><div class="stat">?</div><b>Quiz ABCD</b><div class="small muted">Definicja i 4 terminy do wyboru.</div></button>' +
      '<button class="card btn tile" data-start="questions"><div class="stat">72</div><b>Pytania egzaminacyjne</b><div class="small muted">Odpowiedz na głos, potem sprawdź z notatką. „Nie umiem” → słabe pytania.</div></button>' +
      '<button class="card btn tile" data-start="weak"' + (S.weak.length ? '' : ' disabled') + '><div class="stat">★</div><b>Słabe pytania (' + S.weak.length + ')</b><div class="small muted">Pytania i terminy z Twojej listy słabych.</div></button>' +
      '</div>';
    setView(html);
    $$('[data-sec]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.sec;
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      b.classList.toggle('on');
    }));
    $$('[data-start]').forEach(b => b.addEventListener('click', () => {
      const mode = b.dataset.start;
      const s = Array.from(sel).join(',');
      if (mode === 'weak') location.hash = '#/fiszki/sesja?weak=1&m=questions';
      else location.hash = '#/fiszki/sesja?m=' + mode + (s ? '&s=' + s : '');
    }));
  }

  function buildDeck(params) {
    const mode = params.get('m') || 'terms';
    let qset = null;
    if (params.get('q')) qset = new Set(parseRange(params.get('q')));
    if (params.get('s')) { const secs = params.get('s').split(','); qset = new Set(QUESTIONS.filter(q => secs.includes(q.sec.id)).map(q => q.n)); }
    if (params.get('weak')) qset = new Set(S.weak);
    if (mode === 'questions') {
      const qs = QUESTIONS.filter(q => !qset || qset.has(q.n));
      return { mode, items: shuffle(qs).map(q => ({ kind: 'q', id: 'Q' + q.n, q })) };
    }
    const cards = CARDS.filter(c => !qset || qset.has(c.q));
    const ordered = shuffle(cards).sort((a, b) => cardBox(a.id) - cardBox(b.id));
    return { mode: mode === 'quiz' ? 'quiz' : 'terms', items: ordered.slice(0, 30).map(c => ({ kind: 'c', id: c.id, c })), total: cards.length };
  }

  function viewSession(params) {
    if (!session || session.key !== location.hash) {
      const deck = buildDeck(params);
      if (!deck.items.length) {
        setView('<a class="btn sm ghost" href="#/fiszki">‹ Fiszki</a><div class="empty">W tym zakresie nie ma fiszek z terminami. <br><br><a class="btn primary" href="' +
          location.hash.replace(/m=(terms|quiz)/, 'm=questions') + '">Przećwicz pytania egzaminacyjne</a></div>');
        return;
      }
      session = { key: location.hash, mode: deck.mode, items: deck.items, i: 0, flipped: false, good: 0, bad: 0, again: new Set(), total: deck.total };
    }
    const s = session;
    if (s.i >= s.items.length) return sessionSummary();
    const it = s.items[s.i];
    const head = '<div class="row between"><a class="btn sm ghost" href="#/fiszki">‹ Fiszki</a><span class="muted small">' + (s.i + 1) + ' / ' + s.items.length +
      (s.total > s.items.length ? ' (z ' + s.total + ')' : '') + '</span></div><div class="progress" style="margin:10px 0 16px"><i style="width:' + (100 * s.i / s.items.length) + '%"></i></div>';
    if (s.mode === 'quiz') return quizCard(head, it);
    let front, back, ctx, cls = '';
    if (it.kind === 'q') {
      ctx = 'Dział ' + it.q.sec.id + ' · pytanie egzaminacyjne';
      front = '<span class="qnum" style="--sec:' + SECTION_COLORS[it.q.sec.id] + '">' + it.q.n + '</span><br>' + esc(it.q.title);
      back = '<div class="note">' + renderBlocks(it.q.blocks) + '</div>';
      cls = ' qcard';
    } else {
      const q = Q[it.c.q];
      ctx = 'pyt. ' + q.n + ' · ' + esc(q.title);
      front = esc(it.c.term);
      back = '<div class="note">' + it.c.def + '</div>';
    }
    setView(head + '<div class="card fc' + cls + '" id="fc"><div class="ctx">' + ctx + '</div><div class="front">' + front + '</div>' +
      (s.flipped ? '<div class="back">' + back + '</div>' : '<div class="hint">' + (it.kind === 'q' ? 'Odpowiedz na głos (ok. 2 min), potem dotknij, by sprawdzić' : 'Dotknij, by odwrócić') + '</div>') + '</div>' +
      (s.flipped ? '<div class="answer-btns"><button class="btn bad" id="no">✗ Nie umiem</button><button class="btn ok" id="yes">✓ Umiem</button></div>' : ''));
    $('#fc').addEventListener('click', e => { if (e.target.closest('a')) return; if (!s.flipped) { s.flipped = true; viewSession(params); } });
    if (s.flipped) {
      $('#yes').addEventListener('click', () => answer(true));
      $('#no').addEventListener('click', () => answer(false));
    }
    function answer(ok) {
      if (it.kind === 'c') setBox(it.id, ok ? Math.max(2, cardBox(it.id) + 1) : 1);
      else if (!ok && !isWeak(it.q.n)) { toggleWeak(it.q.n, true); toast('pyt. ' + it.q.n + ' dodane do słabych pytań'); }
      if (ok) s.good++; else { s.bad++; if (!s.again.has(it.id)) { s.again.add(it.id); s.items.push(it); } }
      s.i++; s.flipped = false;
      viewSession(params);
    }
  }

  function quizCard(head, it) {
    const s = session;
    const c = it.c;
    if (!it.opts) {
      const sameSec = CARDS.filter(x => x.s === c.s && x.id !== c.id && x.term !== c.term);
      const pool = sameSec.length >= 3 ? sameSec : CARDS.filter(x => x.id !== c.id && x.term !== c.term);
      it.opts = shuffle([c].concat(shuffle(pool).slice(0, 3)));
    }
    let def = plainText(c.def);
    if (def.length > 320) def = def.slice(0, 317) + '…';
    setView(head + '<div class="card"><div class="kicker">Który termin pasuje do opisu?</div><p style="font-size:1.1rem">' + esc(def) + '</p></div>' +
      it.opts.map((o, i) => '<button class="btn opt' + (it.picked != null ? (o.id === c.id ? ' right' : (i === it.picked ? ' wrong' : '')) : '') + '" data-opt="' + i + '">' +
        String.fromCharCode(65 + i) + '. ' + esc(o.term) + '</button>').join('') +
      (it.picked != null ? '<div class="row between" style="margin-top:6px"><span class="muted small">pyt. ' + c.q + ' · <a href="#/n/' + c.q + '">otwórz notatkę</a></span><button class="btn primary" id="next">Dalej ›</button></div>' : ''));
    if (it.picked == null) {
      $$('[data-opt]').forEach(b => b.addEventListener('click', () => {
        it.picked = +b.dataset.opt;
        const ok = it.opts[it.picked].id === c.id;
        setBox(c.id, ok ? Math.max(2, cardBox(c.id) + 1) : 1);
        if (ok) s.good++; else s.bad++;
        quizCard(head, it);
      }));
    } else {
      $('#next').addEventListener('click', () => { s.i++; viewSession(new URLSearchParams(location.hash.split('?')[1] || '')); });
    }
  }

  function sessionSummary() {
    const s = session;
    const total = s.good + s.bad;
    setView('<h1>Koniec sesji</h1><div class="card"><div class="grid2"><div><div class="stat" style="color:var(--ok)">' + s.good + '</div><div class="muted">' +
      (s.mode === 'quiz' ? 'dobrych odpowiedzi' : 'umiem') + '</div></div><div><div class="stat" style="color:var(--bad)">' + s.bad + '</div><div class="muted">' +
      (s.mode === 'quiz' ? 'błędnych' : 'do powtórki') + '</div></div></div>' +
      '<div class="progress ok" style="margin-top:14px"><i style="width:' + (total ? 100 * s.good / total : 0) + '%"></i></div></div>' +
      '<div class="row"><button class="btn primary" id="again">↻ Jeszcze raz</button><a class="btn" href="#/fiszki">Fiszki</a><a class="btn" href="#/dzis">Dziś</a></div>');
    $('#again').addEventListener('click', () => { session = null; route(); });
  }

  // ----- egzamin -----
  function viewExamHome() {
    const ex = S.exam;
    let html = '<h1>Próbny egzamin</h1><p class="muted">3 losowe pytania otwarte, ok. 15 min na pytanie, bez notatki. Potem porównujesz odpowiedź z notatką, a aplikacja pokazuje, których kluczowych terminów zabrakło.</p>';
    if (ex) {
      html += '<div class="card exam-q"><b>Masz rozpoczęty egzamin</b> (pyt. ' + ex.qs.join(', ') + ').<div class="row" style="margin-top:10px">' +
        '<a class="btn primary" href="#/egzamin/' + (ex.phase === 'review' ? 'sprawdz' : 'pisz') + '">Wróć do egzaminu</a><button class="btn bad" id="drop">Porzuć</button></div></div>';
    }
    const ranges = [['1-34', 'pyt. 1–34'], ['35-72', 'pyt. 35–72'], ['1-72', 'wszystkie 1–72']];
    html += '<div class="card"><h2>Nowy egzamin</h2><div class="chips">' +
      ranges.map(r => '<a class="chip" href="#/egzamin/nowy/' + r[0] + '">' + r[1] + '</a>').join('') +
      '<a class="chip" href="#/egzamin/nowy/slabe"' + (S.weak.length >= 3 ? '' : ' style="opacity:.5;pointer-events:none"') + '>★ ze słabych (' + S.weak.length + ')</a>' +
      NOTES.sections.map(s => '<a class="chip" href="#/egzamin/nowy/' + s.from + '-' + s.to + '">dział ' + s.id + '</a>').join('') + '</div></div>';
    html += '<h2 style="margin-top:22px">Historia</h2>';
    if (!S.exams.length) html += '<div class="empty">Jeszcze żadnego egzaminu. Pierwszy próbny jest w planie na pt 27.11.</div>';
    S.exams.slice().reverse().forEach(e => {
      html += '<div class="card"><div class="row between"><b>' + fmtDate(e.date) + ' · ' + (e.kind === 'single' ? 'ćwiczenie' : 'egzamin') + '</b><span class="muted small">' + esc(e.range || '') + '</span></div><div class="chips" style="margin-top:8px">' +
        e.qs.map(n => '<a class="chip" href="#/n/' + n + '">' + gradeIcon(e.grades[n]) + ' pyt. ' + n + ' · ' + (e.cov[n] != null ? e.cov[n] + '%' : '') + '</a>').join('') + '</div></div>';
    });
    setView(html);
    const drop = $('#drop');
    if (drop) drop.addEventListener('click', () => { if (confirm('Porzucić rozpoczęty egzamin?')) { S.exam = null; save(); viewExamHome(); } });
  }
  function gradeIcon(g) { return g === 'ok' ? '🟢' : g === 'mid' ? '🟡' : g === 'bad' ? '🔴' : '⚪'; }

  function newExam(arg) {
    let pool;
    if (arg === 'slabe') pool = S.weak.slice();
    else { const m = String(arg).match(/^(\d+)-(\d+)$/); pool = m ? parseRange(m[1] + '–' + m[2]) : parseRange('1–72'); }
    if (S.exam && !confirm('Masz rozpoczęty egzamin. Zacząć nowy (stary zostanie porzucony)?')) { location.hash = '#/egzamin/pisz'; return; }
    const qs = shuffle(pool).slice(0, 3).sort((a, b) => a - b);
    S.exam = { kind: 'exam', range: arg === 'slabe' ? 'słabe pytania' : 'pyt. ' + String(arg).replace('-', '–'), qs, answers: {}, start: null, limitMin: 15 * qs.length, phase: 'draw', grades: {} };
    save();
    location.replace('#/egzamin/pisz');
  }
  function newPractice(n) {
    if (!S.practice || S.practice.qs[0] !== n || S.practice.phase === 'done') {
      S.practice = { kind: 'single', range: 'pyt. ' + n, qs: [n], answers: {}, start: null, limitMin: 15, phase: 'draw', grades: {} };
      save();
    }
    viewWrite('practice');
  }

  let examTick = null;
  function viewWrite(key) {
    const ex = S[key];
    if (!ex) { location.hash = '#/egzamin'; return; }
    if (ex.phase === 'review') return viewReview(key);
    const back = key === 'exam' ? '#/egzamin' : '#/n/' + ex.qs[0];
    if (ex.phase === 'draw') {
      setView('<a class="btn sm ghost" href="' + back + '">‹ Wróć</a><h1 style="margin-top:12px">' + (key === 'exam' ? 'Wylosowane pytania' : 'Napisz z pamięci') + '</h1>' +
        ex.qs.map(n => '<div class="card exam-q" style="--accent:' + SECTION_COLORS[Q[n].sec.id] + '"><span class="qnum" style="--sec:' + SECTION_COLORS[Q[n].sec.id] + '">' + n + '</span> <b>' + esc(Q[n].title) + '</b></div>').join('') +
        '<div class="card flat small"><b>Szkielet:</b> 1. definicja → 2. autor / teoria → 3. badanie lub przykład → 4. porównanie lub wniosek. Pełne zdania, terminy fachowe.</div>' +
        '<label class="row" style="margin:6px 0 14px"><input type="checkbox" id="tm" checked style="width:22px;height:22px"> Odliczaj czas (' + ex.limitMin + ' min)</label>' +
        '<div class="row"><button class="btn primary" id="go">Start – piszę</button>' + (key === 'exam' ? '<button class="btn" id="redraw">↻ Losuj ponownie</button>' : '') + '</div>');
      $('#go').addEventListener('click', () => {
        ex.phase = 'write'; ex.start = Date.now(); if (!$('#tm').checked) ex.limitMin = 0; save(); viewWrite(key);
      });
      const rd = $('#redraw');
      if (rd) rd.addEventListener('click', () => { const r = ex.range; S.exam = null; newExam(r === 'słabe pytania' ? 'slabe' : r.replace('pyt. ', '').replace('–', '-')); viewWrite('exam'); });
      return;
    }
    setView('<div class="row between"><a class="btn sm ghost" href="' + back + '">‹ Wróć</a><span class="big-timer" id="et"></span></div>' +
      ex.qs.map(n => '<div class="card exam-q" style="--accent:' + SECTION_COLORS[Q[n].sec.id] + '"><div style="margin-bottom:10px"><span class="qnum" style="--sec:' + SECTION_COLORS[Q[n].sec.id] + '">' + n + '</span> <b>' + esc(Q[n].title) + '</b></div>' +
        '<textarea data-ans="' + n + '" placeholder="Pisz pełnymi zdaniami: definicja, autor, badanie, porównanie…" autocapitalize="sentences" spellcheck="true">' + esc(ex.answers[n] || '') + '</textarea></div>').join('') +
      '<div class="row"><button class="btn primary" id="fin">Zakończ i sprawdź z notatką</button></div><p class="small muted">Odpowiedzi zapisują się na bieżąco – możesz zamknąć aplikację i wrócić.</p>');
    $$('[data-ans]').forEach(t => t.addEventListener('input', () => { ex.answers[t.dataset.ans] = t.value; save(); }));
    $('#fin').addEventListener('click', () => {
      const empty = ex.qs.filter(n => !(ex.answers[n] || '').trim()).length;
      if (empty && !confirm('Puste odpowiedzi: ' + empty + '. Mimo to sprawdzić?')) return;
      ex.phase = 'review'; ex.end = Date.now(); save(); viewReview(key);
    });
    clearInterval(examTick);
    const tick = () => {
      const el = $('#et');
      if (!el) { clearInterval(examTick); return; }
      const elapsed = Date.now() - ex.start;
      if (ex.limitMin) {
        const left = ex.limitMin * 60000 - elapsed;
        el.textContent = left >= 0 ? '⏱ ' + fmtMin(left) : '⏱ +' + fmtMin(-left);
        el.classList.toggle('late', left < 0);
      } else el.textContent = '⏱ ' + fmtMin(elapsed);
    };
    tick();
    examTick = setInterval(tick, 1000);
  }

  function viewReview(key) {
    const ex = S[key];
    if (!ex) { location.hash = '#/egzamin'; return; }
    let html = '<h1>Sprawdź odpowiedzi</h1><p class="muted">Porównaj z notatką i oceń się uczciwie. „Średnio” i „Słabo” dodają pytanie do listy słabych.' +
      (ex.end && ex.start ? ' Czas pisania: ' + fmtMin(ex.end - ex.start) + '.' : '') + '</p>';
    ex.qs.forEach(n => {
      const q = Q[n];
      const cov = termCoverage(q, ex.answers[n]);
      const g = ex.grades[n];
      html += '<div class="card exam-q" style="--sec:' + SECTION_COLORS[q.sec.id] + ';--accent:' + SECTION_COLORS[q.sec.id] + '">' +
        '<div class="qhead"><span class="qnum">' + n + '</span><h2 style="margin:6px 0 0">' + esc(q.title) + '</h2></div>' +
        '<div style="margin:14px 0"><div class="row between"><b>Kluczowe terminy w Twojej odpowiedzi</b><span class="muted">' + cov.hits + ' / ' + cov.total + ' (' + cov.pct + '%)</span></div>' +
        '<div class="progress ok" style="margin:6px 0 10px"><i style="width:' + cov.pct + '%"></i></div><div class="terms">' +
        cov.res.map(r => '<span class="term ' + (r.hit ? 'hit' : 'miss') + '">' + (r.hit ? '✓ ' : '✗ ') + esc(r.t) + '</span>').join('') + '</div>' +
        '<p class="small muted" style="margin:8px 0 0">Wykrywanie jest przybliżone (odmiana słów) – traktuj jako podpowiedź, nie ocenę.</p></div>' +
        '<div class="compare"><div><div class="kicker">Twoja odpowiedź</div><div class="my-answer">' + (esc(ex.answers[n] || '').trim() || '<span class="muted">(pusto)</span>') + '</div></div>' +
        '<div><div class="kicker">Notatka</div><div class="note">' + renderBlocks(q.blocks) + '</div></div></div>' +
        '<div class="kicker" style="margin-top:14px">Jak poszło?</div><div class="grade-btns">' +
        [['ok', '🟢 Dobrze', 'ok'], ['mid', '🟡 Średnio', 'mid'], ['bad', '🔴 Słabo', 'bad']].map(b => '<button class="btn ' + b[2] + (g === b[0] ? ' sel' : '') + '" data-grade="' + n + ':' + b[0] + '">' + b[1] + '</button>').join('') +
        '</div></div>';
    });
    const allGraded = ex.qs.every(n => ex.grades[n]);
    html += '<div class="row"><button class="btn primary" id="save"' + (allGraded ? '' : ' disabled') + '>Zapisz wynik</button><span class="muted small">' + (allGraded ? '' : 'Oceń każde pytanie, żeby zapisać.') + '</span></div>';
    setView(html, { wide: true, keepScroll: viewReview.keep });
    viewReview.keep = false;
    $$('[data-grade]').forEach(b => b.addEventListener('click', () => {
      const [n, g] = b.dataset.grade.split(':');
      ex.grades[n] = g; save();
      const y = window.scrollY; viewReview.keep = true; viewReview(key); window.scrollTo(0, y);
    }));
    $('#save').addEventListener('click', () => {
      const cov = {};
      ex.qs.forEach(n => {
        cov[n] = termCoverage(Q[n], ex.answers[n]).pct;
        if (ex.grades[n] === 'ok') toggleWeak(n, false); else toggleWeak(n, true);
      });
      S.exams.push({ date: todayISO(), kind: ex.kind, range: ex.range, qs: ex.qs, grades: ex.grades, cov, answers: ex.answers });
      S[key] = null;
      save();
      toast('Zapisano. Słabe pytania: ' + S.weak.length);
      location.hash = key === 'exam' ? '#/egzamin' : '#/n/' + ex.qs[0];
    });
  }

  // ---------- minutnik (bloki 25 min) ----------
  let audioCtx = null;
  function beep() {
    try {
      if (!audioCtx) return;
      [0, 0.35, 0.7].forEach(t => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.25);
        o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.3);
      });
    } catch (e) { /* bez dźwięku */ }
  }
  function startTimer(label, mode) {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) { audioCtx = null; }
    mode = mode || 'focus';
    S.timer = { label, mode, end: Date.now() + (mode === 'focus' ? 25 : 5) * 60000 };
    save();
    drawTimer();
  }
  function drawTimer() {
    const el = $('#timer');
    const t = S.timer;
    if (!t) { el.hidden = true; return; }
    const left = t.end - Date.now();
    if (left <= 0) {
      S.timer = null; save(); el.hidden = true; beep();
      if (t.mode === 'focus') {
        if (confirm('Koniec bloku 25 min! Odhacz go w planie.\n\nZacząć 5 minut przerwy?')) startTimer('Przerwa', 'break');
      } else toast('Koniec przerwy – czas na kolejny blok.');
      return;
    }
    el.hidden = false;
    el.className = 'timer-pill' + (t.mode === 'break' ? ' break' : '');
    if (!el.dataset.ready) {
      el.innerHTML = '<span id="tl"></span><button id="tstop" aria-label="Zatrzymaj minutnik">✕</button>';
      el.dataset.ready = '1';
      $('#tstop').addEventListener('click', () => { if (confirm('Zatrzymać minutnik?')) { S.timer = null; save(); drawTimer(); } });
    }
    $('#tl').textContent = (t.mode === 'break' ? '☕ ' : '⏱ ') + fmtMin(left);
  }
  setInterval(drawTimer, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) drawTimer(); });

  // ---------- nagłówek ----------
  function drawCountdown() {
    const d = daysBetween(todayISO(), EXAM_DATE);
    $('#countdown').innerHTML = d > 0 ? 'egzamin za <b>' + d + '</b> ' + plural(d, 'dzień', 'dni', 'dni') + ' · 17.12'
      : d === 0 ? '<b>Dziś egzamin – powodzenia!</b>' : 'egzamin był 17.12';
  }

  // ---------- router ----------
  function route() {
    clearInterval(examTick);
    const hash = location.hash || '#/dzis';
    const [path, qs] = hash.slice(1).split('?');
    const params = new URLSearchParams(qs || '');
    const parts = path.split('/').filter(Boolean);
    const tab = { dzis: 'dzis', plan: 'plan', notatki: 'notatki', n: 'notatki', tabele: 'notatki', fiszki: 'fiszki', egzamin: 'egzamin', cwicz: 'egzamin' }[parts[0]] || 'dzis';
    $$('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    if (parts[0] !== 'fiszki' || parts[1] !== 'sesja') session = null;
    switch (parts[0]) {
      case 'plan': viewPlan(parts[1]); break;
      case 'notatki': viewNotes(parts[1]); break;
      case 'n': viewQuestion(parts[1], params.get('q')); break;
      case 'tabele': viewTables(parts[1]); break;
      case 'fiszki': parts[1] === 'sesja' ? viewSession(params) : viewCardsHome(); break;
      case 'egzamin':
        if (parts[1] === 'nowy') newExam(parts[2]);
        else if (parts[1] === 'pisz') viewWrite('exam');
        else if (parts[1] === 'sprawdz') viewReview('exam');
        else viewExamHome();
        break;
      case 'cwicz': newPractice(+parts[1]); break;
      default: viewToday();
    }
    drawCountdown();
  }
  window.addEventListener('hashchange', () => { viewToday.rendered = false; route(); });
  route();
  drawTimer();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
