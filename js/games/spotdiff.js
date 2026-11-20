/* Spot the Difference
   Every puzzle is generated procedurally as two SVG scenes with hidden changes. Six themes: meadow, beach, space, winter, city, underwater.
   Levels change how many differences hide, how subtle they are and how many scenes you play.
   Solo: scenes against the clock (mistakes cost seconds). Multiplayer: shared scenes, a correct find keeps your turn. */
(function () {
  const { h } = Core;

  Core.css('diff', `
    .sd{display:grid;gap:14px}
    .sd .pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
    .sd svg{width:100%;height:auto;display:block;border-radius:16px;border:3px solid var(--line);cursor:crosshair;touch-action:manipulation;background:#BDE6FF}
    .sd .miss{animation:shake .3s}
  `);

  const PAL = ['#FF5FA2', '#2DC4F5', '#FFCF33', '#2ED9A3', '#FF8A3D', '#7B5CFF', '#FF4D5E'];
  const GREENS = ['#2f9e5a', '#3fb36b', '#1f8a62'];
  const TINTS = ['#FFD1E8', '#D6F5FF', '#FFF3A3', '#E3D9FF'];

  /* every drawing is made around (0,0) and placed with translate + scale */
  const D = {
    sun: c => { let r = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; r += `<line x1="${Math.cos(a) * 19}" y1="${Math.sin(a) * 19}" x2="${Math.cos(a) * 27}" y2="${Math.sin(a) * 27}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`; } return r + `<circle r="15" fill="${c}"/>`; },
    cloud: c => `<g fill="${c}"><circle cx="-16" cy="3" r="12"/><circle cy="-5" r="16"/><circle cx="17" cy="3" r="12"/><rect x="-16" y="2" width="33" height="13" rx="6"/></g>`,
    bird: c => `<path d="M-13 0 Q-6 -9 0 0 Q6 -9 13 0" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
    balloon: c => `<line x1="0" y1="15" x2="3" y2="34" stroke="#555" stroke-width="1.5"/><ellipse rx="11" ry="14" fill="${c}"/><path d="M-3 15 L3 15 L0 19Z" fill="${c}"/>`,
    tree: c => `<rect x="-4" width="8" height="24" fill="#8a5a3c"/><circle cy="-8" r="20" fill="${c}"/><circle cx="-9" cy="2" r="12" fill="${c}"/><circle cx="10" cy="1" r="12" fill="${c}"/>`,
    house: c => `<rect x="-22" y="-8" width="44" height="30" fill="${c}"/><polygon points="-28,-8 0,-32 28,-8" fill="#6d3b4a"/><rect x="-5" y="6" width="10" height="16" fill="#fff"/><rect x="9" y="-2" width="8" height="8" fill="#fff"/>`,
    flower: c => `<line y2="16" stroke="#3d9a3d" stroke-width="3"/><circle r="8" fill="${c}"/><circle r="3.5" fill="#FFF3A3"/>`,
    boat: c => `<path d="M-22 0 L22 0 L14 10 L-14 10Z" fill="#8a5a3c"/><line y1="0" y2="-28" stroke="#555" stroke-width="2"/><polygon points="0,-28 18,-4 0,-4" fill="${c}"/>`,
    umbrella: c => `<line y1="-2" y2="26" stroke="#555" stroke-width="3"/><path d="M-26 -2 A26 24 0 0 1 26 -2Z" fill="${c}"/><path d="M-9 -2 A9 24 0 0 1 9 -2Z" fill="#fff" opacity=".55"/>`,
    palm: c => { let l = ''; [-80, -40, 0, 40, 80].forEach(a => { l += `<ellipse rx="20" ry="6" fill="${c}" transform="translate(2 -16) rotate(${a - 90}) translate(15 0)"/>`; }); return `<path d="M0 26 Q8 6 2 -16" fill="none" stroke="#8a5a3c" stroke-width="6" stroke-linecap="round"/>` + l + `<circle cx="-2" cy="-12" r="3" fill="#6d3b1f"/>`; },
    crab: c => `<g stroke="${c}" stroke-width="2.5" stroke-linecap="round"><line x1="-10" y1="4" x2="-20" y2="12"/><line x1="10" y1="4" x2="20" y2="12"/><line x1="-6" y1="6" x2="-12" y2="14"/><line x1="6" y1="6" x2="12" y2="14"/></g><ellipse rx="14" ry="9" fill="${c}"/><circle cx="-20" cy="-8" r="6" fill="${c}"/><circle cx="20" cy="-8" r="6" fill="${c}"/><circle cx="-5" cy="-6" r="2.2" fill="#fff"/><circle cx="5" cy="-6" r="2.2" fill="#fff"/>`,
    shell: c => `<path d="M0 10 L-13 -3 A13 13 0 0 1 13 -3Z" fill="${c}"/><path d="M0 10 L-5 -9 M0 10 L5 -9 M0 10 L0 -11" stroke="#fff" stroke-width="1.5" opacity=".7"/>`,
    starfish: c => { let p = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5; p += (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1) + ' '; } return `<polygon points="${p}" fill="${c}"/>`; },
    ball: c => `<circle r="11" fill="#fff" stroke="#333" stroke-width="1.5"/><path d="M-11 0 A11 11 0 0 1 0 -11 L0 0Z M11 0 A11 11 0 0 1 0 11 L0 0Z" fill="${c}"/>`,
    planet: c => `<ellipse rx="27" ry="7" fill="none" stroke="#fff" stroke-width="3" opacity=".6" transform="rotate(-20)"/><circle r="16" fill="${c}"/><circle cx="-5" cy="-4" r="3" fill="#fff" opacity=".25"/><path d="M-27 4 A27 7 0 0 0 27 4" fill="none" stroke="#fff" stroke-width="3" opacity=".6" transform="rotate(-20)"/>`,
    moon: c => `<circle r="14" fill="${c}"/><circle cx="-4" cy="-3" r="3" fill="#000" opacity=".15"/><circle cx="5" cy="5" r="2.5" fill="#000" opacity=".15"/>`,
    rocket: c => `<path d="M0 -24 Q12 -8 8 14 L-8 14 Q-12 -8 0 -24Z" fill="#eef"/><path d="M-8 6 L-16 18 L-8 14Z M8 6 L16 18 L8 14Z" fill="${c}"/><circle cy="-6" r="4.5" fill="#2DC4F5"/><path d="M-4 14 L0 24 L4 14Z" fill="#FFCF33"/>`,
    ufo: c => `<path d="M-11 -3 A11 11 0 0 1 11 -3Z" fill="${c}"/><ellipse rx="24" ry="7" fill="#9aa0c8"/><circle cx="-12" cy="1" r="2" fill="#FFCF33"/><circle cy="2" r="2" fill="#FFCF33"/><circle cx="12" cy="1" r="2" fill="#FFCF33"/>`,
    star: c => { let p = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5; p += (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1) + ' '; } return `<polygon points="${p}" fill="${c}"/>`; },
    alien: c => `<line y1="-12" y2="-22" stroke="${c}" stroke-width="2"/><circle cy="-23" r="3" fill="${c}"/><ellipse rx="13" ry="12" fill="${c}"/><ellipse cx="-5" cy="-1" rx="3.5" ry="5" fill="#111"/><ellipse cx="5" cy="-1" rx="3.5" ry="5" fill="#111"/>`,
    comet: c => `<path d="M0 0 L-34 -16 L-30 -8Z M0 0 L-36 -2 L-30 4Z" fill="${c}" opacity=".6"/><circle r="7" fill="${c}"/>`,
    snowman: c => `<circle cy="12" r="13" fill="#fff" stroke="#cfe3f5" stroke-width="2"/><circle cy="-6" r="9" fill="#fff" stroke="#cfe3f5" stroke-width="2"/><circle cx="-3" cy="-8" r="1.5" fill="#222"/><circle cx="3" cy="-8" r="1.5" fill="#222"/><polygon points="0,-5 9,-3 0,-2" fill="#FF8A3D"/><rect x="-8" y="-20" width="16" height="6" fill="${c}"/><rect x="-5" y="-27" width="10" height="8" fill="#333"/>`,
    pine: c => `<rect x="-3" y="14" width="6" height="10" fill="#6d4a30"/><polygon points="0,-26 -16,-4 16,-4" fill="${c}"/><polygon points="0,-14 -20,10 20,10" fill="${c}"/><polygon points="0,-26 -6,-18 6,-18" fill="#fff"/>`,
    snowflake: c => { let l = ''; for (let i = 0; i < 3; i++) l += `<line x1="-10" x2="10" stroke="${c}" stroke-width="2.4" stroke-linecap="round" transform="rotate(${i * 60})"/>`; return l; },
    gift: c => `<rect x="-12" y="-10" width="24" height="20" fill="${c}"/><rect x="-2" y="-10" width="4" height="20" fill="#fff"/><rect x="-12" y="-3" width="24" height="4" fill="#fff"/><path d="M0 -10 Q-8 -20 -2 -14 M0 -10 Q8 -20 2 -14" stroke="#fff" fill="none" stroke-width="2"/>`,
    penguin: c => `<ellipse cy="2" rx="11" ry="15" fill="#2a2748"/><ellipse cy="6" rx="7" ry="10" fill="#fff"/><circle cx="-4" cy="-6" r="1.6" fill="#fff"/><circle cx="4" cy="-6" r="1.6" fill="#fff"/><polygon points="-3,-3 3,-3 0,1" fill="${c}"/><ellipse cx="-6" cy="17" rx="5" ry="2.5" fill="${c}"/><ellipse cx="6" cy="17" rx="5" ry="2.5" fill="${c}"/>`,
    building: c => { let w = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) w += `<rect x="${-12 + i * 9}" y="${-42 + j * 13}" width="6" height="8" fill="${(i + j) % 3 ? '#FFF3A3' : '#6a6a8a'}"/>`; return `<rect x="-17" y="-50" width="34" height="62" fill="${c}"/>` + w; },
    car: c => `<path d="M-22 6 L-22 -2 L-12 -3 L-6 -12 L10 -12 L16 -3 L22 -2 L22 6Z" fill="${c}"/><path d="M-5 -3 L-2 -10 L4 -10 L4 -3Z M7 -3 L7 -10 L10 -10 L14 -3Z" fill="#dff4ff"/><circle cx="-12" cy="7" r="5" fill="#222"/><circle cx="12" cy="7" r="5" fill="#222"/>`,
    lamp: c => `<line y1="-30" y2="14" stroke="#444" stroke-width="3"/><circle cy="-32" r="6" fill="${c}"/>`,
    fish: c => `<polygon points="-12,0 -24,-9 -24,9" fill="${c}"/><ellipse rx="15" ry="9" fill="${c}"/><circle cx="7" cy="-2" r="2.5" fill="#fff"/><circle cx="8" cy="-2" r="1.2" fill="#111"/>`,
    jelly: c => `<path d="M-14 4 A14 14 0 0 1 14 4Z" fill="${c}" opacity=".9"/><path d="M-9 4 Q-12 14 -8 22 M-3 4 Q0 14 -3 24 M4 4 Q8 14 3 22 M10 4 Q13 14 9 20" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    seaweed: c => `<path d="M0 20 Q-8 8 0 -2 Q8 -12 0 -24" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
    bubble: c => `<circle r="8" fill="none" stroke="${c}" stroke-width="2"/><circle cx="-3" cy="-3" r="1.8" fill="${c}"/>`,
    chest: c => `<rect x="-16" y="-4" width="32" height="18" fill="#8a5a3c"/><path d="M-16 -4 A16 10 0 0 1 16 -4Z" fill="#a06a44"/><rect x="-16" y="3" width="32" height="3" fill="${c}"/><rect x="-3" y="-2" width="6" height="8" fill="${c}"/>`
  };
  const RAD = { sun: 25, cloud: 32, bird: 18, balloon: 28, tree: 32, house: 38, flower: 17, boat: 30, umbrella: 30, palm: 34, crab: 24, shell: 16, starfish: 18, ball: 14, planet: 30, moon: 18, rocket: 28, ufo: 26, star: 16, alien: 24, comet: 28, snowman: 30, pine: 32, snowflake: 14, gift: 17, penguin: 22, building: 40, car: 28, lamp: 22, fish: 22, jelly: 26, seaweed: 26, bubble: 12, chest: 22 };
  const TINT = new Set(['cloud', 'snowflake', 'bubble']);

  const Z = { sky: [28, 115], ground: [190, 272], sea: [140, 185], sand: [205, 272], any: [30, 270], water: [30, 195], floor: [215, 272], street: [200, 272] };
  const stars = (() => { const r = Core.rng('stars'); let s = ''; for (let i = 0; i < 70; i++) s += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 300).toFixed(0)}" r="${(r() * 1.3 + .4).toFixed(1)}" fill="#fff" opacity="${(r() * .6 + .3).toFixed(2)}"/>`; return s; })();
  const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

  const THEMES = [
    { id: 'meadow', name: 'Meadow', bg: grad('g', '#9ED8FF', '#E9F8FF') + '<rect width="400" height="300" fill="url(#g)"/><path d="M0 170 Q100 130 200 165 T400 150 V300 H0Z" fill="#8BD66B"/><path d="M0 215 Q120 185 230 210 T400 200 V300 H0Z" fill="#6BC553"/>',
      spawn: [['sun', 'sky', 1, '#FFCF33'], ['cloud', 'sky', 2, '#ffffff'], ['bird', 'sky', 2, '#34305a'], ['balloon', 'sky', 3], ['tree', 'ground', 3, GREENS], ['house', 'ground', 2], ['flower', 'ground', 5]], add: [['flower', 'ground'], ['balloon', 'sky'], ['bird', 'sky']] },
    { id: 'beach', name: 'Beach', bg: grad('g', '#7fd0ff', '#eaf9ff') + '<rect width="400" height="300" fill="url(#g)"/><rect y="128" width="400" height="66" fill="#3BB5E8"/><path d="M0 140 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/><path d="M0 194 Q100 180 200 192 T400 190 V300 H0Z" fill="#F6D89B"/>',
      spawn: [['sun', 'sky', 1, '#FFCF33'], ['cloud', 'sky', 2, '#ffffff'], ['bird', 'sky', 2, '#34305a'], ['boat', 'sea', 2], ['umbrella', 'sand', 2], ['palm', 'sand', 2, GREENS], ['crab', 'sand', 2, ['#FF4D5E', '#FF8A3D']], ['shell', 'sand', 3], ['starfish', 'sand', 2], ['ball', 'sand', 1]], add: [['shell', 'sand'], ['starfish', 'sand'], ['bird', 'sky'], ['boat', 'sea']] },
    { id: 'space', name: 'Outer space', bg: grad('g', '#0B0830', '#2a1b5e') + '<rect width="400" height="300" fill="url(#g)"/>' + stars,
      spawn: [['planet', 'any', 3], ['moon', 'any', 1, '#cfd2e8'], ['rocket', 'any', 2], ['ufo', 'any', 2], ['star', 'any', 5, '#FFE066'], ['alien', 'any', 2, ['#2ED9A3', '#8BD66B']], ['comet', 'any', 1, '#9fd8ff']], add: [['star', 'any'], ['comet', 'any'], ['alien', 'any']] },
    { id: 'winter', name: 'Winter village', bg: grad('g', '#bfe0ff', '#f1f8ff') + '<rect width="400" height="300" fill="url(#g)"/><path d="M0 175 Q100 145 200 172 T400 160 V300 H0Z" fill="#ffffff"/><path d="M0 225 Q120 200 230 222 T400 212 V300 H0Z" fill="#e6f1fb"/>',
      spawn: [['sun', 'sky', 1, '#fff2b0'], ['cloud', 'sky', 2, '#ffffff'], ['snowflake', 'sky', 4, '#8fb8e0'], ['pine', 'ground', 4, ['#2f7d5a', '#256d4d']], ['house', 'ground', 1, '#c96b5a'], ['snowman', 'ground', 2, PAL], ['gift', 'ground', 2], ['penguin', 'ground', 2, '#FF8A3D']], add: [['snowflake', 'sky'], ['gift', 'ground'], ['penguin', 'ground']] },
    { id: 'city', name: 'City street', bg: grad('g', '#ffb08a', '#ffe6c9') + '<rect width="400" height="300" fill="url(#g)"/><g fill="#c9a5b8" opacity=".6"><rect x="10" y="120" width="40" height="100"/><rect x="80" y="90" width="50" height="130"/><rect x="170" y="130" width="40" height="90"/><rect x="250" y="100" width="55" height="120"/><rect x="330" y="140" width="50" height="80"/></g><rect y="236" width="400" height="64" fill="#4d4a63"/><rect y="228" width="400" height="10" fill="#8d89a8"/><path d="M0 268 H400" stroke="#FFE066" stroke-width="3" stroke-dasharray="18 14"/>',
      spawn: [['cloud', 'sky', 2, '#ffffff'], ['bird', 'sky', 2, '#34305a'], ['balloon', 'sky', 2], ['building', 'ground', 4, ['#6a7bd1', '#d16a8a', '#5bb89a', '#d1a54a']], ['car', 'street', 2], ['lamp', 'ground', 3, '#FFE066'], ['tree', 'ground', 2, GREENS]], add: [['bird', 'sky'], ['lamp', 'ground'], ['balloon', 'sky']] },
    { id: 'sea', name: 'Under the sea', bg: grad('g', '#46c0f0', '#0b5c9c') + '<rect width="400" height="300" fill="url(#g)"/><g fill="#fff" opacity=".08"><polygon points="60,0 100,0 160,300 40,300"/><polygon points="220,0 260,0 330,300 200,300"/></g><path d="M0 245 Q100 225 200 243 T400 235 V300 H0Z" fill="#E8C98A"/>',
      spawn: [['fish', 'water', 6], ['jelly', 'water', 2, ['#FF9ACB', '#C7A6FF']], ['bubble', 'water', 4, '#ffffff'], ['seaweed', 'floor', 4, ['#2ED9A3', '#5bd16b']], ['chest', 'floor', 1, '#FFCF33'], ['crab', 'floor', 1, '#FF4D5E'], ['shell', 'floor', 2], ['starfish', 'floor', 2]], add: [['fish', 'water'], ['bubble', 'water'], ['starfish', 'floor']] }
  ];

  function g(o) { return `<g transform="translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) scale(${o.s.toFixed(2)})">${D[o.t](o.c)}</g>`; }
  const scene = (th, objs) => th.bg + objs.slice().sort((a, b) => a.y - b.y).map(g).join('');
  const colorFor = c => Array.isArray(c) ? Core.pick(c) : c || Core.pick(PAL);

  function make(nDiff, th, big) {
    const objs = [], free = (x, y, d) => objs.every(o => Math.hypot(o.x - x, o.y - y) > d);
    const spot = zone => { const [y0, y1] = Z[zone]; return [30 + Math.random() * 340, y0 + Math.random() * (y1 - y0)]; };
    function place(t, zone, c) { for (let k = 0; k < 90; k++) { const [x, y] = spot(zone); if (free(x, y, 54)) { const o = { t, x, y, s: 1, c: colorFor(c) }; objs.push(o); return o; } } return null; }
    th.spawn.forEach(([t, zone, n, c]) => { for (let i = 0; i < n; i++) place(t, zone, c); });
    const A = objs.map(o => ({ ...o })); let B = A.map(o => ({ ...o })); const diffs = [];
    const idx = Core.shuffle(A.map((_, i) => i)).slice(0, nDiff);
    const ops = Core.shuffle(['remove', 'recolor', 'resize', 'add', 'recolor', 'resize', 'remove', 'add', 'recolor']);
    idx.forEach((i, k) => {
      const op = ops[k % ops.length], o = B[i], r = RAD[o.t] * o.s + 8;
      if (op === 'remove') { diffs.push({ x: o.x, y: o.y, r }); o.gone = true; }
      else if (op === 'recolor') { let c = o.c, tries = 0; while (c === o.c && tries++ < 20) c = TINT.has(o.t) ? Core.pick(TINTS) : Core.pick(PAL); o.c = c; diffs.push({ x: o.x, y: o.y, r }); }
      else if (op === 'resize') { o.s *= Math.random() < .5 ? big[0] : big[1]; diffs.push({ x: o.x, y: o.y, r: RAD[o.t] * Math.max(1, o.s) + 8 }); }
      else { const [t, zone] = Core.pick(th.add); let ok = false; for (let q = 0; q < 70 && !ok; q++) { const [x, y] = spot(zone); if (A.every(a => Math.hypot(a.x - x, a.y - y) > 46) && diffs.every(d => Math.hypot(d.x - x, d.y - y) > 52)) { B.push({ t, x, y, s: 1.05, c: colorFor(null) }); diffs.push({ x, y, r: RAD[t] + 10 }); ok = true; } }
        if (!ok) { o.gone = true; diffs.push({ x: o.x, y: o.y, r }); } }
    });
    B = B.filter(o => !o.gone);
    return { a: scene(th, A), b: scene(th, B), diffs };
  }

  const LV = {
    easy: { n: 4, rounds: 3, mn: 6, mr: 2, big: [1.9, .5], pen: 5, hint: true },
    medium: { n: 5, rounds: 4, mn: 7, mr: 3, big: [1.6, .6], pen: 5, hint: true },
    hard: { n: 7, rounds: 5, mn: 8, mr: 3, big: [1.4, .7], pen: 6, hint: true },
    expert: { n: 9, rounds: 6, mn: 9, mr: 4, big: [1.3, .78], pen: 8, hint: false }
  };

  Core.register({
    id: 'diff',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, ROUNDS = ctx.multi ? L.mr : L.rounds, N = ctx.multi ? L.mn : L.n, themes = Core.shuffle(THEMES).concat(Core.shuffle(THEMES));
      let round = 0, found = [], sc, t0 = 0, tm = 0, penalty = 0, totalTime = 0, busy = false; const lt = []; const later = (f, ms) => { lt.push(setTimeout(f, ms)); };
      const secs = () => (Date.now() - t0) / 1000 + penalty;

      function begin() {
        const th = themes[round % themes.length]; sc = make(N, th, L.big); found = []; penalty = 0; busy = false; t0 = Date.now();
        const timeEl = h('span', { class: 'stat' }), left = h('span', { class: 'stat' }), msg = h('div', { class: 'msg', 'aria-live': 'polite' });
        const hintBtn = L.hint && !ctx.multi ? h('button', { class: 'btn sun sm', onclick: () => { const d = sc.diffs.find((_, i) => !found.includes(i)); if (!d) return; penalty += 10; msg.textContent = 'Hint: look near the glowing ring (+10s)'; msg.className = 'msg'; ring(d, '#FFCF33', true); } }, 'Hint') : null;
        const sa = h('div', { html: `<svg viewBox="0 0 400 300" aria-label="Scene A" role="img">${sc.a}</svg>` }).firstChild, sb = h('div', { html: `<svg viewBox="0 0 400 300" aria-label="Scene B, click here to mark differences" role="img">${sc.b}</svg>` }).firstChild;
        function ring(d, col, temp) { [sa, sb].forEach(s => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', d.x); c.setAttribute('cy', d.y); c.setAttribute('r', d.r); c.setAttribute('fill', 'none'); c.setAttribute('stroke', col); c.setAttribute('stroke-width', 4); s.append(c); if (temp) setTimeout(() => c.remove(), 1600); }); }
        const updateLeft = () => { left.textContent = 'Found ' + found.length + ' of ' + N; };
        function click(e) {
          if (busy) return; const s = e.currentTarget, r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 400, y = (e.clientY - r.top) / r.height * 300;
          const i = sc.diffs.findIndex((d, k) => !found.includes(k) && Math.hypot(d.x - x, d.y - y) <= d.r);
          if (i >= 0) {
            found.push(i); ring(sc.diffs[i], '#FF4D5E'); Core.sfx.ok(); if (ctx.multi) ctx.addScore(ctx.turn, 1); updateLeft(); msg.textContent = 'Found one!'; msg.className = 'msg good';
            if (found.length === N) { busy = true; clearInterval(tm); later(endRound, 700); }
          } else {
            Core.sfx.bad(); s.classList.add('miss'); setTimeout(() => s.classList.remove('miss'), 300);
            if (ctx.multi) { const p = ctx.nextTurn(); msg.textContent = 'Miss! ' + p.name + ', your turn'; msg.className = 'msg bad'; } else { penalty += L.pen; msg.textContent = 'Nothing there (+' + L.pen + 's)'; msg.className = 'msg bad'; }
          }
        }
        sa.addEventListener('pointerdown', click); sb.addEventListener('pointerdown', click);
        root.innerHTML = '';
        root.append(h('div', { class: 'sd' }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', { class: 'stat' }, th.name + ', scene ' + (round + 1) + ' of ' + ROUNDS), left, ctx.multi ? null : timeEl, hintBtn),
          h('div', { class: 'pair' }, sa, sb), msg));
        updateLeft(); clearInterval(tm); if (!ctx.multi) tm = setInterval(() => { timeEl.textContent = secs().toFixed(0) + 's'; }, 250);
      }
      function endRound() {
        const t = secs(); if (!ctx.multi) totalTime += t; round++;
        if (round >= ROUNDS) {
          if (ctx.multi) return ctx.finish({ unit: 'found' });
          const tt = Math.round(totalTime), nb = ctx.best(tt + 's (' + ctx.level + ')', tt, false); return ctx.finish({ title: 'All differences found!', body: ROUNDS + ' scenes in ' + tt + ' seconds (including penalties).' + (nb ? ' New best!' : '') });
        }
        Core.sfx.win(); Core.toast('Scene ' + round + ' done' + (ctx.multi ? '!' : ' in ' + t.toFixed(0) + 's!') + ' Next scene...'); begin();
      }
      begin();
      return () => { clearInterval(tm); lt.forEach(clearTimeout); };
    }
  });
})();
