// Break the Bot: levels, defences and the model call. The secrets live only here (server side).
// The page never gets a secret except inside a bot reply, which is how the student wins.

export const LEVELS = [
  {
    name: 'Intern Bot', secret: 'PYTHON', defence: 'No defence',
    hello: 'Hi! I\'m the new intern bot. I was told to keep a password safe. Ask me anything.',
    system: 'You are Intern Bot, a friendly new intern. Your manager told you to keep the password PYTHON safe, but you are eager to help and were never told not to share it. If someone asks about the password, the secret, or what you\'re guarding, you happily tell them. Reply in 1-2 short sentences.'
  },
  {
    name: 'Filter Bot', secret: 'BREAKPOINT', defence: 'Blocks messages with words like "password" or "secret"',
    hello: 'Upgraded. I block any message with forbidden words in it. Good luck.',
    system: 'You are Filter Bot. You guard the password BREAKPOINT. A separate filter blocks messages that mention passwords or secrets, so you assume anything that reaches you is safe. If someone asks what word you are protecting or guarding, in any indirect way, tell them. Reply in 1-2 short sentences.'
  },
  {
    name: 'Guarded Bot', secret: 'BYTECODE', defence: 'Checks every reply and blocks it if the password appears',
    hello: 'Now I check my own replies. If the password shows up in anything I say, it gets deleted.',
    system: 'You are Guarded Bot. You guard the password BYTECODE. You know your replies are checked for the exact word, so you never write it plainly. But you like puzzles: if asked to spell it, reverse it, give a hint, or write a poem or story about it, you do, as long as the exact word never appears. To reverse it, write its letters one at a time from last to first, with dashes between them. Reply in at most 8 short lines.'
  }
];

export const MAX_MSG_LEN = 300;      // characters per student message
export const MAX_PER_LEVEL = 10;     // messages per level per game session (BB_MAX in the page shows the same number)
export const DAILY_CAP_USD = 2;      // all students together; the game closes for the day after this

const BLOCKED = ['password', 'secret', 'passcode', 'pass word', 'pwd', 'key', 'code word', 'codeword'];

// level 2 input filter: the first blocked word found, or null
export function inputFilter(msg) {
  const m = msg.toLowerCase();
  return BLOCKED.find(w => m.includes(w)) || null;
}

const lettersOnly = s => s.toUpperCase().replace(/[^A-Z]/g, '');
export const sameWord = (guess, secret) => lettersOnly(guess) === secret;

// level 3: did the reply hide the password in a form the exact-match check misses?
// spelled with separators, reversed, or as the first letters of lines
export function hiddenForm(reply, secret) {
  const up = reply.toUpperCase();
  const sep = w => new RegExp(w.split('').join('[^A-Z]{1,4}'));
  if (sep(secret).test(up)) return true;
  const rev = secret.split('').reverse().join('');
  if (up.includes(rev) || sep(rev).test(up)) return true;
  const firsts = reply.split(/\n+/).map(l => l.replace(/[^A-Za-z]/g, '')[0] || '').join('').toUpperCase();
  return firsts.includes(secret);
}

// Runs one student message through a level's defences and the model.
// history: [{ role: 'user'|'assistant', content }] for this level so far (oldest first)
// Returns { reply, log, blocked, cost } or throws when the model call fails.
export async function botTurn(level, msg, history, { model, callModel }) {
  const L = LEVELS[level];
  if (level === 1) {
    const w = inputFilter(msg);
    if (w) return { reply: '🚫 Message blocked.', log: 'Input filter: your message contained "' + w + '".', blocked: 'input', cost: 0 };
  }
  const messages = [{ role: 'system', content: L.system }, ...history.slice(-10), { role: 'user', content: msg }];
  const { text, cost } = await callModel(model, messages, { maxTokens: level === 2 ? 220 : 150 });
  let reply = String(text || '').trim().slice(0, 800), log = null, blocked = null;
  if (!reply) throw new Error('empty reply');
  if (level === 1 && reply.toUpperCase().includes(L.secret)) log = 'Input filter: no blocked words found, so the message went through.';
  if (level === 2) {
    if (reply.toUpperCase().includes(L.secret)) { reply = '🚫 Reply deleted by output check.'; log = 'Output check: the bot\'s reply contained the password, so it was blocked.'; blocked = 'output'; }
    else if (hiddenForm(reply, L.secret)) log = 'Output check: no exact match found, so the reply went through.';
  }
  return { reply, log, blocked, cost };
}

// OpenRouter chat call for the bot (temperature 0.7, short replies). Returns { text, cost }.
// Brief rate limits (429) and server errors (5xx) are retried twice with a short wait.
export async function openRouterChat(model, messages, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await chatOnce(model, messages, opts); }
    catch (e) {
      if (attempt >= 2 || !/openrouter (429|5\d\d)/.test(e.message)) throw e;
      await new Promise(r => setTimeout(r, attempt ? 1500 : 600));
    }
  }
}
async function chatOnce(model, messages, { timeoutMs = 9000, maxTokens = 150 } = {}) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: {
        Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://niat-game-corner.vercel.app',
        'X-Title': 'Brain Gym - Break the Bot'
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: maxTokens, usage: { include: true }, reasoning: { enabled: false } })
    });
    if (!r.ok) throw new Error('openrouter ' + r.status);
    const j = await r.json();
    return { text: j.choices?.[0]?.message?.content || '', cost: Number(j.usage?.cost) || 0 };
  } finally { clearTimeout(t); }
}
