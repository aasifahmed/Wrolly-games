/* Random Creative Challenges
   Spin for a prompt (draw, write, build, act or wild), pick a timer and go.
   Solo: keep a streak of completed challenges and star your favourites.
   Multiplayer: everyone takes the same challenge, then the group picks the most creative result (3 rounds). */
(function () {
  const { h } = Core;

  Core.css('creative', `
    .cr{display:grid;gap:16px;justify-items:center;text-align:center}
    .card{width:100%;max-width:620px;border:3px solid var(--line);border-radius:22px;padding:26px 20px;background:var(--c,var(--paper));color:#1B1740;box-shadow:var(--shadow);min-height:150px;display:grid;place-items:center;gap:8px}
    .card .k{font-weight:800;border:2px solid var(--line);border-radius:99px;padding:1px 14px;background:#fff}
    .card .t{font-family:var(--head);font-weight:700;font-size:clamp(1.3rem,4.6vw,2rem);line-height:1.2}
    .card.spin .t{opacity:.5;filter:blur(1px)}
    .favs{width:100%;max-width:620px;text-align:left;display:grid;gap:6px;margin:0;padding:0;list-style:none}
    .favs li{padding:6px 12px;border:2px solid var(--line);border-radius:12px;background:var(--paper)}
    .tw{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
    .tw span{background:#fff;border:2px dashed var(--line);border-radius:12px;padding:3px 12px;font-weight:800;font-size:.95rem}
  `);

  const A = ['a grumpy', 'a tiny', 'a giant', 'a sparkly', 'a sleepy', 'a very polite', 'a time-travelling', 'an invisible', 'a clumsy', 'a heroic', 'a hungry', 'a mysterious', 'a dancing', 'a forgetful', 'a brave', 'a shy', 'an overconfident', 'a magical', 'a lost', 'a sneaky', 'a talkative', 'a rainbow-coloured', 'a haunted', 'a royal'];
  const N = ['toaster', 'octopus', 'wizard', 'cloud', 'banana', 'robot', 'lighthouse', 'penguin', 'sock', 'dragon', 'cactus', 'pirate', 'umbrella', 'snail', 'volcano', 'teapot', 'scarecrow', 'jellyfish', 'llama', 'lamp', 'mushroom', 'yeti', 'trumpet', 'bicycle', 'pancake', 'owl', 'submarine', 'detective', 'cupcake', 'ghost'];
  const V = ['learning to dance', 'running for mayor', 'hiding from a storm', 'opening a bakery', 'training for the Olympics', 'lost in a library', 'planning a surprise party', 'starting a band', 'inventing a new sport', 'writing a diary', 'climbing a mountain', 'building a time machine', 'starting a school', 'searching for treasure', 'making a movie', 'going on a first date', 'escaping a maze', 'looking for lost socks'];
  const T = ['a mountain', 'a birthday', 'a rainy Monday', 'a missing key', 'the last cookie', 'a secret door', 'a lonely moon', 'a talking mirror', 'an unexpected visitor', 'the world\'s smallest town', 'a broken clock', 'a midnight snack', 'a magic paintbrush', 'a very long staircase', 'a stolen sandwich', 'a message in a bottle', 'a hidden island', 'a snowy morning', 'a runaway balloon', 'a mysterious map'];
  const P = ['can talk to plants', 'is only strong on Tuesdays', 'turns everything into cheese', 'makes people giggle', 'controls the weather with sneezes', 'can shrink to the size of a pea', 'speaks every animal language', 'can walk through walls but only on Fridays', 'makes things float when they are happy', 'turns into a puddle when scared', 'can freeze time for exactly ten seconds', 'paints anything real by drawing it'];
  const ITEM = ['paper cups', 'pillows', 'spoons', 'books', 'socks', 'coins', 'sticky notes', 'pasta', 'shoes', 'paper clips', 'cushions', 'rubber bands', 'straws', 'toothpicks', 'cardboard boxes', 'bottle caps', 'clothes pegs', 'playing cards', 'marshmallows', 'plastic bottles'];
  /* extra rules added at Hard (1) and Expert (2) */
  const TWISTS = ['Use only your non-dominant hand.', 'Do it standing on one leg.', 'Make it rhyme or have a rhythm.', 'Include the word "banana" somewhere.', 'No do-overs. Whatever you make first, you keep.', 'Add a surprise ending.', 'Add a villain.', 'Make it for someone who is five years old.', 'Do it like a nature documentary narrator.', 'Keep your eyes closed for the first 20 seconds.', 'It must include something yellow.', 'Make it as small as you can.'];
  const LV = { easy: { mins: 5, mr: 3, tw: 0 }, medium: { mins: 3, mr: 4, tw: 0 }, hard: { mins: 2, mr: 5, tw: 1 }, expert: { mins: 1, mr: 6, tw: 2 } };
  const CAT = {
    draw: { label: 'Draw', c: '#FF5FA2', f: () => Core.pick(['Draw ', 'Sketch ', 'Doodle ']) + Core.pick(A) + ' ' + Core.pick(N) + ' ' + Core.pick(V) + '.' },
    write: { label: 'Write', c: '#2DC4F5', f: () => Core.pick(['Write a six-word story about ' + Core.pick(T) + '.', 'Write the opening line of a mystery involving ' + Core.pick(A) + ' ' + Core.pick(N) + '.', 'Write a short poem about ' + Core.pick(T) + ' without using the letter E.', 'Write a thank-you note from ' + Core.pick(A) + ' ' + Core.pick(N) + ' to a hero.', 'Write a weather forecast for the land of ' + Core.pick(N) + 's.', 'Write a menu for a restaurant run by ' + Core.pick(A) + ' ' + Core.pick(N) + '.', 'Write a job ad for ' + Core.pick(A) + ' ' + Core.pick(N) + '.', 'Write a two-line scary story about ' + Core.pick(T) + ' that ends happily.']) },
    build: { label: 'Build', c: '#FFCF33', f: () => Core.pick(['Build the tallest tower you can using only ' + Core.pick(ITEM) + '.', 'Make ' + Core.pick(A) + ' ' + Core.pick(N) + ' out of ' + Core.pick(ITEM) + '.', 'Fold a paper creature that looks like ' + Core.pick(A) + ' ' + Core.pick(N) + '.', 'Design a bridge made of ' + Core.pick(ITEM) + ' that can hold a small toy.', 'Build a tiny home for ' + Core.pick(A) + ' ' + Core.pick(N) + ' using ' + Core.pick(ITEM) + '.', 'Make a musical instrument from ' + Core.pick(ITEM) + ' and play a tune.', 'Build a trap that catches a pretend ' + Core.pick(N) + ' using ' + Core.pick(ITEM) + '.']) },
    act: { label: 'Act', c: '#2ED9A3', f: () => Core.pick(['Act out ' + Core.pick(A) + ' ' + Core.pick(N) + ' ' + Core.pick(V) + ', with no words.', 'Explain how to make a sandwich using only sound effects.', 'Perform a 30 second news report about ' + Core.pick(T) + '.', 'Tell a story about ' + Core.pick(T) + ' while only whispering.', 'Mime a day in the life of ' + Core.pick(A) + ' ' + Core.pick(N) + '.', 'Sell an invisible ' + Core.pick(N) + ' like a TV shopping host.', 'Do a one-minute stand-up routine about ' + Core.pick(T) + '.']) },
    wild: { label: 'Wild', c: '#FF8A3D', f: () => Core.pick(['Invent a holiday that celebrates ' + Core.pick(T) + ' and describe how people celebrate.', 'Design a superhero whose power is that they ' + Core.pick(P) + '. Name them!', 'Pitch a snack made from ' + Core.pick(N) + 's and ' + Core.pick(N) + 's.', 'Create a secret handshake for ' + Core.pick(A) + ' ' + Core.pick(N) + ' and its best friend.', 'Invent a new sport played with ' + Core.pick(ITEM) + ' and explain the rules.', 'Design a flag for the country of ' + Core.pick(N) + 's.', 'Invent a gadget that solves the problem of ' + Core.pick(T) + '.']) }
  };

  Core.register({
    id: 'creative',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, multi = ctx.multi, ROUNDS = L.mr; let cat = 'any', mins = L.mins, round = 0, tm = 0, cur = null, left = 0, spinT = 0;
      const favs = Core.store.get('cr:favs', []), done = () => Core.store.get('cr:done', 0);

      function roll(keep) {
        const keys = Object.keys(CAT), k = cat === 'any' ? Core.pick(keys) : cat; cur = { k, t: CAT[k].f(), tw: Core.shuffle(TWISTS).slice(0, L.tw) };
        if (!keep) show(true);
      }

      function show(spin) {
        clearInterval(tm); clearInterval(spinT); left = 0;
        const card = h('div', { class: 'card' + (spin ? ' spin' : ''), style: { '--c': CAT[cur.k].c } }, h('span', { class: 'k' }, CAT[cur.k].label), h('div', { class: 't' }, cur.t), cur.tw.length ? h('div', { class: 'tw' }, cur.tw.map(t => h('span', null, 'Twist: ' + t))) : null);
        const timeEl = h('div', { class: 'big' }, mins + ':00'), msg = h('div', { class: 'msg', 'aria-live': 'polite' });
        const catSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Challenge type' }, [['any', 'Any'], ...Object.keys(CAT).map(k => [k, CAT[k].label])].map(([k, t]) => h('button', { 'aria-pressed': cat === k, onclick: () => { cat = k; roll(); } }, t)));
        const minSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Minutes' }, [1, 3, 5, 10].map(m => h('button', { 'aria-pressed': mins === m, onclick: () => { mins = m; show(false); } }, m + ' min')));
        const startBtn = h('button', { class: 'btn mint', onclick: () => { Core.sfx.click(); left = mins * 60; startBtn.hidden = rerollBtn.hidden = true; finishBtn.hidden = false; catSeg.hidden = minSeg.hidden = true; tick(); tm = setInterval(tick, 1000); } }, 'Start the timer');
        const rerollBtn = h('button', { class: 'btn alt', onclick: () => { Core.sfx.click(); let n = 0; clearInterval(spinT); spinT = setInterval(() => { roll(true); card.querySelector('.t').textContent = cur.t; card.querySelectorAll('.tw').forEach(e => e.remove()); card.querySelector('.k').textContent = CAT[cur.k].label; card.style.setProperty('--c', CAT[cur.k].c); card.classList.add('spin'); Core.sfx.tick(); if (++n > 8) { clearInterval(spinT); show(false); } }, 90); } }, 'Spin again');
        const finishBtn = h('button', { class: 'btn pink', hidden: true, onclick: end }, 'I finished!');
        const favBtn = multi ? null : h('button', { class: 'btn sun sm', onclick: () => { if (!favs.includes(cur.t)) { favs.unshift(cur.t); Core.store.set('cr:favs', favs.slice(0, 20)); Core.toast('Saved to favourites'); } } }, 'Star this one');
        function tick() { timeEl.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (left <= 0) { clearInterval(tm); Core.sfx.win(); msg.textContent = 'Time! Wrap it up and press finished.'; } else { if (left <= 5) Core.sfx.tick(); left--; } }
        root.innerHTML = '';
        root.append(h('div', { class: 'cr' }, multi ? h('div', { class: 'muted' }, 'Round ' + (round + 1) + ' of ' + ROUNDS + '. Everyone does the same challenge, then you vote.') : h('div', { class: 'muted' }, 'Challenge ' + (round + 1) + ' of ' + ROUNDS + '. Completed in total: ' + done()),
          catSeg, card, timeEl, minSeg, msg, h('div', { class: 'row c' }, startBtn, rerollBtn, finishBtn, favBtn),
          !multi && favs.length ? h('div', { class: 'stack', style: { width: '100%', maxWidth: '620px' } }, h('h3', null, 'Your starred challenges'), h('ul', { class: 'favs' }, favs.slice(0, 5).map(f => h('li', null, f)))) : null));
        if (spin) setTimeout(() => card.classList.remove('spin'), 450);
      }

      function end() {
        clearInterval(tm);
        if (!multi) { Core.store.set('cr:done', done() + 1); ctx.best(done() + ' completed', done()); Core.sfx.win(); round++; if (round >= ROUNDS) return ctx.finish({ title: 'Challenge set complete!', body: 'You finished ' + ROUNDS + ' creative challenges. Total completed: ' + done() + '.' }); Core.toast('Challenge complete! On to the next one.'); roll(); return; }
        root.innerHTML = '';
        root.append(h('div', { class: 'cr' }, h('div', { class: 'big' }, 'Who was the most creative?'), h('p', { class: 'muted', style: { margin: 0 } }, cur.t), h('div', { class: 'row c' }, ctx.players.map((p, i) => h('button', { class: 'btn', style: { background: p.color, color: '#1B1740' }, onclick: () => { Core.sfx.ok(); ctx.addScore(i, 1); round++; if (round >= ROUNDS) ctx.finish({ unit: 'votes' }); else { roll(); } } }, p.name)))));
      }
      roll();
      return () => { clearInterval(tm); clearInterval(spinT); };
    }
  });
})();
