/* PITCH+ v6.0 — tableau de bord. Par Thomas Pitaval. Lecture seule, tout reste dans le navigateur. */
import { parseIcs, fmtTime, fmtDay, dayKey, setLocale, PHASE_LABEL, KIND_LABEL } from '../lib/ics.js';
import { blankState, loadProgram, deepen, classifyV5 } from '../lib/pitch.js';
import { compute, AA_VERDICT, CRIT_STATUS } from '../lib/engine.js';
import { store, K, maskIcsUrl, isIcsUrl } from '../lib/store.js';
import { SEMESTERS, semOrder } from '../lib/units.js';

const FR2EN = {"Accueil": "Home", "PITCH non lu": "PITCH not read", " · agenda ": " · timetable ", " séances": " sessions", " · sans agenda": " · no timetable", "Relire PITCH et l'agenda": "Reload PITCH and the timetable", "Actualiser": "Refresh", "Autres actions": "More actions", "Relire l'agenda": "Reload the timetable", "Exporter en CSV": "Export as CSV", "Imprimer": "Print", "Réglages": "Settings", "Aujourd'hui": "Today", "Agenda": "Timetable", "Prochaine chance": "Next chance", "Trajectoire 70 %": "70 % track", "Compas": "Compass", "Plus": "More", "Acquis par compétence": "Learning outcomes by skill", "Changements": "Changes", "Diagnostic": "Diagnostics", "PITCH n'a pas été lu : agenda seul, sans état des critères.": "PITCH was not read: timetable only, no criteria status.", "aucun syllabus pour le programme ": "no syllabus for programme ", " : mode dégradé": ": degraded mode", "Prochaine séance utile : <b>": "Next useful session: <b>", " à démontrer": " to demonstrate", "Aucune séance à venir avec un critère à démontrer.": "No upcoming session with a criterion to demonstrate.", "Ajoute ton lien Hyperplanning dans les réglages pour voir ton agenda.": "Add your Hyperplanning link in Settings to see your timetable.", "Voir les critères": "See the criteria", "requalification": "requalification", "requalifications": "requalifications", "nouveauté": "update", "nouveautés": "updates", "PITCH+ v": "PITCH+ v", " — outil étudiant open source par Thomas Pitaval": " — open-source student tool by Thomas Pitaval", "Lecture seule · rien ne quitte ton navigateur": "Read-only · nothing leaves your browser", "Syllabus ": "Syllabus ", " · mapping ": " · mapping ", "Démontré": "Demonstrated", "Séance prévue": "Session scheduled", "Cours à venir": "Course to come", "Sans séance": "No session", "Pas encore enseigné": "Not taught yet", "Requalification": "Requalification", "Rattrapage": "Catch-up", "En cours": "In progress", "Pas commencé": "Not started", "Validé": "Validated", "Inscrit": "Signed up", "Mail envoyé": "Email sent", "Fait, à vérifier": "Done, to check", "Lancement": "Kick-off", "Phase aller": "Go phase", "Autonomie": "Self-study", "Temps expert": "Expert time", "Phase retour": "Return phase", "Feedback": "Feedback", "Évaluation": "Assessment", "Capitalisation": "Wrap-up", "PBL": "PBL", "TD": "Tutorial", "TP": "Lab", "Projet": "Project", "TE": "Exam", "critère": "criterion", "critères": "criteria", "séance": "session", "séances": "sessions", "acquis": "learning outcome", "cours": "course", "compétence": "skill", "Aucune séance connue : ni agenda, ni syllabus, ni PITCH": "No known session: not in the timetable, the syllabus or PITCH", " (sans date)": " (no date)", "Séance à venir selon PITCH": "Upcoming session according to PITCH", "déjà tenté": "already attempted", "Qu'est-ce qui arrive ?": "What is coming up?", " où démontrer": " where you can demonstrate", "Prochaines séances": "Next sessions", "Aucune séance à venir dans l'agenda.": "No upcoming session in the timetable.", "Ajoute ton lien Hyperplanning dans les réglages.": "Add your Hyperplanning link in Settings.", "Voir l'agenda →": "See the timetable →", "Où est ma prochaine chance ?": "Where is my next chance?", "critères sans séance": "criteria with no session", "critère sans séance": "criterion with no session", " prévus": " scheduled", " à venir": " to come", " sans séance": " with no session", "Voir les critères sans séance →": "See criteria with no session →", "Voir par séance →": "See by session →", "Suis-je sur la trajectoire ?": "Am I on track?", "seuil 70 %": "70 % threshold", "sur ce qui a déjà été enseigné": "of what has already been taught", "Détail par compétence →": "Detail by skill →", "</b> démontrés</li>": "</b> demonstrated</li>", "</b> prévus</li>": "</b> scheduled</li>", "</b> à venir</li>": "</b> to come</li>", "</b> pas encore enseignés</li>": "</b> not taught yet</li>", "</b>' + t(' sans séance') + '</li></ul>": "</b> no session</li></ul>", "démontrés dans l'année": "demonstrated that year", "rattrapés depuis": "caught up since", "datés": "scheduled", "à venir": "to come", "pas encore enseignés": "not taught yet", "sans séance": "no session", "prévus": "scheduled", "démontrés": "demonstrated", "Pas d'agenda.": "No timetable.", "5 j": "5 d", "7 j": "7 d", "Seulement où j'ai à démontrer · ": "Only where I have something to demonstrate · ", "journée": "all day", "hors compétences": "outside the skills framework", "pas dans le syllabus": "not in the syllabus", "aucun critère": "no criterion", "tout est démontré": "all demonstrated", "Daté": "Scheduled", "↻ Cours à venir": "↻ Course to come", "⚠ Sans séance": "⚠ No session", "Par séance": "By session", "Par cours": "By course", "Par compétence": "By skill", "Tout en liste": "Flat list", "Rechercher un critère, un cours…": "Search a criterion, a course…", "Rien ici.": "Nothing here.", "Tout est démontré, ou pas encore enseigné.": "Everything is demonstrated, or not taught yet.", "Sans compétence": "No skill", "Séance annoncée par PITCH": "Session announced by PITCH", "prochaine séance ": "next session ", "sans date": "no date", "selon PITCH": "according to PITCH", "aucune date connue": "no known date", "ni dans ton agenda, ni dans le syllabus, ni annoncée par PITCH": "not in your timetable, the syllabus, or announced by PITCH", "<p class=\"sub mut sm-t\">Une ligne par séance à venir : ce qu'il y a à démontrer ce jour-là. En bas, ce qui n'a plus aucune séance.</p>": "<p class=\"sub mut sm-t\">One line per upcoming session: what there is to demonstrate that day. At the bottom, what has no session left.</p>", "aucune séance": "no session", "Bachelor · 8 semestres": "Bachelor · 8 semesters", " % démontrés · seuil 70 %": " % demonstrated · 70 % threshold", "critères à démontrer pour atteindre 70 % du cursus": "criteria to demonstrate to reach 70 % of the programme", "si tu démontres tout ce qui est planifié": "if you demonstrate everything that is scheduled", "Année par année": "Year by year", "Chaque année telle qu'elle se présentait à sa fin. Un critère rattrapé plus tard reste en vert clair dans son année d'origine.": "Each year as it stood at its end. A criterion caught up later stays light green in its original year.", " rattrapé": " caught up", " depuis": " since", "+": "+", " d'années passées rattrapé": " from past years caught up", " cette année-là": " that year", "Un mot du critère, un acquis, un cours, un code…": "A word from the criterion, an outcome, a course, a code…", "Toutes les compétences": "All skills", "Tous les semestres": "All semesters", "Tous les domaines": "All domains", "Tous mes états": "All my statuses", "Critères": "Criteria", "Acquis": "Outcomes", "Cours": "Courses", "Effacer ×": "Clear ×", "Rien ne correspond.": "Nothing matches.", "Essaie un autre mot ou retire un filtre.": "Try another word or remove a filter.", "Afficher plus · ": "Show more · ", " restants": " left", ", dont ": ", including ", " dans ta recherche": " in your search", "pas dans ton PITCH": "not in your PITCH", "évalué par ": "assessed in ", "aucun cours ne l'évalue": "no course assesses it", "Électronique": "Electronics", "Énergétique": "Energy", "Mécanique, matériaux": "Mechanics, materials", "Maths, informatique": "Maths, computing", "Management": "Management", "Humanités, langues": "Humanities, languages", "Développement personnel": "Personal development", " · syllabus ": " · syllabus ", "Un <b>acquis</b> regroupe plusieurs critères. Il est validé dès que <b>": "A <b>learning outcome</b> groups several criteria. It is validated once <b>", " %</b> d'entre eux sont démontrés.": " %</b> of them are demonstrated.", "⚠ Requalifications (": "⚠ Requalifications (", "↻ Rattrapages (": "↻ Catch-ups (", "Les deux (": "Both (", "En cours (": "In progress (", "Pas commencé (": "Not started (", "Validés (": "Validated (", "Mes suivis": "My follow-ups", "Rechercher un acquis…": "Search a learning outcome…", "Tous les statuts": "All statuses", "Toutes les matières": "All subjects", "Retirer les filtres ×": "Remove filters ×", "Essaie un autre filtre.": "Try another filter.", " rattrapable": " recoverable", "Pas de détail PITCH.": "No PITCH detail.", " critères démontrés sur ": " criteria demonstrated out of ", "Mon suivi": "My follow-up", "Note personnelle, enregistrée sur cet ordinateur": "Personal note, stored on this computer", "Rien de neuf": "Nothing new", " depuis le ": " since ", "Aucun critère n'a bougé à la dernière lecture de PITCH.": "No criterion changed at the last PITCH read.", "Premier passage : le repère vient d'être posé.": "First visit: the baseline has just been set.", "Reposer le repère à aujourd'hui": "Reset the baseline to today", "Comparaison avec la lecture PITCH précédente, le ": "Compared with the previous PITCH read, on ", ". Repère enregistré sur cet ordinateur uniquement.": ". Baseline stored on this computer only.", "Critères démontrés depuis": "Criteria demonstrated since", "Acquis passés à validé": "Outcomes now validated", "Acquis en progrès": "Outcomes in progress", "Critères passés sans séance": "Criteria now without session", "Évaluation (TE)": "Assessment (exam)", "Séance": "Session", "Moodle ↗": "Moodle ↗", "Hors compétences : rien à démontrer ici.": "Outside the skills framework: nothing to demonstrate here.", "Cours absent du syllabus embarqué (": "Course missing from the bundled syllabus (", " ). Voir Diagnostic.": "). See Diagnostics.", "À démontrer ici · ": "To demonstrate here · ", "Déjà démontrés · ": "Already demonstrated · ", "Contribue à · ": "Contributes to · ", " · contribue sans évaluer": " · contributes without assessing", "Aucun critère rattaché à ce cours dans le syllabus.": "No criterion attached to this course in the syllabus.", "À démontrer · ": "To demonstrate · ", "Cours qui l'évaluent · ": "Courses assessing it · ", " à venir, la prochaine ": " to come, the next one ", "séances terminées": "sessions over", "pas encore dans l'agenda": "not yet in the timetable", "semestre passé": "past semester", "Aucun cours ne l'évalue dans le syllabus": "No course assesses it in the syllabus", "Contribue sans évaluer : ": "Contributes without assessing: ", "Codes PITCH": "PITCH codes", "Historique PITCH": "PITCH history", "démontré": "demonstrated", "séance à venir": "upcoming session", "non démontré": "not demonstrated", "Non encore vu dans PITCH.": "Not seen in PITCH yet.", "Fermer": "Close", "Langue": "Language", "Interface et intitulés du syllabus. Les titres d'acquis viennent de PITCH en français, du syllabus en anglais.": "Interface and syllabus titles. Outcome titles come from PITCH in French, from the syllabus in English.", "Agenda Hyperplanning": "Hyperplanning timetable", "Enregistrer": "Save", "Relire maintenant": "Reload now", "Retirer le lien": "Remove the link", "Relire PITCH": "Reload PITCH", "Vider le cache local": "Clear the local cache", "Données personnelles": "Personal data", "Tout effacer (agenda, cache PITCH, notes)": "Erase everything (timetable, PITCH cache, notes)", "Démo": "Demo", "À propos": "About", "Connecte-toi à PITCH dans l'onglet ouvert, puis reviens ici.": "Sign in to PITCH in the open tab, then come back here.", "Ouvrir PITCH": "Open PITCH", "J'ai fini, relire": "Done, reload", "Agenda seul": "Timetable only", "Aucun mot de passe n'est demandé : PITCH+ utilise la session déjà ouverte.": "No password is asked for: PITCH+ uses the session already open.", "Rien ne quitte ton navigateur : pas de compte, pas de serveur, pas de mot de passe. PITCH n'est jamais modifié. La seule requête réseau est la lecture de ton flux Hyperplanning.": "Nothing leaves your browser: no account, no server, no password. PITCH is never modified. The only network request is reading your Hyperplanning feed.", "Mode démo : PITCH fictif.": "Demo mode: fictional PITCH.", "Mode démo : agenda fictif.": "Demo mode: fictional timetable.", "Agenda ↔ syllabus": "Timetable ↔ syllabus", "PITCH ↔ syllabus": "PITCH ↔ syllabus", "Jeu de données embarqué": "Bundled dataset", "Séances lues": "Sessions read", "Hors compétences": "Outside the framework", "Appariées": "Matched", "Non appariées": "Unmatched", "démo": "demo", "Aucun lien enregistré. Le flux est relu automatiquement chaque jour.": "No link saved. The feed is re-read automatically every day.", "Ouvrir le mode démo": "Open demo mode", "(étudiant fictif, données générées).": "(fictional student, generated data).", "Lien enregistré : ": "Saved link: ", " · lu le ": " · read on ", "Dans Hyperplanning : <b>Exporter → Lien d'abonnement iCal</b>, puis colle le lien ici. Il contient une clé secrète : il reste sur cet ordinateur et n'est jamais affiché en entier.": "In Hyperplanning: <b>Export → iCal subscription link</b>, then paste the link here. It contains a secret key: it stays on this computer and is never shown in full.", "Lu via ton onglet PITCH déjà connecté (pitch-icam.rima1.fr).": "Read through your already signed-in PITCH tab (pitch-icam.rima1.fr).", " Dernière lecture : ": " Last read: ", " · Thomas Pitaval, Icam Lille, Bachelor International promo 2030 · open source · ": " · Thomas Pitaval, Icam Lille, International Bachelor class of 2030 · open source · ", "Outil étudiant non officiel, sans lien avec l'éditeur de PITCH ni avec l'Icam.": "Unofficial student tool, unrelated to the PITCH publisher or Icam."};
/** Texte d'interface dans la langue choisie ; le français est la clé. */
const t = s => (S.lang === 'en' && FR2EN[s] !== undefined) ? FR2EN[s] : s;
export const VER = '1.7.3.2';
const isExt = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
const qs = new URLSearchParams(location.search);
const DEMO = qs.get('demo') === '1';
const DEMO_NOW = '2026-10-15T08:00:00Z';
const root = document.getElementById('app');
const TAGS = { plan: 'Inscrit', mail: 'Mail envoyé', done: 'Fait, à vérifier' };
const COL = { ok: '#2e7d32', planned: '#1a73e8', later: '#F39200', lost: '#b03306', notyet: 'url(#ph)', req: '#b03306', rat: '#F39200', wait: '#bdc1c6', soon: '#f1f3f4' };
const COMPASS = '<svg class="ico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.8 5.2 9.1 9.1 5.2 10.8 6.9 6.9z" fill="currentColor"/></svg>';
const HATCH = '<defs><pattern id="ph" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#dcdcdc" stroke-width="1"/></pattern></defs>';

