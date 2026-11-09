# English Adda — Build Spec

*Nov 9, 2026 · v1 design for Claude Code to build. Read with `English Adda — Research.md` (the "why"). This doc is the "what".*

---

## 1. What we're building

**English Adda** is a new section in Game Corner, next to Brain Gym and Drive School. It is a **daily 15-minute English workout made of short games**. It trains reading, writing, listening, vocabulary and grammar. Underneath, every game practises a task type used in campus placement tests (Versant, AMCAT, TCS NQT, Accenture), but it must never look or feel like test prep.

| Fixed decision | Value |
|---|---|
| Who sees it | **Batch DEMO only** until the product owner tests it and says go. |
| Skills in v1 | Vocabulary, grammar, listening, reading, writing. **No speaking.** |
| Daily time | Goal **15 active minutes**. Fresh content closes at **25 minutes**. Word Vault review stays open. |
| Start | A **required level check** on the first visit (about 5 min) sets the starting levels and which games each student gets. |
| Points | **Adda points**, separate from Brain Gym and Drive School points. Own leaderboard tab. |
| Language | English only. No Hindi, Telugu or Tamil hints. |
| Voices | Kokoro **af_heart** (also used for Turbo) for everything. A second free Kokoro male voice (**am_michael**, to be confirmed by listening) for the second speaker in dialogues only. Everything is pre-recorded and served as static files. |
| Host | **Yapper** (locked 2026-11-09): a purple fluffy chatter-monster whose antennae end in quotation marks. "Yapping" is Gen Z slang for talking non-stop. Turbo stays only in Drive School. Art: `public/assets/yapper/yapper-{idle,correct,thinking,oops}.svg`. Yapper speaks in the Heart voice, the same Kokoro voice as Turbo. |
| Content | Claude writes it in bulk. Scripts check it automatically. A separate reviewer agent checks it as a third person. File headers say `FOR TEAM REVIEW`. |
| Modes | Must work in both the 2D and 3D versions of Game Corner. |

### 1.1 Rules students feel (copy for the help card)
- Play **15 minutes a day** to fill your ring and keep your streak.
- After 25 minutes, Adda closes for the day. Your **Word Vault** stays open.
- No lives, no hearts. Mistakes cost nothing. Every miss gets a hint first.
- Your level is **only yours**. Nobody else sees it.
- The leaderboard counts effort (rounds played, goal days), not who is "best at English".

---

## 2. Skills and levels

### 2.1 Five skill tracks
Each student has a private level from 1 to 8 for each skill:

| Skill | Code | Trained by |
|---|---|---|
| Vocabulary | `voc` | Word Groups, Real or Fake, Word Vault, Reel Reader (taps) |
| Grammar | `gra` | Jumble, Spot & Fix |
| Listening | `lis` | Catch It, Story Rewind |
| Reading | `rea` | Reel Reader, Vanish |
| Writing | `wri` | Fix My Email, Vanish (write mode), Story Rewind (write mode) |

**Overall Adda Level** = the rounded average of the five skill levels. It is shown only to the student.

### 2.2 Level names (shown to the student)

The CEFR column is for the admin only.

| Level | Name | CEFR-J (admin only) |
|---|---|---|
| 1 | First Sip | Pre-A1 / A1.1 |
| 2 | Regular | A1.2–A1.3 |
| 3 | Chatter | A2.1 |
| 4 | Storyteller | A2.2 |
| 5 | Debater | B1.1 |
| 6 | Anchor | B1.2 |
| 7 | Headliner | B2.1 |
| 8 | Adda Legend | B2.2+ |

### 2.3 Moving between levels
- Every item is tagged with a level from 1 to 8. A round draws items at the student's skill level, with about 20% at one level below (for confidence) and about 10% at one level above (for stretch).
- **Up:** at least 80% correct over the last 20 items at the current level, spread across at least 2 different days. When a student goes up, Yapper celebrates and names the skill: "Listening is now Level 4: Storyteller!"
- **Down:** never shown. If accuracy drops below 50% over 20 items, the game quietly serves more items from one level below until accuracy recovers. The displayed level never drops.
- The server stores the levels and recomputes them on each round save (see §8). Students can't edit levels from the page.

