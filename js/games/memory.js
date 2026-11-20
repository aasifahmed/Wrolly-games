/* Memory Challenge
   Two modes: Card match (flip pairs) and Sequence (repeat the growing pattern).
   Multiplayer card match: pairs score points, a match keeps your turn.
   Multiplayer sequence: everyone repeats the same growing pattern; a mistake knocks you out. */
(function () {
  const { h } = Core;

  Core.css('memory', `
    .mm{display:grid;gap:16px}
    .mm .row{justify-content:space-between}
    .cards{display:grid;gap:clamp(6px,1.6vw,12px);margin:0 auto;width:100%}
    .cd{perspective:700px;aspect-ratio:1;border:0;background:none;padding:0}
    .cd .in{position:relative;width:100%;height:100%;transition:transform .35s;transform-style:preserve-3d;display:block}
    .cd.up .in{transform:rotateY(180deg)}
    .cd .f,.cd .b{position:absolute;inset:0;display:grid;place-items:center;border-radius:14px;border:3px solid var(--line);backface-visibility:hidden;-webkit-backface-visibility:hidden}
    .cd .b{background:var(--violet);color:#fff;font-family:var(--head);font-size:1.6rem;box-shadow:3px 3px 0 var(--line)}
    .cd .f{transform:rotateY(180deg);background:var(--paper);font-size:clamp(1.5rem,7vw,2.8rem)}
    .cd.ok .f{background:var(--mint)}
    .pads{display:grid;gap:12px;width:min(100%,400px);margin:0 auto}
    .pad{aspect-ratio:1;border-radius:24px;border:4px solid var(--line);box-shadow:var(--shadow);background:var(--c);opacity:.55;transition:opacity .08s,transform .08s}
    .pad.lit{opacity:1;transform:scale(1.04);filter:brightness(1.2)}
    .pad:active{opacity:1}
  `);

  const SYM = ['🐶', '🐱', '🦊', '🐼', '🐸', '🦄', '🐙', '🦋', '🍎', '🍕', '🍩', '🍒', '⚽', '🎸', '🚀', '🌈', '🌻', '🎈', '🍦', '🐢', '🦉', '🍉', '⭐', '🎲'];
  /* levels: [columns, pairs] for card match; [pads, goal length, start speed ms] for sequence */
  const DIFF = { easy: [4, 6, 'Easy'], medium: [4, 8, 'Medium'], hard: [6, 12, 'Hard'], expert: [6, 18, 'Expert'] };
  const SEQ = { easy: [4, 8, 620], medium: [4, 10, 480], hard: [6, 12, 420], expert: [9, 15, 360] };
  const PADCOL = ['#2ED9A3', '#FF4D5E', '#FFCF33', '#2DC4F5', '#7B5CFF', '#FF8A3D', '#FF5FA2', '#8BD66B', '#5B8CFF'];
  const PADHZ = [330, 392, 440, 523, 587, 659, 784, 880, 988];

  Core.register({
    id: 'memory',
    mount(ctx) {
      const root = ctx.root; let view = Core.store.get('mem:view', 'cards'); const diff = DIFF[ctx.level] ? ctx.level : 'easy';
      let cleanup = () => { }, alive = true;
      const timers = new Set();
      const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };

      function shell(body) {
        root.innerHTML = '';
        const top = h('div', { class: 'row' },
          h('div', { class: 'seg' }, [['cards', 'Card match'], ['seq', 'Sequence']].map(([v, t]) => h('button', { 'aria-pressed': view === v, onclick: () => { view = v; Core.store.set('mem:view', v); ctx.players.forEach(p => p.score = 0); ctx.setTurn(0); go(); } }, t))),
          h('span', { class: 'muted' }, 'Level: ' + DIFF[diff][2]));
        root.append(h('div', { class: 'mm' }, top, body));
      }

      function go() { cleanup(); timers.forEach(clearTimeout); timers.clear(); cleanup = view === 'cards' ? cards() : seq(); }

      /* ---------- card match ---------- */
      function cards() {
        const [cols, pairs] = DIFF[diff], deck = Core.shuffle([...SYM.slice(0, 24)].sort(() => Math.random() - .5).slice(0, pairs).flatMap(s => [s, s]));
        let open = [], lock = false, moves = 0, found = 0, t0 = 0, tm = 0;
        const info = h('div', { class: 'stat', 'aria-live': 'off' }), msg = h('div', { class: 'msg', 'aria-live': 'polite' });
        const grid = h('div', { class: 'cards', style: { gridTemplateColumns: 'repeat(' + cols + ',1fr)', maxWidth: cols === 6 ? (pairs > 12 ? '620px' : '640px') : '520px' } });
        const els = deck.map((s, i) => { const b = h('button', { class: 'cd', 'aria-label': 'Card ' + (i + 1), onclick: () => flip(i) }, h('span', { class: 'in' }, h('span', { class: 'b', 'aria-hidden': 'true' }, '?'), h('span', { class: 'f' }, Core.emo(s)))); grid.append(b); return b; });
        function upd() { const sec = t0 ? Math.floor((Date.now() - t0) / 1000) : 0; info.textContent = ctx.multi ? 'Pairs left: ' + (pairs - found) : 'Moves: ' + moves + '   Time: ' + sec + 's'; }
        function flip(i) {
          if (lock || open.includes(i) || els[i].classList.contains('ok')) return;
          if (!t0) { t0 = Date.now(); tm = setInterval(upd, 1000); }
          Core.sfx.tone(500 + i * 8, .06, 'triangle', .1); els[i].classList.add('up'); open.push(i);
          if (open.length < 2) return;
          moves++; lock = true; const [a, b] = open;
          if (deck[a] === deck[b]) {
            later(() => { els[a].classList.add('ok'); els[b].classList.add('ok'); Core.sfx.ok(); found++; open = []; lock = false; if (ctx.multi) ctx.addScore(ctx.turn, 1); upd();
              if (found === pairs) { clearInterval(tm); const sec = Math.round((Date.now() - t0) / 1000);
                if (!ctx.multi) { const eff = Math.round(pairs / moves * 100), nb = ctx.best(DIFF[diff][2] + ': ' + moves + ' moves', eff); ctx.finish({ title: 'All pairs found!', body: moves + ' moves in ' + sec + ' seconds.' + (nb ? ' New best!' : '') }); }
                else ctx.finish({ unit: 'pairs' }); } }, 350);
          } else later(() => { els[a].classList.remove('up'); els[b].classList.remove('up'); open = []; lock = false; Core.sfx.bad(); if (ctx.multi) { const p = ctx.nextTurn(); msg.textContent = p.name + ', your turn'; } upd(); }, 900);
          upd();
        }
        shell(h('div', { class: 'mm' }, h('div', { class: 'row' }, info, h('span', { class: 'muted' }, ctx.multi ? 'Match a pair to keep your turn' : 'Find every pair in as few moves as you can')), grid, msg));
        if (ctx.multi) msg.textContent = ctx.player.name + ', your turn';
        upd(); return () => clearInterval(tm);
      }

      /* ---------- sequence ---------- */
      function seq() {
        const [NP, GOAL, SPD] = SEQ[diff], cols = NP === 4 ? 2 : 3;
        let s = [], pos = 0, accept = false, out = new Set(), level = 0;
        const msg = h('div', { class: 'msg big', style: { fontSize: '1.4rem' }, 'aria-live': 'polite' }), lvl = h('div', { class: 'stat' });
        const pads = Array.from({ length: NP }, (_, i) => h('button', { class: 'pad', style: { '--c': PADCOL[i] }, 'aria-label': 'Pad ' + (i + 1), onpointerdown: () => press(i) }));
        function flash(i, ms = 300) { pads[i].classList.add('lit'); Core.sfx.tone(PADHZ[i], ms / 1000, 'triangle', .25); later(() => pads[i].classList.remove('lit'), ms); }
        function who() { return ctx.multi ? ctx.player.name : 'You'; }
        function show() {
          accept = false; pos = 0; msg.textContent = 'Watch...'; msg.className = 'msg big';
          const speed = Math.max(220, SPD - s.length * 18);
          s.forEach((p, k) => later(() => flash(p, speed * .7), 700 + k * speed));
          later(() => { accept = true; msg.textContent = who() + ': your turn!'; }, 700 + s.length * speed);
        }
        function addStep() { s.push(Math.floor(Math.random() * NP)); level = s.length; lvl.textContent = 'Length: ' + level + ' of ' + GOAL; show(); }
        function press(i) {
          if (!accept) return; flash(i, 200);
          if (s[pos] !== i) { accept = false; Core.sfx.bad(); msg.textContent = 'Oops! Wrong pad'; msg.className = 'msg big bad';
            if (!ctx.multi) { const r = s.length - 1, nb = ctx.best('Length ' + r + ' (' + DIFF[diff][2] + ')', r); return later(() => ctx.finish({ win: r >= 8, title: 'You remembered ' + r + '!', body: nb ? 'New best!' : 'Reach ' + GOAL + ' to master this level.' }), 900); }
            out.add(ctx.turn); const left = ctx.players.map((_, k) => k).filter(k => !out.has(k));
            if (left.length <= 1) return later(() => ctx.finish({ unit: 'steps', body: left.length ? ctx.players[left[0]].name + ' is the last one standing.' : '' }), 900);
            return later(() => { nextAlive(); show(); }, 1200);
          }
          if (++pos === s.length) {
            accept = false; Core.sfx.ok(); msg.textContent = 'Perfect!'; msg.className = 'msg big good';
            if (ctx.multi) { ctx.addScore(ctx.turn, 1); }
            if (s.length >= GOAL) { if (!ctx.multi) { ctx.best('Mastered ' + DIFF[diff][2], GOAL); return later(() => ctx.finish({ title: 'Level mastered!', body: 'You repeated a ' + GOAL + ' step sequence.' }), 800); } return later(() => ctx.finish({ unit: 'steps', body: 'Everyone reached the goal length of ' + GOAL + '.' }), 800); }
            if (ctx.multi) nextAlive();
            later(addStep, 900);
          }
        }
        function nextAlive() { let n = ctx.turn; do { n = (n + 1) % ctx.players.length; } while (out.has(n)); ctx.setTurn(n); }
        shell(h('div', { class: 'mm' }, h('div', { class: 'row' }, lvl, h('span', { class: 'muted' }, ctx.multi ? 'Repeat the pattern. One slip and you are out.' : 'Repeat the pattern. It grows by one each round.')), h('div', { class: 'pads', style: { gridTemplateColumns: 'repeat(' + cols + ',1fr)' } }, pads), msg));
        later(addStep, 500); return () => { };
      }

      go();
      return () => { alive = false; timers.forEach(clearTimeout); cleanup(); };
    }
  });
})();
