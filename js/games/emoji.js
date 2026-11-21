/* Emoji Guessing Game
   Decode the emoji. Four levels pick the puzzle pool, the timer and the number of tries.
   Solo: 10-15 puzzles. Multiplayer: players take turns, 4-7 puzzles each.
   Points: 3 for a clean answer, 2 with a hint, +1 for a fast answer. */
(function () {
  const { h } = Core;

  Core.css('emoji', `
    .eg{display:grid;gap:16px;justify-items:center;text-align:center}
    .puz{font-size:clamp(3rem,13vw,5.5rem);line-height:1.15;padding:18px 22px;border:3px dashed var(--line);border-radius:22px;background:var(--paper);min-width:min(100%,360px);display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:.08em}
    .puz .ej{margin:0 .04em}
    .cat{font-weight:800;padding:2px 14px;border-radius:99px;border:2px solid var(--line);background:var(--sun);color:#1B1740}
    .blanks{font-family:var(--head);font-weight:700;font-size:1.5rem;letter-spacing:.2em;min-height:2rem;word-break:break-word}
    .guess{display:flex;gap:10px;width:100%;max-width:520px}
    .guess input{flex:1;font-size:1.1rem}
  `);

  /* [emoji, accepted answers separated by |, category, difficulty 1-3] */
  const RAW = [
    // level 1: single things and simple words
    ['🍎', 'apple', 'Food', 1], ['🐘', 'elephant', 'Animal', 1], ['🚀', 'rocket', 'Thing', 1], ['🎂', 'cake|birthday cake', 'Food', 1], ['🐱', 'cat|kitten', 'Animal', 1],
    ['🐶', 'dog|puppy', 'Animal', 1], ['☀️', 'sun', 'Nature', 1], ['🌙', 'moon', 'Nature', 1], ['🚲', 'bike|bicycle', 'Thing', 1], ['🍌', 'banana', 'Food', 1],
    ['🏠', 'house|home', 'Place', 1], ['🌳', 'tree', 'Nature', 1], ['⚽', 'soccer|football|soccer ball', 'Sport', 1], ['📚', 'book|books', 'Thing', 1],
    ['✈️', 'airplane|plane|aeroplane', 'Thing', 1], ['🎸', 'guitar', 'Music', 1], ['🐢', 'turtle|tortoise', 'Animal', 1], ['🐸', 'frog', 'Animal', 1],
    ['🦁', 'lion', 'Animal', 1], ['🍦', 'ice cream', 'Food', 1], ['🌈', 'rainbow', 'Nature', 1], ['⭐', 'star', 'Nature', 1], ['🐝', 'bee', 'Animal', 1],
    ['🚗', 'car', 'Thing', 1], ['🍕', 'pizza', 'Food', 1], ['🎈', 'balloon', 'Thing', 1], ['🐟', 'fish', 'Animal', 1], ['🔑', 'key', 'Thing', 1],
    ['⏰', 'clock|alarm clock|alarm', 'Thing', 1], ['🎁', 'present|gift', 'Thing', 1], ['🦄', 'unicorn', 'Animal', 1],
    ['🌻☀️', 'sunflower', 'Word', 1], ['🔥🐕', 'hot dog|hotdog', 'Food', 1], ['❄️🧍⛄', 'snowman', 'Word', 1], ['👩‍🚀🌙', 'astronaut', 'Word', 1],
    ['🏴‍☠️🦜🗺️', 'pirate', 'Word', 1], ['🍯🐝', 'honeybee|honey bee', 'Word', 1], ['🧈🪰', 'butterfly', 'Word', 1], ['☔☀️🌈', 'rainbow', 'Word', 1],
    // level 2: movies, places, songs, compounds, stories
    ['🦁👑', 'the lion king', 'Movie', 2], ['❄️👸⛄', 'frozen', 'Movie', 2], ['🕷️🧍‍♂️', 'spider man|spiderman', 'Movie', 2], ['🦇🧔', 'batman', 'Movie', 2],
    ['🐠🔍', 'finding nemo|nemo', 'Movie', 2], ['💍🧙‍♂️🌋', 'the lord of the rings|lord of the rings', 'Movie', 2], ['⚡👓🧙', 'harry potter', 'Movie', 2],
    ['🚢🧊💔', 'titanic', 'Movie', 2], ['🦈🌊😱', 'jaws', 'Movie', 2], ['🗑️🤖🌱', 'wall e|walle', 'Movie', 2], ['🤠🧸🚀', 'toy story', 'Movie', 2],
    ['👻🚫📞', 'ghostbusters', 'Movie', 2], ['🦖🏝️', 'jurassic park', 'Movie', 2], ['🐀👨‍🍳', 'ratatouille', 'Movie', 2], ['🧞🪔🐒', 'aladdin', 'Movie', 2],
    ['🧜‍♀️🦀🎶', 'the little mermaid|little mermaid', 'Movie', 2], ['🐼🥋', 'kung fu panda', 'Movie', 2], ['🏠🎈👴', 'up', 'Movie', 2], ['🌌⚔️🤖', 'star wars', 'Movie', 2],
    ['🗼🥖', 'paris', 'Place', 2], ['🗽🍎🚕', 'new york|new york city|nyc', 'Place', 2], ['🎡👑☂️', 'london', 'Place', 2], ['🐨🦘🏄', 'australia', 'Place', 2],
    ['🍕🍝🛵', 'italy', 'Place', 2], ['🌮🌵🎺', 'mexico', 'Place', 2], ['🏔️🍫🧀', 'switzerland', 'Place', 2], ['🐪🔺☀️', 'egypt', 'Place', 2], ['🍣🗻🌸', 'japan', 'Place', 2],
    ['⭐✨🌙', 'twinkle twinkle little star|twinkle twinkle', 'Song', 2], ['🚌🛞🔄', 'the wheels on the bus|wheels on the bus', 'Song', 2], ['🐑⚫🧶', 'baa baa black sheep', 'Song', 2],
    ['🕷️💧🧗', 'itsy bitsy spider|incy wincy spider', 'Song', 2], ['🎂🎈🎶', 'happy birthday', 'Song', 2], ['🚣🌊😴', 'row row row your boat|row your boat', 'Song', 2],
    ['🔔🛷', 'jingle bells', 'Song', 2], ['🍔👑', 'burger king', 'Word', 2], ['🌙🚶', 'moonwalk', 'Word', 2], ['🍓🍰', 'strawberry shortcake|strawberry cake', 'Food', 2], ['🐻🍯🎈', 'winnie the pooh|pooh', 'Character', 2],
    ['🍰', 'piece of cake', 'Phrase', 2], ['🌧️🐱🐶', 'raining cats and dogs|its raining cats and dogs', 'Phrase', 2], ['🧊🔨', 'break the ice', 'Phrase', 2],
    ['🌧️🧥', 'raincoat', 'Word', 2], ['🍎🥧', 'apple pie', 'Food', 2], ['🔥🚒', 'fire truck|firetruck|fire engine', 'Thing', 2], ['🦷🧚', 'tooth fairy', 'Character', 2],
    ['🐝🏠', 'beehive|bee hive', 'Word', 2], ['📖🐛', 'bookworm', 'Word', 2], ['🌟🐟', 'starfish', 'Animal', 2], ['🥜🧈', 'peanut butter', 'Food', 2],
    ['🧂🌶️', 'salt and pepper|salt pepper', 'Food', 2], ['🎅🎄', 'christmas|santa claus|santa', 'Holiday', 2], ['🐰🥚', 'easter bunny|easter', 'Holiday', 2],
    ['🎃👻', 'halloween', 'Holiday', 2], ['🦃🍽️', 'thanksgiving', 'Holiday', 2], ['🎆🕛', 'new year|new years|new years eve', 'Holiday', 2], ['🏖️🏐', 'beach volleyball|volleyball', 'Sport', 2],
    ['🥛🍪', 'milk and cookies|cookies and milk', 'Food', 2], ['🐷🐷🐷🐺', 'the three little pigs|three little pigs', 'Story', 2], ['🍎👸🧙‍♀️', 'snow white', 'Story', 2],
    ['🥿🎃👸', 'cinderella', 'Story', 2], ['🧚🏴‍☠️', 'peter pan', 'Story', 2], ['🐻🪑🥣', 'goldilocks and the three bears|goldilocks', 'Story', 2], ['👸🐸💋', 'the frog prince|frog prince', 'Story', 2],
    ['🧛🦇', 'dracula|vampire', 'Character', 2], ['🎬🍿', 'movie theater|cinema|movies|movie', 'Place', 2],
    // level 3: phrases, rhymes and trickier titles
    ['🐘🚪', 'elephant in the room', 'Phrase', 3], ['🐦🐦🪨', 'kill two birds with one stone', 'Phrase', 3], ['1️⃣🔵🌙', 'once in a blue moon', 'Phrase', 3],
    ['🍎👁️', 'apple of my eye', 'Phrase', 3], ['⏰💵', 'time is money', 'Phrase', 3], ['🐴🛒', 'put the cart before the horse|cart before the horse', 'Phrase', 3],
    ['🐺🐑', 'wolf in sheeps clothing|a wolf in sheeps clothing', 'Phrase', 3], ['🐱👜', 'let the cat out of the bag|cat out of the bag', 'Phrase', 3],
    ['🌅🐦🪱', 'the early bird catches the worm|early bird catches the worm|early bird', 'Phrase', 3], ['🍋🥤😊', 'when life gives you lemons|life gives you lemons|lemonade', 'Phrase', 3],
    ['🥚🧺', 'dont put all your eggs in one basket|all your eggs in one basket|eggs in one basket', 'Phrase', 3], ['💡⚡', 'bright idea|light bulb moment|lightbulb moment|good idea', 'Phrase', 3],
    ['🐄🌙', 'the cow jumped over the moon|cow jumped over the moon|hey diddle diddle', 'Rhyme', 3], ['🥚🧱', 'humpty dumpty', 'Rhyme', 3],
    ['🌟🎶🌈', 'somewhere over the rainbow|over the rainbow', 'Song', 3], ['❄️🚫🙅', 'let it go', 'Song', 3], ['🕷️🌐🐷', 'charlottes web', 'Movie', 3],
    ['🚲🌕👽', 'et|e t|et the extraterrestrial', 'Movie', 3], ['🐯🚣🌊', 'life of pi', 'Movie', 3], ['🍝🐕🐶', 'lady and the tramp', 'Movie', 3],
    ['🦌🔴👃', 'rudolph the red nosed reindeer|rudolph', 'Story', 3], ['🐑🐺🌕', 'the boy who cried wolf|boy who cried wolf|cried wolf', 'Story', 3],
    ['🐢🐇🏁', 'the tortoise and the hare|tortoise and the hare|the tortoise and the hare|the hare and the tortoise', 'Story', 3],
    // ---- more level 1
    ['🐮','cow','Animal',1],['🐷','pig','Animal',1],['🐴','horse','Animal',1],['🐑','sheep|lamb','Animal',1],['🐔','chicken|hen','Animal',1],['🦆','duck','Animal',1],['🐭','mouse','Animal',1],['🐰','rabbit|bunny','Animal',1],['🐻','bear','Animal',1],['🐼','panda','Animal',1],['🦊','fox','Animal',1],['🐵','monkey','Animal',1],['🦒','giraffe','Animal',1],['🦓','zebra','Animal',1],['🐊','crocodile|alligator','Animal',1],['🐙','octopus','Animal',1],['🦀','crab','Animal',1],['🐳','whale','Animal',1],['🦋','butterfly','Animal',1],['🐌','snail','Animal',1],
    ['🍓','strawberry','Food',1],['🍇','grapes|grape','Food',1],['🍉','watermelon','Food',1],['🍊','orange','Food',1],['🍋','lemon','Food',1],['🍒','cherry|cherries','Food',1],['🥕','carrot','Food',1],['🌽','corn','Food',1],['🍩','donut|doughnut','Food',1],['🍪','cookie','Food',1],['🍔','burger|hamburger','Food',1],['🍟','fries|french fries|chips','Food',1],['🌮','taco','Food',1],['🥐','croissant','Food',1],
    ['🚌','bus','Thing',1],['🚂','train','Thing',1],['🚁','helicopter','Thing',1],['⛵','sailboat|boat','Thing',1],['🚒','fire truck|firetruck|fire engine','Thing',1],['🏰','castle','Place',1],['⛺','tent|camping','Thing',1],['📷','camera','Thing',1],['🎧','headphones','Thing',1],['💡','light bulb|lightbulb|bulb','Thing',1],['☂️','umbrella','Thing',1],['🔔','bell','Thing',1],['🧸','teddy bear|teddy','Thing',1],['🎹','piano','Music',1],['🥁','drum|drums','Music',1],['🎺','trumpet','Music',1],
    // ---- more level 2
    ['🧙‍♀️🌈🦁','the wizard of oz|wizard of oz','Movie',2],['🐘🪶','dumbo','Movie',2],['🦌🌲','bambi','Movie',2],['🌹👸🧌','beauty and the beast','Movie',2],['🧚‍♀️🏰😴','sleeping beauty','Story',2],['🐺👵🔴','little red riding hood|red riding hood','Story',2],['🏎️🏁⚡','cars','Movie',2],
    ['🏀🏃','basketball','Sport',2],['🎾🏸','tennis','Sport',2],['🏊‍♂️🌊','swimming','Sport',2],['⛷️❄️','skiing','Sport',2],['🏄🌊','surfing','Sport',2],['🥇🏅','gold medal|medal|olympics','Sport',2],
    ['🏝️🥥🌴','tropical island|island|beach','Place',2],['⛰️❄️🏔️','mountain|mountains','Place',2],['🎢🎡🎠','amusement park|theme park|fun fair|funfair|carnival','Place',2],['🏥🚑','hospital','Place',2],['🏫📚✏️','school','Place',2],['🛒🥦🥛','supermarket|grocery store|grocery|store','Place',2],['✈️🧳🛄','airport','Place',2],['🚀🌌🪐','outer space|space|galaxy','Place',2],['🏟️⚽📣','stadium','Place',2],['🏦💰','bank','Place',2],['📚🤫','library','Place',2],
    ['👓☀️','sunglasses','Thing',2],['🔥🏠','fireplace','Word',2],['🌙💡','moonlight','Word',2],['🍯🌙','honeymoon','Word',2],['🌳🏠','treehouse|tree house','Word',2],['🕷️🌐','spiderweb|spider web|cobweb','Word',2],['🌽🍿','popcorn','Food',2],['🥞🍁','pancakes|pancake','Food',2],['🧀🍔','cheeseburger','Food',2],['🍫🥛','chocolate milk','Food',2],['🍝🍅','spaghetti','Food',2],['🍣🐟','sushi','Food',2],['🥗🥬','salad','Food',2],['🍲🥕','soup|stew','Food',2],['🥪🥓','sandwich|blt','Food',2],
    ['🎬⭐','movie star|actor|actress|celebrity','Word',2],['🎤🎶','singer|karaoke|singing','Word',2],['👩‍🍳🍳','chef|cook','Word',2],['👨‍🚒🔥','firefighter|fireman','Word',2],['👩‍⚕️💉','doctor|nurse','Word',2],['🕵️🔍','detective','Word',2],['🧑‍🎨🖼️','artist|painter','Word',2],['👩‍🏫📚','teacher','Word',2],
    ['💘🌹','valentines day|valentine|valentines','Holiday',2],['🥚🌷🐣','easter','Holiday',2],['🧞🪄🏺','genie','Character',2],['🦸‍♂️🦸‍♀️','superhero|superheroes|super hero','Character',2],['🐻🤗','bear hug','Phrase',2],['🧠🌪️','brainstorm|brain storm','Word',2],
    ['🐑👧','mary had a little lamb|little lamb','Song',2],['👨‍🌾🐄🐷','old macdonald had a farm|old macdonald|old mcdonald','Song',2],['🔤🎵','abc song|the alphabet song|alphabet song|abcs','Song',2],
    // ---- more level 3
    ['🐦✋','a bird in the hand is worth two in the bush|bird in the hand','Phrase',3],['🐴🎁👄','dont look a gift horse in the mouth|gift horse','Phrase',3],['🔥🍳','out of the frying pan into the fire|out of the frying pan','Phrase',3],['🍰🍒','cherry on top|cherry on the cake|icing on the cake','Phrase',3],
    ['🛌🐑🐑🐑','counting sheep|count sheep','Phrase',3],['🐟🏜️','fish out of water','Phrase',3],['💵🌳','money doesnt grow on trees|money grows on trees','Phrase',3],['🏠❤️','home is where the heart is|home sweet home','Phrase',3],['🧵🌾','needle in a haystack','Phrase',3],['🥶🦶','cold feet|get cold feet','Phrase',3],
    ['🎯💯','hit the bullseye|bullseye|spot on|bulls eye','Phrase',3],['🍌🍌🐒','go bananas|going bananas|going ape','Phrase',3],['🥔🛋️','couch potato','Phrase',3],['🐭⛰️','making a mountain out of a molehill|mountain out of a molehill|molehill','Phrase',3],['🦆🦆🦆➡️','get your ducks in a row|ducks in a row','Phrase',3],
    ['🕶️💊','the matrix|matrix','Movie',3],['🦇🃏','the dark knight|joker|dark knight','Movie',3],['🌌🚀👨‍🚀📡','interstellar','Movie',3],['🦍🏙️🗼','king kong|kong','Movie',3],['💀🎸🌼','coco','Movie',3],['😡😢','inside out','Movie',3],['🐉🧒','how to train your dragon|train your dragon','Movie',3],
    ['🧙‍♂️🐉💍','the hobbit|hobbit','Movie',3],['🦸‍♂️🛡️⭐','captain america','Movie',3],['🤖🚗🔄','transformers','Movie',3],['🐒🛏️','five little monkeys|ten in the bed|five little monkeys jumping on the bed','Song',3],['😊👏','if youre happy and you know it|if you are happy and you know it|happy and you know it','Song',3],
  ].map(([e, a, c, d]) => ({ e, a: a.split('|'), c, d }));

  const LV = {
    easy: { pool: [1], rounds: 10, per: 4, time: 45, tries: 3 },
    medium: { pool: [2], rounds: 12, per: 5, time: 40, tries: 3 },
    hard: { pool: [2, 3], rounds: 15, per: 6, time: 35, tries: 3 },
    expert: { pool: [3], rounds: 15, per: 7, time: 30, tries: 2 }
  };

  const norm = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, '').replace(/\b(the|a|an)\b/g, '').replace(/\s+/g, '');
  function lev(a, b) { const m = []; for (let i = 0; i <= a.length; i++) m[i] = [i]; for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function matches(guess, puzzle) { const g = norm(guess); if (!g) return false; return puzzle.a.some(a => { const n = norm(a); return g === n || (n.length >= 7 && lev(g, n) <= 1); }); }

  Core.register({
    id: 'emoji',
    mount(ctx) {
      const L = LV[ctx.level] || LV.easy, root = ctx.root, total = ctx.multi ? ctx.players.length * L.per : L.rounds, LIMIT = L.time;
      let pool = Core.shuffle(RAW.filter(p => L.pool.includes(p.d)));
      if (pool.length < total) pool = pool.concat(Core.shuffle(RAW.filter(p => p.d >= Math.min(...L.pool))));
      const deck = pool.filter((p, i, a) => a.findIndex(q => q.e === p.e) === i);
      let n = 0, left = LIMIT, tm = 0, hinted = false, tries = 0, solved = 0;

      function next() {
        clearInterval(tm);
        if (n >= total) { if (!ctx.multi) { const s = ctx.players[0].score; const nb = ctx.best(s + ' pts', s); return ctx.finish({ title: 'Decoded ' + solved + ' of ' + total, body: 'You scored ' + s + ' points.' + (nb ? ' New best!' : ''), unit: 'pts' }); } return ctx.finish({ unit: 'pts' }); }
        if (ctx.multi) ctx.setTurn(n % ctx.players.length);
        const pz = deck[n % deck.length]; left = LIMIT; hinted = false; tries = 0;
        const clue = h('div', { class: 'blanks', 'aria-live': 'polite' }, pz.a[0].replace(/[a-z0-9]/gi, '_'));
        const msg = h('div', { class: 'msg', 'aria-live': 'polite' }), bar = h('i'), input = h('input', { type: 'text', placeholder: 'Type your guess', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Your guess' });
        const hintBtn = h('button', { class: 'btn sun sm', onclick: () => { hinted = true; hintBtn.disabled = true; clue.textContent = pz.a[0].replace(/[a-z0-9]/gi, (c, i) => i === 0 ? c.toUpperCase() : '_'); } }, 'Hint');
        function end(ok, pts) {
          clearInterval(tm); input.disabled = true; hintBtn.disabled = skip.disabled = go.disabled = true;
          if (ok) { solved++; Core.sfx.ok(); ctx.addScore(ctx.multi ? ctx.turn : 0, pts); msg.textContent = 'Yes! +' + pts + ' points'; msg.className = 'msg good'; }
          else { Core.sfx.bad(); msg.textContent = 'It was: ' + pz.a[0]; msg.className = 'msg bad'; }
          clue.textContent = pz.a[0];
          setTimeout(() => { n++; next(); }, 1700);
        }
        function submit() {
          if (!input.value.trim()) return;
          if (matches(input.value, pz)) { end(true, (hinted ? 2 : 3) + (left > LIMIT * .6 && !hinted ? 1 : 0)); }
          else { tries++; Core.sfx.bad(); input.value = ''; input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 400); if (tries >= L.tries) end(false, 0); else { msg.textContent = 'Not quite. ' + (L.tries - tries) + ' tries left'; msg.className = 'msg bad'; } }
        }
        const go = h('button', { class: 'btn', onclick: submit }, 'Guess'), skip = h('button', { class: 'btn alt sm', onclick: () => end(false, 0) }, 'Skip');
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        root.innerHTML = '';
        root.append(h('div', { class: 'eg' },
          h('div', { class: 'row c' }, h('span', { class: 'cat' }, pz.c), h('span', { class: 'muted' }, 'Puzzle ' + (n + 1) + ' of ' + total), ctx.multi ? h('b', null, ctx.player.name + "'s turn") : null),
          h('div', { class: 'puz', role: 'img', 'aria-label': 'Emoji puzzle' }, Core.emo(pz.e)),
          h('div', { class: 'bar', style: { width: '100%', maxWidth: '520px' } }, bar), clue,
          h('div', { class: 'guess' }, input, go), h('div', { class: 'row c' }, hintBtn, skip), msg));
        input.focus();
        tm = setInterval(() => { left--; bar.style.width = (left / LIMIT * 100) + '%'; if (left <= 5) Core.sfx.tick(); if (left <= 0) end(false, 0); }, 1000);
      }
      next();
      return () => clearInterval(tm);
    }
  });
})();
