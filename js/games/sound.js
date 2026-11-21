/* Guess the Sound
   Every sound is synthesized live with the WebAudio API, so there are no audio files to download.
   Solo: 8 rounds. Multiplayer: players take turns, 3 rounds each. Fewer replays means more points. */
(function () {
  const { h } = Core;

  Core.css('sound', `
    .sg{display:grid;gap:18px;justify-items:center}
    .sg .info{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;font-weight:800}
    .playbtn{width:150px;height:150px;border-radius:50%;border:4px solid var(--line);background:var(--sky);color:#1B1740;box-shadow:var(--shadow);font-family:var(--head);font-weight:700;font-size:1.2rem;display:grid;place-items:center;gap:0;transition:transform .1s}
    .playbtn:active{transform:translate(3px,3px);box-shadow:none}
    .playbtn .ico{font-size:2.6rem;line-height:1}
    .wave{display:flex;gap:4px;align-items:center;height:36px}
    .wave i{display:block;width:6px;height:8px;border-radius:4px;background:var(--violet)}
    .wave.on i{animation:bounce .5s ease-in-out infinite alternate}
    .wave.on i:nth-child(2n){animation-delay:.15s}.wave.on i:nth-child(3n){animation-delay:.3s}
    @keyframes bounce{to{height:34px}}
    .opts{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:560px}
    .opt{padding:14px 10px;border-radius:16px;border:3px solid var(--line);background:var(--paper);font-family:var(--head);font-weight:500;font-size:1.1rem;box-shadow:3px 3px 0 var(--line)}
    .opt:active{transform:translate(2px,2px);box-shadow:none}
    .opt.right{background:var(--mint);color:#1B1740}.opt.wrong{background:var(--red);color:#fff}
    .opt[disabled]{pointer-events:none}
    @media(max-width:420px){.opts{grid-template-columns:1fr}}
  `);

  /* ---- tiny synth toolkit ---- */
  function env(a, out, t, dur, vol) { const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(out); return g; }
  function osc(a, out, type, f1, f2, t, dur, vol, lp) {
    const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    let dest = env(a, out, t, dur, vol);
    if (lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.connect(dest); dest = f; }
    o.connect(dest); o.start(t); o.stop(t + dur + .05); return o;
  }
  function noise(a, out, t, dur, vol, ftype, freq, shape, q) {
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q || 1;
    const g = a.createGain();
    if (shape === 'waves') { g.gain.setValueAtTime(0.0001, t); for (let k = 0; k < 3; k++) { g.gain.linearRampToValueAtTime(vol, t + dur * (k + .5) / 3); g.gain.linearRampToValueAtTime(vol * .15, t + dur * (k + 1) / 3); } }
    else { g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    s.connect(f).connect(g).connect(out); s.start(t);
  }
  const R = (a, b) => a + Math.random() * (b - a);

  const SOUNDS = [
    { name: 'Siren', emoji: '🚨', play(a, o, t) { for (let k = 0; k < 2; k++) { osc(a, o, 'sine', 700, 1250, t + k * 1.2, .6, .3); osc(a, o, 'sine', 1250, 700, t + k * 1.2 + .6, .6, .3); } return 2.4; } },
    { name: 'Doorbell', emoji: '🔔', play(a, o, t) { osc(a, o, 'sine', 659, 0, t, 1, .35); osc(a, o, 'sine', 1318, 0, t, .6, .08); osc(a, o, 'sine', 523, 0, t + .55, 1.6, .35); osc(a, o, 'sine', 1046, 0, t + .55, 1, .08); return 2.2; } },
    { name: 'Phone ringing', emoji: '📞', play(a, o, t) { for (let k = 0; k < 2; k++) for (let j = 0; j < 14; j++) { osc(a, o, 'sine', 440, 0, t + k * 1.6 + j * .055, .05, .2); osc(a, o, 'sine', 480, 0, t + k * 1.6 + j * .055, .05, .2); } return 3.2; } },
    { name: 'Laser blaster', emoji: '🔫', play(a, o, t) { for (let k = 0; k < 3; k++) osc(a, o, 'sawtooth', 2200, 140, t + k * .55, .3, .18, 3000); return 1.8; } },
    { name: 'Heartbeat', emoji: '❤️', play(a, o, t) { for (let k = 0; k < 4; k++) { osc(a, o, 'sine', 80, 40, t + k * .9, .18, .8); osc(a, o, 'sine', 70, 38, t + k * .9 + .26, .16, .6); } return 3.6; } },
    { name: 'Bird song', emoji: '🐦', play(a, o, t) { for (let g = 0; g < 3; g++) for (let j = 0; j < 4; j++) { const f = R(2600, 3400); osc(a, o, 'sine', f, f * R(1.2, 1.6), t + g * .75 + j * .12, .08, .15); } return 2.5; } },
    { name: 'Rain', emoji: '🌧️', play(a, o, t) { noise(a, o, t, 3, .25, 'highpass', 1800, 'flat'); for (let k = 0; k < 40; k++) osc(a, o, 'sine', R(1500, 3500), 0, t + R(0, 2.8), .02, .08); return 3; } },
    { name: 'Ocean waves', emoji: '🌊', play(a, o, t) { noise(a, o, t, 4.5, .5, 'lowpass', 700, 'waves'); return 4.5; } },
    { name: 'Drum roll', emoji: '🥁', play(a, o, t) { let x = 0, gap = .09; for (let k = 0; k < 34; k++) { noise(a, o, t + x, .08, .15 + k * .012, 'bandpass', 260, 'env', 1.2); x += gap; gap = Math.max(.035, gap - .0017); } noise(a, o, t + x, 1.2, .5, 'highpass', 3500, 'env'); return x + 1.2; } },
    { name: 'Video game coin', emoji: '🪙', play(a, o, t) { osc(a, o, 'square', 988, 0, t, .08, .12); osc(a, o, 'square', 1319, 0, t + .08, .6, .12); return .8; } },
    { name: 'Alarm clock', emoji: '⏰', play(a, o, t) { for (let g = 0; g < 2; g++) for (let j = 0; j < 4; j++) osc(a, o, 'square', 1000, 0, t + g * 1.2 + j * .17, .09, .12); return 2.2; } },
    { name: 'Crickets', emoji: '🦗', play(a, o, t) { for (let k = 0; k < 6; k++) for (let j = 0; j < 3; j++) osc(a, o, 'sine', 4300, 0, t + k * .45 + j * .06, .04, .16); return 3; } },
    { name: 'Engine', emoji: '🏎️', play(a, o, t) { osc(a, o, 'sawtooth', 55, 190, t, 2.6, .5, 500); osc(a, o, 'square', 56, 192, t, 2.6, .12, 400); return 2.7; } },
    { name: 'Clock ticking', emoji: '🕰️', play(a, o, t) { for (let k = 0; k < 7; k++) { noise(a, o, t + k * .5, .03, .5, 'bandpass', k % 2 ? 1800 : 1300, 'env', 3); osc(a, o, 'triangle', k % 2 ? 900 : 700, 0, t + k * .5, .04, .15); } return 3.5; } },
    { name: 'Bubbles', emoji: '🫧', play(a, o, t) { for (let k = 0; k < 9; k++) { const f = R(280, 650); osc(a, o, 'sine', f, f * 2, t + R(0, 2.4), .11, .3); } return 2.6; } },
    { name: 'UFO', emoji: '🛸', play(a, o, t) { const m = osc(a, o, 'sine', 500, 0, t, 2.6, .25), l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 7; lg.gain.value = 160; l.connect(lg).connect(m.frequency); l.start(t); l.stop(t + 2.7); return 2.7; } },
    { name: 'Fireworks', emoji: '🎆', play(a, o, t) { osc(a, o, 'sine', 500, 2400, t, .9, .2); noise(a, o, t + .9, .9, .6, 'bandpass', 1400, 'env'); for (let k = 0; k < 14; k++) noise(a, o, t + 1.1 + R(0, 1), .03, .35, 'highpass', 3000, 'env'); return 2.3; } },
    { name: 'Wind', emoji: '🌬️', play(a, o, t) { noise(a, o, t, 4.5, .55, 'bandpass', 500, 'waves', .6); return 4.5; } },
    { name: 'Footsteps', emoji: '👣', play(a, o, t) { for (let k = 0; k < 6; k++) noise(a, o, t + k * .45, .14, .8, 'lowpass', k % 2 ? 260 : 340, 'env'); return 2.8; } },
    { name: 'Thunder', emoji: '⛈️', play(a, o, t) { noise(a, o, t, 2.8, .9, 'lowpass', 180, 'env'); noise(a, o, t + .5, 2.2, .5, 'lowpass', 90, 'env'); for (let k = 0; k < 6; k++) noise(a, o, t + .3 * k, .4, .35, 'lowpass', 300, 'env'); return 3; } },
    { name: 'Camera shutter', emoji: '📸', play(a, o, t) { noise(a, o, t, .04, .9, 'highpass', 2500, 'env'); noise(a, o, t + .09, .05, .7, 'bandpass', 1200, 'env', 2); osc(a, o, 'square', 2000, 0, t + .01, .03, .06); return .6; } },
    { name: 'Applause', emoji: '👏', play(a, o, t) { for (let k = 0; k < 90; k++) noise(a, o, t + R(0, 2.6), .04, R(.15, .5), 'bandpass', R(1500, 3500), 'env', 1); return 2.8; } },
    { name: 'Door knock', emoji: '🚪', play(a, o, t) { [0, .35, .7, 1.4, 1.75].forEach(d => { noise(a, o, t + d, .1, .9, 'lowpass', 400, 'env'); osc(a, o, 'sine', 140, 70, t + d, .1, .7); }); return 2.1; } },
    { name: 'Helicopter', emoji: '🚁', play(a, o, t) { for (let k = 0; k < 28; k++) noise(a, o, t + k * .09, .08, .6, 'lowpass', 220, 'env'); osc(a, o, 'sawtooth', 70, 0, t, 2.6, .12, 300); return 2.7; } },
    { name: 'Countdown beeps', emoji: '🏁', play(a, o, t) { [0, .6, 1.2].forEach(d => osc(a, o, 'square', 440, 0, t + d, .25, .15)); osc(a, o, 'square', 880, 0, t + 1.8, .7, .15); return 2.6; } },
    { name: 'Water drip', emoji: '💧', play(a, o, t) { [0, .9, 1.7, 2.6].forEach(d => { osc(a, o, 'sine', 1400, 500, t + d, .12, .35); osc(a, o, 'sine', 900, 300, t + d + .14, .1, .12); }); return 3; } },
    { name: 'Power-up', emoji: '🔋', play(a, o, t) { [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => osc(a, o, 'square', f, 0, t + i * .07, .09, .12)); osc(a, o, 'sawtooth', 200, 1600, t, .5, .08, 3000); return 1; } },
    { name: 'Church bell', emoji: '⛪', play(a, o, t) { [0, 1.6].forEach(d => [1, 2, 2.4, 3, 4.1, 5.4].forEach((m, i) => osc(a, o, 'sine', 196 * m, 0, t + d, 3 - i * .3, .22 / (i + 1)))); return 4.6; } },
    { name: 'Cuckoo clock', emoji: '🐤', play(a, o, t) { [0, 1.1].forEach(d => { osc(a, o, 'sine', 784, 0, t + d, .32, .35); osc(a, o, 'sine', 622, 0, t + d + .38, .5, .35); }); return 2.2; } },
    { name: 'Sonar ping', emoji: '📡', play(a, o, t) { [[0, .45], [1.5, .22], [3, .1]].forEach(([d, v]) => osc(a, o, 'sine', 1250, 1180, t + d, 1.3, v)); return 4.4; } },
    { name: 'Boing spring', emoji: '🦘', play(a, o, t) { const m = osc(a, o, 'sine', 420, 140, t, 1, .4), l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 22; lg.gain.setValueAtTime(160, t); lg.gain.exponentialRampToValueAtTime(2, t + 1); l.connect(lg).connect(m.frequency); l.start(t); l.stop(t + 1.1); return 1.1; } },
    { name: 'Slide whistle', emoji: '🎶', play(a, o, t) { osc(a, o, 'sine', 400, 1700, t, .7, .3); osc(a, o, 'sine', 1700, 500, t + .75, .6, .3); return 1.5; } },
    { name: 'Crackling fire', emoji: '🔥', play(a, o, t) { noise(a, o, t, 3.2, .18, 'lowpass', 500, 'flat'); for (let k = 0; k < 70; k++) noise(a, o, t + R(0, 3), R(.015, .05), R(.2, .7), 'highpass', R(1200, 4500), 'env'); return 3.3; } },
    { name: 'Steam train', emoji: '🚂', play(a, o, t) { for (let k = 0; k < 14; k++) noise(a, o, t + k * .19, .13, .55, 'bandpass', 600, 'env'); osc(a, o, 'square', 600, 0, t + 2.1, .9, .1, 1500); osc(a, o, 'square', 450, 0, t + 2.1, .9, .1, 1500); return 3.1; } },
    { name: 'Vacuum cleaner', emoji: '🧹', play(a, o, t) { noise(a, o, t, 3, .4, 'bandpass', 1500, 'flat', .5); osc(a, o, 'sawtooth', 110, 0, t, 3, .1, 600); return 3.1; } },
    { name: 'Microwave ding', emoji: '🍲', play(a, o, t) { [0, .95, 1.9].forEach(d => { osc(a, o, 'sine', 2350, 0, t + d, .9, .4); osc(a, o, 'sine', 4700, 0, t + d, .5, .06); }); return 2.9; } },
    { name: 'Car horn', emoji: '🚙', play(a, o, t) { [0, .85].forEach(d => { osc(a, o, 'square', 440, 0, t + d, .6, .13, 2200); osc(a, o, 'square', 554, 0, t + d, .6, .13, 2200); }); return 1.5; } },
    { name: 'Morse code', emoji: '🆘', play(a, o, t) { let x = 0; [.08, .08, .08, .24, .24, .24, .08, .08, .08].forEach(d => { osc(a, o, 'sine', 700, 0, t + x, d, .3); x += d + .09; }); return x; } },
    { name: 'Typewriter', emoji: '⌨️', play(a, o, t) { let x = 0; for (let k = 0; k < 14; k++) { noise(a, o, t + x, .04, .7, 'bandpass', k % 3 ? 1800 : 1100, 'env', 2); x += R(.09, .2); } osc(a, o, 'sine', 2000, 0, t + x + .1, .6, .3); return x + .8; } },
    { name: 'Referee whistle', emoji: '🏃', play(a, o, t) { [[0, .35], [.5, .75]].forEach(([d, l]) => { const m = osc(a, o, 'sine', 2800, 0, t + d, l, .25), v = a.createOscillator(), vg = a.createGain(); v.frequency.value = 38; vg.gain.value = 90; v.connect(vg).connect(m.frequency); v.start(t + d); v.stop(t + d + l + .1); }); return 1.4; } },
    { name: 'Ice cream truck', emoji: '🍨', play(a, o, t) { [523, 659, 784, 659, 523, 659, 784, 1047].forEach((f, i) => { osc(a, o, 'triangle', f, 0, t + i * .24, .3, .2); osc(a, o, 'sine', f * 2, 0, t + i * .24, .2, .05); }); return 2.2; } },
    { name: 'Trumpet fanfare', emoji: '🎺', play(a, o, t) { [[523, 0, .15], [523, .18, .15], [523, .36, .15], [659, .56, .5], [523, 1.1, .2], [659, 1.35, .6]].forEach(([f, d, l]) => { osc(a, o, 'sawtooth', f, 0, t + d, l + .05, .18, 1800); osc(a, o, 'square', f * 2, 0, t + d, l, .04, 2200); }); return 2.1; } }
  ];

  /* levels: number of answer choices, solo rounds, rounds per player, replay limit */
  const LV = { easy: { opts: 4, rounds: 10, per: 4, max: 99 }, medium: { opts: 4, rounds: 14, per: 5, max: 3 }, hard: { opts: 6, rounds: 16, per: 6, max: 3 }, expert: { opts: 8, rounds: 20, per: 8, max: 2 } };

  Core.register({
    id: 'sound',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, total = ctx.multi ? ctx.players.length * L.per : L.rounds;
      let round = 0, plays = 0, cur = null, out = null, timer = 0, answered = false, hist = [];
      const bag = Core.shuffle(SOUNDS).concat(Core.shuffle(SOUNDS));

      function stopSound() { clearTimeout(timer); if (out) { try { out.disconnect(); } catch (e) { } out = null; } root.querySelectorAll('.wave').forEach(w => w.classList.remove('on')); }

      function play() {
        if (plays >= L.max) { Core.toast('No more plays at this level'); return; }
        if (Core.sfx.muted) { Core.sfx.muted = false; }
        const a = Core.sfx.audio(); if (!a) { Core.toast('Audio is not supported in this browser'); return; }
        stopSound(); plays++; updateInfo();
        out = a.createGain(); out.gain.value = .8; out.connect(a.destination);
        const dur = cur.play(a, out, a.currentTime + .05);
        const w = root.querySelector('.wave'); if (w) w.classList.add('on');
        timer = setTimeout(stopSound, dur * 1000);
      }

      function updateInfo() { const i = root.querySelector('.rep'); if (i) i.textContent = 'Plays: ' + plays + (L.max < 99 ? '/' + L.max : ''); }

      function next() {
        stopSound();
        if (round >= total) {
          if (!ctx.multi) { const pts = ctx.players[0].score; const nb = ctx.best(pts + ' pts', pts); return ctx.finish({ title: pts >= total * 2 ? 'Golden ears!' : 'Round complete', body: 'You scored ' + pts + ' of ' + total * 3 + ' points.' + (nb ? ' New best!' : ''), unit: 'pts' }); }
          return ctx.finish({ unit: 'pts' });
        }
        if (ctx.multi) ctx.setTurn(round % ctx.players.length);
        cur = bag[round % bag.length]; plays = 0; answered = false;
        const wrong = Core.shuffle(SOUNDS.filter(s => s !== cur)).slice(0, L.opts - 1);
        const opts = Core.shuffle([cur, ...wrong]);
        root.innerHTML = '';
        const msg = h('div', { class: 'msg', 'aria-live': 'polite' });
        const nextBtn = h('button', { class: 'btn mint', hidden: true, onclick: () => { round++; next(); } }, 'Next sound');
        root.append(h('div', { class: 'sg' },
          h('div', { class: 'info' }, h('span', null, 'Sound ' + (round + 1) + ' of ' + total), h('span', { class: 'rep' }, 'Plays: 0' + (L.max < 99 ? '/' + L.max : '')), ctx.multi ? h('span', null, ctx.player.name + ' is listening') : null),
          h('button', { class: 'playbtn', onclick: play, 'aria-label': 'Play the sound' }, h('span', { class: 'ico' }, Core.emo('🎧')), 'Play'),
          h('div', { class: 'wave', 'aria-hidden': 'true' }, Array.from({ length: 12 }, () => h('i'))),
          h('div', { class: 'opts' }, opts.map(o => h('button', {
            class: 'opt', onclick: e => {
              if (answered) return; if (!plays) { msg.textContent = 'Press play first!'; msg.className = 'msg bad'; return; }
              answered = true; stopSound();
              const ok = o === cur, pts = ok ? (plays <= 1 ? 3 : plays === 2 ? 2 : 1) : 0;
              root.querySelectorAll('.opt').forEach((b, i) => { b.disabled = true; if (opts[i] === cur) b.classList.add('right'); });
              if (!ok) e.currentTarget.classList.add('wrong');
              ok ? Core.sfx.ok() : Core.sfx.bad();
              if (ok) ctx.addScore(ctx.multi ? ctx.turn : 0, pts); else ctx.paint();
              msg.replaceChildren((ok ? 'Correct! +' + pts + ' ' : 'It was ' + cur.name + ' '), Core.emo(cur.emoji)); msg.className = 'msg ' + (ok ? 'good' : 'bad');
              nextBtn.hidden = false; nextBtn.textContent = round + 1 >= total ? 'See results' : 'Next sound'; nextBtn.focus();
            }
          }, o.name))),
          msg, nextBtn, h('p', { class: 'muted center', style: { margin: 0 } }, 'Fewer replays means more points: 3 for one listen, 2 for two, 1 for more.' + (L.max < 99 ? ' You get ' + L.max + ' plays per sound.' : ''))));
      }
      next();
      return stopSound;
    }
  });
})();
