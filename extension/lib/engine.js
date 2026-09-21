/* PITCH+ v6 — moteur : jointure Hyperplanning × syllabus × PITCH, prochaine chance, jauge 70 %.
   Pur : reçoit dataset, aliases, état PITCH, calendrier parsé, date « maintenant », préférences. */
import { normUnit, unitIndex, isIgnored, resolveUnit, semOfDate, yearFromCalname, semOrder, semYear, SEMESTERS } from './units.js';
import { semNow, baseVerdict } from './pitch.js';

export const CRIT_STATUS = { ok: 'Démontré', planned: 'Séance prévue', later: 'Cours à venir', lost: 'Sans séance', notyet: 'Pas encore enseigné' };
export const AA_VERDICT = {
  req: { label: 'Requalification', ico: '⚠' }, rat: { label: 'Rattrapage', ico: '↻' },
  wait: { label: 'En cours', ico: '' }, soon: { label: 'Pas commencé', ico: '' }, ok: { label: 'Validé', ico: '' }
};

/** Appariement des événements de l'agenda avec les unités du dataset. */
export function matchEvents(cal, dataset, aliases, year, index) {
  index = index || unitIndex(dataset);
  const events = cal.events.map(ev => {
    const code = normUnit(ev.fields.matiere || ev.summary);
    const ignored = isIgnored(code, aliases);
    const sem = semOfDate(new Date(ev.start), year);
    const unit = ignored ? null : resolveUnit(code, sem, aliases, index);
    return Object.assign({}, ev, { code, ignored, unit, sem });
  });
  const byUnit = {};
  events.forEach(e => { if (e.unit) (byUnit[e.unit] = byUnit[e.unit] || []).push(e); });
  const unmatched = {};
  events.filter(e => !e.ignored && !e.unit).forEach(e => { const k = e.code; unmatched[k] = unmatched[k] || { code: k, label: e.fields.matiere || e.summary, n: 0 }; unmatched[k].n++; });
  return { events, byUnit, unmatched: Object.values(unmatched) };
}

/** Semestre courant : année de promotion + date, sinon PITCH (serieMax), sinon rien. */
export function currentSemester({ year, now, pitch }) {
  const fromCal = year ? semOfDate(now, year) : '';
  /* les titres de sous-programmes PITCH (Bp.1 … B3.6) coïncident avec SEMESTERS : on le vérifie au lieu de l'espérer */
  const t = pitch ? semNow(pitch) : null;
  const fromPitch = t && SEMESTERS.indexOf(t) >= 0 ? t : '';
  return { sem: fromCal || fromPitch || '', fromCal, fromPitch };
}

function critsOfUnit(dataset, u) { return (dataset.units[u] && dataset.units[u].eval) || []; }

/**
 * Cœur : statut de chaque critère et prochaine chance.
 * @returns {{crits:Object, events:Array, aas:Array, gauge:Object, chances:Array, diag:Object, curSem:string}}
 */
