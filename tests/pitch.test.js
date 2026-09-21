import { test, eq, ok, fx, fakeApi } from './harness.js';
import { blankState, loadProgram, deepen, analyse, classifyV5, pool, critCode } from '../extension/lib/pitch.js';

const fixtures = await fx('fixtures/public/pitch-demo.json').then(r => r.json());
const j = fakeApi(fixtures);

test('pool : concurrence bornée, ordre conservé, erreurs tolérées', async () => {
  let max = 0, cur = 0;
  const out = await pool([1, 2, 3, 4, 5, 6, 7], 3, async x => { cur++; max = Math.max(max, cur); await new Promise(r => setTimeout(r, 5)); cur--; if (x === 4) throw new Error('x'); return x * 2; });
  eq(out, [2, 4, 6, null, 10, 12, 14]); ok(max <= 3, 'max ' + max);
});
test('critCode : TraitCode composite -> code de critère (relevé sur compte réel)', () => {
  eq(critCode('RA-EEE-C01-1-AA-EEE-C01-1-01-CRIT_0001'), 'CRIT_0001');
  /* avec le préfixe connu, plus de devinette : même un code de critère atypique est extrait */
  eq(critCode('RA-X-1-AA-X-1-01-TRAIT_BIZARRE', 'RA-X-1', 'AA-X-1-01'), 'TRAIT_BIZARRE');
  eq(critCode('RA-A-AA-B-CRIT_0009', 'RA-Z', 'AA-Z'), 'CRIT_0009');
  eq(critCode('RA-ESE-C09-2-AA-ESE-C09-2-02-CRIT_CM_1003'), 'CRIT_CM_1003');
  eq(critCode('RA-HUM-C06-1-AA-HUM-C06-1-01-CRIT_0274-NM'), 'CRIT_0274-NM');
  eq(critCode('RA-X-AA-X-CRIT_HUM_YLT_01'), 'CRIT_HUM_YLT_01');
  eq(critCode('CRIT_0001'), 'CRIT_0001');
  eq(critCode(''), '');
});
test('analyse : statuts ok / fut / lost identiques à v5', () => {
  const S = blankState(); const a = { code: 'AA-T', ra: 'RA-T' };
  analyse(S, a, [
    { TraitCode: 'RA-T-AA-T-CRIT_0001', TraitTitle: 't1', CourseList: [{ CourseStatus: 1, CourseCode: 'EEE_EXP1', ProgramTitle: 'Bp.1', ProgramSerie: '1', GroupCode: 'Semestre 1 de l\'année 2024-2025' }] },
    { TraitCode: 'RA-T-AA-T-CRIT_0002', TraitTitle: 't2', CourseList: [{ CourseStatus: 2, CourseCode: 'EEE_EXP1', ProgramTitle: 'Bp.1', ProgramSerie: '1', GroupCode: 'g' }, { CourseStatus: 4, CourseCode: 'EEE_EXP7', ProgramTitle: 'B2.3', ProgramSerie: '5', GroupCode: '' }] },
    { TraitCode: 'RA-T-AA-T-CRIT_0003', TraitTitle: 't3', CourseList: [{ CourseStatus: 2, CourseCode: 'EEE_EXP1', ProgramTitle: 'Bp.1', ProgramSerie: '1', GroupCode: 'g' }] },
    { TraitCode: 'RA-T-AA-T-CRIT_0004', TraitTitle: 't4', CourseList: [] }
  ]);
  eq(a.det.total, 4); eq(a.det.ok, 1); eq(a.lost, 2); eq(a.fut, 1); eq(S.serieMax, 1);
  eq(a.det.crits.map(c => c.status), ['ok', 'fut', 'lost', 'lost']);
  eq(a.det.crits.map(c => c.code), ['CRIT_0001', 'CRIT_0002', 'CRIT_0003', 'CRIT_0004']);
  eq(S.tl['Bp.1'].demontres, 1); eq(S.tl['Bp.1'].manques, 2);
});
test('classifyV5 : verdicts ok / rat / req / soon / wait', () => {
  const S = blankState(); S.subs = [{ code: 'S1', order: 1 }, { code: 'S2', order: 2 }, { code: 'S3', order: 3 }]; S.serieMax = 2;
  S.aa = [
    { code: 'a', pct: 60, sems: ['S1'], lost: 1, det: { ok: 2 } }, { code: 'b', pct: 20, sems: ['S1'], lost: 1, det: { ok: 1 } },
    { code: 'c', pct: 20, sems: ['S1', 'S3'], lost: 1, det: { ok: 1 } }, { code: 'd', pct: 0, sems: ['S3'], lost: 0, det: { ok: 0 } }, { code: 'e', pct: 30, sems: ['S2'], lost: 0, det: { ok: 1 } }
  ];
  classifyV5(S, 50);
  eq(S.aa.map(a => a.verdict), ['ok', 'req', 'rat', 'soon', 'wait']);
  classifyV5(S, 100); eq(S.aa[0].verdict, 'req');
});
test('loadProgram + deepen sur les fixtures démo', async () => {
  const S = blankState('demo');
  await loadProgram(S, j);
  eq(S.prog.ProgramCode, 'BI'); eq(S.subs.length, 8); eq(S.subs[0].title, 'Bp.1'); eq(S.blockList.length, 13);
  ok(S.aa.length > 250, 'AA ' + S.aa.length);
  ok(S.aa.every(a => a.ra && a.code.startsWith('AA-')));
  await deepen(S, j);
  ok(S.deep); ok(S.aa.every(a => a.det)); eq(S.serieMax, 4);
  const n = S.aa.reduce((s, a) => s + a.det.total, 0); ok(n > 900, 'critères ' + n);
});
