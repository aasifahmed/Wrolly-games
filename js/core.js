/* Pocket Arcade - core engine (hub, router, players, sound, helpers). No dependencies. */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const k in props || {}) {
      const v = props[k];
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') {
        for (const s in v) s.startsWith('--') ? e.style.setProperty(s, v[s]) : (e.style[s] = v[s]);
      } else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const $ = (s, r = document) => r.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* Emoji are drawn from local SVG files (assets/emoji, Twemoji) so they look the same everywhere. */
  const EMO_RE = /[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}[\u{1F3FB}-\u{1F3FF}]?(?:\uFE0F|\u20E3)?(?:\u200D\p{Extended_Pictographic}[\u{1F3FB}-\u{1F3FF}]?\uFE0F?)*/gu;
  function emoFile(str) { let cps = [...str].map(c => c.codePointAt(0).toString(16)); if (!cps.includes('200d')) cps = cps.filter(c => c !== 'fe0f'); return cps.join('-'); }
  function emo(str, cls) {
    const w = document.createElement('span'); w.className = 'emo' + (cls ? ' ' + cls : ''); let last = 0;
    for (const m of String(str).matchAll(EMO_RE)) {
      if (m.index > last) w.append(str.slice(last, m.index));
      const img = document.createElement('img'); img.className = 'ej'; img.alt = m[0]; img.draggable = false; img.src = 'assets/emoji/' + emoFile(m[0]) + '.svg';
      img.onerror = () => img.replaceWith(document.createTextNode(m[0])); w.append(img); last = m.index + m[0].length;
    }
    if (last < str.length) w.append(str.slice(last)); return w;
  }

  function hash(str) { let x = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { x = Math.imul(x ^ str.charCodeAt(i), 3432918353); x = (x << 13) | (x >>> 19); } x = Math.imul(x ^ (x >>> 16), 2246822507); x = Math.imul(x ^ (x >>> 13), 3266489909); return (x ^= x >>> 16) >>> 0; }
  function rng(seed) { let a = typeof seed === 'string' ? hash(seed) : seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, r = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pick(arr, r = Math.random) { return arr[Math.floor(r() * arr.length)]; }
  function dayKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pa:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pa:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  function css(id, text) { if (document.getElementById('css-' + id)) return; const s = document.createElement('style'); s.id = 'css-' + id; s.textContent = text; document.head.append(s); }

  function toast(msg, ms = 1800) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), ms); }

  function modal(content) {
    const m = h('div', { class: 'modal' }, content);
    const close = () => { m.remove(); document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); };
    m.addEventListener('mousedown', e => { if (e.target === m) close(); });
    document.addEventListener('keydown', esc);
    document.body.append(m);
    const f = m.querySelector('button,input'); if (f) f.focus();
    return { close, el: m };
  }

  /* ---------- sound (WebAudio, nothing to download) ---------- */
  let ac = null, muted = store.get('muted', false);
  function audio() { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(freq, dur = .15, type = 'sine', vol = .15, when = 0, slideTo) {
    if (muted) return; const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
  }
  const sfx = {
    tone, audio,
    get muted() { return muted; }, set muted(v) { muted = v; store.set('muted', v); },
    click() { tone(520, .06, 'triangle', .1); },
    ok() { tone(660, .12, 'triangle', .15); tone(880, .16, 'triangle', .15, .1); },
    bad() { tone(200, .22, 'sawtooth', .12, 0, 110); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, 'triangle', .15, i * .09)); },
    tick() { tone(900, .04, 'square', .05); }
  };

  /* ---------- confetti ---------- */
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('canvas', { class: 'confetti', 'aria-hidden': 'true' }); document.body.append(c);
    const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#FF8A3D', '#FF5FA2', '#2DC4F5', '#7B5CFF', '#FFCF33', '#2ED9A3'];
    const ps = Array.from({ length: 140 }, () => ({ x: c.width / 2, y: c.height * .4, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 3, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: pick(cols) }));
    let f = 0;
    (function step() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); x.restore(); }); if (++f < 120) requestAnimationFrame(step); else c.remove(); })();
  }

  /* ---------- game manifest (each game lives in its own file) ---------- */
  const GAMES = [
    { id: 'word', title: 'Daily Word', emoji: '🔤', color: 'var(--mint)', blurb: 'Crack a five-letter word in six tries. A new one every day.', modes: ['solo', 'multi'], daily: true, file: 'js/games/word.js' },
    { id: 'sound', title: 'Guess the Sound', emoji: '🔊', color: 'var(--sky)', blurb: 'Listen closely and name what you hear.', modes: ['solo', 'multi'], file: 'js/games/sound.js' },
    { id: 'emoji', title: 'Emoji Guess', emoji: '🤔', color: 'var(--sun)', blurb: 'Decode movies, phrases and places written in emoji.', modes: ['solo', 'multi'], file: 'js/games/emoji.js' },
    { id: 'memory', title: 'Memory Challenge', emoji: '🧠', color: 'var(--pink)', blurb: 'Match the pairs or repeat the glowing sequence.', modes: ['solo', 'multi'], file: 'js/games/memory.js' },
    { id: 'illusion', title: 'Optical Illusions', emoji: '👁️', color: 'var(--violet)', blurb: 'Your eyes will lie to you. Try to spot how.', modes: ['solo', 'multi'], file: 'js/games/illusions.js' },
    { id: 'diff', title: 'Spot the Difference', emoji: '🔍', color: 'var(--tangerine)', blurb: 'Two scenes, a handful of sneaky changes.', modes: ['solo', 'multi'], file: 'js/games/spotdiff.js' },
    { id: 'reaction', title: 'Reaction Test', emoji: '⚡', color: 'var(--sun)', blurb: 'How fast can you react? Go head to head on one keyboard.', modes: ['solo', 'multi'], file: 'js/games/reaction.js' },
    { id: 'draw', title: 'Drawing Challenge', emoji: '🎨', color: 'var(--pink)', blurb: 'Get a prompt, draw it before the clock runs out.', modes: ['solo', 'multi'], file: 'js/games/drawing.js' },
    { id: 'crossword', title: 'Daily Mini Crossword', emoji: '✏️', color: 'var(--sky)', blurb: 'A fresh bite-sized crossword every day.', modes: ['solo'], daily: true, file: 'js/games/crossword.js' },
    { id: 'creative', title: 'Creative Challenges', emoji: '🎲', color: 'var(--mint)', blurb: 'Random prompts to write, build, draw or act out.', modes: ['solo', 'multi'], file: 'js/games/creative.js' }
  ];
  const LEVELS = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard'], ['expert', 'Expert']];
  const COLORS = ['#FF5FA2', '#2DC4F5', '#FFCF33', '#2ED9A3'];
  const defs = {};
  const Core = { h, $, sleep, emo, hash, rng, shuffle, pick, dayKey, store, css, toast, modal, sfx, confetti, tone, defs, GAMES, COLORS,
    register(def) { defs[def.id] = def; } };
  window.Core = Core;

  /* ---------- activity / streak ---------- */
  function recordDay() { const d = store.get('days', []); const k = dayKey(); if (!d.includes(k)) { d.push(k); store.set('days', d.slice(-400)); } }
  function streak() {
    const d = new Set(store.get('days', [])); let n = 0; const t = new Date();
    if (!d.has(dayKey(t))) t.setDate(t.getDate() - 1);
    while (d.has(dayKey(t))) { n++; t.setDate(t.getDate() - 1); }
    return n;
  }

  /* ---------- hub ---------- */
  const hub = $('#hub'), gameEl = $('#game'), streakEl = $('#streak');
  let filter = 'all';
  function renderStreak() { const n = streak(); streakEl.hidden = !n; streakEl.replaceChildren(emo('🔥'), ' ' + n + (n === 1 ? ' day' : ' days')); }
  function renderHub() {
    const grid = $('#grid'); grid.innerHTML = '';
    GAMES.filter(g => filter === 'all' || (filter === 'multi' && g.modes.includes('multi')) || (filter === 'daily' && g.daily) || (filter === 'solo' && g.modes.includes('solo')))
      .forEach(g => {
        const best = store.get('best:' + g.id, null), done = g.daily && store.get('daily:' + g.id) === dayKey();
        grid.append(h('button', { class: 'tile', style: { '--c': g.color }, onclick: () => { sfx.click(); location.hash = '#/' + g.id; } },
          h('div', { class: 'art' }, h('i', { 'aria-hidden': 'true' }, emo(g.emoji))),
          h('div', { class: 'info' }, h('h3', null, g.title), h('p', null, g.blurb),
            h('div', { class: 'tags' },
              g.modes.includes('multi') ? h('span', { class: 'tag' }, 'Solo or 2-4 players') : h('span', { class: 'tag' }, 'Solo'),
              g.daily ? h('span', { class: 'tag' + (done ? ' done' : '') }, done ? 'Done today' : 'Daily') : null,
              best ? h('span', { class: 'tag' }, 'Best: ' + best.text) : null))));
      });
  }
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    filter = c.dataset.f; document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === c)); renderHub();
  }));
  $('#surprise').addEventListener('click', () => { sfx.click(); location.hash = '#/' + pick(GAMES).id; });

  /* theme + sound toggles */
  const root = document.documentElement;
  const themeBtn = $('#theme'), soundBtn = $('#sound');
  const ICON = {
    sun: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>',
    on: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
    off: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'
  };
  function applyTheme(t) { root.dataset.theme = t; themeBtn.innerHTML = t === 'dark' ? ICON.sun : ICON.moon; themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
  applyTheme(store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => { const t = root.dataset.theme === 'dark' ? 'light' : 'dark'; store.set('theme', t); applyTheme(t); });
  function applySound() { soundBtn.innerHTML = sfx.muted ? ICON.off : ICON.on; soundBtn.setAttribute('aria-label', sfx.muted ? 'Turn sound on' : 'Turn sound off'); }
  applySound();
  soundBtn.addEventListener('click', () => { sfx.muted = !sfx.muted; applySound(); sfx.click(); });
  $('#home').addEventListener('click', () => { location.hash = ''; });

  /* ---------- game loading + session ---------- */
  function load(meta) {
    if (defs[meta.id]) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = meta.file; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + meta.file)); document.head.append(s);
    });
  }

  let active = null;
  function stop() { if (active) { try { active.cleanup && active.cleanup(); } catch (e) { console.error(e); } active = null; } }

  function setupDialog(meta) {
    return new Promise(resolve => {
      if (!meta.modes.includes('multi')) return resolve({ mode: 'solo', names: ['You'] });
      let mode = 'solo', count = 2;
      const saved = store.get('names', ['Player 1', 'Player 2', 'Player 3', 'Player 4']);
      const list = h('div', { class: 'plist' });
      const seg = (opts, get, set) => { const w = h('div', { class: 'seg', role: 'group' }); opts.forEach(([v, t]) => { const b = h('button', { 'aria-pressed': get() === v, onclick: () => { set(v); [...w.children].forEach((x, i) => x.setAttribute('aria-pressed', opts[i][0] === v)); paint(); } }, t); w.append(b); }); return w; };
      function paint() {
        list.innerHTML = ''; prow.hidden = mode === 'solo'; list.hidden = mode === 'solo';
        for (let i = 0; i < count; i++) list.append(h('label', null, h('i', { style: { '--pc': COLORS[i] } }), h('input', { type: 'text', value: saved[i], maxlength: 14, 'aria-label': 'Player ' + (i + 1) + ' name', oninput: e => { saved[i] = e.target.value; } })));
      }
      const cnt = seg([[2, '2'], [3, '3'], [4, '4']], () => count, v => { count = v; });
      const prow = h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Players'), cnt);
      const modeSeg = seg([['solo', 'Solo'], ['multi', 'Multiplayer']], () => mode, v => { mode = v; });
      const m = modal(h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Choose how to play' },
        h('h2', null, meta.emoji + ' ' + meta.title), h('p', { class: 'muted', style: { margin: 0 } }, meta.blurb),
        modeSeg, prow, list,
        h('div', { class: 'row' }, h('button', { class: 'btn mint', onclick: () => { store.set('names', saved); m.close(); resolve({ mode, names: mode === 'solo' ? ['You'] : saved.slice(0, count).map((n, i) => n.trim() || 'Player ' + (i + 1)) }); } }, 'Start playing'),
          h('button', { class: 'btn alt', onclick: () => { m.close(); resolve(null); } }, 'Cancel'))));
      paint();
    });
  }

  async function start(meta, setup) {
    try { await load(meta); } catch (e) { toast(e.message); location.hash = ''; return; }
    const def = defs[meta.id];
    stop(); hub.hidden = true; gameEl.hidden = false; window.scrollTo(0, 0); recordDay(); renderStreak();
    const multi = setup.mode === 'multi';
    const players = setup.names.map((n, i) => ({ name: n, color: COLORS[i], score: 0 }));
    const stage = h('div', { class: 'stage' }), scores = h('div', { class: 'scores', 'aria-live': 'polite' });
    let level = store.get('level:' + meta.id, 'easy'); if (!LEVELS.some(l => l[0] === level)) level = 'easy';
    const restartBtn = h('button', { class: 'btn alt sm', onclick: () => run() }, 'Restart');
    const lvBtns = LEVELS.map(([id, t]) => h('button', { 'aria-pressed': id === level, onclick: () => setLevel(id) }, t));
    const lvSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Level' }, lvBtns);
    function setLevel(id) { level = id; ctx.level = id; store.set('level:' + meta.id, id); lvBtns.forEach((b, i) => b.setAttribute('aria-pressed', LEVELS[i][0] === id)); sfx.click(); run(); }
    gameEl.innerHTML = '';
    gameEl.append(h('div', { class: 'shell' },
      h('div', { class: 'ghead' }, h('button', { class: 'btn alt sm', onclick: () => { location.hash = ''; } }, 'All games'),
        h('h2', null, emo(meta.emoji), meta.title), h('span', { class: 'mode' }, multi ? players.length + ' players' : 'Solo'), h('span', { class: 'sp' }), lvSeg, restartBtn),
      multi ? scores : null, stage));

    const ctx = {
      id: meta.id, meta, root: stage, multi, players, turn: 0, h, Core, level,
      restart: () => run(),
      get levelIndex() { return LEVELS.findIndex(l => l[0] === ctx.level); },
      get player() { return players[ctx.turn]; },
      paint() { scores.innerHTML = ''; if (!multi) return; players.forEach((p, i) => scores.append(h('div', { class: 'pl' + (i === ctx.turn ? ' on' : ''), style: { '--pc': p.color } }, h('i'), p.name, h('em', null, p.score)))); },
      setTurn(i) { ctx.turn = i % players.length; ctx.paint(); },
      nextTurn() { ctx.setTurn(ctx.turn + 1); return ctx.player; },
      addScore(i, n) { players[i].score += n; ctx.paint(); },
      best(text, value, higher = true) {
        const b = store.get('best:' + meta.id, null);
        if (!b || (higher ? value > b.value : value < b.value)) { store.set('best:' + meta.id, { text, value }); return true; } return false;
      },
      markDaily() { store.set('daily:' + meta.id, dayKey()); },
      finish(opts = {}) {
        if (opts.win !== false) { sfx.win(); confetti(); }
        const ranked = players.slice().sort((a, b) => b.score - a.score);
        const tie = multi && ranked.length > 1 && ranked[0].score === ranked[1].score;
        const m = modal(h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Results' },
          h('h2', null, opts.title || (multi ? (tie ? 'It is a tie!' : ranked[0].name + ' wins!') : 'Nice game!')),
          opts.body ? (typeof opts.body === 'string' ? h('p', { style: { margin: 0 } }, opts.body) : opts.body) : null,
          multi && opts.ranking !== false ? h('ol', { class: 'rank' }, ranked.map(p => h('li', null, h('span', { class: 'pl', style: { '--pc': p.color, padding: 0, border: 0, background: 'none' } }, h('i')), p.name, h('b', null, p.score + (opts.unit ? ' ' + opts.unit : ''))))) : null,
          h('div', { class: 'row' }, h('button', { class: 'btn mint', onclick: () => { m.close(); run(); } }, 'Play again'),
            ctx.levelIndex < LEVELS.length - 1 && opts.next !== false ? h('button', { class: 'btn sun', onclick: () => { m.close(); setLevel(LEVELS[ctx.levelIndex + 1][0]); } }, 'Next level: ' + LEVELS[ctx.levelIndex + 1][1]) : null,
            h('button', { class: 'btn alt', onclick: () => { m.close(); location.hash = ''; } }, 'All games'))));
      }
    };
    function run() {
      if (active && active.cleanup) { try { active.cleanup(); } catch (e) { console.error(e); } }
      players.forEach(p => { p.score = 0; }); ctx.turn = 0; stage.innerHTML = ''; ctx.paint();
      const cleanup = def.mount(ctx); active = { id: meta.id, cleanup, ctx };
    }
    run();
  }

  async function route() {
    const id = location.hash.replace('#/', '');
    const meta = GAMES.find(g => g.id === id);
    if (!meta) { stop(); gameEl.hidden = true; gameEl.innerHTML = ''; hub.hidden = false; renderHub(); renderStreak(); document.title = 'Pocket Arcade'; return; }
    if (active && active.id === id) return;
    document.title = meta.title + ' - Pocket Arcade';
    const setup = await setupDialog(meta);
    if (!setup) { location.hash = ''; return; }
    start(meta, setup);
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !active) { renderHub(); renderStreak(); } });
  route();
})();
