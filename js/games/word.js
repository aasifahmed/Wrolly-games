/* Daily Word Challenge
   Solo: a daily 5-letter word (progress saved) or Practice, a run of words at the chosen level.
   Multiplayer: several rounds, everyone solves the same secret word on their own board, taking turns on one device.
   Levels: Easy = 4 letters, Medium = 5 letters, Hard = 6 letters, Expert = 5 letters with only 4 tries. */
(function () {
  const { h } = Core;

  function loadData() {
    if (window.WORDS) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/words.js'; s.onload = res; s.onerror = () => rej(); document.head.append(s); });
  }

  Core.css('word', `
    .wd{display:grid;gap:14px;justify-items:center}
    .wb{display:grid;gap:6px}
    .wr{display:grid;gap:6px}
    .wt{width:clamp(40px,12vw,60px);aspect-ratio:1;border:3px solid var(--line);border-radius:12px;display:grid;place-items:center;font-family:var(--head);font-weight:700;font-size:clamp(1.4rem,5.5vw,2rem);text-transform:uppercase;background:var(--paper);transition:transform .1s}
    .wt.f{border-color:var(--ink);transform:scale(1.06)}
    .wt.g,.wk.g{background:var(--mint);color:#1B1740}
    .wt.y,.wk.y{background:var(--sun);color:#1B1740}
    .wt.x,.wk.x{background:#8D88B8;color:#fff}
    .wt.rev{animation:flip .5s both;animation-delay:calc(var(--i)*.28s)}
    @keyframes flip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}
    .kb{display:grid;gap:6px;width:100%;max-width:520px}
    .kr{display:flex;gap:5px;justify-content:center}
    .wk{flex:1;max-width:46px;height:50px;border-radius:10px;border:2.5px solid var(--line);background:var(--card);font-family:var(--head);font-weight:500;text-transform:uppercase;padding:0}
    .wk.wide{max-width:70px;flex:1.6;font-size:.85rem}
    .pass{display:grid;gap:14px;justify-items:center;padding:40px 10px;text-align:center}
  `);

  const KB = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'];
  const EMO = { g: '🟩', y: '🟨', x: '⬛' };
  const LV = { easy: { len: 4, tries: 6, rounds: 3 }, medium: { len: 5, tries: 6, rounds: 4 }, hard: { len: 6, tries: 6, rounds: 5 }, expert: { len: 5, tries: 4, rounds: 6 } };

  function judge(g, a) {
    const n = a.length, r = Array(n).fill('x'), left = {};
    for (let i = 0; i < n; i++) { if (g[i] === a[i]) r[i] = 'g'; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < n; i++) if (r[i] !== 'g' && left[g[i]] > 0) { r[i] = 'y'; left[g[i]]--; }
    return r;
  }

  function init(ctx) {
    const root = ctx.root, multi = ctx.multi, today = Core.dayKey();
    let mode = multi ? 'duel' : Core.store.get('word:mode', 'daily');
    let cfg, rounds, round = 0, answer, P, msgEl, boardEl, kbEl, typed = '', locked = false, firstSolver = -1, over = false, used = new Set(), solved = 0;

    function config() {
      const l = LV[ctx.level] || LV.medium;
      if (mode === 'daily') { cfg = { len: 5, tries: 6 }; rounds = 1; }
      else { cfg = { len: l.len, tries: l.tries }; rounds = multi ? l.rounds : l.rounds + 2; }
    }
    const pool = () => WORDS[cfg.len].a;

    function newGame() { config(); round = 0; solved = 0; used = new Set(); ctx.players.forEach(p => { p.score = 0; }); startRound(); }

    function startRound() {
      if (mode === 'daily') answer = pool()[Core.hash('word-' + today) % pool().length];
      else { let w; do { w = Core.pick(pool()); } while (used.has(w) && used.size < pool().length); used.add(w); answer = w; }
      P = ctx.players.map(() => ({ rows: [], keys: {}, done: false, solved: false }));
      typed = ''; locked = false; firstSolver = -1; over = false;
      ctx.setTurn(multi ? round % ctx.players.length : 0);
      if (mode === 'daily') { const saved = Core.store.get('word:' + today, null); if (saved) saved.rows.forEach(g => apply(0, g)); }
      if (multi && round > 0) return passScreen();
      draw();
    }

    function apply(pi, guess) {
      const p = P[pi], res = judge(guess, answer);
      p.rows.push({ g: guess, r: res });
      res.forEach((c, i) => { const l = guess[i], old = p.keys[l]; if (!old || c === 'g' || (c === 'y' && old === 'x')) p.keys[l] = c; });
      if (guess === answer) p.done = p.solved = true; else if (p.rows.length >= cfg.tries) p.done = true;
    }

    function draw(revealRow = -1) {
      root.innerHTML = '';
      const p = P[ctx.turn];
      boardEl = h('div', { class: 'wb', role: 'grid', 'aria-label': 'Guess board' });
      for (let r = 0; r < cfg.tries; r++) {
        const row = h('div', { class: 'wr', role: 'row', style: { gridTemplateColumns: 'repeat(' + cfg.len + ',1fr)' } });
        for (let c = 0; c < cfg.len; c++) {
          let cls = 'wt', ch = '';
          if (r < p.rows.length) { cls += ' ' + p.rows[r].r[c]; ch = p.rows[r].g[c]; if (r === revealRow) cls += ' rev'; }
          else if (r === p.rows.length && !p.done && typed[c]) { cls += ' f'; ch = typed[c]; }
          row.append(h('div', { class: cls, style: { '--i': c }, role: 'gridcell' }, ch));
        }
        boardEl.append(row);
      }
      msgEl = h('div', { class: 'msg', 'aria-live': 'polite' });
      kbEl = h('div', { class: 'kb' }, KB.map(line => h('div', { class: 'kr' }, [...line].map(k => {
        const wide = k === '+' || k === '-', name = k === '+' ? 'Enter' : k === '-' ? 'Backspace' : k;
        return h('button', { class: 'wk' + (wide ? ' wide' : '') + (p.keys[k] ? ' ' + p.keys[k] : ''), 'aria-label': name, onclick: () => key(name) }, k === '+' ? 'Enter' : k === '-' ? '⌫' : k);
      }))));
      const top = [];
      if (!multi) top.push(h('div', { class: 'seg' }, [['daily', 'Daily word'], ['practice', 'Practice']].map(([m, t]) =>
        h('button', { 'aria-pressed': mode === m, onclick: () => { mode = m; Core.store.set('word:mode', m); newGame(); } }, t))));
      const info = mode === 'daily' ? 'Daily word: always 5 letters, 6 tries' : cfg.len + ' letters, ' + cfg.tries + ' tries' + (rounds > 1 ? '. Word ' + (round + 1) + ' of ' + rounds : '');
      root.append(h('div', { class: 'wd' }, top, h('div', { class: 'muted center' }, info + (multi ? '. ' + ctx.player.name + ', your turn.' : '')), boardEl, msgEl,
        over ? nextButton() : kbEl));
      if (mode === 'daily' && p.done) msg(p.solved ? 'You already solved today\'s word. Come back tomorrow, or try Practice!' : 'Today\'s word was ' + answer.toUpperCase() + '. Try Practice or come back tomorrow!', p.solved ? 'good' : 'bad');
      if (over && mode !== 'daily') msg('The word was ' + answer.toUpperCase(), P[ctx.turn].solved ? 'good' : 'bad');
    }

    function nextButton() {
      const last = round + 1 >= rounds;
      return h('button', { class: 'btn mint', onclick: () => { if (last) return end(); round++; startRound(); } }, last ? 'See results' : 'Next word');
    }
    function end() {
      if (!multi) { const s = ctx.players[0].score, nb = ctx.best(s + ' pts (' + (ctx.level) + ')', s); return ctx.finish({ title: solved + ' of ' + rounds + ' solved', body: 'You scored ' + s + ' points.' + (nb ? ' New best!' : ''), unit: 'pts' }); }
      ctx.finish({ unit: 'pts', body: 'Played ' + rounds + ' words.' });
    }

    function msg(t, cls) { if (msgEl) { msgEl.textContent = t; msgEl.className = 'msg ' + (cls || ''); } }

    function key(k) {
      if (locked || over) return;
      const p = P[ctx.turn]; if (p.done) return;
      if (k === 'Enter') return submit();
      if (k === 'Backspace') typed = typed.slice(0, -1);
      else if (/^[a-z]$/.test(k) && typed.length < cfg.len) typed += k;
      else return;
      Core.sfx.tick(); draw();
    }

    async function submit() {
      const row = boardEl.children[P[ctx.turn].rows.length];
      if (typed.length < cfg.len) { row.classList.add('shake'); msg('Need ' + cfg.len + ' letters', 'bad'); return; }
      if (!WORDS[cfg.len].v.has(typed)) { row.classList.add('shake'); Core.sfx.bad(); msg('Not in the word list', 'bad'); return; }
      const pi = ctx.turn, p = P[pi], guess = typed; typed = ''; locked = true;
      apply(pi, guess); draw(p.rows.length - 1);
      if (mode === 'daily') Core.store.set('word:' + today, { rows: p.rows.map(r => r.g) });
      await Core.sleep(300 * cfg.len + 400); locked = false;
      const pts = cfg.tries + 1 - p.rows.length;
      if (p.solved) { Core.sfx.ok(); if (firstSolver < 0) firstSolver = pi; ctx.addScore(pi, pts + (firstSolver === pi && multi ? 2 : 0)); if (!multi) solved++; }
      else if (p.done) Core.sfx.bad();
      if (!multi) {
        if (p.done) {
          if (mode === 'daily') {
            ctx.markDaily(); if (p.solved) ctx.best(p.rows.length + ' guesses', p.rows.length, false); draw();
            const share = 'Pocket Arcade Daily Word ' + today + ' ' + (p.solved ? p.rows.length : 'X') + '/6\n' + p.rows.map(r => r.r.map(c => EMO[c]).join('')).join('\n');
            return ctx.finish({ win: p.solved, next: false, title: p.solved ? 'Solved in ' + p.rows.length + '!' : 'So close!', body: h('div', { class: 'stack' }, h('p', { style: { margin: 0 } }, 'The word was ', h('b', null, answer.toUpperCase()), '.'),
              h('button', { class: 'btn sun sm', onclick: e => { navigator.clipboard && navigator.clipboard.writeText(share).then(() => { e.target.textContent = 'Copied!'; }); } }, 'Copy result')) });
          }
          over = true;
        }
        return draw();
      }
      if (P.every(x => x.done)) { over = true; return draw(); }
      let n = ctx.turn; do { n = (n + 1) % P.length; } while (P[n].done);
      ctx.setTurn(n); passScreen();
    }

    function passScreen() {
      root.innerHTML = '';
      root.append(h('div', { class: 'pass' }, h('div', { class: 'muted' }, 'Word ' + (round + 1) + ' of ' + rounds), h('div', { class: 'big' }, 'Pass the device to ' + ctx.player.name), h('p', { class: 'muted' }, 'Look away, everyone else!'),
        h('button', { class: 'btn mint', onclick: () => draw() }, 'I am ready')));
    }

    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal')) return;
      if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k === 'Enter' || k === 'Backspace' || /^[a-z]$/.test(k)) { e.preventDefault(); key(k); }
    };
    document.addEventListener('keydown', onKey);
    newGame();
    return () => document.removeEventListener('keydown', onKey);
  }

  Core.register({
    id: 'word',
    reset() { Core.store.set('word:' + Core.dayKey(), null); },
    mount(ctx) {
      let dead = false, clean = () => { };
      ctx.root.append(h('p', { class: 'muted' }, 'Loading words...'));
      loadData().then(() => { if (!dead) { ctx.root.innerHTML = ''; clean = init(ctx); } }).catch(() => { ctx.root.textContent = 'Could not load the word list.'; });
      return () => { dead = true; clean(); };
    }
  });
})();
