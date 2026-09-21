# Jointure PITCH ↔ syllabus — vérification sur compte réel

Relevé le 9 septembre 2026 sur le compte de Thomas Pitaval (BI, version de programme `2022`, campus Lille, promotion LIL-B2), en exécutant la couche PITCH de l'extension dans la page `pitch-icam.rima1.fr` déjà connectée. Lecture seule, aucune écriture.

## Ce qui a été vérifié

| Point | Résultat |
|---|---|
| Acquis lus (`/api/LearningGoal`) | 278 |
| Critères lus (`/api/locdetail`) | 1 221 |
| Séances de critères (`CourseList`) | 2 145 |
| **`CourseCode` → code d'unité du syllabus** | **2 136 / 2 145 = 99,6 %** |
| **`TraitCode` → code de critère du syllabus** | **1 221 / 1 221 = 100 %** |
| Critères du syllabus jamais vus dans PITCH | 120 |
| Durée de la lecture complète | 50 s (36 s pour les acquis, 14 s pour les critères) |

## Correction apportée (v6.0.1)

`TraitCode` n'est **pas** le code de critère nu : c'est une clé composite `RA-…-AA-…-CRIT_xxxx`.

```
RA-EEE-C01-1-AA-EEE-C01-1-01-CRIT_0001      →  CRIT_0001
RA-ESE-C09-2-AA-ESE-C09-2-02-CRIT_CM_1003   →  CRIT_CM_1003
RA-HUM-C06-1-AA-HUM-C06-1-01-CRIT_0274-NM   →  CRIT_0274-NM
```

`critCode()` dans `extension/lib/pitch.js` extrait le suffixe. Sans cette correction, aucun critère de PITCH ne s'appariait au syllabus. Couvert par un test (`tests/pitch.test.js`), et le générateur de démo produit désormais des `TraitCode` composites comme le vrai PITCH.

`CourseCode`, en revanche, est exactement le code d'unité du syllabus (`EEE_EXP7`, `CROSS_MME-ESE_EXP1`, `CROSS_PP2env`) : aucune normalisation n'est nécessaire de ce côté. Seule exception relevée : `MIA_EXP8` (9 séances), unité présente dans la version de programme 2022 de PITCH mais absente du mapping 2025-2026 et du syllabus 2026-2027. Elle est signalée dans l'onglet Diagnostic, elle ne fait pas planter.

## État réel du compte (9 septembre 2026, semestre courant B2.3)

| | Critères |
|---|---|
| Démontrés | 502 |
| Chance datée dans l'agenda Hyperplanning | 196 |
| Séance à venir, sans date (semestre ultérieur) | 399 |
| Aucune séance → requalification | 124 |
| **Total** | **1 221** |

Les 196 chances datées sont l'apport propre de PITCH+ : PITCH sait qu'une séance existe, il n'en donne jamais la date ni le cours. Répartition sur les cours du semestre : `CROSS_PP5` 37, `MME_EXP7` 21, `ESE_EXP3` 16, `MME_EXP14` 15, `MME_PBL11` 15, `EEE_EXP7` 13, `MIA_PBL9` 10, `EEE_EXP2` 9, `EEE_PBL6` 9, `MEO_PBL9` 8, `HUM_PBL4` 7, `MEO_PBL8` 7, `MEO_EXP5` 6, `MME_LAB5` 5, `HUM_EXP12` 4, `ESE_PBL9` 4, `CROSS_MME-EEE_LAB1` 4, `MIA_PBL5` 4, `MEO_PP5` 2.

## Contrôle croisé des requalifications

Les 124 critères que PITCH donne sans aucune séance ont été repassés au moteur avec le syllabus et l'agenda réel : 123 restent sans aucune chance (leurs cours sont tous dans des semestres passés), 1 seul retrouve un cours dans un semestre à venir. Les deux sources sont donc cohérentes sur le diagnostic de requalification ; ce que PITCH+ ajoute, ce sont les dates, le cours et le libellé exact du critère manquant.

Rappel : ce chiffre est une déduction, jamais une décision officielle. Le planning de requalification envoyé par le campus n'est pas lu par l'outil.