---

## 3. First visit: "Find your Adda level"

- Required. Until it's done, English Adda shows only a quiet start screen, the same pattern as Drive School Day 0.
- Takes about 5 minutes. It is **never called a test**. Yapper: *"Quick warm-up so I can pick the right games for you. No marks, no pressure."*

| Part | What happens | Measures | Items | Time |
|---|---|---|---|---|
| 1. Real or Fake | Swipe 30 words: real words from frequency bands 1k–8k, plus about 10 made-up words | Vocabulary size. Score = hits minus false alarms, a standard yes/no vocabulary test. | 30 | 1.5 min |
| 2. Fill the gaps | One short passage with missing word endings (C-test). A second passage is picked one band harder or easier based on the first. | Grammar and reading | 2 × 10 gaps | 1.5 min |
| 3. Catch It | Hear and type 4 sentences that get longer and faster | Listening | 4 | 1.5 min |
| 4. Quick story | One micro-story at the level suggested by parts 1–2, then 2 questions | Reading | 2 | 1 min |

Writing has no part in the check. It starts at the average of grammar and reading, minus 1 (minimum 1), and moves up through play.

**Result screen:**
- "You're **Level 3: Chatter**"
- 5 skill bars
- "Your strongest: **Reading**. We'll train **Listening** most."
- Button: **Start today's Adda**

**Week 8 re-check:** repeated quietly inside a Boss Round (§6), using equivalent but different items, to measure growth for the admin.

Saved to `english_students.check` and `levels`.

---

## 4. Today's Adda (the daily circuit)

### 4.1 Shape
The circuit is fixed for the day, so home and the player agree. It is seeded by student and date:

1. **Word Groups**, the shared daily puzzle (about 2 min). It is always first.
2. **5 sets** picked by the recommender (§4.2), about 2–2.5 min each.
3. **Word Vault**, only if words are due (about 1 min).

That is about 15 minutes. A ring fills with **active** seconds only: the tab must be visible and the student must have interacted in the last 30 s, the same rule as Brain Gym's timer.

### 4.2 Recommender
- **Weights:** the 1–2 weakest skills by level take 60% of the 5 sets. The rest take 40%. Ties are broken by the skill trained least in the last 3 days.
- **Variety:** no game twice in a row, and at least 4 different games in the 5 sets.
- **Swap:** once a day, a student can replace one set ("Not feeling it? Swap").
- **Unlocks by level:**
  - Vanish needs reading level 3 or higher.
  - Fix My Email write mode needs writing level 5 or higher.
  - Below those levels the games still appear, in their easier modes.

### 4.3 After 15 minutes
- Goal modal: trophy, "Today's Adda done ✓", streak +1.
- Then the **11-star rating**, once a day, before leaving. Reuse the Brain Gym and Drive School component and store it as `kind = 'rate'` in `english_events`.
- **Bonus sets** keep coming from the same recommender until 25 minutes.

### 4.4 At 25 minutes
- The round in progress finishes normally. Then a closed screen: *"Adda's closed for today. Great work! Come back tomorrow. Your Word Vault is still open."*
- The server rejects points for fresh rounds once that day's active time is over 25 min plus a 2-minute grace.
- **DEMO accounts:** no daily limit, all games unlocked, and they can jump to any game or level from the console (`Adda.open(game, level)`), like `Drive.open`.

