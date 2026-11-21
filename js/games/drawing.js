/* Drawing Challenges
   Levels: Easy = simple subjects and 90 seconds, Medium = 60s with silly combos, Hard = 45s plus a rule (two colours only, thick brush...),
   Expert = 30s plus a rule. Solo plays a series of prompts and ends with a gallery you can save.
   Multiplayer: everyone draws the same prompt in turn, then each player votes for the best drawing that is not their own. */
(function () {
  const { h } = Core;

  Core.css('draw', `
    .dr{display:grid;gap:12px}
    .dr canvas{width:100%;height:auto;aspect-ratio:8/5;background:#fff;border:3px solid var(--line);border-radius:16px;touch-action:none;cursor:crosshair;display:block}
    .tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .sw{width:32px;height:32px;border-radius:50%;border:3px solid var(--line);padding:0}
    .sw[aria-pressed="true"]{outline:3px solid var(--violet);outline-offset:2px;transform:scale(1.1)}
    .prompt{font-family:var(--head);font-weight:700;font-size:clamp(1.4rem,5vw,2.2rem);text-align:center}
    .rule{display:inline-block;padding:3px 14px;border-radius:99px;border:2px solid var(--line);background:var(--pink);color:#1B1740;font-weight:800}
    .gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    .gal figure{margin:0;display:grid;gap:6px;text-align:center}
    .gal img{width:100%;border:3px solid var(--line);border-radius:14px;background:#fff;display:block}
    .gal button.v{padding:0;border:0;background:none;cursor:pointer;border-radius:16px}
    .gal button.v:hover img{outline:4px solid var(--violet)}
    .gal.big{max-height:60vh;overflow:auto;padding:4px}
  `);

  const EASY = ['a house', 'a cat', 'a tree', 'the sun', 'a fish', 'a flower', 'a car', 'a boat', 'an apple', 'a butterfly', 'a rocket', 'a robot', 'a dog', 'a bird', 'a cake', 'a hat', 'a star', 'a rainbow', 'a snowman', 'a castle', 'a bicycle', 'an ice cream', 'a smiling moon', 'a train', 'a snail', 'an umbrella', 'a kite', 'a duck', 'a pizza', 'a guitar', 'a clock', 'a turtle', 'a balloon', 'a penguin', 'a pumpkin', 'a lighthouse', 'a windmill', 'a tent', 'a cupcake', 'an owl', 'a mushroom', 'a crown', 'a sailboat', 'a hot air balloon', 'a cactus', 'a bee', 'a lion', 'a giraffe', 'a rocket ship', 'a treasure chest', 'a pair of sunglasses'];
  const ADJ = ['sleepy', 'grumpy', 'tiny', 'giant', 'sparkly', 'polite', 'clumsy', 'brave', 'hungry', 'dizzy', 'fancy', 'shy', 'sneaky', 'cheerful', 'ancient', 'jolly', 'mysterious', 'speedy', 'glowing', 'fluffy', 'wobbly', 'grand', 'lonely', 'silly', 'royal', 'tired', 'friendly', 'invisible', 'frozen', 'rainbow'];
  const NOUN = ['dragon', 'robot chef', 'penguin', 'lighthouse', 'astronaut cat', 'octopus', 'dinosaur', 'whale', 'snail', 'castle', 'giraffe', 'fox detective', 'mermaid', 'bear', 'owl librarian', 'monster', 'treehouse', 'pirate ship', 'unicorn', 'sandwich', 'wizard', 'cloud', 'rocket', 'scarecrow', 'jellyfish', 'knight', 'panda', 'spaceship', 'dragonfly', 'volcano', 'snowman', 'elephant', 'submarine', 'tortoise', 'ghost', 'viking', 'hedgehog', 'train', 'camel', 'squirrel'];
  const ACT = ['learning to dance', 'having a birthday party', 'riding a bicycle', 'on vacation', 'baking a giant cake', 'lost in a forest', 'playing guitar', 'floating in space', 'going to school', 'starting a band', 'flying a kite', 'training for the Olympics', 'hiding from a storm', 'opening a shop', 'painting a self portrait', 'catching a runaway balloon', 'sailing across the sea', 'climbing a mountain', 'building a sandcastle', 'having a picnic', 'reading a bedtime story', 'solving a mystery', 'growing a giant vegetable', 'chasing a butterfly', 'exploring a cave'];
  const art = w => /^[aeiou]/.test(w) ? 'an ' : 'a ';
  const COLORS = ['#1B1740', '#FF4D5E', '#FF8A3D', '#FFCF33', '#2ED9A3', '#2DC4F5', '#7B5CFF', '#FF5FA2', '#8a5a3c', '#ffffff'];
  const RULES = [
    () => { const c = Core.shuffle(COLORS.slice(0, 9)).slice(0, 2); return { text: 'Only two colours', colors: c }; },
    () => ({ text: 'Thick brush only', size: 20 }), () => ({ text: 'Thin lines only', size: 2 }),
    () => ({ text: 'No undo and no eraser', noUndo: true }), () => ({ text: 'Black ink only', colors: ['#1B1740'] }),
    () => ({ text: 'Only red, yellow and blue', colors: ['#FF4D5E', '#FFCF33', '#2DC4F5'] })
  ];

  const LV = {
    easy: { time: 90, rounds: 3, mr: 1, rule: false, style: 0 },
    medium: { time: 60, rounds: 4, mr: 2, rule: false, style: 1 },
    hard: { time: 45, rounds: 5, mr: 3, rule: true, style: 2 },
    expert: { time: 30, rounds: 6, mr: 3, rule: true, style: 2 }
  };
  function makePrompt(style) {
    if (style === 0) return Core.pick(EASY);
    const a = Core.pick(ADJ), n = Core.pick(NOUN);
    return art(a) + a + ' ' + n + (style === 2 ? ' ' + Core.pick(ACT) : '');
  }

  Core.register({
    id: 'draw',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, multi = ctx.multi, TIME = L.time, W = 800, H = 500, ROUNDS = multi ? L.mr : L.rounds;
      let prompt, rule = null, left = TIME, tm = 0, color = COLORS[0], size = 6, erase = false, undo = [], drawing = false, last = null, art = [], who = 0, round = 0, gallery = [];

      function newPrompt() { prompt = makePrompt(L.style); rule = L.rule ? Core.pick(RULES)() : null; if (rule && rule.colors) color = rule.colors[0]; else color = COLORS[0]; size = rule && rule.size ? rule.size : 6; }
      const ruleChip = () => rule ? h('div', null, h('span', { class: 'rule' }, 'Rule: ' + rule.text)) : null;

      function setup() {
        if (!prompt) newPrompt();
        root.innerHTML = '';
        root.append(h('div', { class: 'stack center' },
          h('div', { class: 'muted' }, 'Prompt ' + (round + 1) + ' of ' + ROUNDS + '. ' + (multi ? 'Everyone draws it, then votes for the best.' : TIME + ' seconds on the clock.')),
          h('div', { class: 'prompt' }, prompt), ruleChip(),
          h('div', { class: 'row c' }, h('button', { class: 'btn alt sm', onclick: () => { newPrompt(); setup(); } }, 'Different prompt'),
            h('button', { class: 'btn mint', onclick: () => { art = []; who = 0; canvasScreen(); } }, multi ? 'Start with ' + ctx.players[0].name : 'Start drawing'))));
      }

      function canvasScreen() {
        clearInterval(tm); left = TIME; undo = []; erase = false;
        if (multi) ctx.setTurn(who);
        const cv = h('canvas', { width: W, height: H, 'aria-label': 'Drawing canvas' }), g = cv.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.lineCap = g.lineJoin = 'round';
        const snap = () => { if (rule && rule.noUndo) return; undo.push(g.getImageData(0, 0, W, H)); if (undo.length > 20) undo.shift(); };
        const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
        cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); snap(); drawing = true; last = pos(e); stroke(last, last); });
        cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); stroke(last, p); last = p; });
        ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drawing = false; }));
        function stroke(a, b) { g.strokeStyle = erase ? '#fff' : color; g.lineWidth = erase ? size * 3 : size; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0] + .01, b[1]); g.stroke(); }
        const palette = rule && rule.colors ? rule.colors : COLORS;
        const timeEl = h('span', { class: 'stat' }, left + 's'), bar = h('i');
        const sw = palette.map(c => h('button', { class: 'sw', style: { background: c }, 'aria-label': 'Colour ' + c, 'aria-pressed': c === color, onclick: () => { color = c; erase = false; sw.forEach((s, i) => s.setAttribute('aria-pressed', palette[i] === c)); eraser.setAttribute('aria-pressed', false); eraser.className = 'btn alt sm'; } }));
        const eraser = h('button', { class: 'btn alt sm', 'aria-pressed': false, hidden: !!(rule && rule.noUndo), onclick: () => { erase = !erase; eraser.setAttribute('aria-pressed', erase); eraser.className = 'btn sm ' + (erase ? 'sun' : 'alt'); } }, 'Eraser');
        const done = () => { clearInterval(tm); const url = cv.toDataURL('image/png'); if (!multi) return soloDone(url); art.push({ url, by: who }); who++; if (who >= ctx.players.length) return vote(); pass(); };
        const sizeIn = h('input', { type: 'range', min: 2, max: 30, value: size, 'aria-label': 'Brush size', disabled: !!(rule && rule.size), oninput: e => { size = +e.target.value; } });
        root.innerHTML = '';
        root.append(h('div', { class: 'dr' },
          h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', { class: 'prompt', style: { fontSize: '1.3rem', textAlign: 'left' } }, (multi ? ctx.players[who].name + ': ' : '') + prompt), timeEl),
          rule ? h('div', null, h('span', { class: 'rule' }, 'Rule: ' + rule.text)) : null,
          h('div', { class: 'bar' }, bar), cv,
          h('div', { class: 'tools' }, sw, eraser, sizeIn,
            h('button', { class: 'btn alt sm', hidden: !!(rule && rule.noUndo), onclick: () => { const u = undo.pop(); if (u) g.putImageData(u, 0, 0); } }, 'Undo'),
            h('button', { class: 'btn alt sm', hidden: !!(rule && rule.noUndo), onclick: () => { snap(); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); } }, 'Clear'),
            h('span', { style: { flex: 1 } }), h('button', { class: 'btn mint sm', onclick: done }, 'I am done'))));
        tm = setInterval(() => { left--; timeEl.textContent = Math.max(0, left) + 's'; bar.style.width = Math.max(0, left / TIME * 100) + '%'; if (left <= 5 && left > 0) Core.sfx.tick(); if (left <= 0) { if (multi) done(); else { clearInterval(tm); timeEl.textContent = 'Time is up!'; } } }, 1000);
      }

      function nextRound() { round++; prompt = null; if (round >= ROUNDS) return endAll(); setup(); }

      function soloDone(url) {
        gallery.push({ url, prompt }); const c = Core.store.get('drawcount', 0) + 1; Core.store.set('drawcount', c); ctx.best('Drew ' + c + ' prompts', c);
        Core.sfx.win();
        root.innerHTML = '';
        root.append(h('div', { class: 'stack center' }, h('div', { class: 'prompt' }, prompt), h('div', { class: 'gal', style: { maxWidth: '560px', margin: '0 auto' } }, h('img', { src: url, alt: 'Your drawing' })),
          h('div', { class: 'row c' }, h('a', { class: 'btn sun', href: url, download: 'my-drawing.png' }, 'Save as PNG'), h('button', { class: 'btn mint', onclick: nextRound }, round + 1 >= ROUNDS ? 'See my gallery' : 'Next prompt (' + (round + 2) + ' of ' + ROUNDS + ')'))));
      }

      function endAll() {
        if (!multi) return ctx.finish({ title: 'Gallery complete!', ranking: false, body: h('div', { class: 'gal big' }, gallery.map((g, i) => h('figure', null, h('img', { src: g.url, alt: g.prompt }), h('span', null, g.prompt), h('a', { href: g.url, download: 'drawing-' + (i + 1) + '.png' }, 'Save')))) });
        ctx.finish({ unit: 'votes', body: 'Played ' + ROUNDS + ' prompt' + (ROUNDS > 1 ? 's' : '') + '.' });
      }

      function pass() {
        root.innerHTML = '';
        root.append(h('div', { class: 'stack center', style: { padding: '30px 0' } }, h('div', { class: 'big' }, 'Pass the device to ' + ctx.players[who].name), h('p', { class: 'muted' }, 'The prompt is: ' + prompt + (rule ? ' (' + rule.text + ')' : '')), h('div', { class: 'row c' }, h('button', { class: 'btn mint', onclick: canvasScreen }, 'Start drawing'))));
      }

      function vote(v = 0) {
        if (v >= ctx.players.length) return nextRound();
        ctx.setTurn(v);
        root.innerHTML = '';
        root.append(h('div', { class: 'stack center' }, h('div', { class: 'prompt' }, ctx.players[v].name + ', pick the best drawing'), h('p', { class: 'muted', style: { margin: 0 } }, 'Prompt: ' + prompt + '. You cannot vote for your own.'),
          h('div', { class: 'gal' }, art.map((a, i) => i === v ? h('figure', { style: { opacity: .35 } }, h('img', { src: a.url, alt: 'Your drawing' }), h('span', null, 'Yours')) :
            h('figure', null, h('button', { class: 'v', onclick: () => { Core.sfx.ok(); ctx.addScore(a.by, 1); vote(v + 1); }, 'aria-label': 'Vote for drawing ' + (i + 1) }, h('img', { src: a.url, alt: 'Drawing ' + (i + 1) })), h('span', null, 'Drawing ' + (i + 1)))))));
      }

      setup();
      return () => clearInterval(tm);
    }
  });
})();