const S = {
  dataset: null, aliases: null, pitch: null, cal: null, R: null, T: 50, lang: 'fr', prefs: {}, notes: {}, snap: null, diff: null,
  view: 'home', demo: DEMO, now: DEMO ? new Date(DEMO_NOW) : new Date(), icsUrl: '', icsAt: '', icsErr: '', msg: '', err: null, busy: false,
  panel: null, week: 0, open: {}, f: { q: '', st: '', sem: '', subj: '', bloc: '', only: false, grp: 'seance', cst: '', wk7: false, cq: '', k: { q: '', comp: '', sem: '', st: '', dom: '', lvl: 'crit', max: 60 } }, toast: ''
};

/* ---------------- utilitaires ---------------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const uniq = a => a.filter((v, i, x) => x.indexOf(v) === i);
const url = rel => isExt ? chrome.runtime.getURL(rel) : '../' + rel;
const loadJson = rel => fetch(url(rel)).then(r => r.json());
const loadText = rel => fetch(url(rel)).then(r => r.text());
const plural = (n, s, p) => n + ' ' + ((S.lang === 'en' ? n !== 1 : n > 1) ? t(p || s + 's') : t(s));
const LOC = () => S.lang === 'en' ? 'en-GB' : 'fr-FR';
function fdate(iso) { try { return new Date(iso).toLocaleDateString(LOC(), { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }); } catch (e) { return iso; } }
function fwhen(iso) { return fmtDay(iso, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + fmtTime(iso); }
function setMsg(t, p) { S.msg = t; const m = document.getElementById('msg'), b = document.getElementById('bar'); if (m) m.textContent = t; if (b && p != null) b.style.width = p + '%'; }
function toast(t) { S.toast = t; render(); setTimeout(() => { if (S.toast === t) { S.toast = ''; render(); } }, 2600); }
const unitOf = c => S.dataset.units[c];
/** Intitulé dans la langue choisie : l'autre langue en repli, le code en dernier recours. */
const pick = (o, base) => S.lang === 'en' ? (o[base + '_en'] || o[base + '_fr'] || '') : (o[base + '_fr'] || o[base + '_en'] || '');
const unitTitle = c => { const u = unitOf(c); return u ? (pick(u, 'title') || c) : c; };
const aaOf = c => S.dataset.aas[c];
const aaTitle = c => { const a = aaOf(c); const p = S.R && S.R.aaMap[c]; if (S.lang === 'en') return (a && a.title_en) || (a && a.title_fr) || (p && p.title) || c; return (p && p.title) || (a && (a.title_fr || a.title_en)) || c; };
const compOfAA = c => { const a = aaOf(c); return a ? a.comp : ((S.R && S.R.aaMap[c] && S.R.aaMap[c].bloc) || ''); };
const critLabel = c => (S.R.crits[c] && S.R.crits[c].label) || c;
const evTitle = e => e.unit ? e.unit + ' · ' + unitTitle(e.unit) : (e.fields.matiere || e.summary);

/* ---------------- chargement ---------------- */
async function boot() {
  try {
    const st = await store.get([K.PREFS, K.NOTES, K.SNAP, K.ICS_URL, K.ICS_TEXT, K.ICS_AT, K.ICS_ERR, K.PITCH, 'lastDiff']);
    S.prefs = st[K.PREFS] || {}; S.notes = st[K.NOTES] || {}; S.snap = st[K.SNAP] || null; S.diff = st.lastDiff || null;
    S.lang = S.prefs.lang === 'en' ? 'en' : 'fr';
    setLocale(S.lang === 'en' ? 'en-GB' : 'fr-FR');
    document.documentElement.lang = S.lang;
    S.icsUrl = st[K.ICS_URL] || ''; S.icsAt = st[K.ICS_AT] || ''; S.icsErr = st[K.ICS_ERR] || '';
    S.aliases = await loadJson('data/aliases.json');
    const idx = await loadJson('data/index.json');
    setMsg('Lecture du syllabus…', 10);
    if (S.demo) {
      S.dataset = await loadJson('data/' + idx.datasets[0].file);
      S.cal = parseIcs(await loadText('demo/demo.ics'));
      const fx = await loadJson('demo/pitch-demo.json');
      S.pitch = blankState('demo@2030.icam.fr');
      await loadProgram(S.pitch, p => Promise.resolve(fx[p] || null), setMsg);
      await deepen(S.pitch, p => Promise.resolve(fx[p] || null), (d, t) => setMsg('Analyse des critères… ' + d + '/' + t, 45 + 55 * d / t));
      finish(); return;
    }
    if (st[K.ICS_TEXT]) { try { S.cal = parseIcs(st[K.ICS_TEXT]); } catch (e) { S.icsErr = 'flux illisible : ' + e.message; } }
    S.pitch = st[K.PITCH] || null;
    const prog = (S.pitch && S.pitch.prog && S.pitch.prog.ProgramCode) || 'BI';
    const ds = idx.datasets.find(d => d.program === prog) || null;
    S.dataset = ds ? await loadJson('data/' + ds.file) : emptyDataset(prog);
    if (!S.pitch) { await refreshPitch(true); return; }
    finish();
  } catch (e) { fail(e); }
}
function emptyDataset(prog) { return { program: prog, mappingYear: '', syllabusYear: '', semesters: SEMESTERS, comps: {}, ras: {}, aas: {}, crits: {}, units: {}, degraded: true }; }
function finish() {
  recompute();
  if (!S.view || S.view === 'boot') S.view = 'home';
  if (location.hash === '#reglages') S.view = 'set';
  render();
}
function recompute() {
  if (!S.dataset) return;
  S.R = compute({ dataset: S.dataset, aliases: S.aliases, pitch: S.pitch, cal: S.cal, now: S.now, T: S.T, lang: S.lang });
  if (S.pitch) classifyV5(S.pitch, S.T);
}
function fail(e) {
  S.err = e; root.innerHTML = '<div class="load"><div class="lg">PITCH</div><div class="ls err">Impossible de démarrer.<br><small>' + esc(e && e.message) + '</small></div><button data-act="reload">Réessayer</button></div>';
}

