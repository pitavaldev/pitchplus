import { test, eq, ok } from './harness.js';
import { maskIcsUrl, isIcsUrl } from '../extension/lib/store.js';

const SECRET = 'A'.repeat(92) + '71B2';
const URL_OK = 'https://planning.icam.fr/Telechargements/ical/Edt_NOM.ics?version=2025.8.10.1&icalsecurise=' + SECRET + '&param=deadbeef';

test('maskIcsUrl : le secret n\'apparaît jamais en entier', () => {
  const m = maskIcsUrl(URL_OK);
  ok(m.indexOf(SECRET) < 0, 'le jeton complet est affiché : ' + m);
  ok(m.indexOf(SECRET.slice(0, 20)) < 0, 'un fragment long du jeton est affiché');
  eq(m, 'https://planning.icam.fr/Telechargements/ical/Edt_NOM.ics?icalsecurise=…71B2');
  eq(maskIcsUrl('pas une url'), '…');
  eq(maskIcsUrl(''), '…');
});

test('isIcsUrl : n\'accepte que le flux Hyperplanning de l\'Icam', () => {
  ok(isIcsUrl(URL_OK), 'lien légitime refusé');
  ok(!isIcsUrl('http://planning.icam.fr/Telechargements/ical/Edt.ics?x=1'), 'http accepté');
  ok(!isIcsUrl('https://ailleurs.example/Telechargements/ical/Edt.ics?x=1'), 'autre hôte accepté');
  ok(!isIcsUrl('https://planning.icam.fr/autre/Edt.ics?x=1'), 'autre chemin accepté');
  ok(!isIcsUrl('https://planning.icam.fr/Telechargements/ical/Edt.ics'), 'sans paramètres accepté');
  ok(!isIcsUrl(''), 'vide accepté');
});
