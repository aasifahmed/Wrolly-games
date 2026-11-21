/* Daily Mini Crossword
   A compact crossword is generated from a clue bank, seeded by today's date, so everyone gets the same puzzle each day.
   Progress is saved in localStorage. Type to fill, click a cell twice (or press Space) to switch direction. */
(function () {
  const { h } = Core;

  Core.css('cw', `
    .cw{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
    @media(min-width:760px){.cw{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:start}}
    .cwg{display:grid;gap:3px;width:100%;max-width:460px;margin:0 auto}
    .cc{position:relative;aspect-ratio:1;border:2.5px solid var(--line);border-radius:8px;background:var(--paper);display:grid;place-items:center;font-family:var(--head);font-weight:700;font-size:clamp(1.1rem,4.5vw,1.8rem);text-transform:uppercase;padding:0;cursor:pointer;color:var(--ink)}
    .cc.b{background:var(--ink);border-color:var(--ink);cursor:default;opacity:.9}
    .cc.w{background:#C9F5E6;color:#1B1740}.cc.a{background:var(--sun);color:#1B1740}
    .cc.bad{background:#FFC9CF;color:#1B1740}.cc.ok{background:var(--mint);color:#1B1740}
    .cc small{position:absolute;top:1px;left:4px;font-size:.55em;font-family:var(--body);font-weight:800}
    .cl h4{font-family:var(--head);margin:0 0 6px;font-size:1.1rem}
    .cl ol{margin:0 0 12px;padding:0;list-style:none;display:grid;gap:4px}
    .cl li button{width:100%;text-align:left;background:none;border:2px solid transparent;border-radius:10px;padding:4px 8px}
    .cl li button.on{background:var(--sun);color:#1B1740;border-color:var(--line)}
    .cl li button.dn{text-decoration:line-through;opacity:.55}
    .cwin{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;left:0;top:0}
  `);

  const BANK = `planet|A world that orbits a star
ocean|Where whales and waves live
piano|Instrument with 88 keys
tiger|Big cat with stripes
apple|Fruit that keeps the doctor away
bread|Toast starts as this
cloud|Fluffy thing in the sky
dream|What you see while asleep
flute|Woodwind you blow across
grape|Wine starts as this
horse|Animal you can saddle
jelly|Wobbly dessert or sandwich partner
koala|Sleepy eucalyptus eater
lemon|Sour yellow citrus
mango|Sweet tropical fruit
night|Opposite of day
otter|Playful river swimmer
pizza|Italian pie with cheese
queen|Chess piece that moves anywhere
river|Flowing body of water
snake|Slithering reptile
train|Chugs along rails
whale|Largest animal in the sea
zebra|Striped African horse relative
candy|Sweet treat in a wrapper
dance|Move to the music
eagle|Bird with a bald national symbol
flame|Part of a fire
ghost|Spooky Halloween spirit
honey|Sweet stuff from bees
igloo|House made of ice blocks
juice|Squeezed from oranges
robot|Metal machine helper
sugar|Sweet white crystals
tulip|Spring bulb flower
wagon|Four-wheeled cart
yacht|Fancy sailing boat
beach|Sandy place by the sea
cactus|Prickly desert plant
castle|Home of knights and kings
camera|Takes your photo
dragon|Fire-breathing legend
forest|Lots of trees together
garden|Where flowers and veggies grow
guitar|Six-string instrument
island|Land surrounded by water
jungle|Dense tropical rainforest
kitten|Baby cat
ladder|Climb it to reach high places
magnet|Sticks to your fridge
orange|Fruit and a colour
pirate|Sails the seas hunting treasure
rocket|Blasts into space
spider|Eight-legged web spinner
tunnel|Underground passage
violin|Bowed string instrument
window|Glass you look through
winter|Coldest season
bridge|Crosses a river
candle|Wax light with a wick
desert|Hot, dry, sandy land
pencil|Writes, and has an eraser
rabbit|Hops and loves carrots
puzzle|Jigsaw or crossword
moon|Earth's natural satellite
star|Twinkles at night
bear|Honey-loving forest animal
frog|Green hopper that croaks
rain|Water falling from clouds
sand|Beach grains
leaf|Green part of a tree
kite|Flies on a string
bell|Ring it for a ding
duck|Quacking pond bird
fish|Swims with fins
cake|Birthday dessert
ship|Large sea vessel
gold|Shiny precious metal
wind|Moving air
nest|Bird's home
seed|Plant starts as this
lamp|Gives light in a room
drum|Beat this instrument
farm|Cows and crops live here
snow|White winter flakes
bacon|Breakfast strip from a pig
badge|Sheriff's shiny pin
baker|Person who makes bread
bagel|Ring-shaped breakfast bread
banjo|Twangy string instrument
barge|Flat boat for freight
bison|Shaggy American buffalo
blimp|Airship without a rigid frame
bloom|What flowers do in spring
brook|Small stream
broom|Sweeper with bristles
brush|Painter's tool
buggy|Horse-drawn carriage
cabin|Small wooden home in the woods
camel|Desert animal with humps
canoe|Paddled boat
carol|Christmas song
chair|Seat with a back
cheese|Mouse's favourite snack
chimp|Smart primate
clown|Circus funny person
coral|Reef builder
couch|Sofa
daisy|White flower with a yellow centre
diary|Book of private thoughts
diver|Swims with an oxygen tank
donut|Sweet ring with a hole
dwarf|Small fairy tale miner
easel|Stand for a painting
elbow|Arm joint
fairy|Tiny winged magical being
feast|Big meal
ferry|Boat that carries cars across water
fudge|Chocolate candy square
gecko|Wall-climbing lizard
giant|Jack's beanstalk foe
glove|Warm hand cover
goose|Honking bird
gourd|Hard-shelled squash
hammer|Tool for nails
hatch|Come out of an egg
hippo|River giant with a big mouth
hobby|Fun pastime
ivory|Elephant tusk material
jolly|Cheerful
joker|Card with a grin
kayak|Small paddled boat
knife|Cuts a sandwich
knight|Armored warrior
llama|Fluffy Andes animal
lobby|Hotel entrance hall
lunch|Midday meal
maple|Tree with syrup
medal|Winner's award
melon|Big juicy fruit
mitten|Glove with a pocket for fingers
mocha|Chocolatey coffee
mouse|Squeaky cheese eater
mural|Giant wall painting
nacho|Tortilla chip with cheese
nurse|Hospital caregiver
oasis|Desert water spot
olive|Martini fruit
onion|Makes you cry when chopped
paint|Colour in a can
panda|Bamboo-loving bear
parrot|Talking bird
peach|Fuzzy summer fruit
pearl|Gem made in an oyster
plum|Purple stone fruit
polar|Type of bear in the Arctic
pony|Small horse
prize|Contest reward
puppy|Young dog
quilt|Patchwork blanket
quack|Duck's sound
radio|Listen to music on this
raven|Black bird in a poem
reef|Coral home
robin|Red-breasted bird
saddle|Rider's seat on a horse
salsa|Spicy dip or dance
scarf|Neck warmer
shark|Fin in the water
shell|Beach treasure
skate|Glide on ice or wheels
sleigh|Santa's ride
smile|Happy face feature
spoon|Cereal scooper
squid|Ten-armed sea creature
stork|Baby-delivering bird in tales
straw|Sip through this
swing|Playground seat on ropes
taco|Folded tortilla meal
teddy|Cuddly bear toy
thumb|Short finger
toast|Browned bread
torch|Flashlight in Britain
towel|Dries you after a bath
trail|Hiking path
trout|River fish
trunk|Elephant's nose
tuba|Big brass instrument
tutu|Ballerina's skirt
vase|Holds flowers
wheel|Round and rolling
whisk|Beats eggs
yodel|Alpine singing style
bubble|Soap sphere
pillow|Head rest in bed
puddle|Rain on the ground
cookie|Chocolate chip treat
muffin|Small cupcake-like bread
pretzel|Twisted salty snack
popcorn|Movie snack
pumpkin|Jack-o-lantern fruit
snowman|Frosty
sunrise|Dawn view
thunder|Loud sound after lightning
tractor|Farm vehicle
volcano|Mountain that erupts
dolphin|Smart sea mammal that clicks
penguin|Tuxedo-wearing Antarctic bird
giraffe|Tall spotted animal
octopus|Eight-armed sea animal
hamster|Pet that runs on a wheel
pyramid|Egyptian tomb shape
compass|Points north
lantern|Portable light
blanket|Warm bed cover
cabinet|Storage furniture
diamond|Hard shiny gem
trumpet|Brass instrument`.split('\n').map(l => { const [w, c] = l.split('|'); return { w, c }; });

  /* levels: how many words to aim for, the fewest we accept, the largest grid, how many candidate words to try */
  const LV = { easy: { target: 5, min: 5, max: 7, pick: 12 }, medium: { target: 8, min: 7, max: 9, pick: 16 }, hard: { target: 11, min: 9, max: 11, pick: 24 }, expert: { target: 14, min: 11, max: 13, pick: 32 } };

  function generate(seedStr, cfg) {
    const rnd = Core.rng(seedStr);
    for (let attempt = 0; attempt < 700; attempt++) {
      const need = attempt > 450 ? cfg.min - 2 : attempt > 250 ? cfg.min - 1 : cfg.min;
      const words = Core.shuffle(BANK, rnd).slice(0, cfg.pick), cells = new Map(), placed = [];
      const key = (x, y) => x + ',' + y, get = (x, y) => cells.get(key(x, y));
      function fits(w, x, y, d) {
        const dx = d === 'a' ? 1 : 0, dy = d === 'a' ? 0 : 1; let cross = 0;
        if (get(x - dx, y - dy) || get(x + dx * w.length, y + dy * w.length)) return -1;
        for (let i = 0; i < w.length; i++) {
          const cx = x + dx * i, cy = y + dy * i, c = get(cx, cy);
          if (c) { if (c.ch !== w[i] || c.dirs[d]) return -1; cross++; }
          else if (get(cx + dy, cy + dx) || get(cx - dy, cy - dx)) return -1;
        }
        return cross;
      }
      function put(wd, x, y, d) {
        const dx = d === 'a' ? 1 : 0, dy = d === 'a' ? 0 : 1;
        for (let i = 0; i < wd.w.length; i++) { const k = key(x + dx * i, y + dy * i); const c = cells.get(k) || { ch: wd.w[i], dirs: {}, x: x + dx * i, y: y + dy * i }; c.dirs[d] = wd; cells.set(k, c); }
        placed.push({ ...wd, x, y, d });
      }
      put(words[0], 0, 0, 'a');
      for (let wi = 1; wi < words.length && placed.length < cfg.target; wi++) {
        const wd = words[wi]; let best = null;
        for (const p of placed) {
          const d = p.d === 'a' ? 'd' : 'a';
          for (let i = 0; i < p.w.length; i++) for (let j = 0; j < wd.w.length; j++) if (p.w[i] === wd.w[j]) {
            const x = p.d === 'a' ? p.x + i : p.x - j, y = p.d === 'a' ? p.y - j : p.y + i;
            const cr = fits(wd.w, x, y, d); if (cr >= 1 && (!best || cr > best.cr || rnd() < .3)) best = { x, y, d, cr };
          }
        }
        if (best) put(wd, best.x, best.y, best.d);
      }
      if (placed.length < need) continue;
      const xs = [...cells.values()].map(c => c.x), ys = [...cells.values()].map(c => c.y);
      const minX = Math.min(...xs), minY = Math.min(...ys), cols = Math.max(...xs) - minX + 1, rows = Math.max(...ys) - minY + 1;
      if (cols > cfg.max || rows > cfg.max || cols < 4 || rows < 4) continue;
      placed.forEach(p => { p.x -= minX; p.y -= minY; });
      const num = {}; let n = 0;
      [...placed].sort((a, b) => a.y - b.y || a.x - b.x).forEach(p => { const k = p.x + ',' + p.y; if (!num[k]) num[k] = ++n; p.n = num[k]; });
      return { cols, rows, words: placed.sort((a, b) => a.n - b.n) };
    }
    return null;
  }

  Core.register({
    id: 'crossword',
    reset(ctx) { Core.store.set('cw:' + ctx.level + ':' + Core.dayKey(), null); },
    mount(ctx) {
      const root = ctx.root, today = Core.dayKey(), cfg = LV[ctx.level] || LV.easy;
      let mode = Core.store.get('cw:mode', 'daily'); const daily = mode === 'daily', skey = 'cw:' + ctx.level + ':' + today;
      const pz = generate(daily ? 'xw-' + ctx.level + '-' + today : 'xw-r-' + Math.random(), cfg); if (!pz) { root.textContent = 'Could not build a puzzle. Please reload.'; return; }
      const { cols, rows, words } = pz, grid = {}; let sel = words.find(w => w.d === 'a'), cur = null, t0 = Date.now(), tm = 0, checked = false, finished = false;
      words.forEach(w => { for (let i = 0; i < w.w.length; i++) { const x = w.x + (w.d === 'a' ? i : 0), y = w.y + (w.d === 'd' ? i : 0), k = x + ',' + y; (grid[k] = grid[k] || { x, y, ch: w.w[i], v: '', n: 0, words: {} }).words[w.d] = w; if (i === 0) grid[k].n = w.n; } });
      const saved = daily ? Core.store.get(skey, null) : null; if (saved) { Object.keys(saved.v).forEach(k => { if (grid[k]) grid[k].v = saved.v[k]; }); t0 = Date.now() - (saved.t || 0); }
      cur = grid[sel.x + ',' + sel.y];
      const save = () => { if (!daily) return; const v = {}; Object.keys(grid).forEach(k => { if (grid[k].v) v[k] = grid[k].v; }); Core.store.set(skey, { v, t: Date.now() - t0 }); };
      const hid = h('input', { class: 'cwin', type: 'text', autocomplete: 'off', autocapitalize: 'characters', 'aria-label': 'Type letters for the selected crossword cell' });
      const gEl = h('div', { class: 'cwg', style: { gridTemplateColumns: 'repeat(' + cols + ',1fr)' } }), clues = h('div', { class: 'cl' }), msg = h('div', { class: 'msg', 'aria-live': 'polite' }), timeEl = h('span', { class: 'stat' });

      function cellsOf(w) { return Array.from({ length: w.w.length }, (_, i) => grid[(w.x + (w.d === 'a' ? i : 0)) + ',' + (w.y + (w.d === 'd' ? i : 0))]); }
      function paint() {
        gEl.innerHTML = '';
        const inSel = new Set(cellsOf(sel));
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const c = grid[x + ',' + y];
          if (!c) { gEl.append(h('div', { class: 'cc b', 'aria-hidden': 'true' })); continue; }
          const cls = 'cc' + (c === cur ? ' a' : inSel.has(c) ? ' w' : '') + (checked && c.v ? (c.v === c.ch ? ' ok' : ' bad') : '');
          gEl.append(h('button', { class: cls, 'aria-label': 'Row ' + (y + 1) + ' column ' + (x + 1) + (c.v ? ', ' + c.v : ', empty'), onclick: () => click(c) }, c.n ? h('small', null, c.n) : null, c.v));
        }
        clues.innerHTML = '';
        ['a', 'd'].forEach(d => clues.append(h('h4', null, d === 'a' ? 'Across' : 'Down'), h('ol', null, words.filter(w => w.d === d).map(w => {
          const full = cellsOf(w).every(c => c.v === c.ch);
          return h('li', null, h('button', { class: (w === sel ? 'on' : '') + (full ? ' dn' : ''), onclick: () => { sel = w; cur = cellsOf(w).find(c => !c.v) || cellsOf(w)[0]; paint(); hid.focus(); } }, w.n + '. ' + w.c + ' (' + w.w.length + ')'));
        }))));
      }
      function click(c) {
        if (c === cur) { const o = c.words[sel.d === 'a' ? 'd' : 'a']; if (o) sel = o; }
        else { cur = c; if (!c.words[sel.d]) sel = c.words[sel.d === 'a' ? 'd' : 'a']; }
        paint(); hid.focus();
      }
      function move(step) { const cs = cellsOf(sel); const i = cs.indexOf(cur) + step; if (i >= 0 && i < cs.length) cur = cs[i]; }
      function typeKey(k) {
        if (finished) return;
        if (/^[a-z]$/i.test(k)) { cur.v = k.toLowerCase(); checked = false; Core.sfx.tick(); move(1); }
        else if (k === 'Backspace') { if (cur.v) cur.v = ''; else { move(-1); cur.v = ''; } checked = false; }
        else if (k === 'ArrowRight' || k === 'ArrowDown') move(1); else if (k === 'ArrowLeft' || k === 'ArrowUp') move(-1);
        else if (k === ' ' || k === 'Tab') { const o = cur.words[sel.d === 'a' ? 'd' : 'a']; if (o) sel = o; }
        else return;
        save(); paint(); hid.focus(); if (Object.values(grid).every(c => c.v === c.ch)) win();
      }
      hid.addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey) return; if (e.key.length === 1 || ['Backspace', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) { e.preventDefault(); typeKey(e.key); } });
      hid.addEventListener('input', () => { const v = hid.value; hid.value = ''; if (v) typeKey(v.slice(-1)); });
      function win() {
        finished = true; clearInterval(tm); const s = Math.round((Date.now() - t0) / 1000); if (daily) ctx.markDaily(); save();
        const nb = ctx.best(Math.floor(s / 60) + 'm ' + (s % 60) + 's (' + ctx.level + ')', s, false);
        ctx.finish({ title: 'Crossword complete!', body: 'Solved in ' + Math.floor(s / 60) + ' min ' + (s % 60) + ' sec.' + (nb ? ' New best!' : '') + (daily ? ' Try Random puzzles for more, or come back tomorrow for a new daily.' : '') });
      }
      const btn = (t, f, c = 'alt') => h('button', { class: 'btn sm ' + c, onclick: f }, t);
      root.append(h('div', { class: 'stack' },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', { class: 'seg' }, [['daily', 'Daily puzzle'], ['random', 'Random puzzle']].map(([m, t]) => h('button', { 'aria-pressed': mode === m, onclick: () => { Core.store.set('cw:mode', m); ctx.restart(); } }, t))), h('span', { class: 'muted' }, (daily ? today + ', ' : '') + words.length + ' clues'), timeEl),
        h('div', { class: 'cw' }, h('div', { class: 'stack' }, gEl, h('div', { class: 'row c' }, btn('Check', () => { checked = true; const bad = Object.values(grid).filter(c => c.v && c.v !== c.ch).length; msg.textContent = bad ? bad + ' wrong letter' + (bad > 1 ? 's' : '') : 'All filled letters are right so far!'; msg.className = 'msg ' + (bad ? 'bad' : 'good'); paint(); }),
          btn('Reveal letter', () => { cur.v = cur.ch; save(); paint(); if (Object.values(grid).every(c => c.v === c.ch)) win(); }, 'sun'), btn('Clear', () => { Object.values(grid).forEach(c => c.v = ''); checked = false; save(); paint(); })), msg), clues), hid));
      paint(); tm = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); timeEl.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 1000);
      if (Object.values(grid).every(c => c.v === c.ch)) { finished = true; msg.textContent = 'You already solved today\'s puzzle at this level. Try another level or a random puzzle!'; msg.className = 'msg good'; }
      return () => clearInterval(tm);
    }
  });
})();
