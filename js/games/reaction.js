/* Reaction-Time Test
   Solo: five attempts, click (or press Space) the moment the panel turns green.
   Multiplayer: 5 duels on one keyboard or touchscreen. First to hit their key or pad after the green flash scores.
   Jumping the gun costs you a point and locks you out of the round. */
(function () {
  const { h } = Core;

  Core.css('reaction', `
    .rt{display:grid;gap:16px}
    .sig{border:4px solid var(--line);border-radius:24px;min-height:min(46vh,300px);display:grid;place-items:center;text-align:center;padding:20px;background:var(--sky);color:#1B1740;user-select:none;-webkit-user-select:none;cursor:pointer;width:100%;font:inherit}
    .sig.wait{background:var(--red);color:#fff}.sig.decoy{background:var(--tangerine);color:#1B1740}.sig.go{background:var(--mint)}.sig.fin{background:var(--sun)}
    .sig .t{font-family:var(--head);font-weight:700;font-size:clamp(2rem,8vw,3.6rem);line-height:1.1}
    .sig .s{font-weight:800;margin-top:6px}
    .pads{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
    .pd{border:3px solid var(--line);border-radius:18px;background:var(--pc);color:#1B1740;padding:20px 8px;font-family:var(--head);font-weight:700;font-size:1.1rem;box-shadow:var(--shadow);touch-action:manipulation;user-select:none;-webkit-user-select:none;display:grid;gap:4px}
    .pd:active,.pd.hit{transform:translate(3px,3px);box-shadow:none}
    .pd small{font-family:var(--body);font-weight:800;opacity:.75}
    .pd.out{opacity:.35}
    .hist{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
    .hist span{padding:4px 12px;border-radius:99px;border:2px solid var(--line);background:var(--paper);font-weight:800}
  `);

  const KEYS = ['a', 'l', 'v', 'n'];
  const rank = ms => ms < 170 ? 'Lightning reflexes' : ms < 220 ? 'Sharp as a tack' : ms < 270 ? 'Quick' : ms < 330 ? 'Solid average' : ms < 450 ? 'Warming up' : 'Still waking up';

  /* levels: solo attempts, duel rounds, chance of an orange fake-out before the real green */
  const LV = { easy: { n: 5, duel: 5, decoy: 0 }, medium: { n: 8, duel: 7, decoy: .25 }, hard: { n: 10, duel: 9, decoy: .4 }, expert: { n: 12, duel: 11, decoy: .55 } };

  Core.register({
    id: 'reaction',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, multi = ctx.multi, ROUNDS = multi ? L.duel : L.n;
      let phase = 'idle', t0 = 0, timer = 0, attempts = [], round = 0, locked = new Set();
      const sig = h('button', { class: 'sig', 'aria-live': 'assertive' }), hist = h('div', { class: 'hist' });
      const pads = multi ? ctx.players.map((p, i) => h('button', { class: 'pd', style: { '--pc': p.color }, onpointerdown: e => { e.preventDefault(); press(i); } }, p.name, h('small', null, 'Key ' + KEYS[i].toUpperCase() + ' or tap'))) : [];
      const msg = (t, s, cls) => { sig.className = 'sig ' + (cls || ''); sig.innerHTML = ''; sig.append(h('div', null, h('div', { class: 't' }, t), s ? h('div', { class: 's' }, s) : null)); };

      function idle() { phase = 'idle'; msg(multi ? 'Round ' + (round + 1) + ' of ' + ROUNDS : 'Reaction test', multi ? 'Press the big panel or Space to start' : 'Click here or press Space to start. ' + ROUNDS + ' attempts, wait for green.' + (L.decoy ? ' Ignore the orange fake-outs!' : '')); }
      function arm() {
        phase = 'wait'; locked = new Set(); pads.forEach(p => p.classList.remove('out', 'hit'));
        msg('Wait for green...', multi ? 'Do not press yet!' : null, 'wait');
        goSoon(1500 + Math.random() * 3500, true);
      }
      function goSoon(delay, allowDecoy) {
        timer = setTimeout(() => {
          if (allowDecoy && Math.random() < L.decoy) { msg('Fake out!', 'Only green counts. Keep waiting...', 'decoy'); Core.sfx.tone(300, .18, 'sawtooth', .1); return goSoon(1100 + Math.random() * 1900, false); }
          phase = 'go'; msg(multi ? 'GO!' : 'CLICK!', null, 'go'); t0 = performance.now(); Core.sfx.tone(880, .12, 'square', .12);
        }, delay);
      }
      function early(i) {
        clearTimeout(timer);
        Core.sfx.bad();
        if (!multi) { phase = 'idle'; msg('Too soon!', 'Click to try that attempt again', 'wait'); return; }
        locked.add(i); pads[i].classList.add('out'); if (ctx.players[i].score > 0) ctx.addScore(i, -1);
        if (locked.size >= ctx.players.length) { phase = 'idle'; msg('Everyone jumped!', 'Press the panel to redo this round', 'wait'); }
        else { phase = 'wait'; msg(ctx.players[i].name + ' jumped the gun!', 'Wait for green...', 'wait'); timer = setTimeout(() => { phase = 'go'; msg('GO!', null, 'go'); t0 = performance.now(); Core.sfx.tone(880, .12, 'square', .12); }, 1200 + Math.random() * 2500); }
      }
      function press(i) {
        if (phase === 'wait') return early(i);
        if (phase !== 'go' || locked.has(i)) return;
        const ms = Math.round(performance.now() - t0); phase = 'idle'; Core.sfx.ok();
        if (!multi) {
          attempts.push(ms); hist.innerHTML = ''; attempts.forEach(a => hist.append(h('span', null, a + ' ms')));
          if (attempts.length >= ROUNDS) {
            const avg = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length), nb = ctx.best(avg + ' ms', avg, false);
            msg(avg + ' ms', 'Average of ' + ROUNDS + '. ' + rank(avg), 'fin');
            return setTimeout(() => ctx.finish({ title: rank(avg), body: 'Your average was ' + avg + ' ms, best single ' + Math.min(...attempts) + ' ms.' + (nb ? ' New personal best!' : '') }), 700);
          }
          msg(ms + ' ms', rank(ms) + '. Click for the next one (' + attempts.length + '/' + ROUNDS + ')', 'fin'); return;
        }
        pads[i].classList.add('hit'); ctx.addScore(i, 1); round++;
        msg(ctx.players[i].name + ' wins the round!', ms + ' ms', 'fin');
        if (round >= ROUNDS) return setTimeout(() => ctx.finish({ unit: 'pts' }), 900);
        setTimeout(() => { if (phase === 'idle') idle(); }, 1300);
      }
      function panel() { if (phase === 'idle') arm(); else if (phase === 'wait' && !multi) early(0); else if (phase === 'go' && !multi) press(0); }
      sig.addEventListener('pointerdown', e => { e.preventDefault(); panel(); });
      sig.addEventListener('keydown', e => { if (e.code === 'Space' || e.key === 'Enter') e.preventDefault(); });
      const onKey = e => {
        if (document.querySelector('.modal') || e.repeat || e.ctrlKey || e.metaKey) return;
        if (e.code === 'Space') { e.preventDefault(); if (!multi || phase === 'idle') panel(); return; }
        if (multi) { const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0 && i < ctx.players.length) press(i); }
      };
      document.addEventListener('keydown', onKey);
      root.append(h('div', { class: 'rt' }, sig, multi ? h('div', { class: 'pads' }, pads) : hist, multi ? h('p', { class: 'muted center', style: { margin: 0 } }, 'Best of ' + ROUNDS + ' rounds. A false start costs a point.') : null));
      idle(); if (multi) { ctx.turn = -1; ctx.paint(); }
      return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey); };
    }
  });
})();
