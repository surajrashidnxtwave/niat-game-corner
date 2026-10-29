// Shared judging logic, used by the Vercel function (api/judge.js) and the test script.
import { PROMPTS, buildUser } from './prompts.js';

export const TASKS = ['beat7', 'recall', 'missinglink'];
const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

// ---- input validation: reject anything unexpected before it reaches the model ----
export function validatePayload(task, p) {
  if (!p || typeof p !== 'object') return false;
  if (task === 'beat7') return str(p.prompt, 200) && str(p.answer, 60) && str(p.typical, 60) && Array.isArray(p.common) && p.common.length <= 8 && p.common.every(c => str(c, 60));
  if (task === 'recall') return str(p.passage, 1200) && str(p.answer, 1500) && Array.isArray(p.facts) && p.facts.length > 0 && p.facts.length <= 12 && p.facts.every(f => str(f, 80));
  if (task === 'missinglink') return Array.isArray(p.cues) && p.cues.length === 3 && p.cues.every(c => str(c, 30)) && str(p.answer, 30) && str(p.expected, 30);
  return false;
}

// ---- output validation: only well-formed results are used ----
export function validateResult(task, r, p) {
  if (!r || typeof r !== 'object') return null;
  if (task === 'beat7') {
    if (!['typical', 'common', 'original', 'invalid'].includes(r.category)) return null;
    return { category: r.category, reason: typeof r.reason === 'string' ? r.reason.slice(0, 140) : '' };
  }
  if (task === 'recall') {
    if (!Array.isArray(r.hits) || r.hits.length !== p.facts.length || !r.hits.every(h => typeof h === 'boolean')) return null;
    return { hits: r.hits };
  }
  if (task === 'missinglink') {
    if (typeof r.valid !== 'boolean') return null;
    const forms = Array.isArray(r.forms) ? r.forms.filter(f => typeof f === 'string').slice(0, 3).map(f => f.slice(0, 40)) : [];
    return { valid: r.valid, forms: r.valid ? forms : [] };
  }
  return null;
}

function extractJson(text) {
  if (!text) return null;
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

// ---- call OpenRouter ----
async function callModel(model, system, user, { jsonMode = true, timeoutMs = 8000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const body = { model, temperature: 0, max_tokens: 200, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
    if (jsonMode) body.response_format = { type: 'json_object' };
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Game Corner AI Judge'
      },
      body: JSON.stringify(body),
      signal: ctl.signal
    });
    if (!r.ok) {
      const err = await r.text();
      // some models reject response_format; retry once without it
      if (jsonMode && r.status === 400) return callModel(model, system, user, { jsonMode: false, timeoutMs });
      throw new Error(`OpenRouter ${r.status}: ${err.slice(0, 200)}`);
    }
    const j = await r.json();
    return { text: j.choices?.[0]?.message?.content || '', usage: j.usage || null };
  } finally { clearTimeout(t); }
}

export async function judgeTask(task, payload, { model } = {}) {
  const useModel = model || process.env.OPENROUTER_MODEL;
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');
  if (!useModel) throw new Error('OPENROUTER_MODEL is not set');
  const { text, usage } = await callModel(useModel, PROMPTS[task], buildUser(task, payload));
  const result = validateResult(task, extractJson(text), payload);
  return { result, usage, raw: text };
}
