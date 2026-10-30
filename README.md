# Game Corner

15 short cognitive games for 1st-year B.Tech students, built to keep thinking sharp in the AI era. Content follows the Sem 1 syllabus (Python, HTML/CSS, Git, maths, GenAI basics).

Four games use an AI model to judge open-ended answers by meaning:

| Game | What the AI checks |
|---|---|
| Word Spread | Which of the 7 words are real tech words, and which are too close in meaning ("loop", "for", "while" count as one area)? Score = number of different areas. Also writes a short tip. |
| Beat the 7 | Is the answer typical, common, original, or invalid? ("email automation" = "email assistant") |
| Recall Rebuild | Which key facts did the student state, in their own words? |
| Missing Link | Is a different word also a genuine link for all three cues? |

Every other game uses fixed answers, checked in code.

**Safety net:** exact matches are scored in code first; only unclear answers go to the AI. If the AI is off, slow (over 7–12 s) or returns anything malformed, the game falls back to built-in matching, so students never get stuck. (Word Spread's fallback only counts words from its built-in list.)

## Project layout

```
public/index.html          the whole game app (single page, no build step)
public/world3d.js          the optional 3D world (three.js), loaded only when 3D is on
api/judge.js               Vercel serverless endpoint: POST /api/judge
api/_lib/prompts.js        instructions for each judged task
api/_lib/judge-core.js     input/output validation + OpenRouter call
scripts/cheapest-models.mjs   lists the cheapest OpenRouter models
scripts/test-judge.mjs        compares models on accuracy, speed and cost
scripts/gold.mjs              26 test cases with the correct verdicts
```

## Run it locally

Needs Node 20.6 or newer.

1. Copy the env file and add your key:
   ```
   cp .env.example .env.local
   ```
   Fill in `OPENROUTER_API_KEY`.
2. Find cheap candidates:
   ```
   npm run models
   ```
3. Test a few of them against the gold cases:
   ```
   npm run test:judge -- <model-id> <model-id> <model-id>
   ```
   Pick the cheapest one with accuracy of 90% or more, zero unusable outputs, and a median time under about 2 seconds. Put it in `OPENROUTER_MODEL`.
4. Run the site:
   ```
   npm i -g vercel
   vercel dev
   ```
   Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repo and import it in Vercel (framework preset: **Other**, no build command). `vercel.json` runs the functions in Singapore (`sin1`), next to the database.
2. In Vercel → Project → Settings → Environment Variables, add these for Production and Preview:

   | Name | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | OpenRouter key |
   | `OPENROUTER_MODEL` | `upstage/solar-mini4` |
   | `DATABASE_URL` | Neon connection string (the `-pooler` one) |
   | `ADMIN_KEY` | long random password for `/admin.html` |
   | `SITE_URL` | the deployed URL |
   | `AI_JUDGE_ENABLED` | `true` |

3. Deploy. Secrets stay on the server; the browser only calls `/api/*`.
4. If the database is new, run `npm run db:setup` once from a machine whose `.env.local` has the same `DATABASE_URL`. It is safe to run again.

## Students, progress and feedback

- **Student list:** open `/admin.html`, enter `ADMIN_KEY`, and upload a CSV with columns `NIAT ID, Name, Batch` (batch is optional and groups the leaderboard). Uploading again updates names and batches without touching progress.
- **Login:** students enter their NIAT ID and first name. Only students on the list can log in.
- **Progress** (minutes, scores, kg lifted, rounds) saves at the end of each round, every 2 minutes, and when the tab closes. Totals only go up on the server.
- **Feedback** is stored in the `feedback` table, by `kind`:
  - `session`: end-of-session rating on an 11-star scale, inspired by Airbnb's 11-star exercise. 1–5 are normal stars, and a glowing "beyond 5" row holds 6–11 (7 = "I'll be back tomorrow", 8 = "I'd tell my friends", 11 = "It changed how I learn"). The follow-up question depends on the rating: 1–4 "What got in the way?", 5–6 "What would make it a 7?", 7+ "What would make it an 11?" plus their favourite game. A session ends when the student taps "⏹ End session" (on every results screen, and on home once a session has started), picks "Done for today" at the daily goal, or taps "Leave anyway". Ending always shows a session summary and asks for the rating: stars are required and the text is optional, and "Back to training" cancels. If a student closes the tab without ending, the open session is rated the next time they come back (30+ minutes later), with a Skip.
  - `game`: one tap after each round (too light / good burn / too heavy), then an optional 1–5 emoji rating
  - `mood`: daily "How's your brain today?" check-in (tired / okay / sharp)
  - `bug`: "Something off? 🐞" reports, with the student's own words plus the screen text and device
  - `verdict`: 👍/👎 on AI checks
  - `general`: comments from the home screen

  `/admin.html` shows a summary and CSV downloads.
- **Daily 15-minute workout** (the main loop, `DAY_GOAL` in `index.html`): "Start today's workout" runs a guided circuit. Each day has a fixed plan of 5 different games (one per skill where possible, always including a new unplayed game), one short round each, never the same game twice in a row; after the plan, bonus sets rotate through all unlocked games. After each round the results stay on screen until the student taps "▶ Play next game"; that opens the next game's rules, and the round starts when they tap Play. Around it:
  - **Unlocks:** 5 starter games (one per skill), then 1 new game for each day the student reaches the daily goal (`UNLOCK_ORDER`). A "Next unlock" card and a halfway message tease the next one.
  - **Per-game levels (Lv 1–5):** a round of 80%+ moves a game up a level, under 40% moves it down. The levels change time limits, targets, lives or route length (`LADDER`). Back Track, Fallacy Hunt and Robot Path already progress on their own; the other five games have no difficulty knob yet.
  - a daily ring, with milestone messages every 5 minutes
  - a 🔥 streak of days that reach the goal (one missed day a week is forgiven) and a 7-day strip
  - 3 daily quests worth bonus kg, the same all day and new each day
  - a 🎁 chest every 5 active minutes (up to 4 a day): bonus kg, a badge, or a fact
  - a rival card ("X is 40 pts ahead") and "N classmates training now"
  - a one-time "Only N min left today" check if a student leaves the circuit early (one tap to leave)
  - the `daily` table stores active seconds per day; `/admin.html` shows how many students hit 15 minutes each day
- **Demo login:** NIAT ID `1234`, first name `Suraj` (batch `DEMO`, so it has its own leaderboard). Remove it before launch if you don't want it in the report.

## 3D world

When the device supports WebGL, Brain Gym runs as a 3D world (`public/world3d.js`, using three.js 0.169 from jsDelivr):

- a pastel sky with low-poly models (brains, dumbbells, bulbs, gears, chips…) floating at different depths; they follow the mouse and drift as you scroll
- each game countdown is a warp jump: the page fades, stars stretch into streaks in the game's colour, then the game appears
- live 3D models you can drag to spin: the login dumbbell, the brain on the workout plan, each game's skill model on its rules screen, a trophy or medal in the rank colour on results, the goal trophy, the session star and the leaderboard trophy
- 3D confetti, frosted-glass panels, tiles that lean toward the mouse, and buttons that press down

The models are one 232 KB file, `public/assets/3d/world.glb` (about 7,500 vertices in total), made by `scripts/models-glb.py`:

```
blender -b --factory-startup -P scripts/models-glb.py -- public/assets/3d/world.glb
```

**Keeping it light:** the background draws at 30 fps (full speed only during a warp), without anti-aliasing and at no more than 1× pixel density. Models in the page are drawn by one small shared WebGL canvas and copied into each slot, so the cost follows the model's size, not the screen's. On an Intel Iris Xe laptop a frame costs about 3 ms of CPU. If frames stay slow for about 4 seconds, the world drops to a lighter mode, and then turns the background off. People who ask their device for reduced motion get still 3D with no warp or confetti.

**Turning it off:**
- *Per device:* the "🌌 3D world: On/Off" button at the bottom of the home screen (and in the laptop sidebar). With 3D off, or without WebGL, the page is exactly the flat version.
- *For everyone:* the 2D version is the git tag `v-2d` (branch `brain-gym-theme`). The 3D version is on branch `3d-experience`.

## 3D images

`public/assets/3d/` also holds five small transparent WebP renders, shown when 3D is off (trophy, star, chest, dumbbell, flame; about 60 KB in total) used on the login screen, streaks, goal celebration, reward chests, session rating and leaderboard. They are made from simple shapes by `scripts/models3d.py`, using Blender 5.2 in headless mode:

```
blender -b --factory-startup -P scripts/models3d.py -- public/assets/3d [trophy star chest dumbbell flame]
```

The images have no baked floor shadow; the page adds a CSS `drop-shadow`, so they sit cleanly on any background.

## Before a wider rollout

- Login uses NIAT ID + first name, with no password. That suits a pilot but a classmate who knows both could log in as someone else.
- Progress totals come from the browser, so a determined student could inflate points. Move scoring to the server before anything with real stakes.
- The answer cache and rate limits live in memory per server instance. For many more students, move them to Upstash Redis.
- Review AI verdicts marked unfair each week, and add real mistakes to `scripts/gold.mjs`.
