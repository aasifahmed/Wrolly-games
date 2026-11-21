/* Tile Merge
   Slide tiles with the arrow keys, WASD or a swipe. Equal tiles merge into one. Reach the goal tile to win.
   Levels: Easy = 5x5 board, goal 512, 5 undos. Medium = 4x4, goal 1024, 3 undos. Hard = 4x4, goal 2048, 1 undo.
   Expert = tiny 3x3 board, goal 256, no undo.
   Multiplayer: each player gets a timed turn on a fresh board, the highest score wins (Hard and Expert play two rounds). */
(function () {
  const { h } = Core;

  Core.css('merge', `
    .mg{display:grid;gap:12px;justify-items:center}
    .mg .info{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;font-weight:800}
    .tb{--n:4;container-type:inline-size;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:clamp(5px,1.6vw,10px);width:100%;max-width:440px;padding:clamp(6px,1.8vw,10px);background:var(--ink);border-radius:20px;touch-action:none;user-select:none;-webkit-user-select:none;border:3px solid var(--line)}
    :root[data-theme="dark"] .tb{background:#0A081C}
    .tl{aspect-ratio:1;border-radius:12px;display:grid;place-items:center;font-family:var(--head);font-weight:700;color:#1B1740;background:rgba(255,255,255,.12);font-size:clamp(1rem,6vw,1.8rem);font-size:calc(100cqw / var(--n) * .38)}
    .tl.d3{font-size:calc(100cqw / var(--n) * .3)}.tl.d4{font-size:calc(100cqw / var(--n) * .24)}
    .tl.new{animation:pop .18s}.tl.mrg{animation:pulse .2s}
    @keyframes pulse{50%{transform:scale(1.14)}}
    .arrows{display:grid;grid-template-columns:repeat(3,52px);gap:6px}
    .arrows button{height:46px;border-radius:12px;border:3px solid var(--line);background:var(--card);padding:0;font-size:1.2rem;box-shadow:2px 2px 0 var(--line)}
    .arrows .u{grid-column:2}.arrows .l{grid-column:1;grid-row:2}.arrows .d{grid-column:2;grid-row:2}.arrows .r{grid-column:3;grid-row:2}
    @media(min-width:900px) and (hover:hover){.arrows{display:none}}
  `);

  const LV = {
    easy: { n: 5, goal: 512, four: .1, undo: 5, time: 120, rounds: 1 },
    medium: { n: 4, goal: 1024, four: .1, undo: 3, time: 100, rounds: 1 },
    hard: { n: 4, goal: 2048, four: .15, undo: 1, time: 90, rounds: 2 },
    expert: { n: 3, goal: 256, four: .2, undo: 0, time: 75, rounds: 2 }
  };
  const COL = { 2: '#DFF6EF', 4: '#BDEFE0', 8: '#FFE08A', 16: '#FFC857', 32: '#FF9F5A', 64: '#FF7A6B', 128: '#FF5FA2', 256: '#C77DFF', 512: '#8B6CFF', 1024: '#4D8DFF', 2048: '#2DC4F5', 4096: '#2ED9A3' };

  Core.register({
    id: 'merge',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, multi = ctx.multi, N = L.n, TOTAL = multi ? ctx.players.length * L.rounds : 1;
      let grid, score, undos, hist, fresh, merged, over, turn = 0, left = 0, tm = 0;
      const board = h('div', { class: 'tb', style: { '--n': N }, role: 'application', 'aria-label': 'Tile board' });
      const scoreEl = h('span', { class: 'stat' }), bestEl = h('span', { class: 'muted' }), timeEl = h('span', { class: 'stat' }), whoEl = h('span', null), undoBtn = h('button', { class: 'btn alt sm', onclick: undo }, 'Undo');

      const empty = () => Array.from({ length: N }, () => Array(N).fill(0));
      function addTile() { const e = []; grid.forEach((r, y) => r.forEach((v, x) => { if (!v) e.push([x, y]); })); if (!e.length) return; const [x, y] = Core.pick(e); grid[y][x] = Math.random() < L.four ? 4 : 2; fresh = x + ',' + y; }
      function reset() { grid = empty(); score = 0; undos = L.undo; hist = []; fresh = ''; merged = new Set(); over = false; addTile(); addTile(); render(); }

      function slide(line) {
        const a = line.filter(Boolean), out = [], mg = []; let gain = 0;
        for (let i = 0; i < a.length; i++) { if (a[i] === a[i + 1]) { out.push(a[i] * 2); mg.push(out.length - 1); gain += a[i] * 2; i++; } else out.push(a[i]); }
        while (out.length < N) out.push(0);
        return { out, mg, gain };
      }
      function move(dx, dy) {
        if (over) return;
        const snap = { g: grid.map(r => r.slice()), s: score };
        let moved = false, gain = 0; merged = new Set(); const ng = empty();
        for (let k = 0; k < N; k++) {
          const cells = []; for (let i = 0; i < N; i++) { const x = dx ? (dx > 0 ? N - 1 - i : i) : k, y = dy ? (dy > 0 ? N - 1 - i : i) : k; cells.push([x, y]); }
          const r = slide(cells.map(([x, y]) => grid[y][x])); gain += r.gain;
          r.out.forEach((v, i) => { const [x, y] = cells[i]; ng[y][x] = v; if (v !== grid[y][x]) moved = true; });
          r.mg.forEach(i => merged.add(cells[i][0] + ',' + cells[i][1]));
        }
        if (!moved) return;
        hist.push(snap); if (hist.length > 10) hist.shift();
        grid = ng; score += gain; addTile(); gain ? Core.sfx.tick() : Core.sfx.tone(300, .03, 'triangle', .05);
        render();
        const top = Math.max(...grid.flat());
        if (top >= L.goal) return end(true);
        if (!canMove()) end(false);
      }
      function canMove() { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (!grid[y][x]) return true; if (x + 1 < N && grid[y][x] === grid[y][x + 1]) return true; if (y + 1 < N && grid[y][x] === grid[y + 1][x]) return true; } return false; }
      function undo() { if (over || !hist.length || undos <= 0) return; const s = hist.pop(); grid = s.g; score = s.s; undos--; merged = new Set(); fresh = ''; Core.sfx.click(); render(); }

      function render() {
        board.innerHTML = '';
        grid.forEach((row, y) => row.forEach((v, x) => { const k = x + ',' + y, d = String(v).length; board.append(h('div', { class: 'tl' + (v ? '' : ' e') + (d >= 4 ? ' d4' : d === 3 ? ' d3' : '') + (k === fresh ? ' new' : merged.has(k) ? ' mrg' : ''), style: v ? { background: COL[v] || '#1B1740', color: v >= 256 ? '#fff' : '#1B1740' } : {} }, v || '')); }));
        scoreEl.textContent = 'Score: ' + score;
        const b = Core.store.get('best:merge', null); bestEl.textContent = !multi && b ? 'Best: ' + b.text : 'Goal: ' + L.goal;
        undoBtn.textContent = 'Undo (' + undos + ')'; undoBtn.hidden = !L.undo || multi; undoBtn.disabled = !hist.length || undos <= 0;
        whoEl.textContent = multi ? ctx.players[turn % ctx.players.length].name + ' (turn ' + (turn + 1) + ' of ' + TOTAL + ')' : '';
      }

      function end(won) {
        if (over) return; over = true; clearInterval(tm); won ? Core.sfx.win() : Core.sfx.bad();
        const top = Math.max(...grid.flat());
        setTimeout(() => {
          if (!multi) { const nb = ctx.best(score + ' pts (' + ctx.level + ')', score); return ctx.finish({ win: won, next: won, title: won ? 'You made ' + top + '!' : 'No more moves', body: 'Score ' + score + ', top tile ' + top + '.' + (nb ? ' New best!' : '') }); }
          ctx.addScore(turn % ctx.players.length, score); turn++;
          if (turn >= TOTAL) return ctx.finish({ unit: 'pts' });
          pass();
        }, 700);
      }

      function pass() {
        const p = ctx.players[turn % ctx.players.length]; ctx.setTurn(turn % ctx.players.length);
        root.innerHTML = '';
        root.append(h('div', { class: 'stack center', style: { padding: '40px 0' } }, h('div', { class: 'muted' }, 'Turn ' + (turn + 1) + ' of ' + TOTAL + '. You have ' + L.time + ' seconds.'), h('div', { class: 'big' }, 'Pass the device to ' + p.name), h('div', { class: 'row c' }, h('button', { class: 'btn mint', onclick: build }, 'I am ready'))));
      }

      const keys = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
      const onKey = e => { if (document.querySelector('.modal') || e.ctrlKey || e.metaKey) return; const d = keys[e.key] || keys[(e.key || '').toLowerCase()]; if (d) { e.preventDefault(); move(d[0], d[1]); } else if ((e.key === 'z' || e.key === 'Z') && !multi) undo(); };
      document.addEventListener('keydown', onKey);
      let sx = 0, sy = 0;
      board.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
      board.addEventListener('pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; Math.abs(dx) > Math.abs(dy) ? move(Math.sign(dx), 0) : move(0, Math.sign(dy)); });
      const ar = (c, t, d) => h('button', { class: c, 'aria-label': t, onclick: () => move(d[0], d[1]) }, t === 'Up' ? '▲' : t === 'Down' ? '▼' : t === 'Left' ? '◀' : '▶');

      function build() {
        root.innerHTML = '';
        root.append(h('div', { class: 'mg' }, h('div', { class: 'info' }, scoreEl, bestEl, multi ? timeEl : null, undoBtn), multi ? h('div', null, whoEl) : null, board,
          h('div', { class: 'arrows' }, ar('u', 'Up', [0, -1]), ar('l', 'Left', [-1, 0]), ar('d', 'Down', [0, 1]), ar('r', 'Right', [1, 0])),
          h('p', { class: 'muted center', style: { margin: 0 } }, 'Slide with arrows, WASD or a swipe. Merge equal tiles to reach ' + L.goal + '.' + (multi ? ' Score as much as you can before time runs out.' : ''))));
        if (multi) ctx.setTurn(turn % ctx.players.length);
        reset();
        if (multi) { left = L.time; timeEl.textContent = left + 's'; clearInterval(tm); tm = setInterval(() => { left--; timeEl.textContent = left + 's'; if (left <= 5) Core.sfx.tick(); if (left <= 0) end(false); }, 1000); }
      }
      build();
      return () => { document.removeEventListener('keydown', onKey); clearInterval(tm); };
    }
  });
})();
