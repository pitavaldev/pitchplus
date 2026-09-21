# PITCH+ v6 — Prompt de construction

> À coller tel quel dans une nouvelle session (Claude Code ou Cowork), avec les fichiers listés en §11 joints.
> Rédigé par Thomas Pitaval, Icam Lille, Bachelor International (promo 2030) — septembre 2026.

---

## 0. Ce que tu dois construire, en une phrase

Une **extension de navigateur (Chrome, Manifest V3), 100 % côté client, sans serveur**, qui relie trois sources que l'école fournit séparément — **Hyperplanning** (quand a lieu un cours), le **syllabus** (quels critères de compétence chaque cours évalue) et **PITCH** (quels critères l'étudiant a déjà démontrés) — pour répondre à trois questions que l'étudiant ne peut pas se poser aujourd'hui sans ouvrir quatre outils :

1. **Qu'est-ce qui arrive ?** — mon agenda, chaque cours annoté avec les critères qui y seront évalués et mon état actuel sur chacun.
2. **Où est ma prochaine chance ?** — pour chaque critère manquant, le prochain cours daté qui l'évalue à nouveau, ou l'alerte « aucun cours à venir → requalification ».
3. **Suis-je sur la trajectoire du diplôme ?** — jauge globale de l'année : critères démontrés / à venir / perdus, projection de fin d'année contre le seuil de 70 %.

Les trois sont **à égalité de priorité** dans le MVP.

Ce projet est la **v6** d'un outil existant, **PITCH+** (v5.3, bookmarklet, source jointe), dont toute la logique métier est à reprendre, pas à réinventer.

---

## 1. Contexte et intention

L'Icam est une école d'ingénieurs française (campus Lille, Nantes, Toulouse, Paris, Vannes, Strasbourg, plus Afrique et Amérique latine). Le Bachelor International (BI) est un cursus par compétences, en anglais, 3 ans + 2 semestres préparatoires.

L'outillage étudiant est éclaté et vieillissant :

| Outil | Rôle | Éditeur / techno | Problème |
|---|---|---|---|
| **Académ** | ERP pédagogique de l'école : syllabus, maquettes, référentiel de compétences | RimaOne (`rima1.fr`), ASP.NET | Pas d'accès étudiant utile |
| **PITCH ePortfolio** | Suivi des compétences de l'étudiant (module d'Académ) | RimaOne, ASP.NET + AngularJS, `pitch-icam.rima1.fr` | UI confuse, pas de vue « que dois-je faire », pas de lien avec l'agenda |
| **Hyperplanning** | Emploi du temps | Index Éducation | Séances sans lien avec les compétences |
| **Syllabus** | Description de chaque unité de cours | PDF de 450 pages généré par Académ (JasperReports) + export Excel | Illisible, jamais consulté |
| **Moodle** | Supports de cours | `moodle.icam.fr` | Lien présent dans le syllabus, jamais exploité |

Objectif à terme : un outil tout-en-un que Thomas pourra **proposer à l'école** (direction Icam Lille puis national). La v6 reste une extension distribuée aux étudiants du BI ; l'architecture doit être **extensible à d'autres programmes** (ingénieur intégré, apprentissage) sans réécriture : programme et année sont des paramètres, pas des constantes.

**Ce que la v6 n'est pas** : ni un site avec comptes, ni un proxy de connexion. Un projet étudiant concurrent, *ACADEM Lite* (`academ-lite.ddns.net`, code partiel sur GitHub `EVilm1/ACADEM-lite-public`), demande à l'étudiant son mot de passe Icam et scrape côté serveur en Python. **C'est exactement le modèle à ne pas suivre** : on ne manipule jamais d'identifiant, on s'appuie sur la session déjà ouverte dans le navigateur de l'étudiant.

---

## 2. Modèle de données pédagogique (à comprendre avant de coder)

### 2.1 Hiérarchie

```
Compétence  C01 … C13                        (13, transverses à tout le cursus)
 └─ RA   RA-EEE-C01-1                        (~95, « résultat d'apprentissage »)
     └─ AA   AA-EEE-C01-1-01  (semestre Bp.1) (~272–314 selon la source, « acquis d'apprentissage »)
         └─ CRIT  CRIT_0001, CRIT_SC_0042…   (~716 actifs, ~1 336 avec l'historique)
```