/* ---- PITCH via l'onglet pitch-icam (content script) ---- */
async function getPitchTab(create) {
  const tabs = await chrome.tabs.query({ url: 'https://pitch-icam.rima1.fr/*' });
  let tab = tabs[0];
  if (!tab && create) {
    tab = await chrome.tabs.create({ url: 'https://pitch-icam.rima1.fr/', active: false });
    await new Promise(res => { const h = (id, info) => { if (id === tab.id && info.status === 'complete') { chrome.tabs.onUpdated.removeListener(h); res(); } }; chrome.tabs.onUpdated.addListener(h); setTimeout(() => { chrome.tabs.onUpdated.removeListener(h); res(); }, 15000); });
  }
  if (!tab) return null;
  let ok = false;
  try { const r = await chrome.tabs.sendMessage(tab.id, { type: 'ping' }); ok = !!(r && r.ok); } catch (e) { ok = false; }
  if (!ok) { try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/pitch.js'] }); } catch (e) { } }
  return tab;
}
function makeJ(tabId) {
  return path => chrome.tabs.sendMessage(tabId, { type: 'fetch', path }).then(r => {
    if (r && r.ok) return r.data;
    if (r && r.auth) { const e = new Error('auth'); e.auth = true; throw e; }
    return null;
  }, () => null);
}
async function refreshPitch(first) {
  if (S.busy) return; S.busy = true;
  if (!isExt) { S.busy = false; if (!S.R) finish(); else toast('Hors extension : PITCH ne peut pas être lu.'); return; }
  const prev = S.pitch;
  try {
    root.innerHTML = '<div class="load"><div class="lg">PITCH</div><div class="lb"><i id="bar"></i></div><div class="ls" id="msg">Ouverture de PITCH…</div></div>';
    const tab = await getPitchTab(true);
    if (!tab) throw new Error('onglet PITCH introuvable');
    const j = makeJ(tab.id);
    const st = blankState('');
    try { const r = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: () => (typeof UserId !== 'undefined' && UserId) ? String(UserId) : '' }); st.user = (r && r[0] && r[0].result) || ''; } catch (e) { }
    await loadProgram(st, j, setMsg);
    await deepen(st, j, (d, t) => setMsg('Analyse des critères… ' + d + '/' + t, 45 + 55 * d / t));
    if (!st.user) st.user = 'étudiant';
    S.pitch = st;
    const prog = st.prog.ProgramCode;
    if (!S.dataset || S.dataset.program !== prog) {
      const idx = await loadJson('data/index.json'); const ds = idx.datasets.find(d => d.program === prog);
      S.dataset = ds ? await loadJson('data/' + ds.file) : emptyDataset(prog);
    }
    recompute();
    takeSnapshot();
    await store.set({ [K.PITCH]: st });
    S.busy = false; finish();
  } catch (e) {
    S.busy = false; S.pitch = prev;
    if (e && e.auth) { S.view = 'auth'; S.R = null; if (prev) { recompute(); } render(); return; }
    if (first && !prev) { S.view = 'auth'; S.authErr = e && e.message; render(); return; }
    recompute(); render(); toast('PITCH : ' + (e && e.message));
  }
}
async function refreshIcs(urlNew) {
  if (!isExt) return;
  S.busy = true; render();
  const r = await chrome.runtime.sendMessage(urlNew ? { type: 'ics:set', url: urlNew } : { type: 'ics:refresh' });
  const st = await store.get([K.ICS_URL, K.ICS_TEXT, K.ICS_AT, K.ICS_ERR]);
  S.icsUrl = st[K.ICS_URL] || ''; S.icsAt = st[K.ICS_AT] || ''; S.icsErr = st[K.ICS_ERR] || '';
  if (st[K.ICS_TEXT]) { try { S.cal = parseIcs(st[K.ICS_TEXT]); } catch (e) { S.icsErr = 'flux illisible : ' + e.message; } }
  S.busy = false; recompute(); render();
  toast(r && r.ok ? 'Agenda à jour · ' + S.cal.events.length + t(' séances') : 'Agenda : ' + (r && r.error === 'bad-url' ? 'lien non reconnu' : r && r.error === 'no-url' ? 'aucun lien' : (r && r.error) || 'erreur'));
}

/* ---- repère (diff depuis la dernière visite) ---- */
function snapMap() {
  const m = { aa: {}, crits: {} };
  (S.R.aas || []).forEach(a => { m.aa[a.code] = { p: a.pct, l: a.lost, o: a.det ? a.det.ok : null, v: a.verdict }; });
  Object.values(S.R.crits).forEach(c => { if (c.inPitch) m.crits[c.code] = c.pitch === 'ok' ? 1 : 0; });
  return m;
}
function takeSnapshot() {
  const cur = snapMap(), prev = S.snap;
  if (prev && prev.aa) {
    const d = { date: prev.date, valides: [], gagnes: [], perdus: [], critsOk: [] };
    S.R.aas.forEach(a => {
      const o = prev.aa[a.code]; if (!o) return;
      if (o.v !== 'ok' && a.verdict === 'ok') d.valides.push(a.code);
      else if (o.o != null && a.det && a.det.ok > o.o) d.gagnes.push({ aa: a.code, n: a.det.ok - o.o });
      if (o.l != null && a.lost != null && a.lost > o.l) d.perdus.push({ aa: a.code, n: a.lost - o.l });
    });
    Object.keys(cur.crits).forEach(c => { if (prev.crits && prev.crits[c] === 0 && cur.crits[c] === 1) d.critsOk.push(c); });
    S.diff = (d.valides.length || d.gagnes.length || d.perdus.length || d.critsOk.length) ? d : null;
  }
  S.snap = Object.assign({ date: new Date().toISOString() }, cur);
  store.set({ [K.SNAP]: S.snap, lastDiff: S.diff });
}

/* ---------------- rendu ---------------- */
function render() {
  if (S.view === 'auth') { root.innerHTML = viewAuth(); return; }
  if (!S.R) { root.innerHTML = '<div class="load"><div class="lg">PITCH</div><div class="lb"><i id="bar"></i></div><div class="ls" id="msg">' + esc(S.msg || 'Chargement…') + '</div></div>'; return; }
  const V = { home: viewHome, agenda: viewAgenda, chances: viewChances, traj: viewTraj, compas: viewCompas, acquis: viewAcquis, chg: viewChg, diag: viewDiag, set: viewSet };
  root.innerHTML = header() + banner() + nav() + '<div class="body">' + (V[S.view] || viewHome)() + '</div>' + footer() + (S.panel ? panel() : '') + (S.toast ? '<div class="toast">' + esc(S.toast) + '</div>' : '');
  const q = root.querySelector('[data-focus]'); if (q) { q.focus(); const p = q.value.length; try { q.setSelectionRange(p, p); } catch (e) { } }
}
function header() {
  const p = S.pitch, R = S.R;
  const item = (act, lab, extra) => '<button data-act="' + act + '"' + (extra || '') + '>' + lab + '</button>';
  return '<header><button class="lgm" data-act="view" data-v="home" title="Accueil">PITCH<i>+</i><u>by thomas · v' + VER + (S.demo ? ' · ' + t('démo') : '') + '</u></button>' +
    '<span class="who">' + esc(p ? p.user : t('PITCH non lu')) + '<s>' + esc(p && p.prog ? p.prog.Title || p.prog.ProgramCode : '') + (R.curSem ? ' · ' + esc(R.curSem) : '') + (S.cal ? t(' · agenda ') + S.cal.events.length + t(' séances') : t(' · sans agenda')) + '</s></span>' +
    '<span class="acts">' +
    (S.demo ? '' : '<button data-act="refresh-pitch" class="x" title="Relire PITCH et l\'agenda">' + t('Actualiser') + '</button>') +
    '<details class="more"><summary title="Autres actions">⋯</summary><div class="menu">' +
    (S.demo ? '' : item('refresh-ics', t('Relire l\'agenda'))) +
    item('csv', t('Exporter en CSV')) + item('print', t('Imprimer')) +
    '<hr>' + item('view', t('Réglages'), ' data-v="set"') +
    '</div></details></span></header>';
}
function nav() {
  const R = S.R;
  const lost = R.chances.filter(c => c.status === 'lost').length;
  const nreq = R.aas.filter(a => a.verdict === 'req').length, nrat = R.aas.filter(a => a.verdict === 'rat').length;
  const tb = (v, l, n, cls) => '<button class="tbn' + (S.view === v ? ' on' : '') + '" data-act="view" data-v="' + v + '">' + l + (n ? '<span class="n ' + (cls || '') + '">' + n + '</span>' : '') + '</button>';
  const SECOND = ['acquis', 'chg', 'diag', 'set'];
  const sub = (v, l, n, cls) => '<button data-act="view" data-v="' + v + '">' + l + (n ? ' <span class="n ' + (cls || '') + '">' + n + '</span>' : '') + '</button>';
  return '<nav class="tabs">' + tb('home', t('Aujourd\'hui')) + tb('agenda', t('Agenda')) + tb('chances', t('Prochaine chance'), lost, 'req') + tb('traj', t('Trajectoire 70 %')) + tb('compas', COMPASS + t('Compas')) +
    '<details class="more"><summary class="tbn' + (SECOND.indexOf(S.view) >= 0 ? ' on' : '') + '">Plus</summary><div class="menu">' +
    sub('acquis', t('Acquis par compétence'), nreq + nrat, nreq ? 'req' : 'rat') +
    sub('chg', t('Changements'), S.diff ? '•' : 0) +
    sub('diag', t('Diagnostic'), R.diag.unmatched.length, 'rat') +
    '<hr>' + sub('set', t('Réglages')) +
    '</div></details></nav>';
}
function banner() {
  const R = S.R;
  const alerts = [];
  if (!S.pitch) alerts.push('<span class="warn">' + t('PITCH n\'a pas été lu : agenda seul, sans état des critères.') + '</span>');
  if (S.dataset.degraded) alerts.push('<span class="warn">' + t('aucun syllabus pour le programme ') + esc(S.dataset.program) + t(' : mode dégradé') + '</span>');
  const next = R.events.filter(e => !e.past && e.toDemo.length)[0];
  const lead = next
    ? t('Prochaine séance utile : <b>') + esc(fwhen(next.start)) + '</b> · ' + esc(next.unit) + ' · ' + plural(next.toDemo.length, 'critère') + t(' à démontrer')
    : (S.cal ? t('Aucune séance à venir avec un critère à démontrer.') : t('Ajoute ton lien Hyperplanning dans les réglages pour voir ton agenda.'));
  const nreq = R.aas.filter(a => a.verdict === 'req').length;
  const nNew = S.diff ? (S.diff.critsOk.length + S.diff.valides.length) : 0;
  return '<div class="banner"><span class="lead">' + lead + '</span>' +
    (next ? '<button class="chip chip--planned" data-act="ev" data-uid="' + esc(next.uid) + '">' + t('Voir les critères') + '</button>' + (S.dataset.units[next.unit] && S.dataset.units[next.unit].moodle ? '<a class="chip chip--md" href="' + esc(S.dataset.units[next.unit].moodle) + '" target="_blank" rel="noopener">Moodle ↗</a>' : '') : '') +
    (nreq ? '<button class="chip chip--req" data-act="goto" data-v="acquis" data-st="req">⚠ ' + plural(nreq, 'requalification') + '</button>' : '') +
    (nNew ? '<button class="chip chip--ok" data-act="view" data-v="chg">' + plural(nNew, 'nouveauté', 'nouveautés') + '</button>' : '') +
    (alerts.length ? '<span class="alt">' + alerts.join(' · ') + '</span>' : '') + '</div>';
}
function footer() {
  return '<footer><span>' + t('PITCH+ v') + VER + t(' — outil étudiant open source par Thomas Pitaval') + '</span><span>' + t('Lecture seule · rien ne quitte ton navigateur') + '</span><span>' + t('Syllabus ') + esc(S.dataset.syllabusYear || '—') + t(' · mapping ') + esc(S.dataset.mappingYear || '—') + '</span>' +
    '<a href="mailto:thomas.pitaval@2030.icam.fr">thomas.pitaval@2030.icam.fr</a><a href="https://pitproduction.com" target="_blank" rel="noopener">pitproduction.com</a></footer>';
}

/* ---- statut d'un critère : pastille et texte « prochaine chance » ---- */
function nextText(c) {
  if (c.status === 'ok') return t('Démontré');
  if (!c.next) return c.status === 'notyet' ? t('Pas encore enseigné') : t('Aucune séance connue : ni agenda, ni syllabus, ni PITCH');
  if (c.next.type === 'event') return fwhen(c.next.event.start) + ' · ' + c.next.event.unit + (c.next.event.phase ? ' · ' + t(PHASE_LABEL[c.next.event.phase]) : c.next.event.kind === 'eval' ? ' · TE' : '');
  if (c.next.type === 'unit') return (c.next.sem || '') + ' · ' + c.next.unit + t(' (sans date)');
  return t('Séance à venir selon PITCH') + (c.next.session && c.next.session.title ? ' · ' + c.next.session.title : '');
}
const stPill = st => '<span class="chip chip--' + st + '">' + (st === 'lost' ? '⚠ ' : st === 'later' ? '↻ ' : '') + t(CRIT_STATUS[st]) + '</span>';
function critLi(code, opts) {
  const c = S.R.crits[code]; if (!c) return '';
  const aa = c.aas[0] || '', comp = compOfAA(aa);
  /* pas de code d'acquis ici : la compétence situe, le titre explique, les codes sont dans le panneau */
  return '<li class="' + c.status + '" data-act="crit" data-c="' + esc(code) + '" style="cursor:pointer"><span class="st st--' + c.status + '">' + esc(t(CRIT_STATUS[c.status])) + '</span><b>' + esc(c.label) + '</b>' +
    '<em>' + (comp ? esc(comp) + ' · ' : '') + esc(aaTitle(aa)) + '</em>' +
    (opts && opts.next && c.status !== 'ok' ? '<em>→ ' + esc(nextText(c)) + '</em>' : '') + '</li>';
}

