# PITCH+ v6

**Extension Chrome pour les étudiants Icam : ton agenda, ta prochaine chance, ta trajectoire 70 %.**
Relie trois sources que l'école fournit séparément : **Hyperplanning** (quand a lieu un cours), le **syllabus** (quels critères chaque cours évalue) et **PITCH** (quels critères tu as déjà démontrés).

Par Thomas Pitaval, Icam Lille, Bachelor International promo 2030 · open source · v7.3.2 · [changelog](docs/CHANGELOG.md)

## Promesse

| Question | Écran | Ce qu'il montre |
|---|---|---|
| Qu'est-ce qui arrive ? | **Agenda** | Chaque séance Hyperplanning annotée : `n à démontrer`, `m démontrés`, `k contribue`. TE et phases de PBL identifiés. Clic → critères, acquis, compétence, Moodle. |
| Où est ma prochaine chance ? | **Prochaine chance** | **Une ligne par séance à venir** : la date, le cours, et le nombre de critères à y démontrer. En bas, ce qui n'a plus aucune séance (⚠ requalification). Regroupement au choix par séance, cours ou compétence, ou tout en liste. CSV. |
| Suis-je sur la trajectoire ? | **Trajectoire 70 %** | Jauge de l'année (démontré / daté / à venir / pas encore enseigné / perdu), projection meilleur / pire cas, par compétence, par semestre. Seuil 50 / 100 % par acquis avec la lecture alternative toujours visible. |

Interface en **français ou en anglais** (réglages), intitulés du syllabus dans la langue choisie. Cinq onglets : **Aujourd'hui**, **Agenda**, **Prochaine chance**, **Trajectoire 70 %**, et **Compas**, l'explorateur du syllabus (recherche plein texte, filtres par compétence, semestre, domaine et état, en critères, acquis ou cours). Le reste (Acquis par compétence, Changements, Diagnostic, Réglages) est derrière **Plus**. Hérité de v5.3 : filtres, recherche, notes personnelles, symboles ⚠ / ↻, export CSV, impression.

## Garanties de confidentialité

- **Aucun identifiant, jamais.** PITCH est lu via la session déjà ouverte dans ton onglet, en lecture seule (GET uniquement).
- **Zéro serveur, zéro compte, zéro télémétrie, zéro IA à l'exécution.** Tout reste dans ton navigateur.
- Le lien iCal Hyperplanning contient un secret : stocké localement, masqué à l'affichage, jamais exporté.
- Détail : [docs/PRIVACY.md](docs/PRIVACY.md). Le script d'empaquetage refuse tout `POST`/`PUT`, tout hôte inattendu et tout token dans les sources.

## Installation (mode développeur)

1. Télécharge `dist/pitchplus-v6.0.0.zip` et décompresse-le (ou utilise le dossier `extension/`).
2. Chrome → `chrome://extensions` → active **Mode développeur** → **Charger l'extension non empaquetée** → choisis le dossier.
3. Clique l'icône **P+** : le tableau de bord s'ouvre. Ouvre PITCH et connecte-toi si demandé.
4. Réglages ⚙ → colle ton **lien d'abonnement iCal** Hyperplanning (Exporter → Lien d'abonnement).

Page d'installation courte : [docs/install.html](docs/install.html). Mode démo sans aucune donnée réelle : icône → ⚙ → *Ouvrir le mode démo* (ou `app/app.html?demo=1`).

## Architecture

```
Hyperplanning (ICS) ──▶ service worker ─── chrome.storage.local ◀── content script ◀── PITCH API (session)
        │  DESCRIPTION.Matière                                              │  locdetail / LearningGoal
        ▼  normUnit + aliases.json                                          ▼  TraitCode
   code d'unité  ◀────── data/syllabus.<PROG>.json (Excel + PDF) ──────▶  code de critère
        │                          généré par tools/build_data.py            │
        └──────────────────────────  lib/engine.js  ◀────────────────────────┘
                     statut par critère · prochaine chance · jauge 70 % · verdict par acquis
                                          │
                                   app/app.html (onglet plein écran)
```

