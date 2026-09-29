import { test, eq, ok, fx } from './harness.js';
import { parseIcs, unfold, parseDate, parseDescription, classify, dayKey, fmtTime } from '../extension/lib/ics.js';

const sample = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nX-WR-CALNAME;LANGUAGE=fr:HYP - DEMO Etudiant 01/01/2006 (LIL-B2 - LIL-B2\\,\r\n  <TD> TD1)\r\nBEGIN:VEVENT\r\nUID:Cours-1-1-X-Index-Education\r\nDTSTART:20261012T154500Z\r\nDTEND:20261012T170000Z\r\nSUMMARY;LANGUAGE=fr:PBL - MEO PBL8 - Product innovation - ESCARE - LIL-B2 - Phase\r\n  retour - discussion\r\nDESCRIPTION;LANGUAGE=fr:Type : PBL\\nMatière : MEO PBL8 - Product innovation\\nEnseignant : ESCARE\\nSalle : LIL-LAC3.01 (78) (BP)\\nPromotion : LIL-B2\\nMémo : Phase retour - discussion\\n\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:Cours-2-1-X-Index-Education\r\nDTSTART;VALUE=DATE:20261101\r\nDTEND;VALUE=DATE:20261102\r\nSUMMARY;LANGUAGE=fr:Férié\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:Cours-3-1-X-Index-Education\r\nDTSTART:20261105T080000Z\r\nDTEND:20261105T100000Z\r\nSUMMARY;LANGUAGE=fr:Evaluation - EEE EXP7 - Electrical engineering - X - LIL-B2\r\nDESCRIPTION;LANGUAGE=fr:Type : Evaluation\\nMatière : EEE EXP7 - Electrical engineering\\nEnseignants : A\\, B\\nSalles : S1 (10)\\, S2 (20)\\nPromotions : B3-LILLE\\, LIL-B2\\n\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;

test('unfold : lignes pliées à 75 caractères', () => {
  eq(unfold('A:b\r\n c\r\nD:e'), 'A:bc\nD:e');
});
test('parseDate : UTC et journée entière', () => {
  eq(parseDate('20261012T154500Z').iso, '2026-10-12T15:45:00.000Z');
  const d = parseDate('20261101', 'VALUE=DATE'); ok(d.allDay); eq(d.day, '2026-11-01');
});
test('parseDescription : champs singuliers et pluriels, virgules échappées', () => {
  const f = parseDescription('Type : PBL\\nMatière : MEO PBL8 - Product innovation\\nEnseignants : A\\, B\\nSalles : S1\\, S2\\nPromotions : B3-LILLE\\, LIL-B2\\nMémo : Phase aller\\n');
  eq(f.type, 'PBL'); eq(f.matiere, 'MEO PBL8 - Product innovation'); eq(f.teachers, ['A', 'B']); eq(f.rooms, ['S1', 'S2']); eq(f.promos, ['B3-LILLE', 'LIL-B2']); eq(f.memo, 'Phase aller');
});
test('classify : type et phase', () => {
  eq(classify({ type: 'PBL', memo: 'Phase retour - discussion' }), { kind: 'pbl', phase: 'return' });
  eq(classify({ type: 'PBL', memo: 'Evaluation' }), { kind: 'eval', phase: 'eval' });
  eq(classify({ type: 'Evaluation', memo: '' }), { kind: 'eval', phase: '' });
  eq(classify({ type: 'Temps expert', memo: '' }), { kind: 'expert', phase: '' });
  eq(classify({ type: '', memo: 'Autonomie' }), { kind: 'other', phase: 'self' });
});
test('parseIcs : calendrier complet', () => {
  const c = parseIcs(sample);
  ok(c.calname.indexOf('LIL-B2') > 0, 'calname'); eq(c.events.length, 3);
  const e = c.events[0];
  eq(e.uid, 'Cours-1-1-X-Index-Education'); eq(e.start, '2026-10-12T15:45:00.000Z'); eq(e.fields.matiere, 'MEO PBL8 - Product innovation'); eq(e.kind, 'pbl'); eq(e.phase, 'return');
  eq(e.fields.rooms, ['LIL-LAC3.01 (78) (BP)']);
  ok(c.events[1].allDay); eq(c.events[1].fields.matiere, 'Férié');
  eq(c.events[2].kind, 'eval'); eq(c.events[2].fields.teachers, ['A', 'B']);
});
test('fuseau : affichage Europe/Paris', () => {
  eq(fmtTime('2026-10-12T15:45:00.000Z'), '17:45');
  eq(dayKey('2026-10-12T22:30:00.000Z'), '2026-10-13');
});
test('fixture démo : 109 événements, tous datés, triés', async () => {
  const c = parseIcs(await fx('fixtures/public/demo.ics').then(r => r.text()));
  eq(c.events.length, 109);
  for (let i = 1; i < c.events.length; i++) ok(c.events[i].start >= c.events[i - 1].start, 'tri');
  ok(c.events.every(e => /^\d{4}-\d\d-\d\dT/.test(e.start)));
});