/* ---------------- vues ---------------- */
function viewHome() {
  const R = S.R, g = R.gauge.cursus, tg = R.gauge.taught;
  const evs = R.events.filter(e => !e.past && !e.ignored && !e.allDay).slice(0, 40);
  const useful = evs.filter(e => e.toDemo.length).slice(0, 6);
  const list = (useful.length ? useful : evs.slice(0, 6));
  /* la carte de gauche montre déjà les séances datées : ici, ce qui n'en a plus, le vrai angle mort */
  const lostFirst = R.chances.filter(c => c.status === 'lost');
  const ch = (lostFirst.length ? lostFirst : R.chances).slice(0, 5);
  const lost = R.chances.filter(c => c.status === 'lost').length, planned = R.chances.filter(c => c.status === 'planned').length, later = R.chances.filter(c => c.status === 'later').length;
  return '<div class="home">' +
    '<div class="card"><span class="kicker o">' + t('Qu\'est-ce qui arrive ?') + '</span><h2>' + (useful.length ? plural(useful.length, 'séance') + t(' où démontrer') : t('Prochaines séances')) + '</h2>' +
    (list.length ? list.map(e => '<button class="ev' + (e.kind === 'eval' ? ' te' : '') + '" data-act="ev" data-uid="' + esc(e.uid) + '"><span class="t"><span>' + esc(fwhen(e.start)) + '</span><span class="k' + (e.kind === 'eval' ? ' te' : '') + '">' + esc(e.kind === 'eval' ? t('TE') : (t(PHASE_LABEL[e.phase]) || t(KIND_LABEL[e.kind]) || '')) + '</span></span><span class="c">' + esc(evTitle(e)) + '</span>' +
      '<span class="b"><span class="pill pill--do">' + e.toDemo.length + t(' à démontrer') + '</span></span></button>').join('')
      : '<p class="mut">' + (S.cal ? t('Aucune séance à venir dans l\'agenda.') : t('Ajoute ton lien Hyperplanning dans les réglages.')) + '</p>') +
    '<button class="more" data-act="view" data-v="agenda">' + t('Voir l\'agenda →') + '</button></div>' +
    '<div class="card"><span class="kicker o">' + t('Où est ma prochaine chance ?') + '</span><h2><span class="big"><b>' + lost + '</b></span> ' + (lost > 1 ? t('critères sans séance') : t('critère sans séance')) + '</h2>' +
    '<p class="sm-t"><span class="chip chip--planned">' + planned + ' ' + t('prévus') + '</span> <span class="chip chip--later">' + later + ' ' + t('à venir') + '</span> <span class="chip chip--lost">⚠ ' + lost + ' ' + t('sans séance') + '</span></p>' +
    '<ul class="crit">' + ch.map(x => critLi(x.crit.code, { next: !lostFirst.length })).join('') + '</ul>' +
    '<button class="more" data-act="goto" data-v="chances"' + (lostFirst.length ? ' data-cst="lost"' : '') + '>' + (lostFirst.length ? t('Voir les critères sans séance →') : t('Voir par séance →')) + '</button></div>' +
    '<div class="card"><span class="kicker o">' + t('Suis-je sur la trajectoire ?') + '</span><h2><span class="big"><b>' + g.pct + '</b> %</span> <span class="mut sm-t">' + t('seuil 70 %') + '</span></h2>' + gaugeBar(g, true) +
    '<div class="proj"><div><b>' + tg.pct + ' %</b><span>' + t('sur ce qui a déjà été enseigné') + '</span></div></div>' +
    '<button class="more" data-act="view" data-v="traj">' + t('Détail par compétence →') + '</button></div></div>';
}

const COL_LATER_OK = '#a8d5ab';
function gaugeBar(g, withMark, small) {
  let x = 0; const p = v => g.total ? (v || 0) / g.total * 100 : 0;
  let svg = '<svg class="bar' + (small ? ' sm' : '') + '" width="100%" height="' + (small ? 10 : 18) + '">' + HATCH;
  [['ok', COL.ok], ['late_ok', COL_LATER_OK], ['planned', COL.planned], ['later', '#FBE3BE'], ['notyet', 'url(#ph)'], ['lost', '#FDE7DE']].forEach(k => { const w = p(g[k[0]]); if (k[0] === 'notyet' && w > 0) svg += rct(x, w, '#fafafa'); if (w > 0) svg += rct(x, w, k[1]); x += w; });
  svg += '</svg>';
  const leg = small ? '' : '<ul class="gl">' + [[COL.ok, g.ok, 'démontrés'], [COL.planned, g.planned, 'prévus'], ['#FBE3BE', g.later, 'à venir'], [null, g.notyet, 'pas encore enseignés'], ['#FDE7DE;border:1px solid #F6C6B2', g.lost, 'sans séance']].map(k => '<li><i ' + (k[0] ? 'style="background:' + k[0] + '"' : 'class="sw-h"') + '></i><b>' + k[1] + '</b> ' + t(k[2]) + '</li>').join('') + '</ul>';
  return '<div class="gauge"><div class="track">' + svg + (withMark ? '<span class="mark r" style="left:70%"><em>70 %</em></span>' : '') + '</div>' + leg + '</div>';
}
function rct(x, w, fill) { return '<rect x="' + x.toFixed(2) + '%" y="0" width="' + w.toFixed(2) + '%" height="100%" fill="' + fill + '"/>'; }

