# English Adda — Research Doc

*Working name. A new section in Game Corner, next to Brain Gym and Drive School.*
*Research done 2026-11-09. Use this doc as the reference when designing and building English Adda.*

---

## 0. Decisions so far (from the product owner)

| Topic | Decision |
|---|---|
| Name | **English Adda** ("adda" = a hangout spot; casual, low pressure) |
| Shape | **Hybrid**: a short daily game circuit (like Brain Gym) plus a light level path |
| Speaking | **Not in v1.** Build reading, writing and listening first. Speaking research is kept in §9 for later. |
| Goal | **Placement prep underneath, fun on the surface.** Every game should quietly train a skill that campus English tests check, but it must never *feel* like test prep. Combine "placements + confidence" with "general fluency". |
| Points | **Separate** from Brain Gym points (like Drive points). |
| Language hints | **English only.** No Hindi, Telugu or Tamil hints. Weak learners get help through easier levels, pictures, slower audio and retries instead. |
| Audio | **No budget.** All listening audio uses Kokoro **af_heart** (Turbo's voice), pre-recorded offline. No paid Indian-accent voices. |
| Level check | **Required on the first visit** (like Drive School Day 0). Its result picks each student's starting level and which games to recommend. |
| Daily time | **Goal: 15 minutes a day**, with a **daily limit** on fresh content. |
| Content review | **Claude writes content in bulk, then a separate reviewer pass checks it as a third person** (no human team review). |

---

## 1. Summary

1. **Who we serve.** About 15k first-year B.Tech students aged 17–20. Their English ranges from barely reading a sentence (ASER 2023: about 43% of rural 14–18-year-olds can't read a simple English sentence) to near-fluent. **Listening is India's weakest measured skill** (EF EPI 2025: listening 457 vs reading 494, writing 504). Hyderabad and Chennai students were flagged as needing the most help (Aspiring Minds), which matters because many of our students are from Telangana, AP and Tamil Nadu.
2. **What placements actually test.** Versant, AMCAT SVAR/English, the Accenture Communication Assessment, TCS NQT Verbal and Wipro NLTH all reuse the same small set of task types: read aloud, repeat what you hear, rebuild a jumbled sentence, retell a story, speak freely, spot errors, complete sentences, dictation or passage recall, and write a short formal email. **Every one of these maps to a game mechanic.** Without speaking, we still cover jumbles, dictation, recall, error-spotting, sentence completion, email writing and written retelling.
3. **What the research says works.** Spaced, low-stakes retrieval is the core engine. Gamification gives small-to-moderate gains (g ≈ 0.5), and *which* game elements you use matters: levels, progress, a light story and team goals help, while public individual leaderboards and badge overload can hurt. Reading works best at 95–98% known words. Feedback should focus on 1–2 errors and then ask the student to revise. Aim for being understood, not for a native accent.
4. **The gap in the market.** Nobody turns placement-test tasks into daily *games*. Prep sites are dry mock tests. Apps teach generic conversation, put features behind paywalls, and rank students against strangers. We have three things they don't: free access, a campus social layer (college or section leagues, one shared daily puzzle), and content built for engineering students.
5. **Psychology is the design constraint.** In India, English works as a class marker. Vernacular-medium students fear being judged, and anxiety correlates −0.36 with achievement. So: keep levels private, compare each student only with their own past self, and allow public competition only on effort or totals, never on ability.
6. **Tech for v1 is cheap and fits our stack.** Pre-recorded TTS clips for listening (Kokoro, which we already use, plus optional Indian-accent voices as a one-time cost). Writing is checked by the existing `api/judge.js` pattern with an English gold set. Feedback must quote an exact span of the student's text, so the judge can't invent errors.

---

## 2. Who the learners are

### 2.1 Proficiency data (treat as indicative; most sources are vendors)
- **Aspiring Minds National Spoken English study (2015, about 30k engineers)**
  - 2.9% fluent; 6.8% could respond spontaneously.
  - 51% were "not employable" on spoken English alone.
  - Pronunciation and fluency were the main barriers.
  - Hyderabad and Chennai needed the most improvement.
  - The drop in level is steeper from tier 2 to tier 3 colleges than from tier 1 to tier 2.
- **EF EPI 2025:** India scored 484 (#74, "low" band). Reading 494, **listening 457**, writing 504, speaking 500. EF's sample is self-selected online test-takers.
- **ASER 2023 Beyond Basics:** 57.3% of rural 14–18-year-olds can read English sentences, and 73.5% of those can explain the meaning. Many of our tier-3 students were in that group 1–3 years ago.
- **Recruiters (Wisdomjobs, 850 recruiters):** about 70% say freshers' communication is below par. Satisfaction is 55% in metros vs 28% outside them.
- **NEP 2020 and AICTE:** B.Tech is now allowed in 11+ regional languages, and AICTE requires a compulsory English course for those students. More students will arrive with less English-medium schooling, while hiring stays in English.

**Implication:** the spread of levels is extreme. We need a short placement check, fine levels at the bottom of the scale, and real weight on **listening**.

### 2.2 Psychology
- English is read as a sign of intelligence and class (the English–vernacular divide; films like *Hindi Medium*). Vernacular-medium and first-generation students report feeling "unwanted and unsuitable" on campus.
- Tamil-medium engineering students report low confidence and hesitant speech. Female students from regional-medium, rural or semi-urban backgrounds report more anxiety.
- Vernacular-medium students also hesitate to *write* emails, letters and reports (writing anxiety, not just speaking).
- Small studies find private AI or app practice lowers fear of judgment. This is promising but not proven.

**Implication:**
- Keep it private by default.
- Make mistakes cheap: no hearts, no lives, unlimited retries.
- Comparison is "you vs last week's you".
- Allow mother-tongue hints for weak learners (open question, §11).

### 2.3 Gen Z media habits
- 89% of Gen Z use Reels daily. They prefer short videos (under 2 minutes) and regional-language content. Hinglish use is growing, and Tanglish and Tenglish are common.
- Favourite topics: comedy, cricket, films/OTT (Tollywood, Kollywood, Bollywood), BGMI and Free Fire, memes, Shark Tank India, UPI, hostel life.
- Phones: mostly mid-range Android on 4G/5G. Data volume is not the main limit, but hostel network speed varies.

**Implication:**
- Rounds of 30–120 seconds.
- Swipeable, reel-like screens for reading.
- Hooks built from memes, cricket and films.
- Small, cacheable audio clips.

### 2.4 First-year English syllabus (AICTE model curriculum HSMC101)
1. **Vocabulary:** roots, prefixes and suffixes, synonyms and antonyms, abbreviations.
2. **Basic writing:** sentence structure, punctuation, paragraphs.
3. **Common errors:** agreement, articles, prepositions, redundancy, clichés.
4. **Writing styles:** describing, defining, classifying.
5. **Comprehension, précis, essay.**
6. **Language lab:** listening, pronunciation and stress, interviews, presentations.

University labs (JNTU-affiliated and others) add JAM, role play and group discussion.

**Implication:** English Adda can be mapped to college credits later, which helps adoption by colleges.

---

## 3. What placement tests measure (the hidden target)

| Test | Format | Skills scored |
|---|---|---|
| **Versant English** (Pearson) | About 17 min, 6 parts: read aloud, repeats, short answers, sentence builds, story retelling, open questions | Sentence mastery, vocabulary, fluency, pronunciation |
| **Versant Writing** | Typing, sentence completion, dictation, passage reconstruction, email | Grammar, vocabulary, tone, organisation, reading |
| **AMCAT SVAR** (SHL) | 16–20 min: read aloud, listen and repeat, listening comprehension, grammar, error spotting, free speech | Pronunciation, fluency, listening |
| **AMCAT English** | Multiple choice: synonyms and antonyms, words in context, error spotting, sentence improvement, reading comprehension | Written English |
| **Accenture Communication Assessment** | Versant-like, AI-graded | Same as Versant, plus listening |
| **TCS NQT Verbal** | Sentence completion, passage recall, email (whether email is still included is disputed) | Grammar, recall, formal writing |
| **Wipro NLTH** | 22 English questions (MCQ) | Written English |

No company publishes its cut-off scores.

### How placement task types map to English Adda (v1, no speaking)

| Placement task | v1 mechanic | Skill |
|---|---|---|
| Repeats / listen and repeat | **Hear it, type it** (dictation) | Listening decoding, spelling |
| Sentence builds | **Jumble** (rebuild a sentence from chunks, timed) | Grammar |
| Story retelling | **Listen, then retell in 2–3 written lines** | Listening, then writing |
| Passage reconstruction / passage recall | **Read it, it vanishes, rebuild it** | Reading memory, writing |
| Sentence completion | **Fill the gap** (C-test style, missing letters or words) | Grammar, vocabulary |
| Error spotting / sentence improvement | **Spot and fix** | Grammar |
| Email writing | **Fix-the-email, then write-the-email** | Formal register |
| Synonyms / words in context | **Word games** (grouping, real-or-fake, hot-and-cold) | Vocabulary |
| Reading comprehension | **Micro-stories** with 2 quick questions | Reading |
| Read aloud, short answers, open questions | *Later (speaking phase)* | Speaking |

"Fun on top, prep underneath": the student plays "Jumble", and their progress quietly tracks the Versant "sentence builds" skill. An occasional **Boss Round** (a mini mock test) can show "Your placement-readiness meter", without ever calling it a test.

---

## 4. Evidence-based principles (academic literature)

Effect sizes are from meta-analyses unless stated otherwise. "Secondary" means taken from a summary, not the original paper.

1. **Spaced, low-stakes retrieval is the core engine.**
   - Kim & Webb 2022 (*Language Learning*, 48 experiments): medium-to-large effect, and longer gaps are better for long-term retention.
   - Adesope et al. 2017: practice tests beat re-studying.
   - Duolingo's half-life regression (Settles & Meeder 2016) shows spacing scales in a real product.
   - → Words and sentence patterns a student meets come back on a spaced schedule. Recall and produce, don't just recognise.
2. **Gamification gives small-to-moderate gains, and which elements you use matters.**
   - Sailer & Homner 2020: g = 0.49 for learning, which held up in rigorous studies; motivation (0.36) and behaviour (0.25) were less stable.
   - Narrative and social interaction were moderators of the behaviour effect.
   - English-specific: Lee & Baek 2023, g = 0.52 (small sample).
   - In a programming-learning meta-analysis, levels drove most of the gain; badges, points and leaderboards did not (secondary).
3. **Public individual leaderboards and reward overload can backfire.**
   - Hanus & Fox 2015: badges, a leaderboard and coins led to *lower* motivation and lower exam scores.
   - Almeida et al. 2023: badges and leaderboards were the elements most often linked to negative effects.
   - Teimouri et al. 2019: anxiety correlates r = −0.36 with achievement.
4. **Reading at 95–98% known words, with student choice.**
   - Laufer & Ravenhorst-Kalovski 2010 set these coverage thresholds. Schmitt et al. argue comprehension improves gradually rather than at a cliff.
   - Extensive reading: d ≈ 0.5, larger for adults, EFL learners and web-based reading (Jeon & Day 2016).
5. **Teach vocabulary by frequency.** NGSL (about 2,800 words, about 90% of general text) comes first. After that, academic and engineering words.
6. **Train listening bottom-up for weak learners.**
   - L2 listeners decode only about 60% of words, against about 95% for native listeners (Field).
   - Dictation and gap transcription help (small studies).
   - MALL for listening: g = 0.79 (Li 2023).
7. **Corrective feedback: focused, then revise.**
   - Kang & Han 2015: a small-to-moderate positive effect on accuracy.
   - Feedback works when it is selective and clear (Ferris).
   - Prompts that ask learners to self-correct beat simply giving the correct form (Lyster & Saito 2010).
   - Automated writing evaluation: g = 0.59.
8. **AI feedback helps, but over-corrects and creates over-reliance.**
   - It over-corrects advanced writers and sometimes invents errors (Zeng et al. 2024).
   - A study of 180 Indian ESL undergraduates found ChatGPT was "a replacement rather than support".
   - → Students must act on feedback themselves (revise or choose). AI never rewrites their text for them.
9. **Aim for being understood, not a native accent** (Munro & Derwing 1995; Jenkins' Lingua Franca Core). Indian English is a legitimate variety (Kachru). This matters most for speaking later, but also for which "errors" we mark (§6).
10. **Motivation should come from the student and look to their future self.**
    - Self-determination theory: autonomous motivation predicts better L2 outcomes (Alamer et al. 2025).
    - The ideal L2 self (for example, "me confidently clearing my interview") predicts effort well (r = 0.61) but achievement only weakly (r ≈ 0.20). Use it as a hook, not as a method.
    - → Give students choice of topics and paths, make their growing skill visible, and use the placement-interview self as the story frame.

**Where the evidence is weak or mixed** (don't over-claim to stakeholders):
- Streak effects (only company A/B tests).
- Shadowing (no meta-analysis).
- Adaptive difficulty in language apps specifically.
- "AI lowers anxiety" (small, self-report studies).
- Duolingo efficacy (mostly company-linked).
- ASR accuracy on Indian English (no fairness study found).

---

## 5. Market scan: what others do

### 5.1 Products

| Product | Core loop | What to learn from it | What users hate |
|---|---|---|---|
| **Duolingo** (India was its #5 market by daily users in 2022) | Short lessons on a path | Streaks (7-day streak: 2.4× more likely to return), leagues, Friends Quests, placement | Hearts and energy blocking practice; "gamified but not fluent" |
| **NYT Wordle / Connections / Spelling Bee** (11.1B plays in 2024) | One shared daily puzzle | Same puzzle for everyone, short, spoiler-free share grid, "puzzles are cool" for Gen Z | Unfair puzzles break streaks |
| **Contexto / Semantle** | Guess a secret word by "closeness" | A vocabulary-network game with infinite replay | Semantle is too hard |
| **Cambridge Write & Improve** | Write, get a CEFR-linked score, revise, watch the score rise | The **revise loop** | – |
| **Readlang / LingQ** | Tap any word in a real text to see its meaning, which saves a flashcard | Reading plus collecting vocabulary | – |
| **Busuu** | Community corrections | Correcting others teaches the corrector | – |
| **Gimkit / Blooket / Kahoot** | Live class quizzes with in-game money, stealing, tower defence | Party modes for class events | Free-tier limits |
| **ELSA / Speak / Praktika / Stimuler** | Speaking with ASR scoring and AI roleplay | Fast numeric feedback (Stimuler: under 20 s) | ELSA "too strict on Indian accents", Speak "too lenient", billing traps, repetitive AI chats |
| **SpeakX** (India, about 1M monthly learners) | 15 min/day of AI conversation, points, leaderboards, streaks | Hindi-first scale | – |
| **Seekho / YouTube creators** (Spoken English Guru, 8.2M subscribers) | Watch short vernacular lessons | Shows the size of demand for vernacular spoken English | Passive: watching, no practice |
| **Josh Skills, Hello English, PlanetSpark** | Vernacular courses, live classes | Vernacular support is proven at scale | Dated, or aimed at kids |
| **PrepInsta / FACE Prep** | Mock placement tests | They know the test patterns | Dry |

### 5.2 Gaps we can own
1. **Placement task types as daily games.** Nobody does this.
2. **Free, with no hearts, no trials and no paywall.** This avoids the top complaint in reviews.
3. **A campus social layer:** college or section leagues on *effort*, one batch-wide daily puzzle with a share grid, inter-college challenges.
4. **Engineering content:** stand-up updates, bug-report emails, "explain your project", HR rounds, Sem 1 tech topics used as reading material.
5. **Measuring transfer, not just streaks:** a monthly Boss Round (mini mock test) shows whether real skill moved, which answers the "gamified but not fluent" criticism.
6. **Mechanics nobody combines yet:** Connections-style grouping for vocabulary, a Contexto-style daily word, a Write & Improve revise loop for emails, and Readlang-style tap-to-learn reading.

---

## 6. Indian English policy (what we correct and what we accept)

This policy must be written into every judge prompt and every answer key.

| Tier | Rule | Examples |
|---|---|---|
| **Accept** | Normal Indian English; never mark wrong | "isn't it?" as a tag, "today itself", "now only", "prepone", "cousin-brother", "out of station", "I have a doubt", British spellings, Indian names and places |
| **Flag for formal use only** | Fine in chat; in emails and interviews, show a better choice, framed as *"for your HR email, try…"* | "revert back", "do the needful", "kindly", "PFA", "very much eager", "discuss about" |
| **Correct** | Breaks the meaning, or interview panels mark it down | Tense ("I am knowing him since 2020"), "since/from 3 years", subject–verb agreement, articles, question word order ("Why you didn't come?"), "Myself Ravi" in a self-introduction, uncountable plurals ("informations") |

### 40 common error patterns
These come from the AICTE unit, Sailaja 2009, Bhatt 2000 and style guides. The H/M/L rating is our team's judgement.

- **H** = correct
- **M** = correct in formal or placement settings
- **L** = accept

| # | Error | Better | Tier |
|---|---|---|---|
| 1 | I am having two brothers. | I have two brothers. | M |
| 2 | I am knowing him since 2020. | I have known him since 2020. | H |
| 3 | I am understanding the concept. | I understand the concept. | M |
| 4 | I am studying here since two years. | I have been studying here for two years. | H |
| 5 | I have completed it yesterday. | I completed it yesterday. | M |
| 6 | Yesterday I go to college. | Yesterday I went to college. | H |
| 7 | He don't know. | He doesn't know. | H |
| 8 | One of my friend is… | One of my friends is… | M |
| 9 | Each students have… | Each student has… | H |
| 10 | He is engineer. / I went to the Hyderabad. | He is an engineer. / I went to Hyderabad. | M |
| 11 | I am going to home. | I am going home. | M |
| 12 | Discuss about the issue. | Discuss the issue. | M |
| 13 | Return back / revert back | Return / reply | M |
| 14 | Please revert. (meaning "reply") | Please reply. | M |
| 15 | Do the needful. | Name the action: "Please send the form by Friday." | M |
| 16 | PFA / Kindly find attached | I've attached… | L |
| 17 | Today itself I will send. | I'll send it today. | L |
| 18 | I will come now only. | I'm coming right now. | L |
| 19 | You are coming, isn't it? | …aren't you? / …right? | L |
| 20 | Myself Ravi, from Guntur. | I'm Ravi, from Guntur. | H (first impression in a self-intro) |
| 21 | Where you are going? | Where are you going? | M |
| 22 | Why you didn't come? | Why didn't you come? | M |
| 23 | I have a doubt. | I have a question. | L |
| 24 | Prepone the meeting | Bring the meeting forward | L |
| 25 | Cousin-brother | cousin | L |
| 26 | Out of station | out of town | L |
| 27 | Passed out of college | graduated | L |
| 28 | Good name please? | May I know your name? | L |
| 29 | Too good (meaning "very good") | very good | L |
| 30 | Very much eager | very eager | M |
| 31 | Furnitures / informations / equipments / advices | furniture / information / equipment / advice | M |
| 32 | Explain me / tell to him / reply me | Explain to me / tell him / reply to me | M |
| 33 | Married with her / depend of / good in maths | married her / depend on / good at maths | M |
| 34 | Since 3 years / from 3 years | for 3 years | H |
| 35 | Word stress on the wrong syllable (deVElopment, COMpany) | correct stress | H (speaking phase) |
| 36 | v/w swapped where it changes the word (vest/west) | a clear contrast | M (speaking phase) |
| 37 | "th" said as a soft t/d | – | L (it is understood) |
| 38 | Extra vowel in a consonant cluster ("ischool", "fil-im") / final consonant dropped ("tes") | school, film, test | H (speaking phase) |
| 39 | z said as j ("jero") | zero | M (speaking phase) |
| 40 | Spelling pronunciation ("Wed-nes-day"); rising tone on statements | WENZ-day; falling tone on statements | M (speaking phase) |

Rows 35–40 are for the later speaking phase. Rows 1–34 can feed Spot-and-Fix, Fix-the-Email and Jumble in v1.

---

## 7. Design rules for English Adda (derived from §2–§6)

### 7.1 Levels and placement
- **Placement check** in the first session, about 4 minutes, presented as a warm-up game, not a test:
  - Real-or-fake words (vocabulary size)
  - A C-test passage (fill missing letters)
  - 3 dictation sentences
  - One micro-story with 2 questions
- **Fine levels at the bottom:** CEFR-J style sub-levels (Pre-A1, A1.1–A1.3, A2.1–A2.2, B1.1–B1.2, B2). Shown to the student as **Adda Level 1–8** with friendly names. The CEFR label is visible only to the admin.
- **Levels are private.** Other students never see your level.
- Each game adapts its difficulty within a session. A student moves up a level after steady accuracy across several days, and never moves down in public.

### 7.2 Gamification: use and avoid

| Use | Avoid |
|---|---|
| Levels and visible skill progress (the strongest evidence) | Hearts, lives or energy limits |
| A light story frame: "Road to Placement Day", with a campus map of "addas" (Chai Tapri = vocabulary, Library = reading, Radio Room = listening, Notice Board = writing) | Global individual leaderboards on ability |
| One shared **daily puzzle** with a spoiler-free share grid (WhatsApp-friendly) | Badge inflation |
| **Forgiving streaks**: freezes and weekend slack | Streaks broken by unfair puzzles |
| Team and cohort goals: "Section 2B read 500 stories this week"; college vs college on *effort* | Public display of anyone's mistakes or level |
| A personal-best and "you vs last week" graph | Fake urgency and dark patterns |
| A collectible **Word Vault**: words you tap get saved and come back on a spaced schedule | Long lessons (keep rounds 30–120 s) |
| A Boss Round every 2–4 weeks: a mini mock test that shows the placement-readiness meter | Calling anything an "exam" or a "test" |

### 7.3 Content rules (extends the rules in CLAUDE.md)
- Indian context, Gen Z topics (see §8.2). Plain English in instructions.
- Objective items have **exactly one correct answer**, and a second person reviews the answer key.
- Tech-themed reading uses only Sem 1 topics (Python up to dicts, HTML/CSS, Git/CLI, number systems, aptitude, GenAI basics).
- Reading passages are tagged by level using a word-frequency check (target 95–98% known words for that level), plus a Flesch readability score computed in JavaScript.
- Use the Indian English policy (§6) in every answer key and judge prompt.
- Vocabulary source: **NGSL (CC BY-SA, verify before use)** or our own level tags. **Do not** use English Vocabulary Profile, CEFR-J or Oxford 3000/5000 lists without a licence.

### 7.4 Feedback rules
- Fix 1–2 things per answer, never a sea of red.
- **Prompt before telling:** the first miss gives a hint ("Check the verb tense"), and only the second miss shows the answer.
- AI feedback must **quote an exact span** from the student's text, and code checks that the span exists (this blocks invented errors).
- The AI never rewrites the student's whole answer. The student revises it and the score rises (the Write & Improve loop).
- Feedback tone is warm and short. Praise effort and growth, not talent.

### 7.5 Measurement (the evidence everywhere is weak, so we generate our own)
- Placement check at the start, and an equivalent check at about week 8. Compare by how much each student used English Adda.
- A short anxiety and confidence check-in (3 items) at the start and at week 8.
- Admin metrics: minutes per visit, return rate, accuracy by skill, level moves.
- A 5-question in-app survey at launch: earphone access, mic access, noise, preferred language for hints, topics they like. This also prepares the later speaking phase.

---

## 8. Game ideas (first seeds, to be refined in design)

All of these are original. They borrow genre mechanics, not any specific game's name, look or content.

### 8.1 Concept list

| # | Working name | Mechanic | Skill (placement link) | Notes |
|---|---|---|---|---|
| 1 | **Daily Adda Puzzle** | Sort 16 words into 4 hidden groups (synonyms, collocations, Indianisms, tech words) | Vocabulary depth (AMCAT synonyms) | Same puzzle for everyone; share grid; streak |
| 2 | **Catch It** | Hear a sentence (Indian and global voices, slow to normal speed), type it; scored per word | Listening decoding (Versant repeats, dictation) | Fixes the weakest skill; levels change speed and length |
| 3 | **Jumble** | Drag chunks to rebuild a sentence against a timer; combo meter | Grammar (Versant sentence builds) | Uses error patterns 1–34 as distractors |
| 4 | **Vanish** | Read a short passage for 20 s; it disappears; rebuild its meaning in 2–3 lines | Reading memory and writing (passage reconstruction, TCS recall) | AI judge checks key points covered |
| 5 | **Spot & Fix** | Tap the error in a sentence, then pick or type the fix; fast rounds | Grammar (AMCAT error spotting) | Follows the §6 policy, so Indianisms marked "Accept" are never errors |
| 6 | **Fix My Email** | A messy email to a HOD or recruiter: tap the problems, then choose a better tone. Higher levels ask the student to write the email | Formal register (Versant/TCS email) | Write & Improve-style revise loop |
| 7 | **Real or Fake?** | Swipe left or right on words in 5 s each, reel style | Vocabulary size | Also part of placement; cheap content |
| 8 | **Story Rewind** | A 40-s audio story (hostel, cricket, ISRO); retell it in 3 lines or pick the best summary | Listening into writing (Versant story retelling) | Lower levels use multiple choice; higher levels write |
| 9 | **Hot & Cold** | Guess the secret word; each guess shows how close it is | Vocabulary networks | Rank lists precomputed offline from embeddings; one shared daily word |
| 10 | **Tone Switch** | Turn a WhatsApp message into a formal email, and back again | Register awareness | Fun because of the meme-like source texts |
| 11 | **Reel Reader** | Swipe through micro-stories at your level; tap words to save them to the Word Vault; 2 quick questions at the end | Reading (AMCAT reading comprehension), vocabulary | Reading the student chooses, the strongest evidence for reading |
| 12 | **Word Vault** | Spaced review of saved words through small recall games | Vocabulary retention | The spacing engine |
| 13 | **Fact or Forward?** | Read a "WhatsApp forward" or headline and decide whether it's real, clickbait or fake, with a reason | Critical reading | Links to Brain Gym's AI-literacy games |
| 14 | **GD Corner** | Read a GD topic; pick the strongest opener or counterpoint, or write one | Argument writing (group-discussion prep) | Becomes a spoken version later |
| 15 | **Boss Round** | A mixed mini mock (every 2–4 weeks) using the same task types | All skills | Shows the placement-readiness meter |

### 8.2 Content themes (Gen Z, Indian, engineering)
1. Hostel and mess life
2. Cricket and IPL
3. Movies and OTT (all film industries)
4. BGMI and Free Fire
5. Reels and creators
6. Memes and Hinglish translation fails (kept kind)
7. Placement prep: self-intro, HR questions
8. Emails and WhatsApp messages to the HOD, warden or recruiter
9. Tech explained simply (Git, APIs, UPI, Sem 1 topics)
10. GenAI and jobs (GD topics)
11. UPI, money and scam SMS
12. Travel home: Tatkal tickets, waitlists, a new city
13. Food debates (biryani, chai vs filter coffee)
14. Startups and Shark Tank India
15. Festivals (Sankranti, Pongal, Ugadi, Diwali, Onam)
16. Fitness and exam-season routines
17. Fake news and fact-checking
18. Internships and LinkedIn
19. Campus fests and anchoring scripts
20. Indian success stories (ISRO, first-generation founders)

---

## 9. Technology

### 9.1 v1 (no speaking)
- **Listening audio:** pre-generate every clip offline and serve them as static files, the same way as Turbo.
  - **Kokoro** (free; US and UK voices; test whether its Hindi voices sound natural reading English).
  - For Indian-accent variety, a **one-time** paid batch: Sarvam Bulbul (about ₹15–30 per 10k characters, so about ₹1,500 for 500 passages) or Azure en-IN neural voices (about $8 for the same amount, price unverified).
  - Browser `speechSynthesis` only as a last-resort fallback (en-IN voices vary by device).
  - Mixing Indian and global accents is good for learning: real interviewers and clients use both.
  - **Decision 2026-11-09: no budget, so use af_heart only for now** (see §11.3). The paid options above are kept for later.
- **Writing judge:** reuse the `api/judge.js` pattern (new prompts and task types in `prompts.js`):
  - temperature 0, `<student>` tags, `validatePayload` length limits, `validateResult`
  - every error must quote an exact span from the student's text
  - the Indian English allowlist (§6) is in the prompt
  - built-in matching as the fallback, so the games work without the AI
- **New English gold set** in `scripts/gold.mjs`. It must include false-positive traps: correct Indian English, British spellings, and Indian names. Re-run `npm run test:judge` and pick the cheapest model that passes. Candidates verified live 2026-11-09, price per million tokens, input / output:

  | Model | Input | Output |
  |---|---|---|
  | `upstage/solar-mini` (current) | $0.05 | $0.20 |
  | `mistral-nemo` | $0.029 | $0.03 |
  | `llama-3.1-8b` | $0.02 | $0.04 |
  | `mistral-small-24b` | $0.05 | $0.08 |
  | `gpt-oss-20b` | $0.03 | $0.13 |
  | `qwen3.7-flash` | $0.03 | $0.13 |
  | `gemma-3-12b` | $0.05 | $0.15 |
- **Cost:** about $0.00006 per writing check, so pennies per student per month.
- **Readability and levelling:** Flesch scores and word-frequency coverage computed in JavaScript at build time. Skip LanguageTool in v1: its free API allows 20 requests a minute, and self-hosting needs a Java server.
- **Hot & Cold:** precompute closeness ranks offline (Python and embeddings) into static JSON. No runtime cost.
- **Data:** new `english_*` tables in `scripts/db-setup.mjs` and a new `api/english.js`, following the Drive School pattern. Whether English Adda points mix with Brain Gym points is open (§11).

### 9.2 Later: speaking phase (research kept for when we turn it on)
- **Pipeline:**
  1. MediaRecorder (opus at 24 kbps, about 180 KB a minute; mp4 on older Safari), push-to-talk, 60 s cap, a noise check first.
  2. A new `api/speak.js`.
  3. Speech-to-text with **Whisper-large-v3-turbo** through OpenRouter's `/audio/transcriptions` endpoint (about $0.09 per 1,000 thirty-second clips, with word timestamps and `keyterms`). Fall back to Groq Whisper, then Sarvam (best for Indian and code-mixed speech, about 15–20× the cost).
  4. Fluency numbers computed in code: words per minute, pauses, fillers, keyword coverage.
  5. The existing cheap LLM scores against a rubric.
- **Cost:** about ₹0.02 per 30-s check, about ₹0.07 per student per day at 5 checks.
- **Avoid as a grade:**
  - **Azure Pronunciation Assessment:** 40–90× the cost, its best features are en-US only, and it measures distance from a US accent.
  - **Web Speech API:** it auto-corrects what students say, sends audio to Google, and is flaky on Android. Use it only for free "did you say the phrase" mini-games.
- **Fairness:** Whisper still has about 11% word error rate on Indian English (Svarah benchmark), worse in noisy hostels. Never fail a student on one word, always allow a retry, and never show accent grades or rank students by pronunciation.
- **Privacy:**
  - The DPDP Rules apply from about May 2027. They require verifiable parental consent for students under 18, and some of our students are 17.
  - Whether the education exemption covers NxtWave needs a **legal opinion**.
  - Voice may count as biometric data.
  - Default: process audio in memory, store only the transcript and scores, store audio only with an explicit opt-in, and add a consent screen.
- **Mechanics ready for this phase:**
  - Say-it-back (Versant repeats)
  - A JAM spinner (a 30-s topic)
  - Self-intro builder
  - "Explain your project to a 10-year-old"
  - Retell 3 times (4/3/2 repetition)
  - Opt-in social games such as describe-and-guess and a bluffer game, only after students feel confident

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| It feels like test prep, so students leave | Game-first names and visuals, rounds under 2 minutes, the word "test" never used; the placement link shows only as a meter |
| Weak students feel ashamed and quit | Private levels, no hearts, hint before answer, a "you vs you" graph, competition on effort only |
| Strong students get bored | Adaptive difficulty, higher levels with free writing and GD Corner, hard daily puzzles |
| AI marks correct Indian English as wrong | The §6 policy in the prompts, false-positive traps in the gold set, span-quoting enforced in code |
| AI invents errors or over-corrects | Span validation, a cap of 1–2 issues, `validateResult`, built-in matching as the fallback |
| Students paste ChatGPT answers into writing games | Timed writing, short answers, rounds that reward process (choosing a fix, revising), no reward for length |
| Content errors (two correct answers) | Second-person answer key review; mark Claude-written content FOR TEAM REVIEW, as in Drive School |
| Licensing of word lists | NGSL or our own tags only |
| Streaks feel like pressure | Freezes, weekend slack, one bad puzzle never breaks a streak |
| No proof it works | Placement check at the start and at week 8, Boss Rounds, an admin dashboard |

---

## 11. Answered decisions → what they mean for the build (2026-11-09)

### 11.1 First-visit level check → recommended games
- About 4 minutes, framed as "Find your Adda level" with Turbo. It is required before any game opens.
- It scores four skills separately: vocabulary (real-or-fake words), grammar (a C-test plus 2 jumbles), listening (3 Catch It sentences at rising speed) and reading (one micro-story with 2 questions).
- Output: an overall **Adda Level 1–8** plus a strength and a weakness skill.
- **The daily circuit is built from this.** About 60% of the time goes to the student's 1–2 weakest skills, 40% to the rest, so practice is never all weak spots and never all comfort zone.
- Games are *recommended*, not locked. Students can still swap one game per day ("not feeling it, give me another").
- The levels update from everyday play, not only from the first check. The same check is repeated quietly at about week 8 (via a Boss Round) to measure growth.

### 11.2 15-minute goal plus a daily limit
- **Daily circuit, about 15 min:** 5–6 games of about 2–3 min each, picked by §11.1, plus the Daily Adda Puzzle. A ring fills as minutes add up. Reaching 15 min counts as a goal day for the streak (with freezes and weekend slack).
- **Daily limit:** once the circuit is done, give **bonus rounds up to about 25 min total** of fresh content, then stop: "Adda's closed for today, see you tomorrow." Word Vault review stays open, because spaced review doesn't use up fresh content.
- Count *active* minutes only (pause the timer on an idle tab), the same as Brain Gym.

### 11.3 Audio: Turbo's voice only (af_heart)
- Every listening clip is pre-recorded with Kokoro af_heart. No runtime TTS cost.
- We lose accent variety, so add variety through **speed** (0.8× / 1.0× / 1.15×, recorded separately, not browser playback-rate), sentence length and background "noise" levels (a canteen or hostel ambience track mixed in at higher levels).
- Dialogues need two speakers. **Approved:** use one free male Kokoro voice as the second speaker (§11.5).
- Reuse the `turbo-voice.py` approach (or a sibling script) to record only new or changed clips.

### 11.4 Content review pipeline (Claude-written, third-person reviewed)
1. **Write in bulk** as data files (for example `public/content/english/<game>.js`), each item tagged with level, skill, theme and the §6 policy tier where relevant.
2. **Automatic checks** (scripts): one correct answer per objective item, jumble chunks rebuild to exactly one grammatical sentence (an allowlist of accepted orders), word-frequency level of passages, Flesch score, no duplicate items, profanity and sensitive-topic filter, length limits.
3. **Third-person review round:** a separate reviewer agent that did *not* write the content gets only the items and a checklist:
   - Is exactly one answer correct? Is any distractor also defensible?
   - Is the answer key right?
   - Does it follow the Indian English policy (§6)?
   - Is the level right?
   - Is it in plain English, set in India, and fair to all regions, genders and castes?
   - Is any tech content limited to Sem 1 topics?

   The reviewer reports problems item by item. Claude fixes them, and the reviewer re-checks only the flagged items.
4. Mark the files `FOR TEAM REVIEW` in the header anyway, as in Drive School, so a human can spot-check later.
5. **Volume estimate:** 15–25 min/day of fresh content is a lot. For about 30 days with no repeats, each game needs roughly 150–300 items per level band. Use generators where possible (for example Jumble built from a sentence bank, Real or Fake built from a word list plus made-up pseudo-words) so bulk content stays reviewable.

### 11.5 Final answers (2026-11-09)
1. **A second Kokoro voice for dialogues: yes.** Heart stays the main voice (and Turbo's). Pick one free male Kokoro voice for the second speaker in dialogues.
2. **Pilot: batch DEMO only.** The product owner tests it first. Hide English Adda from all other batches until they say go (a server-side flag, as with Drive School's tester checks).
3. **Speaking: parked.** Don't plan, design or build anything for it now. §9.2 stays only as archived research.

---

## 12. Key sources

**Academic**
- Sailer & Homner 2020, *Educational Psychology Review* 32 — https://opus.bibliothek.uni-augsburg.de/opus4/frontdoor/index/index/docId/109056
- Lee & Baek 2023, *Sustainability* 15(14) — https://www.mdpi.com/2071-1050/15/14/11325
- Hanus & Fox 2015, *Computers & Education* 80; Almeida et al. 2023 — https://arxiv.org/abs/2305.08346
- Kim & Webb 2022, *Language Learning* 72(1); Settles & Meeder 2016 — https://aclanthology.org/P16-1174
- Burston & Giannakou 2022, *ReCALL* (MALL publication bias)
- Jiang et al. 2021, *Foreign Language Annals* (Duolingo outcomes)
- Jeon & Day 2016, *Reading in a Foreign Language* — https://scholarspace.manoa.hawaii.edu/items/b52a5591-ec04-4026-816f-434361a4e899
- Laufer & Ravenhorst-Kalovski 2010; NGSL — https://www.newgeneralservicelist.com
- Kang & Han 2015, *Modern Language Journal*; Lyster & Saito 2010, *SSLA*; Ngo et al. 2022 (AWE)
- Munro & Derwing 1995; Jenkins 2000; Ngo, Chen & Lai 2024, *ReCALL* — https://doi.org/10.1017/S0958344023000113
- Teimouri, Goetze & Plonsky 2019, *SSLA*; Horwitz et al. 1986
- Al-Hoorie 2018 (ideal L2 self) — https://pressto.amu.edu.pl/index.php/ssllt/article/view/12295
- Alamer et al. 2025 (SDT) — https://selfdeterminationtheory.org/wp-content/uploads/2025/06/2025_AlamerRobatEtAl_L2.pdf
- Hou & Min 2025, *ReCALL* (dialogue systems) — https://www.cambridge.org/core/product/31847710516602398819C5E594038E7B
- Zeng et al. 2024 (LLM over-correction); Koenecke et al. 2020, *PNAS* (ASR bias)

**India context**
- Aspiring Minds spoken English study — https://www.millenniumpost.in/97-tech-graduates-cannot-speak-english-fluently-survey-101003
- EF EPI 2025 India — https://www.ef.com/assetscdn/WIBIwq6RdJvcD9bc8RMd/cefcom-epi-site/fact-sheets/2025/ef-epi-fact-sheet-india-english.pdf
- ASER 2023 — https://news.careers360.com/42-children-in-14-18-age-group-in-rural-india-cant-read-easy-sentences-in-english-report
- AICTE model curriculum — https://aicte.gov.in/sites/default/files/model%20curriculum%20for%201st%20year%20ug.compressed.pdf
- First-year engineering speaking anxiety (JELT) — https://journals.eltai.in/jelt/article/download/JELT680305/1368/4201
- Gen Z Reels (Ipsos/Meta) — https://www.fonearena.com/blog/484311/india-reels-usage-among-gen-z-report.html
- Hinglish on X — https://www.nature.com/articles/s41599-024-03058-6.pdf

**Placement tests**
- Versant guide — https://www.pearson.com/content/dam/one-dot-com/one-dot-com/english/versant-test/Official-Test-Guide-Versant-Professional-English-Test-final.pdf
- Versant Writing — https://www.pearson.com/content/dam/one-dot-com/one-dot-com/english/SupportingDocs/Versant/DataSheets/Product-Info-Sheet-Versant-Writing-Test.pdf
- SVAR — https://service.shl.com/docs/SVAR%20-%20Spoken%20English%20(U.S.).pdf
- Accenture CA — https://faceprep.in/article/accenture-communication-assessment-test-pattern-sample-questions-faceprep/
- TCS NQT — https://prepinsta.com/tcs-nqt/syllabus/
- Duolingo English Test question guide — https://englishtest-static.duolingo.com/media/resources/Questions%20Guide%202026.pdf

**Market**
- Duolingo streak data — https://blog.duolingo.com/improving-the-streak
- NYT Games plays — https://www.fastcompany.com/91386818/pips-new-game-nyt-the-next-wordle
- Write & Improve — https://writeandimprove.com/free
- SpeakX — https://yourstory.com/2025/10/gen-ai-english-speaking-speakx-funding-westbridge-elevation
- Stimuler — https://india.entrepreneur.com/news-and-trends/stimuler-raises-usd-375-mn-funding-to-scale-voice-first/490839
- AI English app complaints — https://unstar.app/blog/is-speak-elsa-talkpal-loora-learna-ai-english-apps-legit-2026

**Tech**
- OpenRouter STT — https://www.openrouter.ai/docs/api/api-reference/stt/create-transcription.md
- Groq STT — https://console.groq.com/docs/speech-to-text
- Sarvam pricing — https://docs.sarvam.ai/api/pricing
- Svarah benchmark (Indian-accent ASR) — https://arxiv.org/pdf/2305.15760
- Azure Pronunciation Assessment — https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
- Vercel function limits — https://vercel.com/docs/functions/limitations
- DPDP Rules — https://ourtake.bakerbotts.com/post/102lund/india-notifies-final-rules-for-digital-data-protection-act

**Caveats.** Many figures come from vendor sources or press summaries, and some are marked unverified in the raw research. Check against the originals before using any number in a deck or a public claim.
