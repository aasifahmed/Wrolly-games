/* Optical Illusions
   Quiz: nine classic illusions drawn as SVG, answer, then see the proof.
   Multiplayer: players take turns answering. Experience tab: illusions you watch rather than answer. */
(function () {
  const { h } = Core;

  Core.css('illusion', `
    .il{display:grid;gap:14px}
    .il svg{width:100%;max-width:520px;height:auto;margin:0 auto;display:block;border-radius:16px;border:3px solid var(--line);background:#fff;color:#1B1740}
    .il svg.dk{background:#000}
    .il .opts{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
    .il .why{padding:12px 16px;border-radius:14px;background:var(--paper);border:2.5px solid var(--line)}
    .il .q{font-family:var(--head);font-weight:700;font-size:1.3rem;text-align:center}
    .spin{animation:spin 7s linear infinite;transform-origin:50% 50%}
    .spin.rev{animation-direction:reverse}
    .lc circle{animation:lc 1.2s steps(1,end) infinite}
    @keyframes lc{0%{opacity:0}8.3%{opacity:1}100%{opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
  `);

  const S = (inner, vb = '0 0 400 240', cls = '') => `<svg viewBox="${vb}" class="${cls}" role="img" aria-label="Illusion">${inner}</svg>`;
  const ln = (x1, y1, x2, y2, w = 4, c = 'currentColor', extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
  const guide = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, 2.5, '#FF4D5E', 'stroke-dasharray="6 5"');
  const same = ['Top / left', 'Bottom / right', 'They are identical'];

  const Q = [
    { name: 'Muller-Lyer', q: 'Which horizontal line is longer?', opts: ['Top line', 'Bottom line', 'They are the same length'], a: 2,
      why: 'Both lines are exactly 220 units long. The outward fins make a line look shorter; the inward fins make it look longer.',
      svg: r => S(ln(90, 80, 310, 80) + ln(90, 80, 112, 62) + ln(90, 80, 112, 98) + ln(310, 80, 288, 62) + ln(310, 80, 288, 98) +
        ln(90, 170, 310, 170) + ln(90, 170, 68, 152) + ln(90, 170, 68, 188) + ln(310, 170, 332, 152) + ln(310, 170, 332, 188) + (r ? guide(90, 30, 90, 215) + guide(310, 30, 310, 215) : '')) },
    { name: 'Ebbinghaus', q: 'Which orange circle is bigger?', opts: ['Left', 'Right', 'They are the same size'], a: 2,
      why: 'Both orange circles have a radius of 26. Big neighbours make a circle feel small, small neighbours make it feel big.',
      svg: r => { let g = ''; for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; g += `<circle cx="${110 + 72 * Math.cos(t)}" cy="${120 + 72 * Math.sin(t)}" r="34" fill="#A9A6CC"/>`; }
        for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; g += `<circle cx="${290 + 45 * Math.cos(t)}" cy="${120 + 45 * Math.sin(t)}" r="9" fill="#A9A6CC"/>`; }
        g += `<circle cx="110" cy="120" r="26" fill="#FF8A3D"/><circle cx="290" cy="120" r="26" fill="#FF8A3D"/>`;
        if (r) g += `<circle cx="110" cy="120" r="29" fill="none" stroke="#1B1740" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="290" cy="120" r="29" fill="none" stroke="#1B1740" stroke-width="2.5" stroke-dasharray="5 4"/>`; return S(g); } },
    { name: 'Ponzo', q: 'Which bar is longer?', opts: ['Top bar', 'Bottom bar', 'They are the same length'], a: 2,
      why: 'Both bars are 100 units wide. The converging rails trick your brain into reading the upper bar as farther away, so it must be bigger.',
      svg: r => S(ln(55, 235, 185, 12, 3) + ln(345, 235, 215, 12, 3) + ln(150, 70, 250, 70, 9, '#FF5FA2') + ln(150, 170, 250, 170, 9, '#FF5FA2') + (r ? guide(150, 30, 150, 200) + guide(250, 30, 250, 200) : '')) },
    { name: 'Cafe wall', q: 'Are the horizontal grey lines perfectly parallel?', opts: ['Yes, they are parallel', 'No, they slope'], a: 0,
      why: 'Every line is perfectly horizontal. The shifted rows of tiles create fake diagonal tilts where the tiles meet the mortar lines.',
      svg: r => { let g = ''; for (let i = 0; i < 8; i++) for (let j = -2; j < 7; j++) { const x = j * 80 + (i % 2) * 20; g += `<rect x="${x}" y="${i * 30}" width="40" height="30" fill="#1B1740"/>`; }
        for (let i = 0; i <= 8; i++) g += ln(0, i * 30, 400, i * 30, 3, r ? '#FF4D5E' : '#9a9ab0'); return S(g); } },
    { name: 'Zollner', q: 'Are the four long lines parallel?', opts: ['Yes, they are parallel', 'No, they lean'], a: 0,
      why: 'All four lines are perfectly horizontal. The short hatch marks alternate direction and bend how we perceive the long lines.',
      svg: r => { let g = ''; for (let i = 0; i < 4; i++) { const y = 35 + i * 55, d = i % 2 ? -1 : 1; for (let x = 50; x < 360; x += 22) g += ln(x - 10 * d, y - 12, x + 10 * d, y + 12, 2.5); g += ln(20, y, 380, y, 4, r ? '#FF4D5E' : 'currentColor'); } return S(g); } },
    { name: 'Hermann grid', q: 'Do the white crossings between the black squares contain grey dots?', opts: ['Yes, there are grey dots', 'No, they are pure white'], a: 1,
      why: 'The crossings are pure white. Your retina compares light across neighbouring cells, and that fake dimming creates ghost dots where you are not looking.',
      svg: r => { let g = ''; for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) g += `<rect x="${40 + j * 62}" y="${14 + i * 54}" width="50" height="42" rx="3" fill="#000"/>`;
        if (r) for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) g += `<circle cx="${40 + j * 62 + 56}" cy="${14 + i * 54 + 48}" r="7" fill="none" stroke="#2ED9A3" stroke-width="3"/>`; return S(g); } },
    { name: 'Simultaneous contrast', q: 'Which little square is darker?', opts: ['Left', 'Right', 'They are the same shade'], a: 2,
      why: 'Both squares are the same grey (#888). Brains judge shade relative to the surroundings, so the one on the light side looks darker.',
      svg: r => S(`<rect width="200" height="240" fill="#e8e8e8"/><rect x="200" width="200" height="240" fill="#222"/><rect x="140" y="85" width="50" height="70" fill="#888"/><rect x="210" y="85" width="50" height="70" fill="#888"/>` + (r ? `<rect x="190" y="105" width="20" height="30" fill="#888"/>` : ''), '0 0 400 240') },
    { name: 'Vertical-horizontal', q: 'Which line is longer, the upright or the sideways one?', opts: ['Upright line', 'Sideways line', 'They are the same length'], a: 2,
      why: 'Both lines are 180 units. We tend to overestimate vertical distances, a bias that makes tall hats and bottles look bigger than they are.',
      svg: r => S(ln(200, 30, 200, 210, 7, '#7B5CFF') + ln(110, 210, 290, 210, 7, '#7B5CFF') + (r ? guide(110, 30, 290, 30) + guide(110, 30, 110, 210) : '')) },
    { name: 'Poggendorff', q: 'Which marked line on the right continues the diagonal on the left?', opts: ['A', 'B', 'C'], a: 0,
      why: 'The dashed line shows the true path. A thick barrier makes our eyes misjudge where an angled line comes out the other side.',
      svg: (r, st) => { const yt = 80.8, ys = st.order.map(k => yt + (k - 1) * 26); let g = `<rect x="160" y="10" width="80" height="220" fill="#B9B4E8" stroke="currentColor" stroke-width="3"/>` + ln(30, 210, 160, 130, 4);
        ys.forEach((y, i) => { g += ln(240, y, 340, y - 61.5, 4) + `<text x="352" y="${y - 55}" font-family="Fredoka,sans-serif" font-weight="700" font-size="22" fill="currentColor">${'ABC'[i]}</text>`; });
        if (r) g += guide(30, 210, 340, 210 - 310 * .615 + 0); return S(g); } }
    ,{ name: 'Delboeuf', q: 'Which orange circle is bigger?', opts: ['Left', 'Right', 'They are the same size'], a: 2,
      why: 'Both orange circles have a radius of 24. A tight ring around a circle makes it look bigger, a wide ring makes it look smaller.',
      svg: r => S(`<circle cx="110" cy="120" r="33" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="290" cy="120" r="66" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="110" cy="120" r="24" fill="#FF8A3D"/><circle cx="290" cy="120" r="24" fill="#FF8A3D"/>` + (r ? `<circle cx="110" cy="120" r="28" fill="none" stroke="#FF4D5E" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="290" cy="120" r="28" fill="none" stroke="#FF4D5E" stroke-width="2.5" stroke-dasharray="5 4"/>` : '')) },
    { name: 'Hering', q: 'Are the two red lines straight and parallel?', opts: ['Yes, perfectly straight', 'No, they bow outward'], a: 0,
      why: 'Both red lines are ruler straight. The rays radiating from the middle make our brain bend the lines away from the centre.',
      svg: r => { let g = ''; for (let k = 0; k < 15; k++) { const a = k * Math.PI / 15; g += ln(200 - Math.cos(a) * 260, 120 - Math.sin(a) * 260, 200 + Math.cos(a) * 260, 120 + Math.sin(a) * 260, 2.2); } g += ln(0, 80, 400, 80, 5, '#FF4D5E') + ln(0, 160, 400, 160, 5, '#FF4D5E'); if (r) g += ln(0, 80, 400, 80, 1.5, '#fff') + ln(0, 160, 400, 160, 1.5, '#fff'); return S(g); } },
    { name: 'Gradient bar', q: 'Is the middle bar one uniform shade of grey?', opts: ['Yes, one uniform grey', 'No, it fades from dark to light'], a: 0,
      why: 'The bar is one solid grey (#888). The background gradient makes the left end look lighter and the right end look darker.',
      svg: r => S(`<defs><linearGradient id="gb"><stop offset="0" stop-color="#101010"/><stop offset="1" stop-color="#f4f4f4"/></linearGradient></defs><rect width="400" height="240" fill="${r ? '#fff' : 'url(#gb)'}"/><rect x="30" y="85" width="340" height="70" fill="#888"/>`) },
    { name: 'Cornsweet', q: 'Compare the far left and far right areas. Which is lighter?', opts: ['Far left', 'Far right', 'They are the same grey'], a: 2,
      why: 'Both outer areas are the same grey. The light and dark edges by the middle fool your brain into spreading that difference across each whole side.',
      svg: r => S(`<defs><linearGradient id="cl"><stop offset="0" stop-color="#999"/><stop offset=".55" stop-color="#999"/><stop offset="1" stop-color="#c8c8c8"/></linearGradient><linearGradient id="cr"><stop offset="0" stop-color="#6a6a6a"/><stop offset=".45" stop-color="#999"/><stop offset="1" stop-color="#999"/></linearGradient></defs><rect width="200" height="240" fill="url(#cl)"/><rect x="200" width="200" height="240" fill="url(#cr)"/>` + (r ? `<rect x="105" width="190" height="240" fill="#000"/>` : '')) },
    { name: 'Ouchi', q: 'Is anything in this picture actually moving?', opts: ['Yes, the centre wobbles', 'No, it is perfectly still'], a: 1,
      why: 'Nothing moves. Two checker patterns at right angles confuse your eye movement system, so the centre seems to shimmer against the background.',
      svg: r => { let g = '<defs><clipPath id="oc"><circle cx="200" cy="120" r="68"/></clipPath></defs>'; for (let i = 0; i < 40; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) g += `<rect x="${i * 10}" y="${j * 30}" width="10" height="30" fill="#000"/>`;
        g += '<g clip-path="url(#oc)"><rect x="120" y="40" width="160" height="160" fill="#fff"/>'; for (let i = 0; i < 14; i++) for (let j = 0; j < 20; j++) if ((i + j) % 2) g += `<rect x="${i * 30 - 10}" y="${j * 10 + 20}" width="30" height="10" fill="#000"/>`; g += '</g>';
        if (r) g += `<circle cx="200" cy="120" r="70" fill="none" stroke="#2ED9A3" stroke-width="4"/>`; return S(g); } },
    { name: 'Kanizsa triangle', q: 'Is there a white triangle actually drawn on the page?', opts: ['Yes, a white triangle is drawn', 'No, only three shapes with wedges'], a: 1,
      why: 'No triangle is drawn. Your brain fills in the missing edges to make sense of three notched circles. These are called illusory contours.',
      svg: r => { const V = [[200, 52], [118, 190], [282, 190]], cx = 200, cy = 144; let g = ''; V.forEach(([x, y]) => { const a = Math.atan2(cy - y, cx - x); g += `<circle cx="${x}" cy="${y}" r="34" fill="#000"/><path d="M${x} ${y} L${x + 60 * Math.cos(a - .55)} ${y + 60 * Math.sin(a - .55)} L${x + 60 * Math.cos(a + .55)} ${y + 60 * Math.sin(a + .55)}Z" fill="#fff"/>`; });
        if (r) g += `<polygon points="${V.map(v => v.join(',')).join(' ')}" fill="none" stroke="#FF4D5E" stroke-width="2.5" stroke-dasharray="6 5"/>`; return S(g); } }
    ,{ name: 'Orbison', q: 'Are the sides of the red square perfectly straight?', opts: ['Yes, perfectly straight', 'No, they bend'], a: 0,
      why: 'The red square is a true square. The circles behind it make its sides look bowed and its corners look pinched.',
      svg: r => { let g = ''; if (!r) for (let k = 10; k < 230; k += 13) g += `<circle cx="200" cy="120" r="${k}" fill="none" stroke="currentColor" stroke-width="2"/>`; g += `<rect x="150" y="70" width="100" height="100" fill="none" stroke="#FF4D5E" stroke-width="4.5"/>`; return S(g); } },
    { name: 'Checker shadow', q: 'Which marked square is lighter, A or B?', opts: ['Square A', 'Square B', 'They are the same shade'], a: 2,
      why: 'A and B are exactly the same grey (#5A5A5A). Your brain discounts shadows, so it brightens B to compensate for being in the dark.',
      svg: r => { let g = ''; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) g += `<rect x="${20 + i * 60}" y="${j * 60}" width="60" height="60" fill="${(i + j) % 2 ? '#5a5a5a' : '#c8c8c8'}"/>`;
        g += `<rect x="200" width="180" height="240" fill="#000" opacity=".55"/><text x="50" y="97" font-family="Fredoka,sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#fff">A</text><text x="350" y="97" font-family="Fredoka,sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#fff">B</text>`;
        if (r) g += `<rect x="62" y="78" width="276" height="24" fill="#5a5a5a"/><text x="50" y="97" font-family="Fredoka,sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#fff">A</text><text x="350" y="97" font-family="Fredoka,sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="#fff">B</text>`; return S(g); } },
    { name: 'Tilt illusion', q: 'Are the lines inside the small circle perfectly vertical?', opts: ['Yes, perfectly vertical', 'No, they lean'], a: 0,
      why: 'The centre lines are exactly vertical. The tilted lines around them push our perception of angle the opposite way.',
      svg: r => { let g = '<defs><clipPath id="tc1"><circle cx="200" cy="120" r="112"/></clipPath><clipPath id="tc2"><circle cx="200" cy="120" r="52"/></clipPath></defs><g clip-path="url(#tc1)"><g transform="rotate(20 200 120)">'; for (let x = 60; x < 340; x += 9) g += ln(x, -60, x, 300, 3);
        g += '</g></g><circle cx="200" cy="120" r="58" fill="#fff"/><g clip-path="url(#tc2)">'; for (let x = 140; x < 262; x += 9) g += ln(x, 60, x, 180, 3); g += '</g>'; if (r) g += guide(200, 20, 200, 220); return S(g); } },
    { name: 'Top hat', q: 'Which is longer: the height of the hat or the width of its brim?', opts: ['The height', 'The brim width', 'They are the same'], a: 2,
      why: 'The hat is exactly as tall as the brim is wide (120 units). Vertical lengths seem stretched compared with horizontal ones.',
      svg: r => S(`<rect x="165" y="60" width="70" height="120" fill="#7B5CFF"/><rect x="140" y="180" width="120" height="14" rx="3" fill="#7B5CFF"/><rect x="165" y="150" width="70" height="12" fill="#FFCF33"/>` + (r ? `<rect x="140" y="60" width="120" height="120" fill="none" stroke="#FF4D5E" stroke-width="2.5" stroke-dasharray="6 5"/>` : '')) },
    { name: 'Ehrenstein', q: 'Is the red shape a perfect circle?', opts: ['Yes, a perfect circle', 'No, it is squarish'], a: 0,
      why: 'It is a true circle. The lines meeting it at right angles pull its outline inward, flattening the circle into a rounded square.',
      svg: r => { let g = ''; if (!r) for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16; g += ln(200 + Math.cos(a) * 34, 120 + Math.sin(a) * 34, 200 + Math.cos(a) * 115, 120 + Math.sin(a) * 115, 2.2); } g += `<circle cx="200" cy="120" r="78" fill="none" stroke="#FF4D5E" stroke-width="4.5"/>`; return S(g); } },
    { name: 'Oppel-Kundt', q: 'Is the red marker exactly halfway along the line?', opts: ['Yes, exactly halfway', 'No, it is left of the middle', 'No, it is right of the middle'], a: 0,
      why: 'The marker sits exactly in the middle (at 200 of 40 to 360). A stretch filled with ticks looks longer than an empty one of the same size.',
      svg: r => { let g = ln(40, 120, 360, 120, 3) + ln(40, 100, 40, 140, 4) + ln(360, 100, 360, 140, 4); for (let x = 48; x < 200; x += 8) g += ln(x, 108, x, 132, 2); g += ln(200, 85, 200, 155, 5, '#FF4D5E'); if (r) g += guide(120, 60, 120, 180) + guide(280, 60, 280, 180); return S(g); } }
  ];

  Core.register({
    id: 'illusion',
    mount(ctx) {
      const LV = { easy: { n: 8, per: 3, time: 0 }, medium: { n: 10, per: 4, time: 30 }, hard: { n: 12, per: 5, time: 20 }, expert: { n: 15, per: 6, time: 12 } }, L = LV[ctx.level] || LV.easy;
      const root = ctx.root; let tab = 'quiz', alive = true, tm = 0, qt = 0;
      const total = ctx.multi ? L.per * ctx.players.length : L.n;

      function shell(body) {
        clearInterval(tm); clearInterval(qt); root.innerHTML = '';
        root.append(h('div', { class: 'il' }, h('div', { class: 'row c' }, h('div', { class: 'seg' }, [['quiz', 'Quiz'], ['see', 'Experience']].map(([k, t]) => h('button', { 'aria-pressed': tab === k, onclick: () => { tab = k; k === 'quiz' ? quiz() : see(); } }, t)))), body));
      }

      /* ---------- quiz ---------- */
      let deck, n;
      function quiz(fresh) {
        if (fresh !== false && (!deck || n >= total)) { deck = Core.shuffle(Q).concat(Core.shuffle(Q)).slice(0, total); n = 0; ctx.players.forEach(p => p.score = 0); ctx.setTurn(0); }
        tab = 'quiz';
        if (n >= total) return;
        const it = deck[n]; if (ctx.multi) ctx.setTurn(n % ctx.players.length);
        const st = { order: Core.shuffle([0, 1, 2]) };
        let opts = it.opts, ans = it.a; if (it.name === 'Poggendorff') ans = st.order.indexOf(1);
        let done = false, left = L.time; const holder = h('div', { html: it.svg(false, st) }), why = h('div', { class: 'why', hidden: true }), msg = h('div', { class: 'msg', 'aria-live': 'polite' }), bar = h('i');
        const nextBtn = h('button', { class: 'btn mint', hidden: true, onclick: () => { n++; if (n >= total) finish(); else quiz(false); } }, n + 1 >= total ? 'See results' : 'Next illusion');
        function answer(i) {
          if (done) return; done = true; clearInterval(qt); const ok = i === ans;
          bs.forEach((b, k) => { b.disabled = true; if (k === ans) b.classList.add('mint'); else if (k === i) b.classList.add('pink'); });
          holder.innerHTML = it.svg(true, st); ok ? Core.sfx.ok() : Core.sfx.bad();
          if (ok) ctx.addScore(ctx.multi ? ctx.turn : 0, 1); else ctx.paint();
          msg.textContent = i < 0 ? 'Out of time! Your eyes were fooled.' : ok ? 'You saw through it!' : 'Fooled! Your eyes are normal.'; msg.className = 'msg ' + (ok ? 'good' : 'bad');
          why.hidden = false; why.textContent = it.why; nextBtn.hidden = false; nextBtn.focus();
        }
        const bs = opts.map((o, i) => h('button', { class: 'btn alt', onclick: () => answer(i) }, o));
        shell(h('div', { class: 'il' }, h('div', { class: 'muted center' }, it.name + ', ' + (n + 1) + ' of ' + total + (ctx.multi ? ', ' + ctx.player.name + "'s turn" : '')),
          L.time ? h('div', { class: 'bar' }, bar) : null, h('div', { class: 'q' }, it.q), holder, h('div', { class: 'opts' }, bs), msg, why, h('div', { class: 'row c' }, nextBtn)));
        if (L.time) qt = setInterval(() => { left--; bar.style.width = (left / L.time * 100) + '%'; if (left <= 0) answer(-1); }, 1000);
      }
      function finish() {
        const s = ctx.players.reduce((a, p) => a + p.score, 0);
        if (!ctx.multi) { const nb = ctx.best(ctx.players[0].score + ' of ' + total, ctx.players[0].score); return ctx.finish({ title: ctx.players[0].score >= 7 ? 'Eagle eyes!' : 'Eyes fooled', body: 'You resisted ' + ctx.players[0].score + ' of ' + total + ' illusions.' + (nb ? ' New best!' : '') }); }
        ctx.finish({ unit: 'correct', body: s + ' of ' + total + ' illusions resisted as a group.' });
      }

      /* ---------- experience ---------- */
      function see() {
        tab = 'see';
        const cd = h('div', { class: 'msg' });
        const spiral = (() => { let d = 'M200 120'; for (let t = 0; t < 22; t += .12) { const r = 4 + t * 5; d += ` L${200 + r * Math.cos(t)} ${120 + r * Math.sin(t)}`; } return d; })();
        const spinSvg = h('div', { html: S(`<rect width="400" height="240" fill="#fff"/><g class="spin"><path d="${spiral}" fill="none" stroke="#1B1740" stroke-width="7" stroke-linecap="round"/></g><circle cx="200" cy="120" r="5" fill="#FF4D5E"/>`) });
        let grid = ''; for (let i = 0; i <= 6; i++) { grid += ln(0, 20 + i * 36, 400, 20 + i * 36, 9, '#4a4a58') + ln(30 + i * 56, 0, 30 + i * 56, 240, 9, '#4a4a58'); }
        for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) grid += `<circle cx="${30 + j * 56}" cy="${20 + i * 36}" r="5" fill="#fff"/>`;
        let tro = `<defs><radialGradient id="tg"><stop offset="55%" stop-color="#9FD3FF" stop-opacity=".95"/><stop offset="100%" stop-color="#9FD3FF" stop-opacity="0"/></radialGradient></defs><rect width="400" height="240" fill="#B9B4A8"/>`;
        [[90, 120], [310, 120]].forEach(([x, y]) => { tro += `<circle cx="${x}" cy="${y}" r="52" fill="url(#tg)"/>`; });
        tro += ln(188, 120, 212, 120, 4, '#1B1740') + ln(200, 108, 200, 132, 4, '#1B1740');
        let after = h('div', { html: S(`<rect width="400" height="240" fill="#fff"/><path d="M200 205 C60 120 110 40 200 95 C290 40 340 120 200 205Z" fill="#00E5FF"/><circle cx="200" cy="118" r="6" fill="#000"/>`) });
        const swapBtn = h('button', { class: 'btn sm sun', onclick: () => { after.innerHTML = S(`<rect width="400" height="240" fill="#fff"/><circle cx="200" cy="118" r="6" fill="#000"/>`); swapBtn.disabled = true; } }, 'Now look at the blank screen');
        const card = (t, p, ...x) => h('div', { class: 'stack', style: { marginBottom: '14px' } }, h('h3', null, t), h('p', { class: 'muted', style: { margin: 0 } }, p), ...x);
        const startBtn = h('button', { class: 'btn sm', onclick: () => { let s = 20; startBtn.disabled = true; clearInterval(tm); tm = setInterval(() => { s--; cd.textContent = s > 0 ? 'Keep staring at the red dot: ' + s : 'Now look at your hand or the text below. It will seem to breathe.'; if (s <= 0) { clearInterval(tm); spinSvg.firstChild.querySelector('.spin').style.animationPlayState = 'paused'; } }, 1000); cd.textContent = 'Keep staring at the red dot: 20'; } }, 'Start the 20 second stare');
        shell(h('div', { class: 'stack' },
          card('Spinning spiral', 'Stare at the red dot while the spiral turns, then look away at something still.', spinSvg, h('div', { class: 'row c' }, startBtn), cd),
          card('Scintillating grid', 'Move your eyes across the grid. Dark dots flicker in and out of the white ones, but never stay put.', h('div', { html: S(grid, '0 0 400 240', 'dk') })),
          card('Fading rings', 'Stare at the plus sign for about ten seconds without moving your eyes. The blue glows disappear.', h('div', { html: S(tro) })),
          card('Lilac chaser', 'Stare at the black cross. A gap seems to chase around the ring, the pink dots may turn green, and finally the dots seem to vanish.', h('div', { html: S((() => { let c = '<rect width="400" height="240" fill="#c9c9c9"/><g class="lc">'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c += `<circle cx="${200 + Math.cos(a) * 80}" cy="${120 + Math.sin(a) * 80}" r="15" fill="#ff7ad9" style="animation-delay:${(-(12 - k) * .1).toFixed(2)}s"/>`; } return c + '</g>' + ln(190, 120, 210, 120, 3, '#000') + ln(200, 110, 200, 130, 3, '#000'); })()) })),
          card('Colour afterimage', 'Stare at the dot on the cyan heart for twenty seconds, then press the button and keep looking at the dot.', after, h('div', { class: 'row c' }, swapBtn))));
      }

      quiz();
      return () => { alive = false; clearInterval(tm); clearInterval(qt); };
    }
  });
})();
