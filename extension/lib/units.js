/* PITCH+ v6 — normalisation des codes d'unité (Hyperplanning -> syllabus).
   Même règle que tools/coverage_report.py : segment avant " - ", majuscules, espaces -> "_", puis table d'alias. */

export const SEMESTERS = ['Bp.1', 'Bp.2', 'B1.1', 'B1.2', 'B2.3', 'B2.4', 'B3.5', 'B3.6'];
/** Année d'un semestre : « B2.3 » -> « B2 ». Dérivé, jamais redéclaré. */
export const semYear = sem => String(sem || '').split('.')[0].toUpperCase();
const YEAR_SEMS = SEMESTERS.reduce((m, s) => { (m[semYear(s)] = m[semYear(s)] || []).push(s); return m; }, {});

export function semOrder(sem) { const i = SEMESTERS.indexOf(sem); return i < 0 ? -1 : i + 1; }

/** Code Hyperplanning normalisé à partir du champ « Matière » (ou du SUMMARY en repli). */
export function normUnit(matiere) {
  const seg = String(matiere || '').split(' - ')[0].trim();
  /* sans accents : « Férié » et « Ferie » donnent le même code, la table n'a pas à lister les variantes */
  return seg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, '_');
}

/** Index majuscules -> code réel du dataset (les codes ont une casse mixte : ESE_EXP5c, CROSS_Challenge…). */
export function unitIndex(dataset) {
  const m = {};
  for (const code of Object.keys(dataset.units || {})) m[code.toUpperCase()] = code;
  return m;
}

export function isIgnored(code, aliases) {
  const pre = (aliases && aliases.ignore && aliases.ignore.prefixes) || [];
  /* le code entier, ou son premier segment : « FORUM_ICAM_ENTREPRISES » oui, une future unité « RIMxx » non */
  return pre.some(p => { const q = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); return code === q || code.startsWith(q + '_'); });
}

/** Résout un code normalisé vers un code d'unité du dataset ; null si non apparié. */
export function resolveUnit(code, sem, aliases, index) {
  let al = aliases && aliases.aliases ? aliases.aliases[code] : null;
  if (al && typeof al === 'object') al = al[sem] || null;
  const c = al || code;
  return index[String(c).toUpperCase()] || null;
}

/** Semestre courant déduit de l'année de promotion (B2) et d'une date. Août→janvier = 1er semestre. */
export function semOfDate(date, yearCode) {
  const n = YEAR_SEMS[semYear(yearCode)];
  if (!n) return '';
  const m = date.getMonth() + 1;
  return (m >= 8 || m === 1) ? n[0] : n[1];
}

/** Année (B2) et campus (LIL) tirés du X-WR-CALNAME. Ne renvoie rien d'autre. */
export function yearFromCalname(cal) {
  /* le campus n'est pas énuméré : il ne sert qu'à l'affichage, et une liste blanche cassait l'année sur un campus inconnu */
  const m = /\b([A-Za-z]{2,10})-(B[P123])\b/i.exec(cal || '');
  return m ? { campus: m[1].toUpperCase(), year: m[2].toUpperCase() } : { campus: '', year: '' };
}
