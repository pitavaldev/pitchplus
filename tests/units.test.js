import { test, eq, ok, fx } from './harness.js';
import { normUnit, resolveUnit, unitIndex, isIgnored, semOfDate, yearFromCalname, semOrder, semYear } from '../extension/lib/units.js';

const aliases = await fx('extension/data/aliases.json').then(r => r.json());
const dataset = await fx('extension/data/syllabus.BI.json').then(r => r.json());
const idx = unitIndex(dataset);

test('normUnit : espace -> _, segment avant " - ", majuscules', () => {
  eq(normUnit('MEO PBL8 - Product innovation'), 'MEO_PBL8');
  eq(normUnit('MEC-EEE Lab1 - Initial tests - Exper. Design'), 'MEC-EEE_LAB1');
  eq(normUnit('CROSSDISCIP BOAT - Transversal Project'), 'CROSSDISCIP_BOAT');
  eq(normUnit('A3.5.ICT.01 - Entreprise'), 'A3.5.ICT.01');
  eq(normUnit('  Sport '), 'SPORT');
  /* les accents sont retirés : la table d'alias n'a plus à lister « Férié » et « Ferie » */
  eq(normUnit('Férié'), 'FERIE');
  eq(normUnit('Journée portes ouvertes'), 'JOURNEE_PORTES_OUVERTES');
});
test('resolveUnit : code direct, casse mixte, alias simple, alias par semestre', () => {
  eq(resolveUnit('MEO_PBL8', 'B2.3', aliases, idx), 'MEO_PBL8');
  eq(resolveUnit('ESE_EXP5C', 'B2.3', aliases, idx), 'ESE_EXP5c');
  eq(resolveUnit('MEC-EEE_LAB1', 'B2.3', aliases, idx), 'CROSS_MME-EEE_LAB1');
  eq(resolveUnit('CROSSDISCIP_BOAT', 'B2.3', aliases, idx), 'CROSS_PP5');
  eq(resolveUnit('CROSSDISCIP_BOAT', 'B2.4', aliases, idx), 'CROSS_PP6');
  eq(resolveUnit('CROSSDISCIP_BOAT', 'B1.1', aliases, idx), null);
  eq(resolveUnit('EEE_LAB5', 'B2.3', aliases, idx), null);
});
test('isIgnored : code entier ou premier segment, jamais un préfixe partiel', () => {
  ok(isIgnored('SPORT', aliases)); ok(isIgnored('RIM', aliases)); ok(isIgnored('AUTONOMY', aliases));
  ok(isIgnored(normUnit('Férié'), aliases), 'accents');
  ok(isIgnored('FORUM_ICAM_ENTREPRISES', aliases), 'premier segment');
  ok(!isIgnored('MEO_PBL8', aliases));
  ok(!isIgnored('RIMBAUD_PBL1', aliases), 'une unité qui commence par RIM ne doit pas être avalée');
});
test('semOfDate / yearFromCalname / semOrder', () => {
  eq(semOfDate(new Date('2026-10-12T10:00:00Z'), 'B2'), 'B2.3');
  eq(semOfDate(new Date('2027-01-20T10:00:00Z'), 'B2'), 'B2.3');
  eq(semOfDate(new Date('2027-03-01T10:00:00Z'), 'B2'), 'B2.4');
  eq(semOfDate(new Date('2027-03-01T10:00:00Z'), 'BP'), 'Bp.2');
  eq(yearFromCalname('HYP - X Y 01/01/2006 (LIL-B2 - LIL-B2, <TD> TD1)'), { campus: 'LIL', year: 'B2' });
  /* un campus non prévu ne doit plus faire perdre l'année */
  eq(yearFromCalname('HYP - X (BXL-B3 - BXL-B3)'), { campus: 'BXL', year: 'B3' });
  eq(yearFromCalname('HYP - X (QUITO-B1)'), { campus: 'QUITO', year: 'B1' });
  eq(yearFromCalname(''), { campus: '', year: '' });
  eq(semYear('B2.3'), 'B2'); eq(semYear('Bp.1'), 'BP');
  eq(semOrder('Bp.1'), 1); eq(semOrder('B3.6'), 8); eq(semOrder('X'), -1);
});
test('dataset : cohérence des clés (unités ↔ critères ↔ AA)', () => {
  const U = dataset.units, Cr = dataset.crits, A = dataset.aas;
  let bad = 0;
  Object.values(U).forEach(u => u.eval.forEach(c => { if (!Cr[c] || Cr[c].eval.indexOf(u.code) < 0) bad++; }));
  Object.values(Cr).forEach(c => c.aas.forEach(a => { if (!A[a]) bad++; }));
  eq(bad, 0, 'références croisées');
  ok(Object.keys(U).length > 180); ok(Object.keys(Cr).length > 1000);
  ok(U['CROSS_PP5'].sem === 'B2.3' && U['CROSS_PP6'].sem === 'B2.4');
});
