# PITCH+

**Extension Chrome pour les étudiants Icam : ton agenda, ta prochaine chance, ta trajectoire 70 %.**
Relie trois sources que l'école fournit séparément : **Hyperplanning** (quand a lieu un cours), le **syllabus** (quels critères chaque cours évalue) et **PITCH** (quels critères tu as déjà démontrés).

Par Thomas Pitaval, Icam Lille, Bachelor International promo 2030 · open source · v1.7.3.2 · [changelog](docs/CHANGELOG.md)

**[Télécharger PITCH+ (zip)](https://github.com/pitavaldev/pitchplus/releases/latest/download/pitchplus.zip)** · [guide d'installation en français et en anglais](docs/install.html)

## Promesse

| Question | Écran | Ce qu'il montre |
|---|---|---|
| Qu'est-ce qui arrive ? | **Agenda** | Chaque séance Hyperplanning avec le nombre de critères à y démontrer, la phase de PBL ou le TE, et un bouton Moodle vers la page du cours. Clic → critères, acquis, compétence. |
| Où est ma prochaine chance ? | **Prochaine chance** | **Une ligne par séance à venir** : la date, le cours, et le nombre de critères à y démontrer. En bas, ce qui n'a plus aucune séance (⚠ sans séance). Regroupement au choix par séance, cours ou compétence, ou tout en liste. CSV. |
| Suis-je sur la trajectoire ? | **Trajectoire 70 %** | Jauge sur l'ensemble du Bachelor (démontré / prévu / à venir / pas encore enseigné / sans séance), critères manquants pour atteindre 70 %, lecture année par année telle qu'à sa fin, et par compétence. |
| Où est ce critère ? | **Compas** | Explorateur du syllabus : recherche plein texte, filtres par compétence, semestre, domaine et état, en critères, acquis ou cours. CSV. |

Interface en **français ou en anglais** (réglages), intitulés du syllabus dans la langue choisie. Cinq onglets : **Aujourd'hui**, **Agenda**, **Prochaine chance**, **Trajectoire 70 %**, **Compas**. Le reste (Acquis par compétence, Changements, Diagnostic, Réglages) est derrière **Plus**. Notes personnelles sur les acquis, export CSV, impression.

## Garanties de confidentialité

- **Aucun identifiant, jamais.** PITCH est lu via la session déjà ouverte dans ton onglet, en lecture seule (GET uniquement).
- **Zéro serveur, zéro compte, zéro télémétrie, zéro IA à l'exécution.** Tout reste dans ton navigateur.
- Le lien iCal Hyperplanning contient un secret : stocké localement, masqué à l'affichage, jamais exporté.
- Détail : [docs/PRIVACY.md](docs/PRIVACY.md). Le script d'empaquetage refuse tout `POST`/`PUT`, tout hôte inattendu et tout token dans les sources.

## Installation (mode développeur, deux minutes)

Pas de Chrome Web Store : l'extension se charge depuis un dossier. Chrome, Edge, Brave et Arc.

1. Télécharge [pitchplus.zip](https://github.com/pitavaldev/pitchplus/releases/latest/download/pitchplus.zip) et décompresse-le. Garde le dossier `pitchplus` à un endroit où il restera (si tu le supprimes, l'extension s'arrête).
2. `chrome://extensions` → active **Mode développeur** (en haut à droite) → **Charger l'extension non empaquetée** → choisis le dossier `pitchplus`.
3. Connecte-toi à PITCH dans un onglet, puis clique l'icône **P+** dans la barre d'outils (pièce de puzzle, puis l'épingle). Le tableau de bord s'ouvre.
4. Réglages → colle ton **lien d'abonnement iCal** Hyperplanning (Exporter → Lien d'abonnement iCal). Ce lien contient une clé secrète : il reste sur ton ordinateur.

Guide illustré : [docs/install.html](docs/install.html). Mise à jour : remplace le contenu du dossier par le nouveau zip, puis ⟳ sur la carte PITCH+ dans `chrome://extensions`. Mode démo sans aucune donnée réelle : Réglages → *Ouvrir le mode démo* (ou `app/app.html?demo=1`).

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
- `fixtures/public/` — démo ; `fixtures/private/` — données réelles, **hors dépôt** (`.gitignore`), comme les documents source de l'école (`data/sources/`) et la clé de signature.

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

- Critère : démontré ou non (binaire). Acquis (AA) validé à ≥ 50 % de ses critères (`MinPrgPct`, seuil de progression enregistré dans PITCH).
- Seuil de 70 % lu **sur l'ensemble du cursus** (les 8 semestres du Bachelor), lecture retenue avec Thomas en septembre 2026 ; la lecture par compétence est affichée à côté. Chaque année est montrée telle qu'elle se présentait à sa fin : un critère rattrapé après reste en vert clair dans son année d'origine, et le rattrapage est crédité en texte à l'année où il a eu lieu. **Ambiguïté institutionnelle : l'outil n'arbitre pas.**
- Statut d'un critère non démontré : *séance prévue* (une séance à venir dans l'agenda l'évalue), *cours à venir* (un cours d'un semestre ≥ courant l'évalue, sans date, ou PITCH annonce une séance), *sans séance* (aucun des deux), *pas encore enseigné* (jamais tenté, tous ses cours dans des semestres futurs : hachuré, jamais compté en retard).
- Verdict d'un acquis : validé / ⚠ requalification (au moins un critère sans séance) / ↻ rattrapage (critères manqués mais rattrapables) / en cours / pas commencé. Le mot « requalification » est réservé aux acquis.
- Le planning de requalification envoyé par le campus n'est ni lu ni présenté comme une validation.

## Limites connues

- Jointures vérifiées sur compte réel le 9 septembre 2026 ([rapport](docs/reports/pitch-join.md)) : `CourseCode` → unité 99,6 % (2 136/2 145 séances), `TraitCode` → critère 100 % (1 221/1 221). `MIA_EXP8` est la seule unité de PITCH absente du syllabus embarqué.
- Mapping cours × critères 2025-2026, syllabus 2026-2027 (98 critères sans cours dans l'Excel, 6 unités présentes seulement dans le PDF, 4 seulement dans l'Excel). Demander l'Excel 2026-2027 à l'école.
- Firefox : non testé (MV3 compatible sur le principe).

## Contact

thomas.pitaval@2030.icam.fr · pitproductionpro@gmail.com · [issues GitHub](https://github.com/pitavaldev/pitchplus/issues)
Outil étudiant non officiel, sans lien avec l'éditeur de PITCH ni avec l'Icam. PITCH+ déduit, il ne décide pas : vérifie avec ton responsable de matière avant toute inscription à une requalification.