export function compute({ dataset, aliases, pitch, cal, now, T, curSemOverride, lang }) {
  const en = lang === 'en';
  now = now || new Date();
  const nowIso = now.toISOString();
  const { year, campus } = yearFromCalname(cal ? cal.calname : '');
  const cs = currentSemester({ year, now, pitch });
  const curSem = curSemOverride || cs.sem;
  const curOrder = semOrder(curSem);
  const index = unitIndex(dataset);
  const m = cal ? matchEvents(cal, dataset, aliases, year, index) : { events: [], byUnit: {}, unmatched: [] };

  /* --- critères vus par PITCH --- */
  const pc = {};      /* code -> {status, aa, title, past, future, done} */
  const pitchAAs = (pitch && pitch.aa) || [];
  let pitchCrits = 0, pitchCritsUnknown = 0, sessCodes = 0, sessMatched = 0;
  pitchAAs.forEach(a => {
    if (!a.det) return;
    a.det.crits.forEach(c => {
      pitchCrits++;
      if (!dataset.crits[c.code]) pitchCritsUnknown++;
      /* un critère peut être rattaché à plusieurs AA : on garde le meilleur statut, on cumule les AA */
      const e = pc[c.code] || (pc[c.code] = { status: c.status, title: c.title, past: c.past, future: c.future, done: c.done, aas: [] });
      if (rank(c.status) > rank(e.status)) Object.assign(e, { status: c.status, title: c.title, past: c.past, future: c.future, done: c.done });
      if (e.aas.indexOf(a.code) < 0) e.aas.push(a.code);
      c.sessions.forEach(x => { if (x.code || x.title) { sessCodes++; if (resolveUnit(normUnit(x.code || x.title), '', aliases, index)) sessMatched++; } });
    });
  });
  function rank(st) { return st === 'ok' ? 3 : st === 'fut' ? 2 : 1; }

  /* --- unités : ont-elles encore des séances à venir ? --- */
  const unitFuture = {};   /* code -> {events:[...], open:boolean, sem} */
  Object.keys(dataset.units).forEach(u => {
    const evs = (m.byUnit[u] || []).filter(e => !e.allDay);
    const fut = evs.filter(e => e.start > nowIso);
    const sem = dataset.units[u].sem;
    const so = semOrder(sem);
    /* ouverte = a des séances datées à venir, ou (aucune séance connue et semestre >= courant) */
    const open = fut.length > 0 || (evs.length === 0 && so >= curOrder && so > 0);
    unitFuture[u] = { events: fut, open, sem, so, past: so > 0 && so <= curOrder, allPast: evs.length > 0 && fut.length === 0 };
  });

  /* --- statut par critère --- */
  const crits = {};
  const allCodes = new Set(Object.keys(dataset.crits).concat(Object.keys(pc)));
  allCodes.forEach(code => {
    const d = dataset.crits[code] || { code, label_fr: (pc[code] && pc[code].title) || code, label_en: '', aas: pc[code] ? pc[code].aas : [], eval: [], contrib: [] };
    const p = pc[code];
    const evalUnits = d.eval || [];
    let status, next = null, nextUnits = [];
    const attempted = !!(p && p.past);
    if (p && p.status === 'ok') status = 'ok';
    else {
      /* prochain événement daté dont l'unité évalue ce critère */
      let ev = null;
      evalUnits.forEach(u => { unitFuture[u].events.forEach(e => { if (!ev || e.start < ev.start) ev = e; }); });
      nextUnits = evalUnits.filter(u => unitFuture[u].open && !unitFuture[u].events.length).sort((a, b) => unitFuture[a].so - unitFuture[b].so);
      const taught = attempted || !!(p && p.done) || evalUnits.some(u => unitFuture[u].past);
      if (ev) { status = 'planned'; next = { type: 'event', event: ev, unit: ev.unit }; }
      else if (nextUnits.length) { status = taught || unitFuture[nextUnits[0]].past ? 'later' : 'notyet'; next = { type: 'unit', unit: nextUnits[0], sem: unitFuture[nextUnits[0]].sem }; }
      else if (p && p.status === 'fut') { status = 'later'; next = { type: 'pitch', session: p.future }; }
      else if (!taught && evalUnits.length) { status = 'notyet'; }
      else status = 'lost';
    }
    crits[code] = { code, label: (en ? (d.label_en || d.label_fr) : (d.label_fr || d.label_en)) || (p && p.title) || code, label_en: d.label_en || '', aas: d.aas, evalUnits, contribUnits: d.contrib || [],
                    status, next, attempted, pitch: p ? p.status : null, past: p ? p.past : null, inPitch: !!p,
                    doneSem: p && p.done ? p.done.sem : '' };
  });

  /* --- événements annotés --- */
  const events = m.events.map(e => {
    if (!e.unit) return Object.assign({}, e, { toDemo: [], done: [], contribAAs: [], noCrit: true });
    const list = critsOfUnit(dataset, e.unit);
    const toDemo = list.filter(c => crits[c].status !== 'ok');
    const done = list.filter(c => crits[c].status === 'ok');
    const isNext = toDemo.filter(c => crits[c].next && crits[c].next.type === 'event' && crits[c].next.event.uid === e.uid);
    return Object.assign({}, e, { toDemo, done, isNext, contribAAs: dataset.units[e.unit].contrib_aas || [], noCrit: list.length === 0, past: e.start <= nowIso });
  });

  /* --- AA : verdict v6 --- */
  const aaMap = {};
  const aas = pitchAAs.map(a => {
    const cl = a.det ? a.det.crits.map(c => crits[c.code]).filter(Boolean) : [];
    const base = baseVerdict(a, T);
    let verdict;
    if (base === 'ok') verdict = 'ok';
    else if (!a.det) verdict = base || 'wait';
    else if (cl.some(c => c.status === 'lost')) verdict = 'req';
    else if (cl.some(c => c.attempted && (c.status === 'planned' || c.status === 'later'))) verdict = 'rat';
    else verdict = base || 'wait';
    const ds = dataset.aas[a.code];
    let nextEv = null;
    cl.forEach(c => { const e = c.next && c.next.type === 'event' ? c.next.event : null; if (e && (!nextEv || e.start < nextEv.start)) nextEv = e; });
    const o = Object.assign({}, a, { verdict, critStates: cl, lost: cl.filter(c => c.status === 'lost').length, chance: cl.filter(c => c.status === 'planned' || c.status === 'later').length,
      sem: ds ? ds.sem : '', titleEn: ds ? ds.title_en : '', nextEv });
    aaMap[a.code] = o;
    return o;
  });

  /* --- jauge 70 % ---
     Lecture retenue avec Thomas (sept. 2026) :
     · la barre globale couvre tout le Bachelor (8 semestres), c'est sur elle que porte le seuil de 70 % ;
     · chaque année compte ce qui a été démontré PENDANT cette année ; un critère de B1 réussi en B2 crédite B2,
       et apparaît dans B1 comme « rattrapé depuis », jamais comme démontré ni perdu ;
     · un chiffre de contrôle, le taux sur ce qui a déjà été enseigné, dit si le rythme est tenu. */
  const aaSem = code => { const d = dataset.aas[code]; if (d && d.sem) return d.sem; const p = aaMap[code]; if (p && p.semsT && p.semsT.length) return p.semsT.slice().sort((a, b) => semOrder(b) - semOrder(a))[0]; return ''; };
  const critsOfAA = code => { const d = dataset.aas[code]; if (d && d.crits.length) return d.crits; const p = aaMap[code]; return p && p.det ? p.det.crits.map(c => c.code) : []; };
  const YEARS = uniq(SEMESTERS.map(semYear));
  const curYear = semYear(curSem);
  /* critères attendus par année (année de l'acquis, selon le syllabus) */
  const expected = {}; YEARS.forEach(y => { expected[y] = new Set(); });
  uniq(Object.keys(dataset.aas).concat(Object.keys(aaMap))).forEach(a => {
    const set = expected[semYear(aaSem(a))];
    if (set) critsOfAA(a).forEach(c => { if (crits[c]) set.add(c); });
  });
  /* périmètre du cursus : ce que PITCH connaît pour l'étudiant, sinon ce que le syllabus évalue */
  const cursusCrits = Object.keys(crits).filter(c => pitchAAs.length ? crits[c].inPitch : crits[c].evalUnits.length);
  function tally(codes) {
    const t = { total: codes.length, ok: 0, planned: 0, later: 0, lost: 0, notyet: 0 };
    codes.forEach(c => { t[crits[c].status]++; });
    t.pct = t.total ? Math.round(t.ok / t.total * 1000) / 10 : 0;
    t.best = t.total ? Math.round((t.ok + t.planned + t.later + t.notyet) / t.total * 1000) / 10 : 0;
    return t;
  }
  /* année par année, telle que l'année se présentait à sa fin :
     · ok       : critères attendus en Y démontrés au plus tard en Y (donc aussi ceux démontrés en avance) ;
     · late_ok  : attendus en Y mais démontrés après Y, « rattrapés depuis », en vert clair, hors pourcentage ;
     · recovered: critères d'années antérieures rattrapés PENDANT Y, crédités à Y en texte, pas dans sa barre. */
  const yIdx = y => YEARS.indexOf(y);
  function tallyYear(y) {
    const t = { year: y, order: yIdx(y) + 1, current: y === curYear, future: yIdx(y) > yIdx(curYear), ok: 0, late_ok: 0, planned: 0, later: 0, lost: 0, notyet: 0, recovered: 0 };
    expected[y].forEach(c => {
      const k = crits[c];
      if (k.status !== 'ok') { t[k.status]++; return; }
      const dy = yIdx(semYear(k.doneSem));
      if (dy < 0 || dy <= yIdx(y)) t.ok++; else t.late_ok++;
    });
    YEARS.slice(0, yIdx(y)).forEach(prev => expected[prev].forEach(c => { const k = crits[c]; if (k.status === 'ok' && semYear(k.doneSem) === y) t.recovered++; }));
    t.total = t.ok + t.late_ok + t.planned + t.later + t.lost + t.notyet;
    t.pct = t.total ? Math.round(t.ok / t.total * 1000) / 10 : 0;
    return t;
  }
  /* rythme : sur ce qui a déjà donné lieu à une séance passée */
  const taughtCrits = cursusCrits.filter(c => crits[c].attempted || crits[c].status === 'ok');
  const compOf = c => { const a = (crits[c].aas || [])[0]; const d = dataset.aas[a]; return d ? d.comp : (aaMap[a] ? aaMap[a].bloc : '?'); };
  const byCompCursus = {};
  cursusCrits.forEach(c => { (byCompCursus[compOf(c)] = byCompCursus[compOf(c)] || []).push(c); });
  const gauge = {
    scope: 'cursus', curSem, curYear, threshold: 70,
    cursus: tally(cursusCrits),
    taught: tally(taughtCrits),
    byYear: YEARS.map(tallyYear),
    byComp: Object.keys(dataset.comps).sort().map(cc => Object.assign({ comp: cc, title: dataset.comps[cc].title_fr || dataset.comps[cc].title_en }, tally(byCompCursus[cc] || [])))
  };

  /* --- liste « prochaine chance » --- */
  const chances = Object.values(crits).filter(c => c.status !== 'ok' && c.status !== 'notyet' && (c.inPitch || c.evalUnits.length)).map(c => {
    const aa = c.aas[0] || '';
    const da = dataset.aas[aa] || {};
    return { crit: c, aa, aaTitle: (en ? (da.title_en || da.title_fr) : (da.title_fr || (aaMap[aa] && aaMap[aa].title) || da.title_en)) || (aaMap[aa] && aaMap[aa].title) || aa, comp: compOf(c.code), unit: c.next ? c.next.unit : '',
      when: c.next && c.next.type === 'event' ? c.next.event.start : '', sem: c.next && c.next.type === 'unit' ? c.next.sem : '', status: c.status, urgency: c.status === 'planned' ? 0 : c.status === 'later' ? 1 : 2 };
  }).sort((a, b) => a.urgency - b.urgency || (a.when && b.when ? (a.when < b.when ? -1 : 1) : 0) || semOrder(a.sem) - semOrder(b.sem) || (a.aa < b.aa ? -1 : 1));

  const diag = {
    year, campus, curSem, curSemFromCal: cs.fromCal, curSemFromPitch: cs.fromPitch, events: m.events.length,
    ignored: m.events.filter(e => e.ignored).length, matched: m.events.filter(e => e.unit).length, unmatched: m.unmatched,
    pitchAAs: pitchAAs.length, pitchAAsUnknown: pitchAAs.filter(a => !dataset.aas[a.code]).length, pitchCrits, pitchCritsUnknown,
    sessCodes, sessMatched, datasetCritsNotInPitch: Object.keys(dataset.crits).filter(c => !pc[c]).length,
    dataset: { program: dataset.program, mappingYear: dataset.mappingYear, syllabusYear: dataset.syllabusYear, units: Object.keys(dataset.units).length, crits: Object.keys(dataset.crits).length }
  };
  return { crits, events, aas, aaMap, gauge, chances, diag, curSem, year, unitFuture };
}

function uniq(a) { return [...new Set(a)]; }

/** Compte des verdicts au seuil alternatif (v5). */
export function altCounts(aas, T) {
  const alt = T === 50 ? 100 : 50; let r = 0, t = 0;
  aas.forEach(a => { if (a.pct != null && a.pct >= alt) return; if (a.verdict === 'req') r++; else if (a.verdict === 'rat') t++; });
  return { seuil: alt, req: r, rat: t };
}
