/* PITCH+ v6 — parseur iCalendar minimal pour le flux Hyperplanning (Index-Éducation).
   Dépliage RFC 5545, échappements, DESCRIPTION structurée (Type / Matière / Enseignant / Salle / Promotion / Mémo). */

const PHASES = {
  'lancement': 'launch', 'phase aller': 'go', 'autonomie': 'self', 'temps expert': 'expert',
  'phase retour - discussion': 'return', 'phase retour - présentation': 'return', 'phase retour': 'return',
  'feedback': 'feedback', 'evaluation': 'eval', 'évaluation': 'eval', 'capitalisation': 'capital'
};
export const PHASE_LABEL = { launch: 'Lancement', go: 'Phase aller', self: 'Autonomie', expert: 'Temps expert', return: 'Phase retour', feedback: 'Feedback', eval: 'Évaluation', capital: 'Capitalisation' };
export const KIND_LABEL = { pbl: 'PBL', expert: 'Temps expert', eval: 'Évaluation', td: 'TD', tp: 'TP', project: 'Projet', other: '' };

export function unfold(text) {
  return String(text).replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '');
}
export function unescapeText(s) {
  return String(s || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\;/g, ';').replace(/\\\\/g, '\\');
}
function props(block) {
  const out = {};
  for (const line of block.split('\n')) {
    const i = line.indexOf(':'); if (i < 0) continue;
    const head = line.slice(0, i), val = line.slice(i + 1);
    const semi = head.indexOf(';');
    const name = (semi < 0 ? head : head.slice(0, semi)).toUpperCase();
    const params = semi < 0 ? '' : head.slice(semi + 1);
    if (!(name in out)) out[name] = { v: val, p: params };
  }
  return out;
}
/** 20261012T154500Z -> ISO ; 20261012 (VALUE=DATE) -> {date:'2026-10-12', allDay:true} */
export function parseDate(v) {
  const m = /^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?$/.exec(String(v || '').trim());
  if (!m) return null;
  if (!m[4]) {   /* pas d'heure : journée entière (VALUE=DATE) */
    return { iso: new Date(Date.UTC(+m[1], m[2] - 1, +m[3], 12)).toISOString(), allDay: true, day: `${m[1]}-${m[2]}-${m[3]}` };
  }
  const d = m[7] ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)))
    : new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));  /* heure locale (flottante) : rare sur ce flux */
  return { iso: d.toISOString(), allDay: false };
}
export function parseDescription(desc) {
  const f = {};
  for (const p of unescapeText(desc).split('\n')) {
    const m = /^\s*([^:]+?)\s*:\s*(.*)$/.exec(p);
    if (m) f[m[1]] = m[2].trim();
  }
  const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
  return {
    type: f['Type'] || '', matiere: f['Matière'] || f['Matiere'] || '',
    teachers: list(f['Enseignants'] || f['Enseignant']), rooms: list(f['Salles'] || f['Salle']),
    promos: list(f['Promotions'] || f['Promotion']), memo: f['Mémo'] || f['Memo'] || '', td: f['TD'] || '',
    raw: f
  };
}
export function classify(fields) {
  const t = (fields.type || '').toLowerCase(), memo = (fields.memo || '').toLowerCase();
  let kind = 'other';
  if (t === 'pbl') kind = 'pbl';
  else if (t === 'temps expert') kind = 'expert';
  else if (t === 'evaluation' || t === 'évaluation') kind = 'eval';
  else if (t === 'td') kind = 'td';
  else if (t === 'tp') kind = 'tp';
  else if (t === 'projets' || t === 'projet') kind = 'project';
  let phase = '';
  for (const k of Object.keys(PHASES)) if (memo.startsWith(k)) { phase = PHASES[k]; break; }
  if (kind === 'pbl' && phase === 'eval') kind = 'eval';
  return { kind, phase };
}

/** @returns {{calname:string, events:Array}} — calname porte la promotion et le campus, seule info exploitée de l'en-tête. */
export function parseIcs(text) {
  const t = unfold(text);
  const firstEvent = t.indexOf('BEGIN:VEVENT');
  const head = props(firstEvent < 0 ? t : t.slice(0, firstEvent));
  const events = [];
  const re = /BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g;
  let m;
  while ((m = re.exec(t))) {
    const p = props(m[1]);
    const ds = parseDate(p.DTSTART && p.DTSTART.v);
    const de = parseDate(p.DTEND && p.DTEND.v);
    if (!ds) continue;
    const summary = unescapeText(p.SUMMARY && p.SUMMARY.v);
    const fields = parseDescription(p.DESCRIPTION ? p.DESCRIPTION.v : '');
    if (!fields.matiere) fields.matiere = summary;  /* repli : Férié, Vacances… */
    const { kind, phase } = classify(fields);
    events.push({
      uid: p.UID ? p.UID.v : (summary + ds.iso), start: ds.iso, end: de ? de.iso : ds.iso, allDay: !!ds.allDay,
      summary, location: unescapeText(p.LOCATION && p.LOCATION.v), fields, kind, phase,
      modified: p['LAST-MODIFIED'] ? p['LAST-MODIFIED'].v : ''
    });
  }
  events.sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
  return { calname: head['X-WR-CALNAME'] ? unescapeText(head['X-WR-CALNAME'].v) : '', events };
}

/* Affichage Europe/Paris, quel que soit le fuseau de l'ordinateur. */
const TZ = 'Europe/Paris';
let LOCALE = 'fr-FR';
export function setLocale(l) { LOCALE = l || 'fr-FR'; }
export function fmtTime(iso) { return new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: TZ }); }
export function fmtDay(iso, opts) { return new Date(iso).toLocaleDateString(LOCALE, Object.assign({ weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ }, opts || {})); }
export function dayKey(iso) {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  return p; /* YYYY-MM-DD */
}
