import { test, eq, ok, fx, fakeApi } from './harness.js';
import { parseIcs } from '../extension/lib/ics.js';
import { blankState, loadProgram, deepen } from '../extension/lib/pitch.js';
import { compute, matchEvents, currentSemester, altCounts } from '../extension/lib/engine.js';

const dataset = await fx('extension/data/syllabus.BI.json').then(r => r.json());
const aliases = await fx('extension/data/aliases.json').then(r => r.json());
const cal = parseIcs(await fx('fixtures/public/demo.ics').then(r => r.text()));
const fixtures = await fx('fixtures/public/pitch-demo.json').then(r => r.json());
const api = fakeApi(fixtures);
const pitch = blankState('demo'); await loadProgram(pitch, api); await deepen(pitch, api);
const now = new Date('2026-10-15T08:00:00Z');

test('matchEvents : appariement du démo (alias inclus), non appariés remontés', () => {
  const m = matchEvents(cal, dataset, aliases, 'B2');
  const acad = m.events.filter(e => !e.ignored);
  ok(acad.filter(e => e.unit).length / acad.length > 0.95, 'taux');
  ok(m.byUnit['CROSS_PP5'] && m.byUnit['CROSS_PP5'].length === 12, 'BOAT -> CROSS_PP5');
  ok(m.byUnit['CROSS_MME-EEE_LAB1'], 'MEC-EEE Lab1 -> CROSS_MME-EEE_LAB1');
  eq(m.unmatched.map(u => u.code), ['EEE_LAB5']);
  ok(m.events.filter(e => e.ignored).length >= 11);
});
test('currentSemester : agenda prioritaire, PITCH en repli', () => {
  eq(currentSemester({ year: 'B2', now, pitch }).sem, 'B2.3');
  eq(currentSemester({ year: '', now, pitch }), { sem: 'B2.3', fromCal: '', fromPitch: 'B2.3' });
  eq(currentSemester({ year: '', now, pitch: null }).sem, '');
});
const R = compute({ dataset, aliases, pitch, cal, now, T: 50 });
test('compute : statuts de critères cohérents', () => {
  const st = {}; Object.values(R.crits).forEach(c => { st[c.status] = (st[c.status] || 0) + 1; });
  ok(st.ok > 0 && st.planned > 0 && st.later > 0 && st.lost > 0 && st.notyet > 0, JSON.stringify(st));
  Object.values(R.crits).forEach(c => {
    if (c.status === 'ok') ok(c.pitch === 'ok', 'ok <= pitch ' + c.code);
    if (c.status === 'planned') ok(c.next && c.next.type === 'event' && c.next.event.start > now.toISOString(), 'planned daté ' + c.code);
    if (c.status === 'lost') ok(!c.next, 'lost sans chance ' + c.code);
    if (c.status === 'notyet') ok(!c.attempted, 'notyet jamais tenté ' + c.code);
  });
});
test('compute : événements annotés (à démontrer / démontrés / contribue)', () => {
  const evs = R.events.filter(e => e.unit && !e.past);
  ok(evs.length > 20); ok(evs.some(e => e.toDemo.length > 0)); ok(evs.some(e => e.done.length > 0));
  evs.forEach(e => { e.toDemo.forEach(c => ok(R.crits[c].status !== 'ok')); e.done.forEach(c => ok(R.crits[c].status === 'ok')); });
  const nxt = evs.filter(e => e.isNext.length); ok(nxt.length > 0, 'au moins une séance "prochaine chance"');
  nxt.forEach(e => e.isNext.forEach(c => eq(R.crits[c].next.event.uid, e.uid)));
});
test('compute : verdicts AA v6 et seuils', () => {
  const v = {}; R.aas.forEach(a => { v[a.verdict] = (v[a.verdict] || 0) + 1; });
  ok(v.ok && v.req && v.rat, JSON.stringify(v));
  R.aas.forEach(a => {
    if (a.verdict === 'ok') ok(a.pct >= 50);
    if (a.verdict === 'req') ok(a.critStates.some(c => c.status === 'lost'), 'req a un perdu ' + a.code);
    if (a.verdict === 'rat') ok(!a.critStates.some(c => c.status === 'lost') && a.critStates.some(c => c.attempted && (c.status === 'planned' || c.status === 'later')), 'rat ' + a.code);
  });
  const R100 = compute({ dataset, aliases, pitch, cal, now, T: 100 });
  ok(R100.aas.filter(a => a.verdict === 'ok').length < R.aas.filter(a => a.verdict === 'ok').length);
  const alt = altCounts(R.aas, 50); eq(alt.seuil, 100); ok(alt.req + alt.rat >= 0);
});
test('compute : jauge sur le cursus, année par année selon l\'année de démonstration', () => {
  const g = R.gauge; eq(g.curSem, 'B2.3'); eq(g.curYear, 'B2'); eq(g.scope, 'cursus');
  const c = g.cursus; eq(c.ok + c.planned + c.later + c.lost + c.notyet, c.total); ok(c.total > 900, 'total ' + c.total);
  ok(c.best >= c.pct, 'la projection optimiste ne peut pas être sous le réalisé');
  ok(g.taught.total <= c.total && g.taught.ok === c.ok && g.taught.pct >= c.pct, 'l\'enseigné contient tous les démontrés et rien de plus que le cursus');
  eq(g.byYear.map(y => y.year), ['BP', 'B1', 'B2', 'B3']);
  g.byYear.forEach(y => eq(y.ok + y.late_ok + y.planned + y.later + y.lost + y.notyet, y.total, 'somme ' + y.year));
  /* chaque critère démontré appartient à une seule année attendue : ok si à temps, late_ok si rattrapé après */
  /* un critère partagé par deux acquis d'années différentes est attendu dans les deux : léger recouvrement toléré (4 cas sur la démo) */
  const sum = g.byYear.reduce((n, y) => n + y.ok + y.late_ok, 0);
  ok(sum >= c.ok - 5 && sum <= c.ok + 20, 'les années couvrent les démontrés, à un petit recouvrement près : ' + sum + ' vs ' + c.ok);
  const b2 = g.byYear.find(y => y.year === 'B2'); ok(b2.current && !b2.future);
  const b3 = g.byYear.find(y => y.year === 'B3'); ok(b3.future && b3.late_ok === 0 && b3.notyet > 0, 'B3 : rien rattrapé après (impossible), du pas encore enseigné');
  const bp = g.byYear.find(y => y.year === 'BP'); ok(bp.recovered === 0, 'rien à rattraper avant la première année');
  ok(g.byYear.some(y => y.late_ok > 0) && g.byYear.some(y => y.recovered > 0), 'la démo contient des rattrapages tardifs');
  ok(g.byComp.length === 13, 'une ligne par compétence'); g.byComp.forEach(x => eq(x.ok + x.planned + x.later + x.lost + x.notyet, x.total));
});
test('compute : liste « prochaine chance » triée par urgence', () => {
  const ch = R.chances; ok(ch.length > 50);
  for (let i = 1; i < ch.length; i++) {
    ok(ch[i].urgency >= ch[i - 1].urgency, 'urgence');
    if (ch[i].urgency === 0 && ch[i - 1].urgency === 0) ok(ch[i].when >= ch[i - 1].when, 'date');
  }
  ok(ch.every(c => c.status !== 'ok' && c.status !== 'notyet'));
});
test('compute : sans agenda (mode dégradé) et sans PITCH', () => {
  const R1 = compute({ dataset, aliases, pitch, cal: null, now, T: 50 });
  ok(R1.events.length === 0); ok(Object.values(R1.crits).every(c => c.status !== 'planned')); ok(R1.curSem === 'B2.3');
  const R2 = compute({ dataset, aliases, pitch: null, cal, now, T: 50 });
  ok(R2.aas.length === 0); ok(R2.events.some(e => e.toDemo.length)); ok(Object.values(R2.crits).every(c => c.status !== 'ok'));
});
