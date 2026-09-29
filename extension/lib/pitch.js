/* PITCH+ v6 — couche PITCH, portée de PITCH+ v5.3 (load / deepen / analyse / classify).
   Fonctions pures : elles reçoivent un `fetchJson(url)` et renvoient un état sérialisable. Lecture seule. */

const C = 'fr-fr';

/** TraitCode de PITCH = clé composite « RA-…-AA-…-CRIT_0001 ». Le code de critère est le suffixe.
    Vérifié sur compte réel (sept. 2026) : 1221/1221 traits de la forme composite. */
export function critCode(traitCode, ra, aa) {
  const s = String(traitCode || '');
  /* l'appelant connaît le préfixe exact : on le retire plutôt que de deviner */
  if (ra && aa) { const pre = ra + '-' + aa + '-'; if (s.startsWith(pre)) return s.slice(pre.length); }
  const m = /(CRIT[A-Za-z0-9_.-]*)$/i.exec(s);
  return m ? m[1] : s;
}

export function blankState(user) {
  return { user: user || '', prog: null, subs: [], blockList: [], aa: [], byCode: {}, deep: false, serieMax: 0, tl: {}, fetchedAt: null };
}

export function pool(items, n, fn, tick) {
  let i = 0, done = 0; const out = [];
  return new Promise(res => {
    if (!items.length) return res(out);
    function next() {
      if (i >= items.length) return;
      const k = i++;
      Promise.resolve(fn(items[k], k)).then(v => { out[k] = v; done++; if (tick) tick(done, items.length); if (done === items.length) res(out); else next(); },
        () => { out[k] = null; done++; if (tick) tick(done, items.length); if (done === items.length) res(out); else next(); });
    }
    for (let w = 0; w < Math.min(n, items.length); w++) next();
  });
}

/* ---------------- phase 1 : programme, compétences, RA, AA ----------------
   `onAAs` est appelé dès qu'un bloc de compétence est lu, avec les acquis nouvellement connus :
   l'appelant peut lancer la phase 2 sur ces acquis sans attendre la fin de la phase 1. */
export async function loadProgram(S, j, setMsg, onAAs) {
  setMsg && setMsg('Lecture du cursus…', 3);
  const p = await j('/api/Program?culture=' + C);
  if (!p || !p.length) throw new Error('cursus introuvable (es-tu connecté à PITCH ?)');
  S.prog = p[0];
  S.subs = (S.prog.SousPrograms || []).map(s => ({ code: s.Code, title: s.Title, order: parseInt(s.Serie, 10) || 0 })).sort((a, b) => a.order - b.order);
  const base = '&ProgramCode=' + encodeURIComponent(S.prog.ProgramCode) + '&VersionCode=' + encodeURIComponent(S.prog.VersionCode) + '&culture=' + C;
  const bl = await j('/api/SkillBlock?ProgramCode=' + encodeURIComponent(S.prog.ProgramCode) + '&VersionCode=' + encodeURIComponent(S.prog.VersionCode) + '&culture=' + C + '&simpleversion=false');
  S.blockList = (bl || []).map(b => ({ code: b.Code, title: b.Title || b.Code })).filter(b => b.code);
  await pool(S.blockList, 8, b =>
    j('/api/LearningGoal?BlockCode=' + b.code + '&Graph=Bar' + base).then(lgs =>
      pool(lgs || [], 6, lg => j('/api/LearningGoal?BlockCode=' + b.code + '&LGCode=' + encodeURIComponent(lg.LGCode) + '&Graph=Bar' + base)
        .then(los => ({ lg, los: los || [] }))).then(rows => { ingest(S, b.code, rows, onAAs); })),
    (d, t) => setMsg && setMsg('Lecture des compétences… ' + d + '/' + t, 3 + 42 * d / t));
  S.aa.forEach(e => { e.semsT = e.sems.map(c => { const s = S.subs.find(z => z.code === c); return s ? s.title : c; }); });
  S.aa.sort((a, b) => a.code < b.code ? -1 : 1);
  return S;
}

/** Ingestion d'un bloc de compétence : crée les acquis manquants et signale les nouveaux. */
function ingest(S, bloc, rows, onAAs) {
  const fresh = [];
  (rows || []).forEach(r => {
    if (!r) return;
    (r.los || []).forEach(lo => {
      let e = S.byCode[lo.Code];
      if (!e) {
        const p = String(lo.Code).split('-');
        e = { code: lo.Code, title: lo.Title || '', subject: p.length > 2 ? p[1] : '—', bloc: (p[2] && /^C\d/.test(p[2])) ? p[2] : bloc,
              pct: lo.Progress, sems: [], ra: r.lg.LGCode, minPrg: lo.MinPrgPct, minAcq: lo.MinAcqPct, det: null, lost: null, fut: null };
        S.byCode[lo.Code] = e; S.aa.push(e); fresh.push(e);
      }
      if (lo.Progress != null && (e.pct == null || lo.Progress > e.pct)) e.pct = lo.Progress;
      (lo.ProgramList || []).forEach(pl => { if (e.sems.indexOf(pl.ProgramCode) < 0) e.sems.push(pl.ProgramCode); });
    });
  });
  if (fresh.length && onAAs) onAAs(fresh);
}