/* ---- agenda ---- */
function weekDays() {
  const tk = dayKey(S.now.toISOString());
  const d = new Date(tk + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + S.week * 7);
  const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd);
  const days = [];
  for (let i = 0; i < (S.f.wk7 ? 7 : 5); i++) { const x = new Date(d); x.setUTCDate(d.getUTCDate() + i); days.push(x.toISOString().slice(0, 10)); }
  return { days, today: tk, label: new Date(days[0] + 'T12:00:00Z').toLocaleDateString(LOC(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) + ' → ' + new Date(days[days.length - 1] + 'T12:00:00Z').toLocaleDateString(LOC(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) };
}
function viewAgenda() {
  if (!S.cal) return '<div class="empty"><b>' + t('Pas d\'agenda.') + '</b><span>Ajoute ton lien d\'abonnement Hyperplanning dans les <a href="#" data-act="view" data-v="set">réglages</a>.</span></div>';
  const w = weekDays();
  const byDay = {}; S.R.events.forEach(e => { (byDay[dayKey(e.start)] = byDay[dayKey(e.start)] || []).push(e); });
  const cnt = S.R.events.filter(e => !e.past && e.toDemo.length).length;
  return '<div class="week"><button data-act="week" data-d="-1">‹</button><button data-act="week" data-d="0">' + t('Aujourd\'hui') + '</button><button data-act="week" data-d="1">›</button><h2>' + esc(w.label) + '</h2>' +
    '<span class="tog"><button class="' + (!S.f.wk7 ? 'on' : '') + '" data-act="tog" data-k="wk7" data-v="0">5 j</button><button class="' + (S.f.wk7 ? 'on' : '') + '" data-act="tog" data-k="wk7" data-v="1">7 j</button></span>' +
    '<button class="' + (S.f.only ? 'on' : '') + '" data-act="tog" data-k="only" data-v="' + (S.f.only ? 0 : 1) + '">' + t('Seulement où j\'ai à démontrer · ') + cnt + '</button></div>' +
    '<div class="days' + (S.f.wk7 ? ' wk7' : '') + '">' + w.days.map(dk => {
      let evs = (byDay[dk] || []).filter(e => !S.f.only || e.toDemo.length);
      return '<div class="day"><h4' + (dk === w.today ? ' class="today"' : '') + '><span>' + esc(new Date(dk + 'T12:00:00Z').toLocaleDateString(LOC(), { weekday: 'long', timeZone: 'UTC' })) + '</span><span>' + dk.slice(8) + '</span></h4>' +
        (evs.length ? evs.map(evCard).join('') : '<p class="mut sm-t">—</p>') + '</div>';
    }).join('') + '</div>';
}
const moodlePill = code => { const u = code && S.dataset.units[code]; return u && u.moodle ? '<span class="pill pill--md" data-act="moodle" data-href="' + esc(u.moodle) + '" title="Moodle">Moodle ↗</span>' : ''; };
function evCard(e) {
  const kind = e.kind === 'eval' ? t('TE') : (t(PHASE_LABEL[e.phase]) || t(KIND_LABEL[e.kind]) || (e.fields.type || ''));
  return '<button class="ev' + (e.ignored ? ' ign' : '') + (e.past ? ' past' : '') + (e.kind === 'eval' ? ' te' : e.isNext && e.isNext.length ? ' next' : '') + (S.panel && S.panel.uid === e.uid ? ' on' : '') + '" data-act="ev" data-uid="' + esc(e.uid) + '">' +
    '<span class="t"><span>' + (e.allDay ? t('journée') : esc(fmtTime(e.start) + '–' + fmtTime(e.end))) + '</span><span class="k' + (e.kind === 'eval' ? ' te' : e.phase ? ' ph' : '') + '">' + esc(kind) + '</span></span>' +
    '<span class="c">' + esc(e.unit ? e.unit : (e.fields.matiere || e.summary).split(' - ')[0]) + '</span><span class="l">' + esc(e.unit ? unitTitle(e.unit) : (e.fields.matiere || e.summary).split(' - ').slice(1).join(' - ')) + (e.fields.rooms.length ? ' · ' + esc(e.fields.rooms[0].split(' (')[0]) : '') + '</span>' +
    '<span class="b">' + (e.ignored ? '<span class="pill pill--no">' + t('hors compétences') + '</span>' : !e.unit ? '<span class="pill pill--no">' + t('pas dans le syllabus') + '</span>' : e.noCrit ? '<span class="pill pill--no">' + t('aucun critère') + '</span>' :
      e.toDemo.length ? '<span class="pill pill--do">' + e.toDemo.length + t(' à démontrer') + '</span>' : '<span class="pill pill--ok">' + t('tout est démontré') + '</span>') + moodlePill(e.unit) + '</span></button>';
}

/* ---- prochaine chance ---- */
function compTitle(c) {
  /* PITCH renvoie les compétences en français (« C01 : Acquérir et mémoriser… ») ; le syllabus PDF, en anglais. */
  const d = S.dataset.comps[c] || {};
  if (S.lang === 'en') return d.title_en || '';
  const b = S.pitch && S.pitch.blockList ? S.pitch.blockList.find(x => x.code === c) : null;
  if (b && b.title) { const x = b.title.replace(/^C\d+\s*:\s*/, '').trim(); if (x && x !== c) return x; }
  /* en français, mieux vaut ne rien afficher que l'anglais du PDF */
  return d.title_fr || '';
}

/** Les codes de l'école, en pied de panneau : c'est ce qu'il faut chercher dans PITCH ou citer à un enseignant. */
function codesPitch(c) {
  return '<h3 class="gh">' + t('Codes PITCH') + '</h3><p class="mono mut">' + esc(c.code) + (c.aas.length ? ' · ' + esc(c.aas.join(' · ')) : '') + '</p>';
}

/** Une phrase en français simple, en tête d'écran, là où un mot de l'école apparaît pour la première fois. */
function gloss(t) { return '<p class="gloss">' + t + '</p>'; }

function chanceRow(x) {
  return '<div class="r"><button class="rw" data-act="crit" data-c="' + esc(x.crit.code) + '"><span class="sj">' + esc(x.comp) + '</span>' +
    '<span class="tx"><b>' + esc(x.crit.label) + '</b><em>' + esc(x.aaTitle) + (x.crit.attempted ? ' · <s>' + t('déjà tenté') + '</s>' : '') + '</em></span>' +
    '<span class="when ' + x.status + '">' + (x.status === 'planned' ? '<b>' + esc(fwhen(x.when)) + '</b>' + esc(x.unit) : x.status === 'later' ? '<b>↻ ' + esc(x.sem || t('à venir')) + '</b>' + esc(x.unit || t('selon PITCH')) : '<b>' + t('⚠ Sans séance') + '</b>') + '</span><span class="ch">▸</span></button></div>';
}

function groupCard(g) {
  const k = 'g:' + g.key, isOpen = !!S.open[k];
  const u = g.unit ? unitOf(g.unit) : null;
  const head = '<button class="rw" data-act="opengrp" data-k="' + esc(g.key) + '">' +
    '<span class="gn"><span class="chip chip--' + g.status + '">' + g.items.length + '</span></span>' +
    '<span class="tx"><b>' + esc(g.title) + '</b><em>' + esc(g.sub) + '</em></span><span class="ch">' + (isOpen ? '▾' : '▸') + '</span></button>';
  if (!isOpen) return '<div class="r">' + head + '</div>';
  return '<div class="r">' + head + '<div class="dt">' +
    (u && u.moodle ? '<p class="sm-t"><a href="' + esc(u.moodle) + '" target="_blank" rel="noopener">' + t('Moodle ↗') + '</a></p>' : '') +
    '<ul class="crit">' + g.items.map(i => critLi(i.crit.code, { next: g.status !== 'planned' })).join('') + '</ul></div></div>';
}

function viewChances() {
  const R = S.R, f = S.f, q = f.cq.trim().toLowerCase();
  let list = R.chances;
  if (f.cst) list = list.filter(x => x.status === f.cst);
  if (q) list = list.filter(x => (x.crit.label + ' ' + x.aaTitle + ' ' + x.aa + ' ' + x.unit + ' ' + x.comp).toLowerCase().indexOf(q) >= 0);
  const n = s => R.chances.filter(x => x.status === s).length;
  const LAB = { planned: t('Séance prévue'), later: t('↻ Cours à venir'), lost: t('⚠ Sans séance') };
  const chip = s => '<button class="chip chip--' + s + '"' + (f.cst && f.cst !== s ? ' style="opacity:.45"' : '') + ' data-act="cst" data-v="' + (f.cst === s ? '' : s) + '">' + t(LAB[s]) + ' ' + n(s) + '</button>';
  const modes = [['seance', t('Par séance')], ['cours', t('Par cours')], ['comp', t('Par compétence')], ['liste', t('Tout en liste')]];
  const head = '<div class="filters"><input type="search" id="cq" data-focus placeholder="Rechercher un critère, un cours…" value="' + esc(f.cq) + '">' +
    chip('planned') + chip('later') + chip('lost') +
    '<span class="tog">' + modes.map(m => '<button class="' + (f.grp === m[0] ? 'on' : '') + '" data-act="grp" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</span></div>';
  if (!list.length) return head + '<div class="empty"><b>' + t('Rien ici.') + '</b><span>' + t('Tout est démontré, ou pas encore enseigné.') + '</span></div>';
  if (f.grp === 'liste') return head + list.map(chanceRow).join('');

  const groups = [], idx = {};
  const push = (key, meta, x) => { let g = idx[key]; if (!g) { g = idx[key] = Object.assign({ key, items: [] }, meta); groups.push(g); } g.items.push(x); };
  list.forEach(x => {
    if (f.grp === 'comp') return push(x.comp || '—', { title: x.comp || t('Sans compétence'), sub: compTitle(x.comp).slice(0, 90), order: 1, status: x.status }, x);
    if (f.grp === 'cours') {
      const u = x.unit || '';
      return push(u || ('#' + x.status), { title: u ? u + ' · ' + unitTitle(u) : (x.status === 'lost' ? t('Sans séance') : t('Séance annoncée par PITCH')), sub: u ? [unitOf(u) && unitOf(u).type, unitOf(u) && unitOf(u).sem, x.when ? t('prochaine séance ') + fwhen(x.when) : t('sans date')].filter(Boolean).join(' · ') : '', unit: u, when: x.when, order: x.when ? 0 : 1, status: x.status }, x);
    }
    if (x.status === 'planned' && x.crit.next && x.crit.next.type === 'event') {
      const e = x.crit.next.event;
      return push('e:' + e.uid, { title: fwhen(e.start) + ' · ' + e.unit, sub: unitTitle(e.unit) + (e.phase ? ' · ' + t(PHASE_LABEL[e.phase]) : e.kind === 'eval' ? ' · TE' : '') + (e.fields.rooms[0] ? ' · ' + e.fields.rooms[0].split(' (')[0] : ''), unit: e.unit, when: e.start, order: 0, status: 'planned' }, x);
    }
    if (x.status === 'later') return push('u:' + (x.unit || '?'), { title: (x.sem || t('à venir')) + ' · ' + (x.unit || t('selon PITCH')), sub: x.unit ? unitTitle(x.unit) : t('aucune date connue'), unit: x.unit, order: 1, status: 'later' }, x);
    return push('lost', { title: t('Sans séance'), sub: t('ni dans ton agenda, ni dans le syllabus, ni annoncée par PITCH'), order: 2, status: 'lost' }, x);
  });
  groups.sort((a, b) => (a.order - b.order) || (a.when && b.when ? (a.when < b.when ? -1 : 1) : 0) || b.items.length - a.items.length);
  const hint = f.grp === 'seance' ? t('<p class="sub mut sm-t">Une ligne par séance à venir : ce qu\'il y a à démontrer ce jour-là. En bas, ce qui n\'a plus aucune séance.</p>') : '';
  return head + hint + groups.map(groupCard).join('');
}
/* ---- Compas : chercher dans le syllabus ---- */
const DOMAINS = { EEE: 'Électronique', ESE: 'Énergétique', MME: 'Mécanique, matériaux', MIA: 'Maths, informatique', MEO: 'Management', HUM: 'Humanités, langues', ERD: 'Développement personnel', PROJET: 'Projet' };
function compasMatches() {
  const D = S.dataset, R = S.R, f = S.f.k, q = f.q.trim().toLowerCase();
  const seen = {};
  return Object.keys(D.crits).filter(code => {
    const d = D.crits[code], c = R.crits[code] || {}, aa = d.aas[0] || '', a = D.aas[aa] || {};
    if (f.comp && a.comp !== f.comp) return false;
    if (f.sem && a.sem !== f.sem) return false;
    if (f.dom && (a.domain || '') !== f.dom) return false;
    if (f.st && c.status !== f.st) return false;
    if (q) {
      const hay = seen[code] || (seen[code] = [code, d.label_fr, d.label_en, aa, a.title_fr, a.title_en, a.comp, d.eval.join(' '), d.eval.map(unitTitle).join(' ')].join(' ').toLowerCase());
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });
}
function compasLi(code) {
  const c = S.R.crits[code], d = S.dataset.crits[code];
  const units = d.eval.length ? t('évalué par ') + d.eval.map(u => '<span class="mono">' + esc(u) + '</span>').join(', ') : t('aucun cours ne l\'évalue');
  return '<li class="' + (c ? c.status : 'notyet') + '" data-act="crit" data-c="' + esc(code) + '" style="cursor:pointer">' +
    (c && S.pitch ? '<span class="st st--' + c.status + '">' + esc(t(CRIT_STATUS[c.status])) + '</span>' : '') + '<b>' + esc(pick(d, 'label') || code) + '</b>' +
    '<em>' + units + (c && c.status !== 'ok' && c.next ? ' · → ' + esc(nextText(c)) : '') + '</em></li>';
}
function viewCompas() {
  const D = S.dataset, R = S.R, f = S.f.k;
  const codes = compasMatches();
  const aaOfC = code => (D.crits[code].aas[0] || '');
  const aaSet = uniq(codes.map(aaOfC).filter(Boolean)), unitSet = uniq([].concat(...codes.map(c => D.crits[c].eval)));
  const comps = Object.keys(D.comps).sort().map(c => [c, c + (compTitle(c) ? ' · ' + compTitle(c).slice(0, 50) : '')]);
  const sems = SEMESTERS.map(x => [x, x]);
  const doms = Object.keys(DOMAINS).map(k => [k, k + ' · ' + t(DOMAINS[k])]);
  const sts = ['ok', 'planned', 'later', 'lost', 'notyet'].map(x => [x, t(CRIT_STATUS[x])]);
  const selk = (id, ph, opts, cur) => '<select data-act="kf" data-k="' + id + '"><option value="">' + ph + '</option>' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (cur === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
  const head = '<div class="filters"><input type="search" id="kq" data-focus placeholder="Un mot du critère, un acquis, un cours, un code…" value="' + esc(f.q) + '">' +
    selk('comp', t('Toutes les compétences'), comps, f.comp) + selk('sem', t('Tous les semestres'), sems, f.sem) + selk('dom', t('Tous les domaines'), doms, f.dom) +
    (S.pitch ? selk('st', t('Tous mes états'), sts, f.st) : '') +
    '<span class="tog">' + [['crit', t('Critères')], ['aa', t('Acquis')], ['cours', t('Cours')]].map(m => '<button class="' + (f.lvl === m[0] ? 'on' : '') + '" data-act="klvl" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</span>' +
    ((f.q || f.comp || f.sem || f.dom || f.st) ? '<button class="fx" data-act="kclear">' + t('Effacer ×') + '</button>' : '') + '</div>' +
    '<p class="sub mut sm-t">' + plural(codes.length, 'critère') + ' · ' + plural(aaSet.length, 'acquis', 'acquis') + ' · ' + plural(unitSet.length, 'cours', 'cours') + (D.syllabusYear ? t(' · syllabus ') + esc(D.syllabusYear) : '') + '</p>';
  if (!codes.length) return head + '<div class="empty"><b>' + t('Rien ne correspond.') + '</b><span>' + t('Essaie un autre mot ou retire un filtre.') + '</span></div>';
  const more = (n) => n > f.max ? '<button class="more" data-act="kmore">' + t('Afficher plus · ') + (n - f.max) + ' restants</button>' : '';

  if (f.lvl === 'aa') {
    const rows = aaSet.map(aa => { const a = D.aas[aa] || {}, p = R.aaMap[aa]; const mine = codes.filter(c => aaOfC(c) === aa); return { aa, a, p, n: (a.crits || []).length, m: mine.length }; })
      .sort((x, y) => (x.a.comp || '') < (y.a.comp || '') ? -1 : (x.a.comp || '') > (y.a.comp || '') ? 1 : x.aa < y.aa ? -1 : 1);
    return head + rows.slice(0, f.max).map(r => {
      const v = r.p ? AA_VERDICT[r.p.verdict] : null;
      return '<div class="r"><button class="rw" data-act="aa-go" data-c="' + esc(r.aa) + '"><span class="sj">' + esc(r.a.comp || '') + '</span><span class="tx"><b>' + esc(aaTitle(r.aa)) + '</b><em>' + esc(r.a.sem || '') + ' · ' + r.n + ' critère' + (r.n > 1 ? 's' : '') + (r.m !== r.n ? t(', dont ') + r.m + t(' dans ta recherche') : '') + '</em></span>' +
        (r.p ? '<span class="mini mini--' + r.p.verdict + '"><i style="width:' + (r.p.pct || 0) + '%"></i></span><span class="bg v-' + r.p.verdict + '">' + (v.ico ? v.ico + ' ' : '') + t(v.label) + '</span>' : '<span class="mut sm-t">' + t('pas dans ton PITCH') + '</span>') + '<span class="ch">▸</span></button></div>';
    }).join('') + more(rows.length);
  }
  if (f.lvl === 'cours') {
    const rows = unitSet.map(u => { const d = D.units[u]; const mine = codes.filter(c => D.crits[c].eval.indexOf(u) >= 0); const todo = mine.filter(c => R.crits[c] && R.crits[c].status !== 'ok'); return { u, d, mine, todo }; })
      .sort((x, y) => semOrder(x.d.sem) - semOrder(y.d.sem) || (x.u < y.u ? -1 : 1));
    return head + rows.slice(0, f.max).map(r => {
      const k = 'u:' + r.u, isOpen = !!S.open[k];
      const headRow = '<button class="rw" data-act="openu" data-k="' + esc(r.u) + '"><span class="sj">' + esc(r.d.sem || '') + '</span><span class="tx"><b>' + esc(r.u) + ' · ' + esc(unitTitle(r.u)) + '</b><em>' + esc([r.d.type, r.d.lang, r.d.tlh ? r.d.tlh + ' h' : ''].filter(Boolean).join(' · ')) + ' · ' + r.mine.length + ' critère' + (r.mine.length > 1 ? 's' : '') + (S.pitch && r.todo.length ? ', <s>' + r.todo.length + t(' à démontrer') + '</s>' : '') + '</em></span><span class="ch">' + (isOpen ? '▾' : '▸') + '</span></button>';
      if (!isOpen) return '<div class="r">' + headRow + '</div>';
      return '<div class="r">' + headRow + '<div class="dt">' + (r.d.moodle ? '<p class="sm-t"><a href="' + esc(r.d.moodle) + '" target="_blank" rel="noopener">' + t('Moodle ↗') + '</a></p>' : '') + '<ul class="crit">' + r.mine.map(compasLi).join('') + '</ul></div></div>';
    }).join('') + more(rows.length);
  }
  /* niveau critères : regroupés par acquis */
  const groups = {}; const order = [];
  codes.forEach(c => { const aa = aaOfC(c) || '—'; if (!groups[aa]) { groups[aa] = []; order.push(aa); } groups[aa].push(c); });
  order.sort((x, y) => { const a = D.aas[x] || {}, b = D.aas[y] || {}; return (a.comp || 'Z') < (b.comp || 'Z') ? -1 : (a.comp || 'Z') > (b.comp || 'Z') ? 1 : x < y ? -1 : 1; });
  return head + order.slice(0, f.max).map(aa => {
    const a = D.aas[aa] || {}, p = R.aaMap[aa];
    return '<h3 class="gh"><span>' + esc(a.comp || '') + ' · ' + esc(aaTitle(aa)) + '</span><span class="mut">' + esc(a.sem || '') + (p && p.pct != null ? ' · ' + Math.round(p.pct) + ' %' : '') + '</span></h3><ul class="crit">' + groups[aa].map(compasLi).join('') + '</ul>';
  }).join('') + more(order.length);
}

/* ---- trajectoire 70 % ---- */
function viewTraj() {
  const G = S.R.gauge, g = G.cursus, tg = G.taught;
  const manque = Math.max(0, Math.ceil(g.total * 0.7) - g.ok);
  const yearLabel = y => y === 'BP' ? 'Bp' : y;
  const rowBar = (x, lab, sub, act) => '<div class="grow"' + (act || '') + '><span class="lab' + (x.future ? ' mut' : '') + '">' + esc(lab) + '</span>' + (sub != null ? '<span class="lab2">' + sub + '</span>' : '') + '<span class="trk">' + gaugeBar(x, false, true) + '</span><span class="val"><b>' + x.pct + ' %</b><span class="of">' + x.ok + '/' + x.total + '</span></span></div>';
  return '<div class="sect"><span class="kicker">' + t('Bachelor · 8 semestres') + '</span><p class="q">' + g.pct + t(' % démontrés · seuil 70 %') + '</p>' + gaugeBar(g, true) +
    '<div class="proj"><div><b>' + manque + '</b><span>' + t('critères à démontrer pour atteindre 70 % du cursus') + '</span></div><div><b>' + tg.pct + ' %</b><span>' + t('sur ce qui a déjà été enseigné') + '</span></div><div><b>' + g.best + ' %</b><span>' + t('si tu démontres tout ce qui est planifié') + '</span></div></div></div>' +
    '<div class="sect"><span class="kicker">' + t('Année par année') + '</span><p class="sub">' + t('Chaque année telle qu\'elle se présentait à sa fin. Un critère rattrapé plus tard reste en vert clair dans son année d\'origine.') + '</p>' +
    G.byYear.filter(y => y.total).map(y => rowBar(y, yearLabel(y.year) + (y.current ? ' ●' : ''),
      [y.late_ok ? y.late_ok + t(' rattrapé') + (y.late_ok > 1 ? 's' : '') + t(' depuis') : '', y.recovered ? t('+') + y.recovered + t(' d\'années passées rattrapé') + (y.recovered > 1 ? 's' : '') + t(' cette année-là') : ''].filter(Boolean).map(x => '<span class="mut">' + x + '</span>').join(' · '))).join('') +
    '<ul class="gl"><li><i style="background:' + COL.ok + '"></i>' + t('démontrés dans l\'année') + '</li><li><i style="background:' + COL_LATER_OK + '"></i>' + t('rattrapés depuis') + '</li><li><i style="background:' + COL.planned + '"></i>' + t('prévus') + '</li><li><i style="background:#FBE3BE"></i>à venir</li><li><i class="sw-h"></i>' + t('pas encore enseignés') + '</li><li><i style="background:#FDE7DE;border:1px solid #F6C6B2"></i>' + t('sans séance') + '</li></ul></div>' +
    '<div class="sect"><span class="kicker">' + t('Par compétence') + '</span>' +
    G.byComp.filter(c => c.total).map(c => rowBar(c, c.comp, esc((compTitle(c.comp) || '').slice(0, 70)), ' data-act="goto" data-v="acquis" data-bloc="' + esc(c.comp) + '" style="cursor:pointer"')).join('') + '</div>';
}
/* ---- acquis (hérité v5) ---- */
function subjects() { return uniq(S.R.aas.map(a => a.subject)).sort(); }
function aaList() {
  const f = S.f, q = f.q.trim().toLowerCase();
  return S.R.aas.filter(a => {
    if (f.sem && a.sems.indexOf(f.sem) < 0 && a.semsT.indexOf(f.sem) < 0) return false;
    if (f.subj && a.subject !== f.subj) return false;
    if (f.bloc && a.bloc !== f.bloc) return false;
    if (f.st === '@track') { if (!S.notes[a.code] || !S.notes[a.code].t) return false; }
    else if (f.st === '@lost') { if (a.verdict !== 'req' && a.verdict !== 'rat') return false; }
    else if (f.st && a.verdict !== f.st) return false;
    if (q && (a.code + ' ' + a.title + ' ' + (a.titleEn || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort((a, b) => { const la = a.lost == null ? 99 : a.lost, lb = b.lost == null ? 99 : b.lost; if (la !== lb) return lb - la; return (b.pct || 0) - (a.pct || 0); });
}
function sel(id, ph, opts, cur) { return '<select data-act="f" data-k="' + id + '"><option value="">' + ph + '</option>' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (cur === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>'; }
function viewAcquis() {
  const R = S.R, f = S.f, cnt = v => R.aas.filter(a => a.verdict === v).length;
  const st = [['req', t('⚠ Requalifications (') + cnt('req') + ')'], ['rat', t('↻ Rattrapages (') + cnt('rat') + ')'], ['@lost', t('Les deux (') + (cnt('req') + cnt('rat')) + ')'], ['wait', t('En cours (') + cnt('wait') + ')'], ['soon', t('Pas commencé (') + cnt('soon') + ')'], ['ok', t('Validés (') + cnt('ok') + ')'], ['@track', t('Mes suivis')]];
  const head = '<div class="filters"><input type="search" data-act="f" data-k="q" ' + (f.q ? 'data-focus ' : '') + 'placeholder="Rechercher un acquis…" value="' + esc(f.q) + '">' + sel('st', t('Tous les statuts'), st, f.st) +
    sel('sem', t('Tous les semestres'), S.pitch.subs.map(s => [s.code, s.title]), f.sem) + sel('subj', t('Toutes les matières'), subjects().map(s => [s, s]), f.subj) +
    sel('bloc', t('Toutes les compétences'), S.pitch.blockList.map(b => [b.code, b.code + ' · ' + b.title.replace(/^C\d+\s*:\s*/, '').slice(0, 50)]), f.bloc) +
    (f.bloc || f.st || f.sem || f.subj ? '<button class="fx" data-act="clearf">' + t('Retirer les filtres ×') + '</button>' : '') + '</div>';
  const rows = aaList();
  return head + gloss(t('Un <b>acquis</b> regroupe plusieurs critères. Il est validé dès que <b>') + S.T + t(' %</b> d\'entre eux sont démontrés.')) +
    (rows.length ? rows.map(aaRow).join('') : '<div class="empty"><b>' + t('Rien ici.') + '</b><span>' + t('Essaie un autre filtre.') + '</span></div>');
}
function aaRow(a) {
  const v = AA_VERDICT[a.verdict] || AA_VERDICT.wait, n = S.notes[a.code] || {}, d = a.det;
  let mt;
  if (!d) mt = '<span class="mut">' + (a.pct == null ? '—' : Math.round(a.pct) + ' %') + '</span>';
  else { const bits = []; if (a.lost) bits.push('<b>' + a.lost + '</b>' + t(' sans séance')); if (a.chance) bits.push('<span style="color:#a8650a">' + a.chance + t(' rattrapable') + (a.chance > 1 ? 's' : '') + '</span>'); mt = bits.join(' · ') || '<span class="mut">' + Math.round(a.pct || 0) + ' %</span>'; }
  const head = '<button class="rw" data-act="aa" data-c="' + esc(a.code) + '"><span class="sj">' + esc(a.subject) + '</span><span class="tx"><b>' + esc(aaTitle(a.code)) + '</b><em>' + esc(a.bloc || '') + ' · ' + esc(a.semsT.join(', ')) + (a.nextEv ? ' · <s>' + esc(fwhen(a.nextEv.start)) + '</s>' : '') + (n.t ? ' · <s>' + esc(t(TAGS[n.t])) + '</s>' : '') + '</em></span>' +
    '<span class="mini mini--' + a.verdict + '"><i style="width:' + (a.pct || 0) + '%"></i></span><span class="mt">' + mt + '</span><span class="bg v-' + a.verdict + '">' + (v.ico ? v.ico + ' ' : '') + t(v.label) + '</span><span class="ch">' + (S.open[a.code] ? '▾' : '▸') + '</span></button>';
  if (!S.open[a.code]) return '<div class="r">' + head + '</div>';
  const det = !d ? '<p class="mut">' + t('Pas de détail PITCH.') + '</p>' : '<p class="mut sm-t">' + d.ok + t(' critères démontrés sur ') + d.total + '.</p><ul class="crit">' + a.critStates.slice().sort((x, y) => rk(x.status) - rk(y.status)).map(c => critLi(c.code, { next: true })).join('') + '</ul>';
  return '<div class="r"><div class="r">' + head + '</div><div class="dt">' + det + notePanel(a) + '</div></div>';
}
const rk = s => ({ lost: 0, planned: 1, later: 2, notyet: 3, ok: 4 })[s] || 5;
function notePanel(a) {
  const n = S.notes[a.code] || {};
  return '<div class="note"><span class="nl">' + t('Mon suivi') + '</span>' + Object.keys(TAGS).map(k => '<button class="tg' + (n.t === k ? ' on' : '') + '" data-act="tag" data-a="' + esc(a.code) + '" data-t="' + k + '">' + t(TAGS[k]) + '</button>').join('') +
    '<textarea class="nt" data-act="note" data-a="' + esc(a.code) + '" rows="2" placeholder="Note personnelle, enregistrée sur cet ordinateur">' + esc(n.n || '') + '</textarea></div>';
}

/* ---- par cours ---- */
/* ---- changements ---- */
function viewChg() {
  if (!S.diff) return '<div class="empty"><b>' + t('Rien de neuf') + (S.snap ? t(' depuis le ') + esc(fdate(S.snap.date)) : '') + '.</b><span>' + (S.snap ? t('Aucun critère n\'a bougé à la dernière lecture de PITCH.') : t('Premier passage : le repère vient d\'être posé.')) + '</span></div>' + (S.snap ? '<button data-act="reset-snap" style="margin-top:20px">' + t('Reposer le repère à aujourd\'hui') + '</button>' : '');
  const d = S.diff, li = (code, k, extra) => { const a = S.R.aaMap[code]; return '<div class="r"><div class="rw"><span class="sj">' + esc(a ? a.subject : '') + '</span><span class="tx"><b>' + esc(a ? a.title : code) + '</b><em>' + esc(code) + '</em></span><span class="mt">' + esc(extra || '') + '</span></div></div>'; };
  let out = '<p class="sub mut sm-t">' + t('Comparaison avec la lecture PITCH précédente, le ') + esc(fdate(d.date)) + t('. Repère enregistré sur cet ordinateur uniquement.') + '</p>';
  if (d.critsOk.length) out += '<h3 class="gh">' + t('Critères démontrés depuis') + '</h3><ul class="crit">' + d.critsOk.map(c => critLi(c)).join('') + '</ul>';
  if (d.valides.length) out += '<h3 class="gh">' + t('Acquis passés à validé') + '</h3>' + d.valides.map(c => li(c)).join('');
  if (d.gagnes.length) out += '<h3 class="gh">' + t('Acquis en progrès') + '</h3>' + d.gagnes.map(x => li(x.aa, 'up', t('+') + x.n)).join('');
  if (d.perdus.length) out += '<h3 class="gh">' + t('Critères passés sans séance') + '</h3>' + d.perdus.map(x => li(x.aa, 'down', t('+') + x.n + t(' sans séance'))).join('');
  return out + '<button data-act="reset-snap" style="margin-top:26px">' + t('Reposer le repère à aujourd\'hui') + '</button>';
}

/* ---- diagnostic ---- */
function viewDiag() {
  const d = S.R.diag, st = S.dataset.stats || {};
  const tr = (k, v) => '<tr><td>' + k + '</td><td>' + v + '</td></tr>';
  return '<div class="two"><div class="sect"><span class="kicker">' + t('Agenda ↔ syllabus') + '</span><table class="ref">' +
    tr(t('Séances lues'), d.events) + tr(t('Hors compétences'), d.ignored) + tr(t('Appariées'), d.matched + ' / ' + (d.events - d.ignored) + ' (' + pct(d.matched, d.events - d.ignored) + ' %)') +
    tr(t('Non appariées'), d.unmatched.length ? d.unmatched.map(u => '<span class="chip chip--rat">' + esc(u.label) + ' · ' + u.n + '</span>').join(' ') : '<span class="ok-t">aucune</span>') +
    tr('Année / campus', esc(d.year || '?') + ' / ' + esc(d.campus || '?')) + tr('Semestre courant', esc(d.curSem || '?') + ' <span class="mut">(agenda : ' + esc(d.curSemFromCal || '—') + ' · PITCH : ' + esc(d.curSemFromPitch || '—') + ')</span>') +
    tr('Flux lu le', esc(S.icsAt ? new Date(S.icsAt).toLocaleString(LOC()) : (S.demo ? 'démo' : '—')) + (S.icsErr ? ' <span class="err-t">' + esc(S.icsErr) + '</span>' : '')) + '</table></div>' +
    '<div class="sect"><span class="kicker">' + t('PITCH ↔ syllabus') + '</span><table class="ref">' +
    tr('Acquis lus', d.pitchAAs + (d.pitchAAsUnknown ? ' <span class="chip chip--rat">' + d.pitchAAsUnknown + ' absents du syllabus</span>' : '')) +
    tr('Critères lus', d.pitchCrits + (d.pitchCritsUnknown ? ' <span class="chip chip--rat">' + d.pitchCritsUnknown + ' absents du syllabus</span>' : '')) +
    tr('Critères du syllabus jamais vus dans PITCH', d.datasetCritsNotInPitch) +
    tr('Séances PITCH → cours', d.sessCodes ? d.sessMatched + ' / ' + d.sessCodes + ' (' + pct(d.sessMatched, d.sessCodes) + ' %)' : '—') +
    tr('Lu le', esc(S.pitch && S.pitch.fetchedAt ? new Date(S.pitch.fetchedAt).toLocaleString(LOC()) : '—')) + '</table></div></div>' +
    '<div class="sect"><span class="kicker">' + t('Jeu de données embarqué') + '</span><table class="ref">' + tr('Programme', esc(d.dataset.program)) + tr('Mapping cours × critères', esc(d.dataset.mappingYear || '—') + ' (Excel officiel)') + tr('Syllabus', esc(d.dataset.syllabusYear || '—') + ' (PDF)') +
    tr('Cours / critères', d.dataset.units + ' / ' + d.dataset.crits) + (st.merged ? tr('Contrôles', st.merged.units_both + ' cours dans les deux sources · ' + st.merged.units_excel_only + ' Excel seul · ' + st.merged.units_pdf_only + ' PDF seul · ' + st.merged.crits_without_unit + ' critères sans cours · ' + st.merged.crits_multi_unit + ' critères multi-cours') : '') + tr('Version', t('PITCH+ v') + VER) + '</table></div>';
}

/* ---- réglages / accueil ---- */
function viewSet() {
  const masked = S.icsUrl ? maskIcsUrl(S.icsUrl) : '';
  return '<div class="set"><div class="guard">' + t('Rien ne quitte ton navigateur : pas de compte, pas de serveur, pas de mot de passe. PITCH n\'est jamais modifié. La seule requête réseau est la lecture de ton flux Hyperplanning.') + '</div>' +
    '<h3 class="gh">' + t('Agenda Hyperplanning') + '</h3><p>Dans Hyperplanning : <b>Exporter → Lien d\'abonnement iCal</b>, puis colle le lien ici. Il contient une clé secrète : il reste sur cet ordinateur et n\'est jamais affiché en entier.</p>' +
    '<div class="row"><input type="url" id="icsurl" placeholder="https://planning.icam.fr/Telechargements/ical/Edt_….ics?…" value=""><button class="o" data-act="ics-save">' + t('Enregistrer') + '</button></div>' +
    (S.icsUrl ? '<p>' + t('Lien enregistré : ') + '<span class="mono">' + esc(masked) + '</span>' + (S.icsAt ? t(' · lu le ') + esc(new Date(S.icsAt).toLocaleString(LOC())) : '') + (S.cal ? ' · ' + S.cal.events.length + t(' séances') : '') + (S.icsErr ? ' · <span class="err-t">' + esc(S.icsErr) + '</span>' : '') + '</p><div class="row"><button data-act="refresh-ics">' + t('Relire maintenant') + '</button><button data-act="ics-clear">' + t('Retirer le lien') + '</button></div>' : '<p class="mut">' + t('Aucun lien enregistré. Le flux est relu automatiquement chaque jour.') + '</p>') +
    '<h3 class="gh">' + t('Langue') + '</h3><div class="row"><span class="tog"><button class="' + (S.lang === 'fr' ? 'on' : '') + '" data-act="lang" data-v="fr">Français</button><button class="' + (S.lang === 'en' ? 'on' : '') + '" data-act="lang" data-v="en">English</button></span><span class="mut sm-t">' + t('Interface et intitulés du syllabus. Les titres d\'acquis viennent de PITCH en français, du syllabus en anglais.') + '</span></div>' +
    '<h3 class="gh">PITCH</h3><p>' + t('Lu via ton onglet PITCH déjà connecté (pitch-icam.rima1.fr).') + (S.pitch && S.pitch.fetchedAt ? t(' Dernière lecture : ') + esc(new Date(S.pitch.fetchedAt).toLocaleString(LOC())) + '.' : '') + '</p><div class="row"><button data-act="refresh-pitch">' + t('Relire PITCH') + '</button><button data-act="pitch-clear">' + t('Vider le cache local') + '</button></div>' +
    '<h3 class="gh">' + t('Données personnelles') + '</h3><div class="row"><button data-act="wipe">' + t('Tout effacer (agenda, cache PITCH, notes)') + '</button></div>' +
    '<h3 class="gh">' + t('Démo') + '</h3><p><a href="app.html?demo=1">' + t('Ouvrir le mode démo') + '</a> ' + t('(étudiant fictif, données générées).') + '</p>' +
    '<h3 class="gh">' + t('À propos') + '</h3><p>' + t('PITCH+ v') + VER + t(' · Thomas Pitaval, Icam Lille, Bachelor International promo 2030 · open source · ') + '<a href="mailto:pitproductionpro@gmail.com">pitproductionpro@gmail.com</a> · <a href="https://pitproduction.com" target="_blank" rel="noopener">pitproduction.com</a>. Outil étudiant non officiel, sans lien avec l\'éditeur de PITCH ni avec l\'Icam.</p></div>';
}
function viewAuth() {
  return '<div class="load"><div class="lg">PITCH</div><div class="ls">' + t('Connecte-toi à PITCH dans l\'onglet ouvert, puis reviens ici.') + (S.authErr ? '<br><small class="err-t">' + esc(S.authErr) + '</small>' : '') + '</div>' +
    '<div style="display:flex;gap:8px"><button class="x" data-act="open-pitch">' + t('Ouvrir PITCH') + '</button><button data-act="refresh-pitch">' + t('J\'ai fini, relire') + '</button>' + (S.cal ? '<button data-act="agenda-only">' + t('Agenda seul') + '</button>' : '') + '</div>' +
    '<p class="mut sm-t">' + t('Aucun mot de passe n\'est demandé : PITCH+ utilise la session déjà ouverte.') + '</p></div>';
}

/* ---- panneau latéral ---- */
function panel() {
  const p = S.panel; let body = '';
  if (p.type === 'ev') {
    const e = S.R.events.find(x => x.uid === p.uid); if (!e) return '';
    const u = e.unit ? unitOf(e.unit) : null;
    body = '<span class="kicker o">' + esc(e.kind === 'eval' ? t('Évaluation (TE)') : (t(PHASE_LABEL[e.phase]) ? 'PBL · ' + t(PHASE_LABEL[e.phase]) : t(KIND_LABEL[e.kind]) || e.fields.type || t('Séance'))) + '</span><h2>' + esc(evTitle(e)) + '</h2>' +
      '<div class="meta"><span>' + esc(fwhen(e.start)) + ' → ' + esc(fmtTime(e.end)) + '</span>' + (e.fields.rooms.length ? '<span>' + esc(e.fields.rooms.join(', ')) + '</span>' : '') + (e.fields.teachers.length ? '<span>' + esc(e.fields.teachers.join(', ')) + '</span>' : '') +
      (u ? '<span>' + esc([u.type, u.sem, u.lang, u.tlh ? u.tlh + ' h' : ''].filter(Boolean).join(' · ')) + '</span>' : '') + (u && u.moodle ? '<a href="' + esc(u.moodle) + '" target="_blank" rel="noopener">' + t('Moodle ↗') + '</a>' : '') + '</div>' +
      (e.ignored ? '<p class="mut">' + t('Hors compétences : rien à démontrer ici.') + '</p>' : !e.unit ? '<p class="mut">' + t('Cours absent du syllabus embarqué (') + esc(e.code) + '). Voir Diagnostic.</p>' :
        (e.toDemo.length ? '<h3 class="gh">' + t('À démontrer ici · ') + e.toDemo.length + '</h3><ul class="crit">' + e.toDemo.slice().sort((a, b) => rk(S.R.crits[a].status) - rk(S.R.crits[b].status)).map(c => critLi(c, { next: true })).join('') + '</ul>' : '') +
        (e.done.length ? '<h3 class="gh">' + t('Déjà démontrés · ') + e.done.length + '</h3><ul class="crit">' + e.done.map(c => critLi(c)).join('') + '</ul>' : '') +
        (e.contribAAs.length ? '<h3 class="gh">' + t('Contribue à · ') + e.contribAAs.length + '</h3><ul class="crit">' + e.contribAAs.map(a => '<li class="notyet" data-act="aa-go" data-c="' + esc(a) + '" style="cursor:pointer"><b>' + esc(aaTitle(a)) + '</b><em>' + esc(a) + t(' · contribue sans évaluer') + '</em></li>').join('') + '</ul>' : '') +
        (!e.toDemo.length && !e.done.length && !e.contribAAs.length ? '<p class="mut">' + t('Aucun critère rattaché à ce cours dans le syllabus.') + '</p>' : ''));
  } else if (p.type === 'crit') {
    const c = S.R.crits[p.code]; if (!c) return '';
    const aa = c.aas[0] || '', pu = S.pitch && S.R.aaMap[aa];
    body = '<span class="kicker o">' + t('À démontrer · ') + esc(t(CRIT_STATUS[c.status])) + '</span><h2>' + esc(c.label) + '</h2>' + (c.label_en && c.label_en !== c.label ? '<p class="mut sm-t">' + esc(c.label_en) + '</p>' : '') +
      '<div class="meta">' + (compOfAA(aa) ? '<span><b>' + esc(compOfAA(aa)) + '</b> ' + esc((compTitle(compOfAA(aa)) || '').slice(0, 70)) + '</span>' : '') + c.aas.map(a => '<a href="#" data-act="aa-go" data-c="' + esc(a) + '">' + esc(aaTitle(a)) + '</a>').join('') + '</div>' +
      '<h3 class="gh">' + t('Prochaine chance') + '</h3><p>' + stPill(c.status) + ' ' + esc(nextText(c)) + '</p>' +
      '<h3 class="gh">' + t('Cours qui l\'évaluent · ') + c.evalUnits.length + '</h3><ul class="crit">' + c.evalUnits.map(u => { const uf = S.R.unitFuture[u], du = unitOf(u); return '<li class="' + (uf.events.length ? 'planned' : uf.open ? 'later' : 'notyet') + '"><b>' + esc(u) + ' · ' + esc(unitTitle(u)) + '</b><em>' + esc([du.type, du.sem].filter(Boolean).join(' · ')) + ' · ' + (uf.events.length ? plural(uf.events.length, 'séance') + t(' à venir, la prochaine ') + esc(fwhen(uf.events[0].start)) : uf.allPast ? t('séances terminées') : uf.open ? t('pas encore dans l\'agenda') : t('semestre passé')) + (du.moodle ? ' · <a href="' + esc(du.moodle) + '" target="_blank" rel="noopener">' + t('Moodle ↗') + '</a>' : '') + '</em></li>'; }).join('') + (c.evalUnits.length ? '' : '<li class="lost"><b>' + t('Aucun cours ne l\'évalue dans le syllabus') + '</b></li>') + '</ul>' +
      (c.contribUnits.length ? '<p class="mut sm-t">' + t('Contribue sans évaluer : ') + esc(c.contribUnits.join(', ')) + '</p>' : '') +
      codesPitch(c) +
      (c.inPitch ? '<h3 class="gh">' + t('Historique PITCH') + '</h3><ul class="crit">' + (pu && pu.det ? pu.det.crits.filter(x => x.code === c.code).flatMap(x => x.sessions).map(s => '<li class="' + (s.st === 1 ? 'ok' : s.st === 4 ? 'later' : 'lost') + '"><b>' + esc(s.title || s.code) + '</b><em>' + esc(s.sem) + (s.group ? ' · ' + esc(s.group) : '') + ' · ' + (s.st === 1 ? t('démontré') : s.st === 4 ? t('séance à venir') : t('non démontré')) + '</em></li>').join('') : '') + '</ul>' : '<p class="mut sm-t">' + t('Non encore vu dans PITCH.') + '</p>');
  }
  return '<aside class="panel"><button class="close" data-act="close">' + t('Fermer') + '</button>' + body + '</aside>';
}

/* ---------------- CSV ---------------- */
function csv() {
  const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  let rows, name;
  if (S.view === 'compas') {
    rows = [['Critere', 'Libelle', t('Acquis'), 'Titre acquis', 'Competence', 'Semestre', 'Cours evaluateurs', 'Mon etat', t('Prochaine chance')].join(';')];
    compasMatches().forEach(code => { const d = S.dataset.crits[code], aa = d.aas[0] || '', a = S.dataset.aas[aa] || {}, c = S.R.crits[code]; rows.push([code, d.label_fr || d.label_en, aa, a.title_fr || a.title_en || '', a.comp || '', a.sem || '', d.eval.join(' '), c && S.pitch ? t(CRIT_STATUS[c.status]) : '', c && c.status !== 'ok' ? nextText(c) : ''].map(q).join(';')); });
    name = 'compas';
  } else if (S.view === 'acquis' || S.view === 'traj' || S.view === 'chg') {
    rows = [['Code', t('Acquis'), 'Matiere', 'Bloc', 'Semestres', 'Verdict', 'Pourcentage', 'Sans seance', 'Rattrapables', 'Criteres sans seance', 'Prochaine seance', t('Mon suivi'), 'Ma note'].join(';')];
    aaList().forEach(a => { const n = S.notes[a.code] || {}; rows.push([a.code, a.title, a.subject, a.bloc, a.semsT.join(' '), AA_VERDICT[a.verdict].label, a.pct == null ? '' : String(Math.round(a.pct * 10) / 10).replace('.', ','), a.lost == null ? '' : a.lost, a.chance == null ? '' : a.chance,
      a.critStates.filter(c => c.status === 'lost').map(c => c.label).join(' | '), a.nextEv ? fwhen(a.nextEv.start) + ' ' + a.nextEv.unit : '', t(TAGS[n.t]) || '', n.n || ''].map(q).join(';')); });
    name = 'acquis';
  } else {
    rows = [['Critere', 'Libelle', t('Acquis'), 'Titre acquis', 'Competence', 'Statut', t('Prochaine chance'), 'Date', t('Cours'), 'Semestre', 'Deja tente'].join(';')];
    S.R.chances.forEach(x => rows.push([x.crit.code, x.crit.label, x.aa, x.aaTitle, x.comp, t(CRIT_STATUS[x.status]), nextText(x.crit), x.when ? new Date(x.when).toLocaleString(LOC(), { timeZone: 'Europe/Paris' }) : '', x.unit, x.sem, x.crit.attempted ? 'oui' : 'non'].map(q).join(';')));
    name = 'prochaine-chance';
  }
  const b = new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const u = URL.createObjectURL(b), x = document.createElement('a'); x.href = u; x.download = 'pitch-plus-v' + VER + '-' + name + '.csv'; x.click(); setTimeout(() => URL.revokeObjectURL(u), 3000);
}

/* ---------------- interactions ---------------- */
root.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, F = S.f;
  if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  if (act === 'reload') return location.reload();
  if (act === 'view') { S.view = el.dataset.v; S.panel = null; return render(); }
  if (act === 'goto') { S.view = el.dataset.v; if (el.dataset.st != null) F.st = el.dataset.st; if (el.dataset.bloc) F.bloc = el.dataset.bloc; if (el.dataset.cst != null) { F.cst = el.dataset.cst; F.grp = 'seance'; } S.panel = null; return render(); }
  if (act === 'week') { const d = parseInt(el.dataset.d, 10); S.week = d === 0 ? 0 : S.week + d; return render(); }
  if (act === 'tog') { F[el.dataset.k] = el.dataset.v === '1'; return render(); }
  if (act === 'moodle') { e.stopPropagation(); window.open(el.dataset.href, '_blank', 'noopener'); return; }
  if (act === 'ev') { S.panel = { type: 'ev', uid: el.dataset.uid }; return render(); }
  if (act === 'crit') { S.panel = { type: 'crit', code: el.dataset.c }; return render(); }
  if (act === 'aa') { S.open[el.dataset.c] = !S.open[el.dataset.c]; return render(); }
  if (act === 'aa-go') { S.view = 'acquis'; F.q = el.dataset.c; F.st = ''; F.bloc = ''; F.sem = ''; F.subj = ''; S.open[el.dataset.c] = true; S.panel = null; return render(); }
  if (act === 'opengrp') { const k = 'g:' + el.dataset.k; S.open[k] = !S.open[k]; return render(); }
  if (act === 'close') { S.panel = null; return render(); }
  if (act === 'cst') { F.cst = el.dataset.v; return render(); }
  if (act === 'lang') { S.lang = el.dataset.v === 'en' ? 'en' : 'fr'; S.prefs.lang = S.lang; store.set({ [K.PREFS]: S.prefs }); setLocale(LOC()); document.documentElement.lang = S.lang; recompute(); return render(); }
  if (act === 'klvl') { F.k.lvl = el.dataset.v; F.k.max = 60; return render(); }
  if (act === 'kmore') { F.k.max += 60; return render(); }
  if (act === 'kclear') { F.k = { q: '', comp: '', sem: '', st: '', dom: '', lvl: F.k.lvl, max: 60 }; return render(); }
  if (act === 'openu') { const k = 'u:' + el.dataset.k; S.open[k] = !S.open[k]; return render(); }
  if (act === 'grp') { F.grp = el.dataset.v; return render(); }
  if (act === 'clearf') { F.st = ''; F.sem = ''; F.subj = ''; F.bloc = ''; F.q = ''; return render(); }
  if (act === 'csv') return csv();
  if (act === 'print') return window.print();
  if (act === 'tag') { e.stopPropagation(); const c = el.dataset.a, n = S.notes[c] || {}; n.t = n.t === el.dataset.t ? '' : el.dataset.t; S.notes[c] = n; store.set({ [K.NOTES]: S.notes }); return render(); }
  if (act === 'reset-snap') { takeSnapshot(); S.diff = null; store.set({ lastDiff: null }); return render(); }
  if (act === 'refresh-pitch') { if (S.demo) return toast('Mode démo : PITCH fictif.'); return refreshPitch(false); }
  if (act === 'refresh-ics') { if (S.demo) return toast('Mode démo : agenda fictif.'); return refreshIcs(); }
  if (act === 'ics-save') { const v = (document.getElementById('icsurl') || {}).value || ''; if (!isIcsUrl(v)) return toast('Lien non reconnu : il doit venir de planning.icam.fr et finir par .ics?…'); return refreshIcs(v.trim()); }
  if (act === 'ics-clear') { if (isExt) await chrome.runtime.sendMessage({ type: 'ics:clear' }); S.icsUrl = ''; S.cal = null; S.icsAt = ''; S.icsErr = ''; recompute(); return render(); }
  if (act === 'pitch-clear') { await store.remove([K.PITCH]); toast('Cache PITCH vidé. Clique « Actualiser » pour relire.'); return; }
  if (act === 'wipe') { await store.remove([K.PITCH, K.ICS_URL, K.ICS_TEXT, K.ICS_AT, K.ICS_ERR, K.SNAP, K.NOTES, K.PREFS, 'lastDiff']); if (isExt) await chrome.runtime.sendMessage({ type: 'ics:clear' }); return location.reload(); }
  if (act === 'open-pitch') { if (isExt) { const t = await getPitchTab(true); if (t) chrome.tabs.update(t.id, { active: true }); } return; }
  if (act === 'agenda-only') { S.view = 'agenda'; recompute(); return render(); }
});
root.addEventListener('input', e => {
  const el = e.target.closest('[data-act]');
  if (el && el.dataset.act === 'f' && el.dataset.k === 'q') { S.f.q = el.value; render(); }
  if (e.target.id === 'cq') { S.f.cq = e.target.value; render(); }
  if (e.target.id === 'kq') { S.f.k.q = e.target.value; S.f.k.max = 60; render(); }
});
root.addEventListener('change', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'f' && el.tagName === 'SELECT') { S.f[el.dataset.k] = el.value; render(); }
  if (el.dataset.act === 'kf') { S.f.k[el.dataset.k] = el.value; S.f.k.max = 60; render(); }
  if (el.dataset.act === 'note') { const c = el.dataset.a, n = S.notes[c] || {}; n.n = el.value; S.notes[c] = n; store.set({ [K.NOTES]: S.notes }); }
});
root.addEventListener('keydown', e => { if (e.key === 'Escape' && S.panel) { S.panel = null; render(); } });

boot();
