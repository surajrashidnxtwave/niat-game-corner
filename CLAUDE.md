# Notes for Claude Code

## What this is
A single-page game app (`public/index.html`) plus one Vercel serverless function (`api/judge.js`) that calls OpenRouter to judge open-ended answers in four games: Word Spread, Beat the 7, Recall Rebuild, Missing Link.

Users are 1st-year B.Tech students in India. All game content must stay within their Sem 1 syllabus: Python basics up to dictionaries, HTML/CSS (Flexbox, Grid, Tailwind), Git and command line, number systems and bitwise, quantitative aptitude, GenAI basics. No DSA.

## First task: choose the cheapest reliable model
1. Check `.env.local` has `OPENROUTER_API_KEY`.
2. Run `npm run models` to list the cheapest text models.
3. Pick 4–6 candidates. Prefer models that support `response_format` (the `json` column), and skip free models unless the user asks (they are rate-limited and can disappear).
4. Run `npm run test:judge -- <id1> <id2> ...`.
5. Choose the cheapest model with: accuracy >= 90%, zero unusable outputs, median latency under about 2000 ms. If none qualifies, try the next price tier.
6. Set `OPENROUTER_MODEL` in `.env.local`, and tell the user to set the same value in Vercel.
7. Report a short table: model, accuracy, median ms, cost per 1,000 checks.

## Rules
- Never expose the API key to the browser. All model calls go through `api/judge.js`.
- Keep the fallback: if the judge fails, the games must still work with built-in matching.
- Student text is untrusted. Keep it inside the tags in `prompts.js`, keep input length limits in `validatePayload`, and only use outputs that pass `validateResult`.
- Keep `temperature: 0` so the same answer always gets the same verdict.
- Before changing any game content, check it: one correct answer per puzzle, Indian context, Sem 1 topics only. Run Python snippets to confirm outputs.
- When a judging mistake is found, add it to `scripts/gold.mjs` first, then adjust the prompt, then re-run `npm run test:judge`.
- Keep plain, simple English in anything students read.

## Drive School (branch drive-school)
- Spec: `Mindset/Drive School — Build Handoff for Claude Code.md`. Days 1–3 started from its POC; their copy was rewritten casual in Nov 2026, and Day 3 now uses the original ship story.
- Code: `public/drive/drive.js` + `drive.css` (engine, home, player, Drive Profile tab, Drive leaderboard), lessons as data in `public/content/drive/dayN.js`, Turbo in `public/assets/turbo/`, server in `api/drive.js`, tables `drive_*` in `scripts/db-setup.mjs`.
- To add a day: write `dayN.js`, then raise `BUILT` in `drive.js` AND `DRIVE_LAST_BUILT` in `api/drive.js` (both must match).
- Take a Stand is never judged or scored. Peer split only at 20+ answers. Drive points never mix with Brain Gym points.
- Day 0 uses our own mindset and stick-with-it questions (not the published Dweck/Grit-S scales, so no permission needed). Don't compare them with published norms. Students aren't told about the Day 56 re-check.
- Days 0 and 4–7 were written by Claude and are marked FOR TEAM REVIEW in their file headers.
- Day 0 is required: Drive School shows only a quiet Day 0 start screen until it's done, and Day 1 needs Day 0 (client and server). Turbo introduces himself on Day 0's first screen ("Meet Turbo"), not before.
- Turbo talks: info screens are chat bubbles typed word by word, in step with recorded clips (Kokoro af_heart, normal pitch, 100% speed, short pauses between phrases). Clips live in `public/assets/voice/` with `manifest.json`. Lines without a clip type silently. Copy is short and casual for Gen Z students.
- After ANY change to Turbo's lines (lesson body/guide/wrap text, or the TURBO_LINES block in `drive.js`), run `python scripts/turbo-voice.py`. It records only new or changed lines and deletes unused clips. Needs kokoro-onnx + model files in `~/.cache/kokoro` (see the script header).
- Test accounts = batch DEMO (demo login 1234): every built day unlocked, no Day 0 gate, no order, no daily cap (drive.js tester() and api/drive.js finish).
- Lesson rating: after every first finish the student must give an 11-star rating (same idea as Brain Gym's end-of-session rating) before they can leave or start the next lesson. Stored in `drive_events` as kind `rate` (one per student per day, via `/api/drive` action `rate`). Unsent or skipped ratings wait in localStorage `ds_rate`.
- Admin opens on a Summary page (both products, "What to look at" alerts, universities).
- Admin: the "Drive School" tab in `public/admin.html` loads `/api/admin?view=drive` (batch DEMO left out) and reads question text from the lesson files. CSVs: drive_students, drive_events, drive_ratings.
- Test accounts can jump to any screen from the console: `Drive.open(day, screenIndex)` (index after review sets expand).

## English Adda (branch english-adda)
- Research: `English Adda/English Adda — Research.md`. Build spec: `English Adda/English Adda — Build Spec.md` (HTML copies next to them; regenerate after edits). Follow the spec's build order (§10).
- Code: `public/english/english.js` + `english.css`, server `api/english.js`, tables `english_*` in `scripts/db-setup.mjs`.
- Host is **Yapper** (purple chatter-monster, art in `public/assets/yapper/`), not Turbo. Turbo stays in Drive School. Yapper speaks in the same Kokoro af_heart voice; a second free Kokoro voice is allowed for dialogues.
- Who sees it: batches in env `ENGLISH_BATCHES` (comma list, default `DEMO`, `ALL` = everyone). Pilot is DEMO only until the product owner says go. The tab stays hidden for everyone else.
- Daily: goal 15 active minutes (own timer, counted only while a game or the level check runs), fresh content closes at 25 minutes (DEMO: no limit). Streak = goal days, one missed day forgiven per 7 days.
- Adda points never mix with Brain Gym or Drive points. Skill levels (voc, gra, lis, rea, wri; 1–8) are private: never shown to other students or on the leaderboard.
- No speaking features. English only (no Hindi/Telugu/Tamil hints). Never call anything a "test" in student copy.
- Content: Claude writes it in bulk, scripts check it, then a separate reviewer agent checks it as a third person before it ships. Follow the Indian English policy in Research §6 (accept / formal-only / correct). Use short English names for student-facing things.
- Level check ("Find your level"): content + scoring live server-side in `api/_lib/english-check.js` (answers never sent to the browser). Actions checkstart/checknext/checkdone in `api/english.js`. Test accounts redo it from the home link.
- Audio: after ANY change to Yapper's lines (YAPPER_LINES block in `english.js`) or listening content, run `python scripts/english-voice.py`. Listening sentences are "secret": recorded under sha1(voice|speed|text) names and kept OUT of the public manifest, so students can't read answers.
- Local testing without the Vercel CLI: `npm run dev:local` (scripts/dev-server.mjs serves `public/` and runs `api/*.js` with `.env.local`, the dev DB) on http://127.0.0.1:3000.
