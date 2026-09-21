/* Mini harnais de test : test(name, fn) + assert. Tourne dans le navigateur (tests/run.html) ; résultat lisible et exposé sur window.__tests. */
const tests = [];
export function test(name, fn) { tests.push({ name, fn }); }
export function eq(a, b, msg) { const sa = JSON.stringify(a), sb = JSON.stringify(b); if (sa !== sb) throw new Error((msg || 'eq') + ' : ' + sa + ' ≠ ' + sb); }
export function ok(v, msg) { if (!v) throw new Error(msg || 'ok'); }
export async function run(el) {
  let pass = 0, fail = 0; const lines = [];
  for (const t of tests) {
    try { await t.fn(); pass++; lines.push('<span class="ok">✓</span> ' + esc(t.name)); }
    catch (e) { fail++; lines.push('<span class="ko">✗ ' + esc(t.name) + '</span>\n    ' + esc(e && e.stack || e)); }
  }
  lines.unshift((fail ? '<span class="ko">' : '<span class="ok">') + pass + ' réussis, ' + fail + ' échoués</span>');
  el.innerHTML = lines.join('\n');
  window.__tests = { pass, fail, done: true };
}
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
export const fx = rel => fetch('../' + rel).then(r => { if (!r.ok) throw new Error('fixture ' + rel + ' : ' + r.status); return r; });
/** Faux fetcher PITCH : sert les réponses enregistrées, null pour un chemin inconnu (comme l'API en échec). */
export const fakeApi = fixtures => path => Promise.resolve(fixtures[path] || null);