- Format d'un code AA : `AA-<DOMAINE>-C<bloc>-<n°RA>-<n°AA>`. Domaines : `EEE` (électronique), `ESE` (énergétique), `MME` (mécanique/matériaux), `MIA` (maths/info), `MEO` (management), `HUM` (humanités/langues), `ERD`, `PROJET`.
- Chaque AA est **rattachée à un semestre** (`Bp.1`, `Bp.2`, `B1.1`, `B1.2`, `B2.3`, `B2.4`, `B3.5`, `B3.6`, dans cet ordre, `ProgramSerie` 1→8 dans PITCH).
- Un critère peut appartenir à plusieurs AA, et surtout **être évalué dans plusieurs unités de cours différentes** (505 des 1 142 occurrences dans le syllabus 2026-2027). C'est ce qui rend un rattrapage possible sans requalification.
- Préfixes de critères observés : `CRIT_`, `CRIT_SC_`, `CRIT_HUM_`, `CRIT_KH_`, `CRIT_CV_`, `CRIT_CV`, `CRIT_CM_`, `CRIT_OC_`, `CRIT_GC_`, `CRIT_LLF_`, `CRIT_NM_`, `CRIT_VM_`, `CRIT_HUM_YLT_`, suffixe `-NM` possible. Ne jamais parser le préfixe ; traiter le code comme une chaîne opaque.

### 2.2 Unités de cours

Code `<DOMAINE>_<TYPE><n>` : `EEE_PBL1`, `MME_EXP3`, `HUM_FL2`, `CROSS_PP5`, `CROSS_MIA-EEE_PBL1`, `CROSS_Hackathon`… (189–191 unités, 2026-2027). Chaque unité a : type (`Lecture` 78, `PBL` 58, `Project` 34, `Labs` 12, `Company` 3, `MOOC` 2, `ERD` 1), semestre, heures (FTF / STD / TLH), langue, enseignants, lien Moodle, **liste des AA et des critères qu'elle évalue**. Les 58 PBL ont un découpage par séance : *Go Phase → self study → Lab → Return Phase → Capitalisation* (+ parfois *Exam*, *Tutorials*).

Modalité d'évaluation quasi universelle : « During activity, When spotted » — le critère est validé par l'enseignant quand il est observé, il n'y a pas de note.

### 2.3 Règles de validation (telles que comprises — la direction est floue, voir §7)

- Un **critère** est *démontré* ou non (binaire).
- Une **AA** est validée si **≥ 50 %** de ses critères sont démontrés. PITCH porte deux champs par AA : `MinPrgPct = 50` (« progression suffisante ») et `MinAcqPct = 100` (« acquis complet »). Le 50 % correspond à `MinPrgPct`.
- Pour **passer l'année et obtenir le diplôme** : **≥ 70 % de l'ensemble des critères** de l'année, toutes compétences confondues (lecture « globale », confirmée par Thomas ; une lecture « 70 % par compétence » circule aussi — l'outil doit pouvoir afficher les deux).
- Un critère non démontré peut être :
  - **rattrapable** : un cours à venir (dans Hyperplanning ou dans un semestre futur du syllabus) l'évalue à nouveau ;
  - **perdu** : aucun cours à venir ne l'évalue → il faut une **session de requalification** dédiée (organisée par le campus, planning envoyé par mail à tous les étudiants, non personnalisé).
- Les critères des semestres futurs ne sont ni « manquants » ni « perdus » : ils sont *pas encore enseignés*. Visuellement, toujours hachurés, jamais colorés.

### 2.4 Statuts d'un critère pour un étudiant (à reprendre de PITCH+ v5)

| Statut | Définition | Symbole v5 |
|---|---|---|
| `ok` | démontré (au moins une séance `CourseStatus = 1`) | — |
| `fut` | non démontré, au moins une séance future (`CourseStatus = 4`) | hachures |
| `lost` | non démontré, aucune séance future | selon l'AA : ⚠ ou ↻ |