/* ---------------- phase 2 : détail par critère (locdetail) ---------------- */
/** Lit le détail d'UN acquis. Séparé pour permettre une file d'attente qui démarre pendant la phase 1. */
export function deepenOne(S, j, a) {
  return j('/api/locdetail?ParentProgramCode=' + encodeURIComponent(S.prog.ProgramCode) + '&LGCode=' + encodeURIComponent(a.ra) + '&LOCode=' + encodeURIComponent(a.code) + '&culture=' + C)
    .then(traits => analyse(S, a, traits));
}

/** Rejoue les totaux (semestre courant, tableau par semestre) d'un acquis repris d'un cache,
    avec exactement la même règle que `analyse` : un acquis réutilisé ne doit rien changer à l'état global. */
export function retally(S, a) {
  if (!a.det || !a.det.crits) return;
  a.det.crits.forEach(c => {
    (c.sessions || []).forEach(s => { if (s.st !== 4 && s.group && s.serie > S.serieMax) S.serieMax = s.serie; });
    if (c.done) tl(S, c.done, 'demontres');
    else if (c.past) tl(S, c.past, 'manques');
  });
}

export async function deepen(S, j, onTick, conc) {
  const todo = S.aa.filter(a => !a.det);
  await pool(todo, conc || 6, a => deepenOne(S, j, a), onTick);
  S.deep = true;
  S.fetchedAt = new Date().toISOString();
  return S;
}

/** Statut par critère à partir de CourseList : 1 = démontré, 4 = séance future, autre = passé non démontré. Identique à v5. */
export function analyse(S, a, traits) {
  a.det = { total: 0, ok: 0, crits: [] };
  if (!traits || !traits.length) { a.lost = 0; a.fut = 0; return; }
  let nok = 0;
  traits.forEach(t => {
    const cl = t.CourseList || [];
    cl.forEach(c => {
      if (c.CourseStatus !== 4 && c.GroupCode) { const s = parseInt(c.ProgramSerie, 10) || 0; if (s > S.serieMax) S.serieMax = s; }
    });
    const sess = cl.map(c => ({ st: c.CourseStatus, code: c.CourseCode || '', title: c.Title || '', sem: c.ProgramTitle || '', serie: parseInt(c.ProgramSerie, 10) || 0, group: c.GroupCode || '' }));
    const done = sess.filter(c => c.st === 1);
    const future = sess.filter(c => c.st === 4);
    const past = sess.filter(c => c.st !== 1 && c.st !== 4).sort((x, y) => y.serie - x.serie);
    if (done.length) { nok++; tl(S, done[0], 'demontres'); }
    else if (past.length) tl(S, past[0], 'manques');
    a.det.crits.push({
      code: critCode(t.TraitCode, a.ra, a.code), traitCode: t.TraitCode || '', title: t.TraitTitle || t.TraitCode || '',
      status: done.length ? 'ok' : (future.length ? 'fut' : 'lost'),
      done: done[0] || null, past: past[0] || null, future: future[0] || null, sessions: sess
    });
  });
  a.det.total = traits.length; a.det.ok = nok;
  a.lost = a.det.crits.filter(c => c.status === 'lost').length;
  a.fut = a.det.crits.filter(c => c.status === 'fut').length;
}
function tl(S, c, key) {
  if (!c || !c.sem) return;
  const k = c.sem;
  if (!S.tl[k]) S.tl[k] = { sem: k, annee: (c.group || '').replace(/^Semestre \d+ de l'année /, ''), demontres: 0, manques: 0 };
  S.tl[k][key]++;
}

/** Règles communes aux deux lectures du verdict : validé, pas commencé, en cours.
    Renvoie null quand seule la règle propre à la version (rattrapage / requalification) peut trancher. */
export function baseVerdict(a, T) {
  if (a.pct != null && a.pct >= T) return 'ok';
  if (a.pct == null || (a.det && a.det.ok === 0)) return 'soon';
  return null;
}

/** Verdict v5 (PITCH seul) : ok / rat / req / soon / wait. Conservé pour l'équivalence et le mode dégradé. */
export function classifyV5(S, T) {
  const ser = {}; S.subs.forEach(s => { ser[s.code] = s.order; });
  S.aa.forEach(a => {
    const base = baseVerdict(a, T);
    if (base === 'ok') { a.verdict = 'ok'; return; }
    if (a.lost > 0) {
      const last = Math.max(0, ...a.sems.map(c => ser[c] || 0));
      a.verdict = last > S.serieMax ? 'rat' : 'req';   /* l'acquis est-il encore enseigné après le semestre courant ? */
      return;
    }
    a.verdict = base || 'wait';
  });
}

export function semNow(S) { const s = S.subs.find(z => z.order === S.serieMax + 1); return s ? s.title : null; }