### 4.5 Streak
- A goal day is a day with 15 or more active minutes in English Adda (its own timer, not Brain Gym's).
- Each student gets **1 automatic freeze per 7 days**. A missed day uses the freeze and keeps the streak.
- Shown only to the student, on the home screen.

---

## 5. The v1 games

All games share one player shell (§7.2). Every game has:
- an **intro line** from Yapper (recorded once)
- a **level knob table**
- **instant feedback with a hint first**: the first miss gives a hint, and the second shows the answer and a "why"

Rounds are about 2–2.5 minutes.

### 5.1 Word Groups (daily puzzle) · `voc`
- **Play:** 16 word tiles. Find 4 hidden groups of 4. Groups can be synonyms, collocations ("___ a decision"), tech words, Indian English vs global English, and so on.
- **Mistakes:** you get 4 mistakes. Using all 4 doesn't end the game: after the 4th, the groups reveal one at a time with explanations.
- **Same for everyone:** all DEMO students get the same puzzle on the same day (later, the whole batch).
- **Level knob:** 3 difficulty tiers. The student's vocabulary level picks the tier, so there are three daily puzzles: easy, medium and hard.
- **Share:** a copyable emoji result grid, no spoilers ("English Adda #12 🟩🟨🟦🟪").
- **Content rule:** each word fits **exactly one** group. Check this with a script plus the reviewer agent.
- **Placement link:** synonyms and words in context (AMCAT).

### 5.2 Real or Fake · `voc`
- **Play:** a word appears. Swipe right if it's real, left if it's fake. 5 s per word, 20 words.
- **Fake words** look like English but aren't ("brendle", "obsurate"). A script checks that each has zero frequency in a large word-frequency list.
- **After the round:** real words the student missed are offered for the Word Vault, each with a one-line meaning.
- **Level knob:** the frequency band of the real words (L1: top 1k … L8: 8k–12k), and how believable the fake words are.
- **Placement link:** vocabulary recognition (Duolingo English Test, AMCAT).

### 5.3 Catch It · `lis`
- **Play:** hear a sentence and type it. There is 1 free replay, then a second replay costs a few bonus points. 6 sentences per round.
- **Scoring** (word-level alignment):
  - case and punctuation are ignored
  - contractions are accepted both ways ("don't" = "do not")
  - numbers can be digits or words
  - a 1-letter slip gets half credit and a "check spelling" hint
  - missed words are highlighted in the answer
- **Level knob:**

  | Level | Sentence length | Speed | Background |
  |---|---|---|---|
  | L1 | 4–6 words | 0.85× | – |
  | L4 | 8–12 words | 1.0× | – |
  | L7–8 | 14–20 words | 1.1× | Light canteen or hostel noise |

  Each sentence is recorded once, at the speed for its level.
- **Placement link:** Versant repeats, dictation (Versant Writing), SVAR listening.

### 5.4 Story Rewind · `lis` → `wri`
- **Play:** a 30–50 s audio story or dialogue (hostel, cricket, ISRO, a train delay). It plays once, with one replay allowed. Then:
  - **L1–4:** 3 multiple-choice questions (main idea, a detail, an inference).
  - **L5–8:** write a 2–3 line retelling. The AI judge checks key-point coverage. If the AI fails, keyword matching on the key points takes over.
- Dialogues use af_heart plus the second voice.
- **Placement link:** Versant story retelling, listening comprehension.

### 5.5 Jumble · `gra`
- **Play:** drag word chunks into order to build a sentence. 8 sentences, with a combo meter for speed.
- **Distractors:** at higher levels, one extra wrong chunk is mixed in (for example "since" vs "for" in "for two years").
- **Accepted orders:** every sentence has an allowlist of correct orders (for example adverb positions). A script checks that no other order is correct.
- **Level knob:** number of chunks (L1: 4 → L8: 9), and whether there is a distractor (L4 and up).
- **Placement link:** Versant sentence builds, the Accenture jumbled-sentence task.

### 5.6 Spot & Fix · `gra`
- **Play:** a sentence appears. Tap the wrong part, or tap "No error". Then choose the fix from 3 options. 8 sentences.
- **Error patterns:** about 30% of sentences are correct, so students learn not to "over-fix". The Research doc §6 rules apply:
  - **Accept-tier Indianisms are never errors.**
  - **Formal-only items** appear only in "email or interview" context sentences.
- **Level knob:** error type (L1: verb forms and plurals → L8: subtle agreement and redundancy), and how many sentences have no error.
- **Placement link:** AMCAT error spotting and sentence improvement, TCS sentence completion.

### 5.7 Reel Reader · `rea` + `voc`
- **Play:** swipe through 4–6 short vertical "reel cards" that tell one micro-story (60–150 words in total at L1, up to 400 at L8). Topics come from the Research doc §8.2.
  - **Tap any word** to see a one-line meaning and save it to the Word Vault.
  - At the end, 2 quick questions.
- **Level control:** at least 95% of the passage's words must be at or below the student's level band, and the rest are glossed. A script checks word coverage and Flesch score.
- **Placement link:** AMCAT reading comprehension.

### 5.8 Vanish · `rea` → `wri` (opens at reading level 3)
- **Play:** read a short passage (40–120 words) for 20–40 s. It vanishes. Then:
  - **L3–4:** put 4 key-point cards in the right order, then pick the true statement.
  - **L5–8:** write the main idea in 2–3 lines.
- **Write mode:** the AI judge checks key-point coverage. Errors are flagged only by quoting an exact span of what the student wrote, at most 2. The student can revise once, and the score rises.
- **Placement link:** Versant passage reconstruction, TCS passage recall.

### 5.9 Fix My Email · `wri`
- **Play:** a short email or message to a HOD, warden, recruiter or customer care. Typical problems are "do the needful", "revert back", missing subject, rude tone, a missing request.
  - **L1–4:** tap the problems, then pick better lines.
  - **L5–8:** get a situation and write the email (40–90 words). The AI judge checks: subject line, greeting, clear request, polite tone, closing. It flags at most 2 issues, each quoting an exact span. Then one revise round.
- **Level knob:** the number and subtlety of problems; write mode at L5 and up.
- **Placement link:** Versant email writing, TCS email.

### 5.10 Word Vault · `voc` (always open)
- Words saved from Reel Reader, Real or Fake, Word Groups and Catch It.
- **Leitner spacing:** 5 boxes, reviewed after 1, 3, 7, 14 and 30 days.
- **Review formats** (rotated):
  - Meaning → pick the word
  - Word → pick the meaning
  - Fill the gap in a new sentence
- Not counted toward the 25-minute limit. It does count toward the 15-minute goal.
- About 1 point per correct review. Profile shows "Words mastered" (box 5).

### 5.11 Boss Round · all skills (every 14 days)
- A mixed 6-minute round: 2 items each of Real or Fake, Jumble, Spot & Fix, Catch It, a micro-story question, and one Fix-the-email choice.
- It feels like a "boss fight", with Yapper's dramatic intro.
- It updates the student's private **Practice Meter** (0–100), with a sparkline over time.
- **Never** call it a test. **Never** claim it predicts a real company test. Label: "Practice meter: how ready your English is for placement-style tasks."
- The Day-56 Boss Round includes the quiet re-check items (§3).

**Phase 2 (after the v1 pilot):**
- Hot & Cold (semantic word guessing)
- Tone Switch (WhatsApp ↔ formal)
- Fact or Forward? (critical reading)
- GD Corner (argument writing)

---

## 6. Points, leaderboard, profile

### 6.1 Adda points
These reward effort. Difficulty is adaptive, so accuracy at your own level is fair.

| Action | Points |
|---|---|
| Round completed | 10 |
| Accuracy bonus | Up to +10 (scaled from the round's accuracy) |
| Word Groups solved | +5, or +10 if solved with no mistakes |
| Word Vault correct review | 1 each, max 20 per day |
| Daily goal reached | +25 |
| Boss Round completed | +30 |

Limits:
- The server caps points per round at 25.
- Rounds after the 25-minute limit give 0 points (DEMO accounts are exempt).

### 6.2 Leaderboard
- A new **"English Adda" tab** on the Leaderboard screen, next to Brain Gym and Drive School.
- Ranks by batch on points this week and all time.
- Shows only name and points. **No levels.**

### 6.3 Profile
New **English** tab in My Profiles. All of it is private to the student.
- 5 skill bars with levels and names
- Practice Meter sparkline
- Words mastered / words in vault
- Goal days and streak
- Rounds per game

---

## 7. Screens

### 7.1 Navigation
- New sidebar tab **English Adda**, using the empty "English" slot.
- Shown only if the student's batch is in `ENGLISH_BATCHES` (server env var, default `DEMO`). Hidden otherwise, so there's no "coming soon" teaser before launch.
- The `#english` hash route opens it, the same pattern as `#drive`.

### 7.2 Screens

**1. Start (before the level check)**
- Yapper (first meeting, like Turbo's "Meet Turbo"): "Hey, I'm Yapper! Yes, I talk a lot. This is English Adda: 15 minutes a day of word games, stories and quick challenges. First, a quick warm-up so I can pick your games."
- Button: **Let's go**

**2. Level check:** 4 parts with a progress bar, then the result screen (§3).

**3. Home**
- The **Today ring** (minutes / 15), streak chip and points chip
- Hero button: **Start today's Adda**, or **Continue** with the next set's name
- The list of today's sets, ticked when done, with a Swap link
- A Word Groups card with the puzzle number
- A Word Vault card with "N words due"
- A Boss Round card when one is due
- "Your skills": 5 small private bars
- A help card with the rules from §1.1

**4. Game player** (one shell for all games)
- **Top:** close, progress bar, timer ring, mute, points
- **Centre:** the game card
- **Bottom:** one main button
- **Yapper** sits bottom-left with a bubble for the intro, hints and the "why". Lines with a recorded clip are spoken; the rest are typed silently.

**5. Round result**
- Accuracy, points, words added to the vault, and a level-up banner when one happens
- Buttons: **Next set** (in the circuit) and **Play again** (bonus or replay)

**6. Goal done:** modal, then the 11-star rating.

**7. Closed for today:** shows the Word Vault button.

**8. Profile English tab, and the leaderboard tab** (§6).

**Look:** reuse Game Corner tokens. Give English Adda its own accent colour (suggest warm "chai" amber `#E8A33D`) so it reads as a different place from Brain Gym and Drive School. Each game gets an emoji or icon, in the same style as the Brain Gym game cards.

### 7.3 Audio
- Every listening clip, game intro and fixed Yapper line is pre-recorded.
- New script **`scripts/english-voice.py`**, a sibling of `turbo-voice.py`, with the same approach:
  - hashed file names and `manifest.json`
  - records only new or changed lines and deletes unused clips
  - a `voice` field per line (`af_heart` default, `am_michael` for the dialogue second speaker)
  - a per-line `speed` field
- Output goes to `public/assets/english/voice/`, kept separate from Drive's clips.
- The noise bed for L7–8 Catch It is a free ambience track, mixed in the browser with the Web Audio API at low volume, so no extra clips are needed.
- Size budget: about 20 KB per short sentence clip and about 300 KB per story. Load the clips for each round ahead of time, and fetch them lazily per round.

---

## 8. Server and data

### 8.1 Tables (`scripts/db-setup.mjs`, all prefixed `english_`)
```sql
english_students (
  student_id  int PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  started_on  date NOT NULL,
  points      int NOT NULL DEFAULT 0,
  levels      jsonb NOT NULL DEFAULT '{}',   -- {voc:3, gra:2, lis:2, rea:3, wri:2}
  check       jsonb,                         -- level-check raw scores + result
  checked_at  timestamptz,
  meter       jsonb NOT NULL DEFAULT '[]',   -- Boss Round practice-meter history
  memo        jsonb NOT NULL DEFAULT '{}',   -- swap used today, freeze dates, etc.
  updated_at  timestamptz NOT NULL DEFAULT now()
)
english_daily (                              -- powers ring, streak, 25-min close
  student_id  int REFERENCES students(id) ON DELETE CASCADE,
  day         date NOT NULL,                 -- India calendar day
  active      int NOT NULL DEFAULT 0,        -- active seconds
  fresh_rounds int NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, day)
)
english_rounds (
  id bigserial PRIMARY KEY, client_id text UNIQUE NOT NULL,
  student_id int REFERENCES students(id) ON DELETE CASCADE,
  game text NOT NULL, level smallint NOT NULL,
  items smallint, correct smallint, points int, secs int,
  ist_date date NOT NULL, played_at timestamptz NOT NULL, meta jsonb
)
english_answers (                            -- per item: finds bad or ambiguous content
  id bigserial PRIMARY KEY, round_client_id text NOT NULL,
  student_id int, game text, item_id text, ok boolean, tries smallint,
  answer text, ms int, at timestamptz
)
english_vault (
  student_id int REFERENCES students(id) ON DELETE CASCADE,
  word text NOT NULL, box smallint NOT NULL DEFAULT 1, due date NOT NULL,
  source text, added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, word)
)
english_events (                             -- rate, swap, boss, levelup
  id bigserial PRIMARY KEY, client_id text UNIQUE NOT NULL,
  student_id int, kind text NOT NULL, data jsonb, at timestamptz NOT NULL
)
```
Indexes go on `(student_id, ist_date)`, `(game, item_id)` and `(kind, at)`.

### 8.2 `api/english.js` (POST, same style as `api/drive.js`)

| Action | Does |
|---|---|
| `state` | Returns levels, today's active secs, streak, points, the day's circuit (computed on the server from the seed), vault due count, Boss due, and `open` (whether the batch is allowed) |
| `check` | Saves the level-check answers. The server scores them, sets levels, and accepts this once only (DEMO accounts can redo it) |
| `tick` | Adds active seconds (batched every 30 s, capped to real time passed) |
| `round` | Saves a round and its per-item answers. The server re-scores objective items from the content IDs it knows, caps points, enforces the 25-min close, updates skill levels, and returns a level-up if one happened |
| `vault` | `get` due words, `add` words, `review` results |
| `boss` | Saves a Boss Round and updates the meter |
| `rate` | 11-star rating, once a day |
| `profile` | Data for the profile tab |

**Gate:** every action checks `ENGLISH_BATCHES` (default `DEMO`) and returns 403 for other batches. DEMO accounts skip the daily close, the order of games and level gates.

**Server knows the answers:** the objective answer keys live in `api/_lib/english-keys.js`, generated from the content files, so a student can't send a fake "correct" result. The content files sent to the browser keep the answers too (that's needed for instant feedback), but the server re-checks before awarding points or levels.

### 8.3 AI judge (writing modes only)
- New tasks in `api/_lib/judge-core.js` and `prompts.js`: `adda_retell` (Story Rewind), `adda_vanish`, `adda_email`.
- **Payload:** `{ level, keypoints[], studentText }`. `validatePayload` caps the text at 600 characters. The student's text goes only inside `<student>` tags.
- **Output:**
  ```
  { covered: [keypoint indexes], score: 0-3,
    issues: [{ quote, fix, type: "grammar|tone|clarity|missing", tier: "correct|formal" }] (max 2),
    praise: "short line" }
  ```
- **`validateResult` checks:**
  - every `quote` is an exact substring of `studentText` (otherwise that issue is dropped)
  - `covered` indexes are in range
  - at most 2 issues
  - no rewritten full answer
- **The prompt contains:**
  - the Indian English policy (accept / formal-only / correct)
  - "British and Indian spellings are correct"
  - "Indian names and places are correct"
  - "never rewrite the whole text"
- `temperature: 0`.
- **Fallback when the AI fails:** keyword or synonym matching on the key points gives the coverage, no grammar issues are shown, and the game continues as normal.
- **Gold set:** add about 60 English cases to `scripts/gold.mjs`:
  - good answers
  - answers missing key points
  - answers with real errors
  - **traps**: correct Indian English, British spellings, Indian names
  - injection attempts

  Run `npm run test:judge` and keep the cheapest model that passes the CLAUDE.md bar.

### 8.4 Admin
New **English Adda** tab in `admin.html`, loaded from `/api/admin?view=english`. It includes batch DEMO while in pilot (the other tabs leave DEMO out).

**Overview**
- Students started
- Level check done
- Median active minutes per day
- % of days reaching 15 min
- Return rate on day 2 and day 7

**Skills**
- Starting level distribution per skill
- Level moves over time
- Practice Meter medians

**Games**
- Rounds, median accuracy, median seconds, drop-offs

**Content quality** (the most important view while content is new)
- Items with accuracy under 25% or over 98%
- Items where one wrong option is chosen more than the right one. Likely bad keys or a second correct answer.

**Student voice**
- Ratings and their text

**CSVs**
- english_students, english_rounds, english_answers, english_ratings

---

## 9. Content plan

### 9.1 Files
These live in `public/content/english/`, one per game. Each file is a data file with a header comment `FOR TEAM REVIEW` plus the review date.

| File | Item shape |
|---|---|
| `groups.js` | `{ id, n, tier, groups:[{ name, words[4], why }] }` |
| `realfake.js` | word bank `{ w, band, real, meaning? }` (generator builds rounds) |
| `catch.js` | `{ id, lv, text, alt:[accepted variants], clip }` |
| `rewind.js` | `{ id, lv, theme, lines:[{ v:'heart'|'michael', t }], mcq:[...], keypoints:[...] }` |
| `jumble.js` | `{ id, lv, chunks[], orders:[[...]], distractor? }` |
| `spotfix.js` | `{ id, lv, s, errSpan|null, fixes[3], ans, why, ctx:'chat'|'formal' }` |
| `reels.js` | `{ id, lv, theme, cards[], gloss:{word:meaning}, q:[2 mcq] }` |
| `vanish.js` | `{ id, lv, text, keypoints[], order[4], truths[] }` |
| `email.js` | `{ id, lv, mode:'fix'|'write', situation, email?, problems:[{span, why, better}], keypoints[] }` |
| `check.js` | the level-check items (kept apart from the daily pools) |
| `boss.js` | Boss Round sets, equivalent forms A/B/C… |

### 9.2 Volumes

**Pilot (DEMO test):** about 10 days of content, so you can play it properly.

**Launch to all:** 30 days without repeats, for a typical student playing about 8 sets a day (5 circuit sets plus about 3 bonus sets).

| Game | Pilot | Launch (30 days) | How |
|---|---|---|---|
| Word Groups | 10 days × 3 tiers = 30 puzzles | 90 | Hand-written |
| Real or Fake | 1,500 real + 400 fake words | 3,000 + 800 | NGSL and frequency bands, plus a fake-word generator |
| Catch It | 300 sentences (about 40 per level) | 1,200 | Written in bulk |
| Story Rewind | 30 stories | 100 | Written |
| Jumble | 300 sentences | 1,200 | Built from a shared sentence bank with Catch It and Spot & Fix |
| Spot & Fix | 300 | 1,200 | Error-pattern templates from Research §6 × themes |
| Reel Reader | 30 stories | 100 | Written |
| Vanish | 30 passages | 100 | Written |
| Fix My Email | 30 | 100 | Written |
| Level check | 1 full set | 2 sets (A/B, for the re-check) | Written |
| Boss Round | 2 sets | 4 sets | Built from held-back items |

- **Unseen items first:** the picker serves unseen items first and only repeats an item once the student has seen all items at their level, like Brain Gym's no-repeat picker.
- **Audio:** about 300 Catch It clips + 30 stories + intros. About 10 MB for the pilot and about 40 MB at launch.

### 9.3 Content rules (checklist)
- Indian context, Gen Z themes (Research §8.2), all regions represented (names, food, festivals across North, South, East and West), and genders balanced.
- No caste, religion or politics as a joke or a debate topic. No brands in a bad light. No real living private persons.
- Tech content uses Sem 1 topics only.
- Instructions use plain, simple English.
- Objective items have exactly one correct answer.
- Follow the Indian English policy (Research §6).

### 9.4 Review pipeline (for every content batch)

**1. Write.** Claude writes the content batch.

**2. Automatic checks:** `node scripts/english-check.mjs`. It checks:
- schema and required fields
- unique IDs
- level tags present
- Jumble: no order outside the allowlist forms a grammatical sentence (a small grammar plus hand-written allowlist; anything suspicious goes to the reviewer)
- fake words: zero frequency in the word-frequency list
- Reel and Vanish: at least 95% of words at the level band, and the Flesch score fits the level
- Spot & Fix: `errSpan` is inside the sentence, and `ans` is one of the fixes
- duplicates and near-duplicates
- banned-words list
- length limits

**3. Third-person review.** A separate reviewer agent gets only the batch plus the checklist below, not the writer's notes. For each item it answers:
- Is exactly one answer correct? Could any wrong option also be defended?
- Is the answer key right?
- Is the level tag right (too hard or too easy)?
- Does it follow the Indian English policy? Is an accepted Indianism marked as an error?
- Is the English natural, with no typos, in the copy shown to students?
- Is it Indian context, fair and inclusive, with nothing offensive?
- For Word Groups: does any word fit two groups?
- For dialogues and stories: are the questions answerable from the audio alone?

It returns a list: `id → OK | FIX (reason, suggested change) | DROP`.

**4. Fix and re-check.** Claude fixes the flagged items. The reviewer re-checks only those. Repeat until the batch is clean.

**5. Record audio:** `python scripts/english-voice.py`. A listening spot-check (sample about 10% of clips) catches mispronounced names. Fix the spelling given to the voice in the speak map.

**6. After the pilot:** the admin **Content quality** view flags items that real students found confusing. Fix or drop them, and log any judge mistakes in `gold.mjs` first (CLAUDE.md rule).

---

## 10. Build order

Each step ends with automatic checks, a reviewer pass on its content, a browser test on DEMO, and a commit.

| Step | What | Done when |
|---|---|---|
| 1 | **Shell:** sidebar tab (DEMO gate), DB tables, `api/english.js` (`state`, `tick`), home with ring, streak, points, and the closed screen; 2D and 3D | DEMO can open English Adda and the ring fills; other batches don't see it |
| 2 | **Level check + levels + recommender:** `check.js`, the scoring, the result screen, the daily circuit, Swap | A new DEMO account goes through the check and gets a sensible circuit |
| 3 | **Objective games:** Real or Fake, Jumble, Spot & Fix, Word Groups, Word Vault, plus `english-check.mjs` and the server re-scoring | All 5 playable with pilot content; points and levels move |
| 4 | **Listening:** `english-voice.py`, Catch It, Story Rewind (multiple-choice mode) | Clips play on a low-end Android phone and on desktop |
| 5 | **Reading and writing:** Reel Reader, Vanish, Fix My Email, Story Rewind write mode, AI judge tasks, gold set | `test:judge` passes; the fallback works when the AI is switched off |
| 6 | **Wrap:** Boss Round and Practice Meter, profile tab, leaderboard tab, 11-star rating, admin tab and CSVs | You can play a full 15-minute day and see it in admin |
| 7 | **Pilot:** you test on DEMO, we fix things, then go-live checklist: content scaled to 30 days, live DB migration (needs your OK), `ENGLISH_BATCHES=all` | Your go |

Update `CLAUDE.md` with an "English Adda" section, like the one for Drive School, at step 1.

---

## 11. Risks to watch in the pilot

| Watch | Signal in admin | Response |
|---|---|---|
| Too hard for weak students | Level 1–2 accuracy under 60%, drop-offs mid-round | Easier L1 items, more pictures, slower audio |
| Too easy for strong students | L7–8 accuracy over 95% | Add harder L8 items and Phase 2 games sooner |
| Bad items | Content quality flags | Fix or drop; re-review |
| Judge false alarms | Students rate writing feedback low | Add to the gold set, adjust the prompt |
| 15 min feels long | Median active time under 10 min | More game variety, shorter rounds, more Boss or Puzzle moments |
| Audio issues on phones | "Something's off" reports from Catch It | Smaller clips, a preload fallback, a "type what you heard" retry |