Au niveau AA, verdict : `ok` (seuil atteint), `soon` (en cours, séances à venir), `wait` (pas commencé), `rat` **rattrapage** ↻ (critères perdus mais l'AA est encore « vivante » : son dernier semestre > semestre courant), `req` **requalification** ⚠ (critères perdus et AA échue). Le semestre courant `serieMax` = max `ProgramSerie` des séances réelles observées.

**La v6 doit remplacer la notion « séance future dans PITCH » par « séance datée dans Hyperplanning + unité future dans le syllabus »**, ce qui est bien plus précis : on connaît la date, le cours, la salle.

---

## 3. Sources de données et accès

### 3.1 PITCH (API REST JSON, session cookie, lecture seule)

Base : `https://pitch-icam.rima1.fr`. Appels avec `credentials: 'include'` depuis l'origine PITCH (content script). Aucune authentification à gérer : l'étudiant est déjà connecté. Endpoints observés et exploités par PITCH+ v5 (septembre 2026, à re-vérifier) :

| Endpoint (tel qu'appelé par v5) | Rôle | Champs utiles |
|---|---|---|
| `/api/Program?culture=fr-fr` | Programme et sous-programmes (semestres) | `ProgramCode` (`BI`), `VersionCode`, `SousPrograms[]` : `Code`, `Title`, `Serie` (ordre 1→8) |
| `/api/SkillBlock?ProgramCode=BI&VersionCode=…&culture=fr-fr&simpleversion=false` | Les 13 compétences | `Code` (`C01`…), `Title` |
| `/api/LearningGoal?BlockCode=C01&Graph=Bar&…` | RA d'une compétence | `LGCode` |
| `/api/LearningGoal?BlockCode=C01&LGCode=<RA>&Graph=Bar&…` | AA d'un RA | `Code`, `Title`, `Progress` (%), `ProgramList[].ProgramCode` (semestres), `MinAcqPct` = 100, `MinPrgPct` = 50 |
| `/api/locdetail?ParentProgramCode=BI&LGCode=<RA>&LOCode=<AA>&culture=fr-fr` | **Détail par critère d'une AA** | `TraitCode`, `CourseList[]` : `CourseStatus` (1 démontré, 4 séance future, autre = passé non démontré), `GroupCode` (« Semestre 2 de l'année 2024-2025 »), `ProgramSerie`, `ProgramTitle`, `Title`, `CourseCode` |
| `/api/careerLG`, `/api/graphdata`, `/api/StudentCursusEx` | Vues agrégées | secondaires, non utilisées en v5 |

`UserId` est une globale de la page PITCH (identifiant étudiant, utile pour clé de stockage). `ParentProgramCode` doit être le code du programme racine (`BI`), pas d'un sous-programme (sinon 500). 278 AA pour Thomas ; l'appel `locdetail` est nécessaire pour **toutes** (pool de concurrence 6, ~20 s). Le `CourseCode`/`Title` des séances doit contenir le code d'unité (`EEE_PBL1`) — **à vérifier en premier**, c'est la clé de jointure côté PITCH. Voir `load()` / `deepen()` / `analyse()` dans `pitchplus.src.js` pour la séquence exacte.

### 3.2 Hyperplanning (iCal) — format vérifié sur le flux réel de Thomas (4 sept. 2026)

L'étudiant dispose d'un **lien d'abonnement ICS** personnel, de la forme :

```
https://planning.icam.fr/Telechargements/ical/Edt_<NOM>.ics?version=2025.8.10.1&icalsecurise=<token hex 96 car.>&param=<hex>
```

- `icalsecurise` est un **secret** : quiconque a l'URL lit l'emploi du temps. Stocker uniquement dans `chrome.storage.local`, jamais dans un log, un export, un rapport de bug ou une fixture publiée. Masquer le token dans l'UI (`…71B2`).
- `param` est de l'ASCII encodé en hex ; sur le lien de Thomas il vaut `d=[1..62]&fh=1&f=1` (vraisemblablement une fenêtre de jours). Utiliser l'URL telle que copiée par l'étudiant, sans la modifier ; noter l'hypothèse pour plus tard.
- Le flux est **public sans cookie** (`fetch` simple depuis le service worker), généré par « HYPERPLANNING 2026 (Index-Éducation) », `METHOD:PUBLISH`, couvre l'année (`X-CALSTART` 17/08/2026 → `X-CALEND` 15/08/2027), pèse > 60 Ko, dates en **UTC** (`20261012T154500Z`) à convertir en Europe/Paris, lignes **pliées à 75 caractères** (continuation = ligne commençant par un espace), virgules échappées `\,`.
- `UID:Cours-<id>-<n>-<NOM_Prénom>-Index-Education` — stable, à utiliser comme clé d'événement.
- Les promotions de l'étudiant sont dans `X-WR-CALNAME` : `LIL-B2`, `<LIL-B2> <TP> 2`, `<LV2> ESP1`, `<PROJET> P3`, `<TD> TD1` → campus `LIL`, année `B2` (donc semestres `B2.3` / `B2.4`), groupes.

**Chaque `VEVENT` porte une `DESCRIPTION` structurée — c'est elle qu'il faut parser, pas le `SUMMARY`** :

```
Type : PBL                                   ← PBL | Temps expert | Evaluation | (absent pour RIM, Accueil, Sport…)
Matière : MEO PBL8 - Product innovation      ← code Hyperplanning + libellé
Enseignant : ESCARE                          ← ou « Enseignants : A, B »
Salle : LIL-LAC3.01 (78) (BP)                ← ou « Salles : … »
Promotion : LIL-B2                           ← ou « Promotions : B3-LILLE, LIL-a2, LIL-B2 »
Mémo : Phase aller                           ← phase de PBL, optionnel
```

Le `SUMMARY` est la concaténation `Type - Matière - Enseignant(s) - Promotion(s) - Mémo`, avec des segments optionnels : ambigu à découper, ne s'en servir qu'en repli.

Valeurs observées :

| Champ | Valeurs |
|---|---|
| `Type` | `PBL`, `Temps expert` (= cours magistral d'une unité `EXP`), `Evaluation` (= le **TE** d'une unité `EXP`, ex. `Evaluation - EEE EXP7`) |
| `Mémo` (PBL) | `Lancement`, `Phase aller`, `Autonomie`, `Temps expert`, `Phase retour - discussion`, `Feedback`, `Evaluation`, `Capitalisation` |
| Hors syllabus | `RIM - Rencontres Icam Métier`, `Forum Icam Entreprises`, `Accueil`, `Sport`, `AUTONOMY - Independent study - Project`, `CROSSDISCIP BOAT - Transversal Project` |

**Les codes Hyperplanning ne sont pas identiques aux codes syllabus** (correction de l'hypothèse initiale « code exact ») :

| Hyperplanning (`Matière`) | Syllabus / Excel | Règle |
|---|---|---|
| `MEO PBL8`, `EEE EXP7`, `MIA PBL5` | `MEO_PBL8`, `EEE_EXP7`, `MIA_PBL5` | espace → `_` |
| `MEC-EEE Lab1` | `CROSS_MME-EEE_LAB1` | alias explicite (`MEC`→`MME`, préfixe `CROSS_`, casse) |
| `CROSSDISCIP BOAT - Transversal Project` | `CROSS_PP5`…`CROSS_PP8` (selon semestre) | alias + semestre courant |
| `RIM`, `Sport`, `Accueil`, `Forum` | — | ignorer (étiqueter « hors compétences ») |

Sur les 77 événements lus, 12 unités académiques distinctes, **12/12 appariées** après normalisation + 2 alias. Les libellés diffèrent souvent (`MEO PBL8 - Product innovation` vs `MEO_PBL8 - Innovation to apply to the boat`) : **ne jamais apparier sur le libellé**. Le rapport de non-appariés doit rester visible dans l'UI.

Séquence typique d'un PBL dans l'agenda (à exploiter pour la « prochaine chance ») : `Phase aller` → `Autonomie` → `Temps expert` → `Phase retour - discussion` → `Feedback` → `Evaluation` → `Capitalisation`. Les critères « During activity, When spotted » se démontrent surtout en `Phase retour`, `Feedback` et `Evaluation` ; l'`Evaluation` d'une unité `EXP` est le TE.

### 3.3 Syllabus — Excel de mapping (source principale, fourni par l'école)

Fichier `Mapping_LG_Course BACHELOR 2025-2026.xlsx` (joint ; demander la version 2026-2027 à l'école, même format attendu).

- Feuille **`Detailed view`** (4 287 lignes, 16 colonnes, pas d'en-tête, format long) — c'est celle à parser :

| Col | Contenu | Exemple |
|---|---|---|
| 0 | programme | `BI` |
| 1 | année | `2025-2026` |
| 2 | code RA | `RA-EEE-C01-1` |
| 3 | RA + compétence | `RA-EEE-C01-1 - C01` |
| 4 | compétence | `C01` |
| 5, 6 | code AA | `AA-EEE-C01-1-01` |
| 7 | (vide) | |
| 8 | **code unité de cours** (vide sur les lignes de définition) | `EEE_PBL1` |
| 9 | code + titre | `EEE_PBL1 - Mesures physiques` |
| 10 | titre | `Mesures physiques` |
| 11 | `Contribue` ou vide | voir ci-dessous |
| 12 | **code critère** | `CRIT_0001` |
| 13 | code + libellé | `CRIT_0001 - Appliquer la loi de Boucherot` |
| 14 | libellé | |
| 15 | flag `1`/`0` | |

  Lecture : 1 291 lignes sans unité = définition (AA × critère) ; 2 996 lignes avec unité = **mapping cours × critère**, dont 2 196 avec flag `1` (le cours **évalue** le critère) et 800 avec `Contribue` + flag `0` (le cours **y contribue** sans l'évaluer — à afficher différemment, ne compte pas pour un rattrapage). 189 unités, 1 238 critères mappés, 98 critères sans aucun cours.

- Feuille **`Main view`** : matrice unités (lignes, groupées par semestre `Bp, Bp.1`…) × critères (colonnes, groupées par RA/AA). Redondante avec `Detailed view` ; utile seulement pour le **semestre de chaque unité** (les lignes de titre `B2, B2.3` séparent les groupes).

- Libellés en **français** dans l'Excel, en **anglais** dans le PDF et dans PITCH (`culture=fr-fr` donne le français). Prévoir les deux langues, clé = code.

### 3.4 Syllabus — PDF (complément)

`Syllabus_BI_2026-2027.pdf`, 450 pages, texte extractible (`pdftotext -layout`), une fiche par unité avec : type, période, campus, domaines, langue, heures, enseignants + mails, **lien Moodle** (154 distincts), RA/AA, critères avec modalité, tableau des séances pour les PBL. N'en extraire que ce que l'Excel n'a pas : type, heures, langue, Moodle, enseignants, séances. Convertir **une fois** en JSON versionné, embarqué dans l'extension ; pas de parsing PDF à l'exécution.

### 3.5 Clé de jointure

```
Hyperplanning.DESCRIPTION["Matière"]  ──normalise+alias──▶  code unité  ◀──col 8──  Excel.Detailed view  ──col 12──▶  code critère  ◀──TraitCode──  PITCH.locdetail
```

Fonction `normUnit(s)` : majuscules, espace → `_`, puis table d'alias explicite (`MEC-EEE_LAB1 → CROSS_MME-EEE_LAB1`, `CROSSDISCIP_BOAT → CROSS_PP<n>`, suffixes `a`/`b`/`env`). Rapport des non-appariés visible dans l'UI (« 3 cours de ton agenda ne sont pas dans le syllabus »). Ne jamais matcher sur le libellé. Côté PITCH, vérifier que `CourseCode` des séances passe par la même normalisation.

---

## 4. Architecture

- **Extension Chrome MV3** (Firefox si le coût est nul). Composants :
  - `content script` sur `pitch-icam.rima1.fr` : exécute les appels API PITCH avec les cookies de session, renvoie le JSON brut au reste de l'extension (messaging). C'est la partie éprouvée de PITCH+ v5.
  - `service worker` : rafraîchit l'ICS (alarme quotidienne + à l'ouverture), calcule les jointures, stocke dans `chrome.storage.local` / IndexedDB.
  - `page d'application` (`app.html`, onglet plein écran ouvert depuis l'icône) : le tableau de bord. Pas de popup minuscule.
  - `data/` : `syllabus.<programme>.<année>.json` (généré par un script `build-data` à partir de l'Excel + PDF), embarqué.
- **Zéro serveur, zéro compte, zéro télémetrie, zéro appel IA à l'exécution.** Tout reste dans le navigateur de l'étudiant. L'extension ne fait jamais de `POST`/`PUT` vers PITCH. Écrire cette garantie dans le README et dans l'écran d'accueil.
- **Multi-programme** : `programCode` et `year` sont lus depuis PITCH (`/api/Program`) et sélectionnent le dataset ; si aucun dataset ne correspond, l'extension fonctionne en mode dégradé (PITCH + agenda sans mapping) et le dit.
- **Sans framework** ou framework minimal (Preact/Svelte compilé) — pas de dépendance runtime lourde ; SVG inline pour les graphiques comme en v5. Build par script Node (le `build.js` de v5 est joint pour référence de style : minifieur maison, vérifications strictes).
- **Persistance locale** : snapshot par visite pour le diff « ce qui a changé depuis la dernière fois », notes/tags personnels par AA (`Inscrit`, `Mail envoyé`, `Fait, à vérifier` + texte libre), préférences (seuil, langue, campus). Reprendre les clés de v5 si migration triviale.

---

## 5. Fonctionnalités du MVP (les trois à égalité)

### 5.1 Agenda enrichi
Vue semaine/jour à partir de l'ICS. Chaque séance affiche : code + titre, type et phase (`PBL · Phase retour`, `Temps expert`, `Evaluation` = TE), salle, et un bandeau de critères : `n à démontrer ici` (non encore démontrés, évalués par cette unité), `m déjà démontrés`, `k contribue seulement`. Clic → liste des critères avec leur AA, leur compétence, l'état PITCH, et le lien Moodle de l'unité. Filtre « ne montrer que les séances où j'ai quelque chose à démontrer ».

### 5.2 Prochaine chance / alerte rattrapage
Pour chaque critère `lost` ou `fut` : le **prochain événement daté** de l'agenda dont l'unité évalue ce critère ; à défaut, la prochaine unité du syllabus dans un semestre futur (sans date) ; à défaut, **« aucune chance planifiée → requalification »** ⚠. Liste triée par urgence (date la plus proche d'abord, puis requalifications). Regroupable par compétence, par AA, par cours. Export CSV. Les symboles ⚠ (requalification) et ↻ (rattrapage) de v5 sont conservés et **cliquables** vers le détail.

### 5.3 Tableau 70 %
Jauge globale de l'année : critères démontrés / à venir (datés) / à venir (non datés) / perdus, sur le total des critères des AA de l'année courante. Projection « si je démontre tout ce qui est planifié » vs « si je ne rattrape rien ». Même jauge par compétence C01–C13 (lecture alternative du seuil) et par semestre. Toggle 50 %/100 % au niveau AA, toujours avec la lecture alternative affichée en secondaire (« au seuil de 100 % : … »). Ne jamais afficher une seule interprétation comme officielle.

### 5.4 Hérité de v5 (à conserver)
Vue « à rattraper » avec filtres statut/semestre/matière/compétence, recherche, tri, drill-down depuis les graphiques, filtre actif retirable, bouton retour accueil, diff depuis la dernière visite, notes personnelles, export CSV, impression, numéro de version visible.

---

## 6. Design

Reprendre le design system ICAM déjà utilisé (skill `icam-course-page`, v5 de PITCH+) :

```
--orange:#F39200 --orange-soft:#FFF4E3 --orange-line:#FBE3BE --orange-dk:#d97e00
--ink:#202124 --ink-soft:#5f6368 --line:#ececec --bg:#fff --bg-alt:#fafafa --radius:14px
Montserrat 300–700 ; kickers uppercase espacés ; titres légers ; beaucoup de blanc ; ombres quasi nulles.
```

Couleurs sémantiques v5 : requalification `#b03306`/`#FDE7DE`, rattrapage `#a8650a`/`#FFF4E3`, en cours `#5f6368`/`#f1f3f4`, pas commencé `#9aa0a6`/`#fafafa`, validé `#2e7d32`/`#e8f5e9`. Futur = hachures diagonales, jamais coloré.

**Très peu de texte.** Chaque écran doit se comprendre sans lire un paragraphe. Pas de texte explicatif « IA » ; libellés courts, chiffres, symboles. Logo PITCH+ existant conservé (PNG joint). Crédit « Thomas Pitaval », mention « open source », contacts `pitproductionpro@gmail.com`, `thomas.pitaval@2030.icam.fr`, site `pitproduction.com`.

---

## 7. Contraintes, pièges connus, non-objectifs

- **Aucune saisie d'identifiant**, jamais, nulle part. Session existante uniquement.
- **Ne rien écrire dans PITCH.**
- **Ne jamais présenter le planning de requalification envoyé par le campus comme une validation de l'outil** : il est générique, envoyé à tous, non personnalisé. Toute concordance est une coïncidence.
- **Le seuil est une ambiguïté institutionnelle** (50 / 70 / 100) : l'outil expose les lectures, il ne tranche pas.
- **Pas de parsing des mails/PDF de planning de requalification** (rejeté : trop coûteux pour le gain).
- **Écarts entre sources** : 272 AA (PDF 2026-27) / 278 (PITCH, compte de Thomas) / 314 (Excel 2025-26, avec historique). Le code de l'AA est la clé ; loguer les orphelins, ne jamais planter.
- **Fixtures** : ne pas coder contre l'API en direct. Enregistrer des réponses réelles anonymisées de chaque endpoint + un ICS + l'Excel, et tester dessus. Prévoir un mode « démo » avec un jeu de données fictif pour la présentation à l'école.
- **Le « TE »** (test d'évaluation, cf. schéma de Thomas : critères 1–3 en PBL, critère 4 en TE) apparaît comme séance `Exam` dans le syllabus et comme événement `Type : Evaluation` dans Hyperplanning (ex. `Evaluation - EEE EXP7`) : l'étiqueter et le mettre en avant dans l'agenda, sans en faire une catégorie à part dans le modèle.
- **Le flux ICS contient des données personnelles** (nom, date de naissance dans `X-WR-CALNAME`) : ne rien en extraire d'autre que les événements ; les fixtures publiées doivent être anonymisées.
- Versionnage : continuer la numérotation (**v6.0**), afficher la version dans l'app et la page d'installation ; changelog.

---

## 8. Livrables

1. Dépôt structuré : `extension/` (MV3), `data/` (JSON générés + script `build-data` Excel/PDF → JSON), `fixtures/`, `tests/`, `docs/`.
2. Extension installable (zip non signé + instructions « mode développeur ») ; préparer la soumission Chrome Web Store (manifest, icônes, captures, politique de confidentialité : « aucune donnée ne quitte le navigateur »).
3. Page d'installation ultra-courte (héritée de v5, même design).
4. `README` : promesse, garanties de confidentialité, architecture en un schéma, comment régénérer les datasets pour une nouvelle année ou un nouveau programme.
5. Note d'une page pour la direction : problème, solution, ce qu'il faudrait de l'école pour passer à l'échelle (export Excel officiel annuel, éventuellement clé API PITCH).

---

## 9. Ordre de travail recommandé

1. Vérifier la jointure sur données réelles : (a) `CourseCode`/`Title` des séances PITCH contient bien le code d'unité et sous quelle forme ; (b) le flux ICS complet (pas seulement les 77 premiers événements lus ici) s'apparie à ≥ 95 % avec l'Excel après `normUnit` ; (c) compléter la table d'alias. Produire un rapport de couverture avant d'écrire une ligne d'UI.
2. `build-data` : Excel + PDF → JSON, avec statistiques de contrôle (nb unités, critères, orphelins).
3. Porter la couche PITCH de v5 (chargement, `analyse`, `classify`) dans le content script + messaging ; conserver les tests d'équivalence.
4. Parseur ICS + jointure + moteur « prochaine chance ».
5. Les trois écrans, puis l'hérité v5.
6. Fixtures, tests, mode démo, docs, page d'installation, note direction.

À chaque étape : montrer une capture ou un rapport chiffré, pas une description.

---

## 10. Questions à poser à Thomas avant de commencer si elles ne sont pas déjà tranchées

- Excel 2026-2027 disponible ? Sinon, démarrer sur 2025-2026 et prévoir la migration.
- À quel `CROSS_PP<n>` correspond `CROSSDISCIP BOAT` pour un B2 en 2026-2027 (PP5 au S1, PP6 au S2 ?).
- Nom du produit v6 (PITCH+ conservé, ou nouveau nom pour l'école ?).
- Campus ciblé pour les tests (Lille) ; autres campus BI plus tard.

(Le format ICS et la présence du TE comme événement `Evaluation` sont déjà vérifiés, cf. §3.2.)

---

## 11. Fichiers à joindre à ce prompt

| Fichier | Rôle |
|---|---|
| `pitchplus.src.js` | Source lisible de PITCH+ v5.3 : toute la logique PITCH (API, verdicts, graphiques SVG, CSS) |
| `build.js` | Pipeline de build v5 (minifieur maison, vérifications) — référence de rigueur |
| `pitchplus.tpl.html` | Page d'installation v5 (design system) |
| `Mapping_LG_Course BACHELOR 2025-2026.xlsx` | Mapping officiel cours × critères (source principale du dataset) |
| `Syllabus_BI_2026-2027.pdf` | Syllabus complet (métadonnées d'unités, Moodle, séances PBL) |
| logo PITCH+ (PNG) | Identité conservée |
| `Edt_PITAVAL.ics` (téléchargé depuis le lien §3.2, token retiré du nom) | Fixture agenda réelle, **à garder hors dépôt public** (contient nom, date de naissance, groupes) |
| captures PITCH+ v5 | Référence visuelle |
