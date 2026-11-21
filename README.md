# Pocket Arcade

Twelve tiny browser games in plain HTML, CSS and JavaScript. No frameworks, no CDN, no build step.

## Run it
Open `index.html` in a browser. It also works from any static host (GitHub Pages, Netlify, Vercel).
Optional local server: `python3 -m http.server 8000`, then visit http://localhost:8000

## Games (one file each, in `js/games/`)
| Game | File | Solo | Multiplayer (hot-seat, 2-4 players) |
|---|---|---|---|
| Daily Word | word.js | Daily word or practice | Same secret word, own board per player |
| Guess the Sound | sound.js | 8 rounds | Turn-based, 3 rounds each |
| Emoji Guess | emoji.js | 10 puzzles | Turn-based, 3 puzzles each |
| Memory Challenge | memory.js | Card match, Sequence | Pair race, last-one-standing sequence |
| Optical Illusions | illusions.js | Quiz + Experience tab | Turn-based quiz |
| Spot the Difference | spotdiff.js | 3 timed rounds | Shared scene, turns |
| Reaction Test | reaction.js | 5 attempts | Keyboard/touch duel (keys A, L, V, N) |
| Drawing Challenge | drawing.js | Prompt, timer, PNG export | Everyone draws, then votes |
| Daily Mini Crossword | crossword.js | Generated daily from the date | Solo only |
| Creative Challenges | creative.js | Prompts, timers, favourites | Same challenge, group vote |
| Snake Rush | snake.js | Arcade snake, walls, rocks, bonus apples | Turn-based, most apples wins |
| Tile Merge | merge.js | Slide and merge to a goal tile | Timed turns, highest score wins |

## Content
Roughly: 260 emoji puzzles, 42 synthesized sounds, 21 illusions, 9 spot-the-difference themes, about 220 crossword clues,
over 1,400 answer words for Daily Word (4, 5 and 6 letters), and hundreds of drawing and creative prompts.

## Levels
Every game has four levels (Easy, Medium, Hard, Expert), picked from the buttons above the game. Higher levels mean more rounds, more choices, shorter timers or extra rules.
The finish screen offers a "Next level" button.

## Structure
- `index.html` hub page
- `css/styles.css` shared styles, `css/fonts.css` local font faces
- `js/core.js` hub, routing, player/score handling, sound and helpers
- `js/games/*.js` the games. Each calls `Core.register({id, mount(ctx)})`
- `data/words.js` word lists for Daily Word
- `fonts/` Fredoka and Nunito (served locally, see LICENSE files)
- `assets/emoji/` Twemoji SVG files for every emoji used (CC-BY 4.0, see LICENSE.txt). Emoji are drawn with `Core.emo('🦁')`, so they look the same on every device

## Add a game
1. Create `js/games/mygame.js` and call `Core.register({ id:'mygame', mount(ctx){ ... return cleanup; } })`.
2. Add an entry to the `GAMES` list in `js/core.js`.

`ctx` gives you: `root`, `multi`, `level` ('easy' to 'expert'), `restart()`, `players`, `player`, `setTurn()`, `nextTurn()`, `addScore()`, `best()`, `markDaily()`, `finish()`.

Scores, streaks and daily progress are stored in localStorage on the player's device. All sounds are synthesized with WebAudio.