- `extension/` — Manifest V3, sans framework ni dépendance : `sw.js` (ICS, alarme quotidienne), `content/pitch.js` (GET API PITCH), `app/` (tableau de bord), `lib/` (modules purs : `ics.js`, `units.js`, `pitch.js` porté de v5, `engine.js`, `store.js`), `data/` (datasets + `aliases.json`), `demo/`.
- `tools/build_data.py` — Excel `Mapping_LG_Course` + PDF syllabus → JSON, avec statistiques de contrôle. Python 3 stdlib ; texte du PDF extrait par PDFKit (macOS) ou fourni via `--pdf-text`.
- `tools/coverage_report.py` — taux d'appariement d'un ICS avec le dataset ([rapport réel](docs/reports/coverage-ics.md) : 174 / 176 séances académiques).
- `tools/make_demo.py` — jeu de démo (ICS synthétique + réponses PITCH fictives). `tools/package.py` — vérifications strictes + zip.
- `tests/run.html` — tests unitaires dans le navigateur (parseur ICS, normalisation, port v5, moteur). Ouvrir via un serveur statique : `python3 -m http.server 8765` puis `http://localhost:8765/tests/run.html`.
- `fixtures/public/` — démo ; `fixtures/private/` — données réelles, **hors dépôt** (`.gitignore`).
- `legacy-v5/` — PITCH+ v5.3 (bookmarklet) pour référence.

## Régénérer les données pour une nouvelle année ou un nouveau programme

```bash
python3 tools/build_data.py --xlsx "data/sources/Mapping_LG_Course BACHELOR 2026-2027.xlsx" \
  --pdf data/sources/Syllabus_BI_2027-2028.pdf --program BI --out extension/data/syllabus.BI.json
python3 tools/coverage_report.py --ics fixtures/private/Edt_<NOM>.ics --data extension/data/syllabus.BI.json --md docs/reports/coverage-ics.md
python3 tools/make_demo.py --data extension/data/syllabus.BI.json --out fixtures/public && cp fixtures/public/* extension/demo/
python3 tools/package.py
```

Pour un autre programme : même Excel (même format), `--program <CODE>` tel que PITCH le renvoie dans `/api/Program`, et une ligne dans `extension/data/index.json`. Si un cours Hyperplanning n'apparaît pas dans le syllabus, ajouter un alias dans `extension/data/aliases.json` (le Diagnostic de l'app liste les non-appariés).

## Règles métier (telles que comprises)

- Critère : démontré ou non (binaire). Acquis (AA) validé à ≥ 50 % de ses critères (`MinPrgPct`, seuil de progression enregistré dans PITCH). Le seuil de 100 % (`MinAcqPct`) n'est plus proposé dans l'interface depuis la 7.3.
- Seuil de 70 % lu **sur l'ensemble du cursus** (les 8 semestres du Bachelor), lecture retenue avec Thomas en septembre 2026 ; la lecture par compétence est affichée à côté. Chaque année est montrée telle qu'elle se présentait à sa fin : un critère rattrapé après reste en vert clair dans son année d'origine, et le rattrapage est crédité en texte à l'année où il a eu lieu. **Ambiguïté institutionnelle : l'outil n'arbitre pas.**
- Statut d'un critère non démontré : *daté* (une séance à venir dans l'agenda l'évalue), *à venir* (un cours d'un semestre ≥ courant l'évalue, sans date, ou PITCH annonce une séance), *perdu* (aucun des deux → requalification), *pas encore enseigné* (jamais tenté, tous ses cours dans des semestres futurs : hachuré, jamais compté en retard).
- Verdict d'un acquis : validé / ⚠ requalification (au moins un critère perdu) / ↻ rattrapage (critères manqués mais rattrapables) / en cours / pas commencé.
- Le planning de requalification envoyé par le campus n'est ni lu ni présenté comme une validation.

## Limites connues

- Jointures vérifiées sur compte réel le 9 septembre 2026 ([rapport](docs/reports/pitch-join.md)) : `CourseCode` → unité 99,6 % (2 136/2 145 séances), `TraitCode` → critère 100 % (1 221/1 221). `MIA_EXP8` est la seule unité de PITCH absente du syllabus embarqué.
- Mapping cours × critères 2025-2026, syllabus 2026-2027 (98 critères sans cours dans l'Excel, 6 unités présentes seulement dans le PDF, 4 seulement dans l'Excel). Demander l'Excel 2026-2027 à l'école.
- Firefox : non testé (MV3 compatible sur le principe).

## Contact

pitproductionpro@gmail.com · thomas.pitaval@2030.icam.fr · pitproduction.com
Outil étudiant non officiel, sans lien avec l'éditeur de PITCH ni avec l'Icam.
