/* Snake Rush
   Eat apples, grow longer, do not crash. Controls: arrow keys or WASD, swipe on the board, or the on-screen pad. Space pauses.
   Levels: Easy = small board where the walls wrap around, Medium = solid walls and golden bonus apples,
   Hard = rocks on the board, Expert = a big fast board with lots of rocks.
   Multiplayer: players take turns (one life each) and the most apples wins. Hard and Expert play two rounds. */
(function () {
  const { h } = Core;

  Core.css('snake', `
    .sn{display:grid;gap:12px;justify-items:center}
    .sn canvas{width:100%;max-width:500px;aspect-ratio:1;border-radius:18px;border:3px solid var(--line);touch-action:none;display:block;background:#1B1740}
    .sn .info{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;font-weight:800}
    .dpad{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,56px);gap:8px}
    .dpad button{border-radius:14px;border:3px solid var(--line);background:var(--card);font-size:1.4rem;box-shadow:3px 3px 0 var(--line);padding:0}
    .dpad button:active{transform:translate(2px,2px);box-shadow:none}
    .dpad .u{grid-column:2;grid-row:1}.dpad .l{grid-column:1;grid-row:2}.dpad .d{grid-column:2;grid-row:2}.dpad .r{grid-column:3;grid-row:2}
    @media(min-width:900px) and (hover:hover){.dpad{display:none}}
  `);

  /* n = board size, speed = ms per step at the start, min = fastest, wrap = walls wrap around, rocks, bonus apples, rounds in multiplayer */
  const LV = {
    easy: { n: 12, speed: 160, min: 90, wrap: true, rocks: 0, bonus: false, rounds: 1 },
    medium: { n: 15, speed: 130, min: 70, wrap: false, rocks: 0, bonus: true, rounds: 1 },
    hard: { n: 18, speed: 115, min: 60, wrap: false, rocks: 10, bonus: true, rounds: 2 },
    expert: { n: 20, speed: 100, min: 50, wrap: false, rocks: 18, bonus: true, rounds: 2 }
  };
  const SIZE = 500;

  Core.register({
    id: 'snake',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, multi = ctx.multi, N = L.n, C = SIZE / N, TOTAL = multi ? ctx.players.length * L.rounds : 1;
      const cv = h('canvas', { width: SIZE, height: SIZE, 'aria-label': 'Snake board' }), g = cv.getContext('2d');
      const scoreEl = h('span', null), bestEl = h('span', { class: 'muted' }), whoEl = h('span', null);
      let snake, dir, queue, food, bonus, rocks, apples, running, paused, turn = 0, over = false, timer = 0;

      const rnd = n => Math.floor(Math.random() * n);
      const occupied = (x, y) => snake.some(s => s.x === x && s.y === y) || rocks.has(x + ',' + y) || (food && food.x === x && food.y === y) || (bonus && bonus.x === x && bonus.y === y);
      function spawn() { for (let i = 0; i < 600; i++) { const x = rnd(N), y = rnd(N); if (!occupied(x, y)) return { x, y }; } return null; }

      function reset() {
        const m = Math.floor(N / 2);
        snake = [{ x: m, y: m }, { x: m - 1, y: m }, { x: m - 2, y: m }]; dir = { x: 1, y: 0 }; queue = []; apples = 0; bonus = null; food = null; rocks = new Set(); running = false; paused = false; over = false;
        for (let i = 0; i < L.rocks; i++) { for (let k = 0; k < 80; k++) { const x = rnd(N), y = rnd(N); if (Math.abs(y - m) > 1 && !rocks.has(x + ',' + y)) { rocks.add(x + ',' + y); break; } } }
        food = spawn(); update(); draw();
      }
      function update() {
        scoreEl.textContent = 'Apples: ' + apples; const b = Core.store.get('best:snake', null); bestEl.textContent = !multi && b ? 'Best: ' + b.text : '';
        whoEl.textContent = multi ? ctx.players[turn % ctx.players.length].name + ' (turn ' + (turn + 1) + ' of ' + TOTAL + ')' : '';
      }
      const speed = () => Math.max(L.min, L.speed - apples * 2.5);

      function turnDir(d) {
        if (over) return;
        if (!running && !paused) { if (d.x === -dir.x && d.y === -dir.y) return; running = true; dir = d; loop(); return; }
        if (queue.length < 2) queue.push(d);
      }
      function loop() { clearTimeout(timer); if (!running || paused) return; step(); if (running && !paused) timer = setTimeout(loop, speed()); }

      function step() {
        if (queue.length) { const d = queue.shift(); if (!(d.x === -dir.x && d.y === -dir.y)) dir = d; }
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (L.wrap) { head.x = (head.x + N) % N; head.y = (head.y + N) % N; } else if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) return die();
        const eat = food && head.x === food.x && head.y === food.y, body = eat ? snake : snake.slice(0, -1);
        if (body.some(s => s.x === head.x && s.y === head.y) || rocks.has(head.x + ',' + head.y)) return die();
        snake.unshift(head);
        if (eat) { apples++; Core.sfx.ok(); food = spawn(); if (L.bonus && !bonus && Math.random() < .22) { const p = spawn(); if (p) bonus = { ...p, ttl: 45 }; } }
        else if (bonus && head.x === bonus.x && head.y === bonus.y) { apples += 3; Core.sfx.win(); bonus = null; }
        else snake.pop();
        if (bonus && --bonus.ttl <= 0) bonus = null;
        update(); draw();
      }

      function die() {
        running = false; over = true; Core.sfx.bad(); draw(true);
        setTimeout(() => {
          if (!multi) { const nb = ctx.best(apples + ' apples (' + ctx.level + ')', apples); return ctx.finish({ win: apples >= 10, title: apples + ' apple' + (apples === 1 ? '' : 's') + '!', body: nb ? 'New best!' : 'Give it another go.' }); }
          ctx.addScore(turn % ctx.players.length, apples); turn++;
          if (turn >= TOTAL) return ctx.finish({ unit: 'apples' });
          pass();
        }, 800);
      }

      function pass() {
        const p = ctx.players[turn % ctx.players.length]; ctx.setTurn(turn % ctx.players.length);
        root.innerHTML = '';
        root.append(h('div', { class: 'stack center', style: { padding: '40px 0' } }, h('div', { class: 'muted' }, 'Turn ' + (turn + 1) + ' of ' + TOTAL), h('div', { class: 'big' }, 'Pass the device to ' + p.name), h('div', { class: 'row c' }, h('button', { class: 'btn mint', onclick: () => { build(); } }, 'I am ready'))));
      }

      function rr(x, y, w, hh, r, fill) { g.fillStyle = fill; g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, hh, r); else g.rect(x, y, w, hh); g.fill(); }
      function draw(crash) {
        g.fillStyle = '#1B1740'; g.fillRect(0, 0, SIZE, SIZE);
        g.fillStyle = '#241f52'; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) % 2) g.fillRect(x * C, y * C, C, C);
        rocks.forEach(k => { const [x, y] = k.split(',').map(Number); rr(x * C + 2, y * C + 2, C - 4, C - 4, C * .25, '#8d88b8'); rr(x * C + C * .2, y * C + C * .18, C * .35, C * .2, 3, '#b9b4e8'); });
        if (food) { g.fillStyle = '#FF4D5E'; g.beginPath(); g.arc(food.x * C + C / 2, food.y * C + C / 2 + 1, C * .36, 0, 7); g.fill(); g.fillStyle = '#2ED9A3'; g.fillRect(food.x * C + C / 2 - 1, food.y * C + C * .12, 3, C * .2); }
        if (bonus) { const pulse = 1 + Math.sin(Date.now() / 120) * .08; g.fillStyle = '#FFCF33'; g.beginPath(); g.arc(bonus.x * C + C / 2, bonus.y * C + C / 2, C * .42 * pulse, 0, 7); g.fill(); g.fillStyle = '#1B1740'; g.font = 'bold ' + Math.round(C * .5) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3', bonus.x * C + C / 2, bonus.y * C + C / 2 + 1); }
        snake.forEach((s, i) => { rr(s.x * C + 1.5, s.y * C + 1.5, C - 3, C - 3, C * .32, crash ? '#FF4D5E' : i === 0 ? '#12b886' : (i % 2 ? '#2ED9A3' : '#3ee8b0')); });
        const hd = snake[0], ex = dir.x, ey = dir.y; g.fillStyle = '#fff'; [[-1, -1], [1, -1]].forEach(([a]) => { const px = hd.x * C + C / 2 + (ey ? a * C * .2 : ex * C * .15), py = hd.y * C + C / 2 + (ey ? ey * C * .15 : a * C * .2); g.beginPath(); g.arc(px, py, C * .11, 0, 7); g.fill(); g.fillStyle = '#1B1740'; g.beginPath(); g.arc(px + ex * 1.5, py + ey * 1.5, C * .05, 0, 7); g.fill(); g.fillStyle = '#fff'; });
        if (!running && !over) { g.fillStyle = 'rgba(27,23,64,.7)'; g.fillRect(0, SIZE / 2 - 34, SIZE, 68); g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(paused ? 'Paused. Press Space' : 'Swipe or press an arrow key to start', SIZE / 2, SIZE / 2); }
      }

      const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
      const onKey = e => {
        if (document.querySelector('.modal') || e.ctrlKey || e.metaKey) return;
        if (dirs[e.key]) { e.preventDefault(); turnDir({ x: dirs[e.key][0], y: dirs[e.key][1] }); }
        else if (e.key === ' ' || e.key === 'p' || e.key === 'P') { e.preventDefault(); if (over) return; if (running) { running = false; paused = true; draw(); } else if (paused) { paused = false; running = true; loop(); } }
      };
      document.addEventListener('keydown', onKey);
      let sx = 0, sy = 0;
      cv.addEventListener('pointerdown', e => { e.preventDefault(); sx = e.clientX; sy = e.clientY; });
      cv.addEventListener('pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; turnDir(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) }); });
      const pad = (c, t, d) => h('button', { class: c, 'aria-label': t, onpointerdown: e => { e.preventDefault(); turnDir({ x: d[0], y: d[1] }); } }, t === 'Up' ? '▲' : t === 'Down' ? '▼' : t === 'Left' ? '◀' : '▶');

      function build() {
        root.innerHTML = '';
        root.append(h('div', { class: 'sn' }, h('div', { class: 'info' }, scoreEl, bestEl, whoEl), cv,
          h('div', { class: 'dpad' }, pad('u', 'Up', [0, -1]), pad('l', 'Left', [-1, 0]), pad('d', 'Down', [0, 1]), pad('r', 'Right', [1, 0])),
          h('p', { class: 'muted center', style: { margin: 0 } }, (L.wrap ? 'Walls wrap around on this level. ' : 'Walls are deadly. ') + (L.rocks ? 'Avoid the rocks. ' : '') + (L.bonus ? 'Golden apples are worth 3.' : ''))));
        if (multi) ctx.setTurn(turn % ctx.players.length);
        reset();
      }
      build();
      return () => { document.removeEventListener('keydown', onKey); clearTimeout(timer); };
    }
  });
})();
