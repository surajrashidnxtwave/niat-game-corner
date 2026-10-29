# Game Corner

15 short cognitive games for 1st-year B.Tech students, built to keep thinking sharp in the AI era. Content follows the Sem 1 syllabus (Python, HTML/CSS, Git, maths, GenAI basics).

Three games use an AI model to judge open-ended answers by meaning:

| Game | What the AI checks |
|---|---|
| Beat the 7 | Is the answer typical, common, original, or invalid? ("email automation" = "email assistant") |
| Recall Rebuild | Which key facts did the student state, in their own words? |
| Missing Link | Is a different word also a genuine link for all three cues? |

Every other game uses fixed answers, checked in code.

**Safety net:** exact matches are scored in code first; only unclear answers go to the AI. If the AI is off, slow (over 7–9 s) or returns anything malformed, the game falls back to built-in matching, so students never get stuck.

## Project layout

```
public/index.html          the whole game app (single page, no build step)
api/judge.js               Vercel serverless endpoint: POST /api/judge
api/_lib/prompts.js        instructions for each judged task
api/_lib/judge-core.js     input/output validation + OpenRouter call
scripts/cheapest-models.mjs   lists the cheapest OpenRouter models
scripts/test-judge.mjs        compares models on accuracy, speed and cost
scripts/gold.mjs              19 test cases with the correct verdicts
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

1. Push this folder to a GitHub repo and import it in Vercel (framework preset: **Other**, no build command).
2. In Vercel → Project → Settings → Environment Variables, add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `SITE_URL` (your Vercel URL).
3. Deploy. The key stays on the server; the browser only ever calls `/api/judge`.

## Before a real rollout

- Progress is stored in each student's browser for now. Add login and a database before real use.
- The answer cache and rate limit live in memory per server instance. For many students, move them to Vercel KV or Upstash Redis.
- Review a sample of AI verdicts each week, and add any disagreements to `scripts/gold.mjs`.
