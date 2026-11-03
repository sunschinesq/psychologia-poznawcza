/* Dodatki: kartka do pisania rysikiem (Ink), schematy do uzupełniania i porównania teorii. */
(function () {
  'use strict';

  const XD = window.EXTRAS_DATA;
  const api = () => window.PP;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ======================================================================
  // Kartka do rysowania – Apple Pencil (nacisk), palec, mysz
  // ======================================================================
  const COLORS = [['#1c2430', 'czarny'], ['#2563c9', 'niebieski'], ['#d93025', 'czerwony'], ['#2e9e44', 'zielony']];
  function mountInk(el, opts) {
    opts = opts || {};
    el.classList.add('ink');
    el.innerHTML = '<div class="ink-tools">' +
      COLORS.map((c, i) => '<button class="ink-color' + (i === 0 ? ' on' : '') + '" data-color="' + c[0] + '" style="--c:' + c[0] + '" aria-label="Kolor ' + c[1] + '"></button>').join('') +
      '<button class="ink-btn" data-width title="Grubość">━</button>' +
      '<button class="ink-btn" data-eraser title="Gumka">🧽</button>' +
      '<button class="ink-btn" data-undo title="Cofnij">↶</button>' +
      '<button class="ink-btn" data-clear title="Wyczyść">🗑</button>' +
      '<button class="ink-btn" data-grow title="Większa kartka">↕</button>' +
      '<span class="ink-hint">' + (opts.hint || '') + '</span></div><canvas class="ink-canvas" style="height:' + (opts.height || 360) + 'px"></canvas>';
    const cv = $('canvas', el);
    const ctx = cv.getContext('2d');
    let strokes = [], cur = null, bg = null, penSeen = false;
    let color = COLORS[0][0], thick = false, eraser = false;
    let saveT = null;

    if (opts.data) { bg = new Image(); bg.onload = () => redraw(); bg.src = opts.data; }

    function size() {
      const r = cv.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (!r.width) return;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }
    function drawStroke(s) {
      ctx.save();
      ctx.globalCompositeOperation = s.eraser ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = s.pts;
      if (pts.length === 1) {
        ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], widthAt(s, pts[0][2]) / 2, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 1; i < pts.length; i++) {
        ctx.lineWidth = widthAt(s, pts[i][2]);
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      }
      ctx.restore();
    }
    function widthAt(s, p) {
      if (s.eraser) return 22;
      const base = s.thick ? 5 : 2.2;
      return base * (0.45 + 1.1 * (p || 0.5));
    }
    function redraw() {
      const r = cv.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      if (bg && bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, r.width, bg.naturalHeight * r.width / bg.naturalWidth);
      strokes.forEach(drawStroke);
      if (cur) drawStroke(cur);
    }
    function point(e) {
      const r = cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top, e.pointerType === 'pen' ? e.pressure : (e.pointerType === 'mouse' ? 0.5 : 0.55)];
    }
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen') penSeen = true;
      if (e.pointerType === 'touch' && penSeen) return; // dłoń oparta o ekran przy pisaniu rysikiem
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      cur = { color, thick, eraser, pts: [point(e)], id: e.pointerId };
      redraw();
    });
    cv.addEventListener('pointermove', e => {
      if (!cur || e.pointerId !== cur.id) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach(ev => cur.pts.push(point(ev)));
      // dorysuj tylko końcówkę
      const s = { color: cur.color, thick: cur.thick, eraser: cur.eraser, pts: cur.pts.slice(-evs.length - 1) };
      drawStroke(s);
    });
    const end = e => {
      if (!cur || e.pointerId !== cur.id) return;
      strokes.push(cur);
      cur = null;
      changed();
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);

    function changed() {
      if (!opts.onChange) return;
      clearTimeout(saveT);
      saveT = setTimeout(() => opts.onChange(exportPNG()), 600);
    }
    function isEmpty() { return !strokes.length && !bg; }
    function exportPNG() {
      if (isEmpty()) return null;
      const r = cv.getBoundingClientRect();
      const out = document.createElement('canvas');
      out.width = Math.round(r.width);
      out.height = Math.round(r.height);
      const o = out.getContext('2d');
      o.drawImage(cv, 0, 0, out.width, out.height);
      // przytnij pustą dolną część, żeby plik był mniejszy
      const data = o.getImageData(0, 0, out.width, out.height).data;
      let last = 0;
      for (let y = out.height - 1; y >= 0 && !last; y--) {
        for (let x = 0; x < out.width; x += 2) { if (data[(y * out.width + x) * 4 + 3] > 0) { last = y; break; } }
      }
      if (!last) return null;
      const cut = document.createElement('canvas');
      cut.width = out.width; cut.height = Math.min(out.height, last + 12);
      cut.getContext('2d').drawImage(out, 0, 0);
      return cut.toDataURL('image/png');
    }

    $$('[data-color]', el).forEach(b => b.addEventListener('click', () => {
      color = b.dataset.color; eraser = false;
      $$('.ink-color', el).forEach(x => x.classList.toggle('on', x === b));
      $('[data-eraser]', el).classList.remove('on');
    }));
    $('[data-width]', el).addEventListener('click', e => { thick = !thick; e.currentTarget.classList.toggle('on', thick); e.currentTarget.textContent = thick ? '▬' : '━'; });
    $('[data-eraser]', el).addEventListener('click', e => { eraser = !eraser; e.currentTarget.classList.toggle('on', eraser); });
    $('[data-undo]', el).addEventListener('click', () => { if (strokes.length) { strokes.pop(); redraw(); changed(); } });
    $('[data-clear]', el).addEventListener('click', () => {
      if (isEmpty() || !confirm('Wyczyścić całą kartkę?')) return;
      strokes = []; bg = null; redraw();
      if (opts.onChange) { clearTimeout(saveT); opts.onChange(null); }
    });
    $('[data-grow]', el).addEventListener('click', () => {
      const h = parseInt(cv.style.height, 10);
      cv.style.height = (h < 600 ? 720 : (opts.height || 360)) + 'px';
      size();
    });
    requestAnimationFrame(size);
    const ro = window.ResizeObserver ? new ResizeObserver(() => size()) : null;
    if (ro) ro.observe(cv);
    return { isEmpty, exportPNG };
  }

  // ======================================================================
  // Dopasowanie odpowiedzi wpisanej (także pismem odręcznym – Scribble)
  // ======================================================================
  // bez polskich znaków – pismo odręczne i szybkie pisanie często je gubią
  const fold = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  function words(s) { return fold(s).replace(/[„”"'’()]/g, ' ').split(/[^a-z0-9]+/).filter(Boolean); }
  function matches(input, node) {
    const inp = words(input || '');
    if (!inp.length) return false;
    return [node.label].concat(node.alt || []).some(expected => {
      const exp = words(expected).filter(w => w.length >= 3 || /\d/.test(w));
      if (!exp.length) return false;
      const hits = exp.filter(w => {
        const stem = /\d/.test(w) ? w : w.slice(0, Math.max(3, w.length - 3));
        return inp.some(a => a.startsWith(stem));
      }).length;
      return hits >= Math.ceil(exp.length * 0.7);
    });
  }

  // ======================================================================
  // Schematy
  // ======================================================================
  let dg = null;
  function diagramList() {
    const P = api(), G = window.GAMES;
    const g = P.S.games || {};
    const best = g.diagrams || {};
    const list = XD.diagrams.filter(d => G.inScope(d.q));
    P.setView(head('🧩 Uzupełnij schemat') +
      '<p class="muted">Schematy modeli z notatki z zasłoniętymi podpisami. Możesz układać kafelki albo wpisywać – na iPadzie także rysikiem, prosto w pole (Scribble zamienia pismo na tekst).</p>' +
      G.scopePicker(list.length + ' ' + P.plural(list.length, 'schemat', 'schematy', 'schematów')) +
      (list.length ? '<div class="card qlist" style="padding:0">' + list.map(d =>
        '<a href="#/gry/schemat/' + d.id + '" style="--sec:' + P.SECTION_COLORS[P.Q[d.q].sec.id] + '"><span class="qnum">' + d.q + '</span><span>' + P.esc(d.title) + '</span><span class="flags">' +
        (best[d.id] === 0 ? '<span class="flag-read">✓</span>' : best[d.id] != null ? '<span class="muted small">' + best[d.id] + ' bł.</span>' : '') + '</span></a>').join('') + '</div>'
        : '<div class="empty">W tym zakresie nie ma schematów. Poszerz zakres powyżej.</div>'));
    G.bindScope(() => diagramList());
  }
  function head(title, right) {
    return '<div class="row between"><a class="btn sm ghost" href="#/gry">‹ Gry</a><span class="muted small">' + (right || '') + '</span></div><h1 style="margin-top:10px">' + title + '</h1>';
  }

  function viewDiagram(id) {
    const P = api();
    const d = XD.diagrams.find(x => x.id === id);
    if (!d) { dg = null; diagramList(); return; }
    if (!dg || dg.id !== id) {
      const hidden = d.nodes.filter(n => !n.given).map(n => n.id);
      dg = { id, mode: dg && dg.mode || 'tiles', hidden, placed: {}, typed: {}, checked: false, sel: null, mistakes: 0, flash: null, pool: P.shuffle(hidden), revealed: {} };
    }
    const q = P.Q[d.q];
    const color = P.SECTION_COLORS[q.sec.id];
    const done = dg.hidden.every(h => dg.placed[h] || dg.revealed[h]);
    const nodeHTML = n => {
      const isHidden = !n.given && !dg.placed[n.id] && !dg.revealed[n.id];
      let inner;
      if (!isHidden) inner = '<b>' + P.esc(n.label) + '</b>';
      else if (dg.mode === 'type') {
        const v = dg.typed[n.id] || '';
        inner = '<input class="dia-input' + (dg.checked && v ? ' bad' : '') + '" data-type="' + n.id + '" value="' + P.esc(v) + '" placeholder="?" autocomplete="off" autocapitalize="sentences">';
      } else inner = '<span class="dia-slot' + (dg.sel ? ' ready' : '') + '">' + (dg.sel ? '＋' : '?') + '</span>';
      const cls = 'dia-node' + (n.nest ? ' nest' : '') + (dg.placed[n.id] ? ' ok' : '') + (dg.revealed[n.id] ? ' shown' : '') + (isHidden ? ' hole' : '') + (dg.flash === n.id ? ' wrong shake' : '');
      return '<div class="' + cls + '" data-node="' + n.id + '" style="left:' + n.x + '%;top:' + n.y + '%;width:' + n.w + '%;height:' + n.h + '%">' + inner +
        (n.sub ? '<small>' + P.esc(n.sub) + '</small>' : '') + '</div>';
    };
    let html = '<div class="row between"><a class="btn sm ghost" href="#/gry/schemat">‹ Schematy</a><span class="muted small">' +
      Object.keys(dg.placed).length + ' / ' + dg.hidden.length + ' · ' + dg.mistakes + ' bł.</span></div>' +
      '<h1 style="margin-top:10px">' + P.esc(d.title) + '</h1><p class="small muted"><a href="#/n/' + d.q + '">pyt. ' + d.q + ' · ' + P.esc(q.title) + '</a></p>' +
      '<div class="chips" style="margin-bottom:12px"><button class="chip' + (dg.mode === 'tiles' ? ' on' : '') + '" data-mode="tiles">🧩 Kafelki</button>' +
      '<button class="chip' + (dg.mode === 'type' ? ' on' : '') + '" data-mode="type">✏️ Wpisuję / piszę rysikiem</button></div>' +
      '<div class="dia-wrap"><div class="dia" id="dia" style="--sec:' + color + ';padding-top:' + (d.ratio * 100) + '%"><svg class="dia-edges"></svg>' +
      d.nodes.filter(n => n.nest).concat(d.nodes.filter(n => !n.nest)).map(nodeHTML).join('') + '</div></div>';
    if (!done) {
      if (dg.mode === 'tiles') {
        html += '<div class="kicker" style="margin-top:12px">' + (dg.sel ? 'Teraz stuknij miejsce na schemacie' : 'Wybierz kafelek') + '</div><div class="pool">' +
          dg.pool.filter(k => !dg.placed[k] && !dg.revealed[k]).map(k => '<button class="chip' + (dg.sel === k ? ' on' : '') + '" data-pool="' + k + '">' + P.esc(d.nodes.find(n => n.id === k).label) + '</button>').join('') + '</div>';
      } else {
        html += '<div class="row" style="margin-top:12px"><button class="btn primary" id="check">Sprawdź</button><button class="btn" id="giveup">Pokaż brakujące</button></div>' +
          (dg.checked ? '<p class="small muted">Czerwone pola są błędne – popraw albo stuknij „Pokaż brakujące”.</p>' : '<p class="small muted">Stuknij pole i pisz rysikiem (Scribble) albo na klawiaturze. Odmiana i drobne literówki są w porządku.</p>');
      }
    } else {
      const shown = Object.keys(dg.revealed).length;
      html += '<div class="card" style="margin-top:12px"><div class="stat">' + (dg.mistakes || shown ? (dg.mistakes ? dg.mistakes + ' ' + P.plural(dg.mistakes, 'błąd', 'błędy', 'błędów') : '') + (shown ? (dg.mistakes ? ' · ' : '') + shown + ' podpowiedzi' : '') : 'Bez błędu! 🎉') + '</div></div>' +
        '<div class="row"><button class="btn" id="again">↻ Jeszcze raz</button><a class="btn primary" href="#/gry/schemat/' + nextDiagram(id) + '">Następny ›</a><a class="btn" href="#/n/' + d.q + '">Notatka</a></div>';
    }
    P.setView(html, { keepScroll: !!dg.rendered });
    dg.rendered = true;
    dg.flash = null;
    drawEdges(d);

    $$('[data-mode]').forEach(b => b.addEventListener('click', () => { dg.mode = b.dataset.mode; dg.sel = null; viewDiagram(id); }));
    $$('[data-pool]').forEach(b => b.addEventListener('click', () => { dg.sel = dg.sel === b.dataset.pool ? null : b.dataset.pool; viewDiagram(id); }));
    $$('[data-node]').forEach(el => el.addEventListener('click', e => {
      if (dg.mode !== 'tiles' || !dg.sel || e.target.closest('input')) return;
      const nid = el.dataset.node;
      if (!dg.hidden.includes(nid) || dg.placed[nid] || dg.revealed[nid]) return;
      const want = d.nodes.find(n => n.id === nid).label, got = d.nodes.find(n => n.id === dg.sel).label;
      if (want === got) { dg.placed[nid] = true; dg.sel = null; }
      else { dg.mistakes++; dg.flash = nid; }
      finish(); viewDiagram(id);
    }));
    $$('[data-type]').forEach(inp => inp.addEventListener('input', () => { dg.typed[inp.dataset.type] = inp.value; }));
    const check = $('#check');
    if (check) check.addEventListener('click', () => {
      let wrong = 0;
      dg.hidden.forEach(h => {
        if (dg.placed[h] || dg.revealed[h]) return;
        const node = d.nodes.find(n => n.id === h);
        if (matches(dg.typed[h], node)) dg.placed[h] = true; else if ((dg.typed[h] || '').trim()) wrong++;
      });
      dg.mistakes += wrong;
      dg.checked = true;
      finish(); viewDiagram(id);
    });
    const giveup = $('#giveup');
    if (giveup) giveup.addEventListener('click', () => { dg.hidden.forEach(h => { if (!dg.placed[h]) dg.revealed[h] = true; }); finish(); viewDiagram(id); });
    const again = $('#again');
    if (again) again.addEventListener('click', () => { const m = dg.mode; dg = null; viewDiagram(id); dg.mode = m; viewDiagram(id); });

    function finish() {
      if (!dg.hidden.every(h => dg.placed[h] || dg.revealed[h]) || dg.saved) return;
      dg.saved = true;
      const g = P.S.games = P.S.games || {};
      g.diagrams = g.diagrams || {};
      const score = dg.mistakes + Object.keys(dg.revealed).length;
      if (g.diagrams[id] == null || score < g.diagrams[id]) g.diagrams[id] = score;
      P.save();
    }
  }
  function nextDiagram(id) {
    const G = window.GAMES;
    const list = XD.diagrams.filter(d => G.inScope(d.q));
    const i = list.findIndex(d => d.id === id);
    return (list[i + 1] || list[0] || XD.diagrams[0]).id;
  }

  // Strzałki rysowane w pikselach po ułożeniu węzłów
  function drawEdges(d) {
    const box = $('#dia');
    if (!box) return;
    const svg = $('svg', box);
    const B = box.getBoundingClientRect();
    const rect = id => {
      const r = $('[data-node="' + id + '"]', box).getBoundingClientRect();
      return { x: r.left - B.left, y: r.top - B.top, w: r.width, h: r.height, cx: r.left - B.left + r.width / 2, cy: r.top - B.top + r.height / 2 };
    };
    const clip = (r, tx, ty) => {
      const dx = tx - r.cx, dy = ty - r.cy;
      if (!dx && !dy) return [r.cx, r.cy];
      const s = Math.min(dx ? (r.w / 2 + 3) / Math.abs(dx) : Infinity, dy ? (r.h / 2 + 3) / Math.abs(dy) : Infinity);
      return [r.cx + dx * s, r.cy + dy * s];
    };
    let out = '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>';
    d.edges.forEach(([a, b, kind, label]) => {
      const A = rect(a), Bn = rect(b);
      const [x1, y1] = clip(A, Bn.cx, Bn.cy);
      const [x2, y2] = clip(Bn, A.cx, A.cy);
      const dash = kind === 'dash' || kind === 'both';
      out += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (dash ? ' stroke-dasharray="6 5"' : '') +
        ' marker-end="url(#ah)"' + (kind === 'both' ? ' marker-start="url(#ah)"' : '') + '/>';
      if (label) out += '<text x="' + ((x1 + x2) / 2 + 6) + '" y="' + ((y1 + y2) / 2 - 6) + '">' + api().esc(label) + '</text>';
    });
    svg.setAttribute('width', B.width);
    svg.setAttribute('height', B.height);
    svg.innerHTML = out;
  }
  window.addEventListener('resize', () => { if (dg && $('#dia')) drawEdges(XD.diagrams.find(x => x.id === dg.id)); });

  // ======================================================================
  // Porównaj X i Y
  // ======================================================================
  let cmp = null;
  function compareList() {
    const P = api(), G = window.GAMES;
    const g = P.S.games || {};
    const best = g.compare || {};
    const list = XD.comparisons.filter(c => c.qs.some(q => G.inScope(q)));
    P.setView(head('⚖️ Porównaj') +
      '<p class="muted">Napisz albo narysuj porównanie (rysikiem na kartce lub w polu tekstowym), potem odsłoń tabelę i zaznacz, co udało się ująć.</p>' +
      G.scopePicker(list.length + ' ' + P.plural(list.length, 'porównanie', 'porównania', 'porównań')) +
      (list.length ? '<div class="card qlist" style="padding:0">' + list.map(c =>
        '<a href="#/gry/porownaj/' + c.id + '" style="--sec:' + P.SECTION_COLORS[P.Q[c.qs[0]].sec.id] + '"><span class="qnum">' + c.qs[0] + '</span><span>' + P.esc(c.title) + '</span><span class="flags">' +
        (best[c.id] != null ? '<span class="muted small">' + best[c.id] + '%</span>' : '') + '</span></a>').join('') + '</div>'
        : '<div class="empty">W tym zakresie nie ma porównań. Poszerz zakres powyżej.</div>'));
    G.bindScope(() => compareList());
  }

  function viewCompare(id) {
    const P = api();
    const c = XD.comparisons.find(x => x.id === id);
    if (!c) { cmp = null; compareList(); return; }
    if (!cmp || cmp.id !== id) cmp = { id, mode: (cmp && cmp.mode) || 'ink', text: '', showAspects: true, revealed: false, got: {}, ink: null };
    const keep = !!cmp.rendered;
    cmp.rendered = true;
    const qlinks = c.qs.map(q => '<a href="#/n/' + q + '">pyt. ' + q + '</a>').join(', ');
    let html = '<div class="row between"><a class="btn sm ghost" href="#/gry/porownaj">‹ Porównania</a><span class="muted small">' + qlinks + '</span></div>' +
      '<h1 style="margin-top:10px">' + P.esc(c.title) + '</h1>';
    if (!cmp.revealed) {
      html += '<div class="card"><div class="kicker">Porównaj: ' + c.cols.map(P.esc).join(' · ') + '</div>' +
        '<label class="row small" style="margin:6px 0"><input type="checkbox" id="asp"' + (cmp.showAspects ? ' checked' : '') + ' style="width:20px;height:20px"> Pokaż, pod jakim kątem porównać</label>' +
        (cmp.showAspects ? '<div class="chips">' + c.aspects.map(a => '<span class="chip">' + P.esc(a[0]) + '</span>').join('') + '</div>' : '') + '</div>' +
        '<div class="chips" style="margin-bottom:10px"><button class="chip' + (cmp.mode === 'ink' ? ' on' : '') + '" data-mode="ink">✏️ Kartka (rysik)</button>' +
        '<button class="chip' + (cmp.mode === 'text' ? ' on' : '') + '" data-mode="text">⌨️ Tekst</button></div>' +
        (cmp.mode === 'ink' ? '<div id="ink"></div>' : '<textarea id="ctext" placeholder="Np. tabelka: aspekt – ' + P.esc(c.cols.join(' / ')) + '…">' + P.esc(cmp.text) + '</textarea>') +
        '<div class="row" style="margin-top:12px"><button class="btn primary" id="reveal">Odsłoń tabelę i sprawdź</button></div>';
    } else {
      const total = c.aspects.length;
      const got = Object.keys(cmp.got).length;
      html += (cmp.mode === 'ink' && cmp.ink ? '<div class="kicker">Twoja kartka</div><img class="ink-preview" src="' + cmp.ink + '" alt="Twoje porównanie">' : '') +
        (cmp.mode === 'text' && cmp.text.trim() ? '<div class="kicker">Twoja odpowiedź</div><div class="my-answer" style="margin-bottom:14px">' + P.esc(cmp.text) + '</div>' : '') +
        '<div class="kicker">Stuknij wiersze, które udało się ująć</div>' +
        '<div class="tbl cmp"><table><thead><tr><th></th><th>Aspekt</th>' + c.cols.map(x => '<th>' + P.esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
        c.aspects.map((a, i) => '<tr class="' + (cmp.got[i] ? 'got' : '') + '" data-row="' + i + '"><td class="tick">' + (cmp.got[i] ? '✓' : '○') + '</td><td><b>' + P.esc(a[0]) + '</b></td>' +
          a.slice(1).map(v => '<td>' + P.esc(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
        '<div class="row between" style="margin-top:12px"><b>' + got + ' / ' + total + ' (' + Math.round(100 * got / total) + '%)</b>' +
        '<div class="row"><button class="btn" id="again">↻ Jeszcze raz</button><button class="btn primary" id="savecmp">Zapisz wynik</button></div></div>';
    }
    P.setView(html, { keepScroll: keep });
    $$('[data-mode]').forEach(b => b.addEventListener('click', () => { cmp.mode = b.dataset.mode; viewCompare(id); }));
    const asp = $('#asp');
    if (asp) asp.addEventListener('change', () => { cmp.showAspects = asp.checked; viewCompare(id); });
    const ta = $('#ctext');
    if (ta) ta.addEventListener('input', () => { cmp.text = ta.value; });
    let pad = null;
    const inkEl = $('#ink');
    if (inkEl) pad = mountInk(inkEl, { height: 420, data: cmp.ink, hint: 'Rysik: nacisk = grubość · dłoń nie rysuje', onChange: d => { cmp.ink = d; } });
    const rev = $('#reveal');
    if (rev) rev.addEventListener('click', () => { if (pad) cmp.ink = pad.exportPNG(); cmp.revealed = true; window.scrollTo(0, 0); viewCompare(id); });
    $$('[data-row]').forEach(tr => tr.addEventListener('click', () => {
      const i = tr.dataset.row;
      if (cmp.got[i]) delete cmp.got[i]; else cmp.got[i] = true;
      viewCompare(id);
    }));
    const again = $('#again');
    if (again) again.addEventListener('click', () => { const m = cmp.mode; cmp = { id, mode: m, text: '', showAspects: true, revealed: false, got: {}, ink: null, rendered: true }; viewCompare(id); });
    const sv = $('#savecmp');
    if (sv) sv.addEventListener('click', () => {
      const pct = Math.round(100 * Object.keys(cmp.got).length / c.aspects.length);
      const g = P.S.games = P.S.games || {};
      g.compare = g.compare || {};
      if (g.compare[id] == null || pct > g.compare[id]) g.compare[id] = pct;
      P.save();
      P.toast('Zapisano: ' + pct + '%');
      location.hash = '#/gry/porownaj';
    });
  }

  window.EXTRAS = {
    mountInk,
    diagram: id => (id ? viewDiagram(id) : (dg = null, diagramList())),
    compare: id => (id ? viewCompare(id) : (cmp = null, compareList())),
    diagramsFor: q => XD.diagrams.filter(d => d.q === q),
    comparisonsFor: q => XD.comparisons.filter(c => c.qs.includes(q))
  };
})();
