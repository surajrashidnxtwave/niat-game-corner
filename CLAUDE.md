# Notes for Claude Code

## What this is
A single-page game app (`public/index.html`) plus one Vercel serverless function (`api/judge.js`) that calls OpenRouter to judge open-ended answers in three games: Beat the 7, Recall Rebuild, Missing Link.

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
